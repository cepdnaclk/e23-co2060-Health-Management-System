import Reveal from "../Reveal";

export default function AppointmentSection({ onLogin, onBookAppointment, session }) {
  const isPatient = session?.role === "patient";

  return (
    <section className="appointment-section">
      <Reveal className="appointment-card" variant="right">
        <p className="eyebrow">Appointments</p>
        <h2>Find a doctor. Book an appointment. Pay easily.</h2>
        <button type="button" className="cta-button slide-button" onClick={isPatient ? onBookAppointment : onLogin}>
          {isPatient ? "Book An Appointment" : "Login To Book Appointment"}
        </button>
      </Reveal>
    </section>
  );
}
