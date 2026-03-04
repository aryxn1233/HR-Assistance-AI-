import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(['/', '/login(.*)', '/register(.*)', '/public(.*)'])

export default clerkMiddleware(async (auth, request) => {
    // We let AuthGuard.tsx handle route protection to support dual authentication
    // (Clerk + Legacy Database Login)
    return;
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
