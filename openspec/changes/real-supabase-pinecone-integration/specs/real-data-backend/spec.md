## ADDED Requirements

### Requirement: 실데이터 모드 판별
시스템은 `USE_MOCK` 환경변수가 정확히 `'false'` 일 때만 실데이터 모드로 동작해야 한다(SHALL). 그 외 값이나 미설정은 Mock 모드이며, Mock 모드에서는 Pinecone 과 Supabase 를 호출해서는 안 된다(MUST NOT).

#### Scenario: Mock 모드에서 외부 호출 없음
- **WHEN** `USE_MOCK` 이 `'false'` 가 아닌 상태로 인덱싱 또는 질문을 요청한다
- **THEN** Pinecone 과 Supabase 에 어떤 요청도 보내지 않고 기존 Mock 동작과 동일하게 응답한다

### Requirement: 필수 환경변수 검증
실데이터 모드에서 필요한 설정(`PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_HOST`, Supabase URL, Supabase 공개 키)이 하나라도 없으면 시스템은 외부 호출 전에 실패해야 한다(SHALL). Supabase 공개 키는 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 를 우선하고 없으면 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를 사용한다(MUST). 오류 응답에는 누락된 변수의 값이나 키를 노출해서는 안 된다(MUST NOT).

#### Scenario: 설정 누락
- **WHEN** 실데이터 모드에서 `PINECONE_HOST` 가 설정되어 있지 않다
- **THEN** 요청은 `success: false` 와 사용자용 오류 문구, HTTP 500 으로 끝나고 외부 서비스 호출은 일어나지 않는다

#### Scenario: Supabase 키 우선순위
- **WHEN** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 와 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 모두 설정되어 있다
- **THEN** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 값을 사용한다

### Requirement: Supabase 리뷰 영속화
시스템은 샘플 리뷰를 Supabase `reviews` 테이블에 `id` 를 기준으로 upsert 해야 한다(SHALL). 같은 데이터를 여러 번 적재해도 행이 중복되지 않아야 한다(MUST). 각 행은 `id`, `rating`, `title`, `content`, `author`, `date`, `helpful_votes`, `verified_purchase` 를 담는다.

#### Scenario: 최초 적재
- **WHEN** 비어 있는 `reviews` 테이블에 샘플 100건을 적재한다
- **THEN** 테이블에 100개 행이 생긴다

#### Scenario: 재적재
- **WHEN** 이미 적재된 샘플을 다시 적재한다
- **THEN** 행 수는 100 으로 유지되고 같은 `id` 의 행은 갱신된다

### Requirement: Pinecone 통합 임베딩 적재
시스템은 각 리뷰를 `reviews` 네임스페이스에 `{ _id, text, rating, author, title, content }` 레코드로 적재해야 한다(SHALL). `text` 는 `"{title} {content}"` 이고 `rating` 은 숫자이다. 한 번의 적재 요청에는 96개 이하의 레코드만 담아야 하며(MUST) 배치는 순차로 처리한다. 클라이언트 측 임베딩 생성이나 `PineconeStore` 를 사용해서는 안 된다(MUST NOT).

#### Scenario: 배치 분할
- **WHEN** 리뷰 100건을 적재한다
- **THEN** 96건과 4건, 두 번의 요청으로 순차 적재된다

#### Scenario: 레코드 형태
- **WHEN** 리뷰 `r001` 이 적재된다
- **THEN** 레코드의 `_id` 는 `r001`, `text` 는 제목과 내용을 공백으로 이은 문자열, `rating` 은 숫자이다

### Requirement: Pinecone 통합 검색
시스템은 질문 텍스트로 `reviews` 네임스페이스를 검색해 상위 5건의 `_id`, `_score`, `title`, `content`, `rating`, `author` 를 얻어야 한다(SHALL). 검색 결과는 점수 내림차순으로 `RetrievedReview` 형태(`id`, `title`, `content`, `rating`, `author`, `date`, `score`)로 변환한다. Pinecone 에 없는 `date` 는 Supabase `reviews` 에서 `id` 로 보강하며(SHOULD), 보강에 실패해도 검색 결과는 반환한다(MUST).

#### Scenario: 상위 5건 검색
- **WHEN** 실데이터 모드에서 "배터리는 얼마나 가나요?" 를 검색한다
- **THEN** 최대 5건이 점수 내림차순으로 반환되고 각 항목의 `score` 는 Pinecone 의 `_score` 이다

#### Scenario: 검색 결과 없음
- **WHEN** 검색이 0건을 반환한다
- **THEN** 빈 `sources` 로 처리하며 오류로 취급하지 않는다

### Requirement: Supabase 대화 기록 저장
실데이터 모드에서 성공한 질문과 답변은 Supabase `messages` 테이블에 `chat_id`, `role`, `content`, `created_at` 으로 순서대로 저장되어야 한다(SHALL). `chatId` 가 없으면 `'default'` 를 사용한다. 답변 생성이 실패하면 AI 메시지를 저장해서는 안 된다(MUST NOT).

#### Scenario: 질문과 답변 저장
- **WHEN** 실데이터 모드에서 질문이 성공한다
- **THEN** 해당 `chat_id` 에 `user` 메시지와 `assistant` 메시지가 순서대로 저장된다

#### Scenario: 저장 실패
- **WHEN** 메시지 저장이 실패한다
- **THEN** 이미 생성된 답변은 사용자에게 그대로 반환하고, 저장 실패는 서버 로그에만 남긴다

### Requirement: 외부 서비스 오류 비노출
Pinecone 또는 Supabase 호출이 실패하면 시스템은 `{ success: false, error }` 와 HTTP 500 을 반환해야 한다(SHALL). `error` 에는 API 키, 호스트, 스택 트레이스 같은 내부 상세를 담아서는 안 된다(MUST NOT).

#### Scenario: Pinecone 오류
- **WHEN** Pinecone 호출이 인증 오류나 네트워크 오류로 실패한다
- **THEN** 응답은 `success: false`, HTTP 500 이고 `error` 에 키나 호스트가 포함되지 않는다
