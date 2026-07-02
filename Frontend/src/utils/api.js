const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function createSession() {
  const r = await fetch(`${BASE}/session`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to create session');
  return (await r.json()).session_id;
}

export async function deleteSession(sessionId) {
  await fetch(`${BASE}/session/${sessionId}`, { method: 'DELETE' });
}

export async function streamChat(sessionId, message, onChunk, onDone, onError) {
  const r = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!r.ok) { onError('Request failed'); return; }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(chunk, full);
  }
  onDone(full);
}

export async function uploadCodebase(sessionId, file) {
  const fd = new FormData();
  fd.append('session_id', sessionId);
  fd.append('file', file);
  const r = await fetch(`${BASE}/codebase/upload`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Upload failed');
  return r.json();
}

export async function askCodebase(sessionId, question) {
  const fd = new FormData();
  fd.append('session_id', sessionId);
  fd.append('question', question);
  const r = await fetch(`${BASE}/codebase/ask`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Query failed');
  return r.json();
}

// Phase 4 — Tool Calling
// Streams SSE events from /tools/chat
// Each event is a JSON line: { type: 'tool_call'|'tool_result'|'text_chunk'|'done'|'error', ... }
export async function streamToolChat(sessionId, message, onEvent) {
  const r = await fetch(`${BASE}/tools/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!r.ok) { onEvent({ type: 'error', content: 'Request failed' }); return; }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop(); // keep incomplete line in buffer
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try { onEvent(JSON.parse(trimmed)); } catch { /* skip malformed */ }
    }
  }
}