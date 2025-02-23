import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk';
import { type MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { loadAnthropicMessages } from '@/lib/llm';


interface RequestInput {
  scenarioPrompt: string;
  previousMsgs: MessageParam[];
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
  });

  const reqInput: RequestInput = await req.json();
  const { scenarioPrompt } = reqInput;
  let { previousMsgs } = reqInput;
  if (previousMsgs.length === 0) {
    previousMsgs = [{
      role: 'user',
      content: '.' // because Anthropic like vendor lock-in and wants to be different from OpenAI standards...
    }];
  }

  console.log('previousMsg', previousMsgs);

  const crisisCompletion = await client.messages.create({
    system: scenarioPrompt,
    max_tokens: 8192,
    temperature: 1,
    messages: previousMsgs,
    model: 'claude-3-5-sonnet-latest',
  });

  const crisisResult = crisisCompletion.content[0];
  if (crisisResult.type !== 'text') {
    return new Response(JSON.stringify({ error: 'Unexpected response type' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const allMessages: MessageParam[] = [...previousMsgs, { role: 'assistant', content: crisisResult.text }];

  // Convert the XML dialogue response to JSON
  // Using XML because JSON lover the
  const jsonMessages = loadAnthropicMessages('crisisXmlToJson', { xml: crisisResult.text });
  console.log("LLM Json messages", jsonMessages);
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
  const rawJson = jsonResult.text.replace('```json', '').replace('```', '');
  const jsonOutput = JSON.parse(rawJson);

  // Process dialog items to remove asterisked text from non-narrator actors
  if (jsonOutput.answer?.dialog) {
    jsonOutput.answer.dialog.forEach((dialogItem: any) => {
      if (dialogItem.actor && dialogItem.actor !== 'narrator' && dialogItem.text) {
        // Remove text within asterisks and trim whitespace
        dialogItem.text = dialogItem.text.replace(/\*.*?\*/g, '').trim();
      }
    });
  }

  console.log("LLM Json output", jsonOutput);

  return new Response(JSON.stringify({ latestJsonDialog: jsonOutput, allMessages }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
