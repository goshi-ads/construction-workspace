import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");
    const marks = await prisma.deadlineMark.findMany({
      where: caseId ? { caseId } : undefined,
      orderBy: { at: "asc" },
    });
    return NextResponse.json(marks);
  } catch {
    return NextResponse.json({ error: "Failed to fetch marks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mark = await prisma.deadlineMark.create({ data: body });
    return NextResponse.json(mark, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create mark" }, { status: 500 });
  }
}
