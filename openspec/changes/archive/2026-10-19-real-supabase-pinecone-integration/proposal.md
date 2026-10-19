# Proposal

## Why

현재 `USE_MOCK=false` 로 `/api/index-data` 와 `/api/chat` 을 호출하면 둘 다 501 을 반환한다. 리뷰와 대화 기록이 서버 메모리에만 있어 재시작하면 사라지고, 검색도 키워드 매칭에 그쳐 의미 기반 검색이 되지 않는다. Pinecone 통합 임베딩 인덱스와 Supabase 환경이 이미 준비되었으므로 실데이터 모드를 구현한다.

## What Changes

- `USE_MOCK === 'false'` 일 때 `POST /api/index-data` 가 `samples/review.csv` 를 파싱해 다음 두 곳에 적재한다.
  - Supabase `reviews` 테이블에 `id` 기준으로 upsert 한다.
  - Pinecone `reviews` 네임스페이스에 `namespace.upsertRecords()` 로 96건 이하씩 순차 적재한다. 레코드는 `{ _id, text, rating, author, title, content }` 이고 `text` 는 `"${title} ${content}"` 이다.
- `USE_MOCK === 'false'` 일 때 `POST /api/chat` 이 `namespace.searchRecords()` 로 상위 5건을 검색하고, 기존과 같은 프롬프트로 답변을 생성하며, 질문과 답변을 Supabase `messages` 테이블에 저장한다.
- 응답 규격은 Mock 모드와 같은 필드를 유지하고 `mode` 만 `'real'` 로 반환한다. 프론트엔드 변경은 없다.
- 두 라우트의 "실데이터 모드 미지원(501)" 요구사항을 제거한다.
- Mock 모드(`USE_MOCK !== 'false'`)의 동작은 그대로 유지한다.
- Supabase `reviews` / `messages` 테이블을 만드는 마이그레이션 SQL 을 추가한다.
- 금지 사항을 지킨다: `PineconeStore`, `OpenAIEmbeddings` 등 외부 임베딩 라이브러리는 쓰지 않고 `@pinecone-database/pinecone` SDK 를 직접 호출한다.

## Capabilities

### New Capabilities
- `real-data-backend`: 실데이터 모드의 저장과 검색을 정의한다. Supabase 리뷰·메시지 영속화, Pinecone 통합 임베딩 적재·검색, 환경변수와 클라이언트 구성이 여기에 속한다.

### Modified Capabilities
- `review-indexing-api`: "실데이터 모드 미지원 응답" 요구사항을 "실데이터 모드 인덱싱" 으로 교체한다. 응답은 `mode: 'real'` 이고, 실패 시 오류 상세를 노출하지 않는다.
- `rag-chat-api`: "실데이터 모드 미지원 응답" 요구사항을 실데이터 검색·저장 요구사항으로 교체하고, 성공 응답의 `mode` 가 모드에 따라 `'mock'` 또는 `'real'` 이 되도록 한다.

## Impact

- 코드: `src/app/api/index-data/route.ts`, `src/app/api/chat/route.ts`, 신규 `src/lib/real-store.ts`(Pinecone·Supabase 접근 계층), `src/lib/review-store.ts`(CSV 파싱 재사용을 위한 export 정리).
- DB: Supabase `reviews`, `messages` 테이블을 추가한다(`supabase/migrations/`).
- 의존성: 추가 없음. `@pinecone-database/pinecone`, `@supabase/supabase-js` 는 이미 설치되어 있다.
- 환경변수: `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_HOST`, `NEXT_PUBLIC_SUPABASE_URL` 은 사용한다. 현재 `.env.local` 의 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 는 `CLAUDE.md` 가 정한 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? NEXT_PUBLIC_SUPABASE_ANON_KEY` 와 이름이 달라, 키 이름을 맞추는 작업이 필요하다.
- 범위 밖: 프론트엔드 변경, 벡터 삭제·재색인 정책, 대화 기록 조회 API, Vercel 배포.
