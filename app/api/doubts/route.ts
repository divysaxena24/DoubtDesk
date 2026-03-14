import { db } from "@/configs/db";
import { doubtsTable, likesTable, repliesTable, membershipsTable, classroomsTable } from "@/configs/schema";
import { and, eq, desc, isNull, or, not } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const userName = searchParams.get("userName");
    const classroomIdStr = searchParams.get("classroomId");
    const classroomId = classroomIdStr ? parseInt(classroomIdStr) : null;
    const type = searchParams.get("type") || 'community';

    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const email = user.primaryEmailAddress?.emailAddress;

        // Security: If classroomId is provided, check membership
        if (classroomId && email) {
            const [membership] = await db.select().from(membershipsTable).where(
                and(
                    eq(membershipsTable.userEmail, email),
                    eq(membershipsTable.classroomId, classroomId)
                )
            );
            if (!membership) {
                return NextResponse.json({ error: "Access denied to this classroom" }, { status: 403 });
            }
        }

        let query = db.select().from(doubtsTable);
        let conditions = [];

        // Base Classroom scoping
        if (classroomId) {
            conditions.push(eq(doubtsTable.classroomId, classroomId));
        } else {
            conditions.push(isNull(doubtsTable.classroomId));
        }

        // Fetch classroom role info
        const [room] = classroomId ? await db.select().from(classroomsTable).where(eq(classroomsTable.id, classroomId)) : [null];
        const isTeacher = room && email && room.teacherEmail === email;

        // GLOBAL VISIBILITY FILTER
        // If not the teacher, you can only see 'teacher' doubts if you are the owner
        if (!isTeacher && email) {
            conditions.push(
                or(
                    not(eq(doubtsTable.type, 'teacher')),
                    eq(doubtsTable.userEmail, email)
                )
            );
        } else if (!isTeacher && !email) {
            // Extreme fallback: if no email, only show non-teacher doubts
            conditions.push(not(eq(doubtsTable.type, 'teacher')));
        }

        // Filters
        if (subject && subject !== "All") {
            conditions.push(eq(doubtsTable.subject, subject));
        }

        if (type && type !== "All") {
            conditions.push(eq(doubtsTable.type, type));
        }

        let doubts = await query.where(and(...conditions)).orderBy(desc(doubtsTable.createdAt));

        if (userName && doubts.length > 0) {
            const userLikes = await db.select({ doubtId: likesTable.doubtId })
                .from(likesTable)
                .where(eq(likesTable.userName, userName));
            
            const likedIds = new Set(userLikes.map(l => l.doubtId));
            
            doubts = doubts.map(doubt => ({
                ...doubt,
                hasLiked: likedIds.has(doubt.id)
            }));
        }

        // Fetch reply counts using an aggregate query
        const replyCounts = await db.select({
            doubtId: repliesTable.doubtId,
            count: db.$count(repliesTable)
        })
        .from(repliesTable)
        .groupBy(repliesTable.doubtId);

        const countsMap = Object.fromEntries(replyCounts.map(r => [r.doubtId, r.count]));

        doubts = doubts.map(doubt => ({
            ...doubt,
            replyCount: countsMap[doubt.id] || 0
        }));

        return NextResponse.json(doubts);
    } catch (error) {
        console.error("Error fetching doubts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const email = user.primaryEmailAddress?.emailAddress;
        const { userName, subject, content, imageUrl, classroomId, type = 'community' } = await req.json();

        if (!userName || !subject || (!content?.trim() && !imageUrl)) {
            return NextResponse.json({ error: "Missing required fields (provide text or image)" }, { status: 400 });
        }

        const newDoubt = await db.insert(doubtsTable).values({
            userName,
            userEmail: email || null,
            subject,
            content,
            imageUrl,
            classroomId: classroomId ? parseInt(classroomId.toString()) : null,
            type
        }).returning();

        return NextResponse.json(newDoubt[0]);
    } catch (error) {
        console.error("Error saving doubt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
