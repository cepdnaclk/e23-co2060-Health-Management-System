import { useMemo, useState } from "react";
import Reveal from "../Reveal";
import { allTopics, featuredTopics } from "../../lib/landingContent";

export default function ExplorerSection({ onSelectTopic }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return featuredTopics;

    return allTopics
      .filter((item) => [item.title, item.summary, item.kind].join(" ").toLowerCase().includes(text))
      .slice(0, 8);
  }, [query]);

  return (
    <section id="explore" className="content-section">
      <Reveal className="finder-shell">
        <div className="section-heading">
          <p className="eyebrow">Quick Explorer</p>
         {/*<h2>Search centres, services, roles, and core system modules.</h2> 
          <p>
            This is the extra functionality layer: a lightweight explorer for the SRS-driven content without overloading the homepage.
          </p>*/}
        </div>

        <label className="finder-input">
          <span>Search the platform</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try heart, lab, doctor, notifications..."
          />
        </label>

        <div className="finder-grid">
          {results.map((item, index) => (
            <Reveal
              key={item.slug}
              as="button"
              type="button"
              className="finder-card interactive-card"
              variant="right"
              delay={index * 70}
              onClick={() => onSelectTopic(item.slug)}
            >
              <span className="finder-badge">{item.kind}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
