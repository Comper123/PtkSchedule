import { NextRequest, NextResponse} from "next/server";
import { db } from "../../../../lib/db/db";
import { groups, lessons } from "../../../../lib/db/schema";
import { and, eq } from "drizzle-orm";


// POST /api/lessons - создать новый урок
export async function POST(request: NextRequest){
    try {
        const body = await request.json();
        const {teacher, room, subject, day, time, group_number, color} = body;
        if (!teacher) {
            return NextResponse.json({error: 'Преподаватель обязателен'},{status: 400});
        }
        if (!room) {
            return NextResponse.json({error: 'Аудитория обязательна'},{status: 400});
        }
        if (!subject) {
            return NextResponse.json({error: 'Предмет обязателен'},{status: 400});
        }
        if (!day) {
            return NextResponse.json({error: 'День обязателен'},{status: 400});
        }
        if (!time) {
            return NextResponse.json({error: 'Время обязательно'},{status: 400});
        }
        if (!group_number) {
            return NextResponse.json({error: 'Группа не передана'},{status: 400});
        }

        // Проверяем существование группы
        const group = await db.select().from(groups).where(eq(groups.number, group_number)).limit(1);
        if (group.length === 0) {
            return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
        }
        // Проверим урок на существование
        const checkLesson = await db.select().from(lessons)
        .where(
            and(
                eq(lessons.time, time),
                eq(lessons.day_week, day),
                eq(lessons.groupId, group_number)
            )).limit(1);
        if (checkLesson.length !== 0){
            console.log(checkLesson)
            return NextResponse.json({error: "Занятие на это время уже существует"}, {status: 500})
        }

        // Создаем урок
        const [newLesson] = await db.insert(lessons).values({
            subject,
            teacher,
            room,
            time,
            color,
            day_week: day,
            groupId: group_number
        }).returning()
        return NextResponse.json({status: 200})

    } catch (error) {
        return NextResponse.json({error: error}, {status: 500})
    }
}