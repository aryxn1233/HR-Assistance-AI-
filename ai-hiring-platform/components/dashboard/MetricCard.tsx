import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    trend?: {
        value: number
        label: string
        positive?: boolean
    }
}

export function MetricCard({ title, value, description, icon: Icon, trend }: MetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <p className="text-muted-foreground text-xs">
                        {trend && (
                            <span className={trend.positive ? "text-green-500" : "text-red-500"}>
                                {trend.positive ? "+" : ""}{trend.value}%
                            </span>
                        )}
                        {trend && " "}
                        {description || trend?.label}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
