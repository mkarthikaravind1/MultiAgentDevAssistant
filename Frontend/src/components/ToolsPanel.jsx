import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Wrench, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ToolCallBlock from './ToolCallBlock';
import CodeBlock from './CodeBlock';
import { streamToolChat } from '../utils/api';

const SUGGESTIONS = [
    'Show git status of the codebase',
    'List all Python files in the project',
    'Read the main entry point file',
    'Run the tests and show results',
];

const mdComponents = {
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        if (!inline && match) return <CodeBlock language={match[1]}>{children}</CodeBlock>;
        return <code style={{ background: '#EEF0FF', color: '#5B6AF0', padding: '2px 6px', borderRadius: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5 }} {...props}>{children}</code>;
    },
    p({ children }) { return <p style={{ lineHeight: 1.65, margin: '6px 0' }}>{children}</p>; },
    ul({ children }) { return <ul style={{ paddingLeft: 18, margin: '6px 0', lineHeight: 1.7 }}>{children}</ul>; },
    strong({ children }) { return <strong style={{ fontWeight: 600 }}>{children}</strong>; },
};

// A single "turn" in the tools chat = { userMsg, events: [{type, ...}] }
// event types: tool_call, tool_result, text_chunk, done, error

function AssistantTurn({ events, streaming }) {
    // Merge text chunks into one text block between tool calls
    const blocks = [];
    let textAcc = '';

    for (const ev of events) {
        if (ev.type === 'text_chunk') {
            textAcc += ev.content;
        } else if (ev.type === 'tool_call') {
            if (textAcc.trim()) { blocks.push({ kind: 'text', content: textAcc }); textAcc = ''; }
            blocks.push({ kind: 'tool_call', id: ev.tool_call_id, name: ev.name, args: ev.args, result: null, pending: true });
        } else if (ev.type === 'tool_result') {
            if (textAcc.trim()) { blocks.push({ kind: 'text', content: textAcc }); textAcc = ''; }
            // Attach result to matching tool_call block
            const tc = blocks.find(b => b.kind === 'tool_call' && b.id === ev.tool_call_id);
            if (tc) { tc.result = ev.result; tc.pending = false; }
            else blocks.push({ kind: 'tool_result_orphan', result: ev.result });
        } else if (ev.type === 'error') {
            if (textAcc.trim()) { blocks.push({ kind: 'text', content: textAcc }); textAcc = ''; }
            blocks.push({ kind: 'error', content: ev.content });
        }
    }
    if (textAcc.trim()) blocks.push({ kind: 'text', content: textAcc });

    return (
        <div style={{ display: 'flex', gap: 12, padding: '12px 0', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A2E', color: '#fff' }}>
                <Wrench size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {blocks.length === 0 && streaming && (
                    <span style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>Thinking…</span>
                )}
                {blocks.map((b, i) => {
                    if (b.kind === 'text') return (
                        <div key={i} style={{ background: '#fff', border: '1px solid #E8EAFF', borderRadius: '0 18px 18px 18px', padding: '10px 14px', fontSize: 14, color: '#1A1A2E', marginBottom: 4 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{b.content}</ReactMarkdown>
                            {streaming && i === blocks.length - 1 && (
                                <span style={{ display: 'inline-block', width: 7, height: 14, background: '#5B6AF0', borderRadius: 2, marginLeft: 3, verticalAlign: 'middle', animation: 'blink 0.9s step-end infinite' }} />
                            )}
                        </div>
                    );
                    if (b.kind === 'tool_call') return (
                        <ToolCallBlock key={i} name={b.name} args={b.args} result={b.result} pending={b.pending} />
                    );
                    if (b.kind === 'error') return (
                        <div key={i} style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#991B1B', fontFamily: '"JetBrains Mono", monospace' }}>
                            Error: {b.content}
                        </div>
                    );
                    return null;
                })}
            </div>
        </div>
    );
}

export default function ToolsPanel({ sessionId }) {
    const [turns, setTurns] = useState([]); // [{userMsg, events, streaming}]
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const bottomRef = useRef();
    const textareaRef = useRef();

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns]);

    const sendMessage = async (text) => {
        const msg = (text || input).trim();
        if (!msg || busy) return;
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        const turnIdx = turns.length;
        setTurns(prev => [...prev, { userMsg: msg, events: [], streaming: true }]);
        setBusy(true);

        await streamToolChat(sessionId, msg, (event) => {
            setTurns(prev => prev.map((t, i) => {
                if (i !== turnIdx) return t;
                if (event.type === 'done') return { ...t, streaming: false };
                return { ...t, events: [...t.events, event] };
            }));
        });

        // Ensure streaming flag is cleared even if 'done' wasn't received
        setTurns(prev => prev.map((t, i) => i === turnIdx ? { ...t, streaming: false } : t));
        setBusy(false);
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Info banner */}
            <div style={{ padding: '8px 24px', background: '#F5F6FF', borderBottom: '1px solid #E8EAFF', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Info size={13} color="#5B6AF0" />
                <span style={{ fontSize: 12, color: '#5B6AF0', fontFamily: '"JetBrains Mono", monospace' }}>
                    Tools: read_file · write_file · search_folder · run_command · git_status — runs in your uploaded codebase dir
                </span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
                {turns.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 28, paddingBottom: 40 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <Wrench size={26} color="#5B6AF0" />
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A2E', marginBottom: 6 }}>Tool Calling Agent</div>
                            <div style={{ fontSize: 13.5, color: '#6B7280', maxWidth: 340 }}>
                                The LLM can read files, write code, run shell commands, and check git — all inside your uploaded codebase.
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 480 }}>
                            {SUGGESTIONS.map(s => (
                                <button key={s} onClick={() => sendMessage(s)} style={{
                                    padding: '10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0',
                                    background: '#fff', cursor: 'pointer', textAlign: 'left',
                                    fontSize: 12.5, color: '#374151', lineHeight: 1.4, transition: 'all 0.15s', fontFamily: 'inherit',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#5B6AF0'; e.currentTarget.style.background = '#F5F6FF'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#fff'; }}
                                >{s}</button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {turns.map((turn, i) => (
                            <div key={i}>
                                {/* User message */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0 4px' }}>
                                    <div style={{ maxWidth: '70%', background: '#5B6AF0', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', fontSize: 14, lineHeight: 1.6 }}>
                                        {turn.userMsg}
                                    </div>
                                </div>
                                {/* Assistant turn with tool calls */}
                                <AssistantTurn events={turn.events} streaming={turn.streaming} />
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div style={{ padding: '12px 24px 20px', borderTop: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
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
                        placeholder="Ask the agent to read, write, run commands… (Enter to send)"
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 13.5, color: '#1A1A2E', lineHeight: 1.6, maxHeight: 140, overflowY: 'auto' }}
                    />
                    <button onClick={() => sendMessage()} disabled={!input.trim() || busy} style={{
                        width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: (!input.trim() || busy) ? '#E2E8F0' : '#1A1A2E',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s',
                    }}>
                        {busy
                            ? <Loader size={16} color="#94A3B8" style={{ animation: 'spin 1s linear infinite' }} />
                            : <Send size={16} color={!input.trim() ? '#94A3B8' : '#5B6AF0'} />}
                    </button>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 }}>
                    Groq · LLaMA 3.1 8B · Tool Calling Loop
                </div>
            </div>
        </div>
    );
}