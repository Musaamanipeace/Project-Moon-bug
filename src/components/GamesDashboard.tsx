import React, { useState } from "react";
import { Bot, Crown, Gamepad2, RefreshCw, Send, Castle, Sparkles, Trophy, CheckCircle, ArrowRight, Users } from "lucide-react";

interface GamesDashboardProps {
  xp?: number;
  onAddXp?: (amount: number) => void;
  onNavigateToView?: (view: string) => void;
  onShareFeed?: (entry: { kind: any; title?: string; body?: string; refId?: string; refType?: string; experience?: string }) => void;
}

interface Phrase {
  answer: string;
  hints: [string, string, string];
}

const PHRASES: Phrase[] = [
  { answer: "Northern Lights", hints: ["A natural light show painted across the night sky.", "Best witnessed near the Earth's polar regions.", "Caused by charged solar particles colliding with our atmosphere."] },
  { answer: "Lunar Eclipse", hints: ["The sky dims during this celestial event.", "Earth sits directly between the Sun and the Moon.", "The Moon often glows a deep coppery red."] },
  { answer: "Comet", hints: ["A traveler from the cold edges of the Solar System.", "It grows a glowing tail as it nears the Sun.", "Halley's is the most famous example."] },
  { answer: "Milky Way", hints: ["The galaxy we call home.", "A pale band of countless stars across the dark.", "Best seen far from city lights."] },
  { answer: "Supermoon", hints: ["When the Moon is at its closest approach to Earth.", "It appears 14% larger than a micromoon.", "Coincides with a full or new moon."] },
];

const PIECE_ROWS: string[] = [
  "rnbqkbnr",
  "pppppppp",
  "        ",
  "        ",
  "        ",
  "        ",
  "PPPPPPPP",
  "RNBQKBNR",
];

const isWhitePiece = (c: string) => c >= "A" && c <= "Z";

