const express = require('express');
const http = require('http');
const cors = require('cors');
const RateLimit = require('express-rate-limit');
const port = process.env.PORT || 3001;

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

app.get('/api/credentials', (req, res) => {
  res.json({
    key: process.env.DID_API_KEY,
    url: "https://api.d-id.com",
    service: "talks"
  });
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
  "Could you start by telling me a bit about yourself and your professional background ?",
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
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('Backend /answer response:', JSON.stringify(data).substring(0, 100));
    // Main backend returns { status, question }
    // streaming-client-api expects { text }
    res.json({
      text: data.question?.questionText || data.text || data.message || "I'm having trouble retrieving the next question.",
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

  if (!interviewId || interviewId === 'undefined' || !authToken || authToken === 'undefined' || authToken === 'null') {
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
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('Backend /start response:', JSON.stringify(data).substring(0, 100));
    res.json({
      text: data.question?.questionText || data.text || data.message || "Hello! I'm your AI interviewer. I'm ready to begin when you are.",
      ...data
    });
  } catch (err) {
    console.error('Proxy start error:', err.message);
    res.status(500).json({ error: 'Failed to proxy start to main backend' });
  }
});

app.post('/end-interview', async (req, res) => {
  const { interviewId, token } = req.body;

  if (!interviewId || !token) {
    return res.status(400).json({ error: 'Missing interviewId or token' });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3003';
    console.log(`[D-ID Proxy] Finishing interview securely on backend for ID: ${interviewId}`);

    const finishResponse = await fetch(`${backendUrl}/interviews/${interviewId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!finishResponse.ok) {
      const errText = await finishResponse.text();
      console.error('Backend finish failed:', finishResponse.status, errText);
      return res.status(finishResponse.status).json({ error: 'Backend finish request failed', details: errText });
    }

    const data = await finishResponse.json();
    return res.json(data);
  } catch (err) {
    console.error('Error proxying end-interview:', err);
    res.status(500).json({ error: 'Internal server error while ending interview' });
  }
});

const server = http.createServer(app);

server.listen(port, '0.0.0.0', () =>
  console.log(
    `Server started on port ${port}\nListening at 0.0.0.0:${port}`
  )
);
