const SKELETON_BLOCKS = [
  { bg: 'bg-white/60', bar: 'border-panel-header/30', width: 'w-3/4', delay: '' },
  { bg: 'bg-white/40', bar: 'border-panel-header/20', width: 'w-1/2', delay: '[animation-delay:200ms]' },
  { bg: 'bg-white/20', bar: 'border-panel-header/10', width: 'w-5/6', delay: '[animation-delay:400ms]' },
];

export const LogSkeleton = () => (
  <div className="flex flex-col gap-4 w-full">
    {SKELETON_BLOCKS.map((b, i) => (
      <div
        key={i}
        className={`${b.bg} p-4 rounded-xl border-l-4 ${b.bar} animate-pulse ${b.delay}`}
      >
        <div className={`h-3 ${b.width} bg-zinc-200 rounded`} />
      </div>
    ))}
  </div>
);

export default LogSkeleton;