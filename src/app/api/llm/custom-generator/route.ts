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
  console.log('Voices map', voicesMapJson);

  const generatorMessages = loadAnthropicMessages('custom-scenario-gen-v2');

  console.log('Generator messages', generatorMessages);
  const generatorCompletion = await client.messages.create({
    system: generatorMessages.system,
    max_tokens: 8192,
    temperature: 1,
    messages: [
      { role: "user", content: `<scenario_description>${scenarioDescription}</scenario_description> <voices_map>${voicesMapJson}</voices_map>`},
    ],
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

  // Convert the XML dialogue response to JSON
  // Using XML because JSON lover the
  const jsonMessages = loadAnthropicMessages('crisisXmlToJsonCustom', { xml: crisisResult.text });
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
  const jsonOutput: GeneratorOutput = JSON.parse(rawJson);

  // const xmlResult = extractXml<GeneratorOutput>(crisisResult.text)
  // console.log("XML Result", xmlResult);
  // if (!xmlResult.data) {
  //   return new Response(JSON.stringify({ error: 'Failed to extract XML' }), {
  //     status: 500,
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });
  // }
  const outputVoicesMap = JSON.parse(jsonOutput.meta_output.voices);
  const scenarioPrompt = jsonOutput.meta_output.prompt;

  console.log("LLM Voices map", outputVoicesMap);
  console.log("LLM Scenario prompt", scenarioPrompt);

  return new Response(JSON.stringify({ voicesMap: outputVoicesMap, prompt: scenarioPrompt}), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
