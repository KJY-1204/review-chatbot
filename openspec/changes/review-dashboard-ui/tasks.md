# Tasks

## 1. 기반 설정

- [ ] 1.1 `node_modules/next/dist/docs/` 에서 Next 16 의 App Router 페이지·`'use client'`·메타데이터 규칙을 확인하고, 이 변경에 영향 주는 차이를 구현 메모로 남긴다 (확인한 문서 경로를 작업 요약에 기재)
- [ ] 1.2 `npm install lucide-react` 후 `package.json` 에 의존성이 추가되고 `npm run build` 가 성공하는지 확인한다
- [ ] 1.3 `src/lib/types.ts` 에 `DataMode`, `SourceReview`, `ChatResponse`, `IndexResponse`, `ChatMessage` 를 정의하고 `npx tsc --noEmit` 이 통과하는지 확인한다
- [ ] 1.4 `src/lib/chat-api.ts` 의 `ChatApi` 인터페이스와 `src/lib/mock-chat-api.ts`·`src/lib/mock-data.ts` (고정 리뷰 5건: `samples/review.csv` 내용 기반, 지연 후 응답, "오류 테스트" 질문은 `success:false`) 를 구현하고 `npx tsc --noEmit` 이 통과하는지 확인한다
- [ ] 1.5 `src/app/layout.tsx` 를 `lang="ko"` 와 서비스 제목·설명 메타데이터로 바꾸고 `src/app/globals.css` 에 한글 폰트 폴백을 추가한 뒤 `npm run lint` 가 통과하는지 확인한다

## 2. 리뷰 근거 표시 (`review-source-display`)

- [ ] 2.1 `StarRating` 과 `ReviewCard` 를 구현한다 (별, 제목, 줄임 본문, 작성자, 선택적 관련도·검증구매 배지). 확인: 개발 서버에서 `score` 유무·긴 본문 두 케이스가 각각 spec 시나리오대로 보인다
- [ ] 2.2 `SourceReviews` 아코디언을 구현한다 (기본 접힘, `aria-expanded`/`aria-controls`, 최대 5건, 빈 배열이면 미렌더링). 확인: 헤더 클릭·키보드(Enter/Space)로 펼침/접힘, 답변 2개에서 상태가 독립적임을 직접 확인한다

## 3. 채팅 영역 (`chat-interface`)

- [ ] 3.1 `ProductBanner` 와 `EmptyState`(예시 질문 버튼)를 구현한다. 확인: 초기 화면에 "노이즈캔슬링 무선 이어폰 PRO" 배너와 예시 질문이 보이고 클릭 시 전송된다
- [ ] 3.2 `useChat` 훅을 구현한다 (`messages`, `isLoading`, `send`, 로딩 중 중복 전송 가드, 실패 응답을 오류 메시지로 변환). 확인: 로딩 중 `send` 재호출이 API 를 추가 호출하지 않고, `success:false` 응답이 `isError` 메시지가 되는지 개발 서버에서 확인한다
- [ ] 3.3 `MessageBubble`·`MessageList` 를 구현한다 (사용자/AI 구분, 로딩 인디케이터, 오류 스타일, `SourceReviews` 연결, 새 메시지 시 자동 스크롤). 확인: 질문 전송 → 로딩 → 답변 + 참고 리뷰가 순서대로 나타나고 맨 아래로 스크롤된다
- [ ] 3.4 `ChatInput` 을 구현한다 (textarea, 전송 버튼, 빈 입력·로딩 중 비활성화, Shift+Enter 줄바꿈, `isComposing`/`keyCode 229` 방어). 확인: `isComposing: true` 인 Enter keydown 을 합성 디스패치해도 전송되지 않고, 조합 종료 후 Enter 는 정확히 1회 전송된다

## 4. 사이드바 (`dashboard-sidebar`)

- [ ] 4.1 `ModeBadge` 와 사이드바 헤더(타이틀·아이콘)를 구현한다. 확인: `USE_MOCK` 미설정/`false` 각각으로 서버를 띄워 "Mock 모드"/"실데이터 모드" 배지가 다른 색으로 보인다
- [ ] 4.2 `useIndexing` 훅과 `IndexButton` 을 구현한다 (idle/loading/done/error, 스피너, 완료 시 건수, 실패 시 재시도, 진행 중 중복 클릭 무시). 확인: 클릭 → 스피너 → 완료 문구가 나타나고, 진행 중 연속 클릭이 요청을 한 번만 보낸다
- [ ] 4.3 `QuestionHistory` 를 구현한다 (최신순, 긴 질문 줄임, 빈 상태 안내, 항목 클릭 시 입력창 채움·포커스). 확인: 질문 2개 전송 후 최신순으로 보이고 항목 클릭이 입력창을 채운다

## 5. 대시보드 조립

- [ ] 5.1 `Dashboard`(client 루트)에서 사이드바·채팅 영역을 조립하고, 모바일 폭용 메뉴 버튼과 오버레이 사이드바를 구현한다. 확인: 뷰포트 375px 에서 사이드바가 숨겨지고 메뉴 버튼으로 열고 닫힌다
- [ ] 5.2 `src/app/page.tsx` 를 서버 컴포넌트로 교체해 `process.env.USE_MOCK !== 'false'` 로 `mode` 를 계산해 `Dashboard` 에 전달하고, 기본 `create-next-app` 에셋 참조를 제거한다. 확인: `/` 접속 시 기본 Next 화면이 아닌 대시보드가 표시된다
- [ ] 5.3 `npm run lint`, `npx tsc --noEmit`, `npm run build` 를 실행해 모두 통과하는지 확인한다
- [ ] 5.4 Playwright 로 `/` 를 열어 (a) 질문 전송→답변+참고 리뷰 카드, (b) "오류 테스트" 오류 표시와 재사용 가능한 입력창, (c) 인덱싱 버튼 상태 전이, (d) 데스크톱·375px 레이아웃, (e) 브라우저 콘솔 오류 없음 을 확인하고 스크린샷으로 남긴다

## Workflow follow-up

- 구현 후 `/opsx:archive` 로 변경을 아카이브한다.
- 후속 변경으로 `/api/chat`·`/api/index` 라우트와 CSV 기반 Mock 검색, 테스트 러너 도입을 제안한다.
