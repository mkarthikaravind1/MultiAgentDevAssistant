import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Check } from 'lucide-react';

const theme = {
  'code[class*="language-"]': { color: '#CDD6F4', background: 'none', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', lineHeight: '1.6' },
  'pre[class*="language-"]': { color: '#CDD6F4', background: '#1E1E3F', padding: '1rem', borderRadius: '0 0 8px 8px', overflow: 'auto', margin: 0 },
  'comment': { color: '#6272A4' }, 'prolog': { color: '#6272A4' },
  'keyword': { color: '#BD93F9' }, 'operator': { color: '#FF79C6' },
  'string': { color: '#F1FA8C' }, 'number': { color: '#BD93F9' },
  'function': { color: '#50FA7B' }, 'class-name': { color: '#8BE9FD' },
  'boolean': { color: '#BD93F9' }, 'builtin': { color: '#8BE9FD' },
  'punctuation': { color: '#F8F8F2' }, 'variable': { color: '#F8F8F2' },
};

export default function CodeBlock({ language = 'text', children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #2A2A4A', margin: '12px 0' }}>
      <div style={{
        background: '#252545', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '6px 14px',
      }}>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#7C7FA8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {language}
        </span>
        <button onClick={copy} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '5px',
          color: copied ? '#50FA7B' : '#7C7FA8', fontSize: '12px',
          fontFamily: '"JetBrains Mono", monospace', padding: '2px 6px',
          borderRadius: '4px', transition: 'color 0.2s',
        }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter language={language} style={theme} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
