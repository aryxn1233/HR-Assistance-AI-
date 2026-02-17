import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Brain, Activity } from "lucide-react"

export function ScoreBreakdown() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall AI Score</CardTitle>
                    <Brain className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">92/100</div>
                    <p className="text-xs text-muted-foreground">Top 5% of candidates</p>
                    <Progress value={92} className="mt-2 h-2" />
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
                    <div className="text-2xl font-bold text-blue-600">#1</div>
                    <p className="text-xs text-muted-foreground">In Senior React Dev Role</p>
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
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Technical Skills</span>
                            <span className="font-bold">95/100</span>
                        </div>
                        <Progress value={95} className="h-2" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Communication</span>
                            <span className="font-bold">88/100</span>
                        </div>
                        <Progress value={88} className="h-2" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Cultural Fit</span>
                            <span className="font-bold">90/100</span>
                        </div>
                        <Progress value={90} className="h-2" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Problem Solving</span>
                            <span className="font-bold">92/100</span>
                        </div>
                        <Progress value={92} className="h-2" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
