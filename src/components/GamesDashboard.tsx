import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Plus,
  Bot,
  Castle,
  RefreshCw,
  Send,
  Users,
  Clock,
  CheckCircle2,
  X,
  Share2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api, GameItem } from "../lib/api";

interface GamesDashboardProps {
  nickname: string;
  onNavigateToView?: (view: string) => void;
}

interface Phrase {
  answer: string;
  hints: [string, string, string];
}

const PHRASES: Phrase[] = [
  {
    answer: "Northern Lights",
    hints: [
      "A natural light show painted across the night sky.",
      "Best witnessed near the Earth's polar regions.",
      "Caused by charged solar particles colliding with our atmosphere.",
    ],
  },
  {
    answer: "Lunar Eclipse",
    hints: [
      "The sky dims during this celestial event.",
      "Earth sits directly between the Sun and the Moon.",
      "The Moon often glows a deep coppery red.",
    ],
  },
  {
    answer: "Comet",
    hints: [
      "A traveler from the cold edges of the Solar System.",
      "It grows a glowing tail as it nears the Sun.",
      "Halley's is the most famous example.",
    ],
  },
  {
    answer: "Milky Way",
    hints: [
      "The spiral galaxy we call home.",
      "A pale band of countless stars across the dark night.",
      "Best seen far from light pollution.",
    ],
  },
  {
    answer: "Supermoon",
    hints: [
      "When the Moon is at its closest perigee approach to Earth.",
      "It appears up to 14% larger than an apogee micromoon.",
      "Coincides with a full or new moon phase.",
    ],
  },
];

