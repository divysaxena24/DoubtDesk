import { db } from "@/configs/db";
import { doubtsTable, likesTable, repliesTable, membershipsTable } from "@/configs/schema";
import { and, eq, desc, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const userName = searchParams.get("userName");
    const classroomIdStr = searchParams.get("classroomId");
    const classroomId = classroomIdStr ? parseInt(classroomIdStr) : null;

    try {
        const user = await currentUser();
        const email = user?.primaryEmailAddress?.emailAddress;

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

        if (classroomId) {
            conditions.push(eq(doubtsTable.classroomId, classroomId));
        } else {
            // Public doubts only (where classroomId is null)
            conditions.push(isNull(doubtsTable.classroomId));
        }

        if (subject && subject !== "All") {
            conditions.push(eq(doubtsTable.subject, subject));
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

        // Fetch reply counts
        const allReplies = await db.select({ doubtId: repliesTable.doubtId })
            .from(repliesTable);
        
        const countsMap: Record<number, number> = {};
        allReplies.forEach(r => {
            countsMap[r.doubtId] = (countsMap[r.doubtId] || 0) + 1;
        });

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
        const { userName, subject, content, imageUrl, classroomId } = await req.json();

        if (!userName || !subject || (!content?.trim() && !imageUrl)) {
            return NextResponse.json({ error: "Missing required fields (provide text or image)" }, { status: 400 });
        }

        const newDoubt = await db.insert(doubtsTable).values({
            userName,
            subject,
            content,
            imageUrl,
            classroomId: classroomId ? parseInt(classroomId.toString()) : null,
        }).returning();

        return NextResponse.json(newDoubt[0]);
    } catch (error) {
        console.error("Error saving doubt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
