import { MapPin, Pencil, Church } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
export default function ChurchSourceBadge({ source, mine = false }: { source?: string; mine?: boolean }) {
  const { language } = useLanguage();
  const maps = source === 'apple_maps';
  const manual = source === 'user_created' || source === 'released';
  const Icon = maps ? MapPin : manual ? Pencil : Church;
  const label = maps ? ['Found via Apple Maps', 'Encontrada en Apple Maps'] : mine ? ['Created by you', 'Creada por ti'] : manual ? ['Manually added', 'Agregada manualmente'] : ['SOLAPATH directory', 'Directorio SOLAPATH'];
  return <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${maps ? 'bg-blue-50 text-blue-900' : 'bg-amber-50 text-amber-900'}`}><Icon size={13} aria-hidden="true" />{label[language === 'es' ? 1 : 0]}</span>;
}
