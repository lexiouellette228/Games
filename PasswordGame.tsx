// Password Game to test password strength knowledge
// Author: Lexi Ouellette
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Confetti from 'react-confetti';
import { FaQuestionCircle } from 'react-icons/fa';

// ----- Passwords -----
const allPasswords = [
  { text: "123456", answer: "Weak", explanation: "This is one of the most common passwords and easily guessed." },
  { text: "P@ssw0rd123!", answer: "Strong", explanation: "This has uppercase, lowercase, numbers, and symbols." },
  { text: "iloveyou", answer: "Weak", explanation: "Too common and based on a predictable phrase." },
  { text: "G$k8#lPq%r9Z", answer: "Strong", explanation: "Randomized and complex, great for security." },
  { text: "football", answer: "Weak", explanation: "Single word passwords are easy to crack." },
  { text: "B3tter$afeTh@nS0rry", answer: "Strong", explanation: "This is a long passphrase with variation, excellent choice!" },
  { text: "Wv7tR@H5Gilb", answer: "Strong", explanation: "Completely random password, very hard to guess!" },
  { text: "qwerty", answer: "Weak", explanation: "Common keyboard pattern that’s easily guessed." },
  { text: "Bob_2004!", answer: "Weak", explanation: "Personal info like name or birth year can be guessed." },
  { text: "(PWwa4L[&@}|OAGH", answer: "Strong", explanation: "Random and long — great against brute force attacks." },
];

export default function PasswordGame() {
  // ----- Constants -----
  const [shuffledPasswords, setShuffledPasswords] = useState<typeof allPasswords>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Shuffle once on mount
  useEffect(() => {
    const shuffled = [...allPasswords].sort(() => 0.5 - Math.random());
    setShuffledPasswords(shuffled);
  }, []);

  // Check if guess is correct 
  const handleGuess = (choice: string) => {
    const correct = choice === shuffledPasswords[index].answer;
    if (correct) setScore(prev => prev + 1);

    setFeedback({
      correct,
      explanation: shuffledPasswords[index].explanation
    });

    setTimeout(() => {
      setFeedback(null);
      if (index + 1 < shuffledPasswords.length) {
        setIndex(prev => prev + 1);
      } else {
        setShowResult(true);
        setShowConfetti(true);
      }
    }, 5000);
  };

  useEffect(() => {
    showInstructions();
  }, []);

  // Show instructions
  const showInstructions = () => {
    Swal.fire({
      title: 'How to Play the Password Game',
      html: `
        <ol style="text-align: left; font-size: 1rem;">
          <li>Read each password carefully.</li>
          <li>Decide if it is a <strong>Stong</strong> or a <strong>Weak</strong> password.</li>
          <li>Click the button to lock in your choice.</li>
          <li>You will get feedback right away for each question.</li>
        </ol>
        <p style="margin-top:10px; font-size: 0.9rem;">Tip: Look for misspellings, suspicious links, and requests for personal information.</p>
      `,
      icon: 'info',
      confirmButtonText: 'Got it!',
      width: 600
    });
  };

  // Password tips 
  const passwordTips = [
    "Use a mix of uppercase, lowercase, numbers, and symbols.",
    "Avoid common words like 'password', '123456', or 'qwerty'.",
    "Use a passphrase — a sentence that’s easy to remember but hard to guess.",
    "Never reuse the same password across multiple sites.",
    "Use a password manager to generate and store strong passwords.",
    "Avoid using names of pets, family, or birthdays.",
    "Longer is stronger — aim for 12+ characters.",
  ];

  // Show password tips 
  const showTip = () => {
    const randomTips = [...passwordTips].sort(() => 0.5 - Math.random()).slice(0, 3);
    Swal.fire({
      title: '💡 Password Tips!',
      html: `
        <ul style="text-align: left; padding-left: 1rem; font-size: 1rem;">
          ${randomTips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      `,
      icon: 'info',
      confirmButtonText: 'Got it!',
      confirmButtonColor: '#4caf50',
      width: '90%',
      customClass: {
        popup: 'password-tips-popup'
      }
    });
  };

  if (showResult) {
    return (
      <div className="text-center mt-5">
        {showConfetti && <Confetti />}
        <h3 className='password-text'>Great job!</h3>
        <p className='password-text'>You scored <strong>{score}</strong> out of <strong>{shuffledPasswords.length}</strong></p>
        <button className="btn btn-info mt-3" onClick={() => {
          setIndex(0);
          setScore(0);
          setShowResult(false);
          const reshuffled = [...allPasswords].sort(() => 0.5 - Math.random());
          setShuffledPasswords(reshuffled);
        }}>
          Play Again
        </button>
      </div>
    );
  }

  if (!shuffledPasswords.length) return null;

  // ----- UI -----
  return (
    <div className="container mt-4">
      <h4 className="password-title mb-4">Test Your Password Strength Knowledge!</h4>
      <div className="card p-4 shadow">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <p className="mb-1 password-text"><strong>Is this password strong or weak?</strong></p>
          <FaQuestionCircle size={22} className="text-info cursor-pointer" onClick={showTip} />
        </div>

        <div className="d-flex justify-content-between mb-2">
          <span className='password-text'>Question {index + 1} of {shuffledPasswords.length}</span>
          <span className='password-text'>🏆 Score: {score}</span>
        </div>

        <h4 className="text-center border p-3 mb-3 bg-light">{shuffledPasswords[index].text}</h4>

        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-success px-4" onClick={() => handleGuess("Strong")}>Strong</button>
          <button className="btn btn-danger px-4" onClick={() => handleGuess("Weak")}>Weak</button>
        </div>

        {feedback && (
          <div className={`alert mt-4 ${feedback.correct ? "alert-success" : "alert-danger"}`}>
            {feedback.correct ? "Correct!" : "Oops!"} {feedback.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
