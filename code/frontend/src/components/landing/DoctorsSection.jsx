import { useEffect, useState } from "react";
import Reveal from "../Reveal";
import { API_BASE, readJson } from "../../lib/appShared";
import { getDoctorImage } from "../../lib/landingAssets";

export default function DoctorsSection({ onSelectDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        const res = await fetch(`${API_BASE}/api/public/doctors`);
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not load doctors");
        if (!cancelled) setDoctors(data.doctors || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load doctors");
      }
    }

    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="doctors" className="content-section doctors-section">
      <Reveal className="section-heading" variant="up">
        <p className="eyebrow">Doctors</p>
        <h2>Meet Medicare specialists available through the system.</h2>
      </Reveal>

      {error ? <p className="symptom-note symptom-note-error">{error}</p> : null}

      <div className="doctor-grid">
        {doctors.map((doctor, index) => (
          <Reveal
            key={doctor.username}
            as="button"
            type="button"
            className="doctor-card"
            variant="right"
            delay={index * 55}
            onClick={() => onSelectDoctor(doctor)}
          >
            <div className="doctor-photo">
              {getDoctorImage(doctor.username) ? (
                <img src={getDoctorImage(doctor.username)} alt={doctor.fullName} />
              ) : (
                doctor.fullName?.split(" ").slice(-1)[0]?.[0] || "D"
              )}
            </div>
            <h3>{doctor.fullName}</h3>
            <p>{doctor.specialty}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
