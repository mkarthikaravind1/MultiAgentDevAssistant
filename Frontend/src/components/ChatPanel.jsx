import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Zap } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { streamChat } from '../utils/api';

const SUGGESTIONS = [
  'Explain this algorithm with Python code',
  'Write a binary search implementation',
  'What is the time complexity of quicksort?',
  'Implement a LRU cache in Python',
];

export default function ChatPanel({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setStreaming(true);

    const placeholderIdx = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    await streamChat(
      sessionId, msg,
      (_, full) => setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: full } : m)),
      (full) => {
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { role: 'assistant', content: full, streaming: false } : m));
        setStreaming(false);
      },
      (err) => {
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { role: 'assistant', content: `Error: ${err}`, streaming: false } : m));
        setStreaming(false);
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden'}}>
      {/* Messages */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 32, paddingBottom: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#5B6AF0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Zap size={26} color="#fff" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A2E', marginBottom: 6 }}>Multi-Agent Dev Assistant</div>
              <div style={{ fontSize: 13.5, color: '#6B7280', maxWidth: 320 }}>Your AI pair programmer. Ask anything about code — algorithms, debugging, architecture.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 480 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: '10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0',
                  background: '#fff', cursor: 'pointer', textAlign: 'left',
                  fontSize: 12.5, color: '#374151', lineHeight: 1.4,
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#5B6AF0'; e.currentTarget.style.background = '#F5F6FF'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#fff'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} isStreaming={m.streaming} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px 20px', borderTop: '1px solid var(--border)', background: '#fff' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 10,
          background: '#F8FAFF', borderRadius: 12, border: '1.5px solid #E2E8F0',
          padding: '8px 8px 8px 14px', transition: 'border 0.15s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#5B6AF0'}
          onBlurCapture={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a coding question… (Enter to send, Shift+Enter for newline)"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'inherit', fontSize: 13.5, color: '#1A1A2E', lineHeight: 1.6,
              maxHeight: 140, overflowY: 'auto',
            }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || streaming} style={{
            width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: (!input.trim() || streaming) ? '#E2E8F0' : '#5B6AF0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}>
            {streaming
              ? <Loader size={16} color="#94A3B8" style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={16} color={!input.trim() ? '#94A3B8' : '#fff'} />
            }
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 }}>
          Powered by Groq · LLaMA 3.1 8B
        </div>
      </div>
    </div>
  );
}
