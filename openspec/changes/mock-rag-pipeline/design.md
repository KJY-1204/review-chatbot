# Design

## Context

- 동기와 범위는 `proposal.md` 참고. 현재 `src/app/api` 는 없고, 화면은 `ChatApi` 인터페이스(`sendQuestion`, `indexSamples`)와 `mockChatApi`(고정 응답)로만 데이터에 접근한다. `Dashboard.tsx` 의 `const api = mockChatApi` 한 줄이 교체 지점이다.
- `samples/review.csv` 컬럼: `id, rating, title, content, author, date, helpful_votes, verified_purchase` (100건, 이어폰 한 종류). `content` 에 쉼표가 들어 있어 CSV 파서(`papaparse`)가 필요하다.
- Next.js 16 은 이전 버전과 API 가 다를 수 있다(`AGENTS.md`). Route Handler 작성 전에 `node_modules/next/dist/docs/01-app/` 의 route handler 문서를 확인한다.
- `.env*` 는 gitignore 대상이다. `ANTHROPIC_API_KEY` 는 `.env.local` 로 주입한다.
- 프로젝트에 테스트 러너가 없다(이전 변경과 동일한 제약).

## Goals / Non-Goals

**Goals:**
- 외부 서비스 가입 없이 `npm run dev` + `ANTHROPIC_API_KEY` 만으로 인덱싱 → 질문 → 답변 + 참고 리뷰가 끝까지 동작한다.
- 라우트 핸들러가 모드별 데이터 구현을 직접 알지 않고 `review-store` 의 함수 시그니처에만 의존하여, 4단계에서 구현만 교체할 수 있다.
- 프론트엔드 컴포넌트와 훅은 수정하지 않는다(`ChatApi` 구현만 교체).

**Non-Goals:**
- Pinecone/Supabase 구현, 스트리밍, 대화 기록 영속화·UI 노출, 멀티턴 맥락 주입, 한국어 형태소 분석, 임베딩.

## Decisions

### 1. `review-store.ts` 는 모드 중립 함수 시그니처 + Mock 구현
`src/lib/review-store.ts` 에 `indexMockReviews(): Promise<number>`, `searchMockReviews(query, topK = 5): Promise<RetrievedReview[]>`, `saveMockMessage(chatId, message)`, `getMockMessages(chatId)` 를 둔다(요청한 이름 그대로). 라우트는 `USE_MOCK !== 'false'` 분기에서 이 함수를 호출하고, 실데이터 분기는 이번에는 501 을 반환한다. 4단계에서는 같은 반환 타입(`RetrievedReview`)을 가진 `indexReviews`/`searchReviews` 를 추가하고 분기만 바꾸면 된다.
- 대안: 지금 `ReviewStore` 인터페이스 + 팩토리를 만든다 → 구현체가 하나뿐인 추상화라 YAGNI. 반환 타입과 함수 경계만 고정하는 것으로 충분하다.
- 반환 타입 `RetrievedReview` 는 `SourceReview` 와 같은 필드(`id, title, content, rating, author, date, score`)로 정의해 라우트가 변환 없이 `sources` 로 내보낸다.

### 2. 캐시는 모듈 스코프 + `globalThis` 보관
CSV 파싱 결과와 메시지 배열을 `globalThis` 의 키에 저장한다. Next dev 의 HMR/라우트별 번들 분리로 모듈이 여러 번 평가되어도 `/api/index-data` 와 `/api/chat` 이 같은 저장소를 보게 하기 위함이다. 적재는 idempotent 하게 "전체 교체"로 처리해 중복 저장을 막는다. 검색 시 아직 적재 전이면 먼저 `indexMockReviews()` 를 호출한다(spec: 검색 전 자동 적재). 동시 호출에 대비해 적재 Promise 를 캐싱한다.
- 대안: 모듈 변수만 사용 → dev 서버에서 라우트 간 저장소가 분리될 수 있어 기각.
- 서버리스(Vercel) 배포에서는 인스턴스마다 메모리가 달라지지만, Mock 모드는 로컬 용도이고 영속화는 4단계 범위이다.

