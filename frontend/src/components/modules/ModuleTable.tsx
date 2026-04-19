import { useState, useMemo } from 'react';
import type { Module, ModuleStatus } from '@/types/modules';
import { ModuleStatusBadge } from './ModuleStatusBadge';
import { ModuleDetailDrawer } from './ModuleDetailDrawer';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getGradeColor } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

type SortField = 'name' | 'credits' | 'semesterPlanned' | 'grade' | 'status';
type SortDir = 'asc' | 'desc';

interface Props {
  modules: Module[];
}

export function ModuleTable({ modules }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ModuleStatus | ''>('');
  const [semFilter, setSemFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Module | null>(null);

  const filtered = useMemo(() => {
    return modules
      .filter((m) => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.key.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || m.status === statusFilter;
        const matchSem = !semFilter || String(m.semesterPlanned) === semFilter;
        return matchSearch && matchStatus && matchSem;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'credits') cmp = a.credits - b.credits;
        else if (sortField === 'semesterPlanned') cmp = (a.semesterPlanned ?? 99) - (b.semesterPlanned ?? 99);
        else if (sortField === 'grade') cmp = (a.grade ?? 99) - (b.grade ?? 99);
        else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [modules, search, statusFilter, semFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const semesters = useMemo(() => {
    const s = new Set(modules.map((m) => m.semesterPlanned).filter(Boolean));
    return Array.from(s).sort((a, b) => (a ?? 0) - (b ?? 0));
  }, [modules]);

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Suche nach Name oder Key…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ModuleStatus | '')} className="w-44">
          <option value="">Alle Status</option>
          <option value="open">Offen</option>
          <option value="enrolled">Eingeschrieben</option>
          <option value="passed">Bestanden</option>
          <option value="failed">Nicht bestanden</option>
          <option value="planned">Geplant</option>
        </Select>
        <Select value={semFilter} onChange={(e) => setSemFilter(e.target.value)} className="w-36">
          <option value="">Alle Semester</option>
          {semesters.map((s) => (
            <option key={s} value={String(s)}>Semester {s}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {([
                ['name', 'Modulname'],
                ['credits', 'ECTS'],
                ['semesterPlanned', 'Sem.'],
                ['grade', 'Note'],
                ['status', 'Status'],
              ] as [SortField, string][]).map(([field, label]) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="cursor-pointer select-none px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon field={field} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Keine Module gefunden
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr
                key={m.key}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => setSelected(m)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.key}</div>
                </td>
                <td className="px-4 py-3">{m.credits}</td>
                <td className="px-4 py-3">{m.semesterPlanned ?? '–'}</td>
                <td className="px-4 py-3">
                  {m.grade !== null ? (
                    <span className={`font-semibold ${getGradeColor(m.grade)}`}>
                      {m.grade.toFixed(1)}
                    </span>
                  ) : '–'}
                </td>
                <td className="px-4 py-3">
                  <ModuleStatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => { e.stopPropagation(); setSelected(m); }}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModuleDetailDrawer
        module={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
