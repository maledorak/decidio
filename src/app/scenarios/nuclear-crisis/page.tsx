"use client";
import { useScenario } from "@/hooks/use-scenario";
import { actorMapsToVoices } from "@/config";

export default function NuclearCrisisScenario() {
  const scenarioName = 'nuclear-crisis';
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
    <div className="min-h-screen bg-gradient-to-b from-black to-crisis-dark p-4 sm:p-8 pb-20">
      <div className="max-w-4xl mx-auto relative">
        <div className="absolute inset-0 bg-crisis-red/5 blur-[100px] rounded-full animate-float" />
        <main className="flex flex-col gap-8 relative z-10">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-crisis-light">
              Nuclear Crisis
            </h1>
            <p className="text-sm text-crisis-light/80">
              Simulated national security scenario
            </p>
          </header>
          <div className="flex flex-col space-y-4 items-center text-center">
          {/* Main control button */}
          {currentStep === 'idle' && dialog.length === 0 && (
            <button
              onClick={handleStart}
              className="crisis-button glass-panel px-6 py-3 bg-crisis-red text-crisis-light hover:bg-crisis-accent"
            >
              Start
            </button>
          )}

          {/* Start Speaking button */}
          {currentStep === 'idle' && dialog.length > 0 && (
            <button
              onClick={startRecording}
              className="crisis-button glass-panel px-6 py-3 bg-green-600/90 text-crisis-light hover:bg-green-700/90"
            >
              Start Speaking
            </button>
          )}

          {/* Recording control button */}
          {currentStep === 'recording' && (
            <button
              onClick={stopRecording}
              className="crisis-button glass-panel px-6 py-3 bg-red-600/90 text-crisis-light hover:bg-red-700/90"
              disabled={recordingProcessing}
            >
              Stop Speaking
            </button>
          )}

          {/* Status indicators */}
          {currentStep === 'generating' && (
            <div className="glass-panel p-4 text-crisis-light/80 flex items-center">
              <div className="animate-spin mr-3 h-5 w-5 border-t-2 border-b-2 border-crisis-light rounded-full" />
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
            <div className="glass-panel p-4 text-red-300 border border-red-500/30">{generationError}</div>
          )}

          {audioError && (
            <div className="p-4 bg-red-100 text-red-700 rounded">{audioError}</div>
          )}

          {recordingError && (
            <div className="p-4 bg-red-100 text-red-700 rounded">{recordingError}</div>
          )}

          {/* Transcription result */}
          {/* {recordingTranscript && (
            <div className="mt-6 glass-panel p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-crisis-red/20 to-crisis-accent/20 opacity-30 rounded-lg" />
              <h2 className="text-lg font-bold mb-3 text-crisis-light">Transcription:</h2>
              <p className="whitespace-pre-wrap text-crisis-light/90">{recordingTranscript}</p>
            </div>
          )} */}
        </div>

        <audio ref={audioRef} hidden />
      </main>
    </div>
  </div>
);
}
