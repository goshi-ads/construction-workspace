import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id: caseId } = await params;
    const rows = await prisma.caseCheck.findMany({ where: { caseId } });
    const checks: Record<string, boolean> = {};
    for (const row of rows) {
      checks[row.itemId] = row.checked;
    }
    return NextResponse.json(checks);
  } catch {
    return NextResponse.json({ error: "Failed to fetch checks" }, { status: 500 });
  }
}

/** Body: { itemId: string; checked: boolean } */
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id: caseId } = await params;
    const { itemId, checked } = (await req.json()) as {
      itemId: string;
      checked: boolean;
    };

    await prisma.caseCheck.upsert({
      where: { caseId_itemId: { caseId, itemId } },
      update: { checked },
      create: { caseId, itemId, checked },
    });

    const rows = await prisma.caseCheck.findMany({ where: { caseId } });
    const result: Record<string, boolean> = {};
    for (const row of rows) {
      result[row.itemId] = row.checked;
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to update check" }, { status: 500 });
  }
}
