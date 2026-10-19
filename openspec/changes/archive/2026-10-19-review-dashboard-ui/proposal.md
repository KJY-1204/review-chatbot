# Proposal

## Why

현재 프로젝트는 `create-next-app` 기본 화면만 있어, 리뷰 분석 챗봇의 어떤 기능도 사용자에게 보이지 않는다. RAG 파이프라인과 API를 붙이기 전에 **메인 대시보드 UI**를 먼저 완성해 두면, 이후 `/api/chat` 등 백엔드 작업이 동일한 화면 계약(응답 규격) 위에서 진행되고 Mock → 실데이터 전환 시에도 UI 수정이 필요 없다 (CLAUDE.md "Mock-First & Clean Boundary").

## What Changes

- 루트 페이지(`/`)를 좌측 사이드바 + 우측 채팅 영역의 2단 대시보드 레이아웃으로 교체한다.
- **사이드바**: 서비스 타이틀("쇼핑 리뷰 AI 분석기"), 데이터 모드 배지("Mock 모드" / "실데이터 모드"), [샘플 데이터 인덱싱] 버튼(로딩 스피너·완료 상태), 최근 분석 질문 히스토리 목록.
- **채팅 영역**: 상단 분석 대상 상품 배너, 사용자 질문/AI 답변 메시지 스트림, 하단 질문 입력창 + 전송 버튼.
- **참고 리뷰 카드**: AI 답변마다 근거로 쓰인 리뷰(3~5건)를 접고 펼 수 있는 아코디언과 평점/검증구매 배지로 표시한다.
- **한글 IME 방어**: Enter 전송 시 `e.nativeEvent.isComposing` 을 확인해 조합 중 중복 전송을 막는다.
- 아이콘은 `lucide-react` 로 통일한다 (신규 의존성).
- 화면은 `{ success, answer?, sources?, error? }` 형태의 API 응답 규격과 동일한 타입을 사용하며, 이번 변경에서는 이 규격을 따르는 **클라이언트 측 Mock 서비스 계층**으로 동작을 시연한다. 실제 API 라우트·RAG·인덱싱 구현은 범위 밖이다.

### 범위 밖 (Out of scope)

- `/api/chat`, `/api/index`, `/api/mode` 등 서버 라우트 및 CSV 파싱·검색, LangChain 생성 로직
- Pinecone / Supabase 연동, 대화 히스토리 영속화
- 다중 상품 선택, 인증, 스트리밍(SSE) 응답

## Capabilities

### New Capabilities

- `dashboard-sidebar`: 서비스 타이틀, 데이터 모드 배지, 샘플 데이터 인덱싱 버튼 상태, 최근 질문 히스토리 목록
- `chat-interface`: 상품 정보 배너, 메시지 스트림, 질문 입력/전송(IME 중복 전송 방어 포함), 로딩·오류 표시
- `review-source-display`: AI 답변 하단의 참고 리뷰 카드(Top 3~5) 아코디언과 평점·검증구매 배지

### Modified Capabilities

(없음 — `openspec/specs/` 에 기존 spec 이 없다)

## Impact

- **코드**: `src/app/page.tsx`, `src/app/layout.tsx`(메타데이터·언어 `ko`), `src/app/globals.css`, 신규 `src/components/**`, `src/lib/**`(타입, Mock 서비스)
- **의존성**: `lucide-react` 추가 (CLAUDE.md 스택에 명시됨)
- **API**: 변경 없음. 이후 변경에서 구현할 응답 규격을 UI 타입으로 먼저 고정한다.
- **금지 사항 영향 없음**: 임베딩 라이브러리·`PineconeStore` 를 도입하지 않는다.
