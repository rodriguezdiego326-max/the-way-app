import { useState } from 'react';
import {
  X, Heart, MessageCircle, Users, BookOpen, Landmark, Compass,
  ChevronRight, Sparkles, Shield, Info,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import PeoplePrayingScreen from '@/screens/PeoplePrayingScreen';
import TheyAskedMeScreen from '@/screens/TheyAskedMeScreen';
import GospelConversationScreen from '@/screens/GospelConversationScreen';
import ProdigalJourneyScreen from '@/screens/ProdigalJourneyScreen';
import ApologeticsCoachScreen from '@/screens/ApologeticsCoachScreen';
import GospelFoundationsScreen from '@/screens/GospelFoundationsScreen';
import EvangelismBibleTrailsScreen from '@/screens/EvangelismBibleTrailsScreen';
import MissionsScreen from '@/screens/MissionsScreen';

type SubView = 'main' | 'people' | 'they_asked' | 'gospel_conversation' | 'prodigal' | 'apologetics' | 'foundations' | 'trails' | 'missions';

export default function ReachScreen() {
  const [subView, setSubView] = useState<SubView>('main');

  if (subView === 'people') return <PeoplePrayingScreen onBack={() => setSubView('main')} />;
  if (subView === 'they_asked') return <TheyAskedMeScreen onBack={() => setSubView('main')} />;
  if (subView === 'gospel_conversation') return <GospelConversationScreen onBack={() => setSubView('main')} />;
  if (subView === 'prodigal') return <ProdigalJourneyScreen onBack={() => setSubView('main')} />;
  if (subView === 'apologetics') return <ApologeticsCoachScreen onBack={() => setSubView('main')} />;
  if (subView === 'foundations') return <GospelFoundationsScreen onBack={() => setSubView('main')} />;
  if (subView === 'trails') return <EvangelismBibleTrailsScreen onBack={() => setSubView('main')} />;
  if (subView === 'missions') return <MissionsScreen onBack={() => setSubView('main')} />;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28">
      <header className="px-6 pt-14 safe-top">
        <p className="ui-label animate-fade-in-down">SOLAPATH Reach</p>
        <h1 className="font-serif text-4xl text-ivory-50 mt-2 tracking-tight">Reach</h1>
        <p className="text-ivory-500 text-sm mt-2 leading-relaxed">
          Share Christ faithfully.
        </p>
      </header>

      <div className="px-6 mt-6">
        {/* Core principle */}
        <div className="flex items-start gap-2 mb-5 px-1 animate-fade-in-up">
          <Sparkles size={14} className="text-gold-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-500 text-xs leading-relaxed italic">
            Christians faithfully proclaim, love, pray, listen, and bear witness. God saves.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <FeatureCard
            icon={Heart}
            label="People I'm Praying For"
            desc="Private prayer threads"
            onClick={() => { vibrate(8); setSubView('people'); }}
          />
          <FeatureCard
            icon={MessageCircle}
            label="They Asked Me..."
            desc="Objection preparation"
            onClick={() => { vibrate(8); setSubView('they_asked'); }}
          />
          <FeatureCard
            icon={Users}
            label="Gospel Conversation"
            desc="Prepare for a talk"
            onClick={() => { vibrate(8); setSubView('gospel_conversation'); }}
          />
          <FeatureCard
            icon={Compass}
            label="Prodigal Journey"
            desc="Loved ones who walked away"
            onClick={() => { vibrate(8); setSubView('prodigal'); }}
          />
          <FeatureCard
            icon={Shield}
            label="Apologetics Coach"
            desc="Practice conversations"
            onClick={() => { vibrate(8); setSubView('apologetics'); }}
          />
          <FeatureCard
            icon={BookOpen}
            label="Gospel Foundations"
            desc="The Gospel pathway"
            onClick={() => { vibrate(8); setSubView('foundations'); }}
          />
          <FeatureCard
            icon={Landmark}
            label="Bible Trails"
            desc="Evangelism Scripture trails"
            onClick={() => { vibrate(8); setSubView('trails'); }}
          />
          <FeatureCard
            icon={Compass}
            label="Missions"
            desc="God's heart for the nations"
            onClick={() => { vibrate(8); setSubView('missions'); }}
          />
        </div>

        {/* AI rule */}
        <div className="flex items-start gap-2 mt-5 px-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-600 text-xs leading-relaxed">
            SOLAPATH equips the believer to pray, listen, understand, open Scripture, share Christ, answer faithfully, love people, and trust God. It does not convert people. It does not save people. It does not replace you.
          </p>
        </div>

        {/* Conversion privacy */}
        <div className="flex items-start gap-2 mt-3 px-1 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <Shield size={13} className="text-sage-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-600 text-xs leading-relaxed">
            SOLAPATH never creates conversion scores, spiritual receptivity scores, or salvation likelihood ratings. Never gamifies another person's salvation. Faithfulness belongs to the believer. The outcome belongs to God.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: typeof Heart;
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
