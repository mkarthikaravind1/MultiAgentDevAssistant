import { useState, useRef } from 'react';
import { Upload, Search, FileCode, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadCodebase, askCodebase } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match) return <CodeBlock language={match[1]}>{children}</CodeBlock>;
    return <code style={{ background: '#EEF0FF', color: '#5B6AF0', padding: '2px 6px', borderRadius: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5 }} {...props}>{children}</code>;
  },
  p({ children }) { return <p style={{ lineHeight: 1.65, margin: '6px 0' }}>{children}</p>; },
};

export default function CodebasePanel({ sessionId }) {
  const [uploadState, setUploadState] = useState('idle'); // idle | loading | done | error
  const [stats, setStats] = useState(null);
  const [fileName, setFileName] = useState('');
  const [question, setQuestion] = useState('');
  const [results, setResults] = useState([]);
  const [querying, setQuerying] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expandedSource, setExpandedSource] = useState(null);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file?.name.endsWith('.zip')) { alert('Please upload a .zip file'); return; }
    setFileName(file.name);
    setUploadState('loading');
    try {
      const data = await uploadCodebase(sessionId, file);
      setStats(data);
      setUploadState('done');
    } catch {
      setUploadState('error');
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || querying) return;
    setQuerying(true);
    try {
      const data = await askCodebase(sessionId, question);
      setResults(prev => [{ q: question, a: data.answer, sources: data.sources }, ...prev]);
      setQuestion('');
    } catch {
      setResults(prev => [{ q: question, a: 'Error querying codebase.', sources: '' }, ...prev]);
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div style={{ display: 'flex',flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', gap: 0,}}>
      {/* Upload zone */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileCode size={16} color="#5B6AF0" />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Index Codebase</span>
          {uploadState === 'done' && stats && (
            <span style={{ marginLeft: 'auto', background: '#D1FAE5', color: '#065F46', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontFamily: '"JetBrains Mono", monospace' }}>
              {stats.files_indexed} files · {stats.chunks_indexed} chunks
            </span>
          )}
        </div>

        {uploadState !== 'done' ? (
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{
              border: `2px dashed ${dragOver ? '#5B6AF0' : '#CBD5E1'}`,
              borderRadius: 10, padding: '24px', cursor: 'pointer', textAlign: 'center',
              background: dragOver ? '#EEF0FF' : '#F8FAFF',
              transition: 'all 0.15s',
            }}>
            <input ref={fileRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {uploadState === 'loading' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#5B6AF0' }}>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Indexing {fileName}…
              </div>
            ) : uploadState === 'error' ? (
              <div style={{ color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertCircle size={15} /> Upload failed — try again
              </div>
            ) : (
              <>
                <Upload size={22} color="#94A3B8" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: '#64748B' }}>Drop your codebase <strong>.zip</strong> here</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>or click to browse</div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#D1FAE5', borderRadius: 8, border: '1px solid #6EE7B7' }}>
            <CheckCircle size={15} color="#059669" />
            <span style={{ fontSize: 13, color: '#065F46' }}><strong>{fileName}</strong> indexed successfully</span>
            <button onClick={() => { setUploadState('idle'); setStats(null); setFileName(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 12 }}>Replace</button>
          </div>
        )}
      </div>

      {/* Question input */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
            placeholder={uploadState === 'done' ? 'Ask about your codebase…' : 'Index a codebase first'}
            disabled={uploadState !== 'done' || querying}
            style={{
              flex: 1, padding: '9px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0',
              fontSize: 13, outline: 'none', fontFamily: 'inherit',
              background: uploadState !== 'done' ? '#F8FAFF' : '#fff',
              color: '#1A1A2E', transition: 'border 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#5B6AF0'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
          <button onClick={handleAsk} disabled={!question.trim() || uploadState !== 'done' || querying} style={{
            padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#5B6AF0', color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500, opacity: (!question.trim() || uploadState !== 'done' || querying) ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}>
            {querying ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
            Ask
          </button>
        </div>
      </div>

      {/* Results */}
      {/* <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}> */}
      <div style={{ flex:1, minHeight: 0, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16, display:'block' }}>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
            <FolderSearchEmpty />
            <div style={{ marginTop: 12, fontSize: 13 }}>Index a codebase and ask questions about it</div>
          </div>
        )}
        {results.map((r, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '10px 16px', background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', fontSize: 13, color: '#5B6AF0', fontWeight: 500, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Search size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {r.q}
            </div>
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#1A1A2E' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{r.a}</ReactMarkdown>
            </div>
            {r.sources && (
              <div style={{ borderTop: '1px solid #F1F5F9' }}>
                <button onClick={() => setExpandedSource(expandedSource === i ? null : i)} style={{
                  width: '100%', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {expandedSource === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  View source context
                </button>
                {expandedSource === i && (
                  // <pre style={{ padding: '0 16px 12px', fontSize: 11, color: '#64748B', fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  //   {r.sources}
                  // </pre>
                  <pre
                    style={{
                      padding: '10px 16px',
                      fontSize: 11,
                      color: '#64748B',
                      fontFamily: '"JetBrains Mono", monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                      borderTop: '1px solid #F1F5F9',
                      maxHeight: 250,
                      overflow: 'auto',
                    }}
                  >
                    {r.sources}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FolderSearchEmpty() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
      <rect x="6" y="14" width="36" height="26" rx="3" stroke="#CBD5E1" strokeWidth="2" fill="#F1F5F9" />
      <path d="M6 20h36" stroke="#CBD5E1" strokeWidth="1.5" />
      <path d="M6 14l6-4h10l6 4" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="30" r="5" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M28 34l3 3" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
