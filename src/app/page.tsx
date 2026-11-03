import GardenGate from "@/components/GardenGate";
import GardenOverview from "@/components/GardenOverview";
import { AboutTheGardener, ContactSection, SelectedWork } from "@/components/HomeSections";

export default function Home() {
  return (
    <>
      <GardenGate />
      <GardenOverview />
      <SelectedWork />
      <AboutTheGardener />
      <ContactSection />
    </>
  );
}
