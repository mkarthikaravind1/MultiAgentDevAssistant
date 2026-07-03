import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ModeSwitcher from './components/ModeSwitcher';
import ChatPanel from './components/ChatPanel';
import CodebasePanel from './components/CodebasePanel';
import ToolsPanel from './components/ToolsPanel';
import { createSession, deleteSession } from './utils/api';
import './index.css';
import PlannerPanel from './components/PlannerPanel';

let sessionCounter = 1;

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [mode, setMode] = useState('chat'); // 'chat' | 'codebase' | 'tools'

  const newSession = useCallback(async () => {
    try {
      const id = await createSession();
      const label = `Session ${sessionCounter++}`;
      setSessions(prev => [...prev, { id, label }]);
      setActiveId(id);
    } catch (e) {
      console.error('Failed to create session', e);
    }
  }, []);

  useEffect(() => { newSession(); }, []);

  const handleDelete = async (id) => {
    await deleteSession(id).catch(() => { });
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length > 0) setActiveId(remaining[remaining.length - 1].id);
      else newSession();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNew={newSession}
        onSelect={setActiveId}
        onDelete={handleDelete}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' , minHeight:0 ,}}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', borderBottom: '1px solid var(--border)',
          background: '#fff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ModeSwitcher mode={mode} onChange={setMode} />
          </div>
          <div style={{
            fontSize: 11, color: '#94A3B8', fontFamily: '"JetBrains Mono", monospace',
            background: '#F8FAFF', padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0',
          }}>
            {activeId ? `sid: ${activeId.slice(0, 8)}…` : '—'}
          </div>
        </div>

        {/* Panel */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeId && mode === 'chat' && <ChatPanel key={activeId + '-chat'} sessionId={activeId} />}
          {activeId && mode === 'codebase' && <CodebasePanel key={activeId + '-rag'} sessionId={activeId} />}
          {activeId && mode === 'tools' && <ToolsPanel key={activeId + '-tools'} sessionId={activeId} />}
          {mode === 'planner' && <PlannerPanel key="planner" />}
          {!activeId && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
              Creating session…
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}