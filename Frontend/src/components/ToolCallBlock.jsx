import { useState } from 'react';
import { Terminal, FileText, FolderOpen, GitBranch, PenLine, ChevronDown, ChevronUp, CheckCircle, Loader } from 'lucide-react';

const TOOL_META = {
    read_file: { label: 'Read File', Icon: FileText, color: '#6366F1' },
    write_file: { label: 'Write File', Icon: PenLine, color: '#10B981' },
    search_folder: { label: 'Search Folder', Icon: FolderOpen, color: '#F59E0B' },
    run_command: { label: 'Run Command', Icon: Terminal, color: '#EF4444' },
    git_status: { label: 'Git Status', Icon: GitBranch, color: '#8B5CF6' },
};

export default function ToolCallBlock({ name, args, result, pending }) {
    const [open, setOpen] = useState(true);
    const meta = TOOL_META[name] || { label: name, Icon: Terminal, color: '#6B7280' };
    const { Icon, label, color } = meta;

    return (
        <div style={{
            border: `1px solid ${color}30`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 8, overflow: 'hidden',
            background: '#FAFBFF', margin: '6px 0',
            fontFamily: '"JetBrains Mono", monospace',
        }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: `${color}08` }}
            >
                <Icon size={13} color={color} />
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
                <span style={{ fontSize: 11, color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {Object.entries(args || {}).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('  ')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {pending
                        ? <Loader size={12} color="#94A3B8" style={{ animation: 'spin 1s linear infinite' }} />
                        : <CheckCircle size={12} color="#10B981" />}
                    {open ? <ChevronUp size={12} color="#94A3B8" /> : <ChevronDown size={12} color="#94A3B8" />}
                </span>
            </div>

            {open && (
                <div style={{ borderTop: `1px solid ${color}20` }}>
                    <div style={{ padding: '6px 12px', background: `${color}05`, borderBottom: `1px solid ${color}15` }}>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Input</div>
                        <pre style={{ fontSize: 11, color: '#374151', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {JSON.stringify(args, null, 2)}
                        </pre>
                    </div>
                    <div style={{ padding: '6px 12px' }}>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Output</div>
                        {pending ? (
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>Running…</span>
                        ) : (
                            <pre style={{ fontSize: 11, color: '#1E293B', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 240, overflowY: 'auto' }}>
                                {result ?? '(no output)'}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}