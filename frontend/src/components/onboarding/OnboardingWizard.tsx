import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepMatrikel } from './StepMatrikel';
import { StepPortalLogin } from './StepPortalLogin';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/auth';

const STEPS = ['Matrikelnummer', 'Studiengang', 'FH-Portal'];

interface OnboardingData {
  matrikelNumber: string;
  courseKey: string;
  currentSemester: number;
  studentGroup: string;
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const handleNext = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleFinish = async () => {
    setSaving(true);
    try {
      const res = await api.put<UserProfile>('/api/user/profile', {
        matrikelNumber: data.matrikelNumber,
        courseKey: data.courseKey,
        currentSemester: data.currentSemester,
        studentGroup: data.studentGroup,
      });
      setUser(res.data);
      toast.success('Profil gespeichert!');
      navigate('/');
    } catch {
      toast.error('Fehler beim Speichern des Profils');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Schritt {step + 1} von {STEPS.length}</span>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    i <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>

        <CardContent>
          {step === 0 && (
            <StepMatrikel
              initial={data}
              onNext={(d) => handleNext(d)}
            />
          )}
          {step === 1 && (
            <StepMatrikel
              initial={data}
              onNext={(d) => handleNext(d)}
              courseStep
            />
          )}
          {step === 2 && (
            <StepPortalLogin
              onNext={() => handleFinish()}
              onSkip={() => handleFinish()}
              saving={saving}
            />
          )}

          {step < 2 && (
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={step === 0}>
                Zurück
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
