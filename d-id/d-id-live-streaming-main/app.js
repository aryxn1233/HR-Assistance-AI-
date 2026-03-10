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

app.use(express.json());

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

    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const finishResponse = await fetch(`${backendUrl}/interviews/${interviewId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
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
