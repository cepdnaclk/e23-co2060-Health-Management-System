import Reveal from "../components/Reveal";
import { landingHero } from "../lib/landingAssets";
import { getTopicBySlug } from "../lib/landingContent";

export default function TopicPage({ topic, onBackHome, onSelectTopic, onLogin }) {
  if (!topic) return null;

  return (
    <div className="landing-page topic-page">
      <header className="topbar topic-topbar">
        <button type="button" className="nav-pill nav-pill-light" onClick={onBackHome}>
          Back To Home
        </button>
        <nav className="topnav topic-links">
          <a href="#overview" className="topnav-link">
            Overview
          </a>
          <a href="#support" className="topnav-link">
            Digital Support
          </a>
          <a href="#requirements" className="topnav-link">
            SRS Mapping
          </a>
        </nav>
        <button type="button" className="nav-pill nav-pill-accent" onClick={onLogin}>
          Login
        </button>
      </header>

      <section className="hero-section">
        <div className="hero-media topic-hero" style={{ backgroundImage: `url(${landingHero})` }}>
          <div className="hero-overlay" />
          <Reveal className="hero-card topic-hero-card" variant="right">
            <p className="eyebrow">{topic.kind}</p>
            <h1>{topic.title}</h1>
            <p>{topic.summary}</p>
            <p>{topic.description}</p>
          </Reveal>
        </div>
      </section>

      <section id="overview" className="content-section">
        <div className="topic-grid">
          <Reveal className="topic-card" variant="up">
            <p className="eyebrow">General Idea</p>
            <h2>What this topic covers</h2>
            <p>{topic.description}</p>
          </Reveal>

          <Reveal className="topic-card" variant="right" delay={80}>
            <p className="eyebrow">Key Focus</p>
            <ul className="topic-list">
              {topic.focus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section id="support" className="content-section">
        <div className="topic-grid">
          <Reveal className="topic-card" variant="right">
            <p className="eyebrow">Digital Support</p>
            <ul className="topic-list">
              {topic.support.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="topic-card topic-card-accent" variant="up" delay={70}>
            <p className="eyebrow">Next Step</p>
            <h2>Move from information to action.</h2>
            <p>After exploring this page, users can return to the homepage or move directly into the secure login flow.</p>
            <button type="button" className="cta-button" onClick={onLogin}>
              Open Login
            </button>
          </Reveal>
        </div>
      </section>

      <section id="requirements" className="content-section">
        <Reveal className="topic-card" variant="up">
          <p className="eyebrow">SRS Mapping</p>
          <h2>Requirements connected to this topic</h2>
          <ul className="topic-list">
            {topic.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Reveal>
      </section>

      {topic.related?.length ? (
        <section className="content-section">
          <Reveal className="section-heading" variant="up">
            <p className="eyebrow">Related Topics</p>
            <h2>Open another section with the same Medicare theme.</h2>
          </Reveal>

          <div className="related-grid">
            {topic.related.map((slug, index) => {
              const relatedTopic = getTopicBySlug(slug);

              return (
                <Reveal
                  key={slug}
                  as="button"
                  type="button"
                  className="related-card interactive-card"
                  variant="right"
                  delay={index * 60}
                  onClick={() => onSelectTopic(slug)}
                >
                  {relatedTopic?.title || slug}
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
