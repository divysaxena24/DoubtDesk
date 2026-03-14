import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { classroomsTable, membershipsTable, usersTable } from '@/configs/schema';
import { eq, and } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

// 1. GET: List classrooms for the user + Recommendations
export async function GET(req: Request) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.primaryEmailAddress.emailAddress;

        // Get user details for recommendations
        const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));

        // Fetch classrooms where user is a member
        const joinedRooms = await db
            .select({
                id: classroomsTable.id,
                name: classroomsTable.name,
                university: classroomsTable.university,
                year: classroomsTable.year,
                teacherEmail: classroomsTable.teacherEmail,
                inviteCode: classroomsTable.inviteCode,
                role: membershipsTable.role
            })
            .from(classroomsTable)
            .innerJoin(membershipsTable, eq(classroomsTable.id, membershipsTable.classroomId))
            .where(eq(membershipsTable.userEmail, email));

        // Fetch recommendations (same university and year, not joined)
        let recommendedRooms: any[] = [];
        if (dbUser?.university) {
            const joinedIds = joinedRooms.map(r => r.id);
            
            // Build query for recommendations
            const query = db.select({
                id: classroomsTable.id,
                name: classroomsTable.name,
                university: classroomsTable.university,
                year: classroomsTable.year,
                teacherEmail: classroomsTable.teacherEmail,
            })
            .from(classroomsTable)
            .where(and(
                eq(classroomsTable.university, dbUser.university),
                eq(classroomsTable.year, dbUser.year || '1st Year')
            ));

            const allRecommended = await query;
            recommendedRooms = allRecommended.filter(r => !joinedIds.includes(r.id));
        }

        return NextResponse.json({
            joined: joinedRooms,
            recommended: recommendedRooms
        });

    } catch (error: any) {
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}

// 2. POST: Create a classroom (Teacher Only)
export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.primaryEmailAddress.emailAddress;
        
        // Final check for teacher/admin role in DB
        const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (!dbUser || (dbUser.role !== 'teacher' && dbUser.role !== 'admin')) {
            return NextResponse.json({ error: 'Only teachers can create classrooms' }, { status: 403 });
        }

        const { name, year } = await req.json();
        if (!name || !year) {
            return NextResponse.json({ error: 'Name and Year are required' }, { status: 400 });
        }

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Transactional insert: Create room and Add teacher as member
        const [newRoom] = await db.insert(classroomsTable).values({
            name,
            university: dbUser.university || 'Unspecified',
            year,
            teacherEmail: email,
            inviteCode
        }).returning();

        if (newRoom) {
            await db.insert(membershipsTable).values({
                userEmail: email,
                classroomId: newRoom.id,
                role: 'teacher'
            });
        }

        return NextResponse.json(newRoom);

    } catch (error: any) {
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}
