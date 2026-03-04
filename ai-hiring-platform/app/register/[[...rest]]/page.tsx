"use client"

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const redirectUrl = role ? `/onboarding?role=${role}` : "/onboarding";

    return (
        <div className="flex items-center justify-center min-h-screen">
            <SignUp
                routing="path"
                path="/register"
                forceRedirectUrl={redirectUrl}
                signInForceRedirectUrl={redirectUrl}
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm',
                    },
                }}
            />
        </div>
    );
}
