import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const mark = await prisma.deadlineMark.update({ where: { id }, data: body });
    return NextResponse.json(mark);
  } catch {
    return NextResponse.json({ error: "Failed to update mark" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.deadlineMark.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete mark" }, { status: 500 });
  }
}
