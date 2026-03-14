import { db } from "@/configs/db";
import { doubtsTable, likesTable, repliesTable } from "@/configs/schema";
import { prioritizeDoubt, categorizeDoubt } from "@/lib/ai/categorizer";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const userName = searchParams.get("userName");

    try {
        let doubts;
        if (subject && subject !== "All") {
            doubts = await db.select()
                .from(doubtsTable)
                .where(eq(doubtsTable.subject, subject))
                .orderBy(desc(doubtsTable.createdAt));
        } else {
            doubts = await db.select()
                .from(doubtsTable)
                .orderBy(desc(doubtsTable.createdAt));
        }

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
        const { userName, subject, content, imageUrl } = await req.json();

        if (!userName || !subject || (!content?.trim() && !imageUrl)) {
            return NextResponse.json({ error: "Missing required fields (provide text or image)" }, { status: 400 });
        }

        // Auto-detect sub-topic using AI
        const subTopic = await categorizeDoubt(content || "", subject, imageUrl);

        const newDoubt = await db.insert(doubtsTable).values({
            userName,
            subject,
            subTopic,
            content,
            imageUrl,
        }).returning();

        return NextResponse.json(newDoubt[0]);
    } catch (error) {
        console.error("Error saving doubt:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
