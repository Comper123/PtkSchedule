import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db/db";
import { groups } from "../../../../../lib/db/schema";
import { eq } from "drizzle-orm";


// GET /api/groups/[id] - получить группу по number
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }>}
) {
    const { id } = await params; 
    try {
        const [group] = await db.select().from(groups).where(eq(groups.number, id));
        return NextResponse.json(group);
    } catch (error) {
        return NextResponse.json({error: error}, {status: 500})
    }
}