"use client";
import { useEffect, useRef, useState } from "react";

// const dialog = [
//   {
//     'actor': 'narrator',
//     'text': 'Jest spokojne wtorkowe popołudnie w Gabinecie Owalnym. Nagle, drzwi otwierają się z impetem. Do środka wbiega Szef Sztabu wraz z Doradcą ds. Bezpieczeństwa Narodowego. Ich twarze są blade, a oddech przyspieszony.'
//   },
//   {
//     'actor': 'Szef_Sztabu',
//     'text': 'Panie Prezydencie! Mamy sytuację kryzysową najwyższego priorytetu! Systemy wczesnego ostrzegania NORAD wykryły właśnie start trzech pocisków balistycznych z terytorium Korei Północnej!'
//   },
//   {
//     'actor': 'Doradca_Bezpieczeństwa',
//     'text': 'Według wstępnych analiz, trajektoria wskazuje na możliwy cel w postaci zachodniego wybrzeża Stanów Zjednoczonych. Szacowany czas do potencjalnego uderzenia: 28 minut. Musimy natychmiast podjąć działania!'
//   },
//   {
//     'actor': 'narrator',
//     'text': 'Na biurku przed Tobą rozbrzmiewa czerwony telefon, a na ekranach w pomieszczeniu pojawiają się mapy z oznaczonymi trajektoriami pocisków. Personel czeka na Twoje pierwsze polecenia.'
//   }
// ]

const dialog = [
  {
    'actor': 'narrator',
    'text': 'It\'s a quiet Tuesday afternoon in the Oval Office. Suddenly, the door bursts open. The Chief of Staff rushes in along with the National Security Advisor. Their faces are pale, and their breathing is rapid.'
  },
  {
    'actor': 'Chief_of_Staff',
    'text': 'Mr. President! We have a highest priority crisis situation! NORAD early warning systems have just detected the launch of three ballistic missiles from North Korean territory!'
  },
  {
    'actor': 'Security_Advisor',
    'text': 'According to preliminary analysis, the trajectory indicates a possible target on the west coast of the United States. Estimated time to potential impact: 28 minutes. We must take immediate action!'
  },
  {
    'actor': 'narrator',
    'text': 'The red phone on your desk starts ringing, and the screens in the room display maps with marked missile trajectories. The staff awaits your first orders.'
  }
]

const voicesMap = {
  'narrator': 'roger',
  'Chief_of_Staff': 'charlie',
  'Security_Advisor': 'gorge'
}

export default function AudioStreamingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("This is an example message");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startAudioStream = async () => {
    if (!message.trim()) {
      setError("Please enter a message.");
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
        body: JSON.stringify({ voicesMap, dialog }),
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

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Hack</h1>

      <div className="space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          className="w-full p-2 border rounded"
          rows={4}
          disabled={isPlaying}
        />

        <button
          onClick={isPlaying ? stopAudio : startAudioStream}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
                     disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={isPlaying && !message}
        >
          {isPlaying ? "Stop Audio" : "Play Audio"}
        </button>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
        )}
      </div>

      <audio ref={audioRef} hidden />
    </main>
  );
}
