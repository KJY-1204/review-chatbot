import { NextResponse } from "next/server";
import { indexMockReviews } from "@/lib/review-store";

export async function POST() {
  if (process.env.USE_MOCK === "false") {
    return NextResponse.json(
      { success: false, error: "실데이터 모드의 인덱싱은 아직 지원하지 않습니다." },
      { status: 501 },
    );
  }

  try {
    const indexed = await indexMockReviews();
    return NextResponse.json({ success: true, mode: "mock", data: { indexed } });
  } catch (err) {
    console.error("[index-data] 인덱싱 실패:", err);
    return NextResponse.json(
      { success: false, error: "샘플 데이터를 인덱싱하지 못했습니다." },
      { status: 500 },
    );
  }
}
