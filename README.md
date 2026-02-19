📌 Overview

This document explains the working architecture of our AI-powered Avatar Interview System built for a production SaaS environment.

The system enables:

Resume-aware dynamic questioning

AI-generated voice responses

Realistic avatar lip-sync

Speech-to-text transcription

AI evaluation & scoring

Adaptive follow-up questioning

Automated interview reports

🏗 Architecture Options

We support three architectural approaches depending on realism, budget, and infrastructure requirements:

Structured Turn-Based (Recommended SaaS Model)

Semi Real-Time Streaming (Hybrid Model)

True Real-Time Cinematic Avatar (Enterprise-Level)

🟢 OPTION 1 — Structured Turn-Based Architecture (Recommended)
Description

Each interview question is generated and rendered sequentially.
The avatar speaks, candidate responds, AI evaluates, and the next question is generated.

This is the most stable and scalable SaaS model.

System Flow Diagram
flowchart TD
    A[Candidate Starts Interview] --> B[Backend Creates Session]
    B --> C[Gemini Generates Question]
    C --> D[ElevenLabs Generates Voice]
    D --> E[D-ID Renders Avatar Video]
    E --> F[Frontend Plays Video]
    F --> G[Candidate Responds]
    G --> H[Speech-to-Text]
    H --> I[Gemini Evaluates Answer]
    I --> J[Adaptive Logic]
    J --> C
    I --> K[Generate Final Report]

Technology Stack

Gemini API – Question Generation & Evaluation

ElevenLabs – Text-to-Speech

D-ID – Avatar Rendering & Lip Sync

AssemblyAI / Whisper – Speech-to-Text

NestJS Backend

PostgreSQL

AWS S3 Storage

Cost Per Interview (10–15 min)
Service	Estimated Cost
Gemini	$0.50–1.00
ElevenLabs	$0.30–0.80
D-ID	$1.50–3.00
STT	$0.40–0.70
Total	$3–6 per interview
Advantages

High realism

Commercial-ready

Stable architecture

Easy to scale

Industry standard approach

Limitations

2–5 second delay between questions

Not fully real-time streaming

🟡 OPTION 2 — Semi Real-Time Streaming Avatar (Hybrid)
Description

The avatar runs directly in the browser.
LLM streams text.
TTS streams audio.
Avatar mouth movement is driven by audio amplitude.

No video rendering required.

System Flow Diagram
flowchart TD
    A[Start Interview] --> B[Create Session]
    B --> C[Gemini Streaming Response]
    C --> D[Streaming TTS]
    D --> E[Browser Avatar Animates via Audio]
    E --> F[Candidate Response]
    F --> G[Streaming Speech-to-Text]
    G --> H[Gemini Evaluation]
    H --> C
    H --> I[Generate Final Report]

Technology Stack

Gemini Streaming API

ElevenLabs Streaming TTS

Three.js / React Three Fiber Avatar

WebRTC

NestJS Backend

PostgreSQL

Cost Per Interview
Service	Estimated Cost
Gemini	$0.50–1.00
ElevenLabs	$0.30–0.80
STT	$0.40–0.70
Total	$1.5–3 per interview
Advantages

Feels real-time

Lower cost

No rendering delay

More scalable long-term

Limitations

Slightly less photorealistic

Requires custom avatar engineering

🔴 OPTION 3 — True Real-Time Cinematic Avatar (Enterprise)
Description

Full real-time digital human using GPU infrastructure and game engine rendering.

Used in enterprise research or simulation environments.

System Flow Diagram
flowchart TD
    A[Start Interview] --> B[Streaming LLM]
    B --> C[Streaming TTS]
    C --> D[NVIDIA Audio2Face]
    D --> E[Unreal Engine Rendering]
    E --> F[WebRTC Stream]
    F --> G[Candidate Response]
    G --> H[Streaming STT]
    H --> B

Technology Stack

Streaming LLM

Streaming TTS

NVIDIA Audio2Face

Unreal Engine MetaHuman

Dedicated GPU Servers

WebRTC

Infrastructure Cost
Item	Estimated Monthly Cost
GPU Server	$800–2000+
DevOps Maintenance	High
Rendering Infrastructure	High
Advantages

Ultra realistic

True real-time conversation

No visible delay

Limitations

Very high infrastructure cost

Complex engineering

Overkill for most HR SaaS use cases

📊 Architecture Comparison
Feature	Option 1	Option 2	Option 3
Realism	High	Medium-High	Very High
Real-Time	No	Partial	Yes
Complexity	Low	Medium	Very High
Cost Per Interview	$3–6	$1.5–3	Low (after infra)
Infrastructure	Simple	Moderate	Heavy GPU
🧠 Adaptive Interview Logic

During interview:

If technical score < 5 → Ask deeper technical follow-up

If communication score < 5 → Ask explanation-based question

If performance strong → Increase difficulty

Max 8–10 questions per session

📊 Final Interview Report Includes

Overall Score (0–100)

Skill Breakdown

Strengths

Weaknesses

Hiring Recommendation (Strong Hire / Hire / No Hire)

Detailed JSON for analytics

🔐 Security & Compliance

JWT protected endpoints

API keys stored in environment variables

Signed S3 URLs for media

No AI keys exposed to frontend

Role-based access control

📈 Scalability Strategy

Async AI processing

Background workers

Stateless frontend

Interview state stored in database

Horizontal scaling for backend
