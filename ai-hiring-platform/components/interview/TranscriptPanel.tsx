import { ScrollArea } from "@/components/ui/scroll-area"

export function TranscriptPanel() {
    return (
        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="space-y-4">
                <div>
                    <span className="text-xs font-bold text-blue-500 uppercase">Interviewer</span>
                    <p className="text-sm">Can you tell me about yourself?</p>
                </div>
                <div>
                    <span className="text-xs font-bold text-green-500 uppercase">Candidate</span>
                    <p className="text-sm">Sure. I have 5 years of experience in full-stack development...</p>
                </div>
                <div>
                    <span className="text-xs font-bold text-blue-500 uppercase">Interviewer</span>
                    <p className="text-sm">Great. What is your experience with React?</p>
                </div>
                <div>
                    <span className="text-xs font-bold text-green-500 uppercase">Candidate</span>
                    <p className="text-sm">I have been using React since version 16.8, primarily focusing on functional components and hooks. I've built several large-scale applications...</p>
                </div>
            </div>
        </ScrollArea>
    )
}
