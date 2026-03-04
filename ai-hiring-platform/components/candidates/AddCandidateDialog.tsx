"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import api from "@/lib/api"
import { useUser } from "@clerk/nextjs"

interface AddCandidateDialogProps {
    onCandidateAdded: () => void;
}

export function AddCandidateDialog({ onCandidateAdded }: AddCandidateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        resumeText: "",
        role: "Software Engineer", // Default target role
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create a User for the candidate (simplified flow)
            // Ideally we invite them or they register. 
            // For this MVP, we might create a user account directly OR just create a candidate profile linked to a dummy user if allowed.
            // But Candidate entity has OneToOne with User.
            // So we must register a user first.

            const password = "password123"; // Default password for manually added candidates

            const registerResponse = await api.post("/auth/register", {
                email: formData.email,
                password: password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: 'candidate'
            });

            // Login implicitly? No, we are recruiter adding a candidate.
            // logic in backend auth/register creates user. 
            // Now we need to create candidate profile.
            // But we don't have the token for that new user to call /candidates/profile as them.
            // And we as Recruiter can't create profile for them via /candidates/profile (that uses req.user.userId).

            // Workaround: 
            // 1. Update Candidate entity/service to allow creating candidate for specific userId (admin/recruiter only).
            // OR 2. Just parse resume and store result without linking to user account yet (but schema requires userId).

            // Let's assume for this MVP we just use the Parse Resume endpoint and maybe store it.
            // BUT `CandidatesService.create` requires `userId`.

            // Correct approach for MVP:
            // We will skip user creation for "Add Candidate" button and just focus on "Resume Parsing" demo 
            // OR implement a proper "Invite Candidate" flow.

            // Let's implement a simple "Parse Resume" action that creates a candidate profile for the CURRENT user (if testing as candidate)
            // OR if we are recruiter, we probably want to see how resume parsing works.

            // Actually, let's just create a candidate linked to the *current* user for demo purposes if they are a candidate,
            // OR if they are recruiter, maybe we just console log "Invite sent".

            // Let's try to register the user and then use a special admin endpoint to link profile? 
            // Too complex for now.

            // Simplest: Just use the Parse Resume endpoint and display results, 
            // but to persist them we need a user.

            // Let's change the flow: "Add Candidate" just creates a mock entry for now or 
            // we assume the user is adding *themselves* as a candidate (Apply flow).

            // Let's make this an "Apply" modal for the candidate view?
            // But the button is on "Candidates" page which is usually for recruiters.

            // Okay, let's just do the register flow and ignore the auth token issue for a second.
            // We can't create candidate profile without being logged in as them.

            // Re-pivot: "Add Candidate" -> "Upload Resume". 
            // Calls `/candidates/parse-resume` and displays the extracted structure.
            // This showcases the AI.

            // This showcases the AI.

            const response = await api.post("/candidates", {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                resumeText: formData.resumeText
            });
            console.log("Candidate Created:", response.data);
            alert("Candidate Added Successfully!");
            setOpen(false);
            onCandidateAdded();

        } catch (error: any) {
            console.error("Failed to add candidate", error);
            // If user already exists, maybe we can just say "User exists".
            alert("Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Candidate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Candidate</DialogTitle>
                    <DialogDescription>
                        Enter candidate details and resume text to parse.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="firstName" className="text-right">
                                First Name
                            </Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastName" className="text-right">
                                Last Name
                            </Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="resumeText" className="text-right">
                                Resume Text
                            </Label>
                            <Textarea
                                id="resumeText"
                                name="resumeText"
                                placeholder="Paste resume content here..."
                                value={formData.resumeText}
                                onChange={handleChange}
                                className="col-span-3 h-32"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Processing..." : "Parse & Add"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
