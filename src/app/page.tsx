"use client";
import { useEffect, useRef, useState } from "react";
import { DialogItem } from "../types";
import { actorMapsToVoices } from "@/config";


export default function Home() {
  const voiceMap = actorMapsToVoices['crisis'];

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // Audio generation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioGenError, setAudioGenError] = useState<string | null>(null);
  const audioGenRef = useRef<HTMLAudioElement | null>(null);

  // Dialog generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialog, setDialog] = useState<DialogItem[]>([]);

  const startGenerateDialog = async () => {
    setIsGenerating(true);
    console.log("Generating dialog...");
    const response = await fetch("/api/llm/crisis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    setDialog(data.text.answer.dialog);
    console.log("Dialog generated:", data.text.answer.dialog);
    return data.text.answer.dialog;
  }

  const startAudioStream = async (_dialog: DialogItem[]) => {
    if (!_dialog) {
      setAudioGenError("Please generate a dialog first.");
      return;
    }

    try {
      setIsPlaying(true);
      setAudioGenError(null);

      // Create a new AbortController to allow cancellation
      const abortController = new AbortController();

      const response = await fetch("/api/stream/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voicesMap, dialog: _dialog }),
        signal: abortController.signal,
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred");
      }

      // Create a blob from the response stream
      const contentType = response.headers.get("Content-Type") || "audio/mpeg";
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks, { type: contentType });
      const audioUrl = URL.createObjectURL(blob);

      // Play the audio
      if (audioGenRef.current) {
        audioGenRef.current.src = audioUrl;
        audioGenRef.current.play();
      }

      // Cleanup
      audioGenRef.current?.addEventListener("ended", () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      });
    } catch (err) {
      if ((err as any).name === "AbortError") {
        // Fetch aborted
        return;
      }
      setAudioGenError(err instanceof Error ? err.message : "An error occurred");
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioGenRef.current) {
      audioGenRef.current.pause();
      audioGenRef.current.src = "";
    }
    setIsPlaying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const run = async () => {
    const dialogg = await startGenerateDialog();
    await startAudioStream(dialogg);
  }

  const startRecording = async () => {
    console.log('Start recording');
    setIsRecording(true);
    setRecordingError(null);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordingStreamRef.current = stream;

  }

  const stopRecording = async () => {
    console.log('Stop recording');
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }


  return (
  <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <div className="flex flex-col space-y-4">

        <button onClick={run}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Run
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        {/* <button onClick={startGenerateDialog}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Generate dialog
        </button> */}

        {/* <button
          onClick={isPlaying ? stopAudio : startAudioStream}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
                     disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={isPlaying && !message}
        >
          {isPlaying ? "Stop Audio" : "Play Audio"}
        </button> */}

        {audioGenError && (
          <div className="p-4 bg-red-100 text-red-700 rounded">{audioGenError}</div>
        )}
      </div>

      <audio ref={audioGenRef} hidden />
    </main>
  </div>
  );
}
