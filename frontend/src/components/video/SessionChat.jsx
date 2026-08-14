import React, { useState, useRef, useEffect, memo } from 'react';

const MessageBubble = memo(({ msg, isOwn }) => {
  const initial = msg.senderEmail ? msg.senderEmail.charAt(0).toUpperCase() : '?';
  const name = msg.senderEmail ? msg.senderEmail.split('@')[0] : 'Unknown';

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex gap-2 group animate-in fade-in slide-in-from-bottom-2 duration-200 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar — only for others */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 shadow">
          {initial}
        </div>
      )}

      <div className={`flex flex-col max-w-[78%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name */}
        {!isOwn && (
          <span className="text-gray-400 text-[11px] font-medium mb-1 ml-1">{name}</span>
        )}

        {/* Bubble */}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isOwn
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm'
              : 'bg-gray-700/80 text-gray-100 rounded-tl-sm'
          }`}
        >
          {msg.text}
        </div>

        {/* Timestamp */}
        <span className="text-[var(--text-secondary)] text-[10px] mt-1 mx-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(msg.timestamp)}{isOwn && ' ✓'}
        </span>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const SessionChat = memo(({ messages, onSendMessage, currentUserEmail }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-700/60 flex-shrink-0 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <span className="text-base">💬</span>
          Session Chat
        </h3>
        {messages.length > 0 && (
          <span className="text-[11px] text-[var(--text-secondary)]">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl mb-3">
              💬
            </div>
            <p className="text-gray-400 text-sm font-medium">No messages yet</p>
            <p className="text-gray-600 text-xs mt-1">Messages are visible only during this session</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={`${msg.timestamp}-${i}`}
              msg={msg}
              isOwn={msg.senderEmail === currentUserEmail}
              currentUserEmail={currentUserEmail}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-700/60 flex-shrink-0 bg-gray-900/80">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 bg-gray-800 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 placeholder-gray-500 transition resize-none leading-relaxed max-h-24 overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-900/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
});

SessionChat.displayName = 'SessionChat';

export default SessionChat;
