import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db/db";
import { lessons } from "../../../../../lib/db/schema";
import { eq } from "drizzle-orm";


// GET - получить все уроки
export async function GET(
    request: NextRequest,
    { params }: { params: {groupid: string}}
){
    try {
        const lessonsList = await db.select().from(lessons).where(eq(lessons.groupId, parseInt(params.groupid)));
        return NextResponse.json(lessonsList)
    } catch (error) {
        return NextResponse.json({error: error}, {status: 500})
    }
}