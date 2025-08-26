// Simple Password Generator app 
// Author: Lexi Ouellette
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { FaQuestionCircle } from 'react-icons/fa';

export default function PasswordCreator() {
  const [length, setLength] = useState(12);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const generatePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+[]{}|<>?';

    let chars = upper + lower;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    evaluateStrength(result);
  };

  // Evaluate password strength 
  const evaluateStrength = (pwd: string) => {
    const hasLetters = /[a-zA-Z]/.test(pwd);      // check for letters
    const hasNumbers = /\d/.test(pwd);            // check for numbers
    const hasSymbols = /[^a-zA-Z0-9]/.test(pwd);  // check for symbols 
    const length = pwd.length;                    // count length 

    // Weak Password if less than 12 characters and only has letters
    if (length < 12 || (hasLetters && !hasNumbers && !hasSymbols)) {
      setStrength('Weak');
      // Moderate if greater than 12 characters and has number or symbols but not both
    } else if (
      length >= 12 &&
      ((hasNumbers && !hasSymbols) || (!hasNumbers && hasSymbols))
    ) {
      setStrength('Moderate');
      // Very strong if 16 charaters long with letters, numbers, and symbols
    } else if (length >= 16 && hasLetters && hasNumbers && hasSymbols) {
      setStrength('Very Strong');
      // Strong is 12 greater than or equal to 12 characters with letters, numbers, and symbols
    } else if (length >= 12 && hasLetters && hasNumbers && hasSymbols) {
      setStrength('Strong');
      // Moderate 
    } else {
      setStrength('Moderate');
    }
  };

  // Allow password to be copied to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    alert('Password copied to clipboard!');
  };

  // Password tips 
  const passwordTips = [
    "Length: Choose between 8–16 characters using the slider.",
    "Options: Add numbers and symbols",
    "Generate as many passwords as you like!",
  ];

  // Show tips using SweetAlert 
  const showTip = () => {
    Swal.fire({
      title: 'Instructions!',
      html: `
        <ul style="text-align: left; padding-left: 1rem; font-size: 1rem;">
          ${passwordTips.map(tip => `<li>${tip}</li>`).join('')}
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

  // UI
  return (
    <div className="container text-center mt-0">
         <div className="d-flex justify-content-end align-items-center mb-1">
              <FaQuestionCircle size={22} className="text-info cursor-pointer" onClick={showTip} />
        </div>
        <h3 className="password-title mb-3">Password Generator</h3>
        <div className='containter p-4 border rounded bg-light'>
        <label htmlFor="length" className="password-text form-label">Length: {length}</label>
      <input
        type="range"
        id="length"
        min="8"
        max="16"
        value={length}
        onChange={(e) => setLength(Number(e.target.value))}
        className="form-range mb-3"
      />

      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="numbersCheck"
          checked={includeNumbers}
          onChange={() => setIncludeNumbers(!includeNumbers)}
        />
        <label className="form-check-label" htmlFor="numbersCheck">
          Include Numbers
        </label>
      </div>

      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="symbolsCheck"
          checked={includeSymbols}
          onChange={() => setIncludeSymbols(!includeSymbols)}
        />
        <label className="form-check-label" htmlFor="symbolsCheck">
          Include Symbols
        </label>
      </div>

      <button onClick={generatePassword} className="btn btn-outline-dark mb-3">Generate Password</button>

      <AnimatePresence>
        {password && (
          <motion.div
            key="password-box"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border p-3 rounded bg-light"
          >
            <strong className="fs-5">{password}</strong>
            <div className="mt-2">
              <span className={`badge ${strength === 'Strong' || strength === 'Very Strong'
                ? 'bg-success'
                : strength === 'Moderate'
                  ? 'bg-warning'
                  : 'bg-danger'}`}>
                {strength} Password
              </span>
            </div>
            <button className="btn btn-outline-success mt-3" onClick={copyToClipboard}>Copy</button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div>
            <div className="modal fade show d-block" role="dialog">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">Password Generator Instructions</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setShowInstructions(false)}></button>
                        </div>
                            <div className="modal-body text-start">
                                <ul>
                                    <li><strong>Length:</strong> Choose between 8–16 characters using the slider.</li>
                                    <li><strong>Options:</strong> Add numbers and symbols</li>
                                    <li><strong>Generate:</strong> Click "Generate Password" to get a random result.</li>
                                </ul>
                            </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowInstructions(false)}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      )}

    </div>

  );
}
