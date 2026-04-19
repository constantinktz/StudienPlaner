import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
  username: z.string().min(1, 'Pflichtfeld'),
  password: z.string().min(1, 'Pflichtfeld'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onNext: () => void;
  onSkip: () => void;
  saving: boolean;
}

export function StepPortalLogin({ onNext, onSkip, saving }: Props) {
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleTest = handleSubmit(async (data) => {
    setTesting(true);
    setTestStatus('idle');
    try {
      await api.post('/api/auth/portal-login', data);
      setTestStatus('success');
    } catch {
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          Deine FH-Portal-Zugangsdaten werden verschlüsselt übertragen und nur zur Synchronisierung
          deiner Noten verwendet. Sie werden nicht dauerhaft gespeichert.
        </p>
      </div>

      <div>
        <Label htmlFor="username">FH-Portal Benutzername</Label>
        <Input id="username" placeholder="m12345678" {...register('username')} />
        {errors.username && (
          <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {testStatus === 'success' && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Verbindung erfolgreich!</span>
        </div>
      )}
      {testStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">Verbindung fehlgeschlagen. Bitte Zugangsdaten prüfen.</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-500 hover:underline"
        >
          Überspringen
        </button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleTest} disabled={testing || saving}>
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Verbindung testen
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Fertig
          </Button>
        </div>
      </div>
    </div>
  );
}