### 3. CSV 읽기: `fs.readFile` + `papaparse` (`header: true, skipEmptyLines: true`)
경로는 `path.join(process.cwd(), 'samples', 'review.csv')`. 숫자 컬럼(`rating`, `helpful_votes`)은 `Number()` 로 변환하고, 숫자가 아니거나 `id`/`content` 가 비어 있는 행은 건너뛴다. `verified_purchase` 는 `'true'` 문자열 비교로 boolean 변환한다. 파싱 `errors` 가 있어도 유효 행이 있으면 진행하고, 파일이 없으면 예외를 던져 라우트가 500 으로 처리한다.
- `fs` 를 쓰므로 Node 런타임이 필요하지만 기본값이 Node 이다. 이 프로젝트는 `cacheComponents` 가 켜져 있어 `export const runtime` 세그먼트 설정을 쓰면 오류가 나므로(구현 중 확인) 선언하지 않는다.

### 4. 검색 점수 알고리즘
1. **토큰화**: 공백·구두점(`[\s.,!?~"'()[\]{}:;/\\]+`)으로 분할 → 소문자화 → 한국어 조사 접미사 제거(`은|는|이|가|을|를|도|의|에|에서|으로|로|와|과|이나|나요|인가요|했나요|한가요|어때요|있나요` 등 길이순 정렬한 소규모 목록, 제거 후 2글자 이상 남을 때만 적용) → 길이 2 미만 제거 → 중복 제거. 형태소 분석기는 도입하지 않는다.
2. **원점수**: 각 키워드에 대해 `title` 매칭 횟수 × 2 + `content` 매칭 횟수(부분 문자열 포함 횟수)를 합산 = `matchScore`. `matchScore === 0` 인 리뷰는 후보에서 제외.
3. **조합**: `raw = matchScore + 0.1 × helpful_votes`. 도움됨 수는 동점 처리와 보정용으로만 작용하며(최대 56 → +5.6), 키워드가 하나도 없는 리뷰는 도움됨 수만으로 후보가 되지 않는다.
4. **정규화**: 후보 집합의 `raw` 최소/최대를 `[0.65, 0.98]` 로 선형 매핑하고, 후보가 하나이거나 최대=최소이면 `0.98`(매핑 불가 시 상단값)을 부여한다. 정렬은 `raw` 내림차순, 동점이면 `helpful_votes` 내림차순, 다음으로 `id` 오름차순(결정적 순서).
5. **기본 결과**: 후보가 0건(키워드 없음/무매칭)이면 `helpful_votes` 내림차순 상위 K건을 같은 방식으로 정규화해 반환한다.
- 이유: 요구된 "횟수 + helpful_votes 조합, 0.65~0.98 정규화"를 만족하면서 결정적이라 수동 검증이 쉽다. 가중치(`×2`, `0.1`)는 상수로 분리해 조정 가능하게 한다.
- 정규화 기준이 후보 집합 상대값이라 점수는 "질문 간 비교 가능한 유사도"가 아니다. 참고용 표시값이며 Pinecone 점수(cosine)와 의미가 다르다는 점은 4단계에서 인지한다.

### 5. Chat 라우트: LCEL 체인과 context 조립
```
const chain = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT + "\n\n[실제 구매 고객 리뷰 데이터]\n{context}"],
  ["human", "{question}"],
]).pipe(model).pipe(new StringOutputParser());
```
- 시스템 프롬프트는 요청서의 문구를 그대로 사용한다. 리뷰 본문에 `{`/`}` 가 포함되어도 템플릿 변수로 해석되지 않도록, context 는 템플릿 문자열에 직접 보간하지 않고 **입력 변수 `{context}`** 로 전달한다(값은 재해석되지 않는다).
- 모델: `new ChatAnthropic({ model: 'claude-haiku-4-5', apiKey: process.env.ANTHROPIC_API_KEY })` (날짜 suffix 금지). 모델 인스턴스는 요청 시점에 생성해 키 누락을 명시적으로 처리한다.
- context 형식: `[리뷰 N] ★{rating} {title} — {content} (작성자: {author})` 를 줄바꿈으로 연결.
- 흐름: 입력 검증 → `USE_MOCK` 분기 → 검색 → 체인 `invoke` → 대화 기록 저장 → 응답. `sources` 는 검색 결과를 그대로 사용한다.
- 키가 없거나 `SKIP_GENERATION=true` 이면 모델을 호출하지 않고 `answer` 에 `{ query, sources }` JSON 문자열을 담아 성공 응답한다(키가 아직 없는 개발 단계용, 채팅창은 `answer` 를 그대로 표시). 키가 있고 생략 플래그가 없을 때만 모델을 호출하며 실패 시 500 이다. `.env.local` 의 키 값이 자리표시자여도 호출을 막을 수 있도록 별도 플래그를 둔다.
- 대안: `RunnableSequence.from([...])` → `.pipe()` 가 요청서 명세와 같아 기각.

