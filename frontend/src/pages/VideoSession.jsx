import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectSocket } from '../config/socket.js';
import VideoPlayer from '../components/video/VideoPlayer';
import SessionControls from '../components/video/SessionControls';
import SessionChat from '../components/video/SessionChat';
import ReviewModal from '../components/ReviewModal';

import { SOCKET_URL } from '../config/api.js';
import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoSession = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const { user: firebaseUser } = useAuth();
  const userEmail = firebaseUser?.email;

  // ── Session state ──────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [pageStatus, setPageStatus] = useState('loading'); // loading | joining | live | error | expired | denied | too-early
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // ── Media state ───────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | waiting | connected | disconnected

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('notes'); // notes | chat | info
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const hasInitiatedOffer = useRef(false);
  const hasJoinedRef = useRef(false);

  // ── Timer display ─────────────────────────────────────────────────────────
  const [timerDisplay, setTimerDisplay] = useState('00:00');

  useEffect(() => {
    if (!sessionStartTime) return;
    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000));
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      const pad = (n) => String(n).padStart(2, '0');
      setTimerDisplay(h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [sessionStartTime]);

  // ── Load notes ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !userEmail) return;
    apiFetch(`/api/video-session/notes/${sessionId}?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.ok ? r.json() : { content: '' })
      .then((data) => setNotesContent(data.content || ''))
      .catch(() => {});
  }, [sessionId, userEmail]);

  const saveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await apiFetch(`/api/video-session/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userEmail, content: notesContent }),
      });
      if (!res.ok) throw new Error();
      toast.success('Notes saved successfully');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // ── WebRTC Setup ──────────────────────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate && remoteSocketIdRef.current) {
        socketRef.current?.emit('rtc:ice-candidate', {
          candidate: e.candidate,
          targetSocketId: remoteSocketIdRef.current,
        });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      setConnectionStatus('connected');
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionStatus('disconnected');
        toast.warning('Connection lost. The other participant may have left.');
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerRef.current = pc;
    return pc;
  }, []);

  const acquireMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setLocalStream(audioOnly);
          localStreamRef.current = audioOnly;
          setIsCameraOff(true);
          toast.warning('Camera access denied — joining with audio only.');
          return audioOnly;
        } catch {
          setPageStatus('denied');
          setErrorMessage('Microphone access is required to join the session. Please allow mic access and try again.');
          return null;
        }
      }
      setPageStatus('error');
      setErrorMessage('Could not access camera or microphone. Please check your device settings.');
      return null;
    }
  };

  const joinSession = useCallback(async () => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;
    setPageStatus('joining');

    const stream = await acquireMedia();
    if (!stream) return;

    try {
      const res = await apiFetch(`/api/video-session/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.scheduledAt) {
          setPageStatus('too-early');
        } else if (res.status === 403) {
          setPageStatus('error');
          setErrorMessage('You are not a participant in this session.');
        } else {
          setPageStatus('error');
          setErrorMessage(data.message || 'Failed to join session.');
        }
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      setRoomId(data.roomId);
      setSessionStartTime(Date.now());
      setPageStatus('live');
      setConnectionStatus('waiting');

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      const socket = await connectSocket();
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('rtc:join-room', { roomId: data.roomId, userEmail });
      });

      socket.on('rtc:peer-joined', async ({ userEmail: peerEmail, socketId }) => {
        if (hasInitiatedOffer.current) return;
        hasInitiatedOffer.current = true;
        remoteSocketIdRef.current = socketId;
        toast.info(`${peerEmail} joined the session`);

        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('rtc:offer', {
          roomId: data.roomId,
          offer,
          targetSocketId: socketId,
        });
      });

      socket.on('rtc:offer', async ({ offer, fromSocketId }) => {
        remoteSocketIdRef.current = fromSocketId;
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('rtc:answer', { answer, targetSocketId: fromSocketId });
      });

      socket.on('rtc:answer', async ({ answer }) => {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on('rtc:ice-candidate', async ({ candidate }) => {
        try {
          if (peerRef.current && candidate) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (e) {
          console.warn('ICE candidate error:', e);
        }
      });

      socket.on('rtc:peer-left', ({ userEmail: peerEmail }) => {
        setRemoteStream(null);
        setConnectionStatus('waiting');
        hasInitiatedOffer.current = false;
        peerRef.current?.close();
        peerRef.current = null;
        toast.info(`${peerEmail} left the session`);
      });

      socket.on('rtc:chat-message', (msg) => {
        setChatMessages((prev) => {
          if (prev.some(m => m.timestamp === msg.timestamp && m.senderEmail === msg.senderEmail)) {
            return prev;
          }
          return [...prev, msg];
        });
        if (activeTabRef.current !== 'chat') {
          toast.info(`New message from ${msg.senderEmail.split('@')[0]}`);
        }
      });

    } catch (err) {
      console.error('Join session error:', err);
      setPageStatus('error');
      setErrorMessage('Failed to join session. Please try again.');
    }
  }, [sessionId, userEmail, createPeerConnection]); // Removed activeTab

  // ── Polling Fallback to clear waiting screen ────────────────────────────────
  useEffect(() => {
    if (pageStatus !== 'live' || connectionStatus !== 'waiting') return;

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/video-session/${sessionId}?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (data.activeParticipantCount === 2) {
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error('Polling failed', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pageStatus, connectionStatus, sessionId, userEmail]);

  // ── 10 Minute Timeout Reminder ──────────────────────────────────────────────
  useEffect(() => {
    if (pageStatus !== 'live' || connectionStatus !== 'waiting' || !session?.chatRoomId) return;

    const timeout = setTimeout(async () => {
      const chatSocket = await connectSocket();
      chatSocket.emit('registerUser', userEmail);
      chatSocket.emit('sendMessage', {
        chatRoomId: session.chatRoomId,
        senderEmail: userEmail,
        text: "Hey, I'm waiting in the session room. Ready to join?",
      });
      setTimeout(() => chatSocket.disconnect(), 1000);
      toast.info('Sent a reminder to the other participant in the chat.');
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearTimeout(timeout);
  }, [pageStatus, connectionStatus, session, userEmail]);

  const roomIdRef = useRef(roomId);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  const leaveSession = useCallback(async (silent = false) => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    peerRef.current?.close();
    peerRef.current = null;

    if (socketRef.current) {
      if (roomIdRef.current) {
        socketRef.current.emit('rtc:leave-room', { roomId: roomIdRef.current, userEmail });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    try {
      await apiFetch(`/api/video-session/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userEmail }),
      });
      if (!silent) {
        await apiFetch(`/api/sessions/${sessionId}/complete`, {
          method: 'PUT'
        });
      }
    } catch (e) {
      console.warn('Failed to record leave:', e);
    }

    if (!silent) {
      setIsReviewOpen(true);
    }
  }, [sessionId, userEmail]); // Removed roomId

  useEffect(() => {
    if (!userEmail) {
      navigate('/signin');
      return;
    }

    apiFetch(`/api/video-session/${sessionId}?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
          joinSession();
        } else {
          setPageStatus('error');
          setErrorMessage(data.message || 'Session not found.');
        }
      })
      .catch(() => {
        setPageStatus('error');
        setErrorMessage('Could not connect to the server. Please try again.');
      });

    return () => {
      leaveSession(true);
    };
  }, [sessionId, userEmail, joinSession, leaveSession, navigate]);

  // ── Media controls ────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (peerRef.current && videoTrack) {
        const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
        sender?.replaceTrack(videoTrack);
      }
      setIsScreenSharing(false);
      setLocalStream(localStreamRef.current);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerRef.current) {
          const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
          sender?.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (peerRef.current && camTrack) {
            const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
            sender?.replaceTrack(camTrack);
          }
          setLocalStream(localStreamRef.current);
        };

        setIsScreenSharing(true);
        const previewStream = new MediaStream([screenTrack, ...(localStreamRef.current?.getAudioTracks() || [])]);
        setLocalStream(previewStream);
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast.error('Screen sharing failed. Please try again.');
        }
      }
    }
  };

  const toggleHand = () => {
    setIsHandRaised((prev) => !prev);
    // UI pure state for now per requirements
  };

  const sendChatMessage = (text) => {
    const msg = { senderEmail: userEmail, text, timestamp: Date.now() };
    socketRef.current?.emit('rtc:chat-message', { roomId, ...msg });
    setChatMessages((prev) => [...prev, msg]);
  };

  // ── Render States ─────────────────────────────────────────────────────────

  if (pageStatus === 'loading' || pageStatus === 'joining') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid var(--accent-dim)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite', marginBottom: 32 }} />
        <h2 className="text-h2" style={{ marginBottom: 8 }}>{pageStatus === 'loading' ? 'Loading Session...' : 'Joining Session...'}</h2>
        <p className="text-caption">Setting up your camera and microphone</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (pageStatus === 'denied' || pageStatus === 'error' || pageStatus === 'expired' || pageStatus === 'too-early') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
        <div className="card-glass" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{pageStatus === 'expired' ? '⏰' : pageStatus === 'too-early' ? '⏳' : '⚠️'}</div>
          <h2 className="text-h2" style={{ marginBottom: 8 }}>{pageStatus === 'too-early' ? 'Too Early' : 'Session Error'}</h2>
          <p className="text-caption" style={{ marginBottom: 24 }}>{errorMessage || 'Unable to join session.'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const remoteUserEmail = session?.participants?.find((p) => p !== userEmail);
  const otherParticipant = remoteUserEmail?.split('@')[0] || 'Unknown';
  const youParticipant = userEmail?.split('@')[0] || 'You';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', zIndex: 50, overflow: 'hidden' }}>
      
      {/* ── Topbar (56px) ── */}
      <div style={{ height: 56, background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-bg)', border: '1px solid var(--red)', padding: '2px 8px', borderRadius: 9999 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', letterSpacing: '0.05em' }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>SkillX session</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Video · {session?.duration || '60 mins'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 9999, padding: '4px 12px' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)' }}>[R]</span> {youParticipant} (you)
            </span>
            <i className="ti ti-arrows-exchange" style={{ fontSize: 14, color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)' }}>[A]</span> {otherParticipant}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 9999, padding: '4px 12px' }}>
            <i className="ti ti-clock" style={{ fontSize: 14, color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{timerDisplay}</span>
          </div>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Video Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <VideoPlayer
            localStream={localStream}
            remoteStream={remoteStream}
            connectionStatus={connectionStatus}
            remoteUserEmail={remoteUserEmail}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            userEmail={userEmail}
          />
        </div>

        {/* Side Panel (280px) */}
        <div style={{ width: 280, background: 'var(--panel)', borderLeft: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)' }}>
            {['Notes', 'Chat', 'Info'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === tab.toLowerCase() ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Session notes</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Jot down key points while waiting — notes auto-save with the session.
                  </p>
                  <textarea
                    value={notesContent}
                    onChange={(e) => setNotesContent(e.target.value)}
                    style={{
                      width: '100%',
                      height: 90,
                      background: 'var(--surface2)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 13,
                      color: 'var(--text)',
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-dim)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button
                    onClick={saveNotes}
                    disabled={isSavingNotes}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      marginTop: 8,
                      cursor: 'pointer'
                    }}
                  >
                    {isSavingNotes ? 'Saving...' : 'Save notes'}
                  </button>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Session details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 12px', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Date</span>
                    <span style={{ color: 'var(--text)' }}>{session?.date || 'Today'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Time</span>
                    <span style={{ color: 'var(--text)' }}>{session?.time || 'Now'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                    <span style={{ color: 'var(--text)' }}>{session?.duration || '60 mins'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Type</span>
                    <span style={{ color: 'var(--text)' }}>Video Call</span>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Skills being exchanged</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(session?.skillOffered ? [session.skillOffered] : ['React', 'Design']).map((skill, i) => (
                      <span key={i} style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 500 }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <SessionChat messages={chatMessages} onSendMessage={sendChatMessage} currentUserEmail={userEmail} />
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                <p><strong>Session ID:</strong> {sessionId}</p>
                <p><strong>Host:</strong> {session?.requesterEmail === userEmail ? 'You' : otherParticipant}</p>
                <p><strong>Status:</strong> {connectionStatus}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Controls Bar (72px) ── */}
      <SessionControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        timerDisplay={timerDisplay}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreen={toggleScreenShare}
        onToggleHand={toggleHand}
        onLeave={() => leaveSession(false)}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          navigate('/dashboard');
        }}
        onSubmit={async ({ rating, feedback }) => {
          setIsSubmittingReview(true);
          try {
            await apiFetch(`/api/reviews`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reviewerEmail: userEmail, reviewedUserEmail: remoteUserEmail, sessionId, rating, feedback }),
            });
          } finally {
            setIsSubmittingReview(false);
            setIsReviewOpen(false);
            navigate('/dashboard');
          }
        }}
        isSubmitting={isSubmittingReview}
        sessionId={sessionId}
        reviewedUserEmail={remoteUserEmail}
      />
    </div>
  );
};

export default VideoSession;
