"use client";

import { useState } from "react";
import { submitUserDetails } from "../lib/api";
import { PROBLEMS, translations } from "../lib/problems";

export default function UserDetailsForm({ language, mobileNumber, token, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: "",
    problems: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = translations[language] || translations.en;

  const handleProblemToggle = (problemId) => {
    setFormData(prev => ({
      ...prev,
      problems: prev.problems.includes(problemId)
        ? prev.problems.filter(id => id !== problemId)
        : [...prev.problems, problemId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!formData.dateOfBirth) {
      setError("Please select your date of birth");
      return;
    }
    if (!formData.placeOfBirth.trim()) {
      setError("Please enter your place of birth");
      return;
    }
    if (formData.problems.length === 0) {
      setError("Please select at least one problem");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        mobileNumber: `+91${mobileNumber}`,
        token,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        timeOfBirth: formData.timeOfBirth || null,
        placeOfBirth: formData.placeOfBirth,
        problems: formData.problems
      };

      const result = await submitUserDetails(payload);
      onSubmit(result);
    } catch (err) {
      setError(err.message || "Failed to submit details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <div className="card" style={{ maxWidth: "700px" }}>
        <div className="card-header">
          <h1>✨ Astro Playlist</h1>
          <p>Enter Your Details</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.name} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>{t.dateOfBirth} *</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>{t.timeOfBirth}</label>
            <input
              type="time"
              value={formData.timeOfBirth}
              onChange={(e) => setFormData({ ...formData, timeOfBirth: e.target.value })}
            />
            <p className="text-muted">{t.timeOfBirth.includes("Optional") ? "" : "(Optional)"}</p>
          </div>

          <div className="form-group">
            <label>{t.placeOfBirth} *</label>
            <input
              type="text"
              value={formData.placeOfBirth}
              onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
              placeholder="Enter your place of birth"
              required
            />
          </div>

          <div className="form-group">
            <label>{t.typeOfProblem} *</label>
            <p className="text-muted mb-2">{t.selectProblems}</p>
            <div className="problems-container">
              {Object.entries(PROBLEMS).map(([category, problems]) => (
                <div key={category} className="problem-category">
                  <div className="problem-category-title">{category}</div>
                  {problems.map((problem) => (
                    <div
                      key={problem.id}
                      className="problem-item"
                      onClick={() => handleProblemToggle(problem.id)}
                    >
                      <input
                        type="checkbox"
                        id={`problem-${problem.id}`}
                        checked={formData.problems.includes(problem.id)}
                        onChange={() => handleProblemToggle(problem.id)}
                      />
                      <label htmlFor={`problem-${problem.id}`}>
                        {problem.id}. {problem.name}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {formData.problems.length > 0 && (
              <p className="text-muted mt-2">
                {formData.problems.length} problem(s) selected
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner"></span> : null}
            {t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}

