/* eslint-disable @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { motion } from "framer-motion"
import {
    Briefcase, Users, Brain, Shield, Zap, Globe,
    ArrowRight, Video, Star, Check, ChevronRight, Menu
} from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/ui/mode-toggle"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

// ─── Animation Helpers ────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay } }),
}

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background selection:bg-primary/20 scroll-smooth">
            {/* ── Header ─────────────────────────────────────────── */}
            <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm">
                            H
                        </div>
                        <span className="text-xl font-bold tracking-tight">HireMe</span>
                    </div>
                    <nav className="hidden items-center gap-8 md:flex">
                        <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How it Works</a>
                        <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
                        <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <ModeToggle />
                        <div className="hidden sm:flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Log In</Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm" className="rounded-full shadow-lg shadow-primary/20">
                                    Get Started <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>

                        {/* Mobile Menu Trigger */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                    <SheetHeader>
                                        <SheetTitle className="text-left flex items-center gap-2">
                                            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded font-bold text-xs">
                                                H
                                            </div>
                                            HireMe
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col gap-6 pt-12">
                                        <nav className="flex flex-col gap-4">
                                            <a href="#features" className="text-lg font-medium hover:text-primary transition-colors">Features</a>
                                            <a href="#how-it-works" className="text-lg font-medium hover:text-primary transition-colors">How it Works</a>
                                            <a href="#pricing" className="text-lg font-medium hover:text-primary transition-colors">Pricing</a>
                                            <a href="#faq" className="text-lg font-medium hover:text-primary transition-colors">FAQ</a>
                                        </nav>
                                        <div className="flex flex-col gap-3 pt-6 border-t">
                                            <Link href="/login" className="w-full">
                                                <Button variant="outline" className="w-full justify-start py-6 text-base rounded-xl">Log In</Button>
                                            </Link>
                                            <Link href="/register" className="w-full">
                                                <Button className="w-full justify-start py-6 text-base rounded-xl shadow-lg shadow-primary/20">
                                                    Get Started <ChevronRight className="ml-auto h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* ── Hero ─────────────────────────────────────────── */}
                <section className="relative overflow-hidden pb-12 pt-24 md:pb-20 md:pt-32 lg:pt-48">
                    {/* Background gradient blobs */}
                    <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 overflow-hidden blur-3xl">
                        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#ff80b5] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
                    </div>

                    <div className="container mx-auto px-4 text-center">
                        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
                            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-sm font-semibold text-primary">
                                🚀 The Future of Recruitment is Here
                            </Badge>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 leading-tight">
                                Hire Smarter with <br className="hidden sm:block" />
                                <span className="text-primary">AI‑Powered</span> Interviews
                            </h1>
                            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-12">
                                Automate technical screenings, rank candidates using advanced AI, and conduct life-like avatar interviews.
                                Join companies transforming how they hire the world's best talent.
                            </p>
                        </motion.div>

                        {/* Role Selection Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mb-16"
                        >
                            {/* Recruiter Path */}
                            <div className="group relative overflow-hidden rounded-3xl border bg-card p-8 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Briefcase className="h-24 w-24" />
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    <Briefcase className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">I'm a Recruiter</h3>
                                <p className="text-muted-foreground mb-6">Find the best talent using AI-driven technical assessments and automated pipelines.</p>
                                <Link href="/register?role=recruiter">
                                    <Button className="w-full rounded-xl py-6 text-base group-hover:scale-[1.02] transition-transform">
                                        Hire Talent <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>

                            {/* Candidate Path */}
                            <div className="group relative overflow-hidden rounded-3xl border bg-card p-8 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users className="h-24 w-24" />
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">I'm a Candidate</h3>
                                <p className="text-muted-foreground mb-6">Showcase your skills through interactive AI interviews and land your dream role.</p>
                                <Link href="/register?role=candidate">
                                    <Button variant="outline" className="w-full rounded-xl py-6 text-base group-hover:scale-[1.02] transition-transform border-2">
                                        Find My Next Job <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Social Proof Strip */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                        >
                            <div className="flex -space-x-2">
                                {['T', 'S', 'M', 'A'].map((l, i) => (
                                    <div key={i} className="h-7 w-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                                        {l}
                                    </div>
                                ))}
                            </div>
                            <span>Join <strong>500+</strong> companies already using HireMe</span>
                        </motion.div>
                    </div>
                </section>

                {/* ── Stats ─────────────────────────────────────────── */}
                <section className="py-16 border-y bg-muted/20">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {[
                                { value: "500+", label: "Companies Hiring" },
                                { value: "12k+", label: "Interviews Powered" },
                                { value: "4.8/5", label: "Candidate Rating" },
                                { value: "60%", label: "Faster Time-to-Hire" },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                >
                                    <div className="text-4xl font-bold mb-1 text-foreground">{stat.value}</div>
                                    <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Features ──────────────────────────────────────── */}
                <section id="features" className="py-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Powerful Features for Modern Hiring</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to streamline talent acquisition — from resume parsing to final offer.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            {[
                                { icon: Brain, title: "AI Resume Parsing", description: "Automatically extract skills, experience, and education from resumes with high accuracy. Score candidates before they apply." },
                                { icon: Video, title: "Digital Human Avatars", description: "Conduct life-like technical interviews using D-ID streaming technology. Candidates experience a real interviewer." },
                                { icon: Zap, title: "Instant Scoring", description: "Get detailed AI-generated reports and technical scores immediately after every interview. No waiting." },
                                { icon: Shield, title: "Behavior Moderation", description: "AI-driven behavior analysis detects unprofessional conduct and auto-terminates interviews with a structured report." },
                                { icon: Users, title: "Pipeline Management", description: "Manage thousands of candidates effortlessly with an intuitive kanban-style recruiter dashboard." },
                                { icon: Globe, title: "Remote-First Design", description: "Built for the modern world. Hire talent across the globe with async, AI-powered interviews — no scheduling needed." },
                            ].map(({ icon: Icon, title, description }) => (
                                <motion.div
                                    key={title}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="p-8 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all group"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── How It Works ──────────────────────────────────── */}
                <section id="how-it-works" className="py-24 bg-muted/30 relative overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">How It Works</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Go from job posting to top-tier hire in four simple steps.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-[2.25rem] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 -z-10" />
                            {[
                                { num: "01", title: "Post a Job", desc: "Create your job listing, define required skills, and set evaluation criteria in minutes." },
                                { num: "02", title: "Candidates Apply", desc: "Applicants submit resumes. Our AI scores and ranks them automatically — no manual sifting." },
                                { num: "03", title: "AI Interview", desc: "Shortlisted candidates complete an AI-powered avatar interview at their own convenience." },
                                { num: "04", title: "Hire with Data", desc: "Review AI-generated reports: scores, transcripts, and a hire recommendation for confident decisions." },
                            ].map(({ num, title, desc }, i) => (
                                <motion.div
                                    key={num}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="relative z-10 text-center space-y-4"
                                >
                                    <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto ring-4 ring-background font-bold text-lg shadow-lg shadow-primary/20">
                                        {num}
                                    </div>
                                    <h3 className="text-xl font-bold">{title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing ───────────────────────────────────────── */}
                <section id="pricing" className="py-24">
                    <div className="container mx-auto px-4 text-center">
                        <div className="mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Simple, Transparent Pricing</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Choose a plan that scales with your hiring needs. No hidden fees.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <PricingCard
                                tier="Starter"
                                price="$0"
                                description="Perfect for small teams exploring AI-powered hiring."
                                features={["3 Active Jobs", "50 AI Interviews / mo", "Basic Resume Scoring", "Email Support"]}
                                cta="Start for Free"
                                ctaVariant="outline"
                            />
                            <PricingCard
                                tier="Professional"
                                price="$199"
                                description="For growing companies needing a steady stream of top talent."
                                features={["Unlimited Jobs", "500 AI Interviews / mo", "Advanced Analytics Dashboard", "Priority Support", "D-ID Avatar Interviews"]}
                                cta="Start Free Trial"
                                ctaVariant="default"
                                popular
                            />
                            <PricingCard
                                tier="Enterprise"
                                price="Contact Us"
                                description="Custom solutions for large-scale, global recruitment teams."
                                features={["Custom Integrations", "Unlimited Everything", "Dedicated Success Manager", "SSO & Compliance"]}
                                cta="Contact Sales"
                                ctaVariant="outline"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Testimonials ──────────────────────────────────── */}
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">What Our Users Say</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Loved by recruiters and candidates across the industry.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TestimonialCard
                                quote="HireMe cut our engineering screening time by 70%. The AI scores are shockingly accurate — we've hired 3 engineers who've become top performers."
                                author="David Chen"
                                role="Engineering Lead at Innovate.ly"
                            />
                            <TestimonialCard
                                quote="The AI interview was the most professional screening experience I've had. The avatar felt natural and the questions were genuinely relevant to the role."
                                author="Sarah Jenkins"
                                role="Senior Frontend Developer"
                            />
                            <TestimonialCard
                                quote="Instant scoring and detailed reports let our HR team move 3x faster than before. We now make offers before competitors even schedule their first call."
                                author="Michael Ross"
                                role="HR Director at FutureSoft"
                            />
                        </div>
                    </div>
                </section>

                {/* ── FAQ (Interactive Accordion) ───────────────────── */}
                <section id="faq" className="py-24">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Frequently Asked Questions</h2>
                            <p className="text-muted-foreground">Have questions? We have answers.</p>
                        </div>
                        <Accordion type="single" collapsible className="space-y-3">
                            {[
                                {
                                    q: "How does the AI score candidates?",
                                    a: "Our AI evaluates each answer across four dimensions: technical accuracy, communication quality, confidence, and problem-solving approach. Each dimension is scored 0–10. The final interview score is a weighted composite with penalties applied for unprofessional behavior.",
                                },
                                {
                                    q: "Can I customize the interview questions?",
                                    a: "Yes! Recruiters can fully customize the question bank per job role, or let our AI auto-generate relevant questions based on the job description and the candidate's resume. The AI adapts question difficulty in real-time based on candidate performance.",
                                },
                                {
                                    q: "What happens if the AI is unavailable?",
                                    a: "HireMe has a built-in fallback system. If the primary AI service hits rate limits, the system automatically rotates to backup API keys and falls back to a curated static question bank to ensure interviews are never interrupted.",
                                },
                                {
                                    q: "Is candidate data secure and private?",
                                    a: "Yes. All data is encrypted in transit and at rest. Resume text, interview transcripts, and scores are stored in an isolated PostgreSQL database. We never sell or share candidate data with third parties.",
                                },
                                {
                                    q: "Can candidates retake an interview?",
                                    a: "By default, each candidate gets one interview attempt per job application. Recruiters can reset an interview from the dashboard if they want to grant a second attempt.",
                                },
                            ].map((item, i) => (
                                <AccordionItem
                                    key={i}
                                    value={`item-${i}`}
                                    className="border rounded-xl px-6 bg-card data-[state=open]:border-primary/30 transition-colors"
                                >
                                    <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                                        {item.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                                        {item.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

                {/* ── CTA Banner ─────────────────────────────────────── */}
                <section className="py-20 bg-primary">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                            Ready to Transform Your Hiring?
                        </h2>
                        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
                            Start for free. No credit card required. Set up your first AI interview in under 5 minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/register?role=recruiter">
                                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 shadow-xl">
                                    Start Hiring Free <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/register?role=candidate">
                                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 rounded-full px-8">
                                    Find a Job
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="bg-card py-12 border-t text-left">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md font-bold text-xs">H</div>
                                <span className="font-bold">HireMe</span>
                            </div>
                            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                                Empowering the next generation of recruitment with human-centric AI technology. Conduct, score, and hire with confidence.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a></li>
                                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                                <li><Link href="/register?role=recruiter" className="hover:text-primary transition-colors">Register as Recruiter</Link></li>
                                <li><Link href="/register?role=candidate" className="hover:text-primary transition-colors">Register as Candidate</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} HireMe. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

// ─── Sub-Components ──────────────────────────────────────────────

function PricingCard({
    tier, price, description, features, cta, ctaVariant, popular
}: {
    tier: string; price: string; description: string; features: string[];
    cta: string; ctaVariant: "default" | "outline"; popular?: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`p-8 rounded-3xl border relative bg-card flex flex-col ${popular ? 'ring-2 ring-primary shadow-2xl shadow-primary/10' : ''}`}
        >
            {popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    Most Popular
                </span>
            )}
            <h3 className="text-xl font-bold mb-2">{tier}</h3>
            <div className="mb-4">
                <span className="text-4xl font-extrabold">{price}</span>
                {price !== "Contact Us" && <span className="text-muted-foreground text-sm">/mo</span>}
            </div>
            <p className="text-sm text-muted-foreground mb-8 min-h-[42px]">{description}</p>
            <ul className="text-left space-y-3 mb-8 flex-1">
                {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            <Link href="/register">
                <Button className="w-full rounded-xl py-5" variant={ctaVariant}>{cta}</Button>
            </Link>
        </motion.div>
    )
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl border bg-card space-y-5 flex flex-col"
        >
            <div className="flex gap-1 text-primary">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="text-base italic leading-relaxed text-muted-foreground flex-1">"{quote}"</p>
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {author[0]}
                </div>
                <div>
                    <div className="font-bold text-sm">{author}</div>
                    <div className="text-xs text-muted-foreground">{role}</div>
                </div>
            </div>
        </motion.div>
    )
}
