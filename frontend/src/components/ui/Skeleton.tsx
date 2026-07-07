import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx('skeleton', className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className={`w-full skeleton rounded-xl`} style={{ height }} />
  );
}

export function UploadCardSkeleton() {
  return (
    <div className="card flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export default Skeleton;
