"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@clerk/nextjs"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"
import { Settings, User, Bell, Shield, Brain, Laptop, Mail, Lock, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

export default function SettingsPage() {
    const { user } = useUser();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }
        if (newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        setLoading(true);
        try {
            await api.post("/auth/change-password", { oldPassword, newPassword });
            toast.success("Password updated successfully");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Settings className="h-6 w-6" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Admin Settings</h1>
                </div>
                <p className="text-muted-foreground text-lg">Manage your recruiter account, team preferences, and AI configurations.</p>
            </motion.div>

            <Separator />

            <div className="grid gap-8">
                {/* Profile Information */}
                <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details visible to candidates.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-sm font-semibold">First Name</Label>
                                <Input id="firstName" defaultValue={user?.firstName || "Sarah"} className="rounded-xl border-muted-foreground/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-sm font-semibold">Last Name</Label>
                                <Input id="lastName" defaultValue={user?.lastName || "Connor"} className="rounded-xl border-muted-foreground/20" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold">Business Email</Label>
                            <Input id="email" defaultValue={user?.primaryEmailAddress?.emailAddress || "sarah@hirex.ai"} disabled className="rounded-xl bg-muted/50" />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 py-3">
                        <Button className="rounded-xl px-8 shadow-lg shadow-primary/20">Save Profile</Button>
                    </CardFooter>
                </Card>

                {/* Change Password Card */}
                <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                            <Lock className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                        </div>
                    </CardHeader>
                    <form onSubmit={handlePasswordChange}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword">Current Password</Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                    className="rounded-xl border-muted-foreground/20"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="rounded-xl border-muted-foreground/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="rounded-xl border-muted-foreground/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 py-3">
                            <Button type="submit" disabled={loading} className="rounded-xl px-8 shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* AI & Platform Settings */}
                <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                            <Brain className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>AI & Platform Config</CardTitle>
                            <CardDescription>Configure how the AI interviewer behaves and reports results.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Real-time Sentiment Analysis</p>
                                <p className="text-xs text-muted-foreground italic">Analyze candidate emotions during live sessions.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator className="opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Auto-Generate Reports</p>
                                <p className="text-xs text-muted-foreground">Instantly create PDF summaries after each interview.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator className="opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Direct Candidate Invites</p>
                                <p className="text-xs text-muted-foreground">Automatically send credentials to added candidates.</p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                {/* Communication */}
                <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                            <Mail className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Communication</CardTitle>
                            <CardDescription>Manage your team and candidate notification preferences.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Email Notifications</p>
                                <p className="text-xs text-muted-foreground">Get daily digests of interview completions.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
