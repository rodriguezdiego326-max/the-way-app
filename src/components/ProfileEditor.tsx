import { useEffect, useState } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import {
  lifeStageOptions,
  lifeAreaOptions,
  growthAreaOptions,
  familiarityOptions,
  depthOptions,
  timeOptions,
  translations,
  studyOptions,
  seasonOptions,
} from '@/lib/profileOptions';
import type { Profile, TheologicalDepth, LifeStage, LifeArea, GrowthArea, Familiarity } from '@/lib/types';

interface ProfileEditorProps {
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProfileEditor({ profile, onClose, onSaved }: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [season, setSeason] = useState(profile.season || '');
  const [seasonText, setSeasonText] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedGrowth, setSelectedGrowth] = useState<string[]>([]);
  const [translation, setTranslation] = useState(profile.preferred_translation || 'ESV');
  const [depth, setDepth] = useState<TheologicalDepth>(profile.theological_depth);
  const [availableTime, setAvailableTime] = useState(profile.available_time_minutes || 7);
  const [bibleFamiliarity, setBibleFamiliarity] = useState(profile.bible_familiarity || 'new');
  const [reformedFamiliarity, setReformedFamiliarity] = useState(profile.reformed_familiarity || 'new');
  const [currentStudy, setCurrentStudy] = useState(profile.current_study || 'None currently');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    const [stagesRes, areasRes, growthRes] = await Promise.all([
      supabase.from('life_stages').select('*').eq('profile_id', profile.id),
      supabase.from('life_areas').select('*').eq('profile_id', profile.id),
      supabase.from('growth_areas').select('*').eq('profile_id', profile.id),
    ]);

    setSelectedStages(((stagesRes.data as LifeStage[]) || []).map((s) => s.stage));
    setSelectedAreas(((areasRes.data as LifeArea[]) || []).map((a) => a.area));
    setSelectedGrowth(((growthRes.data as GrowthArea[]) || []).map((g) => g.area));

