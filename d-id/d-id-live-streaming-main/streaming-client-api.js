'use strict';
const fetchJsonFile = await fetch('./api/credentials');
const DID_API = await fetchJsonFile.json();

if (!DID_API.key || DID_API.key == 'undefined' || DID_API.key == 'secret') alert('Please set DID_API_KEY in Render environment variables..');

const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

// UI Elements
const mainBtn = document.getElementById('main-action-btn');
const chatHistory = document.getElementById('chat-history');
const micStatusLabel = document.getElementById('mic-status-label');
const sessionStatusLabel = document.getElementById('session-status-label');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const userInputArea = document.getElementById('user-input-area');

// D-ID Elements
const idleVideoElement = document.getElementById('idle-video-element');
const streamVideoElement = document.getElementById('stream-video-element');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');
const streamEventLabel = document.getElementById('stream-event-label');

let peerConnection;
let pcDataChannel;
let streamId;
let sessionId;
let sessionClientAnswer;
let statsIntervalId;
let lastBytesReceived;
let videoIsPlaying = false;
let streamVideoOpacity = 0;

const stream_warmup = true;
let isStreamReady = !stream_warmup;
let isInterviewStarted = false;
let isAISpeaking = false; // Track if AI is currently talking
let conversationHistory = []; // Track interview flow for the report

// Capture context from URL for dashboard sync
console.log('--- URL DEBUGGING ---');
console.log('Full window.location.href:', window.location.href);
console.log('window.location.search:', window.location.search);
console.log('window.location.pathname:', window.location.pathname);

const urlParams = new URLSearchParams(window.location.search);
const context = {
  applicationId: urlParams.get('applicationId'),
  interviewId: urlParams.get('interviewId'),
  token: urlParams.get('token')
};
console.log('Extracted context:', context);
if (!context.interviewId || !context.token) {
  console.error('CRITICAL: Missing Interview Context (ID or Token) in URL parameters!');
  addMessageToChat('interviewer', "CRITICAL ERROR: No session context found in URL. Please start the interview from the Dashboard.");
}

const presenterInputByService = {
  // Custom user avatar image from postimages
  talks: { source_url: 'https://i.postimg.cc/tg2VcVLN/indian-avatar.png' },
  clips: { presenter_id: 'v2_public_alex@qcvo4gupoy', driver_id: 'e3nbserss8' },
};

// --- Connection Logic ---
async function connect() {
  if (peerConnection && peerConnection.connectionState === 'connected') return;

  // Immediately start playing idle video to avoid lag perception
  playIdleVideo();

  sessionStatusLabel.innerText = 'Connecting...';
  mainBtn.innerText = 'Initializing...';
  mainBtn.disabled = true;

  try {
    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...presenterInputByService[DID_API.service], stream_warmup }),
    });

    if (sessionResponse.status === 402) {
      addMessageToChat('interviewer', "System Error: Insufficient D-ID credits. Please check your account balance to continue the interview.");
      sessionStatusLabel.innerText = '402 Error';
      mainBtn.disabled = false;
      mainBtn.innerText = 'Insufficient Credits';
      return;
    }

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('D-ID Stream Creation Error:', sessionResponse.status, errorText);
      throw new Error(`D-ID Stream Creation Error: ${sessionResponse.status} ${errorText}`);
    }

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    streamId = newStreamId;
    sessionId = newSessionId;

    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      console.error('Connection setup error', e);
      sessionStatusLabel.innerText = 'Error';
      mainBtn.disabled = false;
      mainBtn.innerText = 'Retry Interview';
      return;
    }

    await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
      method: 'POST',
      headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: sessionClientAnswer, session_id: sessionId }),
    });
  } catch (err) {
    console.error('Connect failed:', err);
    sessionStatusLabel.innerText = 'Failed';
    mainBtn.disabled = false;
    mainBtn.innerText = 'Retry';
  }
}

