import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db/db";
import { groups } from "../../../../lib/db/schema";


// GET /api/groups - получить все группы
export async function GET(){
    try {
        const groupList = await db.select().from(groups);
        return NextResponse.json(groupList);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: error }, { status: 500});
    }
}


// POST /api/groups - создать группу
export async function POST(request: NextRequest){
    try {
        const body = await request.json();
        const {number, countStudent} = body;
        if (!number){
            return NextResponse.json({error: 'Номер группы обязателен'},{status: 400});
        }
        if (!countStudent){
            return NextResponse.json({error: 'Кол-во студентов в группе обязательно'},{status: 400});
        }
        const [newGroup] = await db.insert(groups).values({number, countStudent}).returning();
        return NextResponse.json(newGroup, {status: 201})
    } catch (error) {
        return NextResponse.json({error: error}, {status: 500});
    }
}