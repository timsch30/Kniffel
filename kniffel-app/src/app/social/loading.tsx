import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { FeltLoader } from "@/components/ui/FeltLoader";

export default function SocialLoading() {
  return (
    <>
      <DashboardBackdrop />
      <FeltLoader label="Social laedt" variant="overlay" />
    </>
  );
}
