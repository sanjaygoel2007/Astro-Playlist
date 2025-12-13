"use client";

import { useState } from "react";
import { sendOTP, verifyOTP } from "../lib/api";
import { translations } from "../lib/problems";

export default function MobileAuth({ language, onVerified }) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = translations[language] || translations.en;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendOTP(mobileNumber);
      setOtpSent(true);
      setSuccess("OTP sent successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter complete OTP");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await verifyOTP(mobileNumber, otpValue);
      setSuccess("OTP verified successfully!");
      setTimeout(() => {
        onVerified(mobileNumber, result.token);
      }, 1000);
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <div className="card">
        <div className="card-header">
          <h1>✨ Astro Playlist</h1>
          <p>{t.authenticate}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label>{t.mobileNumber}</label>
              <div className="mobile-input-group">
                <div className="country-code">+91</div>
                <input
                  type="tel"
                  className="mobile-input"
                  value={mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setMobileNumber(value);
                  }}
                  placeholder="Enter 10-digit mobile number"
                  required
                  maxLength={10}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {t.sendOTP}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>{t.enterOTP}</label>
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    className="otp-input"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    maxLength={1}
                    pattern="[0-9]"
                    inputMode="numeric"
                  />
                ))}
              </div>
              <p className="text-muted text-center mt-2">
                OTP sent to +91 {mobileNumber}
              </p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {t.verifyOTP}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setOtpSent(false);
                setOtp(["", "", "", "", "", ""]);
                setError("");
              }}
            >
              Change Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

