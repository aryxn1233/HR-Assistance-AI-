"use client"

import { SignIn } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/api";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = searchParams.get('role');
    const redirectUrl = role ? `/onboarding?role=${role}` : "/onboarding";

    const [showLegacy, setShowLegacy] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLegacyLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));

            router.push(user.role === 'recruiter' ? '/recruiter' : '/candidate');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-4">
                <div className="text-center space-y-2 mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">HireMe</h1>
                    <p className="text-muted-foreground text-sm font-medium">Your gateway to the next career move</p>
                </div>

                {!showLegacy ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SignIn
                            routing="path"
                            path="/login"
                            forceRedirectUrl={redirectUrl}
                            signUpForceRedirectUrl={redirectUrl}
                            appearance={{
                                elements: {
                                    rootBox: 'mx-auto w-full',
                                    card: 'shadow-xl border-border shadow-primary/5 rounded-2xl w-full',
                                    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm font-medium h-10',
                                    footerActionLink: 'text-primary hover:text-primary/80',
                                    identityPreviewText: 'text-foreground',
                                    socialButtonsBlockButton: 'border-border hover:bg-muted/50 transition-colors',
                                    dividerLine: 'bg-border',
                                    dividerText: 'text-muted-foreground'
                                },
                            }}
                        />
                        <div className="text-center pt-2">
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => setShowLegacy(true)}
                                className="text-muted-foreground hover:text-primary"
                            >
                                Prefer legacy email/password login?
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Card className="shadow-xl border-border shadow-primary/5 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-bold">Legacy Login</CardTitle>
                            <CardDescription>
                                Enter your email and password from your existing account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="py-2.5">
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}
                            <form onSubmit={handleLegacyLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-10 px-4 focus-visible:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-10 px-4 focus-visible:ring-primary"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-10 font-medium"
                                    disabled={loading}
                                >
                                    {loading ? "Logging in..." : "Log In"}
                                </Button>
                            </form>
                            <div className="text-center pt-2">
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setShowLegacy(false)}
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    Back to modern login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
