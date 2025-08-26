// Password Strength Checker
// Author: Lexi Ouellette
import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaQuestionCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

// strength tips 
interface Tip {
  message: string;
  passed: boolean;
}

export default function PasswordChecker() {
  // ----- Constants -----
  const [userPassword, setUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Tips based on input 
  const getTips = (pwd: string): Tip[] => [
    { message: 'At least 12 characters', passed: pwd.length >= 12 },
    { message: 'Contains uppercase letter', passed: /[A-Z]/.test(pwd) },
    { message: 'Contains lowercase letter', passed: /[a-z]/.test(pwd) },
    { message: 'Contains a number', passed: /\d/.test(pwd) },
    { message: 'Contains a symbol (!@#)', passed: /[^A-Za-z0-9]/.test(pwd) },
  ];

  // Check password strength 
  const getStrength = (pwd: string): { label: string; value: number; color: string } => {
    const tips = getTips(pwd);
    const passedCount = tips.filter(tip => tip.passed).length;
    const allPassed = passedCount === tips.length;
    const isLongEnough = pwd.length >= 16;

    if (isLongEnough && allPassed) return { label: 'Very Strong', value: 100, color: 'bg-primary' };
    if (passedCount >= 5) return { label: 'Strong', value: 75, color: 'bg-success' };
    if (passedCount >= 3) return { label: 'Moderate', value: 50, color: 'bg-warning' };
    return { label: 'Weak', value: 25, color: 'bg-danger' }; // color changes based on strength
  };

  const tips = getTips(userPassword);
  const { label, value, color } = getStrength(userPassword);

  // Password checker instrustions 
  const passIns = [
    "Type your password into the box below.",
    'Your password will be scored "weak", "moderate", "strong", or "very strong" based on length, complexity, and uniqueness.',
    "Click the 'eye' icon to see your input.",
    'Click the "Clear Password" button to start over.',
  ];

  // Show instructions using SweetAlert
  const showIns = () => {
    Swal.fire({
      title: 'Instructions!',
      html: `
        <ul style="text-align: left; padding-left: 1rem; font-size: 1rem;">
          ${passIns.map(tip => `<li>${tip}</li>`).join('')}
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

  // ----- UI -----
  return (
    <div className="container mt-2">
                 <div className="d-flex justify-content-end align-items-center mb-1">
              <FaQuestionCircle size={22} className="text-info cursor-pointer" onClick={showIns} />
        </div>
      <h4 className="password-title mb-4">Password Strength Checker</h4>

      <div className="containter p-4 border rounded bg-light">
        {/* Input + Eye toggle */}
        <div className="input-group mb-2">
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-control"
            placeholder="Type your password..."
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
          />
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Clear button */}
        {userPassword && (
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-outline-danger btn-sm" onClick={() => setUserPassword('')}>
              Clear Password
            </button>
          </div>
        )}

        {/* Progress + Tips */}
        <div className={`fade-wrapper ${userPassword ? 'fade-in' : 'fade-out'}`}>
          {userPassword && (
            <>
              <div className="progress mb-3 animated-progress" style={{ height: '20px' }}>
                <div
                  className={`progress-bar ${color}`}
                  role="progressbar"
                  style={{ width: `${value}%` }}
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {label}
                </div>
              </div>

              <ul className="list-group">
                {tips.map((tip, index) => (
                  <li
                    key={index}
                    className={`list-group-item d-flex justify-content-between align-items-center ${
                      tip.passed ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {tip.message}
                    <span>{tip.passed ? '✅' : '❌'}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