// --- Interview & Interaction Logic ---
async function startStreamWithScript(script) {
  if ((peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') && isStreamReady) {
    // Payload adjustment to avoid 'llm' error for standard talks
    const payload = {
      script,
      session_id: sessionId
    };

    if (DID_API.service === 'talks') {
      payload.config = { stitch: true };
    }

    if (DID_API.service === 'clips') {
      payload.background = { color: '#FFFFFF' };
    }

    console.log('D-ID: Starting speech injection...', payload);

    const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('D-ID: Speech injection successful');
    } else {
      const errorText = await response.text();
      console.error('D-ID Speaking Fetch Error:', response.status, errorText);
    }

    return response;
  }
}

function addMessageToChat(role, text) {
  // Store message for report generation
  conversationHistory.push({ role, text });

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;

  const metaDiv = document.createElement('div');
  metaDiv.className = 'message-meta';
  metaDiv.innerText = role === 'user' ? 'You' : 'Interviewer';

  msgDiv.appendChild(metaDiv);
  msgDiv.appendChild(document.createTextNode(text));

  chatHistory.appendChild(msgDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function processChatMessage(message, isStart = false) {
  if (!isStart && (!message || message.trim() === "")) return;

  if (!isStart) addMessageToChat('user', message);
  mainBtn.innerText = 'AI Thinking...';
  mainBtn.classList.remove('is-listening');

  if (recognition && isRecognizing) {
    recognition.stop();
  }

  try {
    const endpoint = isStart ? 'https://hr-assistance-ai.onrender.com/start-interview' : 'https://hr-assistance-ai.onrender.com/chat';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: conversationHistory,
        interviewId: context.interviewId,
        token: context.token,
        streamId: streamId,
        sessionId: sessionId
      }),
    });

    // Check for 429 or other server errors
    if (response.status === 429) {
      addMessageToChat('interviewer', "I'm processing a lot of thoughts right now! Give me just a moment... (Rate limit reached, please try again in a few seconds).");
      mainBtn.innerText = 'Interview Live';
      return;
    }

    const data = await response.json();
    console.log('Cognitive Center response:', data);

    const responseText = data.text || data.question?.questionText;
    if (!responseText) {
      console.warn('No response text received from cognitive center.');
      addMessageToChat('interviewer', "I'm processing that... but I'm having trouble phrasing my response. Could you try again?");
      mainBtn.innerText = 'Interview Live';
      return;
    }

    addMessageToChat('interviewer', responseText);

    // Explicitly ensure video is unmuted before starting stream
    streamVideoElement.muted = false;

    console.log('D-ID: Triggering startStreamWithScript for response text...');
    const streamRes = await startStreamWithScript({
      type: 'text',
      provider: { type: 'microsoft', voice_id: 'en-US-AndrewNeural' },
      input: responseText
    });
    console.log('D-ID: startStreamWithScript returned status:', streamRes?.status);

    if (streamRes && streamRes.status >= 400) {
      const errDetails = await streamRes.json().catch(() => ({}));
      console.error('D-ID Speaking Error:', streamRes.status, errDetails);
      if (streamRes.status === 401) {
        addMessageToChat('interviewer', "System Error: Your D-ID API Key appears to be invalid (401). Please verify it in api.json.");
      } else if (streamRes.status === 403) {
        addMessageToChat('interviewer', "System Error: Access Forbidden (403). This voice or service might not be available on your current plan.");
      } else {
        addMessageToChat('interviewer', `System Error: D-ID returned ${streamRes.status}. Check console for details.`);
      }
    } else {
      // AI started speaking
      isAISpeaking = true;
      if (recognition && isRecognizing) recognition.stop();
      mainBtn.innerText = 'AI Speaking...';
      mainBtn.classList.remove('is-listening');
    }

  } catch (err) {
    console.error('Chat error:', err);
    addMessageToChat('interviewer', "I'm having a connection glitch with my cognitive center. Could you say that again?");
  } finally {
    if (!isAISpeaking) {
      mainBtn.innerText = 'Interview Live';
    }
  }
}

// --- Speech Recognition ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecognizing = false;
let silenceTimer;
let accumulatedTranscript = '';

