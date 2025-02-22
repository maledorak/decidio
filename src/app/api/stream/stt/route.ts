import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob;

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File object from the buffer
    const file = new File([buffer], 'audio.webm', { type: 'audio/webm' });

    // Send to OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
