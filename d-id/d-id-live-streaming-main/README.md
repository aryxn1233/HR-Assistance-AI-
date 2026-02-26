# 🤖 AI Technical Interviewer - Prep & Evaluation

> A premium, hands-free technical interview experience powered by **D-ID Streaming** and **Google Gemini 2.0**.

![Main Interface Screenshot](https://raw.githubusercontent.com/aryxn1233/d-id-live-streaming/main/agents_app.png)

## 🌟 Key Features

- **🗣️ Natural Turn-Taking**: Fully automated speech recognition and completion detection. The interviewer listens when you speak and responds the moment you finish.
- **🧠 Intelligence by Gemini 2.0**: High-quality technical assessment and professional interviewer persona.
- **🎥 D-ID Live Streaming**: Real-time video avatar with neural voice synchronization for a realistic face-to-face feel.
- **🛡️ 429 Quota Fallback**: A sequences of 10 high-quality predefined questions ensures the interview continues even if AI API limits are hit.
- **📊 Performance Reporting**: At the end of the session, receive a 0-100 score, detailed feedback, and a downloadable report.
- **✨ Premium UI**: Modern Glassmorphism design with a dedicated conversation sidebar.

---

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript, WebRTC (D-ID SDK), Web Speech API.
- **Backend**: Node.js, Express.
- **AI Engine**: Google Gemini 2.0 Flash.
- **Avatar Engine**: D-ID Streaming API (Talks Service).

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed.
- A [D-ID API Key](https://studio.d-id.com/).
- A [Google AI Studio (Gemini) API Key](https://aistudio.google.com/).

### 2. Installation
```bash
git clone https://github.com/aryxn1233/d-id-live-streaming.git
cd d-id-live-streaming
npm install
```

### 3. Configuration
Create a `.env` file in the root:
```env
GEMINI_API_KEY=your_gemini_key_here
```

Create an `api.json` in the root:
```json
{
  "key": "your_did_api_key_here",
  "url": "https://api.d-id.com",
  "service": "talks"
}
```

### 4. Run the App
```bash
npm run dev
```
Visit `http://localhost:3001` in your browser.

---

## 🛠️ Usage

1.  Click **"Start Technical Interview"**.
2.  Grant microphone permissions when prompted.
3.  The interviewer will introduce himself and ask a question.
4.  **Speak naturally**. The system will detect when you finish answering.
5.  Click **"End Interview & Report"** to view your final score and download your assessment.

---

## 🔒 Security Note
This project is configured to ignore `.env` and `api.json` via `.gitignore`. **Never commit your API keys to a public repository.**

---

Created with ❤️ for technical interview preparation.