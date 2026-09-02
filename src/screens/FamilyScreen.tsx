import { useEffect, useState } from 'react';
import {
  Users, BookOpen, MessageCircle, Scroll, Landmark, Heart,
  ChevronRight, Plus, X, Sparkles, Info, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import { recommendFamilyWalk, type FamilyWalkRecommendation } from '@/lib/familyEngine';
import type { FamilyProfile, FamilyMember, AgeRange } from '@/lib/familyTypes';
import FamilyWalkScreen from '@/screens/FamilyWalkScreen';
import ChildAskedScreen from '@/screens/ChildAskedScreen';
import CatechismScreen from '@/screens/CatechismScreen';
import FamilyJourneyScreen from '@/screens/FamilyJourneyScreen';
import ParentGuideScreen from '@/screens/ParentGuideScreen';
import FamilyPrayerScreen from '@/screens/FamilyPrayerScreen';

type SubView = 'main' | 'walk' | 'child_asked' | 'catechism' | 'journey' | 'parent_guide' | 'family_prayer';

const ageRangeOptions: { id: AgeRange; label: string }[] = [
  { id: '3-5', label: '3–5' },
  { id: '6-8', label: '6–8' },
  { id: '9-12', label: '9–12' },
  { id: '13-15', label: '13–15' },
  { id: '16-17', label: '16–17' },
  { id: '18+', label: '18+ / Adult' },
];

export default function FamilyScreen() {
  const [subView, setSubView] = useState<SubView>('main');
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [walkRec, setWalkRec] = useState<FamilyWalkRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // New family form
  const [familyName, setFamilyName] = useState('');
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  // New member form
  const [memberNickname, setMemberNickname] = useState('');
  const [memberAgeRange, setMemberAgeRange] = useState<AgeRange>('6-8');
  const [memberRelationship, setMemberRelationship] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    loadFamilyData();
  }, []);

  async function loadFamilyData() {
    setLoading(true);
    const { data: profile, error } = await supabase
      .from('family_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error('[SOLAPATH] Error loading family profile:', error.message);
    }

    if (profile) {
      setFamilyProfile(profile as FamilyProfile);
      const { data: membs } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_profile_id', profile.id)
        .order('created_at', { ascending: true });
      setMembers((membs as FamilyMember[]) || []);

      // Get recent walk topics for continuity
      const { data: recentWalks } = await supabase
        .from('family_walks')
        .select('topic')
        .eq('family_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const rec = recommendFamilyWalk((recentWalks as { topic: string }[])?.map((w) => w.topic) || []);
      setWalkRec(rec);
    }
    setLoading(false);
  }

  async function createFamily() {
    vibrate(12);
    setCreatingFamily(true);
    setFamilyError(null);

    const name = familyName.trim() || 'My Family';

    const { data, error } = await supabase
      .from('family_profiles')
      .insert({ family_name: name, memory_enabled: true })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[SOLAPATH] Family profile creation failed:', error?.message || 'No data returned');
      setFamilyError('We couldn\'t create your Family Profile. Please try again.');
      setCreatingFamily(false);
      return;
    }

    setFamilyProfile(data as FamilyProfile);
    setFamilyName('');
    setShowCreateFamily(false);
    setCreatingFamily(false);
    const rec = recommendFamilyWalk();
    setWalkRec(rec);
  }

  async function addMember() {
    if (!familyProfile) return;
    vibrate(10);
    setAddingMember(true);
    setMemberError(null);

    const { data, error } = await supabase
      .from('family_members')
      .insert({
        family_profile_id: familyProfile.id,
        nickname: memberNickname.trim() || null,
        age_range: memberAgeRange,
        relationship: memberRelationship.trim() || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[SOLAPATH] Family member creation failed:', error?.message || 'No data returned');
      setMemberError('We couldn\'t add this family member. Please try again.');
      setAddingMember(false);
      return;
    }

    setMembers((prev) => [...prev, data as FamilyMember]);
    setMemberNickname('');
    setMemberRelationship('');
    setMemberAgeRange('6-8');
    setShowAddMember(false);
    setAddingMember(false);
  }

  // Sub-views
  if (subView === 'walk' && walkRec) {
    return <FamilyWalkScreen walk={walkRec} familyProfile={familyProfile} onBack={() => setSubView('main')} />;
  }
  if (subView === 'child_asked') {
    return <ChildAskedScreen familyProfile={familyProfile} members={members} onBack={() => setSubView('main')} />;
  }
  if (subView === 'catechism') {
    return <CatechismScreen familyProfile={familyProfile} onBack={() => setSubView('main')} />;
  }
  if (subView === 'journey') {
    return <FamilyJourneyScreen familyProfile={familyProfile} onBack={() => setSubView('main')} />;
  }
  if (subView === 'parent_guide') {
    return <ParentGuideScreen onBack={() => setSubView('main')} />;
  }
  if (subView === 'family_prayer') {
    return <FamilyPrayerScreen familyProfile={familyProfile} onBack={() => setSubView('main')} />;
  }

  // Create family form
  if (showCreateFamily) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setShowCreateFamily(false)} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Create Family</p>
          <span className="w-10" />
        </header>
        <div className="flex-1 px-6 py-6 animate-fade-in">
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Family Name (optional)</label>
              <input
                autoFocus
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="My Family"
                className="input-field"
              />
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">
                This stays private on your device. You do not need to use your real family name. Leave blank to use "My Family."
              </p>
            </div>
            {familyError && (
              <div className="premium-card p-3 border-error/30 animate-fade-in">
                <p className="text-error text-sm">{familyError}</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-10 safe-bottom">
          <button onClick={createFamily} disabled={creatingFamily} className="btn-primary w-full disabled:opacity-40">
            <Users size={18} />
            {creatingFamily ? 'Creating...' : 'Create Family Profile'}
          </button>
        </div>
      </div>
    );
  }

  // Add member form
  if (showAddMember) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setShowAddMember(false)} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Add Family Member</p>
          <span className="w-10" />
        </header>
        <div className="flex-1 px-6 py-6 animate-fade-in">
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Nickname or First Name (optional)</label>
              <input
                type="text"
                value={memberNickname}
                onChange={(e) => setMemberNickname(e.target.value)}
                placeholder="Child A"
                className="input-field"
              />
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">
                You do not need to enter a real name. A nickname or label like "Child A" works fine.
              </p>
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Age Range</label>
              <div className="grid grid-cols-3 gap-2">
                {ageRangeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      vibrate(6);
                      setMemberAgeRange(opt.id);
                    }}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                      memberAgeRange === opt.id
                        ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                        : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-ivory-400 mb-2 block">Relationship (optional)</label>
              <input
                type="text"
                value={memberRelationship}
                onChange={(e) => setMemberRelationship(e.target.value)}
                placeholder="Son, Daughter, etc."
                className="input-field"
              />
            </div>
            {memberError && (
              <div className="premium-card p-3 border-error/30 animate-fade-in">
                <p className="text-error text-sm">{memberError}</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-10 safe-bottom">
          <button onClick={addMember} disabled={addingMember} className="btn-primary w-full disabled:opacity-40">
            <Plus size={18} />
            {addingMember ? 'Adding...' : 'Add Family Member'}
          </button>
        </div>
      </div>
    );
  }

  // MAIN VIEW
  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28">
      <header className="px-6 pt-14 safe-top">
        <p className="ui-label animate-fade-in-down">SOLAPATH Family</p>
        <h1 className="font-serif text-4xl text-ivory-50 mt-2 tracking-tight">Family</h1>
        <p className="text-ivory-500 text-sm mt-2 leading-relaxed">
          Disciple your household.
        </p>
      </header>

      {loading ? (
        <div className="px-6 mt-8">
          <div className="premium-card h-32 animate-pulse mb-3" />
          <div className="premium-card h-20 animate-pulse" />
        </div>
      ) : !familyProfile ? (
        <div className="px-6 mt-8 animate-fade-in-up">
          <div className="premium-card p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gold-300" />
            </div>
            <p className="text-ivory-200 text-sm font-medium mb-2">Create a Family Profile to begin</p>
            <p className="text-ivory-500 text-xs leading-relaxed mb-5">
              SOLAPATH Family helps you disciple your children through Scripture, prayer, catechism, and conversation. Your family data stays private.
            </p>
            <button onClick={() => setShowCreateFamily(true)} className="btn-primary w-full">
              <Users size={18} />
              Create Family Profile
            </button>
          </div>

          <div className="flex items-start gap-2 mt-5 px-1">
            <Shield size={14} className="text-sage-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed">
              Children's data is treated with heightened privacy. You can use Family features without entering a child's real name.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-6 mt-6">
          {/* Tonight's Family Walk */}
          {walkRec && (
            <section className="animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-gold-400" />
                <p className="ui-label">Tonight's Family Walk</p>
              </div>
              <button
                onClick={() => {
                  vibrate(12);
                  setSubView('walk');
                }}
                className="premium-card p-5 w-full text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group mb-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-gold-400" />
                  <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                    {walkRec.is_demo ? 'Demo Family Walk' : 'Family Walk'}
                  </p>
                </div>
                <h3 className="font-serif text-2xl text-ivory-50 mt-2 mb-1">{walkRec.topic}</h3>
                <p className="text-ivory-400 text-sm">{walkRec.passage_reference}</p>
                <div className="flex items-center gap-1.5 text-ivory-500 text-xs mt-2">
                  <span>{walkRec.estimated_minutes} minutes</span>
                </div>
                {walkRec.reason && (
                  <p className="text-ivory-600 text-xs mt-2 italic">{walkRec.reason}</p>
                )}
                <div className="flex items-center justify-end mt-3">
                  <ChevronRight size={16} className="text-ivory-600 group-hover:text-gold-300 transition-colors" />
                </div>
              </button>
            </section>
          )}

          {/* Family Members */}
          <section className="mt-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="ui-label">Family Members</p>
              <button
                onClick={() => setShowAddMember(true)}
                className="btn-ghost text-xs"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {members.length === 0 ? (
              <div className="premium-card p-4 text-center">
                <p className="text-ivory-500 text-xs">
                  No family members added yet. Add a child's age range to receive age-appropriate questions.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <div key={m.id} className="premium-card px-4 py-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                      <Users size={14} className="text-ivory-400" />
                    </div>
                    <div>
                      <p className="text-ivory-200 text-sm font-medium">
                        {m.nickname || `Age ${m.age_range}`}
                      </p>
                      <p className="text-ivory-600 text-xs">
                        {m.age_range}{m.relationship ? ` · ${m.relationship}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Feature Grid */}
          <section className="mt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="grid grid-cols-2 gap-3">
              <FeatureCard
                icon={MessageCircle}
                label="My Child Asked..."
                desc="Parent-first guidance"
                onClick={() => {
                  vibrate(8);
                  setSubView('child_asked');
                }}
              />
              <FeatureCard
                icon={Scroll}
                label="Catechism"
                desc="Westminster · Heidelberg"
                onClick={() => {
                  vibrate(8);
                  setSubView('catechism');
                }}
              />
              <FeatureCard
                icon={Landmark}
                label="Family Journey"
                desc="Foundations pathway"
                onClick={() => {
                  vibrate(8);
                  setSubView('journey');
                }}
              />
              <FeatureCard
                icon={BookOpen}
                label="Parent Guide"
                desc="Biblical parenting"
                onClick={() => {
                  vibrate(8);
                  setSubView('parent_guide');
                }}
              />
              <FeatureCard
                icon={Heart}
                label="Family Prayer"
                desc="Pray together"
                onClick={() => {
                  vibrate(8);
                  setSubView('family_prayer');
                }}
              />
              <FeatureCard
                icon={Info}
                label="Unbelieving Family"
                desc="Prayer & guidance"
                onClick={() => {
                  vibrate(8);
                  setSubView('family_prayer');
                }}
              />
            </div>
          </section>

          {/* Privacy note */}
          <section className="mt-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-start gap-2 px-1">
              <Shield size={13} className="text-sage-400/60 shrink-0 mt-0.5" />
              <p className="text-ivory-600 text-xs leading-relaxed">
                Family data is private. SOLAPATH does not create advertising profiles for children, infer sensitive characteristics, or enable social discovery. You control everything.
              </p>
            </div>
          </section>

          {/* AI rule */}
          <section className="mt-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-2 px-1">
              <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
              <p className="text-ivory-600 text-xs leading-relaxed">
                SOLAPATH Family equips the parent. It does not replace the parent. AI guides you to guide your children.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="premium-card p-4 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
    >
      <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center mb-3">
        <Icon size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
      </div>
      <p className="text-ivory-100 font-medium text-sm">{label}</p>
      <p className="text-ivory-600 text-xs mt-0.5">{desc}</p>
    </button>
  );
}
