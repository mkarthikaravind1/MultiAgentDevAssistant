import { useState } from 'react';
import { Bot, Loader2, AlertCircle, ChevronRight, CheckCircle2, FileCode2, Brain, Building2, Eye, Search, ClipboardList } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamMultiAgent } from '../utils/api';

const TYPE_COLORS = {
    planning: { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' },
    coding: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
    testing: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
    review: { bg: '#FDF4FF', text: '#9333EA', border: '#E9D5FF' },
    documentation: { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' },
};

const AGENT_META = {
    research: { label: 'Research', Icon: Search, color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
    planner: { label: 'Planner', Icon: Brain, color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
    architect: { label: 'Architect', Icon: Building2, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
    coder: { label: 'Coder', Icon: FileCode2, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    reviewer: { label: 'Reviewer', Icon: Eye, color: '#9333EA', bg: '#FDF4FF', border: '#E9D5FF' },
    summary: { label: 'Summary', Icon: ClipboardList, color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
};

const AGENT_ORDER = ['research', 'planner', 'architect', 'coder', 'reviewer', 'summary'];

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function ResearchResult({ data }) {
    return (
        <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 8,
            background: data.has_context ? '#F0F9FF' : '#F8FAFF',
            border: `1px solid ${data.has_context ? '#BAE6FD' : '#E2E8F0'}`,
            fontSize: 13, color: data.has_context ? '#0369A1' : '#64748B',
            display: 'flex', alignItems: 'center', gap: 8,
        }}>
            {data.has_context
                ? <CheckCircle2 size={14} color="#0369A1" />
                : <AlertCircle size={14} color="#94A3B8" />}
            {data.message}
        </div>
    );
}

function PlannerResult({ subtasks }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {subtasks.map((s, i) => {
                const colors = TYPE_COLORS[s.type] || TYPE_COLORS['planning'];
                return (
                    <div key={s.id} style={{
                        display: 'flex', gap: 12, padding: '10px 14px',
                        background: '#FAFBFF', borderRadius: 8, border: '1px solid #E2E8F0',
                    }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            background: '#5B6AF0', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                        }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{s.title}</span>
                                <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                                    background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                }}>{s.type}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{s.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ArchitectResult({ architecture }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {architecture.folder_structure && (
                <pre style={{
                    margin: 0, padding: '10px 14px', background: '#0F172A', color: '#94A3B8',
                    borderRadius: 8, fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
                    overflowX: 'auto', lineHeight: 1.7,
                }}>{architecture.folder_structure}</pre>
            )}
            {architecture.tech_decisions?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tech Decisions</span>
                    {architecture.tech_decisions.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#334155' }}>
                            <CheckCircle2 size={13} color="#0284C7" style={{ flexShrink: 0, marginTop: 1 }} />
                            {d}
                        </div>
                    ))}
                </div>
            )}
            {architecture.notes && (
                <div style={{ fontSize: 12, color: '#475569', padding: '8px 12px', background: '#F8FAFF', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <strong>Notes: </strong>{architecture.notes}
                </div>
            )}
        </div>
    );
}

function CoderResult({ written_files, iteration }) {
    const successCount = written_files.filter(f => !f.result.startsWith('Error')).length;
    const errorCount = written_files.length - successCount;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {iteration > 1 && (
                <div style={{
                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                    background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA',
                    display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
                }}>
                    🔁 Fix attempt {iteration}
                </div>
            )}
            <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                <span style={{ color: '#16A34A', fontWeight: 600 }}>✅ {successCount} written</span>
                {errorCount > 0 && <span style={{ color: '#E11D48', fontWeight: 600 }}>❌ {errorCount} skipped</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {written_files.map((f, i) => {
                    const ok = !f.result.startsWith('Error');
                    return (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '6px 12px', borderRadius: 7,
                            background: ok ? '#F0FDF4' : '#FFF1F2',
                            border: `1px solid ${ok ? '#BBF7D0' : '#FECDD3'}`,
                            minWidth: 0,
                        }}>
                            <CheckCircle2 size={12} color={ok ? '#16A34A' : '#E11D48'} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: '#1E293B', flex: 1 }}>{f.path}</span>
                            {/* <span style={{ fontSize: 11, color: ok ? '#16A34A' : '#E11D48', flexShrink: 0 }}>{f.result}</span> */}
                            <span style={{
                                fontSize: 11,
                                color: ok ? '#16A34A' : '#E11D48',
                                flex: ok ? '0 0 auto' : '1 1 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                            }}>
                                {f.result}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ReviewerResult({ review, verdict }) {
    const pass = verdict === 'pass';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, alignSelf: 'flex-start',
                background: pass ? '#F0FDF4' : '#FFF7ED',
                border: `1px solid ${pass ? '#BBF7D0' : '#FED7AA'}`,
                fontSize: 12, fontWeight: 600,
                color: pass ? '#16A34A' : '#EA580C',
            }}>
                {pass ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                Verdict: {pass ? 'Pass' : 'Needs Fix'}
            </div>
            <div style={{
                padding: '12px 14px', background: '#FAFBFF',
                borderRadius: 8, border: '1px solid #E2E8F0',
                fontSize: 13, color: '#334155', lineHeight: 1.7,
                whiteSpace: 'pre-wrap', fontFamily: 'inherit',
            }}>
                {review}
            </div>
        </div>
    );
}

function SummaryResult({ summary }) {
    return (
        <div style={{
            marginTop: 10, padding: '14px 16px',
            background: '#FFFBEB', borderRadius: 8,
            border: '1px solid #FDE68A',
            fontSize: 13, color: '#334155', lineHeight: 1.7,
        }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
        </div>
    );
}

// ── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({ agentKey, data, isActive }) {
    const meta = AGENT_META[agentKey];
    if (!meta) return null;
    const { label, Icon, color, bg, border } = meta;
    const isDone = data !== null;

    return (
        <div style={{
            borderRadius: 12,
            border: `1px solid ${isActive || isDone ? border : '#E2E8F0'}`,
            background: isActive || isDone ? bg : '#FAFBFF',
            padding: '14px 16px', transition: 'all 0.2s',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isActive || isDone ? color : '#E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                }}>
                    <Icon size={16} color={isActive || isDone ? '#fff' : '#94A3B8'} />
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isActive || isDone ? color : '#94A3B8' }}>
                    {label} Agent
                </div>
                {isActive && !isDone && <Loader2 size={14} color={color} style={{ animation: 'spin 1s linear infinite' }} />}
                {isDone && <CheckCircle2 size={16} color="#16A34A" />}
            </div>

            {agentKey === 'research' && data && <ResearchResult data={data} />}
            {agentKey === 'planner' && data && <PlannerResult subtasks={data.subtasks} />}
            {agentKey === 'architect' && data && <ArchitectResult architecture={data.architecture} />}
            {agentKey === 'coder' && data && <CoderResult written_files={data.written_files} iteration={data.iteration} />}
            {agentKey === 'reviewer' && data && <ReviewerResult review={data.review} verdict={data.verdict} />}
            {agentKey === 'summary' && data && <SummaryResult summary={data.summary} />}
        </div>
    );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function MultiAgentPanel({ sessionId }) {
    const [task, setTask] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [activeAgent, setActiveAgent] = useState(null);

    // Each agent can appear multiple times (coder re-runs), so store as array of {agentKey, data}
    const [cards, setCards] = useState([]);

    const handleRun = async () => {
        if (!task.trim() || loading) return;
        setLoading(true);
        setError('');
        setStatus('');
        setCards([]);
        setActiveAgent(null);

        await streamMultiAgent(sessionId, task.trim(), (event) => {
            if (event.type === 'status') {
                setStatus(event.data);
            } else if (event.type === 'agent_result') {
                try {
                    const parsed = JSON.parse(event.data);
                    const agent = parsed.agent;
                    setActiveAgent(agent);
                    // Append card — coder may appear twice
                    setCards(prev => [...prev, { agentKey: agent, data: parsed }]);
                } catch {
                    setError('Malformed agent result received.');
                }
            } else if (event.type === 'done') {
                setActiveAgent(null);
                setStatus('');
            } else if (event.type === 'error') {
                setError(event.data);
                setStatus('');
            }
        });

        setLoading(false);
        setActiveAgent(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun();
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            overflowY: 'auto', padding: '28px 32px', gap: 24,
            fontFamily: 'Inter, sans-serif',
        }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <Bot size={20} color="#5B6AF0" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1E293B' }}>
                    Multi-Agent System
                </h2>
                <span style={{
                    fontSize: 11, background: '#EEF2FF', color: '#5B6AF0',
                    border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontWeight: 500,
                }}>Phase 7</span>
            </div>

            {/* Pipeline indicator */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                padding: '10px 14px', background: '#F8FAFF',
                border: '1px solid #E2E8F0', borderRadius: 10, flexWrap: 'wrap',
            }}>
                {AGENT_ORDER.map((key, i) => {
                    const meta = AGENT_META[key];
                    const done = cards.some(c => c.agentKey === key);
                    const active = activeAgent === key;
                    return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 10px', borderRadius: 20,
                                background: done ? meta.bg : active ? meta.bg : 'transparent',
                                border: `1px solid ${done || active ? meta.border : '#E2E8F0'}`,
                                fontSize: 12, fontWeight: 500,
                                color: done || active ? meta.color : '#94A3B8',
                                transition: 'all 0.2s',
                            }}>
                                <meta.Icon size={11} />
                                {meta.label}
                                {done && !active && <CheckCircle2 size={11} color="#16A34A" />}
                                {active && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
                            </div>
                            {i < AGENT_ORDER.length - 1 && <ChevronRight size={12} color="#CBD5E1" />}
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>
                    Describe what you want to build
                </label>
                <textarea
                    value={task}
                    onChange={e => setTask(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Build a FastAPI todo app with SQLite and pytest tests"
                    rows={3}
                    style={{
                        resize: 'vertical', padding: '12px 14px', borderRadius: 10,
                        border: '1px solid #E2E8F0', fontSize: 14, color: '#1E293B',
                        fontFamily: 'inherit', outline: 'none', lineHeight: 1.6,
                        background: '#FAFBFF',
                    }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                        Ctrl+Enter to run · Files written to sandbox · SUMMARY.md auto-generated
                    </span>
                    <button
                        onClick={handleRun}
                        disabled={loading || !task.trim()}
                        style={{
                            padding: '9px 22px', borderRadius: 8, border: 'none',
                            cursor: loading || !task.trim() ? 'not-allowed' : 'pointer',
                            background: loading || !task.trim() ? '#E2E8F0' : '#5B6AF0',
                            color: loading || !task.trim() ? '#94A3B8' : '#fff',
                            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'background 0.18s',
                        }}
                    >
                        {loading
                            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Running Agents…</>
                            : <><Bot size={13} /> Run Multi-Agent</>
                        }
                    </button>
                </div>
            </div>

            {/* Status */}
            {loading && status && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                    padding: '10px 14px', background: '#F8FAFF',
                    border: '1px solid #E2E8F0', borderRadius: 8,
                    fontSize: 13, color: '#5B6AF0',
                }}>
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    {status}
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                    padding: '10px 14px', background: '#FFF1F2',
                    border: '1px solid #FECDD3', borderRadius: 8,
                    fontSize: 13, color: '#E11D48',
                }}>
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            {/* Agent cards — append in order, coder can appear twice */}
            {cards.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {cards.map((card, i) => (
                        <AgentCard
                            key={i}
                            agentKey={card.agentKey}
                            data={card.data}
                            isActive={false}
                        />
                    ))}
                    {/* Show active spinner card for currently running agent not yet complete */}
                    {activeAgent && !cards.some((c, i) => i === cards.length - 1 && c.agentKey === activeAgent) && (
                        <AgentCard key="active" agentKey={activeAgent} data={null} isActive={true} />
                    )}
                </div>
            )}
        </div>
    );
}