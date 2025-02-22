"use client";
import { useEffect, useRef, useState } from "react";
import { type MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { DialogItem } from "../types";
import { actorMapsToVoices } from "@/config";

interface GenerateDialogResult {
  dialog: DialogItem[];
  allMessages: MessageParam[];
}

export default function Home() {
  const voicesMap = actorMapsToVoices['crisis'];

  // Flow state
  const [currentStep, setCurrentStep] = useState<'idle' | 'generating' | 'playing' | 'recording'>('idle');

  // Dialog generation state
  const [messages, setMessages] = useState<MessageParam[]>([]);
  const [dialog, setDialog] = useState<DialogItem[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Audio playback state
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Recording state
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingProcessing, setRecordingProcessing] = useState(false);
  const [recordingTranscript, setRecordingTranscript] = useState('');
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingMediaRecorderRef = useRef<MediaRecorder | null>(null);

  const generateDialog = async (messages: MessageParam[]): Promise<GenerateDialogResult | undefined> => {
    if (currentStep !== 'idle') return;
    try {
      setGenerationError(null);
      setCurrentStep('generating');

      const response = await fetch("/api/llm/crisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousMsgs: messages }),
      });

      if (!response.ok) throw new Error('Failed to generate dialog');

      const data = await response.json();
      setDialog(data.latestJsonDialog.answer.dialog);
      setMessages(data.allMessages);

      return {
        dialog: data.latestJsonDialog.answer.dialog,
        allMessages: data.allMessages
      };
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate dialog');
      throw error;
    }
  };

  const playAudioStream = async (dialogData: DialogItem[]) => {
    try {
      setAudioError(null);
      setCurrentStep('playing');

      const response = await fetch("/api/stream/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voicesMap, dialog: dialogData }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Audio generation failed");
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const blob = new Blob(chunks, { type: response.headers.get("Content-Type") || "audio/mpeg" });
      const audioUrl = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();

        return new Promise<void>((resolve) => {
          if (audioRef.current) {
            audioRef.current.onended = () => {
              URL.revokeObjectURL(audioUrl);
              resolve();
            };
          }
        });
      }
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : 'Audio playback failed');
      throw error;
    }
  };

  const startRecording = async () => {
    try {
      recordingChunksRef.current = [];
      setRecordingError(null);
      setCurrentStep('recording');

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
            setMessages([...messages, { role: 'user', content: data.text }]);
          }
        } catch (error) {
          setRecordingError('Failed to transcribe audio');
        } finally {
          setRecordingProcessing(false);
          setCurrentStep('idle');
        }
      };

      mediaRecorder.start();
      recordingMediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      setRecordingError('Failed to start recording');
      setCurrentStep('idle');
    }
  };

  const stopRecording = () => {
    if (recordingMediaRecorderRef.current) {
      recordingMediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setRecordingTranscript('');
  };

  const handleStart = async (messagesToUse: MessageParam[]) => {
    try {
      const dialogResult = await generateDialog(messagesToUse);
      if (!dialogResult) return;
      await playAudioStream(dialogResult.dialog);
      setCurrentStep('idle'); // Return to idle state after audio finishes
    } catch (error) {
      setCurrentStep('idle');
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    }
  };

  // Effect to handle auto-continue flow
  useEffect(() => {
    async function handleAutoContinue() {
      if (currentStep === 'idle' && recordingTranscript) {
        try {
          await handleStart(messages);
        } finally {
          setRecordingTranscript('');
        }
      }
    }
    handleAutoContinue();
  }, [currentStep, recordingTranscript, messages]); // Add messages dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col space-y-4">
          {/* Main control button */}
          {currentStep === 'idle' && !recordingTranscript && (
            <button
              onClick={() => handleStart(messages)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start
            </button>
          )}

          {/* Start Speaking button */}
          {currentStep === 'idle' && recordingTranscript === '' && dialog.length > 0 && (
            <button
              onClick={startRecording}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Start Speaking
            </button>
          )}

          {/* Recording control button */}
          {currentStep === 'recording' && (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={recordingProcessing}
            >
              Stop Speaking
            </button>
          )}

          {/* Status indicators */}
          {currentStep === 'generating' && (
            <div className="flex items-center text-gray-600">
              <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-gray-900 rounded-full"></div>
              Generating dialog...
            </div>
          )}

          {currentStep === 'playing' && (
            <div className="flex items-center text-gray-600">
              <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-gray-900 rounded-full"></div>
              Playing audio...
            </div>
          )}

          {recordingProcessing && (
            <div className="flex items-center text-gray-600">
              <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-gray-900 rounded-full"></div>
              Processing recording...
            </div>
          )}

          {/* Error messages */}
          {generationError && (
            <div className="p-4 bg-red-100 text-red-700 rounded">{generationError}</div>
          )}

          {audioError && (
            <div className="p-4 bg-red-100 text-red-700 rounded">{audioError}</div>
          )}

          {recordingError && (
            <div className="p-4 bg-red-100 text-red-700 rounded">{recordingError}</div>
          )}

          {/* Transcription result */}
          {recordingTranscript && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Transcription:</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{recordingTranscript}</p>
              </div>
            </div>
          )}
        </div>

        <audio ref={audioRef} hidden />
      </main>
    </div>
  );
}
