import type { SourceReview } from "./types";

export const PRODUCT_NAME = "노이즈캔슬링 무선 이어폰 PRO";

export const MOCK_REVIEWS: SourceReview[] = [
  {
    id: "r003",
    rating: 5,
    title: "노이즈 캔슬링 대박",
    content:
      "독서실이랑 카페에서 공부할 때 쓰는데 에어컨 소리나 말소리 거의 완벽하게 차단해 줍니다. 집중력 완전 올라갔어요.",
    author: "열공생",
    score: 0.91,
    verifiedPurchase: true,
  },
  {
    id: "r001",
    rating: 5,
    title: "운동할 때 최고",
    content:
      "러닝하면서 매일 사용하고 있는데 귀에서 절대 안 빠집니다. 땀 많이 흘려도 방수 잘 되네요.",
    author: "러너김",
    score: 0.84,
    verifiedPurchase: true,
  },
  {
    id: "r002",
    rating: 4,
    title: "음질 좋지만 통화 품질은 아쉬워요",
    content:
      "음악 들을 때 저음 타격감이랑 해상력은 가격 대비 훌륭합니다. 다만 지하철에서 통화할 때 상대방이 제 목소리보다 주변 소음이 더 크게 들린다고 하네요.",
    author: "사운드매니아",
    score: 0.78,
    verifiedPurchase: true,
  },
  {
    id: "r004",
    rating: 3,
    title: "귀가 작으면 불편할 수 있어요",
    content:
      "소리는 괜찮은데 유닛이 약간 큰 편이라 1시간 이상 끼고 있으면 귓바퀴가 욱신거립니다. 이어팁 제일 작은 걸로 바꿔도 살짝 압박감이 있어요.",
    author: "이어팁요정",
    score: 0.66,
    verifiedPurchase: true,
  },
  {
    id: "r005",
    rating: 5,
    title: "에어팟보다 나은 것 같아요",
    content:
      "가성비 최고입니다. 이 가격에 노이즈 캔슬링이랑 멀티포인트 연결까지 지원하다니 대만족입니다.",
    author: "가성비추구",
  },
];

export const MOCK_INDEXED_COUNT = 100;

export const EXAMPLE_QUESTIONS = [
  "노이즈 캔슬링 성능은 어떤가요?",
  "배터리와 연결 안정성에 대한 불만이 있나요?",
  "운동할 때 쓰기 좋은가요?",
];
