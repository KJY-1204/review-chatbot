# Design

## Context

- `/api/index-data` 와 `/api/chat` 은 `USE_MOCK === 'false'` 일 때 501 을 반환한다(`src/app/api/*/route.ts`). Mock 경로는 `src/lib/review-store.ts` 의 인메모리 저장소와 키워드 검색을 쓴다.
- `review-store.ts` 는 CSV 를 파싱하는 `parseReviews` 를 갖고 있지만 export 하지 않는다. 실데이터 모드도 같은 `samples/review.csv` 를 쓰므로 파싱을 재사용해야 한다.
- 프론트엔드는 `ChatResponse` / `IndexResponse` (`src/lib/types.ts`) 만 알고, 이미 `mode: 'mock' | 'real'` 필드가 있다. UI 변경은 필요 없다.
- `@pinecone-database/pinecone@^9`, `@supabase/supabase-js` 는 이미 설치되어 있다.
- Pinecone 인덱스는 통합 임베딩 인덱스(`llama-text-embed-v2`)라 클라이언트 측 임베딩이 없다. `CLAUDE.md` 가 `PineconeStore`, `OpenAIEmbeddings` 를 금지한다.
- 현재 `.env.local` 의 Supabase 키 이름은 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 로, `CLAUDE.md` 의 fallback 규칙(`..._PUBLISHABLE_DEFAULT_KEY ?? ..._ANON_KEY`)과 다르다.

## Goals / Non-Goals

**Goals:**
- 실데이터 모드에서 인덱싱(Supabase upsert + Pinecone upsertRecords)과 질문(Pinecone searchRecords + 생성 + Supabase 메시지 저장)을 동작시킨다.
- 두 모드의 응답 규격을 같게 유지하고 Mock 동작은 건드리지 않는다.

**Non-Goals:**
- 프론트엔드 변경, 대화 기록 조회 API, 벡터 삭제·재색인 정책, 사용자 인증과 RLS 기반 멀티테넌시, Vercel 배포.

## Decisions

1. **실데이터 접근 계층을 `src/lib/real-store.ts` 한 파일로 모은다.** 라우트에는 `if (USE_MOCK === 'false')` 분기와 호출만 둔다.
   - `indexRealReviews()`, `searchRealReviews(query, topK)`, `saveRealMessage(chatId, message)` 를 export 하고, 반환 타입은 Mock 과 같은 `RetrievedReview` 로 맞춘다. 이렇게 하면 프롬프트 조립과 응답 구성 코드를 두 모드가 공유한다.
   - 대안: 모드별로 라우트를 나누기. 프롬프트·검증 코드가 중복되어 채택하지 않는다.

2. **Pinecone 은 SDK 를 직접 호출한다.** `new Pinecone({ apiKey }).index(name, host).namespace('reviews')` 후 `upsertRecords` / `searchRecords` 를 쓴다. 검색은 `{ query: { topK: 5, inputs: { text } }, fields: ['title','content','rating','author'] }` 이고 결과는 `res.result.hits[]` 의 `_id` / `_score` / `fields` 에서 읽는다. 클라이언트는 요청마다 만들지 않고 모듈 단위로 지연 생성한다.

3. **적재 순서는 Supabase → Pinecone.** Supabase 가 원본(source of truth)이고 Pinecone 은 파생 인덱스이므로, Supabase 가 실패하면 Pinecone 을 건드리지 않는다. 둘 다 `id` 기준 upsert 라 실패 후 재시도해도 안전하다(멱등).

4. **Pinecone 배치는 96건씩 순차 `await`.** 통합 임베딩 인덱스의 요청당 레코드 한도(96)를 지키고 속도 제한을 피한다. `Promise.all` 병렬 처리는 하지 않는다. `indexed` 는 성공적으로 적재한 레코드 수이다.

5. **`date` 보강.** Pinecone 레코드에는 `date` 를 넣지 않는다(요구된 레코드 형태 고정). 검색 후 hit 의 `_id` 목록으로 Supabase `reviews` 를 `in` 조회해 `date` 를 채운다. 이 조회가 실패하면 `date` 없이 진행한다(검색 자체는 성공). 점수는 Pinecone `_score` 를 그대로 쓴다.

6. **메시지 테이블.** `messages(id bigint identity, chat_id text, role text check in ('user','assistant'), content text, created_at timestamptz default now())` 를 만들고 `(chat_id, created_at)` 인덱스를 둔다. `reviews(id text pk, rating int, title, content, author, date date, helpful_votes int, verified_purchase bool)` 를 만든다. 마이그레이션은 `supabase/migrations/` 에 SQL 로 둔다. 질문과 답변은 한 번의 insert(배열)로 저장해 순서를 보장한다. 메시지 저장 실패는 이미 생성한 답변을 막지 않고 로그만 남긴다.

7. **Supabase 접근 키와 RLS.** 서버 라우트에서 공개(publishable) 키로 접근하므로 두 테이블에 RLS 를 켜고 `anon` 역할에 `reviews` upsert, `messages` insert, `reviews` select 만 허용하는 정책을 둔다. 인증이 없는 실습 앱이라는 점을 감안한 최소 권한 정책이다. 서비스 롤 키는 이 변경에서 도입하지 않는다(CLAUDE.md 에 정의된 키가 아님). 키 이름은 `CLAUDE.md` 규칙대로 fallback 으로 읽고, `.env.local` 의 기존 이름은 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 로 맞춘다.

8. **오류 처리.** 환경변수 누락은 외부 호출 전에 검사하고, 라우트는 상세를 `console.error` 로만 남기고 사용자용 고정 문구를 반환한다. 이는 기존 Mock 경로의 처리 방식과 같다.

9. **CSV 파싱 재사용.** `review-store.ts` 의 `parseReviews` 와 CSV 경로 읽기를 export 해 `real-store.ts` 가 가져다 쓴다. Mock 동작은 바뀌지 않는다.

## Risks / Trade-offs

- **Pinecone 의 최종 일관성**: upsert 직후 검색에서 일부 레코드가 보이지 않을 수 있다. 인덱싱 직후 첫 질문의 결과가 적을 수 있으며, 수 초 뒤 해소된다. 문서화만 하고 대기 로직은 넣지 않는다.
- **부분 실패**: Pinecone 배치 중간 실패 시 일부만 적재된 상태가 된다. upsert 가 멱등이므로 다시 인덱싱하면 복구된다.
- **anon 쓰기 권한**: 공개 키로 쓰기를 허용하는 정책은 실습용 타협이다. 배포 단계에서 서비스 롤 키 + 서버 전용 접근으로 바꾸는 것을 후속 과제로 남긴다.
- **환경변수 이름 불일치**: `.env.local` 을 수정하지 않으면 실데이터 모드가 설정 누락으로 실패한다. 구현 첫 단계에서 이름을 맞춘다.
- **임베딩 대상 텍스트**: `title + content` 한 필드라서 평점·작성자 조건 질의("5점 리뷰만")는 의미 검색으로 처리되지 않는다. 범위 밖으로 둔다.
