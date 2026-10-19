# Tasks

## 1. 환경 및 DB 준비

- [x] 1.1 `.env.local` 의 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 를 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 로 이름을 맞춘다(값은 그대로)
- [x] 1.2 `supabase/migrations/` 에 `reviews`, `messages` 테이블 생성 SQL 을 작성한다(인덱스, RLS 활성화, anon 최소 권한 정책 포함)
- [x] 1.3 Supabase 프로젝트에 마이그레이션을 적용하고 두 테이블이 생겼는지 확인한다

## 2. 실데이터 접근 계층

- [x] 2.1 `src/lib/review-store.ts` 에서 CSV 읽기·`parseReviews` 를 export 한다(Mock 동작은 변경 없음)
- [x] 2.2 `src/lib/real-store.ts` 를 만들고 환경변수 검증, Supabase 클라이언트(키 fallback 포함), Pinecone 네임스페이스 지연 생성을 구현한다
- [x] 2.3 `indexRealReviews()` 를 구현한다: Supabase `reviews` upsert(`id` 기준) 후 Pinecone `upsertRecords` 를 96건씩 순차 적재하고 적재 건수를 반환한다
- [x] 2.4 `searchRealReviews(query, topK)` 를 구현한다: `searchRecords` 로 상위 5건을 조회해 `RetrievedReview` 로 변환하고 Supabase 에서 `date` 를 보강한다(실패 시 무시)
- [x] 2.5 `saveRealMessage` 를 구현해 질문·답변을 `messages` 에 저장한다(실패는 로그만)

## 3. API 라우트 연결

- [x] 3.1 `src/app/api/index-data/route.ts` 의 501 분기를 `indexRealReviews()` 호출로 바꾸고 `mode: 'real'` 로 응답한다
- [x] 3.2 `src/app/api/chat/route.ts` 의 501 분기를 제거하고 모드에 따라 검색·저장 함수를 선택하게 한다(프롬프트·생성 생략·응답 구성은 공유, `mode` 는 현재 모드)
- [x] 3.3 두 라우트 모두 오류 시 상세를 `console.error` 로만 남기고 고정된 사용자용 문구를 반환하는지 확인한다

## 4. 검증

- [x] 4.1 `USE_MOCK=true` 로 인덱싱·질문이 기존과 같이 동작하고 외부 호출이 없는지 확인한다
- [x] 4.2 `USE_MOCK=false` 로 인덱싱을 호출해 `indexed: 100`, Supabase `reviews` 100행, Pinecone 레코드 100건을 확인하고 재호출 시 중복이 없는지 확인한다
- [ ] 4.3 `USE_MOCK=false` 로 질문해 `mode: 'real'`, 5건 이하 `sources`, `messages` 저장을 확인한다(`SKIP_GENERATION=true` 와 생성 포함 둘 다)
- [x] 4.4 환경변수 누락·잘못된 키에서 `success: false` 와 HTTP 500 이며 응답에 키·호스트가 없는지 확인한다
- [x] 4.5 `npm run lint` 와 `npm run build` 가 통과하는지 확인한다
- [x] 4.6 `PineconeStore`, `OpenAIEmbeddings` 를 사용하지 않았는지 확인한다(`grep`)
