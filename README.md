📌 Overview

This document explains all possible architecture approaches for conducting AI-powered avatar interviews inside our AI Hiring SaaS platform.

The system supports:

Resume-aware question generation

Real-time or turn-based avatar interaction

Voice synthesis and lip-sync

Speech-to-text transcription

AI-based evaluation and scoring

Automated report generation

🏗 Architecture Options

We support three possible architecture levels:

Structured Turn-Based (SaaS Standard)

Semi Real-Time Streaming (Hybrid Model)

True Real-Time Cinematic Avatar (Enterprise)

🟢 OPTION 1 — Structured Turn-Based Architecture (Recommended SaaS Model)
🔹 Description

Each interview question is generated, rendered, played, and evaluated sequentially.

This is the most stable and production-safe model for SaaS platforms.

🔄 System Flow
flowchart TD
    A[Candidate Starts Interview] --> B[Backend Creates Interview Session]
    B --> C[Gemini Generates Question]
    C --> D[ElevenLabs Generates Voice]
    D --> E[D-ID Renders Avatar Video]
    E --> F[Frontend Plays Video]
    F --> G[Candidate Responds]
    G --> H[Speech-to-Text Transcription]
    H --> I[Gemini Evaluates Answer]
    I --> J[Adaptive Logic Determines Next Question]
    J --> C
    I --> K[Final Report Generated]

🧠 Technologies Used

Gemini (Question Generation + Evaluation)

ElevenLabs (Text-to-Speech)

D-ID (Avatar + Lip Sync)

AssemblyAI / Whisper (Speech-to-Text)

NestJS Backend

PostgreSQL

AWS S3

💰 Estimated Cost Per Interview (10–15 min)
Service	Estimated Cost
Gemini	$0.50–1.00
ElevenLabs	$0.30–0.80
D-ID	$1.50–3.00
STT	$0.40–0.70
Total	$3–6 per interview
✅ Advantages

High realism

Stable architecture

Easy scaling

Lower infrastructure complexity

Market-proven approach

❌ Limitations

2–5 second rendering delay per question

Not true continuous streaming

🟡 OPTION 2 — Semi Real-Time Streaming Avatar (Hybrid Model)
🔹 Description

Instead of generating full video per question, the avatar runs client-side and responds using streaming text + streaming audio.

No server-side video rendering required.

🔄 System Flow
flowchart TD
    A[Candidate Starts Interview] --> B[Backend Creates Session]
    B --> C[Gemini Streaming Response]
    C --> D[ElevenLabs Streaming Audio]
    D --> E[Browser Avatar Animates via Audio Amplitude]
    E --> F[Candidate Responds]
    F --> G[Streaming STT]
    G --> H[Gemini Evaluates]
    H --> C
    H --> I[Final Report Generated]

🧠 Technologies Used

Gemini Streaming API

ElevenLabs Streaming TTS

Three.js / React Three Fiber Avatar

Audio-driven mouth animation

WebRTC

NestJS Backend

PostgreSQL

💰 Estimated Cost Per Interview
Service	Estimated Cost
Gemini	$0.50–1.00
ElevenLabs	$0.30–0.80
STT	$0.40–0.70
Total	$1.5–3 per interview

No D-ID costs.

✅ Advantages

Feels real-time

No rendering delay

Lower per-interview cost

More scalable long-term

❌ Limitations

Slightly less photorealistic

More engineering effort required

Custom avatar animation needed

🔴 OPTION 3 — True Real-Time Cinematic Avatar (Enterprise)
🔹 Description

Full real-time avatar rendered on GPU infrastructure using game engine technology.

Hollywood-level digital human.

🔄 System Flow
flowchart TD
    A[Candidate Starts Interview] --> B[LLM Streaming]
    B --> C[Streaming TTS]
    C --> D[NVIDIA Audio2Face]
    D --> E[Unreal Engine MetaHuman Rendering]
    E --> F[WebRTC Stream to Browser]
    F --> G[Candidate Responds]
    G --> H[Streaming STT]
    H --> B

🧠 Technologies Used

Streaming LLM

Streaming TTS

NVIDIA Audio2Face

Unreal Engine MetaHuman

Dedicated GPU Server

WebRTC

💰 Estimated Infrastructure Cost
Item	Monthly Cost
GPU Server	$800–2000+
DevOps	High
Maintenance	High

Per interview cost becomes minimal, but fixed infrastructure cost is high.

✅ Advantages

Ultra realistic

No visible delay

True conversational experience

❌ Limitations

Extremely complex

High infrastructure cost

Overkill for most HR SaaS use cases

📊 Architecture Comparison
Feature	Option 1	Option 2	Option 3
Realism	⭐⭐⭐⭐	⭐⭐⭐	⭐⭐⭐⭐⭐
Real-Time	❌	⚠️ Semi	✅
Complexity	Low	Medium	Very High
Cost Per Interview	$3–6	$1.5–3	Low (after infra)
Infrastructure	Simple	Moderate	Heavy GPU
🎯 Recommended Approach

For AI Hiring SaaS:

Start with Option 1 (Structured Turn-Based).

Reasons:

Stable

Cost predictable

Easier to scale

Fast to deploy

Industry standard

Option 2 can be implemented later for optimization.

Option 3 is enterprise-level and not required unless targeting high-end simulation platforms.

🧠 Interview Flow Logic
Adaptive Questioning

If technical score < 5 → ask deeper technical question

If communication score < 5 → ask explanation-based question

If strong performance → increase difficulty

Max 8–10 questions

📊 Final Report Structure

After interview completion:

Overall Score (0–100)

Skill Breakdown

Strengths

Weaknesses

Hiring Recommendation

Detailed JSON for analytics

🔐 Security Considerations

JWT authentication

API keys stored in .env

Signed S3 URLs

No AI keys exposed to frontend

Rate limiting for LLM calls

📈 Scalability Strategy

Async AI calls

Background processing

Stateless frontend

Store interview state in database

Horizontal scaling for backend services

💼 Business Model Considerations

If average cost per interview is ~$4:

Possible pricing model:

$15–25 per AI interview

Volume discounts

Enterprise subscription tier

This ensures sustainable margins.

🚀 Conclusion

We provide multiple architecture options depending on:

Budget

Desired realism

Infrastructure readiness

Scalability goals

The recommended path for production SaaS is:

Structured Turn-Based Architecture with avatar + adaptive AI logic.
