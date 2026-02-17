"use client"

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const funnelData = [
    { stage: "Applied", count: 1200, fill: "hsl(var(--primary))" },
    { stage: "Screening", count: 800, fill: "hsl(var(--primary))" },
    { stage: "Interview", count: 450, fill: "hsl(var(--primary))" },
    { stage: "Offer", count: 120, fill: "hsl(var(--primary))" },
    { stage: "Hired", count: 95, fill: "hsl(var(--primary))" },
]

const sourceData = [
    { name: "LinkedIn", value: 400 },
    { name: "Referral", value: 300 },
    { name: "Website", value: 300 },
    { name: "Agency", value: 200 },
]

const timeData = [
    { month: "Jan", days: 25 },
    { month: "Feb", days: 22 },
    { month: "Mar", days: 20 },
    { month: "Apr", days: 18 },
    { month: "May", days: 15 },
    { month: "Jun", days: 14 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export function AnalyticsCharts() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Hiring Funnel</CardTitle>
                    <CardDescription>Candidate progression through stages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart layout="vertical" data={funnelData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="stage" type="category" width={80} />
                            <Tooltip cursor={{ fill: "transparent" }} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Source Distribution</CardTitle>
                    <CardDescription>Where candidates are coming from.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {sourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Time to Hire</CardTitle>
                    <CardDescription>Average days to hire over time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={timeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="days" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
