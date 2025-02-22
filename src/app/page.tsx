'use client';

import { Button } from "@/components/ui/button";

export default function Home() {
  const handleClick = async (e) => {
    console.log('Generate');
    const out = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    out.json().then((data) => {
      console.log(data);
    });


    e.preventDefault();
  }
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Button onClick={handleClick} className="h-10 px-4 sm:px-5">
          {/* <Loader2 className="animate-spin" /> */}
          Generate
        </Button>
      </main>
    </div>
  );
}
function useState(arg0: boolean): [any, any] {
  throw new Error("Function not implemented.");
}

