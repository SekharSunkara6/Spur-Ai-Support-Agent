# ✨ Spur AI Support Agent

Mini AI support agent for a live chat widget, built as part of **Spur – Founding Full‑Stack Engineer Take‑Home**.  
It simulates a small e‑commerce support agent that answers customer questions using a real LLM and persists conversations in **PostgreSQL (Neon)**.

***

## 🌍 Live URLs

- 💬 **Chat UI (frontend)**: `https://spur-ai-support-agent.vercel.app`  
- 🛠️ **Backend status page / API**: `https://spur-ai-support-agent.onrender.com`

Each deployment is independent but wired via environment variables and CORS.

---

## 🚀 1. Quick Start (Local Setup)

### 1.1. Clone the repository

```bash
git clone https://github.com/SekharSunkara6/Spur-Ai-Support-Agent.git
cd Spur-Ai-Support-Agent
```

Repository layout:

- `backend/` – Node.js + TypeScript API server  
- `frontend/` – Svelte (Vite) chat UI  

### 1.2. Prerequisites

- 🟢 Node.js 20+  
- 🟢 npm (or pnpm/yarn)  
- 🟢 PostgreSQL database (Neon in production; any Postgres works locally)

***

## 🔐 2. Environment Variables

Secrets are **not** committed. Create `.env` files from the provided examples.

### 2.1. Backend `.env`

Create `backend/.env`:

```env
# Backend server
PORT=3001

# PostgreSQL (Neon or local Postgres)
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB_NAME

# LLM provider (OpenAI)
OPENAI_API_KEY=sk-...

# Where the frontend is hosted
# Local dev:
FRONTEND_URL=http://localhost:5173
# Render (production) uses:
# FRONTEND_URL=https://spur-ai-support-agent.vercel.app
```

> There is also `backend/.env.example` as a reference; keep `.env` itself out of git.

### 2.2. Frontend `.env`

Create `frontend/.env`:

```env
# Where the backend is running
# Local dev:
VITE_API_BASE_URL=http://localhost:3001

# Production (Vercel) uses:
# VITE_API_BASE_URL=https://spur-ai-support-agent.onrender.com
```

`VITE_` prefix is required so Vite exposes the variable to the browser.

***

## 🗄️ 3. Database Setup (Neon / Postgres)

The app expects a PostgreSQL database with two tables:

```sql
-- conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.1. Using Neon

1. 🆕 Create a project + database in **Neon**.  
2. 🔑 Copy the connection string into `DATABASE_URL` in `backend/.env`.  
3. 📜 Run the SQL above via Neon’s SQL editor or `psql`.

### 3.2. Local Postgres

```bash
createdb spur_ai_support
psql spur_ai_support < schema.sql   # schema.sql contains the SQL above
```

Then:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/spur_ai_support
```

No additional seeding is required; FAQ/domain knowledge comes from the prompt.

---

## 🧑‍💻 4. Running Locally

### 4.1. Backend

```bash
cd backend
npm install
npm run dev   # or npm start for compiled build
```

- 🔗 Server: `http://localhost:3001`  
- 📊 Status page at `/` shows:
  - API health  
  - DB connectivity  
  - Button to open the chat UI  

Key endpoints:

- `POST /api/chat/message`  
- `GET  /api/chat/history/:sessionId`

### 4.2. Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

- 🔗 Vite dev server: `http://localhost:5173`  
- Chat UI talks to the backend using `VITE_API_BASE_URL`.

***

## 📡 5. API Contract

### 5.1. `POST /api/chat/message`

**Request body:**

```json
{
  "message": "What is your return policy?",
  "sessionId": "optional-conversation-id"
}
```

- `message` – required, non‑empty string.  
- `sessionId` – optional; if missing, a new conversation is created.

**Response:**

```json
{
  "reply": "We offer 30-day returns on unused items...",
  "sessionId": "a9c4a1b5-..."
}
```

### 5.2. `GET /api/chat/history/:sessionId`

**Response:**

```json
{
  "messages": [
    { "sender": "user", "text": "...", "timestamp": "..." },
    { "sender": "ai",   "text": "...", "timestamp": "..." }
  ]
}
```

Used by the frontend on mount to restore previous chats.

***

## 💬 6. Frontend (Chat UI)

Built with **Svelte + Vite**.

Key features:

- 🧾 Scrollable message list with auto‑scroll to the latest message.  
- 🎨 Clear distinction between user and AI bubbles (alignment + color).  
- ⌨️ Input box + send button; **Enter** sends, **Shift+Enter** adds a newline.  
- ⏳ Disabled send button while a request is in flight.  
- 💭 “Agent is typing…” dot animation while waiting for the LLM.  
- 🕒 Per‑message timestamps that stay readable in light/dark themes.  
- 🌗 Theme toggle with preference saved in `localStorage`.  
- ♻️ Session ID stored in `localStorage` to reload history on refresh.

---

## 🧱 7. Backend Architecture Overview

The backend is a small **Node.js + TypeScript** service:

