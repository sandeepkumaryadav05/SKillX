import React, { useEffect, useRef, memo } from 'react';

const VideoPlayer = memo(({ localStream, remoteStream, connectionStatus, remoteUserEmail, isMuted, isCameraOff }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const remoteInitial = remoteUserEmail ? remoteUserEmail.charAt(0).toUpperCase() : '?';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      
      {/* ── Main area: remote participant ── */}
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        /* Waiting / empty state */
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            border: '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--accent-light)',
            marginBottom: 24,
            boxShadow: '0 0 40px rgba(124, 111, 224, 0.2)'
          }}>
            {remoteInitial}
          </div>
          
          <h3 className="text-h3" style={{ marginBottom: 32 }}>
            {connectionStatus === 'waiting' ? `Waiting for ${remoteUserEmail ? remoteUserEmail.split('@')[0] : 'participant'} to join...` : 'Connecting...'}
          </h3>
          
          {connectionStatus === 'waiting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-check" style={{ fontSize: 14 }} />
                </div>
                <span style={{ fontSize: 14 }}>Session created</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-check" style={{ fontSize: 14 }} />
                </div>
                <span style={{ fontSize: 14 }}>Invitation sent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 14 }}>Waiting for participant</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Floating PiP: self-cam ── */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 120,
        height: 80,
        background: 'var(--surface2)',
        borderRadius: 10,
        overflow: 'hidden',
        border: '0.5px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        zIndex: 10
      }}>
        {localStream && !isCameraOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <i className="ti ti-video-off" style={{ fontSize: 20 }} />
          </div>
        )}

        {/* You label */}
        <div style={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          borderRadius: 4,
          padding: '2px 6px',
        }}>
          <span style={{ color: 'white', fontSize: 10, fontWeight: 500 }}>You</span>
        </div>

        {/* Muted indicator */}
        {isMuted && (
          <div style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: 'var(--red)',
            borderRadius: '50%',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="ti ti-microphone-off" style={{ fontSize: 10, color: 'white' }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
