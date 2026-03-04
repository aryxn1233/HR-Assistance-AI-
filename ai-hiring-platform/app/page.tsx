"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Briefcase, Users, Brain, Shield, Zap, Globe, ArrowRight, CheckCircle2, Video, Star, Play, Check, PlusCircle, HelpCircle } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/ui/mode-toggle"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background selection:bg-primary/20 scroll-smooth">
            {/* Header */}
            <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                            AI
                        </div>
                        <span className="text-xl font-bold tracking-tight">HireMe</span>
                    </div>
                    <nav className="hidden items-center gap-8 md:flex">
                        <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How it Works</a>
                        <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Log In</Button>
                        </Link>
                        <Link href="/register">
                            <Button size="sm" className="rounded-full shadow-lg shadow-primary/20">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden pb-20 pt-32 lg:pt-48">
                    <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#ff80b5] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
                    </div>

                    <div className="container mx-auto px-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-6">
                                The Future of Recruitment is Here
                            </span>
                            <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                                Hire Faster with <br />
                                <span className="text-primary">AI-Powered</span> Interviews
                            </h1>
                            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
                                Automate technical screenings, rank candidates using advanced AI, and conduct life-like avatar interviews that feel remarkably human.
                                Join the hundreds of companies transforming their hiring process.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-16"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
                                {/* Recruiter Path */}
                                <div className="group relative overflow-hidden rounded-3xl border bg-card p-8 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Briefcase className="h-24 w-24" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">I'm a Recruiter</h3>
                                    <p className="text-muted-foreground mb-6">Find the best talent using AI-driven technical assessments and automated pipelines.</p>
                                    <Link href="/register?role=recruiter">
                                        <Button className="w-full rounded-xl py-6 text-lg group-hover:scale-[1.02] transition-transform">
                                            Hire Talent <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>

                                {/* Candidate Path */}
                                <div className="group relative overflow-hidden rounded-3xl border bg-card p-8 transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Users className="h-24 w-24" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">I'm a Candidate</h3>
                                    <p className="text-muted-foreground mb-6">Showcase your skills through interactive AI interviews and land your dream job.</p>
                                    <Link href="/register?role=candidate">
                                        <Button variant="outline" className="w-full rounded-xl py-6 text-lg group-hover:scale-[1.02] transition-transform border-2">
                                            Find My Next Job <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Powerful Features for Modern Hiring</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to streamline your talent acquisition from resume parsing to final offer.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <FeatureCard
                                icon={<Brain className="h-6 w-6 text-primary" />}
                                title="AI Resume Parsing"
                                description="Automatically extract skills, experience, and education from resumes with uncanny accuracy."
                            />
                            <FeatureCard
                                icon={<Video className="h-6 w-6 text-primary" />}
                                title="Digital Human Avatars"
                                description="Conduct life-like technical interviews using D-ID streaming technology for a modern experience."
                            />
                            <FeatureCard
                                icon={<Zap className="h-6 w-6 text-primary" />}
                                title="Instant Scoring"
                                description="Get detailed AI-generated reports and technical scores immediately after every interview."
                            />
                            <FeatureCard
                                icon={<Shield className="h-6 w-6 text-primary" />}
                                title="Cheat Prevention"
                                description="Proctoring and AI-driven behavior analysis to ensure interview integrity."
                            />
                            <FeatureCard
                                icon={<Users className="h-6 w-6 text-primary" />}
                                title="Pipeline Management"
                                description="Manage thousands of candidates effortlessly with our intuitive kanban dashboard."
                            />
                            <FeatureCard
                                icon={<Globe className="h-6 w-6 text-primary" />}
                                title="Remote Ready"
                                description="Built for the modern, remote-first world. Hire talent across the globe seamlessly."
                            />
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-24 relative overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">How It Works</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Go from job posting to top-tier hire in four simple steps.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-[2.25rem] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 -z-10" />

                            <StepCard
                                number="01"
                                title="Create Job"
                                description="Post your job description and define required technical competencies."
                            />
                            <StepCard
                                number="02"
                                title="Invite Candidates"
                                description="Upload resumes or share a link. Our AI parses and filters the best fits."
                            />
                            <StepCard
                                number="03"
                                title="AI Interview"
                                description="Candidates engage with a digital human avatar for a technical screening."
                            />
                            <StepCard
                                number="04"
                                title="Hire Excellence"
                                description="Review detailed analytics and technical scores to make data-driven offers."
                            />
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4 text-center">
                        <div className="mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Simple, Transparent Pricing</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Choose a plan that scales with your hiring needs.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <PricingCard
                                tier="Starter"
                                price="$0"
                                description="Perfect for small teams and startups looking to explore AI hiring."
                                features={["3 Active Jobs", "50 AI Interviews", "Basic Resume Parsing", "Email Support"]}
                            />
                            <PricingCard
                                tier="Professional"
                                price="$199"
                                description="For growing companies needing a steady stream of top talent."
                                features={["Unlimited Jobs", "500 AI Interviews", "Advanced Analytics", "Priority Support", "D-ID Avatar Selection"]}
                                popular
                            />
                            <PricingCard
                                tier="Enterprise"
                                price="Contact"
                                description="Custom solutions for large-scale recruitment and global teams."
                                features={["Custom Integrations", "Unlimited Everything", "Dedicated Success Manager", "SSO & Security Compliance"]}
                            />
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">What Our Users Say</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Join thousands of happy recruiters and candidates.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TestimonialCard
                                quote="HireMe transformed our engineering recruitment. We saved 40 hours a week on technical screenings."
                                author="David Chen"
                                role="Tech Lead at Innovate.ly"
                            />
                            <TestimonialCard
                                quote="The AI interview was the most modern candidate experience I've had. Truly impressive and fair."
                                author="Sarah Jenkins"
                                role="Senior Dev Candidate"
                            />
                            <TestimonialCard
                                quote="The instant scoring and reporting allow us to move so much faster than our competitors."
                                author="Michael Ross"
                                role="HR Director at FutureSoft"
                            />
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Frequently Asked Questions</h2>
                        </div>
                        <div className="space-y-6">
                            <FAQItem
                                question="How does the AI score candidates?"
                                answer="Our AI analyzes speech patterns, technical accuracy, and behavior using advanced LLMs trained on millions of technical interview data points."
                            />
                            <FAQItem
                                question="Can I customize the interview questions?"
                                answer="Yes! Recruiters can fully customize the question sets or let our AI generate them based on the job description."
                            />
                            <FAQItem
                                question="Does it support coding challenges?"
                                answer="Absolutely. HireMe includes integrated coding environments where candidates can solve problems in real-time while interacting with the avatar."
                            />
                        </div>
                    </div>
                </section>

                {/* Social Proof / Stats */}
                <section className="py-20 border-y">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-bold mb-2">98%</div>
                                <div className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Time Saved</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2">10k+</div>
                                <div className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Interviews</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2">4.9/5</div>
                                <div className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Candidate Rating</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2">50%</div>
                                <div className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Better Hires</div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-card py-12 border-t text-left">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md font-bold text-xs">
                                    AI
                                </div>
                                <span className="font-bold">HireMe</span>
                            </div>
                            <p className="text-muted-foreground max-w-sm">
                                Empowering the next generation of recruitment with human-centric AI technology. Conduct, score, and hire with confidence.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#features" className="hover:text-primary">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-primary">How it Works</a></li>
                                <li><a href="#pricing" className="hover:text-primary">Pricing</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary">About</a></li>
                                <li><a href="#" className="hover:text-primary">Careers</a></li>
                                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t">
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-primary">Privacy</a>
                            <a href="#" className="hover:text-primary">Terms</a>
                            <a href="#" className="hover:text-primary">Contact</a>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} HireMe. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl border bg-card hover:border-primary/50 transition-colors group">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
    )
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
    return (
        <div className="relative z-10 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto ring-4 ring-background font-bold">
                {number}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
        </div>
    )
}

