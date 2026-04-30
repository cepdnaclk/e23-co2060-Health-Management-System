import { useState } from "react";
import Reveal from "../Reveal";
import SymptomChecker from "../SymptomChecker";

export default function SymptomSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="symptom-checker" className="symptom-section">
      <Reveal className="symptom-feature" variant="up">
        <div className="symptom-orbit" aria-hidden="true">
          <span className="symptom-pulse symptom-pulse-main">AI</span>
          <span className="symptom-pulse">24/7</span>
          <span className="symptom-pulse">Care</span>
        </div>

        <div className="symptom-copy">
          <p className="eyebrow">AI Symptom Checker</p>
          <h2>Check your symptoms before choosing the right care path.</h2>
          <p>
            Type what you are feeling and Medicare will suggest the most relevant specialty to start with.
          </p>
          <button type="button" className="cta-button symptom-open-button" onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? "Close Checker" : "Check Your Symptoms"}
          </button>
        </div>
      </Reveal>

      {isOpen ? (
        <Reveal className="symptom-home-panel" variant="up">
          <SymptomChecker endpoint="/api/public/analyzeSymptoms" submitLabel="Check Symptoms" />
        </Reveal>
      ) : null}
    </section>
  );
}
