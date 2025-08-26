// Cyber Memory Game to test cyber securtiy term knowledge
// Game Play: Match the term with the defintion. Matched cards will remain flipped, unmatched cards will flip back
// Author: Lexi Ouellette
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';
import { FiLock, FiLogIn } from "react-icons/fi";
import { MdPhishing, MdOutlineMailOutline, MdNotInterested, MdOutlineHealthAndSafety, MdOutlineGppBad, MdOutlineVpnLock, MdOutlineVpnKey } from "react-icons/md";
import { FaFire } from "react-icons/fa";
import { DiCodeBadge } from "react-icons/di";
import { TbLockPassword } from "react-icons/tb";
import { VscSymbolOperator, VscGistSecret } from "react-icons/vsc";
import { AiOutlineControl } from "react-icons/ai";
import { CiSquareCheck } from "react-icons/ci";
import { TbAuth2Fa } from "react-icons/tb";
import { GoChecklist } from "react-icons/go";
import { GrUpdate } from "react-icons/gr";
import { BsPatchCheck } from "react-icons/bs";

// ----- Constants -----
// Easy mode pairs
const EASY_PAIRS = [
  { id: 1, label: 'Phishing', matchId: 'a', icon: <MdPhishing /> },
  { id: 2, label: 'Trick email to steal info', matchId: 'a', icon: <MdOutlineMailOutline /> },
  { id: 3, label: 'Firewall', matchId: 'b', icon: <FaFire /> },
  { id: 4, label: 'Blocks unauthorized access', matchId: 'b', icon: <MdNotInterested /> },
  { id: 5, label: 'Malware', matchId: 'c', icon: <MdOutlineGppBad /> },
  { id: 6, label: 'Bad software', matchId: 'c', icon: <DiCodeBadge /> },
  { id: 7, label: 'Strong Password', matchId: 'd', icon: <TbLockPassword /> },
  { id: 8, label: 'Contains letters, numbers, symbols', matchId: 'd', icon: <VscSymbolOperator /> },
];

// Hard mode pairs
const HARD_PAIRS = [
  ...EASY_PAIRS,
  { id: 9, label: 'Access Control', matchId: 'e', icon: <AiOutlineControl /> },
  { id: 10, label: 'Who can access what', matchId: 'e', icon: <CiSquareCheck /> },
  { id: 11, label: 'VPN', matchId: 'f', icon: <MdOutlineVpnLock /> },
  { id: 12, label: 'Encrypts traffic', matchId: 'f', icon: <MdOutlineVpnKey /> },
  { id: 13, label: 'Two-Factor Authentication', matchId: 'g', icon: <TbAuth2Fa /> },
  { id: 14, label: 'Second login factor', matchId: 'g', icon: <FiLogIn /> },
  { id: 15, label: 'Encryption', matchId: 'h', icon: <FiLock /> },
  { id: 16, label: 'Secret code to protect data', matchId: 'h', icon: <VscGistSecret /> },
  { id: 17, label: 'Antivirus', matchId: 'i', icon: <MdOutlineHealthAndSafety/> },
  { id: 18, label: 'Program that protects your computer ', matchId: 'i', icon: <GoChecklist /> },
  { id: 19, label: 'Patch', matchId: 'j', icon: <BsPatchCheck /> },
  { id: 20, label: 'Small update that fixes problems or bugs ', matchId: 'j', icon: <GrUpdate /> },
];

