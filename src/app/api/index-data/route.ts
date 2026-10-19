import { NextResponse } from "next/server";
import { indexMockReviews } from "@/lib/review-store";
import { indexRealReviews } from "@/lib/real-store";

export async function POST() {
  const isReal = process.env.USE_MOCK === "false";

  try {
    const indexed = isReal ? await indexRealReviews() : await indexMockReviews();
    return NextResponse.json({ success: true, mode: isReal ? "real" : "mock", data: { indexed } });
  } catch (err) {
    console.error("[index-data] 인덱싱 실패:", err);
    return NextResponse.json(
      { success: false, error: "샘플 데이터를 인덱싱하지 못했습니다." },
      { status: 500 },
    );
  }
}
