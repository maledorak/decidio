import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk';
import { loadAnthropicMessages } from '@/lib/llm';



export async function POST(req: NextRequest) {
  const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
  });

  const crisisMessages = loadAnthropicMessages('crisis.v2')

  console.log(crisisMessages);
  const crisisCompletion = await client.messages.create({
    max_tokens: 8192,
    temperature: 1,
    messages: crisisMessages.rest,
    model: 'claude-3-5-sonnet-latest',
  });

  const result = crisisCompletion.content[0];
  if (result.type !== 'text') {
    return new Response(JSON.stringify({ error: 'Unexpected response type' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const jsonMessages = loadAnthropicMessages('crisisXmlToJson.v1', { xml: result.text });
  const jsonCompletion = await client.messages.create({
    system: jsonMessages.system,
    max_tokens: 8192,
    temperature: 1,
    messages: jsonMessages.rest,
    model: 'claude-3-5-haiku-latest',
  });

  const jsonResult = jsonCompletion.content[0];
  if (jsonResult.type !== 'text') {
    return new Response(JSON.stringify({ error: 'Unexpected json response type' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const jsonOutput = JSON.parse(jsonResult.text);
  console.log(jsonOutput);

  return new Response(JSON.stringify({ text: jsonOutput }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
