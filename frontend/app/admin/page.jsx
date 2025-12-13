"use client";

import { useState, useEffect } from "react";
import { getStarProblemMappings, saveStarProblemMapping } from "../../lib/api";

const STARS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
  "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
  "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra",
  "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
  "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const PROBLEM_IDS = Array.from({ length: 50 }, (_, i) => i + 1);

export default function AdminPanel() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    star: "",
    problemId: "",
    sno: "",
    videoUrl: ""
  });

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getStarProblemMappings();
      // API returns { success: true, data: [...] } or { success: false, error: "..." }
      if (response.success && response.data) {
        setMappings(response.data);
        setError(""); // Clear any previous errors
      } else {
        setMappings([]);
        const errorMsg = response.error || "No mappings found";
        setError(errorMsg);
      }
    } catch (err) {
      setError(err.message || "Failed to load mappings. Please check if the database is configured correctly.");
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.star || !formData.problemId || !formData.sno || !formData.videoUrl) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await saveStarProblemMapping({
        star: formData.star,
        problemId: parseInt(formData.problemId),
        sno: parseInt(formData.sno),
        videoUrl: formData.videoUrl,
        key: `${formData.star}_${formData.sno}`
      });
      setSuccess("Mapping saved successfully!");
      setFormData({ star: "", problemId: "", sno: "", videoUrl: "" });
      loadMappings();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save mapping");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <div className="card">
        <div className="card-header">
          <h1>🔧 Admin Panel</h1>
          <p>Manage Star/Problem Video Mappings</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
            {error.includes("ENOTFOUND") && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                <p>The database connection is not configured correctly. Please check your DATABASE_URL in the backend .env file.</p>
                <p style={{ marginTop: "0.25rem" }}>Expected format: <code>postgresql://user:pass@host.domain.com/dbname</code></p>
              </div>
            )}
          </div>
        )}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="form-group">
              <label>Star *</label>
              <select
                value={formData.star}
                onChange={(e) => setFormData({ ...formData, star: e.target.value })}
                required
              >
                <option value="">Select Star</option>
                {STARS.map(star => (
                  <option key={star} value={star}>{star}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Problem ID *</label>
              <select
                value={formData.problemId}
                onChange={(e) => setFormData({ ...formData, problemId: e.target.value })}
                required
              >
                <option value="">Select Problem</option>
                {PROBLEM_IDS.map(id => (
                  <option key={id} value={id}>Problem {id}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>S.No *</label>
              <input
                type="number"
                value={formData.sno}
                onChange={(e) => setFormData({ ...formData, sno: e.target.value })}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Video URL *</label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner"></span> : null}
            Save Mapping
          </button>
        </form>

        <div>
          <h2>Existing Mappings</h2>
          {loading && mappings.length === 0 ? (
            <p>Loading...</p>
          ) : mappings.length === 0 ? (
            <p className="text-muted">No mappings found. Add one above.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr style={{ background: "#F1F5F9", borderBottom: "2px solid #E2E8F0" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Star</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Problem ID</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>S.No</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Video URL</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Key</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping, index) => (
                    <tr key={mapping.key || index} style={{ borderBottom: "1px solid #E2E8F0" }}>
                      <td style={{ padding: "0.75rem" }}>{mapping.star}</td>
                      <td style={{ padding: "0.75rem" }}>{mapping.problemId}</td>
                      <td style={{ padding: "0.75rem" }}>{mapping.sno}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <a href={mapping.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#6B46C1" }}>
                          View Video
                        </a>
                      </td>
                      <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.875rem" }}>
                        {mapping.key}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

