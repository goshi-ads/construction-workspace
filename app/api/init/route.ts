import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [casesRaw, marks, steps] = await Promise.all([
      prisma.case.findMany({
        orderBy: { id: "asc" },
        include: { progress: true, checks: true },
      }),
      prisma.deadlineMark.findMany({ orderBy: { at: "asc" } }),
      prisma.procedureStep.findMany({
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
    ]);

    const cases = casesRaw.map(({ progress: _p, checks: _c, ...c }) => c);

    const checksByCase: Record<string, Record<string, boolean>> = {};
    for (const c of casesRaw) {
      checksByCase[c.id] = Object.fromEntries(
        c.checks.map((ch) => [ch.itemId, ch.checked])
      );
    }

    const currentStepByCase: Record<string, string> = {};
    for (const c of casesRaw) {
      currentStepByCase[c.id] =
        c.progress?.currentStepId ?? c.defaultCurrentStepId;
    }

    return NextResponse.json({ cases, marks, steps, checksByCase, currentStepByCase });
  } catch {
    return NextResponse.json({ error: "Failed to load initial data" }, { status: 500 });
  }
}
