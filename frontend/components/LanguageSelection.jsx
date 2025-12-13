"use client";

import { translations } from "../lib/problems";

export default function LanguageSelection({ onSelectLanguage }) {
  return (
    <div className="main-container">
      <div className="card">
        <div className="card-header">
          <h1>✨ Astro Playlist</h1>
          <p>Select Your Preferred Language</p>
        </div>
        <div className="language-selector">
          <button
            className="lang-btn"
            onClick={() => onSelectLanguage("en")}
          >
            English
          </button>
          <button
            className="lang-btn"
            onClick={() => onSelectLanguage("hi")}
          >
            हिंदी
          </button>
        </div>
      </div>
    </div>
  );
}

