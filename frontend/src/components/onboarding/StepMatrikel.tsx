import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCourses } from '@/hooks/useCourses';

const matrikelSchema = z.object({
  matrikelNumber: z.string().regex(/^\d{7}$/, 'Matrikelnummer muss 7 Ziffern haben'),
  courseKey: z.string().min(1, 'Bitte Studiengang wählen'),
  currentSemester: z.number().int().min(1).max(14),
  studentGroup: z.string().min(1, 'Bitte Gruppe wählen'),
});

type FormValues = z.infer<typeof matrikelSchema>;

interface Props {
  initial: Partial<FormValues>;
  onNext: (data: FormValues) => void;
  courseStep?: boolean;
}

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

export function StepMatrikel({ initial, onNext, courseStep: _courseStep }: Props) {
  const { data: courses, isLoading: loadingCourses } = useCourses();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(matrikelSchema),
    defaultValues: {
      matrikelNumber: initial.matrikelNumber ?? '',
      courseKey: initial.courseKey ?? '',
      currentSemester: initial.currentSemester ?? 1,
      studentGroup: initial.studentGroup ?? '',
    },
  });

  const matrikelNumber = watch('matrikelNumber');

  useEffect(() => {
    if (matrikelNumber?.length === 7 && courses?.length) {
      // Auto-detect could happen here based on matrikel prefix
    }
  }, [matrikelNumber, courses]);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <Label htmlFor="matrikel">Matrikelnummer</Label>
        <Input
          id="matrikel"
          placeholder="1234567"
          maxLength={7}
          {...register('matrikelNumber')}
        />
        {errors.matrikelNumber && (
          <p className="mt-1 text-xs text-red-600">{errors.matrikelNumber.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="course">Studiengang</Label>
        <Select id="course" {...register('courseKey')} disabled={loadingCourses}>
          <option value="">Bitte wählen…</option>
          {courses?.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </Select>
        {errors.courseKey && (
          <p className="mt-1 text-xs text-red-600">{errors.courseKey.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="semester">Aktuelles Semester</Label>
        <Input
          id="semester"
          type="number"
          min={1}
          max={14}
          {...register('currentSemester', { valueAsNumber: true })}
        />
        {errors.currentSemester && (
          <p className="mt-1 text-xs text-red-600">{errors.currentSemester.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="group">Studiengruppe</Label>
        <Select id="group" {...register('studentGroup')}>
          <option value="">Bitte wählen…</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              Gruppe {g}
            </option>
          ))}
        </Select>
        {errors.studentGroup && (
          <p className="mt-1 text-xs text-red-600">{errors.studentGroup.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit">Weiter</Button>
      </div>
    </form>
  );
}
