import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { FeltLoader } from "@/components/ui/FeltLoader";

export default function DashboardLoading() {
  return (
    <>
      <DashboardBackdrop />
      <FeltLoader label="Dashboard laedt" variant="overlay" />
    </>
  );
}
