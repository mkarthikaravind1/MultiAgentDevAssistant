// import { MessageCircle, FolderSearch } from 'lucide-react';

// export default function ModeSwitcher({ mode, onChange }) {
//   return (
//     <div style={{
//       display: 'inline-flex', background: '#F0F2F8', borderRadius: 10,
//       padding: 3, border: '1px solid #E2E8F0', position: 'relative',
//     }}>
//       {[
//         { id: 'chat', label: 'Chat', Icon: MessageCircle },
//         { id: 'codebase', label: 'Codebase RAG', Icon: FolderSearch },
//       ].map(({ id, label, Icon }) => (
//         <button key={id} onClick={() => onChange(id)} style={{
//           padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
//           display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500,
//           transition: 'all 0.18s',
//           background: mode === id ? '#FFFFFF' : 'transparent',
//           color: mode === id ? '#5B6AF0' : '#6B7280',
//           boxShadow: mode === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
//         }}>
//           <Icon size={14} />
//           {label}
//         </button>
//       ))}
//     </div>
//   );
// }
import { MessageCircle, FolderSearch, Wrench, GitBranch, Bot } from 'lucide-react';

export default function ModeSwitcher({ mode, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', background: '#F0F2F8', borderRadius: 10,
      padding: 3, border: '1px solid #E2E8F0', position: 'relative',
    }}>
      {[
        { id: 'chat', label: 'Chat', Icon: MessageCircle },
        { id: 'codebase', label: 'Codebase RAG', Icon: FolderSearch },
        { id: 'tools', label: 'Tools', Icon: Wrench },
        { id: 'planner', label: 'Planner', Icon: GitBranch },
        { id: 'multi-agent', label: 'Multi-Agent', Icon: Bot },
      ].map(({ id, label, Icon }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500,
          transition: 'all 0.18s',
          background: mode === id ? '#FFFFFF' : 'transparent',
          color: mode === id ? '#5B6AF0' : '#6B7280',
          boxShadow: mode === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        }}>
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}