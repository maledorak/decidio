"use client";
import Link from "next/link";
import { useState } from "react";
import { useCustomScenario } from "@/hooks/use-custom-scenario";
import { Footer } from "@/components/footer";

export default function CustomScenario() {
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
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
    generateScenario,
    generatedPrompt,
    scenarioGenerated,
  } = useCustomScenario();

  const handleGenerate = async () => {
    if (!scenarioDescription) return;
    setIsGeneratingScenario(true);
    try {
      await generateScenario(scenarioDescription);
    } finally {
      setIsGeneratingScenario(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-crisis-dark p-4 flex items-center justify-center relative">
      <Link
        href="/"
        className="absolute left-20 top-[10%] text-2xl md:text-3xl font-bold tracking-tight hover:text-crisis-red transition-colors animate-glow z-50"
      >
        decidio
      </Link>
      <div className="max-w-3xl w-full relative">
        <div className="absolute inset-0 bg-gradient-to-r from-crisis-red/20 to-crisis-accent/20 blur-[100px] opacity-30 rounded-full animate-float" />
        <main className="flex flex-col gap-8 relative z-10">
          <header className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-crisis-light animate-glow tracking-tight">
              Custom Scenario
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Type your own scenario here
            </p>
          </header>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col space-y-4 items-center text-center">
          {/* Scenario input and generate button */}
          {!scenarioGenerated && (
            <>
              <textarea
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                className="w-full bg-black/20 border border-crisis-red/30 rounded-lg p-4 text-crisis-light focus:outline-none focus:ring-2 focus:ring-crisis-red"
                placeholder="Describe your crisis scenario..."
                rows={4}
              />
              <button
                onClick={handleGenerate}
                disabled={isGeneratingScenario}
                className="crisis-button glass-panel px-6 py-3 bg-crisis-red text-crisis-light hover:bg-crisis-accent"
              >
                {isGeneratingScenario ? 'Generating Scenario...' : 'Generate Scenario'}
              </button>
            </>
          )}

          {/* Main control button */}
          {scenarioGenerated && currentStep === 'idle' && dialog.length === 0 && (
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

        </div>
        </div>

        <audio ref={audioRef} hidden />
      </main>
    </div>
    <Footer />
  </div>
);
}
