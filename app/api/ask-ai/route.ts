import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/configs/db';
import { doubtsTable, repliesTable } from '@/configs/schema';
import { eq } from 'drizzle-orm';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SUBJECT_LIST = 'Algebra, Calculus, Geometry, Trigonometry, Statistics, Physics, Chemistry, Biology, Operating Systems, Networking, Data Structures, Algorithms, Programming, Computer Science, Economics, Accounting, English, Other';

// PRIORITY MODELS (Vision & Text)
const VISION_MODELS = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "pixtral-12b-2409",
    "llama-3.2-90b-vision-preview"
];

const TEXT_MODELS = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.1-70b-versatile"
];

async function callGroqWithFallback(messages: any[], isVision: boolean) {
    const models = isVision ? VISION_MODELS : TEXT_MODELS;
    let lastError = null;

    for (const model of models) {
        try {
            console.log(`Attempting Groq request with model: ${model}`);
            const completion = await groq.chat.completions.create({
                messages,
                model,
                temperature: 0.5,
                max_tokens: 2048,
                top_p: 1,
            });
            return { completion, modelUsed: model };
        } catch (err: any) {
            console.warn(`Model ${model} failed:`, err?.message);
            lastError = err;
            // Continue to next model if it's a 404, 400 (decommissioned), or 401
            if (err?.status === 404 || err?.status === 400 || err?.status === 401) continue;
            throw err; // For other errors (like rate limits), throw immediately
        }
    }
    throw lastError;
}

export async function POST(req: Request) {
    try {
        const { userId, sessionClaims } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to get name from claims, fallback to currentUser for full detail if needed for DB
        let fullName = (sessionClaims as any)?.full_name || (sessionClaims as any)?.name || "";

        if (!fullName) {
             const user = await currentUser();
             fullName = user?.fullName || "";
        }

        const body = await req.json();
        const { prompt, type = 'standard', imageBase64, classroomId } = body;

        if (!prompt && !imageBase64) {
            return NextResponse.json({ error: 'Prompt or image is required' }, { status: 400 });
        }

        let systemPrompt = `You are an expert AI Doubt Solver. Always respond in clean, well-spaced markdown.
VERY FIRST LINE of your response must be exactly this (nothing before it):
SUBJECT: [Detected Subject]
Choose the subject from: ${SUBJECT_LIST}

Then structure your response using EXACTLY these 3 sections with ## headings:
## Step-by-step explanation
## Simplified explanation
## Final Answer`;

        if (type === 'simple') {
            systemPrompt = `You are an expert AI Doubt Solver. VERY FIRST LINE must be: SUBJECT: [Detected Subject from: ${SUBJECT_LIST}]
Then write 3-5 short paragraphs using plain English and a real-world analogy. No LaTeX or formulas.`;
        } else if (type === 'exam') {
            systemPrompt = `You are a strict exam-focused AI Tutor. VERY FIRST LINE must be: SUBJECT: [Detected Subject from: ${SUBJECT_LIST}]
Then provide an EXAM-READY answer with Key Formula, Step-by-step, Common mistakes, and Examiner keywords.`;
        }

        const isVisionRequest = !!imageBase64;
        let userMessageContent: any = prompt || "Please solve the problem in the image.";

        if (isVisionRequest) {
            const visionInstruction = `Analyze the image. VERY FIRST LINE must be: SUBJECT: [Detected Subject from: ${SUBJECT_LIST}]
Then solve it using Step-by-step explanation, Simplified explanation, and Final Answer sections.
${prompt ? `Additional context from student: ${prompt}` : ''}`;

            userMessageContent = [
                { type: "text", text: visionInstruction },
                { type: "image_url", image_url: { url: imageBase64 } }
            ];
        }

        const messages: any[] = [];
        if (!isVisionRequest) messages.push({ role: "system", content: systemPrompt });
        messages.push({ role: "user", content: userMessageContent });

        const { completion, modelUsed } = await callGroqWithFallback(messages, isVisionRequest);
        let reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

        // Extract and strip the SUBJECT line
        let subject: string = 'Other';
        const subjectMatch = reply.match(/^SUBJECT:\s*(.+)/im);
        if (subjectMatch) {
            subject = subjectMatch[1].trim();
            reply = reply.replace(/^SUBJECT:\s*.+\n?/im, '').trimStart();
        }

        // --- FULL PERSISTENCE LOGIC ---
        try {
            const [newDoubt] = await db.insert(doubtsTable).values({
                userName: fullName || `Student_${Math.floor(Math.random() * 1000)}`,
                subject: subject,
                content: prompt || "Visual Inquiry",
                imageUrl: imageBase64?.slice(0, 500),
                classroomId: classroomId ? parseInt(classroomId.toString()) : null,
                isSolved: "solved"
            }).returning();

            if (newDoubt) {
                const [aiReply] = await db.insert(repliesTable).values({
                    doubtId: newDoubt.id,
                    userName: "DoubtDesk AI",
                    type: "solution",
                    content: reply,
                }).returning();

                if (aiReply) {
                    await db.update(doubtsTable).set({ solvedReplyId: aiReply.id }).where(eq(doubtsTable.id, newDoubt.id));
                }
            }
        } catch (dbErr) {
            console.error('Failed to fully persist AI doubt and solution:', dbErr);
        }

        return NextResponse.json({ reply, subject, model: modelUsed });

    } catch (error: any) {
        console.error('Error in Groq API Flow:', error);
        return NextResponse.json(
            { error: error?.message || 'The AI service is currently overloaded or experiencing issues. Please try again in 30 seconds.' },
            { status: 500 }
        );
    }
}
