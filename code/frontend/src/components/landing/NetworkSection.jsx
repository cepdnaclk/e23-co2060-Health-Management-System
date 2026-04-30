import Reveal from "../Reveal";
import { careTiles, networkList } from "../../lib/landingContent";

export default function NetworkSection({ onSelectTopic }) {
  return (
    <section id="network" className="content-section">
      <div className="section-grid">
        <Reveal className="network-panel section-card section-card-teal" variant="up">
          <p className="eyebrow">Medicare Health Network</p>
          <h2>Six hospitals, specialist centres, and a connected laboratory network.</h2>
          <ul className="network-list">
            {networkList.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <span>&rarr;</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="tile-grid">
          {careTiles.map((tile, index) => (
            <Reveal
              key={tile.slug}
              as="button"
              type="button"
              className={`care-tile interactive-card tone-${tile.tone}`}
              variant="right"
              delay={index * 70}
              onClick={() => onSelectTopic(tile.slug)}
            >
              <span className="tile-icon">{tile.icon}</span>
              <p className="card-kind">{tile.kind}</p>
              <h3>{tile.title}</h3>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
