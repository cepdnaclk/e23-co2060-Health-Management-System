import ExplorerSection from "../components/landing/ExplorerSection";
import AppointmentSection from "../components/landing/AppointmentSection";
import FooterSection from "../components/landing/FooterSection";
import HeroSection from "../components/landing/HeroSection";
import Navbar from "../components/landing/Navbar";
import NetworkSection from "../components/landing/NetworkSection";
import QualitySection from "../components/landing/QualitySection";
import ServicesSection from "../components/landing/ServicesSection";
import SymptomSection from "../components/landing/SymptomSection";
import WorkflowSection from "../components/landing/WorkflowSection";

export default function LandingPage({ onLogin, onSignup, onSelectTopic }) {
  return (
    <div className="landing-page">
      <Navbar onLogin={onLogin} onSignup={onSignup} />
      <HeroSection onLogin={onLogin} onSignup={onSignup} />
      <SymptomSection />
      <ExplorerSection onSelectTopic={onSelectTopic} />
      <NetworkSection onSelectTopic={onSelectTopic} />
      <QualitySection />
      <WorkflowSection onSelectTopic={onSelectTopic} />
      <ServicesSection onSelectTopic={onSelectTopic} />
      <AppointmentSection onLogin={onLogin} />
      <FooterSection />
    </div>
  );
}
