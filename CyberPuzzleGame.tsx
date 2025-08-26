// Cyber puzzle game to test security protocol knowledge
// Author: Lexi Ouellette
import { useState, useEffect, useMemo, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

// ----- Types -----
type Zone = 'Login' | 'Network' | 'Files';              // drop zones
type Item = { id: number; label: string; zone: Zone };  // items to be dropped

// ----- Constants -----
const DRAG_TYPE = 'PUZZLE_ITEM';

// Items to be dropeed
const ITEMS: Item[] = [
  { id: 1, label: 'Firewall', zone: 'Network' },
  { id: 2, label: 'Strong Password', zone: 'Login' },
  { id: 3, label: 'Antivirus', zone: 'Files' },
  { id: 4, label: 'Multi-Factor Auth', zone: 'Login' },
  { id: 5, label: 'VPN', zone: 'Network' },
  { id: 6, label: 'Encrypted Storage', zone: 'Files' },
  { id: 7, label: 'Biometric Login', zone: 'Login' },
  { id: 8, label: 'Email Filter', zone: 'Network' },
  { id: 9, label: 'Access Control List (ACL)', zone: 'Files' },
  { id: 10, label: 'Session Timeout', zone: 'Login' },
];

// Secure network tips
const secureNetworkTips = [
  'A Firewall is a digital wall that filters traffic to keep your device safe.',
  'Antivirus defends against malware that could be hidden in downloads.',
  'A VPN can protect your privacy while exploring the internet.',
  'Encrypted means information is written in a secret code.',
  'Use a strong Wi‑Fi passphrase (16+ chars with numbers & symbols).',
  'An email filter can block spam messages.',
  'Access control means only allowed people can view the resource.',
];

// Zones 
const ZONES: Zone[] = ['Login', 'Network', 'Files'];

// ----- Functions -----
// Show tips
function showSecureTips() {
  const randomTips = [...secureNetworkTips].sort(() => 0.5 - Math.random()).slice(0, 4);
  void Swal.fire({
    title: 'Secure System Hints',
    html: `
      <ul style="text-align:left; padding-left:1.1rem; line-height:1.5; font-size:.95rem;">
        ${randomTips.map((t) => `<li>${t}</li>`).join('')}
      </ul>
      <div style="margin-top:8px; font-size:.9rem; opacity:.85;">
        Pro tip: separate VLANs/SSIDs for IoT vs. personal devices.
      </div>
    `,
    icon: 'info',
    confirmButtonText: 'Got it!',
    confirmButtonColor: '#198754',
    width: 560,
    backdrop: 'rgba(0,0,0,.35)',
  });
}

// Draggable left-side chip 
function PuzzleItem({ item, disabled }: { item: Item; disabled: boolean }) {
  const [{ isDragging }, drag] = useDrag<Item, unknown, { isDragging: boolean }>(() => ({
    type: DRAG_TYPE,
    item,
    canDrag: !disabled,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [item, disabled]);

  // Attach connector to the ref OBJECT
  const ref = useRef<HTMLDivElement | null>(null);
  drag(ref);

  return (
    <div
      ref={ref}
      className="p-2 mb-2 border rounded bg-light"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'grab',
        userSelect: 'none',
      }}
      role="button"
      aria-label={`Drag ${item.label}`}
    >
      {item.label}
    </div>
  );
}

// Drop zone on the right 
function DropZone({
  name,
  onDrop,
  matchedItems,
}: {
  name: Zone;
  onDrop: (item: Item, zone: Zone) => void;
  matchedItems: number[];
}) {
  const [{ isOver }, drop] = useDrop<Item, void, { isOver: boolean }>(() => ({
    accept: DRAG_TYPE,
    drop: (it) => onDrop(it, name),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }), [name, onDrop]);

  // Attach connector to the ref OBJECT
  const ref = useRef<HTMLDivElement | null>(null);
  drop(ref);

  return (
    <div
      ref={ref}
      className="p-3 border rounded bg-white"
      style={{
        minHeight: 160,
        backgroundColor: isOver ? '#e0f7fa' : '#f8f9fa',
        transition: 'background-color .15s',
      }}
    >
      <h5 className="text-center mb-2">{name}</h5>
      {matchedItems.length === 0 ? (
        <p className="text-muted text-center mt-4 mb-0">Drop items here</p>
      ) : (
        <ul className="list-unstyled mt-2 mb-0">
          {matchedItems.map((itemId) => {
            const item = ITEMS.find((i) => i.id === itemId);
            if (!item) return null;
            return (
              <li key={itemId} className="p-2 bg-success text-white rounded mb-1">
                {item.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function CyberPuzzleGame() {
  // Only render on client (avoids SSR drag backend issues)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    void Swal.fire({
      title: 'How to Play “Secure the System”',
      html: `
        <ol style="text-align: left; font-size: 1rem;">
          <li>Drag each term from the left and drop it into the correct category on the right.</li>
          <li>Each category can accept multiple correct items—choose carefully!</li>
          <li>Earn <b>10 points</b> for every correct match.</li>
          <li>Finish them all to win 🎉</li>
        </ol>
        <p><strong>Need help?</strong> Click Captain Firewall for quick tips.</p>
      `,
      icon: 'info',
      confirmButtonText: 'Let’s go!',
      width: 600,
    });
  }, []);

  const [score, setScore] = useState(0);
  const [matchedItems, setMatchedItems] = useState<Record<Zone, number[]>>({
    Login: [],
    Network: [],
    Files: [],
  });
  const [scoredItems, setScoredItems] = useState<number[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const remainingItems = useMemo(
    () => ITEMS.filter((i) => !Object.values(matchedItems).flat().includes(i.id)),
    [matchedItems]
  );

  // Handle drop, check if placed in correct zone, put back in list if incorrect
  const handleDrop = (item: Item, zone: Zone) => {
    const correctDrop = item.zone === zone;
    const alreadyPlaced = Object.values(matchedItems).flat().includes(item.id);
    const alreadyScored = scoredItems.includes(item.id);

    if (correctDrop && !alreadyPlaced) {
      setMatchedItems((prev) => ({ ...prev, [zone]: [...prev[zone], item.id] }));
      if (!alreadyScored) {
        setScore((prev) => prev + 10);
        setScoredItems((prev) => [...prev, item.id]);
      }
    } else if (!correctDrop) {
      void Swal.fire({
        title: 'Try Again',
        text: `"${item.label}" doesn’t belong in ${zone}.`,
        icon: 'warning',
        timer: 1200,
        showConfirmButton: false,
      });
    }
  };

  // Reset game
  const resetGame = () => {
    setMatchedItems({ Login: [], Network: [], Files: [] });
    setScoredItems([]);
    setScore(0);
  };

  // Win notice
  useEffect(() => {
    const totalPlaced = Object.values(matchedItems).flat().length;
    if (totalPlaced === ITEMS.length && ITEMS.length > 0) {
      void Swal.fire({
        icon: 'success',
        title: 'All systems secured!',
        text: `Final score: ${score}`,
        confirmButtonText: 'Nice!',
      });
    }
  }, [matchedItems, score]);

  if (!mounted) return null;

  // ----- UI -----
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="game-title m-0">Secure the System Puzzle</h4>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary fs-6">Score: {score}</span>
            <button
              className="btn btn-sm btn-outline-info"
              onClick={() => setShowInstructions(true)}
              type="button"
            >
              Instructions
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={resetGame} type="button">
              Play Again
            </button>
          </div>
        </div>

        <div className="row g-3">
          {/* Left: draggable items */}
          <div className="col-md-4">
            <div className="p-3 border rounded bg-white">
              <h6 className="mb-3">Drag these</h6>
              {remainingItems.length === 0 ? (
                <p className="text-muted">All items placed!</p>
              ) : (
                remainingItems.map((item) => (
                  <PuzzleItem key={item.id} item={item} disabled={false} />
                ))
              )}
            </div>
          </div>

          {/* Right: drop zones + clickable hero */}
          <div className="col-md-8">
            <div className="row g-3">
              {ZONES.map((zone) => (
                <div key={zone} className="col-md-4">
                  <DropZone
                    name={zone}
                    onDrop={handleDrop}
                    matchedItems={matchedItems[zone]}
                  />
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-center mt-4">
              <motion.img
                src="/images/heroes/CF.png"
                className="img-fluid"
                style={{ maxHeight: 300, objectFit: 'contain', cursor: 'pointer' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.05, rotate: 0.5 }}
                onClick={showSecureTips}
                alt="Captain Firewall - click for tips"
              />
            </div>
          </div>
        </div>

        {/* Simple modal (click backdrop to close) */}
        {showInstructions && (
          <div
            className="modal fade show d-block"
            role="dialog"
            style={{ background: 'rgba(0,0,0,.5)' }}
            onClick={() => setShowInstructions(false)}
          >
            <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">ℹ️ Instructions</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowInstructions(false)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <p><strong>How to Play:</strong></p>
                  <ul>
                    <li>Match each cybersecurity item with what system it protects.</li>
                    <li>Drag an item from the left and drop it into the correct category box.</li>
                    <li>Each box can accept multiple correct answers.</li>
                    <li>Each correct match is worth 10 points.</li>
                  </ul>
                  <p className="mb-0"><strong>Tip:</strong> Click Captain Firewall for hints!</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowInstructions(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
