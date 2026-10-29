import type { Prayer, PrayerSession, PrayerUpdate } from '@/lib/types';

export type UpdateType = 'update' | 'reflection';

export interface PrayerUpdateRow extends PrayerUpdate {
  update_type?: UpdateType;
}

export type JourneyEventKind = 'began' | 'prayed' | 'update' | 'reflection' | 'answered';

export interface JourneyEvent {
  id: string;
  kind: JourneyEventKind;
  at: string;
  body: string | null;
  editable: boolean;
}

export function buildJourneyEvents(
  prayer: Prayer,
  sessions: PrayerSession[],
  updates: PrayerUpdateRow[],
): JourneyEvent[] {
  const events: JourneyEvent[] = [
    { id: `began-${prayer.id}`, kind: 'began', at: prayer.started_at || prayer.created_at, body: null, editable: false },
  ];

  for (const session of sessions) {
    events.push({ id: `prayed-${session.id}`, kind: 'prayed', at: session.prayed_at, body: null, editable: false });
  }

  const reflections = updates.filter((u) => u.update_type === 'reflection');
  const latestReflectionId = reflections.length > 0 ? reflections[reflections.length - 1].id : null;
  for (const update of updates) {
    const isReflection = update.update_type === 'reflection';
    events.push({
      id: update.id,
      kind: isReflection ? 'reflection' : 'update',
      at: update.created_at,
      body: update.body,
      editable: update.id === latestReflectionId,
    });
  }

  if (prayer.status === 'answered' && prayer.closed_at) {
    events.push({ id: `answered-${prayer.id}`, kind: 'answered', at: prayer.closed_at, body: null, editable: false });
  }

  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
