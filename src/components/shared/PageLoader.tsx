'use client';

import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fading,  setFading]  = useState(false);

  useEffect(() => {
    const fade   = setTimeout(() => setFading(true),  200);
    const remove = setTimeout(() => setVisible(false), 700);
    return () => { clearTimeout(fade); clearTimeout(remove); };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         99999,
        background:     '#050d1a',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '28px',
        fontFamily:     "'Inter', system-ui, sans-serif",
        opacity:        fading ? 0 : 1,
        transition:     'opacity 0.45s ease',
        pointerEvents:  fading ? 'none' : 'all',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{
          width:52, height:52,
          background:     'linear-gradient(135deg,#f59e0b,#d97706)',
          borderRadius:   14,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontWeight:     900,
          fontSize:       26,
          color:          '#050d1a',
          flexShrink:     0,
          animation:      'nxpulse 1.6s ease-in-out infinite',
        }}>N</div>
        <span style={{ fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>
          NexaBank
        </span>
      </div>

      <div style={{ width:200, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
        <div style={{
          height:'100%',
          background:     'linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)',
          backgroundSize: '200% 100%',
          borderRadius:   2,
          animation:      'nxscan 1.6s ease-in-out infinite',
        }} />
      </div>

      <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)', margin:0 }}>
        Loading your banking experience...
      </p>

      <style>{`
        @keyframes nxpulse {
          0%,100%{box-shadow:0 0 24px rgba(245,158,11,.4)}
          50%{box-shadow:0 0 52px rgba(245,158,11,.8)}
        }
        @keyframes nxscan {
          0%{width:0%;margin-left:0}
          50%{width:65%;margin-left:10%}
          100%{width:0%;margin-left:100%}
        }
      `}</style>
    </div>
  );
}