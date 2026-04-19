import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, startOfDay, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';
import { useModules } from '@/hooks/useModules';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useMySchedule } from '@/hooks/useMySchedule';
import { getGreeting, getGradeColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { EctsProgressBar } from '@/components/modules/EctsProgressBar';
import { BookOpen, GraduationCap, TrendingUp, Bell, Clock, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: modules, stats } = useModules();
  const { active: recommendations } = useRecommendations();
  const { data: scheduleData } = useMySchedule();

  const todayEvents = useMemo(() => {
    if (!scheduleData?.events) return [];
    return scheduleData.events
      .filter((e) => isToday(new Date(e.startTime)))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [scheduleData]);

  const passedCount = useMemo(() => modules?.filter((m) => m.status === 'passed').length ?? 0, [modules]);

  const weekDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 5 }, (_, i) => {
      const day = addDays(today, i);
      const dayEvents = scheduleData?.events.filter((e) => {
        const d = startOfDay(new Date(e.startTime));
        return d.getTime() === day.getTime();
      }) ?? [];
      return { day, events: dayEvents };
    });
  }, [scheduleData]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, {user?.email?.split('@')[0] ?? 'Student'}! 👋
        </h1>
        <p className="text-gray-500">Semester {user?.currentSemester ?? '–'} · {user?.courseKey ?? '–'}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ECTS Fortschritt</p>
                <p className="text-xl font-bold">{stats.earnedEcts} / {stats.totalEcts}</p>
              </div>
            </div>
            <div className="mt-3">
              <EctsProgressBar earned={stats.earnedEcts} total={stats.totalEcts} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Bestandene Module</p>
                <p className="text-xl font-bold">{passedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Notendurchschnitt</p>
                <p className={`text-xl font-bold ${getGradeColor(stats.averageGrade)}`}>
                  {stats.averageGrade !== null ? stats.averageGrade.toFixed(2) : '–'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Empfehlungen</p>
                <p className="text-xl font-bold">{recommendations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Heute — {format(new Date(), 'EEEE, dd. MMMM', { locale: de })}
                </CardTitle>
                <Link to="/schedule" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  Stundenplan <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {todayEvents.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">Heute keine Veranstaltungen</p>
              ) : (
                <div className="space-y-2">
                  {todayEvents.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-md border border-gray-100 p-3 dark:border-gray-700"
                    >
                      <div className="text-sm font-medium text-gray-500 w-20 flex-shrink-0">
                        {format(new Date(e.startTime), 'HH:mm')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{e.title}</p>
                        <p className="text-xs text-gray-500">{e.room} {e.lecturer && `· ${e.lecturer}`}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {e.eventType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Week strip */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-5 gap-2">
                {weekDays.map(({ day, events }) => (
                  <div key={day.toISOString()} className="text-center">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {format(day, 'EEE', { locale: de })}
                    </p>
                    <p className="text-sm font-bold mb-2">{format(day, 'd')}</p>
                    <div className="flex flex-col gap-0.5 items-center">
                      {events.slice(0, 4).map((e) => (
                        <div key={e.id} className="h-1.5 w-6 rounded-full bg-blue-400" title={e.title} />
                      ))}
                      {events.length > 4 && (
                        <span className="text-xs text-gray-400">+{events.length - 4}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Empfehlungen</CardTitle>
                <Link to="/planner" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  Alle <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">Keine offenen Empfehlungen 🎉</p>
              ) : (
                <div className="space-y-2">
                  {recommendations.slice(0, 3).map((r) => (
                    <RecommendationCard key={r.id} recommendation={r} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
