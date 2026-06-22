import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id: caseId } = await params;
    const row = await prisma.caseProgress.findUnique({ where: { caseId } });
    return NextResponse.json({ currentStepId: row?.currentStepId ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

/** Body: { currentStepId: string } */
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id: caseId } = await params;
    const { currentStepId } = (await req.json()) as { currentStepId: string };

    const row = await prisma.caseProgress.upsert({
      where: { caseId },
      update: { currentStepId },
      create: { caseId, currentStepId },
    });
    return NextResponse.json({ currentStepId: row.currentStepId });
  } catch {
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
