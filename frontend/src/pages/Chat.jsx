import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import SessionModal from '../components/SessionModal';
import SessionCard from '../components/SessionCard';
import ReviewModal from '../components/ReviewModal';

import WorkspaceTabs from '../components/workspace/WorkspaceTabs';
import ResourcesPanel from '../components/workspace/ResourcesPanel';
import NotesPanel from '../components/workspace/NotesPanel';
import TaskPanel from '../components/workspace/TaskPanel';

import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { getSocket, connectSocket } from '../config/socket.js';
import { useNow } from '../hooks/useNow';
import { toast } from 'sonner';
import { getAvatarColors } from '../utils/avatarUtils';
let socket;

const formatMessageTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const groupMessagesByDate = (messages) => {
  const groups = {};
  messages.forEach(msg => {
    const dateObj = new Date(msg.createdAt);
    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    let label = dateStr;
    if (dateStr === today) label = 'Today';
    else if (dateStr === yesterday) label = 'Yesterday';

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  return groups;
};

const Chat = () => {
  const [rooms, setRooms] = useState([]);
  
  // New UI states
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const isScrolledToBottomRef = useRef(true);

  // Workspace States
  const [activeTab, setActiveTab] = useState('chat');
  const [workspace, setWorkspace] = useState(null);

  // Session states
  const [roomSessions, setRoomSessions] = useState([]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [sessionTrayOpen, setSessionTrayOpen] = useState(false);

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingSession, setReviewingSession] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  let typingTimeoutRef = useRef(null);
  const activeRoomRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const { user: firebaseUser } = useAuth();
  const user = firebaseUser;
  const userEmail = user?.email;
  const location = useLocation();

  const fetchMessages = useCallback(async (roomId) => {
    try {
      const res = await apiFetch(`/api/chat/messages/${roomId}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  }, []);

  const fetchRoomSessions = useCallback(async (roomId) => {
    try {
      const res = await apiFetch(`/api/sessions/room/${roomId}`);
      const data = await res.json();
      setRoomSessions(data);
      // Auto-open tray if pending sessions
      if (data.some(s => s.status === 'Pending')) {
        setSessionTrayOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    }
  }, []);

  const fetchWorkspace = useCallback(async (roomId, roomParticipants) => {
    try {
      const res = await apiFetch(`/api/workspace/${roomId}`, {
        headers: { participants: roomParticipants.join(',') }
      });
      const data = await res.json();
      setWorkspace(data);
    } catch (err) {
      console.error('Failed to fetch workspace', err);
    }
  }, []);

  const handleRoomClick = useCallback((room) => {
    if (activeRoom && activeRoom._id !== room._id) {
      socket?.emit('leaveRoom', activeRoom._id);
    }
    setActiveRoom(room);
    setActiveTab('chat');
    setSessionTrayOpen(false);
    setRoomSessions([]);
    
    // Clear unread
    setRooms(prev => prev.map(r => r._id === room._id ? { ...r, unreadCount: 0 } : r));

    fetchMessages(room._id);
    fetchRoomSessions(room._id);
    fetchWorkspace(room._id, room.participants || []);

    socket?.emit('joinRoom', { chatRoomId: room._id, userEmail });
  }, [activeRoom, fetchMessages, fetchRoomSessions, fetchWorkspace, userEmail]);

  const groupedRooms = useMemo(() => {
    return rooms.reduce((acc, room) => {
      const otherUser = room.participants.find((p) => p !== userEmail && p && p.trim() !== '')
        || room.participants.find((p) => p !== userEmail)
        || 'Unknown User';
      if (!acc[otherUser]) acc[otherUser] = [];
      acc[otherUser].push(room);
      return acc;
    }, {});
  }, [rooms, userEmail]);

  const handlePersonClick = useCallback((personEmail) => {
    setSelectedPerson(personEmail);
    // Auto-select the first room for this person
    const personRooms = groupedRooms[personEmail] || [];
    if (personRooms.length > 0) {
      handleRoomClick(personRooms[0]);
    }
  }, [groupedRooms, handleRoomClick]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/chat/${userEmail}`);
      const data = await res.json();
      setRooms(data);

      if (location.state?.roomId) {
        const roomId = location.state.roomId
        let targetRoom = data.find(r => r._id === roomId)

        if (!targetRoom) {
          // Room not in list — fetch it directly
          try {
            const roomRes = await apiFetch(`/api/chat/room/${roomId}`)
            if (roomRes.ok) {
              targetRoom = await roomRes.json()
              // Add it to rooms list so sidebar shows it
              setRooms(prev => {
                const exists = prev.find(r => r._id === targetRoom._id)
                return exists ? prev : [targetRoom, ...prev]
              })
            }
          } catch (e) {
            console.warn('Could not fetch room directly:', e)
          }
        }

        if (targetRoom) {
          const otherUser = targetRoom.participants.find((p) => p !== userEmail && p && p.trim() !== '')
            || targetRoom.participants.find((p) => p !== userEmail)
            || 'Unknown User'
          setSelectedPerson(otherUser)
          handleRoomClick(targetRoom)
          window.history.replaceState({}, document.title)
        }
      }

      if (location.state?.selectPerson && !location.state?.roomId) {
        const personEmail = location.state.selectPerson
        const personRoom = data.find(r =>
          r.participants.includes(personEmail)
        )
        if (personRoom) {
          setSelectedPerson(personEmail)
          window.history.replaceState({}, document.title)
        }
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  }, [userEmail, location.state, handleRoomClick]);

  useEffect(() => {
    socket = getSocket();
    const initSocket = async () => {
      if (userEmail) {
        await connectSocket();
        socket.emit('registerUser', userEmail);
      }
    };
    initSocket();

    socket.on('receiveMessage', (message) => {
      if (activeRoomRef.current && message.chatRoomId === activeRoomRef.current._id) {
        setMessages((prev) => {
          const newMessages = [...prev, message];
          if (isScrolledToBottomRef.current) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }
          return newMessages;
        });
      }
    });

    socket.on('userTyping', ({ email }) => setTypingUsers(prev => ({ ...prev, [email]: true })));
    socket.on('userStoppedTyping', ({ email }) => setTypingUsers(prev => ({ ...prev, [email]: false })));
    socket.on('userStatusChange', ({ email, isOnline }) => setOnlineUsers(prev => ({ ...prev, [email]: isOnline })));

    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      socket.off('userStatusChange');
    };
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) {
      fetchRooms();
    }
  }, [userEmail, fetchRooms]);

  useEffect(() => {
    if (activeRoom) {
      activeRoomRef.current = activeRoom;
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    }
  }, [activeRoom]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    socket?.emit('sendMessage', {
      chatRoomId: activeRoom._id,
      senderEmail: userEmail,
      text: newMessage,
    });
    setNewMessage('');
    socket?.emit('stopTyping', { chatRoomId: activeRoom._id, email: userEmail });
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    isScrolledToBottomRef.current = true;
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!activeRoom) return;

    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { chatRoomId: activeRoom._id, email: userEmail });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('stopTyping', { chatRoomId: activeRoom._id, email: userEmail });
    }, 2000);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isBottom = scrollHeight - scrollTop - clientHeight < 50;
    isScrolledToBottomRef.current = isBottom;
  };

  const openScheduleModal = (initialData = null) => {
    setEditingSession(initialData);
    setIsSessionModalOpen(true);
  };

  const handleSessionSubmit = async (sessionData) => {
    setIsSubmittingSession(true);
    try {
      if (editingSession && editingSession._id && editingSession.status !== 'Pending') {
        const res = await apiFetch(`/api/sessions/${editingSession._id}/reschedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const otherUser = activeRoom.participants.find(p => p !== userEmail);
        const durMins = parseInt(sessionData.duration.split(' ')[0]) || 60;
        const [h, m] = sessionData.time.split(':').map(Number);
        const endMins = (h * 60 + m) + durMins;
        const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
        const endM = (endMins % 60).toString().padStart(2, '0');
        const endTime = `${endH}:${endM}`;

        const payload = {
          ...sessionData,
          startTime: sessionData.time,
          endTime,
          chatRoomId: activeRoom._id,
          participants: [userEmail, otherUser],
          requestedBy: userEmail,
          force: true
        };
        const res = await apiFetch(`/api/schedule/session/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          toast.error(`Could not create session: ${errData.error || errData.message || 'Unknown error'}`);
          throw new Error('Failed to create session');
        }

        if (editingSession && editingSession._id && editingSession.status === 'Pending') {
          await apiFetch(`/api/sessions/${editingSession._id}/cancel`, { method: 'PUT' });
        }
      }
      setIsSessionModalOpen(false);
      setEditingSession(null);
      fetchRoomSessions(activeRoom._id);
      toast.success(editingSession?._id ? 'Session updated!' : 'Session request sent!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const handleSessionAction = async (sessionId, action) => {
    try {
      const res = await apiFetch(`/api/sessions/${sessionId}/${action}`, { method: 'PUT' });
      if (!res.ok) throw new Error(`Failed to ${action} session`);
      fetchRoomSessions(activeRoom._id);
      if (action === 'accept') toast.success('Session accepted!');
      else if (action === 'decline') toast.info('Session declined.');
      else if (action === 'cancel') toast.info('Session cancelled.');
      else if (action === 'complete') toast.success('Session marked as completed!');
    } catch (error) {
      console.error('Failed session action', error);
      toast.error(`Could not ${action} session. Please try again.`);
    }
  };

  const handleReviewSubmit = async ({ sessionId, reviewedUserEmail, rating, feedback }) => {
    setIsSubmittingReview(true);
    try {
      const res = await apiFetch(`/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerEmail: userEmail, reviewedUserEmail, sessionId, rating, feedback }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setIsReviewModalOpen(false);
      setReviewingSession(null);
      fetchRoomSessions(activeRoom._id);
    } catch (error) {
      console.error('Failed to submit review', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const timeAgo = (dateStr, now) => {
    if (!dateStr) return '';
    const diff = Math.floor((now - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const now = useNow();

  if (!user) return <div className="p-8 text-center text-[var(--text-muted)]">Please sign in to view messages.</div>;

  const activeOtherUserEmail = activeRoom?.participants?.find((p) => p !== userEmail);
  const groupedMessages = groupMessagesByDate(messages);

  const filteredPeople = Object.keys(groupedRooms).filter(email => 
    email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main style={{ height: 'calc(100vh - 56px)', display: 'grid', gridTemplateColumns: '230px 200px 1fr', background: 'var(--bg)', overflow: 'hidden' }}>
      
      {/* ── COL 1: PEOPLE LIST ── */}
      <section style={{ background: 'var(--panel)', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '16px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-messages" style={{ color: 'var(--accent)' }} /> Messages
            </h2>
            <button style={{ width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer' }}>
              <i className="ti ti-pencil" style={{ fontSize: 14 }} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 32px',
                background: 'var(--surface2)', border: '0.5px solid var(--border)',
                borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredPeople.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No conversations</div>
          ) : (
            filteredPeople.map(email => {
              const personRooms = groupedRooms[email];
              const isActive = selectedPerson === email;
              const isOnline = onlineUsers[email];
              const totalUnread = personRooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
              
              const gigChats = personRooms.filter(r => r.referenceType === 'gig').length;
              const exChats = personRooms.filter(r => r.referenceType === 'exchange').length;
              const threadSummaries = [];
              if (gigChats > 0) threadSummaries.push('Gig chat');
              if (exChats > 0) threadSummaries.push('Exchange chat');

              return (
                <div
                  key={email}
                  onClick={() => handlePersonClick(email)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12,
                    cursor: 'pointer', background: isActive ? 'var(--surface2)' : 'transparent',
                    borderRight: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    borderBottom: '0.5px solid var(--border)'
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarColors(email).bg, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: getAvatarColors(email).text }}>
                      {email[0].toUpperCase()}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2, width: 10, height: 10,
                      borderRadius: '50%', background: isOnline ? 'var(--green)' : 'var(--text-dim)',
                      border: '2px solid var(--panel)'
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.split('@')[0]}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {threadSummaries.join(' · ')}
                    </div>
                  </div>
                  {totalUnread > 0 && (
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                      {totalUnread}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* ── COL 2: THREADS ── */}
      <section style={{ background: 'var(--bg)', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 5 }}>
        {selectedPerson ? (
          <>
            <div style={{ padding: '24px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: getAvatarColors(selectedPerson).bg, color: getAvatarColors(selectedPerson).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                  {selectedPerson[0].toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: onlineUsers[selectedPerson] ? 'var(--green)' : 'var(--text-dim)', border: '2px solid var(--bg)' }} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{selectedPerson.split('@')[0]}</h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{onlineUsers[selectedPerson] ? 'Online' : 'Offline'}</div>
            </div>

            <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 12 }}>
                Conversations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(groupedRooms[selectedPerson] || []).map(room => {
                  const isActive = activeRoom?._id === room._id;
                  const isGig = room.referenceType === 'gig';
                  const bgColor = isGig ? 'var(--amber-bg)' : 'var(--accent-dim)';
                  const iconColor = isGig ? 'var(--amber)' : 'var(--accent-light)';
                  const iconClass = isGig ? 'ti-briefcase' : 'ti-arrows-exchange';
                  const title = isGig ? 'Gig chat' : 'Exchange chat';

                  return (
                    <div
                      key={room._id}
                      onClick={() => handleRoomClick(room)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                        background: isActive ? 'var(--surface2)' : 'var(--surface)',
                        border: '0.5px solid', borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                        borderRadius: 10, cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: bgColor, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`ti ${iconClass}`} style={{ fontSize: 16 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{title}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{timeAgo(room.lastMessageAt, now)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {room.title || 'Tap to view'}
                          </span>
                          {room.unreadCount > 0 && (
                            <span style={{ background: 'var(--accent)', color: 'white', fontSize: 9, padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sessions Mini-card */}
              {roomSessions.length > 0 && (
                <div style={{ marginTop: 24, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>
                    Sessions
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {roomSessions.map(s => {
                      const color = s.status === 'Completed' ? '#22C55E' : s.status === 'Pending' ? '#EAB308' : s.status === 'Scheduled' || s.status === 'Rescheduled' ? '#7C6FE0' : 'var(--border-strong)';
                      return <div key={s._id} style={{ width: 12, height: 12, borderRadius: '50%', background: color }} title={s.status} />;
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {roomSessions.filter(s => s.status === 'Completed').length} done · {roomSessions.filter(s => s.status === 'Pending').length} pending · {roomSessions.filter(s => s.status === 'Scheduled' || s.status === 'Rescheduled').length} upcoming
                  </div>
                  <button onClick={() => openScheduleModal()} style={{ width: '100%', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Schedule session
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
            Select someone to view threads
          </div>
        )}
      </section>

      {/* ── COL 3: CHAT AREA ── */}
      <section style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '16px 24px', borderBottom: '0.5px solid var(--border)', background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: activeRoom.referenceType === 'gig' ? 'var(--amber-bg)' : 'var(--accent-dim)', color: activeRoom.referenceType === 'gig' ? 'var(--amber)' : 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${activeRoom.referenceType === 'gig' ? 'ti-briefcase' : 'ti-arrows-exchange'}`} style={{ fontSize: 18 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {activeRoom.referenceType === 'gig' ? 'Gig chat' : 'Exchange chat'} — {activeOtherUserEmail.split('@')[0]}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{activeRoom.title || 'General Discussion'}</span>
                    <span style={{ background: 'var(--surface2)', border: '0.5px solid var(--border)', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>
                      {activeRoom.referenceType === 'gig' ? 'Gig' : 'Skill trade'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}>
                  <i className="ti ti-search" />
                </button>
                <button style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}>
                  <i className="ti ti-dots" />
                </button>
                <button onClick={() => openScheduleModal()} style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent-light)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Schedule session
                </button>
              </div>
            </div>

            {/* Chat Tabs - Replacing WorkspaceTabs visual manually since requested to restyle */}
            <div style={{ display: 'flex', padding: '0 24px', background: 'var(--panel)', borderBottom: '0.5px solid var(--border)' }}>
              {['Chat', 'Resources', 'Notes', 'Tasks'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  style={{
                    padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: activeTab === tab.toLowerCase() ? 'var(--accent-light)' : 'var(--text-muted)',
                    borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--accent)' : '2px solid transparent'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'chat' && roomSessions.length > 0 && (
              <div 
                style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setSessionTrayOpen(!sessionTrayOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    <i className="ti ti-calendar" style={{ fontSize: 16 }} /> Sessions
                  </div>
                  <div style={{ display: 'flex', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                    {roomSessions.filter(s => s.status === 'Completed').length > 0 && <span>{roomSessions.filter(s => s.status === 'Completed').length} done &middot; </span>}
                    {roomSessions.filter(s => s.status === 'Pending').length > 0 && <span>{roomSessions.filter(s => s.status === 'Pending').length} pending &middot; </span>}
                    {roomSessions.filter(s => s.status === 'Scheduled' || s.status === 'Rescheduled').length > 0 && <span>{roomSessions.filter(s => s.status === 'Scheduled' || s.status === 'Rescheduled').length} upcoming &middot; </span>}
                    <i className={`ti ${sessionTrayOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ marginLeft: 4 }} />
                  </div>
                </div>
                {roomSessions.filter(s => s.status === 'Pending' && s.requestedBy !== userEmail).length > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); setSessionTrayOpen(!sessionTrayOpen); }} style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#EAB308', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {roomSessions.filter(s => s.status === 'Pending' && s.requestedBy !== userEmail).length} pending action
                  </button>
                )}
              </div>
            )}
            {/* Session tray toggle content */}
            {activeTab === 'chat' && sessionTrayOpen && roomSessions.length > 0 && (
              <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)', padding: '16px 24px', maxHeight: 320, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {roomSessions.map((session) => (
                    <div key={session._id}>
                      <div 
                        onClick={() => {
                          setEditingSession(editingSession && editingSession._id === session._id ? null : session);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                            {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {session.time} · {session.duration} · {session.mode}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          textTransform: 'uppercase',
                          background: session.status === 'Completed' ? 'var(--accent-dim)' : session.status === 'Pending' ? 'rgba(234,179,8,0.15)' : session.status === 'Scheduled' || session.status === 'Rescheduled' ? 'var(--green-bg)' : 'var(--surface2)',
                          color: session.status === 'Completed' ? 'var(--accent-light)' : session.status === 'Pending' ? '#EAB308' : session.status === 'Scheduled' || session.status === 'Rescheduled' ? 'var(--green-text)' : 'var(--text-muted)'
                        }}>
                          {session.status}
                        </span>
                      </div>
                      
                      {editingSession && editingSession._id === session._id && (
                        <div style={{ marginTop: 8 }}>
                          <SessionCard
                            session={session}
                            userEmail={userEmail}
                            onReschedule={(s) => openScheduleModal(s)}
                            onAccept={(id) => handleSessionAction(id, 'accept')}
                            onSuggestAlternative={(s) => openScheduleModal(s)}
                            onDecline={(id) => handleSessionAction(id, 'decline')}
                            onCancel={(id) => handleSessionAction(id, 'cancel')}
                            onComplete={(id) => handleSessionAction(id, 'complete')}
                            onReview={(s) => {
                              setReviewingSession({ ...s, reviewedUserEmail: activeOtherUserEmail });
                              setIsReviewModalOpen(true);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Area */}
            {activeTab === 'chat' && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }} onScroll={handleScroll} ref={scrollContainerRef}>
                  {messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>💬</div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Start Conversation</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Send a message to begin.</p>
                    </div>
                  ) : (
                    Object.keys(groupedMessages).map(dateLabel => (
                      <React.Fragment key={dateLabel}>
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                          <span style={{ background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)' }}>
                            {dateLabel}
                          </span>
                        </div>
                        {groupedMessages[dateLabel].map((msg, idx) => {
                          const isSystem = msg.type === 'system';
                          const isMe = msg.senderEmail === userEmail;
                          const showAvatar = !isMe && (idx === 0 || groupedMessages[dateLabel][idx - 1].senderEmail !== msg.senderEmail);

                          if (isSystem) {
                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                                <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <i className="ti ti-info-circle" style={{ color: 'var(--text-dim)', fontSize: 14 }} />
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{msg.text}</span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={idx} style={{ display: 'flex', width: '100%', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 8 }}>
                              {!isMe && (
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: getAvatarColors(activeOtherUserEmail).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: getAvatarColors(activeOtherUserEmail).text, opacity: showAvatar ? 1 : 0, alignSelf: 'flex-end' }}>
                                  {(activeOtherUserEmail?.[0] || '?').toUpperCase()}
                                </div>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                <div style={{
                                  background: isMe ? 'var(--accent-dim)' : 'var(--surface)',
                                  border: '0.5px solid', borderColor: isMe ? 'var(--accent)' : 'var(--border)',
                                  borderRadius: 12, borderBottomRightRadius: isMe ? 2 : 12, borderBottomLeftRadius: !isMe ? 2 : 12,
                                  padding: '10px 14px', color: isMe ? 'var(--accent-light)' : 'var(--text)', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word'
                                }}>
                                  {msg.text}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {formatMessageTime(msg.createdAt)}
                                  {isMe && <span>{msg.readStatus ? '✓✓' : '✓'}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}

                  {typingUsers[activeOtherUserEmail] && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: getAvatarColors(activeOtherUserEmail).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: getAvatarColors(activeOtherUserEmail).text, alignSelf: 'flex-end' }}>
                        {activeOtherUserEmail[0].toUpperCase()}
                      </div>
                      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, borderBottomLeftRadius: 2, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-dim)', animation: 'bounce 1s infinite' }} />
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-dim)', animation: 'bounce 1s infinite 0.2s' }} />
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-dim)', animation: 'bounce 1s infinite 0.4s' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} style={{ height: 1 }} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '16px 24px', background: 'var(--panel)', borderTop: '0.5px solid var(--border)' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{
                      flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10,
                      display: 'flex', alignItems: 'flex-end', padding: '8px 12px', transition: 'border-color 0.2s'
                    }} onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, marginRight: 4 }}><i className="ti ti-paperclip" style={{ fontSize: 18 }} /></button>
                      <textarea
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        style={{
                          flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13,
                          resize: 'none', outline: 'none', maxHeight: 100, minHeight: 20, fontFamily: 'inherit', padding: '2px 0'
                        }}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, marginLeft: 4 }}><i className="ti ti-mood-smile" style={{ fontSize: 18 }} /></button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      style={{
                        width: 38, height: 38, borderRadius: '50%', background: 'var(--accent)', color: 'white',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        opacity: newMessage.trim() ? 1 : 0.5, flexShrink: 0
                      }}
                    >
                      <i className="ti ti-send" style={{ fontSize: 16 }} />
                    </button>
                  </form>
                </div>
              </>
            )}

            {activeTab === 'resources' && workspace && <div style={{ flex: 1, overflow: 'hidden' }}><ResourcesPanel workspaceId={workspace._id} currentUserEmail={userEmail} /></div>}
            {activeTab === 'notes' && workspace && <div style={{ flex: 1, overflow: 'hidden' }}><NotesPanel workspaceId={workspace._id} initialNotes={workspace.notes} /></div>}
            {activeTab === 'tasks' && workspace && <div style={{ flex: 1, overflow: 'hidden' }}><TaskPanel workspaceId={workspace._id} currentUserEmail={userEmail} /></div>}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 16 }}>🗨️</div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>No thread selected</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select a conversation to start chatting</p>
          </div>
        )}
      </section>

      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => { setIsSessionModalOpen(false); setEditingSession(null); }}
        onSubmit={handleSessionSubmit}
        isSubmitting={isSubmittingSession}
        initialData={editingSession}
        currentUserEmail={userEmail}
        recipientEmail={activeOtherUserEmail}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setReviewingSession(null); }}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
        sessionId={reviewingSession?._id}
        reviewedUserEmail={reviewingSession?.reviewedUserEmail}
      />
    </main>
  );
};

export default Chat;
