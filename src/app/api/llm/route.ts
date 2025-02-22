import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk';
import { loadPrompt } from '@/lib/llm';


export async function POST(req: NextRequest) {
  const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
  });

  const messages = loadPrompt('crisis.v1')
  const completion = await client.messages.create({
    max_tokens: 8192,
    temperature: 1,
    messages,
    model: 'claude-3-5-sonnet-latest',
  });

  console.log(completion.content);

  return new Response(JSON.stringify({ text: completion.content }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