function initRecognition() {
  if (!SpeechRecognition) return null;
  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';

  rec.onstart = () => {
    isRecognizing = true;
    accumulatedTranscript = '';
    mainBtn.innerText = 'Listening (Speak Now)';
    mainBtn.classList.add('is-listening');
    console.log('STT: Listening started');
  };

  rec.onresult = (event) => {
    if (silenceTimer) clearTimeout(silenceTimer);

    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += text + " ";
      } else {
        interim += text;
      }
    }

    if (final) {
      accumulatedTranscript += final;
    }

    // Custom 4-second silence detection
    silenceTimer = setTimeout(async () => {
      const finalResp = accumulatedTranscript.trim() || interim.trim();
      if (finalResp.length > 2) {
        console.log('STT: Silence detected, submitting:', finalResp);
        await processChatMessage(finalResp);
      }
    }, 4000);
  };

  rec.onerror = (err) => {
    if (err.error !== 'no-speech') {
      console.error('STT Error:', err.error);
    }
    isRecognizing = false;
    mainBtn.classList.remove('is-listening');
    
    // Attempt recovery on network/aborted errors after a brief pause
    if (err.error === 'network' || err.error === 'aborted') {
      console.log('STT: Attempting to recover from error in 2 seconds...');
      setTimeout(() => {
        if (!isAISpeaking && isInterviewStarted) {
           autoStartListening();
        }
      }, 2000);
    }
  };

  rec.onend = () => {
    isRecognizing = false;
    mainBtn.classList.remove('is-listening');
    if (silenceTimer) clearTimeout(silenceTimer);
    if (isInterviewStarted && mainBtn.innerText === 'Listening (Speak Now)') {
      mainBtn.innerText = 'Interview Live';
    }
  };
  return rec;
}
recognition = initRecognition();

async function autoStartListening() {
  if (!recognition || isRecognizing || isAISpeaking) return;
  try {
    recognition.start();
  } catch (e) { 
    console.warn('Auto-listen fail (already started?)', e); 
  }
}

async function checkMicPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    micStatusLabel.innerText = 'Ready';
    micStatusLabel.style.color = '#4ade80';
    return true;
  } catch (err) {
    micStatusLabel.innerText = 'Blocked';
    micStatusLabel.style.color = '#f87171';
    return false;
  }
}
checkMicPermission();

// Events
mainBtn.onclick = async () => {
  if (!isInterviewStarted) {
    await connect();
  } else if (!isRecognizing && !isAISpeaking) {
    autoStartListening();
  }
};

sendBtn.onclick = () => {
  const msg = chatInput.value;
  if (msg) { processChatMessage(msg); chatInput.value = ''; }
};

chatInput.onkeydown = (e) => { if (e.key === 'Enter') sendBtn.onclick(); };

// --- Peer Connection Listeners ---
async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    pcDataChannel = peerConnection.createDataChannel('JanusDataChannel');
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
    pcDataChannel.addEventListener('message', onStreamEvent, true);
  }
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
}

function onStreamEvent(message) {
  if (pcDataChannel.readyState === 'open') {
    const [event, _] = message.data.split(':');
    streamEventLabel.innerText = event;

    if (event === 'stream/ready') {
      setTimeout(() => {
        isStreamReady = true;
        sessionStatusLabel.innerText = 'Live';
        isInterviewStarted = true;
        processChatMessage(null, true); // First Question
        userInputArea.classList.remove('hidden');
        document.getElementById('end-interview-btn').classList.remove('hidden');
      }, 1000);
    } else if (event === 'stream/started') {
      isAISpeaking = true;
      if (recognition && isRecognizing) recognition.stop();
      mainBtn.innerText = 'AI Speaking...';
      mainBtn.classList.remove('is-listening');
    } else if (event === 'stream/done') {
      isAISpeaking = false;
      console.log('AI finished speaking, starting listener');
      mainBtn.innerText = 'Interview Live';
      // Give the browser audio pipeline 1.5s to settle before grabbing mic again
      setTimeout(autoStartListening, 1500);
    }
  }
}

