import { use } from "react";
import { db } from "../../../../../../lib/db/db";
import { lessons } from "../../../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(
    request: NextRequest,
    { params } : { params : Promise<{ id: string}>}
){
    try {
        const { id } = await params;
        const lessonId = parseInt(id);
        await db.delete(lessons).where(eq(lessons.id, lessonId));
        return new NextResponse(
            null,
            { status: 204 }
        )
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { error: error },
            { status: 500 }
        )
    }
} 