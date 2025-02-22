"use client";
import { useEffect, useRef, useState } from "react";
import { DialogItem } from "../types";
import { actorMapsToVoices } from "@/config";

export default function Home() {
  const voicesMap = actorMapsToVoices['crisis'];

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingProcessing, setRecordingProcessing] = useState(false);
  const [recordingTranscript, setRecordingTranscript] = useState('');
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingMediaRecorderRef = useRef<MediaRecorder | null>(null);

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
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const run = async () => {
    const dialogg = await startGenerateDialog();
    await startAudioStream(dialogg);
  }

  const startRecording = async () => {
    try {
      console.log('Start recording');
      recordingChunksRef.current = [];
      setRecordingError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setRecordingProcessing(true);
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch('/api/stream/stt', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          if (data.text) {
            setRecordingTranscript(data.text);
          }
        } catch (error) {
          console.error('Error sending audio to API:', error);
          setRecordingError('Failed to transcribe audio');
        } finally {
          setRecordingProcessing(false);
        }
      };

      mediaRecorder.start();
      recordingMediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingError('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    console.log('Stop recording');
    if (recordingMediaRecorderRef.current) {
      recordingMediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }
    setIsRecording(false);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col space-y-4">
          <button onClick={run}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Run
          </button>

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={recordingProcessing}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          {recordingProcessing && (
            <div className="flex items-center text-gray-600">
              <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-gray-900 rounded-full"></div>
              Processing recording...
            </div>
          )}

          {recordingError && (
            <div className="p-4 bg-red-100 text-red-700 rounded">{recordingError}</div>
          )}

          {recordingTranscript && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Transcription:</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{recordingTranscript}</p>
              </div>
            </div>
          )}

          {audioGenError && (
            <div className="p-4 bg-red-100 text-red-700 rounded">{audioGenError}</div>
          )}
        </div>

        <audio ref={audioGenRef} hidden />
      </main>
    </div>
  );
}
