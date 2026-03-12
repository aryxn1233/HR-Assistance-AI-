import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

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
    loading?: boolean
}

export function MetricCard({ title, value, description, icon: Icon, trend, loading }: MetricCardProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-36" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <p className={cn("text-xs flex items-center gap-1 mt-1", trend ? (trend.positive ? "text-green-600 dark:text-green-400" : "text-red-500") : "text-muted-foreground")}>
                        {trend && (
                            <>
                                {trend.positive
                                    ? <TrendingUp className="h-3 w-3" />
                                    : <TrendingDown className="h-3 w-3" />
                                }
                                <span className="font-semibold">{trend.positive ? "+" : ""}{trend.value}%</span>
                            </>
                        )}
                        <span className="text-muted-foreground">{description || trend?.label}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
