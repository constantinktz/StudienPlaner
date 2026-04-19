import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { AuthResponse, UserProfile } from '@/types/auth';

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post<AuthResponse>('/api/auth/login', data);
      const profileRes = await api.get<UserProfile>('/api/user/profile');
      setUser(profileRes.data);
      toast.success('Willkommen zurück!');
      navigate('/');
    } catch {
      // error toast handled by interceptor
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <GraduationCap className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle>Anmelden</CardTitle>
          <CardDescription>StudienPlaner — FH Dortmund</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Anmelden
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Registrieren
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
