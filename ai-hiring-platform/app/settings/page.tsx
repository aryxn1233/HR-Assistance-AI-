"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/auth-context"

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="flex flex-col gap-6 p-6 md:p-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and platform preferences.</p>
            </div>

            <Separator />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" defaultValue={user?.firstName || "Sarah"} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" defaultValue={user?.lastName || "Connor"} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" defaultValue={user?.email || "sarah@hirex.ai"} disabled />
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Platform Settings</CardTitle>
                        <CardDescription>Configure AI behavior and notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Real-time Video Analysis</Label>
                                <p className="text-sm text-muted-foreground italic">Currently simulated</p>
                            </div>
                            <Button variant="outline" size="sm">Enabled</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Direct Email Invites</Label>
                                <p className="text-sm text-muted-foreground">Automatically send credentials to added candidates</p>
                            </div>
                            <Button variant="outline" size="sm">Disabled</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
