import { CandidateProfileCard } from "@/components/candidate/CandidateProfileCard"
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CandidatePage({ params }: { params: { id: string } }) {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Candidate Evaluation</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <CandidateProfileCard />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <ScoreBreakdown />
                </div>
            </div>
        </div>
    )
}
