"use client";

import { useState } from "react";
import LanguageSelection from "../components/LanguageSelection";
import MobileAuth from "../components/MobileAuth";
import UserDetailsForm from "../components/UserDetailsForm";
import ResultsDisplay from "../components/ResultsDisplay";

export default function Page() {
  const [step, setStep] = useState("language"); // language -> auth -> form -> results
  const [language, setLanguage] = useState("en");
  const [mobileNumber, setMobileNumber] = useState("");
  const [token, setToken] = useState("");
  const [results, setResults] = useState(null);
  const [userName, setUserName] = useState("");

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setStep("auth");
  };

  const handleAuthVerified = (mobile, authToken) => {
    setMobileNumber(mobile);
    setToken(authToken || "no-token"); // Token is optional now
    setStep("form");
  };

  const handleFormSubmit = (result) => {
    setResults(result);
    setUserName(result.name || "");
    setStep("results");
  };

  const handleReset = () => {
    setStep("language");
    setMobileNumber("");
    setToken("");
    setResults(null);
    setUserName("");
  };

  return (
    <main>
      {step === "language" && (
        <LanguageSelection onSelectLanguage={handleLanguageSelect} />
      )}
      {step === "auth" && (
        <MobileAuth
          language={language}
          onVerified={handleAuthVerified}
        />
      )}
      {step === "form" && (
        <UserDetailsForm
          language={language}
          mobileNumber={mobileNumber}
          token={token}
          onSubmit={handleFormSubmit}
        />
      )}
      {step === "results" && (
        <>
          <ResultsDisplay
            language={language}
            results={results}
            mobileNumber={mobileNumber}
            name={userName}
          />
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ maxWidth: "300px", margin: "0 auto" }}
            >
              Create Another Playlist
            </button>
          </div>
        </>
      )}
    </main>
  );
}
