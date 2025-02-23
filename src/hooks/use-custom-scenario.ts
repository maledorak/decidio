import { useEffect, useRef, useState } from "react";
import { type MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { DialogItem } from "@/types";
import { voicesDescriptions } from "@/config";

export const useCustomScenario = () => {
  // Flow state
  const [currentStep, setCurrentStep] = useState<'idle' | 'generating' | 'playing' | 'recording'>('idle');
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [generatedVoicesMap, setGeneratedVoicesMap] = useState<Record<string, string>>({});
  const [scenarioGenerated, setScenarioGenerated] = useState(false);

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

  const generateScenario = async (scenarioDescription: string) => {
    try {
      setGenerationError(null);
      setCurrentStep('generating');

      const response = await fetch("/api/llm/custom-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioDescription,
          voicesMap: voicesDescriptions
        }),
      });

      if (!response.ok) throw new Error('Failed to generate scenario');

      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      setGeneratedVoicesMap(data.voicesMap);
      setScenarioGenerated(true);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Scenario generation failed');
      throw error;
    }
  };

  const generateDialog = async (messagesToUse: MessageParam[]) => {
    try {
      if (!generatedPrompt) throw new Error('No scenario generated');

      setGenerationError(null);
      setCurrentStep('generating');

      const response = await fetch("/api/llm/custom-runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousMsgs: messagesToUse,
          scenarioPrompt: generatedPrompt
        }),
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
            setMessages(prev => [...prev, { role: 'user', content: data.text }]);
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
      setCurrentStep('idle');
    } catch (error) {
      setCurrentStep('idle');
      setGenerationError(error instanceof Error ? error.message : 'Generation failed');
    }
  };

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
  }, [currentStep, recordingTranscript, messages]);

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

  return {
    currentStep,
    dialog,
    generationError,
    audioError,
    recordingError,
    recordingProcessing,
    recordingTranscript,
    handleStart: () => handleStart(messages),
    startRecording,
    stopRecording,
    audioRef,
    generateScenario,
    generatedPrompt,
    scenarioGenerated,
  };
};
