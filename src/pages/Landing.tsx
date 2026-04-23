import { HeroSection } from "@/components/ui/hero-1";
import { Footer } from "@/components/Footer";

export default function Landing() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <main className="flex-1 pb-16">
        <HeroSection />
      </main>
      <Footer />
    </div>
  );
}
