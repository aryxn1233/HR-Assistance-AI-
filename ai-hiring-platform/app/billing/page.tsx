"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, CreditCard, Zap, Shield, History } from "lucide-react"
import { motion } from "framer-motion"

export default function BillingPage() {
    const plans = [
        {
            name: "Starter",
            price: "$0",
            description: "Perfect for exploring the platform",
            features: ["5 AI interviews / month", "Basic analytics", "Email support"],
            current: true,
            color: "border-border"
        },
        {
            name: "Professional",
            price: "$49",
            description: "Ideal for growing teams",
            features: ["Unlimited AI interviews", "Advanced behavior analysis", "Priority support", "Custom interview scripts"],
            current: false,
            color: "border-primary shadow-lg shadow-primary/20",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "Scalable solutions for large organizations",
            features: ["Dedicated account manager", "SSO & SAML", "On-premise deployment options", "Custom AI training"],
            current: false,
            color: "border-border"
        }
    ]

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-extrabold tracking-tight">Billing & Plans</h1>
                <p className="text-muted-foreground text-lg">Manage your subscription, payment methods, and billing history.</p>
            </motion.div>

            <Separator />

            <div className="grid gap-8 md:grid-cols-3">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className={`flex flex-col h-full transition-all hover:scale-[1.02] ${plan.color} relative overflow-hidden`}>
                            {plan.popular && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase px-3 py-1 rounded-bl-lg">
                                        Most Popular
                                    </div>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4 text-green-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={plan.current ? "secondary" : (plan.popular ? "default" : "outline")}
                                    disabled={plan.current}
                                >
                                    {plan.current ? "Current Plan" : (plan.price === "Custom" ? "Contact Sales" : "Upgrade Now")}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-none shadow-md bg-linear-to-br from-background to-muted/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Payment Method</CardTitle>
                            <CardDescription>Manage your payment details securely.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-2xl bg-background">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-14 bg-muted rounded-md flex items-center justify-center font-bold text-xs uppercase tracking-widest italic text-muted-foreground">
                                    Visa
                                </div>
                                <div>
                                    <p className="font-medium">•••• •••• •••• 4242</p>
                                    <p className="text-xs text-muted-foreground">Expires 12/26</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Add New Payment Method</Button>
                    </CardFooter>
                </Card>

                <Card className="border-none shadow-md bg-linear-to-br from-background to-muted/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Recent Invoices</CardTitle>
                            <CardDescription>Download your past transaction receipts.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { date: "Oct 24, 2023", amount: "$0.00", status: "Paid" },
                                { date: "Sep 24, 2023", amount: "$0.00", status: "Paid" }
                            ].map((invoice, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{invoice.date}</p>
                                        <p className="text-xs text-muted-foreground">INV-00{i + 1}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">{invoice.amount}</span>
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none">
                                            {invoice.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="link" className="w-full text-muted-foreground">View Full History</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
