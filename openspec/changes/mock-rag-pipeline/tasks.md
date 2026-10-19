# Tasks

## 1. 타입과 환경 준비

- [x] 1.1 Next 16 Route Handler 문서(`node_modules/next/dist/docs/01-app/`)를 확인하고, `.env.local` 에 `USE_MOCK=true`, `ANTHROPIC_API_KEY` 를 설정(커밋 금지)한 뒤 `git status` 에 `.env.local` 이 나타나지 않는 것으로 확인
- [x] 1.2 `src/lib/types.ts` 에 `SourceReview.date?: string`, `ChatResponse.mode?: DataMode`, `IndexResponse.mode?: DataMode` 를 추가하고 `npx tsc --noEmit` 이 통과하는 것으로 확인

## 2. Mock 리뷰 저장소 (`src/lib/review-store.ts`)

- [x] 2.1 `fs.readFile` + `papaparse`(`header: true`, `skipEmptyLines`)로 CSV 를 파싱해 `globalThis` 캐시에 적재하는 `indexMockReviews()` 를 구현(숫자·boolean 변환, 무효 행 제외, 적재 Promise 캐싱). 검증: 임시 스크립트로 두 번 호출해 둘 다 `100` 을 반환
- [x] 2.2 키워드 추출(구두점·조사 제거, 2글자 이상, 중복 제거)과 `searchMockReviews(query, topK = 5)` 를 구현(제목 가중 매칭 + `helpful_votes` 조합, `[0.65, 0.98]` 정규화, 결정적 정렬, 무매칭 시 도움됨 상위 K건, 미적재 시 자동 적재). 검증: 임시 스크립트로 다음을 확인 — "배터리가 오래가나요?" 가 "배터리" 로 매칭, 결과 점수가 모두 0.65~0.98 이며 내림차순, 매칭 없는 질문("zzzz 가나다라마")과 한 글자 질문("a ?")이 기본 5건을 반환, 매칭이 K건 미만인 질문은 무관한 리뷰로 채우지 않음
- [x] 2.3 `saveMockMessage(chatId, message)` / `getMockMessages(chatId)` 를 구현(chatId 별 배열, 순서 보존, 기본 chatId). 검증: 임시 스크립트로 두 chatId 에 저장 후 조회해 서로 섞이지 않고 순서가 유지되는 것을 확인
- [x] 2.4 `RetrievedReview` 타입(`id, title, content, rating, author, date, score`)을 export 하고 `npx tsc --noEmit` 및 `npm run lint` 통과를 확인

## 3. 인덱싱 API (`src/app/api/index-data/route.ts`)

- [x] 3.1 `POST` 핸들러 구현: Mock 모드면 `indexMockReviews()` 호출 후 `{ success: true, mode: 'mock', data: { indexed } }`, 실데이터 모드면 501 + `{ success: false, error }`, 예외 시 로그만 남기고 500 + 사용자용 `error`. 검증: `npm run dev` 후 `curl -X POST /api/index-data` 가 `indexed: 100` 을 반환하고, `USE_MOCK=false` 로 재기동했을 때 501 이 반환되며, CSV 파일명을 잠시 바꿨을 때 500 이 반환되고 `error` 에 경로가 없는 것을 확인

## 4. Chat API (`src/app/api/chat/route.ts`)

- [x] 4.1 요청 검증(JSON 파싱 실패·`query` 비문자열/공백 → 400), `USE_MOCK` 분기(실데이터 → 501), 실데이터 모드 501 뼈대를 구현. 검증: `curl` 로 빈 `query`, 깨진 JSON 이 400, `USE_MOCK=false` 가 501 이고 응답 형식이 `{ success: false, error }` 인지 확인
- [x] 4.2 `[리뷰 N] ★{rating} {title} — {content} (작성자: {author})` 형식의 context 조립과 LCEL 체인(`ChatPromptTemplate.fromMessages([...]).pipe(new ChatAnthropic({ model: 'claude-haiku-4-5', apiKey: process.env.ANTHROPIC_API_KEY })).pipe(new StringOutputParser())`)을 구현. 시스템 프롬프트는 요청 문구를 그대로 사용하고 context 는 입력 변수로 전달. `SKIP_GENERATION=true`(또는 키 없음)이면 모델 호출 없이 `answer` 에 `{ query, sources }` JSON 을 담는다. 검증: "노이즈 캔슬링 성능은 어떤가요?" 를 UTF-8 본문으로 `curl` 하여 `success: true`, `mode: 'mock'`, 비어 있지 않은 `answer`, 5건 이하 `sources` 의 각 항목에 `id, title, content, rating, author, date, score` 가 있는 것을 확인
- [ ] 4.3 성공 시 `saveMockMessage` 로 사용자·AI 메시지를 저장하고, 모델 오류 시 저장하지 않으며 `error` 에 키·스택이 없는 500 을 반환하도록 구현. 검증(키가 준비된 뒤): 잘못된 키로 `SKIP_GENERATION` 없이 호출했을 때 500 이고 응답 본문에 키 문자열이 없는 것, 성공 호출 후 `getMockMessages` 에 2건이 쌓이는 것(임시 로그 또는 스크립트)을 확인. 관련 없는 질문("zzzz")에서도 기본 리뷰로 답변이 생성되는 것까지 확인
- [x] 4.4 `npx tsc --noEmit`, `npm run lint` 통과를 확인

## 5. 프론트엔드 연결

- [x] 5.1 `src/lib/http-chat-api.ts` 에 `ChatApi` 를 구현하는 `httpChatApi`(질문은 `chatId` 포함 POST `/api/chat`, 인덱싱은 POST `/api/index-data`, 에러 상태여도 규격 JSON 본문은 그대로 반환)를 추가하고 `tsc` 통과를 확인
- [x] 5.2 `Dashboard.tsx` 의 `api` 를 `httpChatApi` 로 교체하고 세션당 한 번 생성되는 `chatId` 를 주입(클라이언트에서만 생성). 검증: `npm run dev` 후 브라우저(Playwright)에서 [샘플 데이터 인덱싱] 클릭 시 "100" 건 완료 표시, 질문 전송 시 "분석 중" → 답변과 참고 리뷰 아코디언 표시, 한글 IME 조합 중 Enter 가 전송되지 않는 기존 동작 유지를 확인
- [x] 5.3 오류 경로 확인: 서버를 중지한 상태에서 질문하면 오류 메시지가 AI 메시지로 표시되고 입력창이 다시 활성화되며, 서버를 중지한 상태에서 인덱싱하면 오류 문구와 재시도 가능 상태가 되는지 확인

## 6. 통합 확인

- [x] 6.1 `npm run lint`, `npx tsc --noEmit`, `npm run build` 가 모두 통과하는지 확인
- [ ] 6.2 Playwright 로 인덱싱 없이 바로 질문(자동 적재), 인덱싱 후 질문 2회 연속, 관련 없는 질문 시나리오를 실행해 스크린샷과 함께 spec 시나리오(`mock-review-retrieval`, `review-indexing-api`, `rag-chat-api`)가 충족되는지 확인
- [x] 6.3 `.env.local` 과 `.playwright-mcp/` 가 커밋 대상에 포함되지 않았는지 `git status` 로 확인

## Workflow follow-up

- 구현 커밋은 Conventional Commits(`feat:`) 한국어 메시지로 작성한다.
- 검증 후 `/opsx:archive` 로 변경을 아카이브하고 main spec 동기화를 확인한다.
