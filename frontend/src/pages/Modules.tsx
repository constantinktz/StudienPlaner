import { useModules } from '@/hooks/useModules';
import { usePortalSync } from '@/hooks/usePortalSync';
import { ModuleTable } from '@/components/modules/ModuleTable';
import { EctsProgressBar } from '@/components/modules/EctsProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Loader2 } from 'lucide-react';
import { formatDateTime, getGradeColor } from '@/lib/utils';

export default function Modules() {
  const { data: modules, isLoading, stats } = useModules();
  const { mutate: sync, isPending: syncing } = usePortalSync();

  const lastSync = modules?.[0]?.syncedAt;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Module</h1>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-sm text-gray-500">
              Zuletzt synchronisiert: {formatDateTime(lastSync)}
            </span>
          )}
          <Button onClick={() => sync()} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Synchronisieren
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <EctsProgressBar earned={stats.earnedEcts} total={stats.totalEcts} />
        </CardContent>
      </Card>

      {/* Grades summary */}
      {stats.averageGrade !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Notenübersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-500">Notendurchschnitt</p>
                <p className={`text-3xl font-bold ${getGradeColor(stats.averageGrade)}`}>
                  {stats.averageGrade.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bestanden</p>
                <p className="text-3xl font-bold text-green-600">
                  {modules?.filter((m) => m.status === 'passed').length ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nicht bestanden</p>
                <p className="text-3xl font-bold text-red-600">
                  {modules?.filter((m) => m.status === 'failed').length ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Eingeschrieben</p>
                <p className="text-3xl font-bold text-blue-600">
                  {modules?.filter((m) => m.status === 'enrolled').length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !modules || modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="mb-2 text-lg font-medium">Keine Module gefunden</p>
          <p className="text-sm">Synchronisiere dein FH-Portal um Module zu laden.</p>
        </div>
      ) : (
        <ModuleTable modules={modules} />
      )}
    </div>
  );
}
