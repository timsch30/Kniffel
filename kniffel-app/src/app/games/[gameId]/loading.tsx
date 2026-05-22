import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { FeltLoader } from "@/components/ui/FeltLoader";

export default function GameLoading() {
  return (
    <>
      <DashboardBackdrop />
      <FeltLoader label="Spiel laedt" variant="overlay" />
    </>
  );
}
