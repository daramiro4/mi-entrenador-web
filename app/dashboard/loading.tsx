function SkeletonBlock({ heightClass }: { heightClass: string }) {
  return <div className={`data-surface animate-pulse ${heightClass}`} />;
}

export default function DashboardLoading() {
  return (
    <main className="flex-1 px-6 py-10 md:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <SkeletonBlock heightClass="h-[150px]" />
        <SkeletonBlock heightClass="h-[180px]" />
        <SkeletonBlock heightClass="h-[220px]" />
        <SkeletonBlock heightClass="h-[80px]" />
        <SkeletonBlock heightClass="h-[140px]" />
        <SkeletonBlock heightClass="h-[260px]" />
        <SkeletonBlock heightClass="h-[180px]" />
        <SkeletonBlock heightClass="h-[320px]" />
      </div>
    </main>
  );
}
