import Reveal from "../Reveal";
import { moduleCards, nonFunctionalCards } from "../../lib/landingContent";

export default function RequirementsSection({ onSelectTopic }) {
  return (
    <section id="requirements" className="content-section">
      <Reveal className="section-heading">
        <p className="eyebrow">SRS Coverage</p>
        <h2>Core modules and non-functional requirements included in the website.</h2>
        <p>The cards below group the requirements from the SRS into readable modules while keeping the original intent intact.</p>
      </Reveal>

      <div className="module-grid">
        {moduleCards.map((module, index) => (
          <Reveal
            key={module.slug}
            as="button"
            type="button"
            className="module-card interactive-card"
            variant="right"
            delay={index * 65}
            onClick={() => onSelectTopic(module.slug)}
          >
            <span className="module-icon">{module.icon}</span>
            <p className="card-kind">{module.kind}</p>
            <h3>{module.title}</h3>
            <p>{module.summary}</p>
          </Reveal>
        ))}
      </div>

      <div className="nf-grid">
        {nonFunctionalCards.map((item, index) => (
          <Reveal key={item.code} className="nf-card" variant="up" delay={index * 50}>
            <span>{item.code}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
