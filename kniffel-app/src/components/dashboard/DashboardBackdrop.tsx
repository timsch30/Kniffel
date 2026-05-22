export function DashboardBackdrop() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-emerald-950">
      <div className="absolute left-1/2 top-[44%] h-[min(82rem,126vw)] w-[min(82rem,126vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[radial-gradient(circle_at_48%_42%,rgba(22,120,87,0.98),rgba(6,78,59,0.98)_48%,rgba(5,46,43,1)_74%)] shadow-[inset_0_2px_0_rgba(255,255,255,0.14),inset_0_-90px_160px_rgba(0,0,0,0.3),0_40px_120px_rgba(0,0,0,0.35)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,transparent_46%,rgba(2,6,23,0.5)_100%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(white_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute left-1/2 top-[34%] h-px w-[min(46rem,82vw)] origin-center -translate-x-1/2 rotate-[-12deg] bg-brass opacity-20 blur-[1px]" />
      <div className="absolute bottom-[18%] left-1/2 h-px w-[min(38rem,76vw)] origin-center -translate-x-1/2 rotate-[16deg] bg-emerald-200 opacity-15 blur-[1px]" />
    </div>
  );
}
