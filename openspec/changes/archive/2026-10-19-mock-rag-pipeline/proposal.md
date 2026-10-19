# Proposal

## Why

대시보드 UI(`review-dashboard-ui`)는 고정된 Mock 응답(`mock-chat-api.ts`)으로만 동작하고 서버 API 가 없다. 외부 인프라(Pinecone/Supabase) 가입 없이도 실제 리뷰 데이터 검색과 LLM 답변 생성이 끝까지 이어지는 RAG 파이프라인을 먼저 완성해야, 이후 4단계에서 `USE_MOCK=false` 전환만으로 실데이터 모드로 확장할 수 있다.

## What Changes

- `samples/review.csv`(100건)를 읽어 메모리에 캐싱하고, 토큰 매칭 + `helpful_votes` 기반으로 상위 K건을 검색하는 로컬 Mock 저장소 추가. 대화 기록은 서버 인메모리 배열에 저장/조회.
- `POST /api/index-data`: Mock 모드에서 CSV 를 적재하고 적재 건수를 반환.
- `POST /api/chat`: 질문으로 상위 5건을 검색해 context 를 만들고, LangChain LCEL 체인(`ChatPromptTemplate` → `ChatAnthropic(claude-haiku-4-5)` → `StringOutputParser`)으로 답변과 참고 리뷰(`sources`)를 반환.
- 데이터 접근을 `review-store` 모듈의 함수로 분리하여, 이후 Pinecone/Supabase 구현으로 교체할 경계를 만든다.
- 프론트엔드의 `ChatApi` 구현을 고정 Mock 에서 `fetch('/api/...')` 기반으로 교체하여 [샘플 데이터 인덱싱] 버튼과 채팅 입력창을 두 API 에 연결.
- `SourceReview` 응답 타입에 `date` 필드를 추가(선택 필드, 기존 UI 호환).

범위 밖: Pinecone/Supabase 실연동(`USE_MOCK=false` 경로), 스트리밍 응답, 대화 기록의 영속화 및 UI 노출, 대화 히스토리를 프롬프트에 반영하는 멀티턴 맥락, 테스트 러너 도입.

## Capabilities

### New Capabilities
- `mock-review-retrieval`: CSV 기반 리뷰 적재, 키워드·도움됨 수 기반 상위 K건 검색(정규화된 점수), 대화 메시지 인메모리 저장/조회 동작.
- `review-indexing-api`: 샘플 데이터 인덱싱 요청을 받아 모드에 따라 적재 결과(`indexed` 건수)를 표준 응답 규격으로 반환하는 서버 동작.
- `rag-chat-api`: 질문을 받아 검색된 리뷰만을 근거로 답변을 생성하고 참고 리뷰와 함께 표준 응답 규격으로 반환하는 서버 동작.

### Modified Capabilities
<!-- 기존 chat-interface / dashboard-sidebar 의 요구사항(응답 규격 호환, 인덱싱 상태 표시)은 그대로 유지된다. 실제 API 연결은 구현 세부 변경이다. -->

## Impact

- 신규 코드: `src/lib/review-store.ts`, `src/app/api/index-data/route.ts`, `src/app/api/chat/route.ts`, 실제 API 를 호출하는 `ChatApi` 구현(`src/lib/http-chat-api.ts` 예정).
- 수정 코드: `src/lib/types.ts`(`SourceReview.date`, 응답 `mode`), `src/components/dashboard/Dashboard.tsx`(API 구현 교체), 필요 시 `src/lib/mock-chat-api.ts` 정리.
- 의존성: `@langchain/anthropic`, `@langchain/core`, `papaparse`, `@types/papaparse`(이미 설치됨).
- 환경변수: `USE_MOCK`, `ANTHROPIC_API_KEY`(`.env.local`, 커밋 금지).
- 외부 호출: Anthropic API(`claude-haiku-4-5`). 키가 없으면 `/api/chat` 은 오류 응답을 반환한다.
