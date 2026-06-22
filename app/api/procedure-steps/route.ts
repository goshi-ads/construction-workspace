import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const steps = await prisma.procedureStep.findMany({
      orderBy: { order: "asc" },
      include: {
        items: { orderBy: { order: "asc" } },
      },
    });
    return NextResponse.json(steps);
  } catch {
    return NextResponse.json({ error: "Failed to fetch procedure steps" }, { status: 500 });
  }
}
