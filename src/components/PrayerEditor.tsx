import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import type { Prayer } from '@/lib/types';
import type { PrayerCopy } from '@/lib/prayerCopy';

interface Props {
  prayer: Prayer;
  copy: PrayerCopy;
  viewportHeight: number;
  onSaved: (prayer: Prayer) => void;
  onCancel: () => void;
}

export default function PrayerEditor({ prayer, copy, viewportHeight, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(prayer.title);
  const [description, setDescription] = useState(prayer.description || '');
  const [scripture, setScripture] = useState(prayer.related_scripture || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    vibrate(10);

    const requested = {
      title: title.trim(),
      description: description.trim() || null,
      related_scripture: scripture.trim() || null,
    };

    const { data, error: updateError } = await supabase
      .from('prayers')
      .update({ ...requested, updated_at: new Date().toISOString() })
      .eq('id', prayer.id)
      .select('*')
      .single();

    setSaving(false);

    const persisted = data as Prayer | null;
    const matches =
      !!persisted &&
      persisted.id === prayer.id &&
      persisted.title === requested.title &&
      (persisted.description || null) === requested.description &&
      (persisted.related_scripture || null) === requested.related_scripture;

    if (updateError || !persisted || !matches) {
      setError(copy.editSaveError);
      return;
    }

    onSaved(persisted);
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-ink-950 bg-parchment flex flex-col"
      style={{ height: `${viewportHeight}px` }}
    >
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onCancel} className="btn-ghost text-sm">
          {copy.cancel}
        </button>
        <p className="ui-label">{copy.editPrayerTitle}</p>
        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="btn-ghost text-sm text-gold-300 disabled:opacity-30"
        >
          {saving ? copy.saving : copy.save}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6">
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-ivory-400 mb-2 block">{copy.titleLabel}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={copy.titlePlaceholder}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm text-ivory-400 mb-2 block">{copy.descriptionLabel}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={copy.descriptionPlaceholder}
              className="input-field min-h-[120px] resize-none"
            />
          </div>
          <div>
            <label className="text-sm text-ivory-400 mb-2 block">{copy.scriptureLabel}</label>
            <input
              type="text"
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              placeholder={copy.scripturePlaceholder}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-6 pb-2">
          <p className="text-error text-sm text-center">{error}</p>
        </div>
      )}
      <div className="shrink-0 safe-bottom" />
    </div>
  );
}
