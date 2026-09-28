const SKELETON_BLOCKS = [
  { opacity: 'opacity-40', width: 'w-3/4', delay: '' },
  { opacity: 'opacity-25', width: 'w-1/2', delay: '[animation-delay:200ms]' },
  { opacity: 'opacity-15', width: 'w-5/6', delay: '[animation-delay:400ms]' },
];

export const LogSkeleton = () => (
  <div className="flex flex-col gap-4 w-full">
    {SKELETON_BLOCKS.map((b, i) => (
      <div
        key={i}
        className={`p-4 rounded-xl border-l-4 border-theme-divider animate-pulse ${b.opacity} ${b.delay}`}
        style={{ backgroundColor: 'var(--p-header-bg)' }}
      >
        <div className={`h-3 ${b.width} rounded`} style={{ backgroundColor: 'var(--p-text)', opacity: 0.2 }} />
      </div>
    ))}
  </div>
);

export default LogSkeleton;