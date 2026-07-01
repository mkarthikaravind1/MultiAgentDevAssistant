import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { Bot, User } from 'lucide-react';

const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match) {
      return <CodeBlock language={match[1]}>{children}</CodeBlock>;
    }
    return (
      <code style={{
        background: '#EEF0FF', color: '#5B6AF0', padding: '2px 6px',
        borderRadius: '4px', fontFamily: '"JetBrains Mono", monospace', fontSize: '12.5px',
      }} {...props}>{children}</code>
    );
  },
  h2({ children }) {
    return <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', margin: '16px 0 6px', paddingBottom: '4px', borderBottom: '1px solid #E2E8F0' }}>{children}</h2>;
  },
  h3({ children }) {
    return <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E', margin: '12px 0 4px' }}>{children}</h3>;
  },
  p({ children }) {
    return <p style={{ lineHeight: 1.65, margin: '6px 0', color: 'inherit' }}>{children}</p>;
  },
  ul({ children }) {
    return <ul style={{ paddingLeft: '18px', margin: '6px 0', lineHeight: 1.7 }}>{children}</ul>;
  },
  ol({ children }) {
    return <ol style={{ paddingLeft: '18px', margin: '6px 0', lineHeight: 1.7 }}>{children}</ol>;
  },
  strong({ children }) {
    return <strong style={{ fontWeight: 600, color: '#1A1A2E' }}>{children}</strong>;
  },
};

export default function ChatMessage({ role, content, isStreaming }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex', gap: '12px', padding: '16px 0',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser ? '#5B6AF0' : '#1A1A2E',
        color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '72%',
        background: isUser ? '#5B6AF0' : '#FFFFFF',
        color: isUser ? '#fff' : '#1A1A2E',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '12px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        fontSize: '14px', lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid #E8EAFF',
        wordBreak: 'break-word',
      }}>
        {isUser ? (
          <p style={{ margin: 0, lineHeight: 1.6 }}>{content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {content}
          </ReactMarkdown>
        )}
        {isStreaming && (
          <span style={{ display: 'inline-block', width: 8, height: 15, background: '#5B6AF0', borderRadius: 2, marginLeft: 4, verticalAlign: 'middle', animation: 'blink 0.9s step-end infinite' }} />
        )}
      </div>
    </div>
  );
}
