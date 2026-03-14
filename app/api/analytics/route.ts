import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { doubtsTable } from '@/configs/schema';
import { desc, sql, and, isNull, eq } from 'drizzle-orm';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const classroomIdStr = searchParams.get("classroomId");
    const classroomId = classroomIdStr ? parseInt(classroomIdStr) : null;

    try {
        let trendingConditions = [];
        let askedConditions = [];

        if (classroomId) {
            trendingConditions.push(eq(doubtsTable.classroomId, classroomId));
            askedConditions.push(eq(doubtsTable.classroomId, classroomId));
        } else {
            trendingConditions.push(isNull(doubtsTable.classroomId));
            askedConditions.push(isNull(doubtsTable.classroomId));
        }

        // 1. Trending Doubts
        const trendingDoubts = await db.select({
            id: doubtsTable.id,
            content: doubtsTable.content,
            subject: doubtsTable.subject,
            createdAt: doubtsTable.createdAt
        })
            .from(doubtsTable)
            .where(and(...trendingConditions))
            .orderBy(desc(doubtsTable.createdAt))
            .limit(5);

        // 2. Most Asked Topics
        const countField = sql<number>`count(${doubtsTable.id})`;
        const mostAskedTopics = await db.select({
            subject: doubtsTable.subject,
            count: countField.as('count')
        })
            .from(doubtsTable)
            .where(and(...askedConditions))
            .groupBy(doubtsTable.subject)
            .orderBy(desc(sql`count`))
            .limit(5);

        // 3. Weak Topics (Just the high volume ones for now, or could be others)
        // Let's just return the same but labeled differently or with more data
        const weakTopics = mostAskedTopics.map((topic, index) => ({
            ...topic,
            severity: index === 0 ? 'High' : index < 3 ? 'Medium' : 'Low'
        }));

        return NextResponse.json({
            trendingDoubts,
            mostAskedTopics,
            weakTopics
        });

    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({
            trendingDoubts: [],
            mostAskedTopics: [],
            weakTopics: []
        });
    }
}
