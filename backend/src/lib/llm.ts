import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

const MODEL_ID = 'mistralai/devstral-2512:free';

const SYSTEM_PROMPT = `You are a helpful support agent for a small e-commerce store.
Store policies:
- Shipping: Free worldwide shipping on orders over $50, delivered in 3–7 business days.
- Returns: 30-day money-back guarantee. Items must be unused and in original packaging.
- Support hours: Mon–Fri 9AM–6PM EST, Sat 10AM–4PM EST.
- Payments: Stripe, Razorpay, and major credit/debit cards.
Answer clearly, concisely, and professionally.`;

export async function generateReply(history: any[], userMessage: string) {
  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history.map((m: any) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text as string
      })),
      { role: 'user' as const, content: userMessage }
    ];

    const completion = await client.chat.completions.create({
      model: MODEL_ID,
      messages,
      max_tokens: 200,
      temperature: 0.7
    });

    return (
      completion.choices[0]?.message?.content ??
      'Sorry, I could not answer that.'
    );
  } catch (err: any) {
    console.error('LLM error via OpenRouter:', err?.message || err);

    if (err?.status === 429) {
      return 'The AI is receiving too many requests right now. Please try again in a moment.';
    }

    return 'The AI service is temporarily unavailable. Please try again later.';
  }
}
