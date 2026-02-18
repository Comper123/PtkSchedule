import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/db/db";
import { groups } from "../../../../../../lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const editedGroup = await db.select().from(groups).where(eq(groups.number, id)).limit(1);
    if (editedGroup.length === 0) {
        return NextResponse.json(
            { error: "Группы не найдено" },
            { status: 404 }
        )
    }

    const body = await request.json();
    const { countStudent } = body;
    const updatedGroup = await db.update(groups).set({
        countStudent: countStudent  ?? editedGroup[0].countStudent
    }).where(eq(groups.number, id)).returning();
    return NextResponse.json(updatedGroup[0], { status: 200 })
  } catch (error) {
    console.log(error);
    return NextResponse.json(
        { error: error }, 
        { status: 500 }
    );
  }
}
