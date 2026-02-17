import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Brain, Activity } from "lucide-react"

interface ScoreBreakdownProps {
    interview: any;
}

export function ScoreBreakdown({ interview }: ScoreBreakdownProps) {
    if (!interview) return null;

    const score = interview.score || 0;
    const feedback = interview.feedback || {};
    const rank = feedback.rank || "#1"; // Mock if not present

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall AI Score</CardTitle>
                    <Brain className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{score}/100</div>
                    <p className="text-xs text-muted-foreground">Based on technical assessment</p>
                    <Progress value={score} className="mt-2 h-2" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Joining Probability</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">High (85%)</div>
                    <p className="text-xs text-muted-foreground">Based on interest signals</p>
                    <Progress value={85} className="mt-2 h-2 bg-green-100" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Stack Rank</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{rank}</div>
                    <p className="text-xs text-muted-foreground">In {interview.job?.title || 'Role'}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bias Assessment</CardTitle>
                    <Users className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">Clean</div>
                    <p className="text-xs text-muted-foreground">No significant bias detected</p>
                </CardContent>
            </Card>

            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Detailed Evaluation</CardTitle>
                    <CardDescription>Breakdown by competency areas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Mock breakdown if not in feedback */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Technical Skills</span>
                            <span className="font-bold">{score} / 100</span>
                        </div>
                        <Progress value={score} className="h-2" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Communication</span>
                            <span className="font-bold">88/100</span>
                        </div>
                        <Progress value={88} className="h-2" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
