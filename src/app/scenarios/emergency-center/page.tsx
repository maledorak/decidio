"use client";
import { useScenario } from "@/hooks/use-scenario";
import { actorMapsToVoices } from "@/config";

export default function EmergencyCenterScenario() {
  const scenarioName = 'emergency-center';
  const {
    currentStep,
    dialog,
    generationError,
    audioError,
    recordingError,
    recordingProcessing,
    recordingTranscript,
    handleStart,
    startRecording,
    stopRecording,
    audioRef,
  } = useScenario(scenarioName, actorMapsToVoices[scenarioName]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col space-y-4">
          {/* Main control button */}
          {currentStep === 'idle' && !recordingTranscript && (
            <button
              onClick={handleStart}
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
