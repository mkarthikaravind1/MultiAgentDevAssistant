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
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={17} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, letterSpacing: '0.01em', fontFamily: '"JetBrains Mono", monospace' }}>DevAssistant</div>
            <div style={{ color: '#5B6AF0', fontSize: 10, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em' }}>MULTI-AGENT</div>
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
        <div style={{ color: '#4A4A6A', fontSize: 10, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em', padding: '8px 8px 4px', textTransform: 'uppercase' }}>Sessions</div>
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
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#3A3A5A', fontFamily: '"JetBrains Mono", monospace' }}>
        FastAPI · Groq · ChromaDB
      </div>
    </aside>
  );
}
