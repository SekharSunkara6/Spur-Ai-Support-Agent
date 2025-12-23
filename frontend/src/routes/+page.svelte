<script lang="ts">
  import { onMount } from 'svelte';

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

  let message = '';
  let messages: { sender: 'user' | 'ai'; text: string; timestamp: string }[] = [];
  let isLoading = false;
  let error: string | null = null;
  let sessionId: string | null = null;
  let theme: 'light' | 'dark' = 'light';

  onMount(async () => {
    const storedTheme = localStorage.getItem('spur_theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      theme = storedTheme as 'light' | 'dark';
    }

    const stored = localStorage.getItem('spur_session_id');
    if (!stored) return;

    sessionId = stored;
    try {
      const res = await fetch(`${API_BASE}/api/chat/history/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        messages = data.messages;
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('spur_theme', theme);
  }

  async function sendMessage() {
    if (!message.trim() || isLoading) return;

    const text = message.trim();
    message = '';
    error = null;

    messages = [
      ...messages,
      { sender: 'user', text, timestamp: new Date().toISOString() }
    ];
    isLoading = true;

    try {
      const payload: any = { message: text };
      if (sessionId) {
        payload.sessionId = sessionId;
      }

      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Something went wrong');
      }

      sessionId = data.sessionId;
      if (sessionId) {
        localStorage.setItem('spur_session_id', sessionId);
      }

      messages = [
        ...messages,
        { sender: 'ai', text: data.reply, timestamp: new Date().toISOString() }
      ];
    } catch (e: any) {
      error = e.message ?? 'Failed to send message';
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<svelte:head>
  <title>Spur AI Support Agent</title>
</svelte:head>

<div class={`page theme-${theme}`}>
  <div class="shell">
    <header class="app-header">
      <div class="app-brand">
        <img src="/spur-logo.png" alt="Spur logo" class="brand-logo" />
        <div class="brand-text">
          <span class="brand-tagline">AI support agent demo</span>
        </div>
      </div>
      <div class="header-right">
        <span class="app-badge">Founding Engineer Take‑home</span>
        <button class="theme-toggle" on:click={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>

    <div class="chat-card">
      <header class="chat-header">
        <div class="status-dot"></div>
        <div>
          <h2>Spur Support</h2>
          <p>Instant answers about orders, shipping, and returns.</p>
        </div>
      </header>

      <main class="messages">
        {#if messages.length === 0}
          <div class="empty">
            <div class="emoji">🤖</div>
            <p>Hi! I’m your AI support agent.</p>
            <p class="hint">Try asking “What is your return policy?”</p>
          </div>
        {/if}

        {#each messages as msg (msg.timestamp + msg.text)}
          <div class="row {msg.sender === 'user' ? 'row-user' : 'row-ai'}">
            <div class="bubble {msg.sender}">
              <p>{msg.text}</p>
              <span class="time">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        {/each}

        {#if isLoading}
          <div class="row row-ai">
            <div class="bubble ai typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        {/if}

        {#if error}
          <div class="error">{error}</div>
        {/if}
      </main>

      <footer class="input-bar">
        <textarea
          bind:value={message}
          placeholder="Type your message..."
          rows="1"
          on:keydown={handleKeydown}
          disabled={isLoading}
        />
        <button on:click={sendMessage} disabled={isLoading || !message.trim()}>
          {#if isLoading}
            …
          {:else}
            Send
          {/if}
        </button>
      </footer>
    </div>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  /* light theme */
  .theme-light {
    background: linear-gradient(135deg, #eef2ff, #e0f2fe);
    --card-bg: #ffffff;
    --text-main: #111827;
    --text-muted: #6b7280;
    --bubble-user: #2563eb;
    --bubble-ai: #ffffff;
    --bubble-ai-border: #e5e7eb;
    --input-bg: #ffffff;
  }

  /* dark theme */
  .theme-dark {
    background: radial-gradient(circle at top, #1e293b, #020617);
    --card-bg: #020617;
    --text-main: #e5e7eb;
    --text-muted: #9ca3af;
    --bubble-user: #2563eb;
    --bubble-ai: #020617;
    --bubble-ai-border: #1f2937;
    --input-bg: #020617;
  }

  .shell {
    width: 100%;
    max-width: 840px;
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    color: var(--text-main);
  }

  .app-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .brand-logo {
    width: 100px;
    height: 40px;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-tagline {
    font-size: 0.99rem;
    color: var(--text-muted);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .app-badge {
    font-size: 0.99rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: #e0f2fe;
    color: #0369a1;
    font-weight: 500;
  }

  .theme-toggle {
    border: none;
    background: transparent;
    font-size: 1.1rem;
    cursor: pointer;
  }

  .chat-card {
    width: 100%;
    height: 600px;
    background: var(--card-bg);
    border-radius: 1.5rem;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: white;
  }

  .chat-header h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .chat-header p {
    margin: 0;
    font-size: 1rem;
    opacity: 0.9;
  }

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #4ade80;
    box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.4);
  }

  .messages {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: #f9fafb;
  }

  .theme-dark .messages {
    background: #020617;
  }

  .row {
    display: flex;
  }

  .row-user {
    justify-content: flex-end;
  }

  .row-ai {
    justify-content: flex-start;
  }

  .bubble {
    max-width: 80%;
    padding: 0.6rem 0.8rem;
    border-radius: 1rem;
    font-size: 0.9rem;
    line-height: 1.4;
    position: relative;
  }

  .bubble p {
    margin: 0;
  }

  .bubble.user {
    background: var(--bubble-user);
    color: #ffffff;
    border-bottom-right-radius: 0.2rem;
  }

  .bubble.ai {
    background: var(--bubble-ai);
    color: var(--text-main);
    border-bottom-left-radius: 0.2rem;
    border: 1px solid var(--bubble-ai-border);
  }

  .time {
    display: block;
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: 0.25rem;
    color: var(--text-muted);
  }

  .empty {
    margin: auto;
    text-align: center;
    color: var(--text-muted);
  }

  .emoji {
    font-size: 2.5rem;
    margin-bottom: 0.3rem;
  }

  .hint {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .typing span {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 3px;
    border-radius: 999px;
    background: #9ca3af;
    animation: bounce 1s infinite alternate;
  }

  .typing span:nth-child(2) {
    animation-delay: 0.15s;
  }

  .typing span:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes bounce {
    from {
      transform: translateY(1px);
      opacity: 0.6;
    }
    to {
      transform: translateY(-2px);
      opacity: 1;
    }
  }

  .input-bar {
    border-top: 1px solid #e5e7eb;
    padding: 0.75rem;
    display: flex;
    gap: 0.5rem;
    background: var(--input-bg);
  }

  textarea {
    flex: 1;
    resize: none;
    border-radius: 0.75rem;
    border: 1px solid #d1d5db;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    max-height: 80px;
    background: var(--input-bg);
    color: var(--text-main);
  }

  textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 1px #2563eb33;
  }

  button {
    min-width: 72px;
    border-radius: 0.75rem;
    border: none;
    background: #2563eb;
    color: white;
    font-weight: 500;
    cursor: pointer;
    padding: 0 1rem;
    font-size: 0.9rem;
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .error {
    margin-top: 0.4rem;
    text-align: center;
    font-size: 0.8rem;
    color: #b91c1c;
  }

    :global(:root) {
    color-scheme: light dark;
  }

  .bubble {
    position: relative;
    display: inline-flex;
    align-items: flex-end;
    gap: 6px;
  }

  .time {
    font-size: 11px;
    font-weight: 500;
    /* dark text on light theme, light text on dark theme */
    color: light-dark(#4b5563, #e5e7eb);
    opacity: 0.9;
    white-space: nowrap;
  }
</style>


