import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/db/db";
import { groups } from "../../../../../../lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
    request: NextRequest,
    { params } : { params: Promise<{ id: string}>}
){
    try {
        const { id } = await params;
        const deletedGroup = await db.select().from(groups).where(eq(groups.number, id)).limit(1);
        if (deletedGroup.length === 0){
            return NextResponse.json({ error: "Такой группы не существует" }, { status: 404 })
        }
        const group = await group 
    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 })
    }
}