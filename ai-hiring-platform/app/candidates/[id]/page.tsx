"use client"

import { useEffect, useState } from "react"
import { CandidateProfileCard } from "@/components/candidate/CandidateProfileCard"
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import React from "react"
import api from "@/lib/api"
import { InterviewTranscript } from "@/components/candidate/InterviewTranscript"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const [interview, setInterview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Unwrap params as it is a promise in newer Next.js versions often
    // But in this setup checking package.json next version: 16.1.6
    // Params are async in Next 15+ server components, but this is "use client"
    // Wait, in "use client", params is not a promise usually? 
    // Actually in Next 15, params is awaitable in server components.
    // In client components, it's passed as prop. 
    // However, if we access it directly it might warn.
    // Let's use React.use() to unwrap if needed or just access it if satisfied.

    // Safer to treat params as potentially async or use simple props if Next 14/15 behavior varies.
    // Let's assume standard prop for now.

    // Warning: Next.js 15+ breaks params access in client components slightly if not handled.
    // But let's try standard access.
    // Actually, `params` type in the component signature above suggests I treated it as Promise.

    const [id, setId] = useState<string>("");

    useEffect(() => {
        (async () => {
            const resolvedParams = await params;
            setId(resolvedParams.id);
        })();
    }, [params]);

    useEffect(() => {
        if (!id) return;
        const fetchInterview = async () => {
            try {
                const response = await api.get(`/interviews/${id}`);
                setInterview(response.data);
            } catch (error) {
                console.error("Failed to fetch interview", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInterview();
    }, [id]);

    if (loading) return <div className="p-6">Loading candidate details...</div>;
    if (!interview) return <div className="p-6">Candidate not found</div>;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/candidates">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Candidate Evaluation</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <CandidateProfileCard interview={interview} />
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Evaluation Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {interview.feedback?.summary || "The candidate participated in the AI interview. The evaluation highlights their technical proficiency and communication style based on the conversational history shown."}
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <ScoreBreakdown interview={interview} />
                    <InterviewTranscript history={interview.history || []} />
                </div>
            </div>
        </div>
    )
}
