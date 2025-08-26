// Game: Pick the safest settings for each pretend app
// Author: Lexi Ouellette
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons";
import { MdOutlineCameraAlt, MdOutlineVideoChat } from "react-icons/md";
import { HiMiniMicrophone } from "react-icons/hi2";
import { IoLocationOutline, IoMusicalNotesOutline, IoWarningOutline } from "react-icons/io5";
import { IoMdContact, IoMdHeartDislike, IoMdHeart, IoMdCheckmark } from "react-icons/io";
import { TbPhoto } from "react-icons/tb";
import { BsMap } from "react-icons/bs";
import { PiFlashlight } from "react-icons/pi";
import { LuSchool } from "react-icons/lu";
import Swal from "sweetalert2";

// ---- Types ----
export type Permission = "camera" | "microphone" | "location" | "contacts" | "photos";
export type Choice = "deny" | "ask" | "allow";

type AppScenario = {
  id: string;
  name: string;
  icon: IconType; 
  description: string;
  tags: string[];
  mustHave: Permission[];     // permissions core to the app's purpose
  niceToHave?: Permission[];  // optional, better as ASK than ALLOW
  never?: Permission[];    
  image: string;   // should be denied
};

export type PermissionPanicProps = {
  rounds?: number;       // number of apps per game (default 6)
  lives?: number;        // hearts (default 3)
  durationSec?: number;  // per-game timer in seconds; 0 = no timer
  onEnd?: (result: GameResult) => void;
};

export type GameResult = {
  score: number;
  correctApps: number;
  totalApps: number;
  mistakes: Array<{ app: AppScenario; badChoices: Array<{ perm: Permission; choice: Choice; reason: string }> }>;
};

// ---- Catalog ----
const ALL_PERMS: Permission[] = ["camera", "microphone", "location", "contacts", "photos"];

// Pretend apps
const APPS: AppScenario[] = [
  {
    id: "maps",
    name: "Map Explorer",
    icon: BsMap,
    description: "Find places and directions.",
    tags: ["Navigation"],
    mustHave: ["location"],
    niceToHave: [],
    never: ["contacts", "microphone"],
    image: "/images/games/apps/mapApp.png",
  },
  {
    id: "videochat",
    name: "Video Chat Jr.",
    icon: MdOutlineVideoChat,
    description: "Call family and friends safely.",
    tags: ["Communication"],
    mustHave: ["camera", "microphone"],
    niceToHave: [],
    never: ["location", "contacts"],
    image: "/images/games/apps/videoApp.png",
  },
  {
    id: "photofun",
    name: "Photo Fun",
    icon: TbPhoto,
    description: "Take silly selfies with stickers.",
    tags: ["Camera"],
    mustHave: ["camera"],
    niceToHave: ["photos"], 
    never: ["location", "contacts", "microphone"],
    image: "/images/games/apps/cameraApp.png",
  },
  {
    id: "flashlight",
    name: "Super Flashlight",
    icon: PiFlashlight,
    description: "Just turns on the light—nothing else!",
    tags: ["Utility"],
    mustHave: [],
    niceToHave: [],
    never: ["location", "contacts", "microphone", "camera", "photos"],
    image: "/images/games/apps/flashlightApp.png",
  },
  {
    id: "school",
    name: "School Portal",
    icon: LuSchool,
    description: "Homework and teacher messages.",
    tags: ["Education"],
    mustHave: [],
    niceToHave: [],
    never: ["location", "contacts", "microphone", "camera", "photos"],
    image: "/images/games/apps/schoolApp.png",
  },
  {
    id: "music",
    name: "Mega Music",
    icon: IoMusicalNotesOutline,
    description: "Listen to songs and playlists.",
    tags: ["Entertainment"],
    mustHave: [],
    niceToHave: [],
    never: ["location", "contacts", "microphone", "camera"],
    image: "/images/games/apps/musicApp.png",
  },
];

// Shuffle apps
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Permission tips
const permissionTips = [
    'A Firewall is digital wall that filters traffic to keep your device safe.',
    'An antivirus can defend against malware that could be hidden in a download.',
    'A VPN can protect your privacy while exploring the internet.',
    'Encrypted means that the information is written in a secret code.',
    'Use a strong Wi‑Fi passphrase (16+ chars with numbers & symbols).',
    'An email filter can block spam messages.',
    'Access control means only allowed people can view the resource.',
  ];

