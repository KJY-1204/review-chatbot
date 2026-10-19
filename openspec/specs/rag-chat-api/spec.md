# rag-chat-api Specification

## Purpose

사용자 질문에 대해 검색된 실제 구매 고객 리뷰만을 근거로 답변을 생성하고, 근거가 된 참고 리뷰를 함께 표준 응답 규격으로 반환하는 서버 엔드포인트의 동작을 정의한다.

## Requirements

### Requirement: 질문 요청 검증
`POST /api/chat` 은 본문 `{ query: string, chatId?: string }` 를 받아야 하며(SHALL), `query` 가 문자열이 아니거나 공백뿐이면 `{ success: false, error }` 와 HTTP 400 을 반환해야 한다(MUST). 본문이 올바른 JSON 이 아닌 경우도 같다.

#### Scenario: 빈 질문
- **WHEN** `query` 가 빈 문자열이거나 공백뿐이다
- **THEN** 응답은 `success: false` 와 오류 문구를 포함하고 HTTP 상태는 400 이다

#### Scenario: 잘못된 본문
- **WHEN** 본문이 JSON 이 아니거나 `query` 필드가 없다
- **THEN** 응답은 `success: false` 이고 HTTP 상태는 400 이다

### Requirement: 리뷰 근거 답변 생성
시스템은 질문과 관련된 상위 5건의 리뷰를 검색해 `[리뷰 N] ★{평점} {제목} — {내용} (작성자: {작성자})` 형식의 근거 텍스트를 만들고, 이 근거만을 바탕으로 답변을 생성해야 한다(SHALL). 모델에는 리뷰에 없는 사실을 지어내지 않고, 장단점이 모두 있으면 균형 있게 설명하며 관련 작성자의 의견을 인용하도록 지시해야 한다(MUST).

#### Scenario: 관련 리뷰가 있는 질문
- **WHEN** 사용자가 "노이즈 캔슬링 성능은 어떤가요?" 를 질문한다
- **THEN** 해당 키워드와 관련된 리뷰가 근거로 사용되어 답변이 생성되고 `answer` 에 비어 있지 않은 문자열이 담긴다

#### Scenario: 관련 리뷰가 없는 질문
- **WHEN** 질문과 매칭되는 리뷰가 없다
- **THEN** 도움됨 수가 높은 기본 리뷰 5건이 근거로 사용된다

### Requirement: 성공 응답 규격
성공 시 시스템은 `{ success: true, mode: 'mock', answer, sources }` 를 HTTP 200 으로 반환해야 한다(SHALL). `sources` 의 각 항목은 `id`, `title`, `content`, `rating`, `author`, `date`, `score` 를 포함해야 하며(MUST), 근거로 사용된 리뷰와 정확히 일치해야 한다(MUST).

#### Scenario: 성공 응답 구조
- **WHEN** 유효한 질문으로 호출한다
- **THEN** 응답에 `success: true`, `mode: 'mock'`, 문자열 `answer`, 길이 5 이하의 `sources` 가 포함된다

#### Scenario: 참고 리뷰 필드
- **WHEN** 응답의 `sources` 를 확인한다
- **THEN** 각 항목에 `id`, `title`, `content`, `rating`(숫자), `author`, `date`, `score`(0.65~0.98) 가 있다

#### Scenario: 근거와 출처 일치
- **WHEN** 답변이 생성된다
- **THEN** `sources` 는 모델에 근거로 전달한 리뷰와 같은 리뷰들이다

### Requirement: 대화 기록 저장
시스템은 성공한 질문과 답변을 `chatId` 별 대화 기록에 저장해야 한다(SHALL). `chatId` 가 없으면 기본 대화에 저장한다.

#### Scenario: 질문과 답변 저장
- **WHEN** 질문에 대한 답변이 성공적으로 생성된다
- **THEN** 해당 chatId 의 대화 기록에 사용자 메시지와 AI 메시지가 순서대로 추가된다

#### Scenario: 실패한 요청
- **WHEN** 답변 생성이 실패한다
- **THEN** 대화 기록에 AI 메시지가 추가되지 않는다

### Requirement: 답변 생성 생략
`ANTHROPIC_API_KEY` 가 없거나 `SKIP_GENERATION` 이 `'true'` 이면 시스템은 모델을 호출하지 않고 성공 응답을 반환해야 한다(SHALL). 이때 `answer` 는 질문과 검색된 리뷰를 담은 JSON 문자열(`{ query, sources }`)이며 `sources` 는 동일하게 포함한다(MUST). 대화 기록도 동일하게 저장한다.

#### Scenario: 생성 생략 모드
- **WHEN** `SKIP_GENERATION=true` 로 질문을 보낸다
- **THEN** 모델 호출 없이 `success: true` 이고 `answer` 에 `query` 와 `sources` 를 담은 JSON 문자열이 들어 있으며 채팅창에 그대로 표시된다

#### Scenario: API 키 없음
- **WHEN** `ANTHROPIC_API_KEY` 가 설정되어 있지 않은 채 질문을 보낸다
- **THEN** 생성 생략 모드와 동일하게 응답한다

### Requirement: 생성 실패 응답
키가 설정되어 있고 생성을 생략하지 않는 상태에서 모델 호출이 실패하는 등 답변을 생성하지 못하면 시스템은 `{ success: false, error }` 와 HTTP 500 을 반환해야 한다(SHALL). `error` 에는 사용자용 문구만 담고 API 키, 스택 트레이스, 내부 경로를 노출해서는 안 된다(MUST NOT).

#### Scenario: 모델 호출 오류
- **WHEN** 모델 호출이 네트워크 오류나 인증 오류로 실패한다
- **THEN** 응답은 `success: false` 이고 `error` 에 키나 내부 상세가 포함되지 않는다

### Requirement: 실데이터 모드 미지원 응답
실데이터 모드(`USE_MOCK === 'false'`)의 검색은 이번 변경에서 구현하지 않으므로, 시스템은 Mock 데이터로 응답하지 않고 `{ success: false, error }` 와 HTTP 501 을 반환해야 한다(MUST).

#### Scenario: 실데이터 모드 호출
- **WHEN** `USE_MOCK` 이 `'false'` 일 때 `POST /api/chat` 을 호출한다
- **THEN** 응답은 `success: false` 와 아직 지원하지 않는다는 `error` 를 포함하고 HTTP 상태는 501 이다

### Requirement: 화면 연결
대시보드의 [샘플 데이터 인덱싱] 버튼과 채팅 입력창은 각각 인덱싱 API 와 채팅 API 를 호출해야 하며(SHALL), 화면은 기존 응답 규격만으로 결과와 오류를 표시해야 한다(MUST). 네트워크 오류나 비정상 응답에서도 로딩 표시가 해제되고 재시도할 수 있어야 한다(MUST).

#### Scenario: 인덱싱 버튼
- **WHEN** 사용자가 [샘플 데이터 인덱싱] 버튼을 누른다
- **THEN** 인덱싱 API 가 호출되고 완료 시 응답의 `indexed` 건수가 사이드바에 표시된다

#### Scenario: 질문 전송
- **WHEN** 사용자가 질문을 전송한다
- **THEN** 채팅 API 가 호출되고 응답의 `answer` 가 AI 메시지로, `sources` 가 참고 리뷰 아코디언으로 표시된다

#### Scenario: 서버 오류 응답
- **WHEN** API 가 `success: false` 또는 네트워크 오류를 반환한다
- **THEN** 오류 메시지가 AI 메시지 영역(채팅) 또는 인덱싱 영역에 표시되고 사용자가 다시 시도할 수 있다
