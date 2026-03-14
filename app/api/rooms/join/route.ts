import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { classroomsTable, membershipsTable, usersTable } from '@/configs/schema';
import { eq, and } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.primaryEmailAddress.emailAddress;
        const { inviteCode } = await req.json();

        if (!inviteCode) {
            return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
        }

        // 1. Find the classroom by invite code
        const [classroom] = await db
            .select()
            .from(classroomsTable)
            .where(eq(classroomsTable.inviteCode, inviteCode.toUpperCase()));

        if (!classroom) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
        }

        // 2. Check if already a member
        const [existingMember] = await db
            .select()
            .from(membershipsTable)
            .where(
                and(
                    eq(membershipsTable.userEmail, email),
                    eq(membershipsTable.classroomId, classroom.id)
                )
            );

        if (existingMember) {
            return NextResponse.json({ error: 'Already a member of this classroom' }, { status: 400 });
        }

        // 3. Get user role to determine membership role
        const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
        const role = dbUser?.role || 'student';

        // 4. Add membership
        const [newMembership] = await db.insert(membershipsTable).values({
            userEmail: email,
            classroomId: classroom.id,
            role: role
        }).returning();

        return NextResponse.json({ 
            success: true, 
            classroom: {
                id: classroom.id,
                name: classroom.name,
                university: classroom.university
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}