    // If season is not in predefined options, it's a custom text
    if (profile.season && !seasonOptions.includes(profile.season)) {
      setSeason('Other');
      setSeasonText(profile.season);
    }
  }

  function toggleArray(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  async function save() {
    setSaving(true);
    vibrate(12);

    const finalSeason = season === 'Other' ? seasonText.trim() : season;

    await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      season: finalSeason || null,
      preferred_translation: translation,
      theological_depth: depth,
      available_time_minutes: availableTime,
      bible_familiarity: bibleFamiliarity,
      reformed_familiarity: reformedFamiliarity,
      current_study: currentStudy === 'None currently' ? null : currentStudy,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    // Sync multi-select tables
    await syncMultiSelect('life_stages', 'stage', selectedStages, profile.id);
    await syncMultiSelect('life_areas', 'area', selectedAreas, profile.id);
    await syncMultiSelect('growth_areas', 'area', selectedGrowth, profile.id);

    setSaving(false);
    onSaved();
    onClose();
  }

  async function syncMultiSelect(table: string, column: string, values: string[], profileId: string) {
    // Delete existing
    await supabase.from(table).delete().eq('profile_id', profileId);
    // Insert new
    if (values.length > 0) {
      const rows = values.map((v) => ({ profile_id: profileId, [column]: v }));
      await supabase.from(table).insert(rows);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onClose} className="btn-ghost">
          <X size={20} />
        </button>
        <p className="ui-label">Life & Faith Profile</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Name */}
        <section className="mb-6">
          <p className="ui-label mb-3">Name</p>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="input-field"
          />
        </section>

        {/* Life Stages */}
        <section className="mb-6">
          <p className="ui-label mb-3">Life Stage (select all that apply)</p>
          <div className="flex flex-wrap gap-2">
            {lifeStageOptions.map((stage) => (
              <button
                key={stage}
                onClick={() => {
                  vibrate(6);
                  setSelectedStages(toggleArray(selectedStages, stage));
                }}
                className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                  selectedStages.includes(stage)
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </section>

        {/* Life Areas */}
        <section className="mb-6">
          <p className="ui-label mb-3">Current Life Areas (select all that apply)</p>
          <div className="flex flex-wrap gap-2">
            {lifeAreaOptions.map((area) => (
              <button
                key={area}
                onClick={() => {
                  vibrate(6);
                  setSelectedAreas(toggleArray(selectedAreas, area));
                }}
                className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                  selectedAreas.includes(area)
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </section>

        {/* Current Season */}
        <section className="mb-6">
          <p className="ui-label mb-3">Current Season</p>
          <p className="text-ivory-500 text-xs mb-3">
            Describe what is happening in your life. This is only stored if you choose.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {seasonOptions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  vibrate(6);
                  setSeason(s);
                  if (s !== 'Other') setSeasonText('');
                }}
                className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                  season === s
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {season === 'Other' && (
            <textarea
              value={seasonText}
              onChange={(e) => setSeasonText(e.target.value)}
              placeholder="Starting a business and trying to trust God through uncertainty."
              className="input-field min-h-[80px] resize-none text-sm"
            />
          )}
        </section>

        {/* Growth Areas */}
        <section className="mb-6">
          <p className="ui-label mb-3">Areas of Growth (select all that apply)</p>
          <div className="flex flex-wrap gap-2">
            {growthAreaOptions.map((area) => (
              <button
                key={area}
                onClick={() => {
                  vibrate(6);
                  setSelectedGrowth(toggleArray(selectedGrowth, area));
                }}
                className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                  selectedGrowth.includes(area)
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </section>

        {/* Bible Familiarity */}
        <section className="mb-6">
          <p className="ui-label mb-3">Bible Familiarity</p>
          <div className="flex flex-col gap-2">
            {familiarityOptions.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  vibrate(6);
                  setBibleFamiliarity(f.value);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left no-tap-highlight ${
                  bibleFamiliarity === f.value
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {f.label}
                {bibleFamiliarity === f.value && <Check size={16} className="text-gold-300" />}
              </button>
            ))}
          </div>
        </section>

        {/* Reformed Theology Familiarity */}
        <section className="mb-6">
          <p className="ui-label mb-3">Reformed Theology Familiarity</p>
          <div className="flex flex-col gap-2">
            {familiarityOptions.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  vibrate(6);
                  setReformedFamiliarity(f.value);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left no-tap-highlight ${
                  reformedFamiliarity === f.value
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {f.label}
                {reformedFamiliarity === f.value && <Check size={16} className="text-gold-300" />}
              </button>
            ))}
          </div>
        </section>

        {/* Study Depth */}
        <section className="mb-6">
          <p className="ui-label mb-3">Preferred Study Depth</p>
          <div className="flex flex-col gap-2">
            {depthOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  vibrate(6);
                  setDepth(opt.value as TheologicalDepth);
                }}
                className={`flex flex-col items-start gap-1 px-4 py-3.5 rounded-xl border text-left transition-all no-tap-highlight ${
                  depth === opt.value
                    ? 'bg-gold-500/10 border-gold-500/40'
                    : 'bg-ink-800/40 border-ink-700/40 hover:border-ink-600'
                }`}
              >
                <span className={`font-medium text-sm ${depth === opt.value ? 'text-ivory-50' : 'text-ivory-200'}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-ivory-500">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Translation */}
        <section className="mb-6">
          <p className="ui-label mb-3">Preferred Bible Translation</p>
          <div className="grid grid-cols-3 gap-2">
            {translations.map((t) => (
              <button
                key={t}
                onClick={() => {
                  vibrate(6);
                  setTranslation(t);
                }}
                className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                  translation === t
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-ivory-600 text-xs mt-2">
            SOLAPATH does not store copyrighted Bible text. References are used without storing translation text.
          </p>
        </section>

        {/* Current Study */}
        <section className="mb-6">
          <p className="ui-label mb-3">Current Bible Study</p>
          <div className="flex flex-col gap-2">
            {studyOptions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  vibrate(6);
                  setCurrentStudy(s);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left no-tap-highlight ${
                  currentStudy === s
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {s}
                {currentStudy === s && <Check size={16} className="text-gold-300" />}
              </button>
            ))}
          </div>
        </section>

        {/* Available Time */}
        <section className="mb-6">
          <p className="ui-label mb-3">Available Devotional Time</p>
          <div className="flex flex-wrap gap-2">
            {timeOptions.map((t) => (
              <button
                key={t}
                onClick={() => {
                  vibrate(6);
                  setAvailableTime(t);
                }}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                  availableTime === t
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {t === 30 ? '30+ min' : `${t} min`}
                </button>
            ))}
          </div>
          <p className="text-ivory-600 text-xs mt-2">
            SOLAPATH adapts Today's Walk to your available time — a 2-minute Walk is intentionally short, not a truncated study.
          </p>
        </section>
      </div>

      <div className="px-6 pb-10 safe-bottom shrink-0">
        <button onClick={save} disabled={saving} className="btn-primary w-full disabled:opacity-40">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
