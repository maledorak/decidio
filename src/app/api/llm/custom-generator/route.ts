import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk';
import { type MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { loadAnthropicMessages } from '@/lib/llm';
import { extractXml } from '@/lib/xml';

interface GeneratorOutput {
  meta_output: {
    voices: string
    prompt: string
  }
}

interface RequestInput {
  scenarioDescription: string;
  voicesMap: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
  });

  const reqInput: RequestInput = await req.json();
  const { voicesMap, scenarioDescription } = reqInput;

  console.log('Scenario description', scenarioDescription);
  const voicesMapJson = JSON.stringify(voicesMap);

  const generatorMessages = loadAnthropicMessages('custom-scenario-gen', { scenarioDescription, voicesMap: voicesMapJson });

  console.log('Generator messages', generatorMessages);
  const generatorCompletion = await client.messages.create({
    system: generatorMessages.system,
    max_tokens: 8192,
    temperature: 1,
    messages: generatorMessages.rest,
    model: 'claude-3-5-sonnet-latest',
  });

  const crisisResult = generatorCompletion.content[0];
  if (crisisResult.type !== 'text') {
    return new Response(JSON.stringify({ error: 'Unexpected response type' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const xmlResult = extractXml<GeneratorOutput>(crisisResult.text)
  if (!xmlResult.data) {
    return new Response(JSON.stringify({ error: 'Failed to extract XML' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  const voices_map = JSON.parse(xmlResult.data.meta_output.voices);
  const scenario_prompt = JSON.parse(xmlResult.data.meta_output.prompt);

  console.log("LLM Voices map", voicesMap);
  console.log("LLM Scenario prompt", scenario_prompt);

  return new Response(JSON.stringify({ voicesMap, prompt: scenario_prompt}), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