// ---- Evaluation Logic ----
function evaluate(app: AppScenario, choices: Record<Permission, Choice>) {
  let score = 0;
  const reasons: Array<{ perm: Permission; choice: Choice; reason: string }> = [];

  for (const perm of ALL_PERMS) {
    const c = choices[perm];
    const isMust = app.mustHave.includes(perm);
    const isNever = app.never?.includes(perm) ?? false;
    const isNice = app.niceToHave?.includes(perm) ?? false;

    if (isMust) {
      if (c === "ask") { score += 30; }
      else if (c === "allow") { score += 20; }
      else { score -= 45; reasons.push({ perm, choice: c, reason: "This app needs this to work. Ask a parent at least." }); }
    } else if (isNice) {
      if (c === "ask") { score += 15; }
      else if (c === "allow") { score += 5; }
      else /* deny */ { score += 5; /* minimal is OK */ }
    } else if (isNever) {
      if (c === "deny") { score += 15; }
      else if (c === "ask") { score -= 5; reasons.push({ perm, choice: c, reason: "Safer to deny this—it's not needed." }); }
      else /* allow */ { score -= 35; reasons.push({ perm, choice: c, reason: "Never needed. Allowing this could reveal private info." }); }
    } else {
      // Unnecessary perms (not listed): deny is best
      if (c === "deny") { score += 12; }
      else if (c === "ask") { score += 0; }
      else { score -= 25; reasons.push({ perm, choice: c, reason: "This permission isn't needed for the app's job." }); }
    }
  }

  // Normalize and pass condition
  const maxTheoretical = 30 * app.mustHave.length + 15 * (app.niceToHave?.length || 0) + 12 * (ALL_PERMS.length - app.mustHave.length - (app.niceToHave?.length || 0));
  const percent = Math.max(0, Math.round((score / Math.max(1, maxTheoretical)) * 100));
  const passed = percent >= 70 && reasons.length <= 2; // need 70%+ and <=2 mistakes

  return { score: Math.max(0, score), percent, passed, reasons };
}

// ---- UI helpers ----
const PERM_LABEL: Record<Permission, string> = {
  camera: "Camera",
  microphone: "Microphone",
  location: "Location",
  contacts: "Contacts",
  photos: "Photos",
};

const PERM_ICON: Record<Permission, IconType> = {
  camera: MdOutlineCameraAlt,
  microphone: HiMiniMicrophone,
  location: IoLocationOutline,
  contacts: IoMdContact,
  photos: TbPhoto,
};

const CHOICE_LABEL: Record<Choice, string> = {
  deny: "Deny",
  ask: "Ask Parent",
  allow: "Allow",
};

