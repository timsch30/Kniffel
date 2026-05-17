import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { PageContainer } from "@/components/layout/PageContainer";
import { FeltLoader } from "@/components/ui/FeltLoader";

export default function GameLoading() {
  return (
    <>
      <DashboardBackdrop />
      <PageContainer className="grid gap-5" size="xl">
        <FeltLoader label="Spiel laedt" variant="game" />
      </PageContainer>
    </>
  );
}
