// Hook the phish game 
// Created by Lexi Ouellette 
"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

// ---------- Image helpers ----------
function useImage(src: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const i = new Image();
    i.src = src;
    i.onload = () => setImg(i);
  }, [src]);
  return img;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number
) {
  const iw = img.width, ih = img.height;
  const scale = Math.max(dw / iw, dh / ih);
  const w = iw * scale, h = ih * scale;
  const x = dx + (dw - w) / 2;
  const y = dy + (dh - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

// ---------- Types ----------
type ItemKind = "bad" | "good";
type LabeledItem = { label: string; kind: ItemKind };
type HardLevel = 1 | 2 | 3;

// Fish 
type Fish = {
  id: number;
  x: number;
  y: number;
  speed: number;
  dir: 1 | -1;

  // Easy mode
  label?: string;
  kind?: ItemKind;

  // Hard mode
  sender?: LabeledItem; 
  hook?: LabeledItem;   

  width: number;
  height: number;
  active: boolean;
};

// ---------- Constants ----------
const CANVAS_BASE_W = 900;
const CANVAS_BASE_H = 600;
const WATERLINE_Y = 120;

// Boat sizing + sit depth
const BOAT_W = 350;
const BOAT_H = 290;
const BOAT_SIT = 160;

// Simple-mode pools
const BAD_ITEMS = ["Fake Prize", "Urgent Reset", "Unknown Sender", "Suspicious Link", "Phishy Popup", "Crypto Giveaway"];
const GOOD_ITEMS = ["Teacher Email", "School Update", "Family Message", "Receipt (Known)", "Homework Note"];

// Hard-mode pools
const BAD_SENDERS = [
  "support@prize-claim.win",
  "it-helpdesk-reset@outlook-mail.io",
  "bank-alerts@secure-verify.co",
  "unknown@random-domain.biz",
  "admin@account-verify.center",
  "support@account-verify.center",
  "help@gamez.net",
];
const GOOD_SENDERS = [
  "teacher@school.edu",
  "principal@school.edu",
  "registrar@school.edu",
  "advisor@school.edu",
  "coach@school.edu",
  "noreply@bank.edu",
  "noreply@store.com",
];
const BAD_HOOKS = [
  "Urgent password reset",
  "Click to claim prize",
  "Crypto airdrop link",
  "Verify account now",
  "Attachment: invoice.zip",
  "Account Overdue Pay Now",
  "Congrats You've Won!",
];
const GOOD_HOOKS = [
  "Syllabus PDF",
  "Field trip form",
  "Club meeting agenda",
  "Homework reminder",
  "Permission slip",
  "Reciept",
  "Order Confirmation",
];

// ---------- Utilities ----------
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
// function to grab the fish
function intersects(hx: number, hy: number, fish: Fish) {
  const hookSize = 20;
  return (
    hx < fish.x + fish.width &&
    hx + hookSize > fish.x &&
    hy < fish.y + fish.height &&
    hy + hookSize > fish.y
  );
}

// Rounded tag (always LTR)
function drawTag(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, isBad: boolean) {
  ctx.save();
  ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  const padX = 8;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 22;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.fillStyle = isBad ? "#7a1010" : "#0e5a2b";
  ctx.beginPath();
  const r = 8;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.fillText(text, x + padX, y + h - 7);
  ctx.restore();
}

function levelTitle(level: HardLevel) {
  return level === 1 ? "Level 1 — Identify Bad Senders"
       : level === 2 ? "Level 2 — Identify Bad Hooks"
       : "Level 3 — Identify Both";
}

function levelRuleLine(level: HardLevel) {
  return level === 1
    ? "Top label shows the sender. Catch only bad senders."
    : level === 2
    ? "Bottom label shows the hook. Catch only bad hooks."
    : "Top = sender, bottom = hook. Catch bad items; avoid good ones.";
}

// ---------- Component ----------
export default function HookThePhishHard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false); // game play state
  const [showHowTo, setShowHowTo] = useState(true); // show game instructions

  const [score, setScore] = useState(0);          // round score
  const [totalScore, setTotalScore] = useState(0); // cumulative across rounds
  const [finished, setFinished] = useState(false); // finished state

  const [spawnedCount, setSpawnedCount] = useState(0); // number of fish count
  const [caughtGood, setCaughtGood] = useState<string[]>([]); // number of good fish caught
  const [caughtBad, setCaughtBad] = useState<string[]>([]); // number of bad fish caught
  const [showInstructions, setShowInstructions] = useState(false); // show game instructions
  const [showTips, setShowTips] = useState(false); // show phishing tips

  // Hard mode
  const [hardMode, setHardMode] = useState<boolean>(true); // hard mode state
  const [hardLevel, setHardLevel] = useState<HardLevel>(1); // hard level number

  // Rod + hook
  const [rodX, setRodX] = useState(CANVAS_BASE_W / 2); // rod size
  const [lowering, setLowering] = useState(false); // rod state
  const [hookDepth, setHookDepth] = useState(0); // hook depth 

  // Responsive
  const [dpr, setDpr] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ w: CANVAS_BASE_W, h: CANVAS_BASE_H });

  // Fish state
  const fishRef = useRef<Fish[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const activeCountRef = useRef<number>(0);

  // Per-round target spawns (harder levels -> more)
  const roundSpawnTargetRef = useRef<number>(getSpawnTarget(hardMode, hardLevel));
  useEffect(() => { roundSpawnTargetRef.current = getSpawnTarget(hardMode, hardLevel); }, [hardMode, hardLevel]);

  // Images
  const oceanImg = useImage("/images/games/htp/ocean.png");
  const boatImg = useImage("/images/games/htp/PPboat1.png");
  const fishGoodImg = useImage("/images/games/htp/cyberfish2.png");
  const fishBadImg = useImage("/images/games/htp/cyberfish3.png");

  // Responsive canvas
  const fitCanvas = useCallback(() => {
    const wrapperWidth = Math.min(window.innerWidth - 24, CANVAS_BASE_W);
    const scale = wrapperWidth / CANVAS_BASE_W;
    const w = Math.floor(CANVAS_BASE_W * scale);
    const h = Math.floor(CANVAS_BASE_H * scale);
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    setCanvasSize({ w, h });
    setDpr(nextDpr);
    const c = canvasRef.current;
    if (c) {
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.width = Math.floor(w * nextDpr);
      c.height = Math.floor(h * nextDpr);
    }
  }, []);
  
  useEffect(() => {
    fitCanvas();
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, [fitCanvas]);

  // Input (mouse + touch)
  useEffect(() => {
    const onMove = (clientX: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clientX - rect.left;
      setRodX((x / rect.width) * CANVAS_BASE_W);
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0]) onMove(e.touches[0].clientX); };
    const onDown = () => setLowering(true);
    const onUp = () => setLowering(false);

    const c = canvasRef.current;
    if (!c) return;
    c.addEventListener("mousemove", onMouseMove);
    c.addEventListener("touchmove", onTouchMove, { passive: true });
    c.addEventListener("mousedown", onDown);
    c.addEventListener("mouseup", onUp);
    c.addEventListener("mouseleave", onUp);
    c.addEventListener("touchstart", onDown, { passive: true });
    c.addEventListener("touchend", onUp);
    return () => {
      c.removeEventListener("mousemove", onMouseMove);
      c.removeEventListener("touchmove", onTouchMove);
      c.removeEventListener("mousedown", onDown);
      c.removeEventListener("mouseup", onUp);
      c.removeEventListener("mouseleave", onUp);
      c.removeEventListener("touchstart", onDown);
      c.removeEventListener("touchend", onUp);
    };
  }, []);

  // Lifecycle of the game
  const resetGame = (preserveTotal = true) => {
    if (!preserveTotal) setTotalScore(0);
    setScore(0);
    setFinished(false);
    setSpawnedCount(0);
    setHookDepth(0);
    setCaughtGood([]);
    setCaughtBad([]);
    fishRef.current = [];
    activeCountRef.current = 0;
    lastTsRef.current = null;
  };

  const startGame = () => {
    resetGame(true);
    setShowHowTo(false);
    setRunning(true);
  };

  // Level progression
  function nextLevel() {
    setTotalScore((t) => t + score);
    setHardLevel((lvl) => (lvl < 3 ? ((lvl + 1) as HardLevel) : 1));
    setTimeout(startGame, 0);
  }
  function replaySameLevel() {
    setTotalScore((t) => t + score);
    startGame();
  }
  function endSeries() {
    setTotalScore((t) => t + score);
    setHardLevel(1);
    setFinished(false);
    setShowHowTo(true);
  }

  // Hard mode item builder
  function makeItem(isBad: boolean, poolBad: string[], poolGood: string[]): LabeledItem {
    return { label: isBad ? pick(poolBad) : pick(poolGood), kind: isBad ? "bad" : "good" };
  }
  const P_BAD_SENDER = 0.6;
  const P_BAD_HOOK = 0.6;

  const spawnFish = () => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const startX = dir === 1 ? -120 : CANVAS_BASE_W + 120;
    const y = rand(WATERLINE_Y + 40, CANVAS_BASE_H - 60);

    // Tougher levels: faster fish
    const speedScale = hardMode ? (1 + (hardLevel - 1) * 0.25) : 1;
    const baseMin = 1.5 * speedScale;
    const baseMax = 3.2 * speedScale;
    const speed = rand(baseMin, baseMax) * dir;

    const f: Fish = { id, x: startX, y, speed, dir, width: 120, height: 90, active: true };

    if (!hardMode) {
      const isBad = Math.random() < 0.6;
      f.kind = isBad ? "bad" : "good";
      f.label = isBad ? pick(BAD_ITEMS) : pick(GOOD_ITEMS);
    } else {
      if (hardLevel === 1) {
        const isBadSender = Math.random() < P_BAD_SENDER;
        f.sender = makeItem(isBadSender, BAD_SENDERS, GOOD_SENDERS);
      } else if (hardLevel === 2) {
        const isBadHook = Math.random() < P_BAD_HOOK;
        f.hook = makeItem(isBadHook, BAD_HOOKS, GOOD_HOOKS);
      } else {
        const isBadSender = Math.random() < P_BAD_SENDER;
        const isBadHook = Math.random() < P_BAD_HOOK;
        f.sender = makeItem(isBadSender, BAD_SENDERS, GOOD_SENDERS);
        f.hook = makeItem(isBadHook, BAD_HOOKS, GOOD_HOOKS);
      }
    }

    fishRef.current.push(f);
    activeCountRef.current += 1;
  };

  // Scoring per catch
  function scoreCatch(f: Fish) {
    if (!hardMode) {
      if (!f.kind) return 0;
      return f.kind === "bad" ? +10 : -10;
    }
    let delta = 0;
    if (hardLevel === 1 && f.sender) delta += f.sender.kind === "bad" ? +10 : -10;
    else if (hardLevel === 2 && f.hook) delta += f.hook.kind === "bad" ? +10 : -10;
    else if (hardLevel === 3) {
      if (f.sender) delta += f.sender.kind === "bad" ? +10 : -10;
      if (f.hook) delta += f.hook.kind === "bad" ? +10 : -10;
    }
    return delta;
  }

  // Animation
  const rafLoop = useCallback(
    (ts: number) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      if (lastTsRef.current == null) lastTsRef.current = ts;
      const elapsed = ts - lastTsRef.current;

      const [minGap, maxGap] = getSpawnGaps(hardMode, hardLevel);
      if (spawnedCount < roundSpawnTargetRef.current && elapsed > rand(minGap, maxGap)) {
        spawnFish();
        setSpawnedCount((c) => c + 1);
        lastTsRef.current = ts;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

      // Background
      if (oceanImg) {
        drawCoverImage(ctx, oceanImg, 0, 0, canvasSize.w, canvasSize.h);
      } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, WATERLINE_Y);
        skyGrad.addColorStop(0, "#a7d7ff"); skyGrad.addColorStop(1, "#dff1ff");
        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvasSize.w, WATERLINE_Y);
        const waterGrad = ctx.createLinearGradient(0, WATERLINE_Y, 0, canvasSize.h);
        waterGrad.addColorStop(0, "#2aa0e0"); waterGrad.addColorStop(1, "#02679c");
        ctx.fillStyle = waterGrad; ctx.fillRect(0, WATERLINE_Y, canvasSize.w, canvasSize.h - WATERLINE_Y);
      }

      // Boat
      if (boatImg) {
        const boatY = WATERLINE_Y - BOAT_H + BOAT_SIT;
        ctx.drawImage(boatImg, rodX - BOAT_W / 2, boatY, BOAT_W, BOAT_H);
      }

      // Hook motion
      const maxDepth = canvasSize.h - WATERLINE_Y - 40;
      const speedDepth = 6;
      setHookDepth((d) => (lowering ? Math.min(d + speedDepth, maxDepth) : Math.max(d - speedDepth, 0)));
      drawRodAndHook(ctx, rodX, hookDepth);

      // Fish update/draw + collision
      const hookX = rodX;
      const hookY = WATERLINE_Y + hookDepth;

      fishRef.current.forEach((f) => {
        if (!f.active) return;
        f.x += f.speed;
        if ((f.dir === 1 && f.x > canvasSize.w + 150) || (f.dir === -1 && f.x < -150)) {
          f.active = false;
          activeCountRef.current -= 1;
          return;
        }
        if (intersects(hookX, hookY, f)) {
          f.active = false;
          activeCountRef.current -= 1;

          const delta = scoreCatch(f);
          setScore((s) => s + delta);

          // Record for summary
          if (hardMode) {
            if ((hardLevel === 1 || hardLevel === 3) && f.sender) {
              (f.sender.kind === "bad" ? setCaughtBad : setCaughtGood)((arr) => [...arr, `Sender: ${f.sender!.label}`]);
            }
            if ((hardLevel === 2 || hardLevel === 3) && f.hook) {
              (f.hook.kind === "bad" ? setCaughtBad : setCaughtGood)((arr) => [...arr, `Hook: ${f.hook!.label}`]);
            }
          } else {
            const itemText = f.label ?? "Item";
            (f.kind === "bad" ? setCaughtBad : setCaughtGood)((arr) => [...arr, itemText]);
          }
          return;
        }
        drawFish(ctx, f, { hardMode, hardLevel, fishGoodImg, fishBadImg });
      });

      if (spawnedCount >= roundSpawnTargetRef.current && activeCountRef.current <= 0 && !finished) {
        setFinished(true);
        setRunning(false);
      }

      ctx.restore();
      if (running) rafRef.current = requestAnimationFrame(rafLoop);
    },
    [canvasSize.w, canvasSize.h, dpr, lowering, rodX, hookDepth, running, spawnedCount, finished, oceanImg, hardMode, hardLevel]
  );

  useEffect(() => {
    if (!running) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    rafRef.current = requestAnimationFrame(rafLoop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, rafLoop]);

  // Drawing helpers
  function drawRodAndHook(ctx: CanvasRenderingContext2D, x: number, depth: number) {
    const boatTopY = WATERLINE_Y - BOAT_H + BOAT_SIT;

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 0, boatTopY + 130);
    ctx.lineTo(x + 90, boatTopY + 80);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 90, boatTopY + 80);
    ctx.lineTo(x, WATERLINE_Y + depth);
    ctx.stroke();

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, WATERLINE_Y + depth, 8, Math.PI * 0.2, Math.PI * 1.3);
    ctx.stroke();
  }

  function drawFish(
    ctx: CanvasRenderingContext2D,
    f: Fish,
    imgs: { hardMode: boolean; hardLevel: HardLevel; fishGoodImg: HTMLImageElement | null; fishBadImg: HTMLImageElement | null }
  ) {
    const { hardMode, fishGoodImg, fishBadImg } = imgs;

    ctx.save();
    ctx.translate(f.x, f.y);
    const isBadLook = hardMode ? (f.hook?.kind === "bad" || f.sender?.kind === "bad") : f.kind === "bad";
    const img = isBadLook ? fishBadImg : fishGoodImg;
    if (img) {
      if (f.dir === -1) ctx.scale(-1, 1);
      ctx.drawImage(img, -f.width / 2, -f.height / 2, f.width, f.height);
    } else {
      ctx.fillStyle = isBadLook ? "#ff5757" : "#72e06a";
      ctx.beginPath();
      ctx.ellipse(0, 0, f.width / 2.8, f.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (hardMode && f.sender) drawTag(ctx, f.x, f.y - f.height / 2 - 16, f.sender.label, f.sender.kind === "bad");
    if (hardMode && f.hook)   drawTag(ctx, f.x, f.y + f.height / 2 + 16, f.hook.label,   f.hook.kind === "bad");
    if (!hardMode && f.label && f.kind) drawTag(ctx, f.x, f.y + f.height / 2 + 16, f.label, f.kind === "bad");
  }

  // ---------- UI ----------
  return (
    <div style={{ background: "#0b2b44", minHeight: "100vh", color: "#fff" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto", padding: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 18 }}>
            Score (Round): <strong>{score}</strong>
            {hardMode && <span style={{ marginLeft: 12, opacity: 0.85 }}>• <em>{levelTitle(hardLevel)}</em></span>}
          </div>
          <div style={{ fontSize: 18 }}>Total: <strong>{totalScore}</strong></div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={hardMode} onChange={(e) => setHardMode(e.target.checked)} />
              Hard Mode
            </label>
            {hardMode && (
              <select
                value={hardLevel}
                onChange={(e) => setHardLevel(Number(e.target.value) as HardLevel)}
                style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #2c5470", background: "#082133", color: "#fff" }}
              >
                <option value={1}>Level 1: Bad Senders</option>
                <option value={2}>Level 2: Bad Hooks</option>
                <option value={3}>Level 3: Both</option>
              </select>
            )}
            <button className="btn btn-sm btn-info mb-2" onClick={() => setShowInstructions(true)}>Instructions</button>
            <button className="btn btn-sm btn-info mb-2" onClick={() => setShowTips(true)}>Tips</button>
          </div>
        </header>

        {/* Canvas container with overlays */}
        <div style={{ position: "relative", border: "2px solid #3b7aa1", borderRadius: 12, overflow: "hidden" }}>
          <canvas ref={canvasRef} style={{ display: "block" }} />

          {/* Start overlay */}
          {!running && !finished && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.35)", zIndex: 5 }}>
              <div style={{ textAlign: "center" }}>
                {hardMode && <div style={{ marginBottom: 8, fontWeight: 700 }}>{levelTitle(hardLevel)}</div>}
                {hardMode && <div style={{ marginBottom: 12, opacity: 0.85 }}>{levelRuleLine(hardLevel)}</div>}
                <button onClick={startGame} style={{ padding: "12px 20px", background: "#1fb6ff", border: "none", borderRadius: 10, color: "#00131f", fontWeight: 700, cursor: "pointer" }}>
                  Start Game
                </button>
              </div>
            </div>
          )}

          {/* Round Summary overlay (centered, with internal scrolling and close button) */}
          {finished && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
                padding: 12,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "min(560px, 92vw)",
                  maxHeight: "90%",       // keeps it within the canvas
                  overflowY: "auto",      // scroll inside if content is long
                  background: "#072235",
                  border: "1px solid #174563",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                {/* Close (×) */}
                <button
                  aria-label="Close"
                  onClick={() => setFinished(false)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 10,
                    background: "transparent",
                    border: "none",
                    color: "#9fbad1",
                    fontSize: 22,
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>

                <h2 style={{ marginTop: 0 }}>
                  Round Summary {hardMode && <small style={{ opacity: 0.8 }}>— {levelTitle(hardLevel)}</small>}
                </h2>
                {hardMode && <p style={{ margin: "4px 0 10px 0", opacity: 0.85 }}>Level complete! {levelRuleLine(hardLevel)}</p>}
                <p style={{ marginTop: 0 }}>Round Score: <strong>{score}</strong></p>
                <p style={{ marginTop: 0 }}>Cumulative Total: <strong>{totalScore + score}</strong></p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <h3 style={{ color: "#9ef59b", marginTop: 0 }}>Bad Items Caught (+10)</h3>
                    {caughtBad.length === 0 ? <p>None</p> : <ul>{caughtBad.map((b, i) => <li key={`b-${i}`}>{b}</li>)}</ul>}
                  </div>
                  <div>
                    <h3 style={{ color: "#ffc9c9", marginTop: 0 }}>Good Items Accidentally Caught (−10)</h3>
                    {caughtGood.length === 0 ? <p>None</p> : <ul>{caughtGood.map((g, i) => <li key={`g-${i}`}>{g}</li>)}</ul>}
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button onClick={() => setShowHowTo(true)} style={{ padding: "10px 14px", borderRadius: 10, background: "#1b9cfc", border: "none", cursor: "pointer", color: "#fff" }}>
                    View Instructions
                  </button>
                  <button onClick={replaySameLevel} style={{ padding: "10px 14px", borderRadius: 10, background: "#18d06e", border: "none", cursor: "pointer", color: "#001a10", fontWeight: 700 }}>
                    Play Again
                  </button>
                  {hardMode && hardLevel < 3 && (
                    <button onClick={nextLevel} style={{ padding: "10px 14px", borderRadius: 10, background: "#ffd166", border: "none", cursor: "pointer", color: "#3b2900", fontWeight: 700 }}>
                      Next Level →
                    </button>
                  )}
                  {hardMode && hardLevel === 3 && (
                    <button
                      onClick={endSeries}
                      style={{ padding: "10px 14px", borderRadius: 10, background: "#ff7b7b", border: "none", cursor: "pointer", color: "#2b0000", fontWeight: 700 }}
                      title="Finish Hard Mode and review your total"
                    >
                      End Game
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instruction modal */}
        {(showHowTo || (!running && !finished)) && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", zIndex: 50 }}>
            <div style={{ width: "min(560px, 92vw)", background: "#082133", border: "1px solid #184761", borderRadius: 14, padding: 18 }}>
              <h2 style={{ marginTop: 0 }}>How to Play</h2>
              <ul>
                <li>Goal: Catch phishing items and avoid real ones.</li>
                <li>Move the rod by moving your mouse or finger over the water.</li>
                <li>Press and hold on the canvas to lower the hook; release to raise it.</li>
                <li>Score: <strong>+10</strong> for every bad item, <strong>−10</strong> for every good item.</li>
                <li><strong>Hard Mode:</strong> {levelRuleLine(hardLevel)}</li>
              </ul>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                {finished && (<button onClick={() => setShowHowTo(false)} style={{ padding: "10px 14px", borderRadius: 10, background: "#334b5b", border: "none", cursor: "pointer" }}>Close</button>)}
                <button onClick={startGame} style={{ padding: "10px 14px", borderRadius: 10, background: "#18d06e", border: "none", cursor: "pointer" }}>Start</button>
              </div>
            </div>
          </div>
        )}

        {/* Bootstrap-style info modals */}
        {showInstructions && (
          <div className="modal fade show d-block" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Hook the Phish</h5>
                  <button type="button" className="btn-close" onClick={() => setShowInstructions(false)}></button>
                </div>
                <div className="modal-body">
                  <p><strong>How to Play:</strong></p>
                  <p style={{ opacity: 0.8, marginTop: 8, marginBottom: 8 }}>
                    Move your mouse (or finger) left/right to position the rod. Press and hold to lower the hook. Release to raise it. Catch <strong style={{ color: "#9ef59b" }}>bad phish</strong> (+10), avoid <strong style={{ color: "#ffc9c9" }}>good fish</strong> (−10).
                  </p>
                  <ul>
                    <li>Goal: Collect all the phishing scams, senders, emails, pop‑ups, and messages.</li>
                    <li>Move the rod by moving your mouse or finger over the water.</li>
                    <li>Press and hold on the canvas to lower the hook; release to raise it.</li>
                    <li>Score: <strong>+10</strong> for every bad phish, <strong>−10</strong> for every good fish.</li>
                    <li>The game ends after all items have swum across the screen.</li>
                    <li>At the end, you’ll see your total score and a list of what you caught.</li>
                  </ul>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInstructions(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTips && (
          <div className="modal fade show d-block" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Phishing Phighter's Tips</h5>
                  <button type="button" className="btn-close" onClick={() => setShowTips(false)}></button>
                </div>
                <div className="modal-body">
                  <p><strong>Definitions:</strong></p>
                  <ul>
                    <li><strong>Phishing:</strong> Tricking someone into giving personal info by pretending to be trusted.</li>
                    <li><strong>Suspicious Link:</strong> A URL that may hide its true destination or steal info.</li>
                    <li><strong>Pop-up:</strong> A window that suddenly appears—some are safe, some are scams.</li>
                    <li><strong>Spoofing:</strong> When someone pretends to be someone else.</li>
                    <li><strong>Scam:</strong> A trick to get your money or information by lying.</li>
                    <li><strong>Urgent Message:</strong> A scary or pushy message—red flag!</li>
                    <li><strong>Hook:</strong> The fake offer or lie that tries to “catch” you.</li>
                    <li><strong>Red Flag:</strong> A clue that something might be a scam.</li>
                    <li><strong>Phisher:</strong> The person behind the trick.</li>
                    <li><strong>Report:</strong> Tell a parent/teacher/app to help block future scams.</li>
                  </ul>
                  <p><strong>Safety Tips:</strong></p>
                  <ul>
                    <li><strong>Stop & Think:</strong> Pause before you click.</li>
                    <li><strong>Watch for Red Flags:</strong> Weird words, scary messages, strange links.</li>
                    <li><strong>Keep Info Secret:</strong> Never share passwords or personal info in strange messages.</li>
                    <li><strong>Don't Click Suspicious Links:</strong> Hover, don’t click!</li>
                    <li><strong>Ask A Trusted Adult:</strong> If unsure, ask first.</li>
                  </ul>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTips(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer style={{ opacity: 0.7, marginTop: 24, fontSize: 14 }}>
          Tip: Never click on random links or download unknown files.
        </footer>
      </div>
    </div>
  );
}

// ---------- Difficulty helpers ----------
function getSpawnTarget(hardMode: boolean, level: HardLevel) {
  if (!hardMode) return 18;
  return level === 1 ? 18 : level === 2 ? 22 : 26;
}
function getSpawnGaps(hardMode: boolean, level: HardLevel): [number, number] {
  if (!hardMode) return [1100, 1800];
  if (level === 1) return [1000, 1700];
  if (level === 2) return [850, 1500];
  return [700, 1300];
}
