'use strict';
const fetchJsonFile = await fetch('./api.json');
const DID_API = await fetchJsonFile.json();

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

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
const urlParams = new URLSearchParams(window.location.search);
const context = {
  applicationId: urlParams.get('applicationId'),
  interviewId: urlParams.get('interviewId'),
  token: urlParams.get('token')
};
console.log('Session Context:', context);

const presenterInputByService = {
  talks: { source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg' },
  clips: { presenter_id: 'v2_public_alex@qcvo4gupoy', driver_id: 'e3nbserss8' },
};

// --- Connection Logic ---
async function connect() {
  if (peerConnection && peerConnection.connectionState === 'connected') return;

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
    const response = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ script, config: { stitch: true }, session_id: sessionId, ...(DID_API.service === 'clips' && { background: { color: '#FFFFFF' } }) }),
    });

    if (response.status === 402) {
      addMessageToChat('interviewer', "I've run out of voice credits! Please refill your D-ID account to keep talking.");
      return response;
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
    const endpoint = isStart ? '/start-interview' : '/chat';
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
    addMessageToChat('interviewer', data.text);

    // Explicitly ensure video is unmuted before starting stream
    streamVideoElement.muted = false;

    const streamRes = await startStreamWithScript({
      type: 'text',
      provider: { type: 'microsoft', voice_id: 'en-US-AndrewNeural' },
      input: data.text
    });

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
    const hasPerm = await checkMicPermission();
    if (hasPerm) recognition.start();
  } catch (e) { console.warn('Auto-listen fail', e); }
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
      setTimeout(autoStartListening, 500);
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

  // Explicit completion message
  addMessageToChat('interviewer', "Thank you. The interview is now complete. I am generating your evaluation report, please wait a moment...");

  // Show Loading Modal
  reportModal.classList.remove('hidden');
  reportText.innerText = "Analyzing your performance... please wait.";
  reportScore.innerText = "--";

  try {
    // Call the MAIN backend to finish the interview and generate the HIGHER QUALITY report
    const response = await fetch(`http://localhost:3003/interviews/${context.interviewId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.token}`
      }
    });

    const data = await response.json();

    // Use the richer response from the main backend
    const report = data.report || data;
    const analysis = report.detailedAnalysis || report;

    // Format the display text for the modal
    let displayHtml = `
      <div style="text-align: left; padding: 10px;">
        <p><strong>Status:</strong> ${report.recommendation || 'Completed'}</p>
        <p><strong>Joining Probability:</strong> ${report.detailedAnalysis?.joining_probability_percent || '--'}%</p>
        <p><strong>Decision:</strong> ${report.detailedAnalysis?.fit_for_role || 'Reviewed'}</p>
        <hr style="opacity: 0.2; margin: 15px 0;" />
        <p><strong>Detailed Feedback:</strong></p>
        <p style="font-style: italic; opacity: 0.8;">${report.detailedAnalysis?.summary || report.text || 'Analysis pending...'}</p>
      </div>
    `;

    reportText.innerHTML = displayHtml;
    reportScore.innerText = report.overallScore || report.score || "70";

    // Redirection Logic
    let countdown = 10;
    const redirectLabel = document.createElement('div');
    redirectLabel.style.marginTop = '20px';
    redirectLabel.style.color = 'var(--primary)';
    redirectLabel.style.textAlign = 'center';
    redirectLabel.style.fontWeight = 'bold';
    reportText.parentNode.insertBefore(redirectLabel, reportText.nextSibling);

    const timer = setInterval(() => {
      redirectLabel.innerText = `Redirecting to Dashboard in ${countdown}s...`;
      if (countdown <= 0) {
        clearInterval(timer);
        window.location.href = 'http://localhost:3000/candidate';
      }
      countdown--;
    }, 1000);

    goDashboardBtn.onclick = () => {
      clearInterval(timer);
      window.location.href = 'http://localhost:3000/candidate';
    };

  } catch (err) {
    console.error('Report Error:', err);
    reportText.innerText = "Error generating report. Please check the dashboard manually.";

    // Fallback sync attempt using the local D-ID server endpoint if necessary
    // But since context is passed, we shouldn't really need a double-sync here.

    goDashboardBtn.classList.remove('hidden');
    goDashboardBtn.onclick = () => {
      window.location.href = 'http://localhost:3000/candidate';
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
function playIdleVideo() { idleVideoElement.src = DID_API.service == 'clips' ? 'alex_v2_idle.mp4' : 'emma_idle.mp4'; }
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
