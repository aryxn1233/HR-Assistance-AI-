import { QuestionPanel } from "@/components/interview/QuestionPanel"
import { TranscriptPanel } from "@/components/interview/TranscriptPanel"
import { WebcamPreview } from "@/components/interview/WebcamPreview"
import { Button } from "@/components/ui/button"

export default function InterviewPage() {
    return (
        <div className="flex h-[calc(100vh-theme(spacing.20))] flex-col gap-4 p-4 md:flex-row">
            <div className="flex flex-1 flex-col gap-4">
                <QuestionPanel />
                <TranscriptPanel />
            </div>
            <div className="flex flex-1 flex-col gap-4">
                <WebcamPreview />
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">Controls</span>
                        <span className="text-xs text-muted-foreground">Press Space to talk</span>
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1" variant="outline">Skip Question</Button>
                        <Button className="flex-1">Next Question</Button>
                    </div>
                    <Button variant="destructive" className="w-full mt-2">End Interview</Button>
                </div>
            </div>
        </div>
    )
}
