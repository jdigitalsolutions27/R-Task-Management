export default function AppLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded-md bg-[#E5E7EB]" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-[#e8dfd4]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-lg border border-[#E5E7EB] bg-white"
            key={index}
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-80 animate-pulse rounded-lg border border-[#E5E7EB] bg-white" />
        <div className="h-80 animate-pulse rounded-lg border border-[#E5E7EB] bg-white" />
      </div>
    </div>
  );
}
