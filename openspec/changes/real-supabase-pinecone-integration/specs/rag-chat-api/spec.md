## MODIFIED Requirements

### Requirement: 성공 응답 규격
성공 시 시스템은 `{ success: true, mode, answer, sources }` 를 HTTP 200 으로 반환해야 한다(SHALL). `mode` 는 Mock 모드에서 `'mock'`, 실데이터 모드에서 `'real'` 이다. `sources` 의 각 항목은 `id`, `title`, `content`, `rating`, `author`, `date`, `score` 를 포함해야 하며(MUST), 근거로 사용된 리뷰와 정확히 일치해야 한다(MUST). 두 모드의 응답 필드 구성은 같아야 한다(MUST).

#### Scenario: 성공 응답 구조
- **WHEN** 유효한 질문으로 호출한다
- **THEN** 응답에 `success: true`, 현재 모드에 맞는 `mode`, 문자열 `answer`, 길이 5 이하의 `sources` 가 포함된다

#### Scenario: 참고 리뷰 필드
- **WHEN** Mock 모드 응답의 `sources` 를 확인한다
- **THEN** 각 항목에 `id`, `title`, `content`, `rating`(숫자), `author`, `date`, `score`(0.65~0.98) 가 있다

#### Scenario: 실데이터 모드 참고 리뷰 필드
- **WHEN** 실데이터 모드 응답의 `sources` 를 확인한다
- **THEN** 각 항목에 `id`, `title`, `content`, `rating`(숫자), `author`, `score`(검색 점수) 가 있고 `date` 는 확인되는 경우에만 포함된다

#### Scenario: 근거와 출처 일치
- **WHEN** 답변이 생성된다
- **THEN** `sources` 는 모델에 근거로 전달한 리뷰와 같은 리뷰들이다

## ADDED Requirements

### Requirement: 실데이터 모드 질문 답변
`POST /api/chat` 은 실데이터 모드(`USE_MOCK === 'false'`)에서 질문과 의미상 가장 가까운 상위 5건의 리뷰를 근거로 기존과 동일한 지시문으로 답변을 생성하고, `{ success: true, mode: 'real', answer, sources }` 를 반환해야 한다(SHALL). 질문 검증, 답변 생성 생략(`SKIP_GENERATION`, API 키 없음), 생성 실패 응답은 Mock 모드와 같은 규칙을 따른다(MUST). 검색이나 저장소 접근이 실패하면 `{ success: false, error }` 와 HTTP 500 을 반환하고 내부 상세를 노출해서는 안 된다(MUST NOT). Mock 데이터로 대신 응답해서는 안 된다(MUST NOT).

#### Scenario: 실데이터 질문 성공
- **WHEN** 실데이터 모드에서 "노이즈 캔슬링 성능은 어떤가요?" 를 질문한다
- **THEN** 응답은 `success: true`, `mode: 'real'`, 비어 있지 않은 `answer`, 5건 이하의 `sources` 를 포함하고 HTTP 상태는 200 이다

#### Scenario: 실데이터 모드 생성 생략
- **WHEN** 실데이터 모드에서 `SKIP_GENERATION=true` 로 질문한다
- **THEN** 모델 호출 없이 `query` 와 `sources` 를 담은 JSON 문자열을 `answer` 로 반환하고 대화 기록은 Supabase 에 저장된다

#### Scenario: 검색 실패
- **WHEN** Pinecone 검색이 실패한다
- **THEN** 응답은 `success: false`, HTTP 500 이며 Mock 데이터로 대체 응답하지 않고 대화 기록도 저장하지 않는다

#### Scenario: 아직 인덱싱하지 않은 상태
- **WHEN** 인덱스에 레코드가 없는 상태에서 질문한다
- **THEN** 빈 `sources` 로 정상 응답하며 오류로 취급하지 않는다

## REMOVED Requirements

### Requirement: 실데이터 모드 미지원 응답
**Reason**: 실데이터 모드 검색·답변을 구현하므로 501 응답이 더 이상 유효하지 않다.
**Migration**: "실데이터 모드 질문 답변" 요구사항이 대체한다.
