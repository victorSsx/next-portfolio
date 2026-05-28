import { BudgetSection } from "./components/BudgetSection";
import { ContactSection } from "./components/ContactSection";
import { HeroSection } from "./components/HeroSection";
import { ProcessSection } from "./components/ProcessSection";
import { ProjectsSection } from "./components/ProjectsSection";

export default function Home() {
  return (
    <main className="next-portfolio">
      <HeroSection />
      <ProjectsSection />
      <BudgetSection />
      <ProcessSection />
      <ContactSection />
    </main>
  );
}
