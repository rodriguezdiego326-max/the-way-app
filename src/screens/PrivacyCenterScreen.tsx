import { useState, useCallback } from 'react';
import { X, Shield, Download, Trash2, Brain, Heart, BookOpen, Users, Church, BookHeart, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { exportUserData, deleteAccount } from '@/lib/productionEngine';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
}

type Section = 'main' | 'stores' | 'ai_data' | 'download' | 'delete';

export default function PrivacyCenterScreen({ profile, onBack }: Props) {
  const [section, setSection] = useState<Section>('main');
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<Record<string, unknown> | null>(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const data = await exportUserData(profile.id);
      setExportData(data);
      vibrate(10);
    } catch {
      console.error('Export failed');
    } finally {
      setExporting(false);
    }
  }, [profile.id]);

  const handleDownload = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-way-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    vibrate(10);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    vibrate(20);
    try {
      const success = await deleteAccount(profile.id);
      if (success) {
        // Clear all local drafts and reload
        localStorage.clear();
        window.location.reload();
      }
    } catch {
      console.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const sections = [
    { icon: Shield, label: 'What SOLAPATH Stores', desc: 'Understand your data', onClick: () => setSection('stores') },
    { icon: Brain, label: 'AI & My Data', desc: 'How AI uses your context', onClick: () => setSection('ai_data') },
    { icon: Download, label: 'Download My Data', desc: 'Export your data as JSON', onClick: () => setSection('download') },
    { icon: Trash2, label: 'Delete My Account', desc: 'Permanently remove your data', onClick: () => setSection('delete') },
  ];

  if (section === 'stores') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSection('main')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">What SOLAPATH Stores</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up space-y-3">
            <DataCategory icon={Users} title="Account Information" desc="Your display name, life stage, season, preferred translation, theological depth, and onboarding settings." visibility="PRIVATE" />
            <DataCategory icon={Brain} title="What SOLAPATH Remembers" desc="Memories derived from your walks, prayers, reflections, and check-ins. You can view, disable, or delete all memories." visibility="PRIVATE" />
            <DataCategory icon={Heart} title="Prayers" desc="Your prayer requests, updates, and status. Prayers are private unless you explicitly share them in a Circle." visibility="PRIVATE" />
            <DataCategory icon={BookOpen} title="Ask SOLAPATH Conversations" desc="Your questions and AI responses. These are private and never shared with Circles, Church, or accountability partners." visibility="PRIVATE" />
            <DataCategory icon={Users} title="Family Records" desc="Family Walks, family prayers, children's questions, and parent reflections. Parent-controlled with heightened child privacy." visibility="PRIVATE" />
            <DataCategory icon={Heart} title="REACH Records" desc="People you're praying for and gospel conversation notes. Minimized third-party data — no addresses or phone numbers required." visibility="PRIVATE" />
            <DataCategory icon={Users} title="Circle Shared Records" desc="Prayers and reflections you choose to share within a Circle. Only visible to Circle members." visibility="CIRCLE" />
            <DataCategory icon={Church} title="Church Records" desc="Sermon notes and church-related reflections you create. Church admins cannot access your private data." visibility="PRIVATE" />
            <DataCategory icon={BookHeart} title="Legacy Records" desc="Your intentional permanent record — events, seasons, letters, milestones, testimony. Fully private unless you explicitly share." visibility="PRIVATE" />
          </div>
        </div>
      </div>
    );
  }

  if (section === 'ai_data') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSection('main')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">AI & My Data</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up space-y-3">
            <div className="premium-card p-4">
              <p className="text-ivory-100 font-medium text-sm mb-2">When Personal Context Is Used</p>
              <p className="text-ivory-500 text-xs leading-relaxed">When you ask a question or start a walk, SOLAPATH may use your memories (life stage, season, goals) to personalize the response. Only context relevant to the current response is sent — never your entire history.</p>
            </div>
            <div className="premium-card p-4">
              <p className="text-ivory-100 font-medium text-sm mb-2">When Theological RAG Is Used</p>
              <p className="text-ivory-500 text-xs leading-relaxed">For theological questions, SOLAPATH retrieves from a verified theological Library (creeds, confessions, catechisms, historic theologians). This is separate from your personal context. Retrieved theology is clearly labeled and cited.</p>
            </div>
            <div className="premium-card p-4">
              <p className="text-ivory-100 font-medium text-sm mb-2">How Memory Works</p>
              <p className="text-ivory-500 text-xs leading-relaxed">Memory is transparent and user-controlled. You can view every memory, disable memory entirely, delete individual memories, or delete all memories at once.</p>
            </div>
            <div className="premium-card p-4">
              <p className="text-ivory-100 font-medium text-sm mb-2">AI Is Not Divine Authority</p>
              <p className="text-ivory-500 text-xs leading-relaxed">AI assists with personalization, explanations, study support, organization, and reflection prompts. AI is not Scripture, divine revelation, a pastor, therapist, doctor, lawyer, or emergency service.</p>
            </div>
            <div className="premium-card p-4">
              <p className="text-ivory-100 font-medium text-sm mb-2">Legacy Retrieval Is Separate</p>
              <p className="text-ivory-500 text-xs leading-relaxed">Your personal Legacy records are never mixed into the global theological Library. They remain distinct retrieval layers.</p>
            </div>
            <button
              onClick={async () => {
                vibrate(10);
                await supabase.from('profiles').update({ memory_enabled: !profile.memory_enabled }).eq('id', profile.id);
                window.location.reload();
              }}
              className="btn-secondary w-full text-sm"
            >
              {profile.memory_enabled ? 'Disable Memory' : 'Enable Memory'}
            </button>
            <button
              onClick={async () => {
                vibrate(15);
                await supabase.from('memories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                vibrate(10);
              }}
              className="btn-secondary w-full text-sm text-error border-error/30"
            >
              <Trash2 size={14} /> Delete All Memories
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'download') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSection('main')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Download My Data</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            <div className="premium-card p-5 mb-4">
              <p className="text-ivory-100 font-medium text-sm mb-2">Export Your Data</p>
              <p className="text-ivory-500 text-xs leading-relaxed mb-4">Download all your data as a structured JSON file. This includes your profile, memories, prayers, reflections, Family records, REACH records, sermon notes, and all Legacy records. It does not include other users' private data.</p>
              {!exportData && (
                <button onClick={handleExport} disabled={exporting} className="btn-primary w-full">
                  <Download size={16} /> {exporting ? 'Preparing Export...' : 'Request Data Export'}
                </button>
              )}
              {exportData && (
                <>
                  <div className="premium-card p-3 mb-3 bg-sage-500/5 border-sage-500/20">
                    <p className="text-sage-300 text-xs font-medium">Export ready</p>
                    <p className="text-ivory-500 text-xs mt-1">{Object.keys(exportData).length} data categories included</p>
                  </div>
                  <button onClick={handleDownload} className="btn-primary w-full">
                    <Download size={16} /> Download JSON File
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'delete') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSection('main')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Delete My Account</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            {deleteStep === 0 && (
              <div className="premium-card p-5 border-error/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={18} className="text-error" />
                  <p className="text-error text-sm font-medium">This is permanent.</p>
                </div>
                <p className="text-ivory-400 text-xs leading-relaxed mb-4">Deleting your account will <strong className="text-ivory-200">permanently delete</strong> the following from our servers:</p>
                <ul className="space-y-1 mb-4">
                  {['Your profile and settings', 'All memories', 'All prayers and updates', 'All Ask SOLAPATH conversations', 'All Family records and walks', 'All REACH records', 'All sermon notes', 'All Legacy records, letters, seasons, milestones, and testimony', 'Circle memberships and shared content you created'].map(item => (
                    <li key={item} className="text-ivory-500 text-xs flex items-start gap-2"><span className="text-error mt-0.5">•</span> {item}</li>
                  ))}
                </ul>
                <div className="premium-card p-3 mb-4 bg-ink-800/30">
                  <p className="text-ivory-500 text-xs leading-relaxed">A minimal audit record is retained containing only the deletion event, timestamp, and system version. No prayer text, testimony, letters, conversations, or any spiritual content is retained.</p>
                </div>
                <p className="text-ivory-400 text-xs leading-relaxed mb-4">This action cannot be undone. Consider downloading your data first.</p>
                <button onClick={() => setDeleteStep(1)} className="btn-secondary w-full text-error border-error/30 hover:bg-error/10">
                  <Trash2 size={16} /> I Understand, Continue
                </button>
              </div>
            )}
            {deleteStep === 1 && (
              <div className="premium-card p-5 border-error/20">
                <p className="text-ivory-100 font-medium text-sm mb-2">Type DELETE to confirm</p>
                <p className="text-ivory-500 text-xs leading-relaxed mb-3">This is your final warning. Type DELETE in the box below to permanently delete your account and all data.</p>
                <input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className="input-field mb-3"
                  autoCapitalize="characters"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirm !== 'DELETE' || deleting}
                    className="btn-secondary flex-1 text-error border-error/30 hover:bg-error/10 disabled:opacity-40"
                  >
                    {deleting ? 'Deleting...' : 'Delete My Account'}
                  </button>
                  <button onClick={() => { setDeleteStep(0); setDeleteConfirm(''); }} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Privacy & Data</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">PRIVACY & DATA</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Your data belongs to you.</p>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {sections.map(s => (
              <button key={s.label} onClick={() => { vibrate(8); s.onClick(); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group w-full">
                <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                  <s.icon size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-ivory-100 font-medium text-sm">{s.label}</p>
                  <p className="text-ivory-600 text-xs">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-start gap-2 mt-5 px-1">
            <Lock size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">PRIVATE MEANS PRIVATE. THE USER OWNS THEIR STORY. AI IS THE SERVANT. SCRIPTURE IS THE AUTHORITY.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataCategory({ icon: Icon, title, desc, visibility }: { icon: typeof Heart; title: string; desc: string; visibility: string }) {
  return (
    <div className="premium-card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-ivory-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-ivory-100 font-medium text-sm">{title}</p>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${visibility === 'PRIVATE' ? 'bg-sage-500/10 text-sage-400' : 'bg-clay-500/10 text-clay-400'}`}>{visibility}</span>
          </div>
          <p className="text-ivory-500 text-xs leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
