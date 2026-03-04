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
import { Bell, Lock, User, Globe, ShieldCheck, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

export default function CandidateSettingsPage() {
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
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-lg">Manage your account preferences and security.</p>
            </motion.div>

            <Separator />

            <div className="grid gap-8">
                {/* Profile Section */}
                <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription>Update your basic account information.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-sm font-semibold">First Name</Label>
                                <Input id="firstName" defaultValue={user?.firstName || ""} className="rounded-xl border-muted-foreground/20 focus:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-sm font-semibold">Last Name</Label>
                                <Input id="lastName" defaultValue={user?.lastName || ""} className="rounded-xl border-muted-foreground/20 focus:ring-primary/20" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                            <Input id="email" defaultValue={user?.primaryEmailAddress?.emailAddress || ""} disabled className="rounded-xl bg-muted/50 cursor-not-allowed" />
                        </div>
                        <Button className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">Save Changes</Button>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                            <Lock className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password to keep your account secure.</CardDescription>
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

                {/* Notifications Section */}
                <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                            <Bell className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Choose how you want to be notified about job updates.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Interview Reminders</p>
                                <p className="text-xs text-muted-foreground">Receive alerts 30 minutes before your scheduled AI interview.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator className="opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Application Updates</p>
                                <p className="text-xs text-muted-foreground">Get notified when a recruiter views or updates your status.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Section (SSO/2FA Mockup) */}
                <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/30">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Privacy & Security</CardTitle>
                            <CardDescription>Manage your additional security layers.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Two-Factor Authentication</p>
                                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-lg">Setup</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
