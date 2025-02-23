import { ElevenLabsClient } from "elevenlabs";
import { NextRequest } from 'next/server';
import { elevenLabsVoices } from "@/config";

interface DialogItem {
  actor: string;
  text: string;
}

interface RequestInput {
  dialog: DialogItem[];
  voicesMap: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY!,
  });

  try {
    const { dialog, voicesMap }: RequestInput = await req.json();

    if (!dialog || !voicesMap) {
      return new Response(JSON.stringify({ error: "Dialog and voicesMap are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate the actors in the dialog
    const actors = dialog.map((item) => item.actor);
    const invalidActors = actors.filter((actor) => !voicesMap[actor]);
    if (invalidActors.length > 0) {
      return new Response(JSON.stringify({ error: `Invalid actors: ${invalidActors.join(", ")}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dialogToGenerate = dialog.map((item) => {
      return { voiceId: elevenLabsVoices[voicesMap[item.actor]], text: item.text };
    })

    console.log('Dialog to generate', dialogToGenerate);

    const readable = new ReadableStream({
    async start(controller) {
      try {
        /* elevenlabs.generate({
          voice: selectedVoice,
          text: text,
          stream: true,
          model_id: "eleven_turbo_v2_5",
          output_format: "mp3_44100_64",
        }); */
        for (const item of dialogToGenerate) {
          console.log('Item', item);
          const audioStream = await elevenlabs.textToSpeech.convertAsStream(
            item.voiceId,
            {
              text: item.text,
              model_id: "eleven_multilingual_v2",
              output_format: "mp3_44100_64",
              // voice_settings: {
              //   use_speaker_boost: true
              // },
            }
          );

          // Read the audio stream and enqueue chunks
          for await (const chunk of audioStream) {
            controller.enqueue(chunk);
          }
        }

      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
} catch (error) {
  return new Response(JSON.stringify({ error: "Invalid request body" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
}
