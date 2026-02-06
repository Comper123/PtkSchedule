import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db/db";
import { groups } from "../../../../../lib/db/schema";
import { eq } from "drizzle-orm";


// GET /api/groups/[id] - получить группу по number
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string }}
) {
    try {
        // const groupId = parseInt(params.number);
        // if (isNaN(groupId)) { return NextResponse.json({ error: 'Invalid group Number' },{ status: 400 });}
        const [group] = await db.select().from(groups).where(eq(groups.number, params.id));
        return NextResponse.json(group);
    } catch (error) {
        return NextResponse.json({error: error}, {status: 500})
    }
}