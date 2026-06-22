import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ cardId: string; projectId: string }> };

/** Body: { completed: boolean } */
export async function PUT(req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const { completed } = (await req.json()) as { completed: boolean };
    const project = await prisma.annualProject.update({
      where: { id: projectId },
      data: { completed },
    });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
