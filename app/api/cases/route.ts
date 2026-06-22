import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(cases);
  } catch {
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}