const INITIAL_PIECES = [
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

export default function GamesDashboard({ nickname, onNavigateToView }: GamesDashboardProps) {
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);

  // Host modal state
  const [showHostModal, setShowHostModal] = useState(false);
  const [hostTitle, setHostTitle] = useState("");
  const [hostDesc, setHostDesc] = useState("");
  const [hostType, setHostType] = useState<"phrase-guess" | "chess">("phrase-guess");
  const [hostMessage, setHostMessage] = useState<string | null>(null);

  // Phrase guesser gameplay state
  const [phrase, setPhrase] = useState<Phrase>(() => PHRASES[0]);
  const [hintsShown, setHintsShown] = useState(1);
  const [guess, setGuess] = useState("");
  const [guessResult, setGuessResult] = useState<"correct" | "incorrect" | null>(null);

  // Chess gameplay state
  const [chessBoard, setChessBoard] = useState<string[][]>(() =>
    INITIAL_PIECES.map((r) => r.split(""))
  );
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // Tribe invite feedback
  const [invitedGameId, setInvitedGameId] = useState<string | null>(null);

  const loadGames = async () => {
    try {
      const data = await api.games();
      setGames(data);
    } catch (err) {
      console.warn("Could not load games:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  // Host new game (created with status: 'pending' per §7)
  const handleHostGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostTitle.trim()) return;

    try {
      const res = await api.postGame({
        title: hostTitle.trim(),
        description: hostDesc.trim(),
        gameType: hostType,
        hostNickname: nickname || "Anonymous",
      });

      setGames((prev) => [res.game, ...prev]);
      setHostMessage(
        "Your game has been submitted for review. It will appear in the public list once approved."
      );
      setTimeout(() => {
        setShowHostModal(false);
        setHostMessage(null);
        setHostTitle("");
        setHostDesc("");
      }, 2500);
    } catch (err) {
      console.warn("Host game error:", err);
    }
  };

  // Join game session
  const handleJoinGame = async (game: GameItem) => {
    try {
      await api.joinGame(game.id, nickname || "Stargazer");
      setActiveGame(game);
      if (game.gameType === "phrase-guess") {
        setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
        setHintsShown(1);
        setGuess("");
        setGuessResult(null);
      } else {
        setChessBoard(INITIAL_PIECES.map((r) => r.split("")));
        setSelectedSquare(null);
        setMoveHistory([]);
      }
    } catch (err) {
      console.warn("Join game error:", err);
      setActiveGame(game);
    }
  };

  // Play with tribe: shares game invite to tribe chat (§7)
  const handlePlayWithTribe = async (game: GameItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.postTribeMessage({
        nickname: nickname || "Stargazer",
        text: `🎮 Let's play "${game.title}" (${game.gameType === "chess" ? "Deep Space Chess" : "Cosmic Word Quest"})! Join session: #${game.id}`,
      });
      setInvitedGameId(game.id);
      setTimeout(() => setInvitedGameId(null), 3000);
    } catch (err) {
      console.warn("Invite to tribe failed:", err);
    }
  };

  // Phrase guesser actions
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    if (guess.trim().toLowerCase() === phrase.answer.toLowerCase()) {
      setGuessResult("correct");
    } else {
      setGuessResult("incorrect");
    }
  };

  const nextPhrase = () => {
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    setHintsShown(1);
    setGuess("");
    setGuessResult(null);
  };

  // Chess actions
  const handleSquareClick = (r: number, c: number) => {
    if (!selectedSquare) {
      const piece = chessBoard[r][c];
      if (piece && piece !== " ") {
        setSelectedSquare({ r, c });
      }
      return;
    }

    const movingPiece = chessBoard[selectedSquare.r][selectedSquare.c];
    const targetPiece = chessBoard[r][c];

    if (targetPiece !== " ") {
      const movingWhite = isWhitePiece(movingPiece);
      const targetWhite = isWhitePiece(targetPiece);
      if (movingWhite && targetWhite) {
        setSelectedSquare({ r, c });
        return;
      }
    }

    const next = chessBoard.map((row) => [...row]);
    next[r][c] = movingPiece;
    next[selectedSquare.r][selectedSquare.c] = " ";
    setChessBoard(next);
    setMoveHistory((prev) => [
      ...prev,
      `${movingPiece} to (${r},${c})`,
    ]);
    setSelectedSquare(null);
  };

  const pieceLabel: Record<string, string> = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c0d16]/80 backdrop-blur-md p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-turquoise" />
            Celestial Games &amp; Tactics
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Play astronomical phrase-guessing puzzles or friendly chess under the night sky.
          </p>
        </div>

        <button
          onClick={() => setShowHostModal(true)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <Plus className="w-4 h-4" />
          Host a Game
        </button>
      </div>

      {/* ACTIVE GAME SESSION VIEW */}
      {activeGame && (
        <div className="rounded-2xl border border-turquoise-500/40 bg-[#0c0d16]/95 backdrop-blur-md p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-turquoise-500/10 border border-turquoise-500/30 flex items-center justify-center text-turquoise">
                {activeGame.gameType === "chess" ? <Castle className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-mono font-bold text-base text-slate-100">
                  {activeGame.title}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Host: {activeGame.hostNickname} &bull; {activeGame.participants.length} player(s)
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveGame(null)}
              className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
              title="Close game session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Phrase Guesser Gameplay */}
          {activeGame.gameType === "phrase-guess" ? (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Astronomical Clues ({hintsShown}/3)
                </span>
                {Array.from({ length: hintsShown }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-200"
                  >
                    <span className="text-turquoise font-bold mr-2">Clue {i + 1}:</span>
                    {phrase.hints[i]}
                  </div>
                ))}
              </div>

              {hintsShown < 3 && guessResult === null && (
                <button
                  onClick={() => setHintsShown((h) => h + 1)}
                  className="text-xs font-mono text-turquoise hover:underline uppercase"
                >
                  + Reveal Next Clue
                </button>
              )}

              {guessResult === null ? (
                <form onSubmit={handleGuessSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Enter your guess..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-slate-100 focus:outline-none focus:border-turquoise-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider"
                  >
                    Submit
                  </button>
                </form>
              ) : (
                <div
                  className={`p-4 rounded-xl border ${
                    guessResult === "correct"
                      ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                      : "border-rose-500/50 bg-rose-950/40 text-rose-300"
                  } font-mono text-xs space-y-2`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {guessResult === "correct" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Correct! The celestial object was &ldquo;{phrase.answer}&rdquo;.
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-rose-400" />
                        Incorrect. The answer was &ldquo;{phrase.answer}&rdquo;.
                      </>
                    )}
                  </div>
                  <button
                    onClick={nextPhrase}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:text-white"
                  >
                    <RefreshCw className="w-3 h-3" /> Next Phrase
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Chess Gameplay */
            <div className="max-w-xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Click a piece, then target square to move.</span>
                <button
                  onClick={() => {
                    setChessBoard(INITIAL_PIECES.map((r) => r.split("")));
                    setSelectedSquare(null);
                    setMoveHistory([]);
                  }}
                  className="hover:text-turquoise flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Board
                </button>
              </div>

              <div className="grid grid-cols-8 gap-0 w-full max-w-[340px] mx-auto border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
                {chessBoard.map((row, r) =>
                  row.map((cell, c) => {
                    const isSel = selectedSquare && selectedSquare.r === r && selectedSquare.c === c;
                    const dark = (r + c) % 2 === 1;
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => handleSquareClick(r, c)}
                        className={`aspect-square flex items-center justify-center text-xl leading-none transition-colors ${
                          isSel
                            ? "bg-turquoise-500 text-slate-950 font-bold"
                            : dark
                            ? "bg-slate-800 text-slate-100"
                            : "bg-slate-300 text-slate-900"
                        }`}
                      >
                        {cell === " " ? "" : pieceLabel[cell] || cell}
                      </button>
                    );
                  })
                )}
              </div>

              {moveHistory.length > 0 && (
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 font-mono text-[11px] text-slate-400">
                  <span className="text-slate-500 block mb-1">Recent moves:</span>
                  <div className="flex flex-wrap gap-2">
                    {moveHistory.slice(-6).map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BROWSE GAMES SECTION (§7) */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
          Browse Active Sessions ({games.length})
        </h3>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            Loading active tables...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => handleJoinGame(game)}
                className="p-5 rounded-2xl border border-slate-800 bg-[#0c0d16]/80 hover:border-turquoise-500/30 transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full border border-turquoise-500/30 text-turquoise text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
                      {game.gameType === "chess" ? <Castle className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      {game.gameType === "chess" ? "Chess Match" : "Phrase Guess"}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        game.status === "approved"
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-950/30"
                          : "border-amber-500/30 text-amber-400 bg-amber-950/30"
                      }`}
                    >
                      {game.status}
                    </span>
                  </div>

                  <h4 className="font-mono font-bold text-sm text-slate-100">
                    {game.title}
                  </h4>

                  {game.description && (
                    <p className="text-xs text-slate-400 font-sans line-clamp-2">
                      {game.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                  <span>Host: {game.hostNickname}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handlePlayWithTribe(game, e)}
                      className="px-3 py-1 rounded-xl border border-slate-700 hover:border-turquoise-500/40 text-slate-300 hover:text-turquoise text-[11px] transition-colors flex items-center gap-1"
                      title="Share game invite into tribe chat"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{invitedGameId === game.id ? "Invited!" : "Play with Tribe"}</span>
                    </button>

                    <button className="px-3 py-1 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-bold text-[11px] uppercase tracking-wider">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HOST A GAME MODAL (§7) */}
      <AnimatePresence>
        {showHostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-4 text-slate-100 font-mono"
            >
              <button
                onClick={() => setShowHostModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Host a New Game Session
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Create a multiplayer room for your tribe and public peers.
                </p>
              </div>

              {hostMessage ? (
                <div className="p-4 rounded-xl border border-turquoise-500/40 bg-turquoise-950/40 text-turquoise text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{hostMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleHostGame} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                      Game Title
                    </label>
                    <input
                      type="text"
                      required
                      value={hostTitle}
                      onChange={(e) => setHostTitle(e.target.value)}
                      placeholder="e.g. Midnight Chess Showdown"
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                      Game Type
                    </label>
                    <select
                      value={hostType}
                      onChange={(e: any) => setHostType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500"
                    >
                      <option value="phrase-guess">Cosmic Word / Phrase Guess</option>
                      <option value="chess">Deep Space Chess</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={hostDesc}
                      onChange={(e) => setHostDesc(e.target.value)}
                      placeholder="Brief rules, time limit, or greeting..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-turquoise-500 font-sans"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 text-[10px] text-slate-400 font-sans">
                    Note: Newly created games start with <span className="text-amber-400">pending</span> approval status.
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowHostModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-turquoise-500 hover:bg-turquoise-400 text-slate-950 font-bold uppercase tracking-wider"
                    >
                      Submit Room
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
