import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const API_BASE = import.meta.env.VITE_API_BASE;

function CodeBlock({ language, value }) {
    function handleCopy() {
        navigator.clipboard.writeText(value);
    }
    function handleDownload() {
        const ext = { python: "py", javascript: "js", jsx: "jsx", java: "java", cpp: "cpp", c: "c" }[language] || "txt";
        const blob = new Blob([value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snippet.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }
    return (
        <div style={{ position: "relative", margin: "8px 0" }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 4 }}>
                <button onClick={handleCopy} style={codeBtnStyle}>Copy</button>
                <button onClick={handleDownload} style={codeBtnStyle}>Download</button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={oneDark}
                wrapLongLines={true}
                customStyle={{
                    borderRadius: 8,
                    fontSize: 13,
                    maxWidth: "100%",
                    overflowX: "hidden",
                }}
                codeTagProps={{ style: { whiteSpace: "pre-wrap", wordBreak: "break-word" } }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
}

const codeBtnStyle = {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
};

export default function Chat() {
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);

    // Create a session on mount
    useEffect(() => {
        async function initSession() {
            try {
                const res = await fetch(`${API_BASE}/session`, { method: "POST" });
                if (!res.ok) throw new Error("Failed to create session");
                const data = await res.json();
                setSessionId(data.session_id);
            } catch (err) {
                setError("Couldn't start a session. Is the backend running?");
            }
        }
        initSession();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        const trimmed = input.trim();
        if (!trimmed || isStreaming) return;

        if (!sessionId) {
            setError("No active session. Refresh the page to start a new one.");
            return;
        }

        setError(null);
        const userMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
        const assistantMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInput("");
        setIsStreaming(true);

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, message: trimmed }),
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => null);
                throw new Error(errBody?.detail || `Request failed (${res.status})`);
            }
            if (!res.body) throw new Error("No response stream from server");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });

                setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = { ...updated[lastIdx], content: accumulated };
                    return updated;
                });
            }

            accumulated += decoder.decode(); // flush remaining buffered bytes
            setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = { ...updated[lastIdx], content: accumulated };
                return updated;
            });

            // Surface backend-side stream errors (sent as plain text, e.g. "[error: ...]")
            if (accumulated.startsWith("\n[error:") || accumulated.startsWith("[error:")) {
                setError("The assistant hit an error mid-response. Try again.");
            }
        } catch (err) {
            setError(err.message || "Something went wrong sending your message.");
            // Remove the empty assistant placeholder bubble on failure
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsStreaming(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.headerTitle}>Chat</span>
                <span style={styles.sessionBadge}>
                    {sessionId ? `Session: ${sessionId.slice(0, 8)}` : "Connecting…"}
                </span>
            </div>

            <div style={styles.messageList}>
                {messages.length === 0 && (
                    <div style={styles.emptyState}>Send a message to get started.</div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={msg.id}
                        style={{
                            ...styles.bubble,
                            ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
                        }}
                    >
                        {msg.role === "assistant" ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ inline, className, children }) {
                                        const match = /language-(\w+)/.exec(className || "");
                                        const value = String(children).replace(/\n$/, "");
                                        return !inline && match ? (
                                            <CodeBlock language={match[1]} value={value} />
                                        ) : (
                                            <code style={{ background: "#e8e8e8", padding: "1px 4px", borderRadius: 4 }}>{value}</code>
                                        );
                                    },
                                }}
                            >
                                {msg.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
                            </ReactMarkdown>
                        ) : (
                            msg.content
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {error && <div style={styles.errorBanner}>{error}</div>}

            <div style={styles.inputRow}>
                <textarea
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    disabled={!sessionId}
                    style={styles.textarea}
                />
                <button
                    onClick={sendMessage}
                    disabled={!sessionId || isStreaming || !input.trim()}
                    style={{
                        ...styles.sendButton,
                        opacity: !sessionId || isStreaming || !input.trim() ? 0.5 : 1,
                    }}
                >
                    {isStreaming ? "Sending…" : "Send"}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        background: "#fafafa",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid #e2e2e2",
        background: "#fff",
    },
    headerTitle: { fontWeight: 600, fontSize: 16 },
    sessionBadge: { fontSize: 12, color: "#888" },
    messageList: {
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    emptyState: { color: "#999", fontSize: 14, textAlign: "center", marginTop: 40 },
    bubble: {
        maxWidth: "90%",
        padding: "10px 14px",
        borderRadius: 14,
        fontSize: 14,
        lineHeight: 1.45,
        whiteSpace: "pre-wrap",
    },
    userBubble: {
        alignSelf: "flex-end",
        background: "#2563eb",
        color: "#fff",
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        alignSelf: "flex-start",
        background: "#eee",
        color: "#222",
        borderBottomLeftRadius: 4,
    },
    errorBanner: {
        margin: "0 16px 8px",
        padding: "8px 12px",
        background: "#fdecea",
        color: "#b3261e",
        borderRadius: 8,
        fontSize: 13,
    },
    inputRow: {
        display: "flex",
        gap: 8,
        padding: "12px 16px",
        borderTop: "1px solid #e2e2e2",
        background: "#fff",
    },
    textarea: {
        flex: 1,
        resize: "none",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ccc",
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        maxHeight: 150,
        overflowY: "auto",
        lineHeight: 1.4,
    },
    sendButton: {
        padding: "0 18px",
        borderRadius: 10,
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
    },
};