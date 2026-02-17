import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, MessageSquare } from "lucide-react"

export function QuestionPanel() {
    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        AI Interviewer
                    </CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        Adaptive Mode
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Question</h3>
                    <p className="text-xl font-medium leading-relaxed">
                        "Can you describe a challenging technical problem you solved recently, specifically focusing on how you optimized the solution for performance?"
                    </p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Context</h3>
                    <p className="text-sm text-muted-foreground">
                        Evaluating: Problem Solving, System Design, Optimization Techniques.
                    </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium uppercase">Listening</span>
                    </div>
                    <p className="text-sm italic text-muted-foreground">
                        Waiting for candidate response...
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
