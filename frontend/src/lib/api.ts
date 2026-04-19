import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    } else {
      const message: string =
        error.response?.data?.message ?? error.message ?? 'Ein Fehler ist aufgetreten';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