### 6. 응답 규격과 오류 처리
모든 응답은 `NextResponse.json` 으로 `{ success, ... }` 를 반환한다. 성공은 `mode: 'mock'` 을 포함한다(요청서 규격). 오류는 사용자용 한국어 문구만 담고, 서버 콘솔에만 `console.error` 로 원인을 기록한다(키·경로 비노출). 상태 코드: 400(입력 오류), 500(적재/생성 실패), 501(실데이터 모드 미구현). `types.ts` 의 `ChatResponse`/`IndexResponse` 에는 선택 필드 `mode?: DataMode` 를 추가하고, `SourceReview` 에는 `date?: string` 을 추가한다(UI 는 `mode` 를 사용하지 않으므로 기존 화면과 호환).

### 7. 프론트엔드 연결: `http-chat-api.ts`
`ChatApi` 를 구현하는 `httpChatApi` 를 추가한다. `fetch('/api/chat', { method: 'POST', body: { query } })` 와 `fetch('/api/index-data', { method: 'POST' })` 를 호출하고, 응답 JSON 을 그대로 반환한다. HTTP 상태가 에러여도 본문이 규격 JSON 이면 그대로 전달하여 서버의 `error` 문구가 화면에 표시되게 하고, JSON 파싱 실패/네트워크 오류는 훅의 `catch` 가 기본 문구로 처리한다. `chatId` 는 `Dashboard` 에서 세션당 한 번 생성한 값(`crypto.randomUUID()` 를 `useState` 초기화 함수로 생성)을 `httpChatApi` 생성 시 주입한다(서버 렌더/하이드레이션 불일치를 피하려고 클라이언트에서만 사용).
- `Dashboard.tsx` 의 `api` 선택을 `mockChatApi` → `httpChatApi` 로 교체한다. `mockChatApi`/`mock-data.ts` 는 UI 시연·오류 시나리오용으로 남겨 두되 더 이상 기본값이 아니다. 삭제 여부는 4단계에서 판단한다.
- 대안: 서버 컴포넌트에서 Server Action 사용 → 요청서가 REST 라우트(`/api/...`)를 명시하고 CLAUDE.md 가 `route.ts` 규격을 요구하므로 기각.

## Risks / Trade-offs

- **조사 제거가 불완전해 매칭 누락** → 부분 문자열 매칭이라 "배터리가" 같은 형태는 조사 제거 후 "배터리"로 매칭된다. 어간 변화(예: "오래가나요")는 놓칠 수 있으며, 이 경우 기본 결과(도움됨 상위 5건)로 폴백하므로 답변은 항상 생성된다. 한계로 수용하고 4단계에서 벡터 검색이 대체한다.
- **기본 결과가 질문과 무관할 수 있음** → 시스템 프롬프트가 "리뷰에 없는 사실을 지어내지 말라"고 지시하므로 모델이 근거 부족을 답하도록 유도한다. `sources` 에는 실제로 사용한 리뷰가 그대로 표시되어 사용자가 근거를 확인할 수 있다.
- **프롬프트 인젝션(리뷰 본문에 지시문이 있을 수 있음)** → 리뷰는 시스템 프롬프트 내 데이터 구역(`[실제 구매 고객 리뷰 데이터]`)에 넣고, 출력은 텍스트로만 사용한다(도구 호출 없음). 샘플 데이터는 신뢰 가능하지만 실데이터 모드에서는 재검토가 필요하다.
- **API 키 노출** → 서버 라우트에서만 `process.env.ANTHROPIC_API_KEY` 를 읽고 `NEXT_PUBLIC_` 접두사를 쓰지 않으며, 오류 응답에 키나 원본 예외 메시지를 싣지 않는다.
- **인메모리 상태의 휘발성** → 서버 재시작/HMR 시 사라지지만 검색 시 자동 적재하므로 기능에는 영향이 없고, 대화 기록은 UI 에서 읽지 않는다.
- **자동 테스트 부재** → 검색 로직이 순수 함수 성격이므로 구현 시 `tsx` 등으로 실행하는 스크립트 또는 `curl`/Playwright 로 시나리오를 검증하고(tasks 에 명시), 테스트 러너 도입은 별도 변경으로 제안한다.
- **LLM 호출 비용/지연** → 요청당 1회 호출, 컨텍스트는 5건 리뷰로 제한되어 작다. 스트리밍은 범위 밖이므로 응답이 끝날 때까지 "분석 중" 표시가 유지된다.
