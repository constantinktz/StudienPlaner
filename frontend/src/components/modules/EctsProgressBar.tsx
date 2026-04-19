import { Progress } from '@/components/ui/progress';

interface Props {
  earned: number;
  total: number;
}

export function EctsProgressBar({ earned, total }: Props) {
  const pct = total > 0 ? (earned / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{earned} / {total} ECTS</span>
        <span className="text-gray-500">{Math.round(pct)} %</span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
