import { DashboardBackdrop } from "@/components/dashboard/DashboardBackdrop";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function GameLoading() {
  return (
    <>
      <DashboardBackdrop />
      <PageContainer className="grid gap-5" size="xl">
        <Card className="grid gap-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-9 w-full max-w-md" />
          <div className="grid gap-2 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton className="h-16" key={item} />
            ))}
          </div>
        </Card>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <Skeleton className="h-12" />
            <Card className="grid gap-3 p-5">
              <Skeleton className="h-8 w-40" />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Skeleton className="aspect-square" key={item} />
                ))}
              </div>
            </Card>
          </div>
          <aside className="grid content-start gap-4">
            {[1, 2, 3].map((item) => (
              <Card className="grid gap-3 p-5" key={item}>
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </Card>
            ))}
          </aside>
        </section>
      </PageContainer>
    </>
  );
}
