# Spec Delta

## Purpose

사용자가 [샘플 데이터 인덱싱]을 누르면 샘플 리뷰를 검색 가능한 상태로 만들고 결과 건수를 표준 응답 규격으로 알려주는 서버 엔드포인트의 동작을 정의한다.

## ADDED Requirements

### Requirement: Mock 모드 인덱싱 응답
`POST /api/index-data` 는 Mock 모드(`USE_MOCK` 이 `'false'` 가 아님)에서 샘플 리뷰를 적재하고 `{ success: true, mode: 'mock', data: { indexed: <건수> } }` 를 반환해야 한다(SHALL). 샘플 데이터 기준 `indexed` 는 100 이다.

#### Scenario: 인덱싱 성공
- **WHEN** Mock 모드에서 `POST /api/index-data` 를 호출한다
- **THEN** 응답은 `success: true`, `mode: 'mock'`, `data.indexed: 100` 을 포함하고 HTTP 상태는 200 이다

#### Scenario: USE_MOCK 미설정
- **WHEN** `USE_MOCK` 환경변수가 설정되어 있지 않다
- **THEN** Mock 모드로 동작한다

#### Scenario: 반복 호출
- **WHEN** 인덱싱을 여러 번 호출한다
- **THEN** 매번 같은 건수가 반환된다

### Requirement: 실데이터 모드 미지원 응답
실데이터 모드(`USE_MOCK === 'false'`)의 인덱싱은 이번 변경에서 구현하지 않으므로, 시스템은 성공으로 위장하지 않고 `{ success: false, error }` 와 실패 상태 코드를 반환해야 한다(MUST).

#### Scenario: 실데이터 모드 호출
- **WHEN** `USE_MOCK` 이 `'false'` 일 때 `POST /api/index-data` 를 호출한다
- **THEN** 응답은 `success: false` 와 아직 지원하지 않는다는 `error` 문구를 포함하고 HTTP 상태는 501 이다

### Requirement: 인덱싱 실패 응답
인덱싱 중 오류가 발생하면 시스템은 `{ success: false, error }` 를 반환해야 하며(SHALL), 내부 경로나 스택 트레이스 같은 상세를 `error` 에 노출해서는 안 된다(MUST NOT).

#### Scenario: CSV 읽기 실패
- **WHEN** 샘플 CSV 를 읽을 수 없다
- **THEN** 응답은 `success: false` 와 사용자용 오류 문구를 포함하고 HTTP 상태는 500 이다
