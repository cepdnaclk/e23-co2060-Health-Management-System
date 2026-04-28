import Reveal from "../Reveal";
import { impactStats, qualityStats } from "../../lib/landingContent";

export default function QualitySection() {
  return (
    <section id="quality" className="content-section section-muted">
      <Reveal className="section-heading" variant="up">
        <p className="eyebrow">Quality Data</p>
        <h2>Why patients choose us</h2>
        <p>
          Dedicated consultants, evidence-based programmes, and measurable quality standards shape the design language of this landing page.
        </p>
      </Reveal>

      <div className="quality-grid">
        {qualityStats.map((item, index) => (
          <Reveal key={item.label} className="quality-card" variant="right" delay={index * 65}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </Reveal>
        ))}
      </div>

      <div className="impact-panel">
        {impactStats.map((item, index) => (
          <Reveal key={item.label} className="impact-item" variant="up" delay={index * 55}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
