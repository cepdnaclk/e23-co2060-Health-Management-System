import Reveal from "../Reveal";
import { roleCards } from "../../lib/landingContent";

export default function WorkflowSection({ onSelectTopic }) {
  return (
    <section id="workflows" className="content-section">
      <Reveal className="section-heading">
        <p className="eyebrow workflow-eyebrow">User Workflows</p>
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
              <h3>{role.title}</h3>
              <p>{role.summary}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
