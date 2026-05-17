import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <>
      <DashboardBackdrop />
      <PageContainer className="grid gap-8" size="xl">
        <section className="grid gap-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-11 w-full max-w-xl" />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card className="p-4" key={item}>
              <Skeleton className="mb-4 h-5 w-32" />
              <Skeleton className="h-9 w-16" />
            </Card>
          ))}
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card className="grid gap-5 p-5" key={item}>
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-28" />
            </Card>
          ))}
        </section>
      </PageContainer>
    </>
  );
}
