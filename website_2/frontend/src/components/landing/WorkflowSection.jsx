import Reveal from "../Reveal";
import { roleCards } from "../../lib/landingContent";

export default function WorkflowSection({ onSelectTopic }) {
  return (
    <section id="workflows" className="content-section">
      <Reveal className="section-heading">
        <p className="eyebrow">User Workflows</p>
        <h2>Patient, receptionist, doctor, and lab technician journeys from the SRS.</h2>
        <p>Each card opens a themed detail page that explains the role, its responsibilities, and the matching system support.</p>
      </Reveal>

      <div className="role-grid">
        {roleCards.map((role, index) => (
          <Reveal
            key={role.slug}
            as="button"
            type="button"
            className="role-card interactive-card"
            variant="right"
            delay={index * 80}
            onClick={() => onSelectTopic(role.slug)}
          >
            <span className="role-icon">{role.icon}</span>
            <div>
              <p className="card-kind">{role.kind}</p>
              <h3>{role.title}</h3>
              <p>{role.summary}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
