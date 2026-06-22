import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const cards = await prisma.annualCard.findMany({
      orderBy: { order: "asc" },
      include: {
        projects: { orderBy: { order: "asc" } },
      },
    });
    return NextResponse.json(cards);
  } catch {
    return NextResponse.json({ error: "Failed to fetch annual schedule" }, { status: 500 });
  }
}