function PricingCard({ tier, price, description, features, popular }: { tier: string, price: string, description: string, features: string[], popular?: boolean }) {
    return (
        <div className={`p-8 rounded-3xl border relative bg-card ${popular ? 'ring-2 ring-primary shadow-xl shadow-primary/10' : ''}`}>
            {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">Most Popular</span>}
            <h3 className="text-xl font-bold mb-2">{tier}</h3>
            <div className="mb-4">
                <span className="text-4xl font-bold">{price}</span>
                {price !== 'Contact' && <span className="text-muted-foreground">/mo</span>}
            </div>
            <p className="text-sm text-muted-foreground mb-8 min-h-[48px]">{description}</p>
            <ul className="text-left space-y-4 mb-8">
                {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            <Button className="w-full rounded-xl py-6" variant={popular ? 'default' : 'outline'}>
                Get Started
            </Button>
        </div>
    )
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
    return (
        <div className="p-8 rounded-2xl border bg-card relative space-y-6">
            <div className="flex gap-1 text-primary">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="text-lg italic leading-relaxed text-muted-foreground">"{quote}"</p>
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {author[0]}
                </div>
                <div className="text-left">
                    <div className="font-bold text-sm">{author}</div>
                    <div className="text-xs text-muted-foreground">{role}</div>
                </div>
            </div>
        </div>
    )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    return (
        <div className="p-6 rounded-xl border bg-card text-left">
            <h4 className="font-bold mb-2 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                {question}
            </h4>
            <p className="text-muted-foreground text-sm pl-6">{answer}</p>
        </div>
    )
}
