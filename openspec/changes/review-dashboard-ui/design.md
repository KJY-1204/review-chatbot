# Design

## Context

- 현재 `src/app` 에는 `create-next-app` 기본 화면(`page.tsx`, `layout.tsx`, `globals.css`)만 있고 `src/components`, `src/lib` 는 없다.
- Next 16.4.2 / React 19.3 / Tailwind 4. `layout.tsx` 는 `LayoutProps<"/">` 타입 헬퍼를 사용한다. Next 16 은 이전 버전과 API 가 다를 수 있으므로 구현 전 `node_modules/next/dist/docs/` 를 확인한다 (`AGENTS.md`).
- 서버 API(`/api/chat` 등)는 아직 없다. 이 변경은 UI 와 그 UI 가 의존하는 응답 규격 타입을 확정하는 데 집중한다 (proposal 의 범위 밖 항목 참고).
- 리뷰 데이터(`samples/review.csv`)는 `id, rating, title, content, author, date, helpful_votes, verified_purchase` 컬럼이며, 상품은 무선 이어폰 한 종류다.

## Goals / Non-Goals

**Goals:**
- 화면이 Mock/실데이터 백엔드를 모르도록 `ChatApi` 인터페이스 한 곳으로만 데이터에 접근한다.
- 이후 변경에서 Mock 구현을 `fetch('/api/...')` 구현으로 교체하는 것만으로 UI 수정 없이 연결된다.
- 데스크톱·모바일 폭에서 모두 사용 가능하고, 키보드·스크린리더 접근성을 확보한다.

**Non-Goals:**
- 서버 라우트, 스트리밍(SSE), 히스토리 영속화, 상태 관리 라이브러리 도입, 다크 모드 전용 디자인.
- 테스트 프레임워크 도입 (아래 Risks 참고).

## Decisions

### 1. 서버 컴포넌트 `page.tsx` + 클라이언트 `Dashboard` 루트
`page.tsx` 는 서버 컴포넌트로 두고 `process.env.USE_MOCK !== 'false'` 로 `mode`(`'mock' | 'real'`)를 계산해 `<Dashboard mode={mode} />` 에 prop 으로 넘긴다. 상호작용(`useState`, 이벤트)이 필요한 `Dashboard` 와 그 하위만 `'use client'` 를 선언한다.
- 이유: CLAUDE.md 의 "필요한 곳에만 `'use client'`" 와 "환경변수는 `process.env.*` 참조" 를 만족하고, 서버 전용 `USE_MOCK` 을 클라이언트에 노출하지 않아도 된다.
- 대안: 클라이언트에서 `/api/mode` 를 fetch → 라우트가 아직 없고 깜빡임이 생겨 기각.

### 2. 응답 규격 타입을 `src/lib/types.ts` 에 고정
`SourceReview { id, rating, title, content, author, score?, verifiedPurchase? }`, `ChatResponse { success, answer?, sources?, error? }`, `IndexResponse { success, data?: { indexed: number }, error? }`, `ChatMessage { id, role: 'user' | 'assistant', content, sources?, isError? }`, `DataMode`.
- 이유: CLAUDE.md "API Response Format" 규격과 동일한 모양을 UI 가 먼저 소비한다. `score`/`verifiedPurchase` 는 선택 필드라 Mock/실데이터 모두 수용한다.

### 3. `ChatApi` 인터페이스 + Mock 구현 (`src/lib/chat-api.ts`, `src/lib/mock-chat-api.ts`)
`sendQuestion(question): Promise<ChatResponse>`, `indexSamples(): Promise<IndexResponse>` 두 메서드를 정의하고, Mock 구현은 지연(~800ms)을 준 뒤 `src/lib/mock-data.ts` 의 고정 리뷰 5건과 정해진 답변 템플릿을 반환한다. 일정 확률의 오류는 넣지 않고, 오류 UI 는 특수 질문(예: "오류 테스트")으로 재현 가능하게 한다.
- 이유: 오류·로딩 시나리오를 수동 검증할 수 있고, 실제 구현 교체 시 import 한 줄만 바뀐다.
- 대안: 지금 Route Handler 를 만들어 Mock 응답을 서빙 → 범위 확대이며 RAG 변경과 중복되어 기각.

