import { getStoredAppLanguage } from './i18n';

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  const es = getStoredAppLanguage() === 'es';
  if (hour < 5) return es ? 'Aún despierto' : 'Still awake';
  if (hour < 12) return es ? 'Buenos días' : 'Good morning';
  if (hour < 17) return es ? 'Buenas tardes' : 'Good afternoon';
  if (hour < 21) return es ? 'Buenas tardes' : 'Good evening';
  return es ? 'Buenas noches' : 'Good night';
}

export function getMoodLabel(mood: string): string {
  const en: Record<string, string> = {
    ready: 'Ready',
    heavy: 'Heavy',
    worried: 'Worried',
    discouraged: 'Discouraged',
    grateful: 'Grateful',
    questioning: 'Questioning',
    motivated: 'Motivated',
  };
  const es: Record<string, string> = {
    ready: 'Listo',
    heavy: 'Cargado',
    worried: 'Preocupado',
    discouraged: 'Desanimado',
    grateful: 'Agradecido',
    questioning: 'Con preguntas',
    motivated: 'Motivado',
  };
  const labels = getStoredAppLanguage() === 'es' ? es : en;
  return labels[mood] ?? mood;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const locale = getStoredAppLanguage() === 'es' ? 'es-US' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  const es = getStoredAppLanguage() === 'es';
  if (diffMin < 1) return es ? 'ahora mismo' : 'just now';
  if (diffMin < 60) return es ? `hace ${diffMin} min` : `${diffMin}m ago`;
  if (diffHr < 24) return es ? `hace ${diffHr} h` : `${diffHr}h ago`;
  if (diffDay < 7) return es ? `hace ${diffDay} d` : `${diffDay}d ago`;
  return formatDate(dateStr);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function vibrate(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
