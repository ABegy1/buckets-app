import Link from 'next/link';

export default function BracketLanding() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Single-Elimination Bracket Builder</h1>
      <p className="text-zinc-300 max-w-3xl">
        Create, seed, and run single-elimination tournaments with automatic BYEs, live score entry, and a real-time viewer
        experience. Start below or jump into an existing bracket.
      </p>
      <div className="flex gap-3">
        <Link href="/tournaments/new" className="px-4 py-2 bg-blue-600 rounded text-white">
          Create new tournament
        </Link>
        <Link href="/" className="px-4 py-2 border border-zinc-700 rounded text-white">
          Go to home
        </Link>
      </div>
    </div>
  );
}
