import Reveal from "../Reveal";
import { landingHero } from "../../lib/landingAssets";

export default function HeroSection({ onLogin, onSignup, onBookAppointment, onWorkspace, session }) {
  const isPatient = session?.role === "patient";

  return (
    <section id="home" className="hero-section">
      <div className="hero-media" style={{ backgroundImage: `url(${landingHero})` }}>
        <div className="hero-overlay" />
        <Reveal className="hero-card" variant="right">
          <p className="eyebrow">Advanced Clinical Programmes</p>
          <h1>MediCare</h1>
          <p>
            Find specialists, explore our centers, review quality metrics, and move to login or signup only when you are ready.
          </p>
          <div className="hero-actions">
            {isPatient ? (
              <>
                <button type="button" className="cta-button slide-button" onClick={onBookAppointment}>
                  Book An Appointment
                </button>
                <button type="button" className="cta-button cta-button-secondary slide-button" onClick={onWorkspace}>
                  Patient Dashboard
                </button>
              </>
            ) : (
              <>
                <button type="button" className="cta-button slide-button" onClick={onLogin}>
                  Login
                </button>
                <button type="button" className="cta-button cta-button-secondary slide-button" onClick={onSignup}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
