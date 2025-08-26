"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoFlashlightOutline } from "react-icons/io5";
import { GoShieldX } from "react-icons/go";
import { LuMailCheck } from "react-icons/lu";
import { IoMdHeart } from "react-icons/io";
import { IoMdHeartDislike } from "react-icons/io";
import Swal from "sweetalert2";

export type Scenario = {
  id: string;
  text: string;
  tags: string[]; 
  recommended: "share" | "shield";
  explanation: string;
  risk?: "low" | "med" | "high"; 
};

export type GameResult = {
  score: number;
  correct: number;
  total: number;
  mistakes: Array<{ scenario: Scenario; chosen: "share" | "shield" }>; 
};

export type PrivacyProtectorGameProps = {
  totalQuestions?: number; // default 10
  durationSec?: number; // 0 = no timer
  lives?: number; // default 3
  torchCharges?: number; // default 3
  onCorrect?: (scenario: Scenario) => void;
  onIncorrect?: (scenario: Scenario) => void;
  onEnd?: (result: GameResult) => void;
};

// --- Scenario Catalog (customize freely) ---
const SCENARIOS: Scenario[] = [
  {
    id: "pp1",
    text: "A new online friend asks for your home address to send a gift.",
    tags: ["New Friend", "Chat App"],
    recommended: "shield",
    explanation: "Never share your home address with people you only know online.",
    risk: "high",
  },
  {
    id: "pp2",
    text: "Your parent asks for your teacher's email so they can message them.",
    tags: ["Parent", "At Home"],
    recommended: "share",
    explanation: "Sharing a teacher's public school email with a parent is okay.",
    risk: "low",
  },
  {
    id: "pp3",
    text: "A game website pop-up asks for your full name and birthdate to claim a prize.",
    tags: ["Website", "Pop-up"],
    recommended: "shield",
    explanation: "Pop-ups asking for personal info are risky, close it and tell an adult.",
    risk: "high",
  },
  {
    id: "pp4",
    text: "Your teacher on the school portal asks you to type only your first name for attendance.",
    tags: ["Teacher", "School Portal"],
    recommended: "share",
    explanation: "First name only, requested by a teacher in a school tool, is okay.",
    risk: "low",
  },
  {
    id: "pp5",
    text: "An app wants to use your camera and location to create a profile.",
    tags: ["App Permissions"],
    recommended: "shield",
    explanation: "Location + camera access should be decided by a parent/guardian.",
    risk: "high",
  },
  {
    id: "pp6",
    text: "Grandma texts asking for the link to your class website.",
    tags: ["Family", "Text"],
    recommended: "share",
    explanation: "Sharing a public class website with family is fine.",
    risk: "low",
  },
  {
    id: "pp7",
    text: "A stranger DMs you asking for a selfie to prove you're real.",
    tags: ["Stranger", "DM"],
    recommended: "shield",
    explanation: "Don't send photos to strangers online.",
    risk: "high",
  },
  {
    id: "pp8",
    text: "Your parent asks you to send a picture of your homework to the family chat.",
    tags: ["Parent", "Family Chat"],
    recommended: "share",
    explanation: "Sharing homework in a private family chat is okay.",
    risk: "low",
  },
  {
    id: "pp9",
    text: "A quiz site asks for your school password to see your grades.",
    tags: ["Website", "Third-Party"],
    recommended: "shield",
    explanation: "Never share passwords with websites or people. Only log in on the official school site.",
    risk: "high",
  },
  {
    id: "pp10",
    text: "Your teacher asks for your first name and last initial for a class list.",
    tags: ["Teacher", "Classroom"],
    recommended: "share",
    explanation: "Teacher-approved, minimal info, and for class use.",
    risk: "low",
  },
  {
    id: "pp11",
    text: "An unknown number texts asking for your parents' phone numbers.",
    tags: ["Unknown", "Text"],
    recommended: "shield",
    explanation: "Don't share contact info with unknown numbers, show a trusted adult.",
    risk: "med",
  },
  {
    id: "pp12",
    text: "A game asks to show your username on the leaderboard.",
    tags: ["Game", "Leaderboard"],
    recommended: "share",
    explanation: "Using a safe, non-real-name username is okay.",
    risk: "low",
  },
  {
    id: "pp13",
    text: "A survey promises coins if you enter your full name and address.",
    tags: ["Survey", "Rewards"],
    recommended: "shield",
    explanation: "Rewards-for-data can be a trick, don't enter personal info.",
    risk: "high",
  },
  {
    id: "pp14",
    text: "Your school portal asks a parent to sign a permission form with their email.",
    tags: ["School Portal", "Parent Email"],
    recommended: "share",
    explanation: "Parent email for official permission in a school tool is okay.",
    risk: "low",
  },
  {
    id: "pp15",
    text: "A livestream chat asks where you go to school.",
    tags: ["Livestream", "Public"],
    recommended: "shield",
    explanation: "Never share your school name in a public chat.",
    risk: "high",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PrivacyProtectorGame({
  totalQuestions = 10,
  durationSec = 0,
  lives = 3,
  torchCharges = 3,
  onCorrect,
  onIncorrect,
  onEnd,
}: PrivacyProtectorGameProps) {
  const deck = useMemo(() => shuffle(SCENARIOS).slice(0, Math.min(totalQuestions, SCENARIOS.length)), [totalQuestions]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hp, setHp] = useState(lives);
  const [torches, setTorches] = useState(torchCharges);
  const [usedHint, setUsedHint] = useState(false);
  const [over, setOver] = useState(false);
  const [mistakes, setMistakes] = useState<Array<{ scenario: Scenario; chosen: "share" | "shield" }>>([]);
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const [feedback, setFeedback] = useState<null | { correct: boolean; chosen: "share" | "shield" }>(null);
  const [showInstructions, setShowInstructions] = useState(false);

      useEffect(() => {
        showInstructionsOnOpen();
      }, []);
    
    
      const showInstructionsOnOpen = () => {
        Swal.fire({
          title: 'How to Play Privacy Protector',
          html: `
          <p style="font-size: 1.2rem;">
              <strong>Goal:</strong> Keep private information safe.
          </p>
            <ul style="text-align: left; font-size: 1.2rem;">
                <li><strong>Read the card:</strong> and decide if you should <strong>Keep Private</strong> or <strong>Share</strong>.</li>
                <li><strong>Use a Hint (flashlight)</strong> if you’re not sure.</li>
                <li>Click <strong>Next</strong> to go to the following card.</li>
                <li>If your setup is safe enough, you <strong>pass</strong> that app. If not, you <strong>lose</strong> a heart and see why.</li>
                <li><strong>Hearts = lives:</strong> Run out of hearts and the round ends.</li>
                <li>(Optional)<strong>Timer:</strong> If it’s on, finish before time runs out.</li>
                <li><strong>Score & streak:</strong> Safer choices and streaks earn more points.</li>
                <li><strong>Hearts = lives:</strong> Wrong answers lose a heart.</li>
                <li><strong>Keyboard help:</strong></li>
                    <ul>
                        <li><strong>←</strong> = Keep Private</li>
                        <li><strong>→</strong> = Share</li>
                        <li><strong>H</strong> = Hint</li>
                        <li><strong>Enter</strong> = Next</li>
                    </ul>
                <li><strong>Remember:</strong> Only share what’s needed. When in doubt, <strong>Ask a Parent.</strong></li>
            </ul>
          `,
          icon: 'info',
          confirmButtonText: 'Got it!',
          width: 600
        });
      };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (!durationSec || over) return;
    setSecondsLeft(durationSec);
    timerRef.current && clearInterval(timerRef.current as any);
    timerRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => { timerRef.current && clearInterval(timerRef.current as any); };
  }, [durationSec, over]);

  useEffect(() => {
    if (durationSec && secondsLeft <= 0 && !over) {
      endGame();
    }
  }, [secondsLeft, durationSec, over]);

  const current = deck[index];

  function endGame() {
    setOver(true);
    const result: GameResult = {
      score,
      correct: index - mistakes.length,
      total: deck.length,
      mistakes,
    };
    onEnd?.(result);
  }

  function nextCard() {
    setUsedHint(false);
    setFeedback(null);
    if (index + 1 >= deck.length || hp <= 0) {
      endGame();
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleAction(choice: "share" | "shield") {
    if (!current || over || feedback) return;
    const correct = choice === current.recommended;
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const base = 100;
      const bonus = Math.min(newStreak * 10, 50); // combo bonus up to +50
      const hintPenalty = usedHint ? 25 : 0;
      const gained = Math.max(0, base + bonus - hintPenalty);
      setScore((s) => s + gained);
      onCorrect?.(current);
    } else {
      setStreak(0);
      setHp((h) => h - 1);
      setMistakes((m) => [...m, { scenario: current, chosen: choice }]);
      onIncorrect?.(current);
    }
    // NEW: show feedback panel instead of auto-advancing
    setFeedback({ correct, chosen: choice });
  }

  function useTorch() {
    if (torches <= 0 || usedHint || over) return;
    setTorches((t) => t - 1);
    setUsedHint(true);
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (over) {
        if (e.key === "Enter") restart();
        return;
      }
      if (feedback) {
        if (e.key === "Enter" || e.key === " ") nextCard();
        return;
      }
      if (e.key === "ArrowLeft") handleAction("shield");
      if (e.key === "ArrowRight") handleAction("share");
      if (e.key.toLowerCase() === "h") useTorch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [over, current, usedHint, torches, streak, feedback]);

  function restart() {
    setIndex(0);
    setScore(0);
    setStreak(0);
    setHp(lives);
    setTorches(torchCharges);
    setUsedHint(false);
    setOver(false);
    setMistakes([]);
    setSecondsLeft(durationSec);
    setFeedback(null);
  }

  // UI helpers
  const hearts = Array.from({ length: lives }, (_, i) => i < hp);

  return (
    <div>
        <h4 className="permission-title">Privacy Protector</h4>
    <div className="pp-game card shadow-sm border-1">
      <div className="card-body">
        {/* Top Bar */}
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="fw-bold">Score: <span className="text-success">{score}</span></div>
            <div className="fw-bold">Streak: <span className="text-info">{streak}</span></div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div aria-label="Lives" title="Lives">
              {hearts.map((full, i) => (
                <span key={i} style={{ fontSize: 20 }}>{full ? <IoMdHeart /> : <IoMdHeartDislike />}</span>
              ))}
            </div>
            <button className="btn btn-sm btn-warning" onClick={useTorch} disabled={usedHint || torches <= 0 || over}>
              <IoFlashlightOutline /> Hints ({torches})
            </button>
            <button className="btn btn-sm btn-info" onClick={() => setShowInstructions(true)}>
                ?
            </button>
            {durationSec > 0 && (
              <span className={`badge ${secondsLeft <= 10 ? "bg-danger" : "bg-secondary"}`}>⏱ {Math.max(0, secondsLeft)}s</span>
            )}
          </div>
        </div>

        {/* Card Area */}
        {!over && current && (
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.22 }}
              className="p-3 rounded"
              style={{ background: "#0d1b2a", color: "#fff" }}
            >
              <div className="d-flex flex-wrap gap-2 mb-2">
                {current.tags.map((t) => (
                  <span key={t} className="badge bg-info text-dark">{t}</span>
                ))}
                {current.risk && (
                  <span className={`badge ${
                      current.risk === "high" ? "bg-danger" : current.risk === "med" ? "bg-warning text-dark" : "bg-success"
                    }`}>
                    {current.risk.toUpperCase()} RISK
                  </span>
                )}
              </div>
              <p className="fs-5 mb-3">{current.text}</p>

              {/* Hint panel */}
              <AnimatePresence>
                {usedHint && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="alert alert-warning mb-3"
                  >
                    <strong>Hint:</strong> Think about <em>who</em> is asking, <em>where</em> they are asking, and whether the info is <em>personal</em> (address, password, birthdate, school name, phone number).
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-danger btn-lg" onClick={() => handleAction("shield")} disabled={!!feedback}>
                  <GoShieldX /> Keep Private
                </button>
                <button className="btn btn-success btn-lg" onClick={() => handleAction("share")} disabled={!!feedback}>
                  <LuMailCheck /> Share
                </button>
              </div>

              {/* NEW: Per-question feedback panel */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`alert mt-3 ${feedback.correct ? "alert-success" : "alert-danger"}`}
                  >
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <div className="fw-bold mb-1">{feedback.correct ? "Great choice!" : "Not quite—here's why:"}</div>
                        <div className="small">
                          You chose: <span className={`badge ${feedback.chosen === "share" ? "bg-success" : "bg-danger"}`}>{feedback.chosen.toUpperCase()}</span>
                          {" "}• Recommended: <span className={`badge ${current.recommended === "share" ? "bg-success" : "bg-danger"}`}>{current.recommended.toUpperCase()}</span>
                        </div>
                      </div>
                      <button className="btn btn-primary" onClick={nextCard}>Next</button>
                    </div>
                    <div className="mt-2">{current.explanation}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        )}

            {showInstructions && (
                <div className="modal fade show d-block" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Privacy Protector</h5>
                        <button type="button" className="btn-close" onClick={() => setShowInstructions(false)}></button>
                      </div>
                      <div className="modal-body">
                        <p><strong>How to Play:</strong></p>
                        <ul>
                          <li><strong>Goal:</strong> Keep private info safe.</li>
                          <li><strong>Read the card:</strong> and decide if you should <strong>Keep Private</strong> or <strong>Share</strong>.</li>
                          <li><strong>Use a Hint (flashlight)</strong> if you’re not sure.</li>
                          <li>Click <strong>Next</strong> to go to the following card.</li>
                          <li>If your setup is safe enough, you <strong>pass</strong> that app. If not, you <strong>lose</strong> a heart and see why.</li>
                          <li><strong>Hearts = lives:</strong> Run out of hearts and the round ends.</li>
                          <li>(Optional)<strong>Timer:</strong> If it’s on, finish before time runs out.</li>
                          <li><strong>Score & streak:</strong> Safer choices and streaks earn more points.</li>
                          <li><strong>Hearts = lives:</strong> Wrong answers lose a heart.</li>
                            <ul>
                                <li><strong><IoMdHeart /></strong> life left</li>
                                <li><strong><IoMdHeartDislike /></strong> life lost</li>
                              </ul>
                            <li><strong>Keyboard help:</strong></li>
                                <ul>
                                    <li><strong>←</strong> = Keep Private</li>
                                    <li><strong>→</strong> = Share</li>
                                    <li><strong>H</strong> = Hint</li>
                                    <li><strong>Enter</strong> = Next</li>
                                </ul>
                            <li><strong>Remember:</strong> Only share what’s needed. When in doubt, <strong>Ask a Parent.</strong></li>
                        </ul>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowInstructions(false)}>
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
        

        {/* Footer: Progress */}
        {!over && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted">Question {index + 1} / {deck.length}</div>
            <div className="form-text">Keys: ← Shield • → Share • H Hint {feedback ? "• Enter Next" : ""}</div>
          </div>
        )}

        {/* Game Over Summary */}
        {over && (
          <div className="text-center py-4">
            <h3 className="mb-2">Round Complete!</h3>
            <p className="mb-1">Score: <strong>{score}</strong></p>
            <p className="mb-3">Correct: <strong>{deck.length - mistakes.length}</strong> / {deck.length}</p>

            {mistakes.length > 0 && (
              <div className="text-start mx-auto" style={{ maxWidth: 720 }}>
                <h5 className="mt-3">Learn from these:</h5>
                <ul className="list-group">
                  {mistakes.map(({ scenario, chosen }, i) => (
                    <li key={scenario.id + i} className="list-group-item">
                      <div className="fw-bold mb-1">{scenario.text}</div>
                      <div className="mb-1">
                        You chose: <span className={`badge ${chosen === "share" ? "bg-success" : "bg-danger"}`}>{chosen.toUpperCase()}</span>
                        {" "} • Correct: <span className={`badge ${scenario.recommended === "share" ? "bg-success" : "bg-danger"}`}>{scenario.recommended.toUpperCase()}</span>
                      </div>
                      <div className="text-muted">{scenario.explanation}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="d-flex justify-content-center gap-2 mt-4">
              <button className="btn btn-primary" onClick={restart}>Play Again</button>
              <a className="btn btn-outline-secondary" href="/educators">Educator Resources</a>
            </div>
          </div>
        )}
      </div>

      {/* Minimal styling to blend with Bootstrap */}
      <style jsx>{`
        .pp-game { border-radius: 16px; overflow: hidden; }
      `}</style>
    </div>
    </div>
  );
}
