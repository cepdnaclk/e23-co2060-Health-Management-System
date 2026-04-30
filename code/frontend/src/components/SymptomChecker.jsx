import { useState } from "react";
import { API_BASE, readJson } from "../lib/appShared";

export default function SymptomChecker({ token, className = "", submitLabel = "Analyze", endpoint = "/api/analyzeSymptoms" }) {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ symptoms })
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not analyze symptoms");
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not analyze symptoms");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className={`symptom-checker ${className}`}>
      <label className="symptom-input">
        <span>Describe symptoms</span>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={5}
          className="field w-full resize-none"
          placeholder="Fever, headache for 2 days..."
          required
        />
      </label>
      <button disabled={loading} className="btn-primary" type="submit">
        {loading ? "Analyzing..." : submitLabel}
      </button>

      {error ? <p className="symptom-note symptom-note-error">{error}</p> : null}
      {result ? (
        <div className="symptom-result">
          <p>
            <span>Primary</span>
            {result.primarySpecialty || "-"}
          </p>
          <p>
            <span>Secondary</span>
            {result.secondarySpecialty || "-"}
          </p>
          <p>
            <span>Reason</span>
            {result.reason || "-"}
          </p>
          {result.recommendedDoctors?.length ? (
            <div className="recommended-doctors">
              <span>Recommended Doctors</span>
              {result.recommendedDoctors.map((doctor) => (
                <article key={doctor.username} className="recommended-doctor-card">
                  <strong>{doctor.fullName}</strong>
                  <p>{doctor.specialty} · {doctor.qualification}</p>
                  <p>{doctor.availableDays?.join(", ")} · {doctor.workingHours}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