// Function to shuffle cards
function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export default function CyberMemoryGame() {
  const [mode, setMode] = useState('easy');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [turns, setTurns] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);

  // Change mode based on difficulty selection 
  useEffect(() => {
    const initial = mode === 'easy' ? EASY_PAIRS : HARD_PAIRS;
    setCards(shuffle([...initial]));
  }, []);

  // Timer 
  useEffect(() => {
    if (timeLeft === null || gameOver) return;
    if (timeLeft === 0) {
      setGameOver(true);
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  // Match check 
  const handleFlip = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(cards[index].matchId)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setTurns(prev => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const first = cards[firstIdx];
      const second = cards[secondIdx];

      if (first.matchId === second.matchId) {
        setMatched(prev => [...prev, first.matchId]);
        setTimeout(() => setFlipped([]), 1000);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  // Show instruction modal
  useEffect(() => {
    showInstructionsOnOpen();
  }, []);

  // Instructions on page open using SweetAlert
  const showInstructionsOnOpen = () => {
    Swal.fire({
      title: 'How to Play Cyber Memory Match',
      html: `
        <ol style="text-align: left; font-size: 1rem;">
          <li>Click on two tiles to flip and try to match terms with their definitions.</li>
          <li>In Easy Mode, you have unlimited time to match all pairs!</li>
          <li>In Hard Mode, you have 90 seconds to match all pairs!</li>
          <li>Matched pairs will stay flipped. Try to finish in the fewest turns.</li>
        </ol>
        <p><strong>Want to play again?</strong><p>
        <p>Click the “Play Again” button at the bottom to reset the board and try again.</p>
      `,
      icon: 'info',
      confirmButtonText: 'Got it!',
      width: 600
    });
  };

  useEffect(() => {
    if (matched.length === cards.length / 2 && timeLeft !== null) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeLeft(null);
    }
  }, [matched]);

  // ----- UI -----
  return (
    <div className="container mt-4 pb-5">
        <div className='d-flex justify-content-center mb-3 gap-4'>
        <button className="btn btn-info" onClick={() => setShowInstructions(true)}>
          Instructions
        </button>

        <button className="btn btn-info" onClick={() => setShowDictionary(true)}>
          Dictionary
        </button>
        </div>
      <div className="d-flex justify-content-center mb-3">
        <label className="me-2 memory-text">Mode:</label>
        <select
          className="form-select w-auto"
          value={mode}
          onChange={(e) => {
            const newMode = e.target.value;
            setMode(newMode);
            const newCards = newMode === 'easy' ? shuffle([...EASY_PAIRS]) : shuffle([...HARD_PAIRS]);
            setCards(newCards);
            setFlipped([]);
            setMatched([]);
            setTurns(0);
            setGameOver(false);
            if (newMode === 'hard') {
              setTimeLeft(90);
            } else {
              setTimeLeft(null);
            }
          }}
        >
          <option value="easy"> Easy</option>
          <option value="hard"> Hard</option>
        </select>
      </div>

      <div className="text-center">
        <p className='memory-text'>Turns: {turns}</p>
        {mode === 'hard' && <p className="text-danger fw-bold">⏱ Time Left: {timeLeft}s</p>}
      </div>
      <div className="row row-cols-3 row-cols-md-4 g-3">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(card.matchId);
          return (
            <div className="col" key={card.id}>
              <div
                className={`card memory-card ${isFlipped ? 'flipped' : ''}`}
                onClick={() => handleFlip(index)}
              >
                <div className="card-body text-center">
                  {isFlipped ? (
                    <div>
                      <div style={{ fontSize: '1.5rem' }}>{card.icon}</div>
                      <div>{card.label}</div>
                    </div>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '2rem' }}>🧩</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <button className="btn btn-danger" onClick={() => {
            const newCards = mode === 'easy' ? shuffle([...EASY_PAIRS]) : shuffle([...HARD_PAIRS]);
            setCards(newCards);
            setFlipped([]);
            setMatched([]);
            setTurns(0);
            setGameOver(false);
            setTimeLeft(mode === 'hard' ? 60 : null);
          }}>
            Reset
          </button>
      </div>

      {matched.length === cards.length / 2 && (
        <div className="alert alert-success text-center mt-4">
          You matched all the cards in {turns} turns!
          <br />
          <button className="btn btn-primary mt-2" onClick={() => {
            const newCards = mode === 'easy' ? shuffle([...EASY_PAIRS]) : shuffle([...HARD_PAIRS]);
            setCards(newCards);
            setFlipped([]);
            setMatched([]);
            setTurns(0);
            setGameOver(false);
            setTimeLeft(mode === 'hard' ? 60 : null);
          }}>
            Play Again
          </button>
        </div>
      )}

      {gameOver && matched.length < cards.length / 2 && (
        <div className="alert alert-danger text-center mt-4">
          Time's up!<br />
          You matched {matched.length} of {cards.length / 2} pairs in {turns} turns.
          <br />
          <button className="btn btn-danger mt-2" onClick={() => {
            setCards(shuffle([...HARD_PAIRS]));
            setFlipped([]);
            setMatched([]);
            setTurns(0);
            setTimeLeft(90);
            setGameOver(false);
          }}>
            Try Again
          </button>
        </div>
      )}

    {showInstructions && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
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
                      <li><strong>Deny:</strong> the app can't use it</li>
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
                        <li><strong>Deny:</strong> the app can't use it</li>
                        <li><strong>Ask Parent:</strong> get permission first</li>
                        <li><strong>Allow:</strong> the app can use it</li>
                      </ul>
                    <li><strong>Keyboard help:</strong> Pick the safest settings for each pretend app.</li>
                    <li><strong>Remember:</strong> Pick the safest settings for each pretend app.</li>
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

    {showDictionary && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cyber Dictionary</h5>
                <button type="button" className="btn-close" onClick={() => setShowDictionary(false)}></button>
              </div>
              <div className="modal-body">
                <ul>
                    <li><strong>Antivirus: </strong>A program that protects your computer from bugs and malware.</li>
                    <li><strong>Access Control: </strong>A way to decide who can see or use certain information, files, or systems.</li>
                    <li><strong>Encrytion: </strong>A way to turn data into a secret code.</li>
                    <li><strong>Firewall: </strong>A digital shield that blocks bad stuff from getting into your network. </li>
                    <li><strong>Malware: </strong>Bad software that tries to break or sneak into your device.</li>
                    <li><strong>Password: </strong>A secret code that keeps your stuff safe online.</li>
                    <li><strong>Patch: </strong>A small update that fixes problems or security bugs in software to help keep your device safe and working correctly.</li>
                    <li><strong>Phishing: </strong>Fake emails or messages that try to trick you into giving away your infomation.</li>
                    <li><strong>Update: </strong>A fix or new version of a program that makes it work better or stay secure.</li>
                    <li><strong>VPN (Virtual Private Network): </strong>A secure, private tunnel that hides your online activity and location to keep your information safe, especially on public Wi-Fi.</li>
                    <li><strong>2FA (Two-Factor Authentication): </strong>A security step that asks for two ways to prove who you are, like a password and a code sent to your phone.</li>
                </ul>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDictionary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
