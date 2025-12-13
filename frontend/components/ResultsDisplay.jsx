"use client";

import { translations } from "../lib/problems";

export default function ResultsDisplay({ language, results, mobileNumber, name }) {
  const t = translations[language] || translations.en;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "hi" ? "hi-IN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="main-container">
      <div className="results-card">
        <div className="card-header">
          <h1>✨ Your Astrological Results</h1>
          <p>Playlist: {mobileNumber.replace("+91", "")} - {name}</p>
        </div>

        <div className="result-item">
          <div className="result-label">{t.mahadasha}</div>
          <div className="result-value">{results.mahadasha || "N/A"}</div>
        </div>

        <div className="result-item">
          <div className="result-label">{t.antardasha}</div>
          <div className="result-value">{results.antardasha || "N/A"}</div>
        </div>

        <div className="result-item">
          <div className="result-label">{t.endDate}</div>
          <div className="result-value">{formatDate(results.antardashaEndDate)}</div>
        </div>

        {results.playlistUrl && (
          <div className="result-item">
            <div className="result-label">{t.playlistLink}</div>
            <a
              href={results.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="playlist-link"
            >
              <span>▶️</span>
              <span>Open Playlist on YouTube</span>
            </a>
          </div>
        )}

        {results.problems && results.problems.length > 0 && (
          <div className="result-item">
            <div className="result-label">Selected Problems</div>
            <div className="result-value" style={{ fontSize: "1rem", fontWeight: "400" }}>
              {results.problems.join(", ")}
            </div>
          </div>
        )}

        <div className="alert alert-info mt-3">
          Your personalized playlist has been created based on your astrological chart and selected problems.
        </div>
      </div>
    </div>
  );
}

