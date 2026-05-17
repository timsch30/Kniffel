import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { PageContainer } from "@/components/layout/PageContainer";
import { FeltLoader } from "@/components/ui/FeltLoader";

export default function DashboardLoading() {
  return (
    <>
      <DashboardBackdrop />
      <PageContainer className="grid gap-8" size="xl">
        <FeltLoader label="Dashboard laedt" variant="dashboard" />
      </PageContainer>
    </>
  );
}
