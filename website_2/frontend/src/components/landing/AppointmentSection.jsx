import Reveal from "../Reveal";

export default function AppointmentSection({ onLogin }) {
  return (
    <section className="appointment-section">
      <Reveal className="appointment-card" variant="right">
        <p className="eyebrow">Appointments</p>
        <h2>Find a doctor. Book an appointment. Pay easily.</h2>
        <p>Simplify the journey with a single entry point from the homepage to the authenticated experience.</p>
        <button type="button" className="cta-button slide-button" onClick={onLogin}>
          Make An Appointment
        </button>
      </Reveal>
    </section>
  );
}
