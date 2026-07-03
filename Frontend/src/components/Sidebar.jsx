import { Plus, Trash2, MessageSquare, ChevronRight, Cpu } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ sessions, activeId, onNew, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(null);

  return (
    <aside style={{
      width: 240, background: 'var(--sidebar)', display: 'flex', flexDirection: 'column',
      height: '100%', flexShrink: 0,
    }}>
      {/* Logo */}
      // AFTER:
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #2563eb, #6366f1)',
          boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
            <circle cx="12" cy="12" r="2" fill="white" stroke="none" />
          </svg>
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.2 }}>
            Dev<span style={{ color: '#818cf8' }}>Assistant</span>
          </div>
          <div style={{ color: '#34d399', fontSize: 9.5, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em', marginTop: 2, fontWeight: 600 }}>
            • MULTI-AGENT
          </div>
        </div>
      </div>

      {/* New session button */}
      <div style={{ padding: '12px 12px 8px' }}>
        <button onClick={onNew} style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          background: 'rgba(91,106,240,0.15)', border: '1px solid rgba(91,106,240,0.3)',
          color: '#8B96F8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,106,240,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(91,106,240,0.15)'; }}
        >
          <Plus size={15} /> New Session
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        <div style={{ color: '#94a3b8', fontSize: 10, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em', padding: '8px 8px 4px', textTransform: 'uppercase' }}>Sessions</div>
        {sessions.length === 0 && (
          <div style={{ color: '#4A4A6A', fontSize: 12, padding: '12px 8px', textAlign: 'center' }}>No sessions yet</div>
        )}
        {sessions.map(s => (
          <div key={s.id}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(s.id)}
            style={{
              display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 8,
              cursor: 'pointer', marginBottom: 2, gap: 8,
              background: activeId === s.id ? 'var(--sidebar-active)' : hovered === s.id ? 'var(--sidebar-hover)' : 'transparent',
              transition: 'background 0.12s',
            }}>
            <MessageSquare size={13} color={activeId === s.id ? '#8B96F8' : '#4A4A6A'} style={{ flexShrink: 0 }} />
            <span style={{
              flex: 1, fontSize: 12.5, color: activeId === s.id ? '#E2E4FF' : '#A8ABBE',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              {s.label}
            </span>
            {hovered === s.id && (
              <button onClick={e => { e.stopPropagation(); onDelete(s.id); }} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                color: '#EF4444', display: 'flex', borderRadius: 4,
              }}>
                <Trash2 size={12} />
              </button>
            )}
            {activeId === s.id && hovered !== s.id && <ChevronRight size={12} color="#5B6AF0" />}
          </div>
        ))}
      </div>

      {/* Footer */}
      {/* Footer */}
      <div style={{
        borderTop: '1px solid #1E2238',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
          {[
            { label: 'FastAPI', color: '#10B981' },
            { label: 'Groq', color: '#F59E0B' },
            { label: 'Chroma', color: '#6366F1' },
          ].map(({ label, color }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center',
              background: '#1A1D2E', border: '1px solid #2A2F45',
              borderRadius: 4, padding: '3px 7px',
              fontSize: 10, color: '#94A3B8',
              fontFamily: '"JetBrains Mono", monospace',
              userSelect: 'none',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, marginRight: 5, flexShrink: 0, display: 'inline-block' }} />
              {label}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: '#3A3A5A', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.02em' }}>
          © 2026 DevAssistant
        </div>
      </div>
    </aside>
  );
}
