# chat-interface Specification

## Purpose

사용자가 분석 대상 상품에 대해 한국어로 질문하고 AI 답변을 대화 형태로 확인할 수 있는 채팅 화면의 동작을 정의한다.

## Requirements

### Requirement: 분석 대상 상품 배너
채팅 영역 상단은 분석 대상 상품 정보 배너를 항상 표시해야 한다(SHALL). 배너에는 상품명(예: "노이즈캔슬링 무선 이어폰 PRO")이 포함되어야 한다(MUST).

#### Scenario: 초기 렌더링
- **WHEN** 대시보드가 로드된다
- **THEN** 채팅 영역 상단에 상품명이 포함된 배너가 보이고, 대화가 스크롤되어도 배너는 화면 상단에 유지된다

### Requirement: 빈 대화 상태
메시지가 없을 때 채팅 영역은 사용자가 바로 시도할 수 있는 예시 질문을 안내해야 한다(SHALL).

#### Scenario: 예시 질문 사용
- **WHEN** 대화가 비어 있고 사용자가 예시 질문을 클릭한다
- **THEN** 해당 질문이 전송된다

### Requirement: 메시지 스트림
채팅 영역은 사용자 질문과 AI 답변을 시간순으로 구분되게(정렬·색상·아이콘) 표시해야 한다(SHALL). 새 메시지가 추가되면 목록의 맨 아래로 자동 스크롤해야 한다(MUST).

#### Scenario: 질문 전송
- **WHEN** 사용자가 질문을 전송한다
- **THEN** 질문이 사용자 메시지로 즉시 목록에 추가된다

#### Scenario: 답변 수신
- **WHEN** AI 답변이 도착한다
- **THEN** 답변이 AI 메시지로 질문 아래에 추가되고 목록이 맨 아래로 스크롤된다

#### Scenario: 답변 대기 중
- **WHEN** 질문을 전송했고 답변이 아직 도착하지 않았다
- **THEN** AI 메시지 자리에 "분석 중" 로딩 표시가 나타난다

### Requirement: 질문 전송 조건
사용자는 전송 버튼 클릭 또는 Enter 로 질문을 전송할 수 있어야 한다(SHALL). 공백뿐인 입력은 전송되지 않아야 하고(MUST NOT), Shift+Enter 는 줄바꿈이어야 한다(MUST).

#### Scenario: 전송 버튼으로 전송
- **WHEN** 입력창에 질문이 있고 사용자가 전송 버튼을 누른다
- **THEN** 질문이 전송되고 입력창이 비워진다

#### Scenario: 빈 입력
- **WHEN** 입력창이 비어 있거나 공백뿐이다
- **THEN** 전송 버튼은 비활성화되고 Enter 를 눌러도 전송되지 않는다

#### Scenario: 줄바꿈
- **WHEN** 사용자가 Shift+Enter 를 누른다
- **THEN** 질문이 전송되지 않고 입력창에 줄바꿈이 삽입된다

#### Scenario: 답변 대기 중 재전송 차단
- **WHEN** 이전 질문의 답변을 기다리는 중이다
- **THEN** 새 질문은 전송되지 않고 전송 버튼은 비활성화된다

### Requirement: 한글 IME 중복 전송 방지
Enter 키 처리는 IME 조합 중인지 확인해야 하며, 조합 중에 누른 Enter 로는 질문을 전송하지 않아야 한다(MUST NOT).

#### Scenario: 한글 조합 중 Enter
- **WHEN** 사용자가 한글을 입력하는 도중(조합 중) Enter 로 글자를 확정한다
- **THEN** 질문은 전송되지 않고 입력 내용이 유지된다

#### Scenario: 조합 종료 후 Enter
- **WHEN** 조합이 끝난 상태에서 사용자가 Enter 를 누른다
- **THEN** 질문이 정확히 한 번 전송된다

### Requirement: 오류 표시
답변 요청이 실패하면 채팅 영역은 실패를 사용자에게 알리고 재시도할 수 있게 해야 한다(SHALL). 화면이 멈추거나 입력창이 잠긴 채로 남아서는 안 된다(MUST NOT).

#### Scenario: 요청 실패
- **WHEN** 답변 요청이 오류로 끝난다
- **THEN** 로딩 표시가 사라지고 오류 메시지가 AI 메시지 영역에 표시되며 입력창은 다시 사용할 수 있다

### Requirement: 응답 규격 호환
채팅 화면은 백엔드 모드(Mock/실데이터)를 구분하지 않고 동일한 응답 규격 `{ success, answer?, sources?, error? }` 만으로 동작해야 한다(MUST).

#### Scenario: 성공 응답
- **WHEN** 응답이 `success: true` 이고 `answer` 를 포함한다
- **THEN** `answer` 가 AI 메시지로 표시되고 `sources` 가 있으면 참고 리뷰로 함께 표시된다

#### Scenario: 실패 응답
- **WHEN** 응답이 `success: false` 이다
- **THEN** `error` 문구(없으면 기본 오류 문구)가 표시된다
