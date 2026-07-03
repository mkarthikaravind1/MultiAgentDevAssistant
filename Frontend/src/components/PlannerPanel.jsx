import { useState, useRef } from 'react';
import { GitBranch, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { streamPlanner } from '../utils/api';

const TYPE_COLORS = {
    planning: { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' },
    coding: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
    testing: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
    review: { bg: '#FDF4FF', text: '#9333EA', border: '#E9D5FF' },
    documentation: { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' },
};

export default function PlannerPanel() {
    const [task, setTask] = useState('');
    const [status, setStatus] = useState('');   // status text from SSE
    const [plan, setPlan] = useState(null); // parsed plan object
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef(false);

    const handlePlan = async () => {
        if (!task.trim() || loading) return;
        setLoading(true);
        setError('');
        setPlan(null);
        setStatus('');
        abortRef.current = false;

        await streamPlanner(task.trim(), (event) => {
            if (abortRef.current) return;
            if (event.type === 'status') {
                setStatus(event.data);
            } else if (event.type === 'plan') {
                try {
                    setPlan(JSON.parse(event.data));
                    setStatus('');
                } catch {
                    setError('Received malformed plan from server.');
                }
            } else if (event.type === 'error') {
                setError(event.data);
                setStatus('');
            }
        });

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePlan();
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            padding: '28px 32px', gap: 24, overflowY: 'auto',
            fontFamily: 'Inter, sans-serif',
        }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GitBranch size={20} color="#5B6AF0" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1E293B' }}>
                    Planner Agent
                </h2>
                <span style={{
                    fontSize: 11, background: '#EEF2FF', color: '#5B6AF0',
                    border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontWeight: 500,
                }}>Phase 5</span>
            </div>

            {/* Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>
                    Describe your task
                </label>
                <textarea
                    value={task}
                    onChange={e => setTask(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Build a REST API for a todo app with authentication and tests"
                    rows={3}
                    style={{
                        resize: 'vertical', padding: '12px 14px', borderRadius: 10,
                        border: '1px solid #E2E8F0', fontSize: 14, color: '#1E293B',
                        fontFamily: 'inherit', outline: 'none', lineHeight: 1.6,
                        background: '#FAFBFF',
                    }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Ctrl+Enter to run</span>
                    <button
                        onClick={handlePlan}
                        disabled={loading || !task.trim()}
                        style={{
                            padding: '9px 22px', borderRadius: 8, border: 'none', cursor: loading || !task.trim() ? 'not-allowed' : 'pointer',
                            background: loading || !task.trim() ? '#E2E8F0' : '#5B6AF0',
                            color: loading || !task.trim() ? '#94A3B8' : '#fff',
                            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'background 0.18s',
                        }}
                    >
                        {loading
                            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Planning…</>
                            : <><ChevronRight size={13} /> Generate Plan</>
                        }
                    </button>
                </div>
            </div>

            {/* Status */}
            {loading && status && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
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
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', background: '#FFF1F2',
                    border: '1px solid #FECDD3', borderRadius: 8,
                    fontSize: 13, color: '#E11D48',
                }}>
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            {/* Plan result */}
            {plan && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{
                        fontSize: 13, color: '#475569', padding: '10px 14px',
                        background: '#F8FAFF', borderRadius: 8, border: '1px solid #E2E8F0',
                    }}>
                        <strong style={{ color: '#1E293B' }}>Task: </strong>{plan.task}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {plan.subtasks.map((s, i) => {
                            const colors = TYPE_COLORS[s.type] || TYPE_COLORS['planning'];
                            return (
                                <div key={s.id} style={{
                                    padding: '14px 16px', borderRadius: 10,
                                    border: '1px solid #E2E8F0', background: '#FAFBFF',
                                    display: 'flex', gap: 14,
                                }}>
                                    {/* Step number */}
                                    <div style={{
                                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                        background: '#5B6AF0', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, marginTop: 1,
                                    }}>
                                        {i + 1}
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                                                {s.title}
                                            </span>
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                                background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                                                textTransform: 'uppercase', letterSpacing: '0.04em',
                                            }}>
                                                {s.type}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                                            {s.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}