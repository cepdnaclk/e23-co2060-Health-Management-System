import Reveal from "../components/Reveal";
import { getDoctorImage } from "../lib/landingAssets";

export default function DoctorProfilePage({ doctor, onBackHome, onLogin }) {
  if (!doctor) return null;
  const doctorImage = getDoctorImage(doctor.username);

  return (
    <div className="landing-page doctor-profile-page">
      <header className="topbar topic-topbar">
        <button type="button" className="nav-pill nav-pill-light" onClick={onBackHome}>
          Back To Home
        </button>
        <nav className="topnav topic-links">
          <a href="#profile" className="topnav-link">
            Profile
          </a>
          <a href="#availability" className="topnav-link">
            Availability
          </a>
        </nav>
        <button type="button" className="nav-pill nav-pill-accent" onClick={onLogin}>
          Login To Book
        </button>
      </header>

      <section id="profile" className="doctor-profile-hero">
        <Reveal className="doctor-profile-photo" variant="up">
          {doctorImage ? <img src={doctorImage} alt={doctor.fullName} /> : doctor.fullName?.split(" ").slice(-1)[0]?.[0] || "D"}
        </Reveal>
        <Reveal className="doctor-profile-copy" variant="right">
          <p className="eyebrow">{doctor.specialty}</p>
          <h1>{doctor.fullName}</h1>
          <p>{doctor.bio}</p>
          <button type="button" className="cta-button" onClick={onLogin}>
            Login To Book Appointment
          </button>
        </Reveal>
      </section>

      <section id="availability" className="content-section">
        <div className="topic-grid">
          <Reveal className="topic-card" variant="up">
            <p className="eyebrow">Qualifications</p>
            <h2>{doctor.qualification}</h2>
            <p>{doctor.experienceYears} years experience</p>
            <p>Registration: {doctor.registrationId}</p>
          </Reveal>

          <Reveal className="topic-card topic-card-accent" variant="right">
            <p className="eyebrow">Availability</p>
            <h2>{doctor.availableDays?.join(", ")}</h2>
            <p>{doctor.workingHours}</p>
            <p>{doctor.phone}</p>
            <p>{doctor.email}</p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
