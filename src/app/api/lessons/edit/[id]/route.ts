import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/db/db";
import { lessons } from "../../../../../../lib/db/schema";
import { eq } from "drizzle-orm";



export async function POST(
    request: NextRequest,
    { params } : { params : Promise<{ id: string }>}
){
    try {
        const { id } = await params;
        const lessonId = parseInt(id);
        const editedLesson = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
        if (editedLesson.length === 0) {
            return NextResponse.json(
                { error: "Урока не найдено" },
                { status: 404 }
            )
        }

        // Обрабатываем запрос
        const body = await request.json();
        const {teacher, room, subject, day, time, group_number, color} = body;
        const updatedLesson = await db.update(lessons).set({
            subject: subject ?? editedLesson[0].subject,
            teacher: teacher ?? editedLesson[0].teacher,
            room: room ?? editedLesson[0].room,
            time: time ?? editedLesson[0].time,
            day_week: day ?? editedLesson[0].day_week,
            color: color ?? editedLesson[0].color,
            groupId: group_number ?? editedLesson[0].groupId
        }).where(eq(lessons.id, lessonId)).returning()

        // 5. Возвращаем результат
        return NextResponse.json(updatedLesson[0], { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error },
            {status: 500}
        )
    }
}