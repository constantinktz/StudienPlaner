import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useCourses } from '@/hooks/useCourses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Loader2, RefreshCw, Trash2, Link2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '@/types/auth';

const profileSchema = z.object({
  courseKey: z.string().min(1, 'Pflichtfeld'),
  currentSemester: z.number().int().min(1).max(14),
  studentGroup: z.string().min(1, 'Pflichtfeld'),
});

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Pflichtfeld'),
    newPassword: z.string().min(6, 'Mindestens 6 Zeichen'),
    confirmPassword: z.string().min(6, 'Pflichtfeld'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

const portalSchema = z.object({
  username: z.string().min(1, 'Pflichtfeld'),
  password: z.string().min(1, 'Pflichtfeld'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PwForm = z.infer<typeof pwSchema>;
type PortalForm = z.infer<typeof portalSchema>;

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

export default function Settings() {
  const { user, setUser, clearUser } = useAuthStore();
  const { data: courses } = useCourses();
  const navigate = useNavigate();
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      courseKey: user?.courseKey ?? '',
      currentSemester: user?.currentSemester ?? 1,
      studentGroup: user?.studentGroup ?? '',
    },
  });

  const pwForm = useForm<PwForm>({ resolver: zodResolver(pwSchema) });
  const portalForm = useForm<PortalForm>({ resolver: zodResolver(portalSchema) });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const res = await api.put<UserProfile>('/api/user/profile', data);
      setUser(res.data);
      toast.success('Profil aktualisiert');
    } catch {
      // handled
    }
  };

  const onPwSubmit = async (data: PwForm) => {
    try {
      await api.put('/api/user/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Passwort geändert');
      setPwDialogOpen(false);
      pwForm.reset();
    } catch {
      // handled
    }
  };

  const onPortalSubmit = async (data: PortalForm) => {
    try {
      await api.post('/api/auth/portal-login', data);
      toast.success('FH-Portal verbunden');
      setPortalDialogOpen(false);
      portalForm.reset();
    } catch {
      // handled
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.delete('/api/portal/connection');
      toast.success('FH-Portal getrennt');
    } catch {
      // handled
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/user/account');
      clearUser();
      navigate('/login');
      toast.success('Konto gelöscht');
    } catch {
      // handled
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Studiengang und Semester</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <Label>E-Mail</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
            <div>
              <Label>Studiengang</Label>
              <Select {...profileForm.register('courseKey')}>
                <option value="">Bitte wählen…</option>
                {courses?.map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Aktuelles Semester</Label>
              <Input type="number" min={1} max={14} {...profileForm.register('currentSemester', { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Studiengruppe</Label>
              <Select {...profileForm.register('studentGroup')}>
                <option value="">Bitte wählen…</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>Gruppe {g}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Portal card */}
      <Card>
        <CardHeader>
          <CardTitle>FH-Portal</CardTitle>
          <CardDescription>Verbindung zum FH-Portal für Notensynchronisierung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {user?.portalConnected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Verbunden</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-gray-500">Nicht verbunden</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPortalDialogOpen(true)}>
              <Link2 className="h-4 w-4" />
              {user?.portalConnected ? 'Neu verbinden' : 'Verbinden'}
            </Button>
            {user?.portalConnected && (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-red-600 hover:text-red-700"
              >
                {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Trennen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account card */}
      <Card>
        <CardHeader>
          <CardTitle>Konto</CardTitle>
          <CardDescription>Passwort und Kontoverwaltung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-gray-500">E-Mail-Adresse</p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPwDialogOpen(true)}>
              Passwort ändern
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Konto löschen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password dialog */}
      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent onClose={() => setPwDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Passwort ändern</DialogTitle>
          </DialogHeader>
          <form onSubmit={pwForm.handleSubmit(onPwSubmit)} className="space-y-4">
            <div>
              <Label>Aktuelles Passwort</Label>
              <Input type="password" {...pwForm.register('currentPassword')} />
              {pwForm.formState.errors.currentPassword && (
                <p className="mt-1 text-xs text-red-600">{pwForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <Label>Neues Passwort</Label>
              <Input type="password" {...pwForm.register('newPassword')} />
              {pwForm.formState.errors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{pwForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <Label>Bestätigen</Label>
              <Input type="password" {...pwForm.register('confirmPassword')} />
              {pwForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{pwForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPwDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={pwForm.formState.isSubmitting}>
                {pwForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Ändern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Portal login dialog */}
      <Dialog open={portalDialogOpen} onOpenChange={setPortalDialogOpen}>
        <DialogContent onClose={() => setPortalDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>FH-Portal verbinden</DialogTitle>
          </DialogHeader>
          <form onSubmit={portalForm.handleSubmit(onPortalSubmit)} className="space-y-4">
            <div>
              <Label>Benutzername</Label>
              <Input placeholder="m12345678" {...portalForm.register('username')} />
            </div>
            <div>
              <Label>Passwort</Label>
              <Input type="password" {...portalForm.register('password')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPortalDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={portalForm.formState.isSubmitting}>
                {portalForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Verbinden
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete account confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount}>
              Konto löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