// --- Reporting Logic ---
const endInterviewBtn = document.getElementById('end-interview-btn');
const reportModal = document.getElementById('report-modal');
const reportText = document.getElementById('report-text');
const reportScore = document.getElementById('report-score');
const downloadBtn = document.getElementById('download-btn');
const goDashboardBtn = document.getElementById('go-dashboard-btn');
const closeReport = document.getElementById('close-report');

endInterviewBtn.onclick = async () => {
  stopAllStreams();
  closePC();

  // Reset UI
  endInterviewBtn.classList.add('hidden');
  userInputArea.classList.add('hidden');

  // Show Loading Modal
  reportModal.classList.remove('hidden');
  document.getElementById('report-loading-spinner').classList.remove('hidden');
  document.getElementById('report-content-area').classList.add('hidden');
  reportScore.innerText = "--";

  try {
    const response = await fetch(`https://hr-assistance-ai.onrender.com/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.token}`
      },
      body: JSON.stringify({
        history: conversationHistory,
        applicationId: context.applicationId,
        token: context.token
      })
    });

    const data = await response.json();
    const report = data.report || data;
    const analysis = report.detailedAnalysis || report;

    // Update UI with rich data
    document.getElementById('report-loading-spinner').classList.add('hidden');
    document.getElementById('report-content-area').classList.remove('hidden');

    reportScore.innerText = report.overallScore || report.score || "70";
    document.getElementById('tech-score-val').innerText = `${analysis.technical_score || 0}/10`;
    document.getElementById('comm-score-val').innerText = `${analysis.communication_score || 0}/10`;

    // Summary
    document.getElementById('summary-text').innerText = analysis.summary || report.text || "Interview successfully analyzed.";

    // Strengths
    const strengthsList = document.getElementById('strengths-list');
    strengthsList.innerHTML = '';
    (analysis.strengths || []).forEach(s => {
      const li = document.createElement('li');
      li.innerText = s;
      strengthsList.appendChild(li);
    });

    // Weaknesses
    const weaknessesList = document.getElementById('weaknesses-list');
    weaknessesList.innerHTML = '';
    (analysis.weaknesses || analysis.areas_for_improvement || []).forEach(w => {
      const li = document.createElement('li');
      li.innerText = w;
      weaknessesList.appendChild(li);
    });

    // Enable PDF Download
    downloadBtn.disabled = false;
    downloadBtn.onclick = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Style PDF
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(116, 89, 254); // Primary color
      doc.text("Interview Performance Report", 20, 20);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Score: ${reportScore.innerText}/100`, 20, 37);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 45, 190, 45);

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Executive Summary", 20, 55);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(document.getElementById('summary-text').innerText, 170);
      doc.text(summaryLines, 20, 62);

      let currentY = 62 + (summaryLines.length * 5) + 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Key Strengths", 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      currentY += 7;
      (analysis.strengths || []).forEach(s => {
        doc.text(`• ${s}`, 25, currentY);
        currentY += 6;
      });

      currentY += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Areas for Improvement", 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      currentY += 7;
      (analysis.weaknesses || analysis.areas_for_improvement || []).forEach(w => {
        doc.text(`• ${w}`, 25, currentY);
        currentY += 6;
      });

      doc.save(`Interview_Report_${context.interviewId}.pdf`);
    };

    // Redirection Logic
    let countdown = 15;
    const redirectLabel = document.createElement('div');
    redirectLabel.style.marginTop = '20px';
    redirectLabel.style.color = 'var(--primary)';
    redirectLabel.style.textAlign = 'center';
    redirectLabel.style.fontWeight = 'bold';
    document.querySelector('.modal-content').appendChild(redirectLabel);

    const timer = setInterval(() => {
      redirectLabel.innerText = `View full analysis in Reports in ${countdown}s...`;
      if (countdown <= 0) {
        clearInterval(timer);
        window.location.href = 'https://hr-assistance-ai.vercel.app/candidate/reports';
      }
      countdown--;
    }, 1000);

    goDashboardBtn.onclick = () => {
      clearInterval(timer);
      window.location.href = 'https://hr-assistance-ai.vercel.app/candidate/reports';
    };

  } catch (err) {
    console.error('Report Error:', err);
    document.getElementById('report-loading-spinner').innerHTML = `
      <div style="color: #ef4444;">Error generating report.</div>
      <div style="font-size: 0.8rem; margin-top: 10px;">Please check the dashboard manually.</div>
    `;
    goDashboardBtn.innerText = "Go to Dashboard";
    goDashboardBtn.onclick = () => {
      window.location.href = 'https://hr-assistance-ai.vercel.app/candidate';
    };
  }
};

closeReport.onclick = () => {
  reportModal.classList.add('hidden');
  // Reset for next session
  conversationHistory = [];
};

downloadBtn.onclick = () => {
  const content = `INTERVIEW PERFORMANCE REPORT\n\n${reportText.innerText}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Interview_Report_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// Boilerplate Helpers