- **HTTP server / entrypoint**
  - Sets up Express, JSON parsing, CORS, and the status page.
  - Mounts `/api/chat` routes.

- **Routes**
  - `POST /api/chat/message`  
    - Validate input.  
    - Fetch conversation history from DB.  
    - Call LLM service.  
    - Persist user + AI messages.  
  - `GET /api/chat/history/:sessionId`  
    - Load messages for a given conversation.

- **Services**
  - 🔮 **LLM service**  
    - `generateReply(history, userMessage)` wraps the OpenAI SDK.  
    - Contains system prompt, token limits, and error handling.  
  - 💾 **Conversation service**  
    - `createConversation()`  
    - `appendMessage(conversationId, sender, text)`  
    - `getConversationMessages(conversationId)`

- **Data access**
  - A compact Postgres client configured via `DATABASE_URL`.  
  - All SQL lives in one place, so switching DBs or adding migrations is straightforward.

This separation makes it easy to later plug in other channels (WhatsApp, Instagram, etc.) that reuse the same services.

***

## 🧠 8. LLM Integration

### 8.1. Provider
- ⚙️ **Provider**: OpenRouter  
- 🔑 **Auth**: `OPENROUTER_API_KEY` via environment variables.

### 8.2. Prompting strategy

Each LLM call includes:

- **System prompt** (simplified):

  > You are a helpful support agent for a small e‑commerce store.  
  > Answer clearly and concisely.  
  > You know the store’s shipping, returns, refunds, and support hours.

- **Conversation history**:  
  - A sliding window of previous messages from the DB (to keep context and control tokens).  
- **User message**:  
  - The latest user input from the chat UI.

### 8.3. Domain knowledge / FAQs

The agent is aware of:

- 📦 Shipping policy (regions, typical delivery times, basics of shipping cost).  
- 🔁 Return/refund policy (window, condition, refund timing).  
- 🕒 Support hours (time zone, weekday/weekend availability).

For this exercise, these are **hard‑coded in the system prompt** rather than stored in the DB.

### 8.4. Guardrails & limits

- Rejects empty messages and trims very long messages.  
- Catches API errors (timeouts, invalid key, rate limits) and returns friendly messages instead of crashing.  
- Limits history length to keep token usage manageable.  
- Logs unexpected errors server‑side while returning safe responses to the client.

***

## 🛡️ 9. Error Handling & Robustness

- ✅ **Input validation**
  - Backend checks `message` exists and is a string.  
  - Frontend disables sending when the input is empty or only whitespace.

- ✅ **Network/LLM errors**
  - Backend wraps calls in `try/catch` and returns JSON errors.  
  - Frontend displays an error banner instead of silently failing.

- ✅ **CORS & security**
  - CORS allows only:
    - `http://localhost:5173` (dev)  
    - `https://spur-ai-support-agent.vercel.app` (prod)  
  - API keys and DB credentials live only in environment variables.

***

## ☁️ 10. Deployment

### 10.1. Backend – Render

- Type: Web Service  
- Root directory: `backend`  
- Build command: `npm install`  
- Start command: `npm run start` (or equivalent)  

Environment variables:

- `PORT`  
- `DATABASE_URL`  
- `OPENROUTER_API_KEY` 
- `FRONTEND_URL=https://spur-ai-support-agent.vercel.app`  

Status page: `https://spur-ai-support-agent.onrender.com`.

### 10.2. Frontend – Vercel

- Imported from the same GitHub repo.  
- Root directory: `frontend`  
- Framework preset: Svelte / Vite  

Environment variables:

- `VITE_API_BASE_URL=https://spur-ai-support-agent.onrender.com`  

Production URL: `https://spur-ai-support-agent.vercel.app`.

***

## ⚖️ 11. Trade‑offs & “If I Had More Time…”

**Intentional simplifications:**

- Domain knowledge is prompt‑based, not a full knowledge base or RAG system.  
- No auth; conversations are anonymous and keyed by a random `sessionId`.  
- Single provider (OpenRouter), single model, no provider abstraction.

**Future improvements:**

- 📚 Move FAQs into the DB and build prompts from structured data.  
- 🔌 Introduce a channel abstraction (web, WhatsApp, IG) all reusing the same conversation + LLM services.  
- ✅ Add unit and integration tests covering:
  - LLM service  
  - DB CRUD functions  
  - Chat endpoint contract  
- 📈 Add basic analytics: latency, token usage per conversation, success/error rates.

---

## ✅ 12. How to Evaluate Quickly

1. Visit `https://spur-ai-support-agent.vercel.app`.  
2. Ask questions like:
   - “What is your return policy?”  
   - “Do you ship to the USA?”  
   - “What are your support hours?”  
3. Refresh the page – the previous chat should reload (conversation history from Postgres).  
4. Open `https://spur-ai-support-agent.onrender.com` to see backend status and “Open chat UI” button.

---

## 🧾 Credits

Built with 🧠 code, ☕ coffee, and a lot of debugging.  
Made with ❤️ by **Sunkara Purnasekhar**.