export default function PermissionPanicGame({
  rounds = 6,
  lives = 3,
  durationSec = 0,
  onEnd,
}: PermissionPanicProps) {
  const deck = useMemo(() => shuffle(APPS).slice(0, Math.min(rounds, APPS.length)), [rounds]);
  const [i, setI] = useState(0);
  const [hp, setHp] = useState(lives);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showApp, setShowApp] = useState(false);

   useEffect(() => {
        showInstructionsOnOpen();
   }, []);
  
  
    const showInstructionsOnOpen = () => {
      Swal.fire({
        title: 'How to Play Permission Panic',
        html: `
        <p style="font-size: 1.2rem;">
            <strong>Goal:</strong> Pick the safest settings for each pretend app.
        </p>
          <ol style="text-align: left; font-size: 1.2rem;">
            <li><strong>For every permission:</strong>(Camera, Microphone, Location, Contacts, Photos), choose:</li>
                <ul>
                  <li><strong>Deny:</strong> the app can't use it (default setting)</li>
                  <li><strong>Ask Parent:</strong> get permission first</li>
                  <li><strong>Allow:</strong> the app can use it</li>
                </ul>
            <li><strong>Submission Decision:</strong> to check your choices.</li>
            <li>If your setup is safe enough, you <strong>pass</strong> that app. If not, you <strong>lose</strong> a heart and see why.</li>
          </ol>
          <p><strong>Helpful Tips:</strong></p>
          <ul style="text-align: left; font-size: 1rem;">
            <li><strong>Hearts = lives:</strong> Run out of hearts and the round ends.</li>
            <li>(Optional)<strong>Timer:</strong> If it’s on, finish before time runs out.</li>
            <li><strong>Score:</strong> Higher for safer, minimal choices. Your score adds up across apps.</li>
            <li><strong>Tip to win:</strong> Give an app <strong>only what it truly needs.</strong> If you’re not sure, choose <strong>Ask Parent.</strong></li>
            <li><strong>Keyboard help:</strong> Use <strong>tab</strong> to move between options and <strong>Space/Enter</strong> to select; or just click the buttons.</li>
            <li><strong>Remember:</strong> Never allow things an app <strong>doesn't need</strong> (like Location for a flashlight). When in doubt, <strong>Ask Parent.</strong></li>
          </ul>
        `,
        icon: 'info',
        confirmButtonText: 'Got it!',
        width: 600
      });
    };

  const [choices, setChoices] = useState<Record<Permission, Choice>>({
    camera: "deny",
    microphone: "deny",
    location: "deny",
    contacts: "deny",
    photos: "deny",
  });
  const [evaluated, setEvaluated] = useState<ReturnType<typeof evaluate> | null>(null);
  const [mistakes, setMistakes] = useState<GameResult["mistakes"]>([]);

  // Timer
  useEffect(() => {
    if (!durationSec || over) return;
    setSecondsLeft(durationSec);
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [durationSec, over]);

  useEffect(() => {
    if (durationSec && secondsLeft <= 0 && !over) finish();
  }, [secondsLeft, durationSec, over]);

  useEffect(() => {
    // Reset choices on new app
    setChoices({ camera: "deny", microphone: "deny", location: "deny", contacts: "deny", photos: "deny" });
    setEvaluated(null);
  }, [i]);

  const app = deck[i];

  function handlePick(perm: Permission, c: Choice) {
    if (evaluated) return; // lock after submit
    setChoices((prev) => ({ ...prev, [perm]: c }));
  }

  function submit() {
    if (!app || evaluated) return;
    const res = evaluate(app, choices);
    setEvaluated(res);

    // Scoring and lives
    const add = Math.round(res.percent);
    setScore((s) => s + add);
    if (!res.passed) {
      setHp((h) => h - 1);
      if (res.reasons.length) {
        setMistakes((m) => [
          ...m,
          {
            app,
            badChoices: res.reasons.map((r) => ({ perm: r.perm, choice: r.choice, reason: r.reason })),
          },
        ]);
      }
    }
  }

  function next() {
    if (i + 1 >= deck.length || hp <= 0) {
      finish();
    } else {
      setI((x) => x + 1);
    }
  }

  function finish() {
    setOver(true);
    const result: GameResult = {
      score,
      correctApps: deck.length - mistakes.length - (evaluated && !evaluated.passed ? 1 : 0),
      totalApps: deck.length,
      mistakes: evaluated && !evaluated.passed ? [...mistakes, { app, badChoices: evaluated.reasons.map((r) => ({ perm: r.perm, choice: r.choice, reason: r.reason })) }] : mistakes,
    };
    onEnd?.(result);
  }

  function showPermissionTips() {
    const randomTips = [...permissionTips]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  
    Swal.fire({
      title: 'Permission Hints',
      html: `
        <ul style="text-align:left; padding-left:1.1rem; line-height:1.5; font-size:.95rem;">
          ${randomTips.map(t => `<li>${t}</li>`).join('')}
        </ul>
        <div style="margin-top:8px; font-size:.9rem; opacity:.85;">
          Pro move: use separate VLANs/SSIDs for IoT vs. personal devices.
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Got it!',
      confirmButtonColor: '#198754',
      width: 560,
      backdrop: 'rgba(0,0,0,.35)',
    });
  }

  // UI bits
  const hearts = Array.from({ length: lives }, (_, idx) => idx < hp);

  // ----- UI -----
  return (
    <div>
        <h4 className="permission-title">Permission Panic</h4>
    <div className="card shadow-sm border-1" style={{ borderRadius: 16, overflow: "hidden" }}>
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="fw-bold">Score: <span className="text-success">{score}</span></div>
            <div className="fw-bold">App: <span className="text-info">{i + 1}</span> / {deck.length}</div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div title="Lives">
              {hearts.map((full, idx) => (
                <span key={idx} style={{ fontSize: 20 }}>
                  {full ? <IoMdHeart aria-label="life" /> : <IoMdHeartDislike aria-label="lost life" />}
                </span>
              ))}
            </div>
            <button className="btn btn-sm btn-info" onClick={() => setShowInstructions(true)}>
                ?
            </button>
            {durationSec > 0 && (
              <span className={`badge ${secondsLeft <= 10 ? "bg-danger" : "bg-secondary"}`}>⏱ {Math.max(0, secondsLeft)}s</span>
            )}
          </div>
        </div>

        {/* App Card */}
        {app && !over && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="row">
                <div className="col-lg">
                    <div className="d-flex align-items-center">
                        <div className="transparent-card hover hover-scale animate__animated animate__fadeInUp">
                            <motion.img
                                src={app.image}
                                alt={app.name}
                                className="img-fluid"
                                style={{ maxHeight: 500, objectFit: 'cover' }}
                                // gentle float animation loop
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                whileHover={{ scale: 1.05, rotate: 0.5 }}
                                onClick={() => setShowApp(true)}
                            />                   
                        </div>
                    </div>
              </div>
              <div className="col-lg-7 me-2">
                {/* Permissions table */}
                <div className="table-responsive">
                    <table className="table align-middle">
                        <thead>
                        <tr>
                            <th>Permission</th>
                            <th className="text-center">Deny</th>
                            <th className="text-center">Ask Parent</th>
                            <th className="text-center">Allow</th>
                        </tr>
                        </thead>
                    <tbody>
                    {ALL_PERMS.map((perm) => (
                        <tr key={perm}>
                        <td className="fw-semibold">
                            <span style={{ fontSize: 25, marginRight: 6 }}>
                            {(() => { const P = PERM_ICON[perm]; return <P aria-hidden />; })()}
                            </span>
                            {PERM_LABEL[perm]}
                        </td>
                        {(["deny", "ask", "allow"] as Choice[]).map((c) => (
                            <td key={c} className="text-center">
                            <div className="btn-group" role="group" aria-label={`Choose ${perm}`}>
                                <input
                                type="radio"
                                className="btn-check"
                                name={`perm-${perm}`}
                                id={`perm-${perm}-${c}`}
                                autoComplete="off"
                                checked={choices[perm] === c}
                                onChange={() => handlePick(perm, c)}
                                disabled={!!evaluated}
                                />
                                <label className={`btn btn-sm ${c === "deny" ? "btn-outline-danger" : c === "ask" ? "btn-outline-warning" : "btn-outline-success"}`} htmlFor={`perm-${perm}-${c}`}>
                                {CHOICE_LABEL[c]}
                                </label>
                            </div>
                            </td>
                        ))}
                        </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                </div>
                {/* Controls */}
                <div className="row"> 
                <div className="col-sm-7">
                    <details className="ms-auto">
                        <summary className="text">Hint</summary>
                        <div className="small text-muted">
                        Give only what the app truly needs. When unsure, choose <strong>Ask Parent</strong> instead of Allow.
                        </div>
                    </details>
                    </div>
                    <div className="col-lg-4 align-self-end">
                    <div className="d-flex flex-wrap gap-4 mt-1">
                    {!evaluated ? (
                        <button className="btn btn-primary btn-lg" onClick={submit}>
                        Submit Decision
                        </button>
                    ) : (
                        <button className="btn btn-success btn-lg" onClick={next}>
                        Next App
                        </button>
                    )}
                    </div>

                    </div>
                </div>
            </div>

                 {showApp && (
                    <div className="modal fade show d-block" role="dialog">
                    <div className="modal-dialog" role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <button type="button" className="btn-close" onClick={() => setShowApp(false)}></button>
                        </div>
                        <div className="modal-body">
                        <div className="d-flex align-items-center gap-3">
                            <div style={{ fontSize: 32 }}>
                                {(() => { const Icon = app.icon; return <Icon aria-hidden />; })()}
                            </div>
                            <div>
                                <div className="h5 mb-0">{app.name}</div>
                                <div className="text small mt-1 mb-1">{app.description}</div>
                                <div className="mt-1">
                                {app.tags.map((t) => (
                                    <span key={t} className="badge bg-info text-dark me-1">{t}</span>
                                ))}
                                </div>
                            </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={() => setShowApp(false)}>
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                 )}

        {showInstructions && (
        <div className="modal fade show d-block" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Permission Panic</h5>
                <button type="button" className="btn-close" onClick={() => setShowInstructions(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>How to Play:</strong></p>
                <ul>
                  <li><strong>Goal:</strong> Pick the safest settings for each pretend app.</li>
                  <li><strong>For every permission:</strong>(Camera, Microphone, Location, Contacts, Photos), choose:</li>
                    <ul>
                      <li><strong>Deny:</strong> the app can't use it (default setting)</li>
                      <li><strong>Ask Parent:</strong> get permission first</li>
                      <li><strong>Allow:</strong> the app can use it</li>
                    </ul>
                  <li><strong>Tip to win:</strong>Give an app <strong>only what it truly needs.</strong> If you’re not sure, choose <strong>Ask Parent.</strong></li>
                  <li><strong>Submission Decision:</strong> to check your choices.</li>
                  <li>If your setup is safe enough, you <strong>pass</strong> that app. If not, you <strong>lose</strong> a heart and see why.</li>
                  <li><strong>Hearts = lives:</strong> Run out of hearts and the round ends.</li>
                  <li>(Optional)<strong>Timer:</strong> If it’s on, finish before time runs out.</li>
                  <li><strong>Score:</strong> Higher for safer, minimal choices. Your score adds up across apps.</li>
                  <li><strong>Icons you'll see:</strong> Pick the safest settings for each pretend app.</li>
                    <ul>
                        <li><strong><IoMdHeart /></strong> life left</li>
                        <li><strong><IoMdHeartDislike /></strong> life lost</li>
                        <li><strong><IoMdCheckmark /></strong> safe enough</li>
                        <li><strong>< IoWarningOutline /></strong> needs change</li>
                      </ul>
                    <li><strong>Keyboard help:</strong> Use <strong>tab</strong> to move between options and <strong>Space/Enter</strong> to select; or just click the buttons.</li>
                    <li><strong>Remember:</strong> Never allow things an app <strong>doesn't need</strong> (like Location for a flashlight). When in doubt, <strong>Ask Parent.</strong></li>
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

            {/* Evaluation panel */}
            <AnimatePresence>{evaluated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="alert mt-3"
                style={{ background: evaluated.passed ? "#e7fff2" : "#fff2f0", border: "1px solid #d6e9c6" }}
              >
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <div className="fw-bold mb-1">{evaluated.passed ? "Nice job!" : "Let's make that safer."}</div>
                    <div>Score for this app: <strong>{evaluated.percent}</strong></div>
                  </div>
                  <div className="text-nowrap">
                    {evaluated.passed ? (<><IoMdCheckmark aria-hidden /> Safe enough</>) : (<><IoWarningOutline aria-hidden /> Needs changes</>)}
                  </div>
                </div>
                {evaluated.reasons.length > 0 && (
                  <ul className="mt-2 mb-0">
                    {evaluated.reasons.map((r, idx) => (
                      <li key={r.perm + idx}><strong>{PERM_LABEL[r.perm]}:</strong> {r.reason}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}</AnimatePresence>
          </motion.div>
        )}

        {/* Game Over */}
        {over && (
          <div className="text-center py-4">
            <h3 className="mb-2">Round Complete!</h3>
            <p className="mb-1">Total Score: <strong>{score}</strong></p>
            <p className="mb-3">Apps Completed: <strong>{deck.length}</strong></p>

            {mistakes.length > 0 && (
              <div className="text-start mx-auto" style={{ maxWidth: 760 }}>
                <h5 className="mt-3">Learn from these:</h5>
                <ul className="list-group">
                  {mistakes.map((m, idx) => (
                    <li key={m.app.id + idx} className="list-group-item">
                      <div className="fw-bold">{(() => { const Icon = m.app.icon; return <Icon aria-hidden />; })()} {m.app.name}</div>
                      <ul className="mb-0 mt-1">
                        {m.badChoices.map((b, j) => (
                          <li key={b.perm + j}><strong>{PERM_LABEL[b.perm]}</strong>: {b.reason}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="d-flex justify-content-center gap-2 mt-4">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>Play Again</button>
              <a className="btn btn-outline-secondary" href="/educators">Educator Resources</a>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
