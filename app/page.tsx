import { BudgetSection } from "./components/BudgetSection";
import { ChatAssistant } from "./components/ChatAssistant";
import { ContactSection } from "./components/ContactSection";
import { FAQSection } from "./components/FAQSection";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { FreeToolsSection } from "./components/FreeToolsSection";
import { HeroSection } from "./components/HeroSection";
import { ProcessSection } from "./components/ProcessSection";
import { ProjectsSection } from "./components/ProjectsSection";
import { TestimonialsSection } from "./components/TestimonialsSection";

export default function Home() {
  return (
    <main className="next-portfolio">
      <HeroSection />
      <ProjectsSection limit={7} showAllLink showFilter />
      <FreeToolsSection />
      <BudgetSection />
      <TestimonialsSection />
      <ProcessSection />
      <FAQSection />
      <ContactSection />
      <FloatingWhatsApp />
      <ChatAssistant />
    </main>
  );
}
