import Reveal from "../Reveal";
import { footerColumns } from "../../lib/landingContent";

export default function FooterSection() {
  return (
    <footer id="contact" className="footer-section">
      <Reveal className="footer-lead" variant="up">
        <p className="eyebrow">Accreditations</p>
        <h2>Trusted private healthcare with strong patient safety standards.</h2>
      </Reveal>

      <div className="footer-grid">
        <Reveal as="article" variant="right">
          <p className="footer-brand">MEDICARE</p>
          <p className="footer-copy">
            Internationally accredited patient care, connected hospitals, and modern clinical programmes across Sri Lanka.
          </p>
        </Reveal>

        {footerColumns.map((column, index) => (
          <Reveal as="article" key={column.title} variant="right" delay={(index + 1) * 65}>
            <h3>{column.title}</h3>
            <ul>
              {column.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </footer>
  );
}
