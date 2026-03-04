const express = require('express');
const http = require('http');
const cors = require('cors');
const RateLimit = require('express-rate-limit');
const port = 3001;

const app = express();

var limiter = RateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:3000'] : '*';
app.use(cors({ origin: allowedOrigins }));
app.use((req, res, next) => {
  console.log(`[D-ID Proxy] Incoming: ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/', express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/ws-streaming', function (req, res) {
  res.sendFile(__dirname + '/index-ws.html');
});

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with rotation support
const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY5,
].filter(Boolean);

let currentKeyIndex = 0;
const models = apiKeys.map(key => {
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
});

console.log(`Gemini initialized with ${apiKeys.length} API keys.`);

app.use(express.json());

const predefinedQuestions = [
  "Could you start by telling me a bit about yourself and your background in software engineering?",
  "What are some of the most interesting technical projects you've worked on recently?",
  "Can you describe a challenging technical problem you faced and how you went about solving it?",
  "What is your preferred tech stack, and why do you enjoy working with those specific technologies?",
  "How do you stay up to date with the latest trends and advancements in the tech industry?",
  "Can you explain the difference between a SQL and a NoSQL database, and when you'd choose one over the other?",
  "What are some best practices you follow for writing clean, maintainable, and well-documented code?",
  "How do you approach testing in your development workflow? What types of tests do you usually implement?",
  "Can you talk about a time when you had to collaborate with a team to deliver a complex feature or project?",
  "Finally, what are your career goals for the next few years, and what kind of roles or companies are you looking for?"
];

let questionCounter = 0;

function getNextFallbackQuestion() {
  const question = predefinedQuestions[questionCounter % predefinedQuestions.length];
  questionCounter++;
  return question;
}

// Helper for retries with exponential backoff and key rotation
async function generateWithRetry(prompt, retries = 3, delay = 2000) {
  let attempts = 0;
  const maxAttempts = Math.max(retries, apiKeys.length * 2);

  while (attempts < maxAttempts) {
    const model = models[currentKeyIndex];
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      attempts++;
      console.error(`Error with Gemini Key #${currentKeyIndex + 1}:`, err.message);

      if (err.status === 429 && attempts < maxAttempts) {
        // Rotate key
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(`Quota hit. Switching to Gemini API Key #${currentKeyIndex + 1} (Attempt ${attempts + 1}/${maxAttempts})...`);

        // Brief delay before retry with next key
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      if (attempts >= maxAttempts) throw err;

      // For other errors, wait and retry
      console.log(`Retrying in ${delay}ms... (Attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

app.post('/chat', async (req, res) => {
  const { message, interviewId, token, streamId, sessionId } = req.body;
  const authToken = token || req.headers.authorization;
  console.log('Received /chat request body:', JSON.stringify(req.body));

  console.log('Proxying chat for interview:', interviewId);

  if (!interviewId || interviewId === 'undefined' || !authToken || authToken === 'undefined') {
    console.error('Missing interviewId or token in /chat request:', { interviewId, authToken: authToken ? 'PRESENT' : 'MISSING' });
    return res.status(400).json({ error: 'Missing session context (Interview ID or Token)' });
  }

  try {
    const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    const targetUrl = `${process.env.BACKEND_URL || 'http://127.0.0.1:3003'}/interviews/${interviewId}/answer`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ answer: message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend /answer error [${response.status}]:`, errorText);
    }

    const data = await response.json();
    console.log('Backend /answer response:', JSON.stringify(data).substring(0, 100));
    // Main backend returns { status, question }
    // streaming-client-api expects { text }
    res.json({
      text: data.question?.questionText || data.text || "I'm having trouble retrieving the next question. Please check your connection.",
      ...data
    });
  } catch (err) {
    console.error('Proxy chat error:', err.message);
    res.status(500).json({ error: 'Failed to proxy chat to main backend' });
  }
});

