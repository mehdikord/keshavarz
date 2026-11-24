export default function ServiceIntroLoading() {
  return (
    <main aria-busy className="flex flex-1 flex-col overflow-hidden" aria-label="در حال بارگذاری">
      <div className="h-[min(58vh,420px)] w-full animate-pulse bg-[linear-gradient(165deg,#0f3324,#24603f)]" />
      <div className="relative -mt-7 flex flex-1 flex-col gap-4 rounded-t-[30px] bg-background px-5 pt-7">
        <div className="h-12 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 w-11/12 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-3/5 animate-pulse rounded-full bg-muted" />
      </div>
    </main>
  );
}
