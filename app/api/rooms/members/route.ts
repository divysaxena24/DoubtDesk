import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { membershipsTable } from '@/configs/schema';
import { eq, and } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(req: Request) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.primaryEmailAddress.emailAddress;
        const { searchParams } = new URL(req.url);
        const classroomIdStr = searchParams.get("classroomId");
        
        if (!classroomIdStr) {
            return NextResponse.json({ error: 'Classroom ID is required' }, { status: 400 });
        }

        const classroomId = parseInt(classroomIdStr);

        // Security: Check if requesting user is a member of this classroom
        const [membership] = await db
            .select()
            .from(membershipsTable)
            .where(
                and(
                    eq(membershipsTable.userEmail, email),
                    eq(membershipsTable.classroomId, classroomId)
                )
            );

        if (!membership) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Fetch all members of this classroom
        const members = await db
            .select({
                userEmail: membershipsTable.userEmail,
                role: membershipsTable.role,
                joinedAt: membershipsTable.joinedAt
            })
            .from(membershipsTable)
            .where(eq(membershipsTable.classroomId, classroomId));

        return NextResponse.json(members);

    } catch (error: any) {
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}
