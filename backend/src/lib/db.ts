import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function getOrCreateConversation(sessionId?: string) {
  if (sessionId) {
    const result = await pool.query(
      'SELECT id FROM conversations WHERE id = $1',
      [sessionId]
    );
    if (result.rows[0]) return sessionId;
  }

  const result = await pool.query(
    'INSERT INTO conversations DEFAULT VALUES RETURNING id'
  );
  return result.rows[0].id as string;
}

export async function saveMessage(
  conversationId: string,
  sender: 'user' | 'ai',
  text: string
) {
  await pool.query(
    'INSERT INTO messages (conversation_id, sender, text) VALUES ($1, $2, $3)',
    [conversationId, sender, text]
  );
}

export async function getConversationMessages(conversationId: string) {
  const result = await pool.query(
    'SELECT conversation_id, sender, text, timestamp FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC',
    [conversationId]
  );
  return result.rows;
}