export default function GamesDashboard({ xp = 0, onAddXp = () => {}, onNavigateToView, onShareFeed }: GamesDashboardProps) {
  const [phrase, setPhrase] = useState<Phrase>(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  const [hintsShown, setHintsShown] = useState(0);
  const [guess, setGuess] = useState("");
  const [phraseResult, setPhraseResult] = useState<"win" | "lose" | null>(null);
  const [phraseStreak, setPhraseStreak] = useState(0);

  const newPhrase = () => {
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    setHintsShown(0);
    setGuess("");
    setPhraseResult(null);
  };

  const submitGuess = () => {
    if (guess.trim().toLowerCase() === phrase.answer.toLowerCase()) {
      setPhraseResult("win");
      setPhraseStreak(s => s + 1);
      onAddXp(15);
      onShareFeed?.({ kind: "challenge_badge", title: `Won: ${phrase.answer}`, body: `Solved a moonrise AI phrase-guessing game.`, refId: phrase.answer, refType: "phrase_game", experience: `Correctly guessed "${phrase.answer}".` });
    } else {
      setPhraseResult("lose");
      setPhraseStreak(0);
    }
  };

  const [board, setBoard] = useState<string[][]>(() => PIECE_ROWS.map(r => r.split("")));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const resetChess = () => {
    setBoard(PIECE_ROWS.map(r => r.split("")));
    setSelected(null);
  };

  const clickSquare = (r: number, c: number) => {
    if (!selected) {
      const p = board[r][c];
      if (p && p !== " ") setSelected({ r, c });
      return;
    }
    const moving = board[selected.r][selected.c];
    const target = board[r][c];
    if (target !== " ") {
      const movingWhite = isWhitePiece(moving);
      const targetWhite = isWhitePiece(target);
      if (movingWhite && targetWhite) {
        setSelected({ r, c });
        return;
      }
    }
    const next = board.map(row => [...row]);
    next[r][c] = moving;
    next[selected.r][selected.c] = " ";
    setBoard(next);
    setSelected(null);
  };

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto text-slate-200">
      <div className="rounded-2xl border border-turquoise-500/30 bg-[#0a1b1f]/70 p-5 relative overflow-hidden">
        <div className="absolute -top-6 right-8 text-6xl opacity-20 select-none pointer-events-none">🎮</div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-turquoise-500/10 border border-turquoise-500/30 rounded-xl text-turquoise">
              <Gamepad2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <span>Multiplayer Games</span>
                <span className="px-2 py-0.5 bg-turquoise-500/10 text-turquoise border border-turquoise-500/30 rounded text-[10px]">Active</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                3-hint AI phrase guessing and chess. Win streaks earn XP.
              </p>
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950/40 text-center">
            <span className="block text-[9px] font-mono text-slate-500 uppercase">Phrase Streak</span>
            <span className="text-sm font-bold font-mono text-turquoise block">{phraseStreak}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phrase Guessing Game */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono text-turquoise uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" /> AI Phrase Guesser
          </h3>

          <div className="space-y-2">
            {Array.from({ length: hintsShown }).map((_, i) => (
              <div key={i} className="text-[11px] text-slate-300 font-mono p-2 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-turquoise">Hint {i + 1}:</span> {phrase.hints[i]}
              </div>
            ))}
          </div>

          {hintsShown < 3 && phraseResult === null && (
            <button
              onClick={() => setHintsShown(h => h + 1)}
              className="text-[10px] font-mono text-turquoise hover:text-turquoise-bright uppercase transition-colors"
            >
              + Reveal Next Hint
            </button>
          )}

          {phraseResult === null ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitGuess()}
                placeholder="Your guess..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-turquoise-500 font-mono"
              />
              <button
                onClick={submitGuess}
                className="px-4 py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono font-bold text-xs uppercase flex items-center gap-1 transition-all"
              >
                <Send className="w-3 h-3" /> Guess
              </button>
            </div>
          ) : (
            <div className={`p-3 rounded-xl border ${phraseResult === "win" ? "border-turquoise-500/30 bg-turquoise-500/5 text-emerald-400" : "border-slate-800 text-slate-300"}`}>
              <span className="text-sm font-bold font-mono block">
                {phraseResult === "win" ? "Correct! +15 XP" : `Answer: ${phrase.answer}`}
              </span>
            </div>
          )}

          <button
            onClick={newPhrase}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-turquoise transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> New Phrase
          </button>
        </section>

        {/* Chess Game */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-turquoise uppercase tracking-wider flex items-center gap-1.5">
              <Castle className="w-3.5 h-3.5" /> Chess Board
            </h3>
            <button
              onClick={resetChess}
              className="text-[10px] font-mono text-slate-400 hover:text-turquoise flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Click a piece, then a target square to move.</p>
          <div className="grid grid-cols-8 gap-0 w-full max-w-[280px] mx-auto border border-slate-700">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isSel = selected && selected.r === r && selected.c === c;
                const dark = (r + c) % 2 === 1;
                const pieceLabel: Record<string, string> = {
                  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
                  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
                };
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => clickSquare(r, c)}
                    className={`aspect-square flex items-center justify-center text-lg leading-none ${
                      isSel ? "bg-turquoise-500 text-slate-950" : dark ? "bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-900"
                    }`}
                  >
                    {cell === " " ? "" : (pieceLabel[cell] || cell)}
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md p-4 text-center">
        <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
          Compete in the 3-hint phrase-guessing game (generated by AI) or play chess with the community.
          Winning a phrase round earns +15 XP and posts a badge to your personal feed.
        </p>
        <button
          onClick={() => onNavigateToView?.("challenges")}
          className="mt-2 text-[10px] font-mono text-turquoise hover:text-turquoise-bright flex items-center gap-1 mx-auto"
        >
          <Trophy className="w-3 h-3" /> Back to Challenges & Social Hubs
        </button>
      </div>
    </div>
  );
}
