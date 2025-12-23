import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import { pool } from './lib/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(express.static('public'));

// nice landing page at /
app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>Spur AI Support Agent API</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            background: radial-gradient(circle at top, #1d4ed8, #020617);
          }
          .card {
            width: 100%;
            max-width: 720px;
            background: #020617;
            border-radius: 20px;
            padding: 24px 28px 20px;
            box-shadow: 0 20px 50px rgba(15,23,42,0.85);
            color: #e5e7eb;
          }
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-img {
  width: 100px;      /* increase width */
  height: 60px;     /* increase height */
  object-fit: contain;
  border-radius: 12px;
  background: #0b1120;
}
          h1 {
            margin: 0;
            font-size: 20px;
          }
          .tagline {
            margin: 2px 0 0;
            font-size: 15px;
            color: #9ca3af;
          }
          .badge {
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 999px;
            background: rgba(56,189,248,0.15);
            color: #7dd3fc;
            border: 1px solid rgba(125,211,252,0.4);
            font-weight: 500;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 12px;
            margin-bottom: 16px;
          }
          .pill {
            padding: 10px 12px;
            border-radius: 12px;
            background: rgba(15,23,42,0.9);
            border: 1px solid rgba(55,65,81,0.9);
            font-size: 12px;
          }
          .pill span {
            display: block;
          }
          .pill-label {
            color: #9ca3af;
            margin-bottom: 3px;
          }
          .pill-value {
            color: #e5e7eb;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }
          .status-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
          }
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #22c55e;
            box-shadow: 0 0 0 4px rgba(34,197,94,0.35);
          }
          .status-text {
            font-size: 14px;
            color: #a7f3d0;
          }
          .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 6px;
          }
          .hint {
            font-size: 13px;
            color: #6b7280;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 999px;
            border: none;
            background: #2563eb;
            color: white;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
          }
          .btn span {
            font-size: 16px;
          }
          @media (max-width: 640px) {
            .card { margin: 16px; padding: 20px; }
            .grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="card-header">
            <div class="brand">
  <img src="/spur-logo.png" alt="Spur logo" class="logo-img" />
  <div>
                <h1>Spur AI Support Agent API</h1>
                <p class="tagline">Backend for the live chat assignment</p>
              </div>
            </div>
            <span class="badge">Healthy • v1</span>
          </div>

          <div class="status-row">
            <div class="status-dot"></div>
            <div class="status-text">All systems operational – ready to receive chat messages.</div>
          </div>

          <div class="grid">
            <div class="pill">
              <span class="pill-label">Health check</span>
              <span class="pill-value">GET /health</span>
            </div>
            <div class="pill">
              <span class="pill-label">Send message</span>
              <span class="pill-value">POST /api/chat/message</span>
            </div>
            <div class="pill">
              <span class="pill-label">History</span>
              <span class="pill-value">GET /api/chat/history/:sessionId</span>
            </div>
            <div class="pill">
              <span class="pill-label">Frontend UI</span>
              <span class="pill-value">http://localhost:5173</span>
            </div>
          </div>

          <div class="footer">
            <p class="hint">Tip: open the chat UI in another tab and watch this API handle requests in your logs.</p>
            <a href="http://localhost:5173" class="btn">
              <span>➜</span> Open chat UI
            </a>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'db error' });
  }
});

app.use('/api/chat', chatRouter);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
