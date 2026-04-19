import { StudyPlanBoard } from '@/components/planner/StudyPlanBoard';
import { RecommendationFeed } from '@/components/recommendations/RecommendationFeed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

export default function Planner() {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.post('/api/planner/analyze');
      queryClient.invalidateQueries({ queryKey: ['planner'] });
      toast.success('Analyse abgeschlossen');
    } catch {
      // handled by interceptor
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mein Studienplan</h1>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analyse starten
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Board */}
        <div className="flex-1 min-w-0">
          <StudyPlanBoard />
        </div>

        {/* Sidebar recommendations */}
        <div className="w-72 flex-shrink-0 hidden xl:block">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Empfehlungen</CardTitle>
            </CardHeader>
            <CardContent>
              <RecommendationFeed maxPriority={2} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
