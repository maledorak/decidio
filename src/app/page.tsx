"use client";
import { useEffect, useRef, useState } from "react";
import { DialogItem } from "../types";


const voicesMap = {
  'narrator': 'tarun',
  'Chief_of_Staff': 'angry',
  'National_Security_Advisor': 'harry',
  'Secretary_of_Defense':'roger',
  'Foreign_Minister':'oxley',
  'Press_Secretar':'espero'
}

export default function AudioStreamingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("This is an example message");
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      setError("Please generate a dialog first.");
      return;
    }

    try {
      setIsPlaying(true);
      setError(null);

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
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }

      // Cleanup
      audioRef.current?.addEventListener("ended", () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      });
    } catch (err) {
      if ((err as any).name === "AbortError") {
        // Fetch aborted
        return;
      }
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
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

  const record = () => {

  }

  return (
  <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <div className="flex flex-col space-y-4">

        <button onClick={run}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Run
        </button>

        <button onClick={record}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Record
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

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
        )}
      </div>

      <audio ref={audioRef} hidden />
    </main>
  </div>
  );
}
