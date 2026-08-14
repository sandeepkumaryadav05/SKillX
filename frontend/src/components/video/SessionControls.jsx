import React, { useState, memo } from 'react';

const SessionControls = memo(({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isHandRaised,
  timerDisplay,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onToggleHand,
  onLeave,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const ControlButton = ({ onClick, active, icon, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        onClick={onClick}
        title={label}
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: active ? '1px solid var(--accent)' : '0.5px solid var(--border)',
          background: active ? 'var(--accent-dim)' : 'var(--surface)',
          color: active ? 'var(--accent-light)' : 'var(--text)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
      </button>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );

  return (
    <>
      {/* ── Leave Confirmation Modal ── */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card" style={{ maxWidth: 320, width: '100%', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚪</div>
            <h3 className="text-h2" style={{ marginBottom: 4 }}>Leave Session?</h3>
            <p className="text-caption" style={{ marginBottom: 24 }}>
              Are you sure you want to leave? The session will continue for the other participant.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); onLeave(); }}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', background: 'var(--red)', borderColor: 'var(--red)', color: 'white' }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Control Bar ── */}
      <div style={{
        height: 72,
        background: 'var(--panel)',
        borderTop: '0.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        zIndex: 40,
      }}>
        {/* Left group: AV controls */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <ControlButton
            onClick={onToggleMic}
            active={isMuted}
            icon={isMuted ? 'ti-microphone-off' : 'ti-microphone'}
            label={isMuted ? 'Unmute' : 'Mute'}
          />
          <ControlButton
            onClick={onToggleCamera}
            active={isCameraOff}
            icon={isCameraOff ? 'ti-video-off' : 'ti-video'}
            label={isCameraOff ? 'Show Cam' : 'Camera'}
          />
          <ControlButton
            onClick={onToggleScreen}
            active={isScreenSharing}
            icon="ti-screen-share"
            label={isScreenSharing ? 'Stop' : 'Share'}
          />
          <ControlButton
            onClick={onToggleHand}
            active={isHandRaised}
            icon="ti-hand-stop"
            label={isHandRaised ? 'Lower' : 'Raise'}
          />
        </div>

        {/* Center: timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 9999,
          padding: '6px 16px',
        }}>
          <i className="ti ti-hourglass-empty" style={{ fontSize: 16, color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Duration</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
            {timerDisplay}
          </span>
        </div>

        {/* Right group: more + leave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer'
          }}>
            <i className="ti ti-dots-vertical" style={{ fontSize: 20 }} />
          </button>
          
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--red)',
              color: 'white',
              border: 'none',
              borderRadius: 22,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
            onMouseOut={(e) => e.currentTarget.style.opacity = 1}
          >
            <i className="ti ti-phone-off" style={{ fontSize: 18 }} />
            Leave session
          </button>
        </div>
      </div>
    </>
  );
});

SessionControls.displayName = 'SessionControls';

export default SessionControls;