app.post('/start-interview', async (req, res) => {
  const { interviewId, token, streamId, sessionId } = req.body;
  const authToken = token || req.headers.authorization;
  console.log('Received /start-interview request body:', JSON.stringify(req.body));

  console.log('Proxying start for interview:', interviewId);

  if (!interviewId || interviewId === 'undefined' || !authToken || authToken === 'undefined') {
    console.error('Missing interviewId or token in /start-interview request:', { interviewId, authToken: authToken ? 'PRESENT' : 'MISSING' });
    return res.status(400).json({ error: 'Missing session context (Interview ID or Token)' });
  }

  try {
    const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    const targetUrl = `${process.env.BACKEND_URL || 'http://127.0.0.1:3003'}/interviews/${interviewId}/start`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ streamId, sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend /start error [${response.status}]:`, errorText);
    }

    const data = await response.json();
    console.log('Backend /start response:', JSON.stringify(data).substring(0, 100));
    res.json({
      text: data.question?.questionText || data.text || "Hello! I'm your AI interviewer. I'm ready to begin when you are.",
      ...data
    });
  } catch (err) {
    console.error('Proxy start error:', err.message);
    res.status(500).json({ error: 'Failed to proxy start to main backend' });
  }
});

// --- Keyword-Matching Fallback Algorithm ---
function generateReportFallback(history) {
  const userText = history
    .filter(m => m.role === 'user')
    .map(m => m.text)
    .join(' ');

  const skills = {
    frontend: ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'nextjs', 'redux'],
    backend: ['node', 'express', 'nestjs', 'python', 'django', 'flask', 'java', 'spring', 'go', 'php', 'laravel'],
    database: ['sql', 'postgres', 'postgresql', 'mongodb', 'mysql', 'redis', 'prisma', 'orm'],
    cloud: ['aws', 'azure', 'googl', 'cloud', 'docker', 'kubernetes', 'cicd', 'jenkins', 'github actions', 'devops'],
    concepts: ['async', 'promise', 'rest', 'api', 'oops', 'design pattern', 'architecture', 'scalability', 'testing', 'jest']
  };

  let foundSkills = [];
  let score = 20; // Base participation score

  Object.entries(skills).forEach(([category, variants]) => {
    variants.forEach(variant => {
      const regex = new RegExp(`\\b${variant}\\b`, 'gi');
      if (regex.test(userText)) {
        foundSkills.push(variant.charAt(0).toUpperCase() + variant.slice(1));
        score += 8;
      }
    });
  });

  // Cap score at 100
  score = Math.min(score, 98);

  const strengths = foundSkills.length > 0 ? foundSkills.slice(0, 5) : ["General communication"];
  const fit = score > 60 ? "Strong Candidate" : (score > 40 ? "Potential Fit" : "Needs Improvement");

  const report = `
INTERVIEW EVALUATION (Deterministic Fallback)

Score: ${score}
Feedback: During the session, the candidate demonstrated knowledge in several technical areas. Based on the transcript analysis, they showed familiarity with ${foundSkills.slice(0, 3).join(', ') || 'software development concepts'}. The candidate is currently rated as a "${fit}".

Strengths:
- Mentioned ${strengths.join(', ')}
- Participated actively in all questions
- Professional tone throughout

Areas for Improvement:
- Could provide more specific examples of architectural decisions
- Expand on ${Object.keys(skills).filter(c => !foundSkills.some(fs => skills[c].includes(fs.toLowerCase()))).slice(0, 2).join(' and ')} concepts
  `;

  const reportText = report.trim();
  const summary = extractPlainTextSection(reportText, 'Feedback');
  const strengthsMatched = extractPlainTextSection(reportText, 'Strengths').split('\n-').map(s => s.replace(/^- /, '').trim()).filter(Boolean);
  const areasMatched = extractPlainTextSection(reportText, 'Areas for Improvement').split('\n-').map(s => s.replace(/^- /, '').trim()).filter(Boolean);

  return {
    text: reportText,
    score: score,
    summary: summary,
    strengths: strengthsMatched,
    weaknesses: areasMatched
  };
}

// Helper to extract sections from plain text report (mirrors frontend logic)
function extractPlainTextSection(text, title) {
  const regex = new RegExp(`${title}:\\s*([\\s\\S]*?)(?=\\n\\n|\\nStrengths:|\\nAreas|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

app.post('/generate-report', async (req, res) => {
  const { history, applicationId, token } = req.body;
  if (!history || history.length === 0) {
    return res.status(400).json({ error: 'No history provided' });
  }

  let finalReport;
  try {
    const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const prompt = `You are an Expert Technical Recruiter. Analyze the following interview transcript and provide a detailed report.
    
    Conversation History:
    ${historyText}

    Your report MUST follow this exact format:
    Score: [Number from 0 to 100]
    Feedback: [3-4 sentences summarizing technical performance and communication]
    Strengths: [Bullet points of what they did well]
    Areas for Improvement: [Bullet points of what to work on]

    Keep it professional and constructive.`;

    const responseText = await generateWithRetry(prompt, 2, 1000);

    // Extract score from text if possible, default to 70
    const scoreMatch = responseText.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    finalReport = {
      text: responseText,
      score: score,
      summary: extractPlainTextSection(responseText, 'Feedback'),
      strengths: extractPlainTextSection(responseText, 'Strengths').split('\n-').map(s => s.replace(/^- /, '').trim()).filter(Boolean),
      weaknesses: extractPlainTextSection(responseText, 'Areas for Improvement').split('\n-').map(s => s.replace(/^- /, '').trim()).filter(Boolean)
    };
  } catch (err) {
    console.error('AI Report generation failed, using fallback:', err.message);
    finalReport = generateReportFallback(history);
  }

  // --- Dashboard Synchronization ---
  if (applicationId && token) {
    try {
      console.log(`Syncing score ${finalReport.score} for application ${applicationId}...`);
      const targetUrl = `${process.env.BACKEND_URL || 'http://127.0.0.1:3003'}/interviews/application/${applicationId}/submit-score`;
      const syncResponse = await fetch(targetUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          interviewScore: finalReport.score,
          feedback: finalReport
        })
      });

      if (!syncResponse.ok) {
        const errText = await syncResponse.text();
        console.error('Main Backend Sync Failed:', syncResponse.status, errText);
      } else {
        console.log('Successfully synced score with main dashboard');
      }
    } catch (syncErr) {
      console.error('Network Error during dashboard sync:', syncErr.message);
    }
  }

  res.json(finalReport);
});

const server = http.createServer(app);

server.listen(port, () =>
  console.log(
    `Server started on port localhost:${port}\nhttp://localhost:${port}\nhttp://localhost:${port}/ws-streaming`
  )
);
