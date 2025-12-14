"use client";

import { useState } from "react";
import { translations } from "../lib/problems";

export default function MobileAuth({ language, onVerified }) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");

  const t = translations[language] || translations.en;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    // Proceed directly without OTP verification
    onVerified(mobileNumber, null);
  };

  return (
    <div className="main-container">
      <div className="card">
        <div className="card-header">
          <h1>✨ Astro Playlist</h1>
          <p>Enter Your Mobile Number</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.mobileNumber} *</label>
            <div className="mobile-input-group">
              <div className="country-code">+91</div>
              <input
                type="tel"
                className="mobile-input"
                value={mobileNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setMobileNumber(value);
                  setError("");
                }}
                placeholder="Enter 10-digit mobile number"
                required
                maxLength={10}
                inputMode="numeric"
              />
            </div>
            <p className="text-muted" style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
              We'll use this to create your personalized playlist
            </p>
          </div>
          <button type="submit" className="btn btn-primary">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

