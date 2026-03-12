/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const scoreData = [
    { range: "0-50", count: 12 },
    { range: "50-60", count: 25 },
    { range: "60-70", count: 45 },
    { range: "70-80", count: 30 },
    { range: "80-90", count: 18 },
    { range: "90-100", count: 8 },
]

const skillData = [
    { subject: "Technical", A: 120, B: 110, fullMark: 150 },
    { subject: "Communication", A: 98, B: 130, fullMark: 150 },
    { subject: "Problem Solving", A: 86, B: 130, fullMark: 150 },
    { subject: "Cultural Fit", A: 99, B: 100, fullMark: 150 },
    { subject: "Experience", A: 85, B: 90, fullMark: 150 },
    { subject: "Leadership", A: 65, B: 85, fullMark: 150 },
]

const chartConfig = {
    count: {
        label: "Candidates",
        color: "var(--chart-1)",
    },
}

export function AIAnalyticsCharts() {
    return (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">AI Score Distribution</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Distribution of candidate scores across recent interviews.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-0 sm:pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={scoreData}>
                            <XAxis
                                dataKey="range"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: "transparent" }}
                                contentStyle={{ borderRadius: "8px" }}
                            />
                            <Bar
                                dataKey="count"
                                fill="var(--primary)"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Skill Evaluation Radar</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Average candidate performace by category.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                    <ResponsiveContainer width="100%" height={350}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                            <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--foreground)", fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar
                                name="Average"
                                dataKey="B"
                                stroke="var(--primary)"
                                fill="var(--primary)"
                                fillOpacity={0.3}
                            />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
