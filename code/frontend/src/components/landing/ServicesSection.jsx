import Reveal from "../Reveal";
import { landingHero } from "../../lib/landingAssets";
import { serviceCards } from "../../lib/landingContent";

export default function ServicesSection({ onSelectTopic }) {
  return (
    <section id="services" className="service-section" style={{ backgroundImage: `url(${landingHero})` }}>
      <div className="service-overlay" />
      <Reveal className="section-heading section-heading-light" variant="up">
        <p className="eyebrow">Online Services</p>
        <h2>Use the convenience of our digital services.</h2>
      </Reveal>

      <div className="service-grid">
        {serviceCards.map((card, index) => (
          <Reveal
            key={card.slug}
            as="button"
            type="button"
            className="service-card interactive-card"
            variant="right"
            delay={index * 80}
            onClick={() => onSelectTopic(card.slug)}
          >
            <span className="service-icon">+</span>
            <p className="card-kind">{card.kind}</p>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
