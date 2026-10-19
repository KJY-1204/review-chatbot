## ADDED Requirements

### Requirement: 실데이터 모드 인덱싱
`POST /api/index-data` 는 실데이터 모드(`USE_MOCK === 'false'`)에서 샘플 리뷰를 Supabase 와 Pinecone 에 모두 적재한 뒤 `{ success: true, mode: 'real', data: { indexed: <건수> } }` 를 HTTP 200 으로 반환해야 한다(SHALL). `indexed` 는 Pinecone 에 적재된 레코드 수이며 샘플 데이터 기준 100 이다. Supabase 적재가 실패하면 Pinecone 적재를 시작해서는 안 된다(MUST NOT). 적재 중 오류가 나면 `{ success: false, error }` 와 HTTP 500 을 반환하고 `error` 에 내부 상세를 노출해서는 안 된다(MUST NOT).

#### Scenario: 실데이터 인덱싱 성공
- **WHEN** `USE_MOCK` 이 `'false'` 일 때 `POST /api/index-data` 를 호출한다
- **THEN** 응답은 `success: true`, `mode: 'real'`, `data.indexed: 100` 을 포함하고 HTTP 상태는 200 이다

#### Scenario: 반복 호출
- **WHEN** 실데이터 모드에서 인덱싱을 여러 번 호출한다
- **THEN** 매번 같은 건수가 반환되고 Supabase 와 Pinecone 에 중복 레코드가 생기지 않는다

#### Scenario: Supabase 적재 실패
- **WHEN** Supabase upsert 가 실패한다
- **THEN** Pinecone 적재는 시도하지 않고 `success: false` 와 HTTP 500 을 반환한다

#### Scenario: Pinecone 적재 실패
- **WHEN** Pinecone 적재가 중간 배치에서 실패한다
- **THEN** 응답은 `success: false` 와 HTTP 500 이며 `error` 에 키나 호스트가 포함되지 않는다

## REMOVED Requirements

### Requirement: 실데이터 모드 미지원 응답
**Reason**: 실데이터 모드 인덱싱을 구현하므로 501 응답이 더 이상 유효하지 않다.
**Migration**: "실데이터 모드 인덱싱" 요구사항이 대체한다.
