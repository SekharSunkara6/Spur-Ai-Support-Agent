import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  getOrCreateConversation,
  saveMessage,
  getConversationMessages
} from '../lib/db';
import { generateReply } from '../lib/llm';

const router = Router();

const bodySchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().optional()   // remove .uuid()
});

router.post('/message', async (req: Request, res: Response) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const { message, sessionId } = parsed.data;

    const conversationId = await getOrCreateConversation(sessionId);
    await saveMessage(conversationId, 'user', message);

    const history = await getConversationMessages(conversationId);
    const reply = await generateReply(history, message);

    await saveMessage(conversationId, 'ai', reply);

    res.json({ reply, sessionId: conversationId });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

router.get('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const messages = await getConversationMessages(sessionId);

    if (!messages.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      sessionId,
      messages: messages.map((m: any) => ({
        sender: m.sender as 'user' | 'ai',
        text: m.text as string,
        timestamp: m.timestamp as string
      }))
    });
  } catch (err: any) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to load conversation history' });
  }
});

export default router;