import { ElevenLabsClient } from "elevenlabs";
import { elevenLabsVoices } from "./voices";

export const generateSpeach = async (voice: string, text: string) => {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }

  const voiceId = elevenLabsVoices[voice];
  if (!voiceId) {
    throw new Error("Invalid voice");
  }
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  const output = await client.textToSpeech.convert(voiceId,
    {
      output_format: "mp3_44100_128",
      text: text,
      model_id: "eleven_multilingual_v2"
    }
  )

  console.log(output);
}