function onIceGatheringStateChange() { iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState; }
function onIceCandidate(event) {
  const body = event.candidate ? { candidate: event.candidate.candidate, sdpMid: event.candidate.sdpMid, sdpMLineIndex: event.candidate.sdpMLineIndex, session_id: sessionId } : { session_id: sessionId };
  fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
    method: 'POST',
    headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(err => console.warn('ICE Candidate Error (non-critical):', err));
}
function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') { stopAllStreams(); closePC(); }
}
function onConnectionStateChange() {
  peerStatusLabel.innerText = peerConnection.connectionState;
  if (peerConnection.connectionState === 'connected') {
    playIdleVideo();
    setTimeout(() => { if (!isStreamReady) { isStreamReady = true; onStreamEvent({ data: 'stream/ready' }); } }, 5000);
  }
}
function onSignalingStateChange() { signalingStatusLabel.innerText = peerConnection.signalingState; }
function onVideoStatusChange(playing, stream) {
  videoIsPlaying = playing;
  streamVideoOpacity = (playing && isStreamReady) ? 1 : 0;
  streamVideoElement.style.opacity = streamVideoOpacity;
  idleVideoElement.style.opacity = 1 - streamVideoOpacity;
  streamingStatusLabel.innerText = playing ? 'streaming' : 'idle';
  if (playing) setStreamVideoElement(stream);
}
function onTrack(event) {
  if (!event.track) return;
  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const changed = videoIsPlaying !== report.bytesReceived > lastBytesReceived;
        if (changed) onVideoStatusChange(report.bytesReceived > lastBytesReceived, event.streams[0]);
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 500);
}
function setStreamVideoElement(stream) {
  streamVideoElement.srcObject = stream;
  streamVideoElement.loop = false;
  if (isStreamReady) streamVideoElement.muted = false;
  if (streamVideoElement.paused) streamVideoElement.play().catch(() => { });
}
function playIdleVideo() {
  idleVideoElement.src = DID_API.service == 'clips' ? 'alex_v2_idle.mp4' : 'indian-idle.mp4';
  idleVideoElement.muted = true; // Stay muted for idle
  idleVideoElement.play().catch(() => { });
}
function stopAllStreams() { if (streamVideoElement.srcObject) { streamVideoElement.srcObject.getTracks().forEach((track) => track.stop()); streamVideoElement.srcObject = null; } }
function closePC(pc = peerConnection) {
  if (!pc) return;
  pc.close();
  clearInterval(statsIntervalId);
  isStreamReady = !stream_warmup;
  isInterviewStarted = false;
  if (pc === peerConnection) peerConnection = null;
  mainBtn.innerText = 'Start Technical Interview';
  mainBtn.disabled = false;
}
async function fetchWithRetries(url, options, retries = 1) {
  try { return await fetch(url, options); } catch (err) {
    if (retries <= 3) { await new Promise(r => setTimeout(r, 1000)); return fetchWithRetries(url, options, retries + 1); }
    throw err;
  }
}
document.getElementById('destroy-button').onclick = () => { stopAllStreams(); closePC(); document.getElementById('dev-overlay').classList.add('hidden'); };
