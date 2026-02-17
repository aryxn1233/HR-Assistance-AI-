"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import Link from "next/link";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const response = await api.post("/auth/login", { email, password });
            // Expecting { access_token, user: { ... } } from backend
            // But backend currently returns only access_token. 
            // We need to fetch user profile or decode token.
            // For now, let's assume backend is updated to return user or we fetch it.

            // actually, let's just decode the token payload or fetch profile
            const token = response.data.access_token;

            // minimal user object from token payload assumption if backend doesn't return user
            // But better to fetch profile.
            // Let's try to fetch profile.

            // Temporary: manual decode or just use what we have. 
            // Let's assume we can fetch profile
            // But wait, the backend login endpoint just returns access_token.
            // Backend AuthService.login returns { access_token: ... }

            // We should probably update backend to return user details too, 
            // OR we fetch /auth/profile if that exists (it doesn't, but /candidates/profile exists for candidates).

            // Let's decode the token client side (simple parse) to get the role/id
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);

            const user = {
                id: payload.sub,
                email: payload.username,
                role: payload.role,
                firstName: "User", // Placeholder until we fetch profile
                lastName: ""
            };

            login(token, user);
        } catch (err: any) {
            setError(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                        <p className="text-center text-sm">
                            Don't have an account? <Link href="/register" className="text-blue-500 hover:underline">Register</Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
