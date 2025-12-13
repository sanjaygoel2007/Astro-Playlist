"use client";

import { useState, useEffect } from "react";
import { getUserSubmissions } from "../../lib/api";

export default function SubmissionsPage() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getUserSubmissions(mobileNumber);
      setSubmissions(data);
    } catch (err) {
      setError(err.message || "Failed to fetch submissions");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <div className="card">
        <div className="card-header">
          <h1>📊 User Submissions</h1>
          <p>View all user submissions</p>
        </div>

        <form onSubmit={handleSearch} style={{ marginBottom: "2rem" }}>
          <div className="form-group">
            <label>Search by Mobile Number</label>
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
                maxLength={10}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner"></span> : null}
            Search
          </button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {submissions.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
              <thead>
                <tr style={{ background: "#F1F5F9", borderBottom: "2px solid #E2E8F0" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>S.No</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>Mobile Number</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>Date of Birth</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>Time of Birth</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>Place of Birth</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>Problems</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>Mahadasha</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>Antardasha</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>End Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={submission.id || index} style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "0.75rem" }}>{index + 1}</td>
                    <td style={{ padding: "0.75rem" }}>{submission.mobileNumber}</td>
                    <td style={{ padding: "0.75rem" }}>{submission.name}</td>
                    <td style={{ padding: "0.75rem" }}>{formatDate(submission.dateOfBirth)}</td>
                    <td style={{ padding: "0.75rem" }}>{submission.timeOfBirth || "N/A"}</td>
                    <td style={{ padding: "0.75rem" }}>{submission.placeOfBirth}</td>
                    <td style={{ padding: "0.75rem", maxWidth: "200px" }}>
                      {Array.isArray(submission.problems) 
                        ? submission.problems.join(", ")
                        : submission.problems || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>{submission.mahadasha || "N/A"}</td>
                    <td style={{ padding: "0.75rem" }}>{submission.antardasha || "N/A"}</td>
                    <td style={{ padding: "0.75rem" }}>{formatDate(submission.antardashaEndDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && submissions.length === 0 && mobileNumber && !error && (
          <p className="text-muted text-center">No submissions found for this mobile number.</p>
        )}
      </div>
    </div>
  );
}

