import { db } from "@/configs/db";
import { usersTable } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Checks if a user is currently blocked based on their email.
 * Returns an object containing the block status, an error response if blocked, and the database user object.
 */
export async function checkUserBlock(email: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    
    if (user?.blockedUntil && new Date(user.blockedUntil) > new Date()) {
        const unlockDate = new Date(user.blockedUntil).toDateString();
        return {
            isBlocked: true,
            errorResponse: NextResponse.json({ 
                error: `Your account is temporarily blocked due to safety violations. Access will be restored on ${unlockDate}.` 
            }, { status: 403 }),
            dbUser: user
        };
    }
    
    return { 
        isBlocked: false, 
        errorResponse: undefined, 
        dbUser: user 
    };
}