### 4. 상태는 `useChat` 훅 + 로컬 `useState`
`useChat(api)` 가 `messages`, `isLoading`, `send(question)` 을 제공하고, 히스토리는 `messages` 중 user 메시지에서 파생한다(별도 저장 안 함). 인덱싱 상태(`'idle' | 'loading' | 'done' | 'error'`)는 `useIndexing(api)` 훅이 관리한다. 중복 요청 방지는 훅 내부에서 `isLoading` 가드로 처리한다.
- 이유: 상태 범위가 작아 전역 스토어가 불필요하다. 히스토리를 파생값으로 두면 동기화 버그가 없다.
- 트레이드오프: 새로고침하면 히스토리가 사라진다 (영속화는 범위 밖).

### 5. 컴포넌트 구성 (`src/components/`)
`dashboard/Dashboard`, `dashboard/Sidebar`(`ModeBadge`, `IndexButton`, `QuestionHistory`), `chat/ProductBanner`, `chat/MessageList`, `chat/MessageBubble`, `chat/ChatInput`, `chat/EmptyState`, `reviews/SourceReviews`(아코디언), `reviews/ReviewCard`, `reviews/StarRating`. 아이콘은 `lucide-react`(`Bot`, `User`, `Sparkles`, `Database`, `Loader2`, `CheckCircle2`, `AlertCircle`, `History`, `Send`, `ChevronDown`, `Star`, `BadgeCheck`, `Menu`, `X`, `Headphones`, `MessageSquare`).
- 이유: 책임이 분리되어 spec 의 capability(`dashboard-sidebar`, `chat-interface`, `review-source-display`)와 1:1 로 대응한다.

### 6. IME 방어와 입력 동작
입력창은 `<textarea>` 이며 `onKeyDown` 에서 `e.nativeEvent.isComposing` 이 true 이면 즉시 반환한다. Enter(Shift 없음)이면 `preventDefault()` 후 전송하고, Shift+Enter 는 기본 동작(줄바꿈)을 유지한다. `isComposing` 이 false 로 이미 바뀐 직후 keydown 이 오는 브라우저(Safari)를 위해 `e.keyCode === 229` 도 함께 무시한다.
- 이유: CLAUDE.md "Defensive UI Implementation" 필수 항목. `<form onSubmit>` 만 쓰면 조합 중 Enter 가 제출될 수 있어 키 핸들러에서 직접 제어한다.

### 7. 아코디언은 직접 구현 (`<button aria-expanded aria-controls>` + 조건부 렌더링)
외부 UI 라이브러리를 추가하지 않는다. 펼침 상태는 `SourceReviews` 컴포넌트 로컬 상태이므로 답변마다 독립이다. `sources` 는 `slice(0, 5)` 로 제한한다.
- 이유: 요구 기능이 단순하고 의존성을 늘릴 이유가 없다.

### 8. 레이아웃과 스타일
`h-dvh` 의 2단 flex. 데스크톱(`lg:`)에서는 고정 폭(`w-72`) 사이드바, 그 미만에서는 헤더 메뉴 버튼으로 여는 오버레이 사이드바. 메시지 목록만 `overflow-y-auto` 로 스크롤하고 배너·입력창은 고정한다. 새 메시지 시 목록 끝의 sentinel 요소로 `scrollIntoView`. 기존 Geist 폰트 설정은 유지하되 한글 가독성을 위해 `font-sans` 폴백에 시스템 한글 폰트를 포함한다. `layout.tsx` 는 `lang="ko"` 와 서비스 메타데이터로 변경한다.

## Risks / Trade-offs

- **Mock 응답이 실제 RAG 답변과 달라 UI 가정이 틀어질 수 있음** → 타입을 CLAUDE.md 규격에 맞춰 고정하고, 선택 필드(`score`, `verifiedPurchase`)가 없는 케이스도 spec 시나리오로 다룬다.
- **자동 테스트가 없음**: 프로젝트에 테스트 러너가 아직 없다 → 이번 변경에서는 도입하지 않고, `lint`/`tsc`/`build` 와 Playwright 를 이용한 수동 시나리오(특히 한글 IME 조합 중 Enter)로 검증한다. 테스트 러너는 별도 변경으로 제안한다.
- **Playwright 로는 실제 IME 조합을 완전히 재현하기 어려움** → `compositionstart`/`isComposing` 이 true 인 `keydown` 이벤트를 합성 디스패치해 핸들러를 검증하고, 실기기 확인은 수동 체크리스트에 남긴다.
- **새로고침 시 히스토리 소실** → 의도된 한계이며 영속화(Supabase)는 이후 변경에서 다룬다.
- **`USE_MOCK` 서버 계산값을 prop 으로 전달**하므로 런타임에 모드가 바뀌어도 새로고침 전까지 배지가 갱신되지 않는다 → 모드는 배포 시점 설정이므로 허용.
