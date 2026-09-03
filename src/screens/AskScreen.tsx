import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  BookOpen,
  Scroll,
  Landmark,
  Lightbulb,
  FileText,
  ShieldCheck,
  Check,
  AlertCircle,
  Heart,
  Hand,
  Info,
  ShieldX,
  HelpCircle,
  UserCheck,
  Flag,
  X,
  Plus,
  Copy,
  ArrowUpRight,
  Share,
  ChevronLeft,
  Type,
  Settings,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import AuthorityLabel, { type AuthorityLevel } from '@/components/AuthorityLabel';
import TheologicalConfidenceLabel from '@/components/TheologicalConfidenceLabel';
import SourceViewer from '@/components/SourceViewer';
import BiblicalBasis from '@/components/BiblicalBasis';
import MemoryProposalCard from '@/components/MemoryProposalCard';
import { fetchIntelligenceResponse } from '@/lib/intelligenceService';
import type { AskIntent, Profile, Walk } from '@/lib/types';
import type { StructuredTheologicalResponse, VerificationState } from '@/lib/intelligenceTypes';
import ScriptureBlock from '@/components/ScriptureBlock';
import { parsePassageReference } from '@/lib/passageParser';
import { getBookDisplayName, type BibleTranslation } from '@/lib/bibleTypes';
import { MessageSquare, Archive, Trash2, Clock } from 'lucide-react';

const BOTTOM_NAV_HEIGHT = 72;

// ============================================================
// Ask UI Localization — follows active Bible translation
// ============================================================
const ASK_STRINGS = {
  en: {
    askLabel: 'Ask',
    prompt: "What's on your mind?",
    subtext: "Bring a question, passage, struggle, decision, or something you're trying to understand.",
    placeholder: "Write what's on your mind...",
    scriptureAuthority: 'Scripture is the authority.',
    send: 'Send',
    followUpPlaceholder: 'Ask a follow-up...',
    lookingThrough: 'Looking through Scripture...',
    back: 'Back',
    textSize: 'Text size',
    settings: 'Settings',
    newConversation: 'New Conversation',
    newChat: 'New Chat',
    chatHistory: 'Chat History',
    recent: 'Recent',
    biblicalBasis: 'Biblical Basis',
    sources: 'Sources',
    copy: 'Copy',
    copied: 'Copied',
    share: 'Share',
    openInBible: 'Open in Bible',
    reportConcern: 'Report Theological Concern',
    archive: 'Archive',
    delete: 'Delete',
    confirmDelete: 'Delete this conversation? This cannot be undone.',
    confirmArchive: 'Archive this conversation? You can restore it later.',
    noConversations: 'No conversations yet.',
    letsBegin: "Let's Begin with Scripture",
    openingMyBible: "I'm Opening My Bible",
    scriptureIsStandard: 'Scripture is the Standard',
    connected: 'Connected',
    allSourcesVerified: 'All sources verified',
    someSourcesVerified: 'Some sources verified',
    sourcesUnavailable: 'Verified sources not currently available',
  },
  es: {
    askLabel: 'Preguntar',
    prompt: '¿Qué tienes en mente?',
    subtext: 'Trae una pregunta, un pasaje, una lucha, una decisión o algo que intentas entender.',
    placeholder: 'Escribe lo que tienes en mente...',
    scriptureAuthority: 'La Escritura es la autoridad.',
    send: 'Enviar',
    followUpPlaceholder: 'Haz una pregunta de seguimiento...',
    lookingThrough: 'Buscando en la Escritura...',
    back: 'Atrás',
    textSize: 'Tamaño de texto',
    settings: 'Configuración',
    newConversation: 'Nueva conversación',
    newChat: 'Nuevo chat',
    chatHistory: 'Historial',
    recent: 'Recientes',
    biblicalBasis: 'Base bíblica',
    sources: 'Fuentes',
    copy: 'Copiar',
    copied: 'Copiado',
    share: 'Compartir',
    openInBible: 'Abrir en la Biblia',
    reportConcern: 'Reportar preocupación teológica',
    archive: 'Archivar',
    delete: 'Eliminar',
    confirmDelete: '¿Eliminar esta conversación? Esto no se puede deshacer.',
    confirmArchive: '¿Archivar esta conversación? Puedes restaurarla más tarde.',
    noConversations: 'Aún no hay conversaciones.',
    letsBegin: 'Comencemos con la Escritura',
    openingMyBible: 'Estoy abriendo mi Biblia',
    scriptureIsStandard: 'La Escritura es el estándar',
    connected: 'Conectado',
    allSourcesVerified: 'Todas las fuentes verificadas',
    someSourcesVerified: 'Algunas fuentes verificadas',
    sourcesUnavailable: 'Fuentes verificadas no disponibles actualmente',
  },
} as const;

type AskLang = keyof typeof ASK_STRINGS;

function getAskLang(translation: BibleTranslation): AskLang {
  return translation === 'RV1909' ? 'es' : 'en';
}

function getActiveTranslation(): BibleTranslation {
  if (typeof localStorage === 'undefined') return 'WEB';
  return (localStorage.getItem('solapath_translation') as BibleTranslation) || 'WEB';
}

function localizeRef(ref: string, translation: BibleTranslation): string {
  const parsed = parsePassageReference(ref);
  if (!parsed || parsed.verseStart === null) return ref;
  const bookName = getBookDisplayName(parsed.book, translation);
  if (parsed.verseStart === parsed.verseEnd) {
    return `${bookName} ${parsed.chapter}:${parsed.verseStart}`;
  }
  return `${bookName} ${parsed.chapter}:${parsed.verseStart}\u2013${parsed.verseEnd}`;
}

const SCRIPTURE_REF_REGEX = /((?:1|2|3|I|II|III)\s)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+\d+:\d+(?:[–-]\d+)?(?:\s*[:–-]\s*\d+(?:[–-]\d+)?)?/g;

type TextScale = 'small' | 'default' | 'large' | 'extra_large';

const TEXT_SCALE_MAP: Record<TextScale, { body: string; section: string; user: string }> = {
  small: { body: 'text-[17px] leading-[1.65]', section: 'text-[14px] leading-[1.7]', user: 'text-[15px]' },
  default: { body: 'text-[19px] leading-[1.7]', section: 'text-[16px] leading-[1.75]', user: 'text-[16px]' },
  large: { body: 'text-[21px] leading-[1.7]', section: 'text-[18px] leading-[1.75]', user: 'text-[17px]' },
  extra_large: { body: 'text-[23px] leading-[1.75]', section: 'text-[20px] leading-[1.8]', user: 'text-[18px]' },
};

type ThreadItem =
  | { kind: 'user'; id: string; body: string }
  | { kind: 'assistant'; id: string; response: StructuredTheologicalResponse };

interface AskScreenProps {
  theologicalDepth: string;
  profile: Profile | null;
  onStartWalk: (walk: Walk) => void;
  onOpenBibleReference: (book: string, chapter: number, verseStart: number | null, verseEnd: number | null) => void;
  initialContext?: string | null;
  onContextConsumed?: () => void;
  onKeyboardVisibilityChange?: (visible: boolean) => void;
  activeConversationId?: string | null;
  onConversationChange?: (id: string | null) => void;
}

export default function AskScreen({ theologicalDepth, profile, onStartWalk, onOpenBibleReference, initialContext, onContextConsumed, onKeyboardVisibilityChange, activeConversationId, onConversationChange }: AskScreenProps) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [vvHeight, setVvHeight] = useState(typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : (typeof window !== 'undefined' ? window.innerHeight : 800));
  const [nativeKeyboardHeight, setNativeKeyboardHeight] = useState(0);
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [dismissedProposals, setDismissedProposals] = useState<Set<string>>(new Set());
  const [showSourceViewer, setShowSourceViewer] = useState(false);
  const [showBiblicalBasis, setShowBiblicalBasis] = useState(false);
  const [activeResponseForModal, setActiveResponseForModal] = useState<StructuredTheologicalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConcernReport, setShowConcernReport] = useState(false);
  const [concernCategory, setConcernCategory] = useState<string | null>(null);
  const [concernDetail, setConcernDetail] = useState('');
  const [concernSubmitted, setConcernSubmitted] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>('default');
  const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeTranslation, setActiveTranslation] = useState<BibleTranslation>(getActiveTranslation());
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [conversationList, setConversationList] = useState<Array<{ id: string; title: string | null; updated_at: string; language: string | null }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followUpRef = useRef<HTMLTextAreaElement>(null);
  const emptyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  const inConversation = conversationStarted || thread.length > 0;
  const scale = TEXT_SCALE_MAP[textScale];
  const t = ASK_STRINGS[getAskLang(activeTranslation)];
  const askLang = getAskLang(activeTranslation);

  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 120;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (scrollRef.current && isNearBottomRef.current && thinking) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thinking]);

  useEffect(() => {
    if (!scrollRef.current || thread.length === 0) return;
    const lastItem = thread[thread.length - 1];
    if (lastItem.kind === 'assistant' && !thinking) {
      const container = scrollRef.current;
      const items = container.querySelectorAll('[data-msg-id]');
      const lastEl = items[items.length - 1] as HTMLElement | null;
      if (lastEl) {
        const containerTop = container.scrollTop;
        const elTop = lastEl.offsetTop;
        if (elTop < containerTop || elTop > containerTop + container.clientHeight) {
          container.scrollTo({ top: elTop - 16, behavior: 'smooth' });
        }
      }
    }
  }, [thread, thinking]);

  // Load active conversation on mount if we have one
  useEffect(() => {
    if (activeConversationId && !conversationStarted && thread.length === 0) {
      loadConversation(activeConversationId);
    }
  }, []);

  // Sync conversation ID to app level
  useEffect(() => {
    onConversationChange?.(conversationId);
  }, [conversationId]);

  async function loadConversation(convId: string) {
    setLoadingHistory(true);
    try {
      const { data: messages, error } = await supabase
        .from('ask_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error || !messages) {
        setLoadingHistory(false);
        return;
      }

      const restoredThread: ThreadItem[] = messages.map((msg) => {
        if (msg.role === 'user') {
          return { kind: 'user', id: msg.id, body: msg.body } as ThreadItem;
        }
        // Assistant message — try to restore structured payload, else build minimal response
        const payload = msg.structured_payload as StructuredTheologicalResponse | null;
        if (payload) {
          return { kind: 'assistant', id: msg.id, response: payload } as ThreadItem;
        }
        // Fallback: reconstruct minimal response from body text
        const minimal: StructuredTheologicalResponse = {
          answer_summary: msg.body,
          recommended_scripture: [],
          biblical_basis: [],
          confessional_sources: [],
          historical_sources: [],
          modern_sources: [],
          scripture_sources: [],
          theological_confidence: 'BROADER_CHRISTIAN_DISAGREEMENT',
          intent: 'general',
          stakes_level: 'LOW',
          scripture_first_mode: 'ANSWER_WITH_SCRIPTURE_RECOMMENDATION',
          is_demo: false,
          is_development_mode: false,
          has_development_content: false,
          provider: msg.response_language || 'unknown',
          verification_state: 'SOURCES_UNAVAILABLE',
          source_confidence: 'none',
          validation_passed: true,
          validation_warnings: [],
          query_id: msg.id,
          memory_proposals: [],
          other_christian_views: null,
          reformed_understanding: null,
          application: null,
          prayer_guidance: null,
          scripture_context: null,
          scripture_testing_flow: null,
          divine_revelation_claim_detected: false,
          divine_revelation_response: null,
          teacher_attribution_blocked: null,
          human_support_recommended: false,
          human_support_note: null,
        } as unknown as StructuredTheologicalResponse;
        return { kind: 'assistant', id: msg.id, response: minimal } as ThreadItem;
      });

      setThread(restoredThread);
      setConversationId(convId);
      setConversationStarted(true);
    } catch (e) {
      console.warn('[AskScreen] loadConversation failed', e);
    }
    setLoadingHistory(false);
  }

  async function loadConversationList() {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('ask_conversations')
        .select('id, title, updated_at, language')
        .is('archived_at', null)
        .order('updated_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setConversationList(data);
      }
    } catch (e) {
      console.warn('[AskScreen] loadConversationList failed', e);
    }
    setLoadingHistory(false);
  }

  async function startNewChat() {
    vibrate(8);
    setThread([]);
    setConversationId(null);
    setConversationStarted(false);
    setDismissedProposals(new Set());
    setError(null);
    setShowSourceViewer(false);
    setShowBiblicalBasis(false);
    setActiveResponseForModal(null);
    setShowTextSizeMenu(false);
    setShowSettingsMenu(false);
    setShowChatHistory(false);
  }

  async function deleteConversation(convId: string) {
    vibrate(10);
    try {
      await supabase.from('ask_messages').delete().eq('conversation_id', convId);
      await supabase.from('ask_conversations').delete().eq('id', convId);
      if (convId === conversationId) {
        await startNewChat();
      }
      loadConversationList();
    } catch (e) {
      console.warn('[AskScreen] deleteConversation failed', e);
    }
  }

  async function archiveConversation(convId: string) {
    vibrate(10);
    try {
      await supabase.from('ask_conversations').update({ archived_at: new Date().toISOString() }).eq('id', convId);
      if (convId === conversationId) {
        await startNewChat();
      }
      loadConversationList();
    } catch (e) {
      console.warn('[AskScreen] archiveConversation failed', e);
    }
  }
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handler = () => {
      const vh = window.innerHeight;
      const visible = vv.height < vh - 50;
      setKeyboardOpen(visible);
      setVvHeight(vv.height);
      onKeyboardVisibilityChange?.(visible);
    };

    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    handler();
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
      onKeyboardVisibilityChange?.(false);
    };
  }, [onKeyboardVisibilityChange]);

  // Active conversation: native keyboard with resize NONE
  useEffect(() => {
    if (!inConversation) return;
    if (!Capacitor.isNativePlatform()) return;

    let handles: Array<() => void> = [];

    (async () => {
      try {
        const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
        await Keyboard.setResizeMode({ mode: KeyboardResize.None });

        const willShow = await Keyboard.addListener('keyboardWillShow', (info: { keyboardHeight: number }) => {
          setNativeKeyboardHeight(info.keyboardHeight);
          setKeyboardOpen(true);
          onKeyboardVisibilityChange?.(true);
        });
        const willHide = await Keyboard.addListener('keyboardWillHide', () => {
          setNativeKeyboardHeight(0);
          setKeyboardOpen(false);
          onKeyboardVisibilityChange?.(false);
        });

        handles.push(() => willShow.remove());
        handles.push(() => willHide.remove());
      } catch (e) {
        console.warn('[AskScreen] native keyboard setup failed', e);
      }
    })();

    return () => {
      handles.forEach((h) => h());
      (async () => {
        try {
          const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
          await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        } catch (e) {
          console.warn('[AskScreen] restore keyboard mode failed', e);
        }
      })();
      setNativeKeyboardHeight(0);
      onKeyboardVisibilityChange?.(false);
    };
  }, [inConversation, onKeyboardVisibilityChange]);

  useEffect(() => {
    if (initialContext && !conversationId && !conversationStarted) {
      startConversation('passage', `Help me understand ${initialContext}`);
      onContextConsumed?.();
    }
  }, [initialContext]);

  async function startConversation(intent: AskIntent, promptText: string) {
    vibrate(10);
    setError(null);
    setDismissedProposals(new Set());
    setShowSourceViewer(false);
    setShowBiblicalBasis(false);
    isNearBottomRef.current = true;

    setConversationStarted(true);
    const userItemId = 'user-' + Date.now();
    setThread([{ kind: 'user', id: userItemId, body: promptText }]);
    setInput('');
    setThinking(true);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const { data: conv } = await supabase
      .from('ask_conversations')
      .insert({ title: promptText, intent, language: askLang === 'es' ? 'es' : 'en' })
      .select('*')
      .single();

    if (!conv) {
      setThinking(false);
      setError('Could not start conversation. Please try again.');
      return;
    }

    setConversationId(conv.id);

    await supabase.from('ask_messages').insert({
      conversation_id: conv.id,
      role: 'user',
      body: promptText,
    });

    try {
      const aiResponse = await fetchIntelligenceResponse(
        promptText,
        profile,
        theologicalDepth,
        [],
        undefined,
        askLang === 'es' ? 'Spanish' : 'English',
      );

      const assistantItemId = 'assistant-' + Date.now();
      setThread((prev) => [...prev, { kind: 'assistant', id: assistantItemId, response: aiResponse }]);

      await supabase.from('ask_messages').insert({
        conversation_id: conv.id,
        role: 'assistant',
        body: aiResponse.answer_summary,
        structured_payload: aiResponse as unknown as Record<string, unknown>,
        response_language: askLang === 'es' ? 'es' : 'en',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get a response. Please try again.');
    }

    setThinking(false);
  }

  async function sendMessage(overrideText?: string) {
    const text = overrideText ?? input.trim();
    if (!text || !conversationId) return;

    isNearBottomRef.current = true;
    const userItemId = 'user-' + Date.now();
    setThread((prev) => [...prev, { kind: 'user', id: userItemId, body: text }]);
    setInput('');
    if (followUpRef.current) {
      followUpRef.current.style.height = 'auto';
    }
    setThinking(true);
    setError(null);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    await supabase.from('ask_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      body: text,
    });

    try {
      const conversationHistory = thread.map((item) =>
        item.kind === 'user'
          ? { role: 'user' as const, body: item.body }
          : { role: 'assistant' as const, body: item.response.answer_summary }
      );

      const aiResponse = await fetchIntelligenceResponse(
        text,
        profile,
        theologicalDepth,
        conversationHistory,
        undefined,
        askLang === 'es' ? 'Spanish' : 'English',
      );

      const assistantItemId = 'assistant-' + Date.now();
      setThread((prev) => [...prev, { kind: 'assistant', id: assistantItemId, response: aiResponse }]);

      await supabase.from('ask_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        body: aiResponse.answer_summary,
        structured_payload: aiResponse as unknown as Record<string, unknown>,
        response_language: askLang === 'es' ? 'es' : 'en',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get a response. Please try again.');
    }

    setThinking(false);
  }

  function handleSuggestionTap(suggestion: string) {
    vibrate(8);
    sendMessage(suggestion);
  }

  function resetConversation() {
    startNewChat();
  }

  function handleOpenBible(reference: string) {
    vibrate(12);
    const parsed = parsePassageReference(reference);
    if (!parsed) return;
    onOpenBibleReference(parsed.book, parsed.chapter, parsed.verseStart, parsed.verseEnd);
  }

  function handleShare(response: StructuredTheologicalResponse) {
    vibrate(6);
    const shareData = {
      title: 'SOLAPATH',
      text: response.answer_summary,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(response.answer_summary).then(() => {});
    }
  }

  const emptyHeight = keyboardOpen ? vvHeight : vvHeight - BOTTOM_NAV_HEIGHT;

  return (
    <>
      {/* EMPTY STATE — approved layout, do not modify */}
      {!inConversation && (
        <div
          className="app-container bg-ink-950 bg-parchment flex flex-col overflow-hidden"
          style={{ height: `${emptyHeight}px` }}
        >
          <header className="px-6 pt-14 safe-top shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="ui-label animate-fade-in-down">{t.askLabel}</p>
                <h1 className="font-serif text-3xl text-ivory-50 mt-2 tracking-tight">
                  {t.prompt}
                </h1>
              </div>
              <button
                onClick={() => { vibrate(6); loadConversationList(); setShowChatHistory(true); }}
                aria-label={t.chatHistory}
                className="w-10 h-10 rounded-full bg-ink-800/50 backdrop-blur-sm border border-ink-600/30 flex items-center justify-center text-ivory-300 hover:text-ivory-100 transition-colors no-tap-highlight"
              >
                <MessageSquare size={18} />
              </button>
            </div>
          </header>

          <div className="shrink-0 px-6 pt-4">
            <div className="w-full max-w-lg mx-auto animate-fade-in-up">
              {!keyboardOpen && (
                <p className="text-ivory-500 text-sm leading-relaxed mb-4">
                  {t.subtext}
                </p>
              )}
              <div className="bg-ink-800/40 border border-ink-600/30 rounded-3xl p-5 shadow-lg shadow-ink-950/40">
                <textarea
                  ref={emptyTextareaRef}
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder}
                  aria-label="Ask SOLAPATH a question"
                  className="w-full bg-transparent text-ivory-100 placeholder:text-ivory-600 text-base leading-relaxed resize-none focus:outline-none overflow-y-auto"
                  style={{ minHeight: '96px', maxHeight: '140px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) startConversation('passage', input.trim());
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-ink-700/30">
                  <p className="text-ivory-600 text-xs">{t.scriptureAuthority}</p>
                  <button
                    onClick={() => { if (input.trim()) startConversation('passage', input.trim()); }}
                    disabled={!input.trim()}
                    aria-label={t.send}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500/15 border border-gold-500/25 text-gold-300 text-sm font-medium disabled:opacity-30 transition-all hover:bg-gold-500/25"
                  >
                    {t.send} <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0" />
        </div>
      )}

      {/* ACTIVE CONVERSATION — full screen, flex column, composer pushed up by keyboard */}
      {inConversation && (
        <div className="fixed inset-0 z-[70] bg-ink-950 bg-parchment flex flex-col overflow-hidden">
          {/* Floating top controls */}
          <header className="flex items-center justify-between px-4 pt-12 safe-top shrink-0 relative z-10">
            <button
              onClick={resetConversation}
              aria-label={t.back}
              className="w-10 h-10 rounded-full bg-ink-800/50 backdrop-blur-sm border border-ink-600/30 flex items-center justify-center text-ivory-300 hover:text-ivory-100 transition-colors no-tap-highlight"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { vibrate(6); loadConversationList(); setShowChatHistory(true); }}
                aria-label={t.chatHistory}
                className="w-10 h-10 rounded-full bg-ink-800/50 backdrop-blur-sm border border-ink-600/30 flex items-center justify-center text-ivory-300 hover:text-ivory-100 transition-colors no-tap-highlight"
              >
                <MessageSquare size={18} />
              </button>
              <button
                onClick={() => { setShowTextSizeMenu(!showTextSizeMenu); setShowSettingsMenu(false); }}
                aria-label={t.textSize}
                className={`w-10 h-10 rounded-full backdrop-blur-sm border flex items-center justify-center transition-colors no-tap-highlight ${
                  showTextSizeMenu ? 'bg-gold-500/20 border-gold-500/40 text-gold-300' : 'bg-ink-800/50 border-ink-600/30 text-ivory-300 hover:text-ivory-100'
                }`}
              >
                <Type size={18} />
              </button>
              <button
                onClick={() => { setShowSettingsMenu(!showSettingsMenu); setShowTextSizeMenu(false); }}
                aria-label={t.settings}
                className={`w-10 h-10 rounded-full backdrop-blur-sm border flex items-center justify-center transition-colors no-tap-highlight ${
                  showSettingsMenu ? 'bg-gold-500/20 border-gold-500/40 text-gold-300' : 'bg-ink-800/50 border-ink-600/30 text-ivory-300 hover:text-ivory-100'
                }`}
              >
                <Settings size={18} />
              </button>
            </div>
          </header>

          {/* Text size dropdown */}
          {showTextSizeMenu && (
            <div className="absolute right-4 top-20 z-20 bg-ink-800/95 backdrop-blur-md border border-ink-600/40 rounded-2xl p-2 shadow-xl shadow-ink-950/50 animate-fade-in">
              {([
                { value: 'small', label: 'Small' },
                { value: 'default', label: 'Default' },
                { value: 'large', label: 'Large' },
                { value: 'extra_large', label: 'Extra Large' },
              ] as { value: TextScale; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { vibrate(4); setTextScale(opt.value); setShowTextSizeMenu(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors w-full text-left no-tap-highlight ${
                    textScale === opt.value ? 'text-gold-300 font-medium' : 'text-ivory-400 hover:text-ivory-200'
                  }`}
                >
                  {textScale === opt.value && <Check size={14} />}
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Settings dropdown */}
          {showSettingsMenu && (
            <div className="absolute right-4 top-20 z-20 bg-ink-800/95 backdrop-blur-md border border-ink-600/40 rounded-2xl p-2 shadow-xl shadow-ink-950/50 animate-fade-in min-w-[180px]">
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-ivory-400 hover:text-ivory-200 transition-colors w-full text-left no-tap-highlight"
              >
                <Plus size={14} /> {t.newChat}
              </button>
            </div>
          )}

          {/* MESSAGE THREAD — scrollable */}
          <div
            ref={scrollRef}
            onScroll={checkNearBottom}
            className="flex-1 min-h-0 overflow-y-auto px-5 mt-2 pb-44"
          >
            {thread.map((item) =>
              item.kind === 'user' ? (
                <div key={item.id} data-msg-id={item.id} className="flex justify-end mb-6 animate-fade-in-up">
                  <div className={`max-w-[85%] bg-ink-800/60 border border-ink-600/30 rounded-2xl rounded-br-md px-4 py-3`}>
                    <p className={`text-ivory-100 ${scale.user} leading-relaxed`}>{item.body}</p>
                  </div>
                </div>
              ) : (
                <AssistantMessage
                  key={item.id}
                  itemId={item.id}
                  response={item.response}
                  dismissedProposals={dismissedProposals}
                  scale={scale}
                  translation={activeTranslation}
                  onDismissProposal={(pid) => {
                    vibrate(6);
                    setDismissedProposals((prev) => new Set(prev).add(pid));
                  }}
                  onShowSources={() => {
                    vibrate(8);
                    setActiveResponseForModal(item.response);
                    setShowSourceViewer(true);
                  }}
                  onShowBiblicalBasis={() => {
                    vibrate(8);
                    setActiveResponseForModal(item.response);
                    setShowBiblicalBasis(true);
                  }}
                  onOpenBible={handleOpenBible}
                  onSuggestionTap={handleSuggestionTap}
                  onShare={() => handleShare(item.response)}
                  onReportConcern={() => {
                    vibrate(6);
                    setActiveResponseForModal(item.response);
                    setShowConcernReport(true);
                    setConcernSubmitted(false);
                    setConcernCategory(null);
                    setConcernDetail('');
                  }}
                />
              ),
            )}

            {thinking && (
              <div className="flex items-center gap-2.5 mb-6 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400/60 animate-breathe" />
                <p className="text-ivory-500 text-sm italic">{t.lookingThrough}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-error/10 border border-error/30">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* COMPOSER — shrink-0 flex child, pushed up by native keyboard height */}
          <div
            className="shrink-0 px-4 pb-2"
            style={{ paddingBottom: nativeKeyboardHeight > 0 ? `${nativeKeyboardHeight}px` : undefined }}
          >
            <div className="bg-ink-800/80 backdrop-blur-md border border-ink-600/40 rounded-2xl p-2.5 max-w-lg mx-auto">
              <div className="flex items-end gap-2">
                <textarea
                  ref={followUpRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (followUpRef.current) {
                      followUpRef.current.style.height = 'auto';
                      followUpRef.current.style.height = Math.min(followUpRef.current.scrollHeight, 120) + 'px';
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (conversationId && input.trim()) sendMessage();
                    }
                  }}
                  placeholder={t.followUpPlaceholder}
                  aria-label={t.followUpPlaceholder}
                  rows={1}
                  className="flex-1 bg-transparent px-3 py-2.5 text-ivory-100 placeholder:text-ivory-600 focus:outline-none text-base leading-relaxed resize-none max-h-[120px] overflow-y-auto"
                  style={{ minHeight: '48px' }}
                />
                <button
                  onClick={() => {
                    if (!input.trim() || thinking) return;
                    if (conversationId) {
                      sendMessage();
                    } else {
                      startConversation('passage', input.trim());
                    }
                  }}
                  disabled={!input.trim() || thinking}
                  aria-label="Send follow-up"
                  className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center disabled:opacity-30 transition-all hover:bg-gold-500/30 shrink-0"
                >
                  <Send size={16} className="text-gold-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Drawer */}
      {showChatHistory && (
        <div className="fixed inset-0 z-[85] bg-ink-950/90 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-ink-900 border border-ink-700/50 rounded-t-3xl animate-slide-up">
            <div className="sticky top-0 bg-ink-900/95 backdrop-blur-md px-6 py-4 border-b border-ink-700/40 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ivory-50">{t.chatHistory}</h2>
              <button onClick={() => setShowChatHistory(false)} className="btn-ghost">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4">
              <button
                onClick={() => startNewChat()}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-300 text-sm font-medium hover:bg-gold-500/15 transition-all no-tap-highlight mb-4"
              >
                <Plus size={16} /> {t.newChat}
              </button>

              {loadingHistory ? (
                <p className="text-ivory-600 text-sm text-center py-8">{t.lookingThrough}</p>
              ) : conversationList.length === 0 ? (
                <p className="text-ivory-600 text-sm text-center py-8">{t.noConversations}</p>
              ) : (
                <>
                  <p className="ui-label mb-3">{t.recent}</p>
                  <div className="flex flex-col gap-2">
                    {conversationList.map((conv) => (
                      <div
                        key={conv.id}
                        className={`premium-card p-3.5 flex items-center gap-3 group ${conv.id === conversationId ? 'border-gold-500/30' : ''}`}
                      >
                        <button
                          onClick={async () => {
                            vibrate(8);
                            setShowChatHistory(false);
                            await loadConversation(conv.id);
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-ivory-100 text-sm font-medium truncate">
                            {conv.title || t.newChat}
                          </p>
                          <p className="text-ivory-600 text-xs mt-0.5 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(conv.updated_at).toLocaleDateString(askLang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { if (confirm(t.confirmArchive)) archiveConversation(conv.id); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ivory-600 hover:text-gold-400 transition-colors no-tap-highlight"
                            aria-label={t.archive}
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            onClick={() => { if (confirm(t.confirmDelete)) deleteConversation(conv.id); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ivory-600 hover:text-clay-400 transition-colors no-tap-highlight"
                            aria-label={t.delete}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Theological Concern Report Modal */}
      {showConcernReport && activeResponseForModal && (
        <div className="fixed inset-0 z-[90] bg-ink-950/90 backdrop-blur-sm flex flex-col">
          <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
            <button onClick={() => setShowConcernReport(false)} className="btn-ghost"><X size={20} /></button>
            <p className="ui-label">Report Concern</p><span className="w-10" />
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-6 animate-fade-in">
            {concernSubmitted ? (
              <div className="premium-card p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={18} className="text-sage-400" />
                </div>
                <p className="text-ivory-100 font-medium text-sm">Thank you</p>
                <p className="text-ivory-500 text-xs mt-2 leading-relaxed">Your concern has been recorded for theological review. SOLAPATH takes theological accuracy seriously.</p>
              </div>
            ) : (
              <>
                <p className="text-ivory-400 text-sm mb-4 leading-relaxed">Help SOLAPATH maintain theological accuracy. Report any concern about this response.</p>
                <p className="ui-label mb-2">Category</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[
                    { value: 'misused_scripture', label: 'Misused Scripture' },
                    { value: 'incorrect_theology', label: 'Incorrect theology' },
                    { value: 'misrepresented_reformed', label: 'Misrepresented Reformed position' },
                    { value: 'misrepresented_other_view', label: 'Misrepresented another Christian view' },
                    { value: 'fake_citation', label: 'Fake / incorrect citation' },
                    { value: 'unsafe_pastoral', label: 'Unsafe pastoral advice' },
                    { value: 'other', label: 'Other' },
                  ].map((cat) => (
                    <button key={cat.value} onClick={() => { vibrate(4); setConcernCategory(cat.value); }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all no-tap-highlight ${
                        concernCategory === cat.value ? 'bg-clay-500/10 border-clay-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                      }`}>{cat.label}</button>
                  ))}
                </div>
                <textarea value={concernDetail} onChange={(e) => setConcernDetail(e.target.value)}
                  placeholder="Describe the concern (optional)..."
                  className="input-field min-h-[80px] resize-none text-sm mb-4" />
                <button
                  onClick={async () => {
                    if (!concernCategory) return;
                    vibrate(10);
                    try {
                      await supabase.from('theological_concern_reports').insert({
                        query_id: activeResponseForModal.query_id || 'unknown',
                        concern_category: concernCategory,
                        concern_detail: concernDetail || null,
                        response_snapshot: activeResponseForModal as unknown as Record<string, unknown>,
                      });
                      setConcernSubmitted(true);
                    } catch {
                      setConcernSubmitted(true);
                    }
                  }}
                  disabled={!concernCategory}
                  className="btn-primary w-full disabled:opacity-40"
                >
                  <Flag size={14} /> Submit Concern
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Source Viewer — only opens on explicit tap */}
      {showSourceViewer && activeResponseForModal && (
        <SourceViewer
          sources={[
            ...(activeResponseForModal.scripture_sources || []),
            ...activeResponseForModal.confessional_sources,
            ...activeResponseForModal.historical_sources,
            ...activeResponseForModal.modern_sources,
          ]}
          onClose={() => setShowSourceViewer(false)}
        />
      )}

      {/* Biblical Basis — only opens on explicit tap */}
      {showBiblicalBasis && activeResponseForModal && (
        <BiblicalBasis
          passages={activeResponseForModal.biblical_basis}
          onClose={() => setShowBiblicalBasis(false)}
          onOpenBible={handleOpenBible}
          translation={activeTranslation}
        />
      )}
    </>
  );
}

// ============================================================
// ScriptureText — renders text with Bible references in gold
// ============================================================

function ScriptureText({ text, className, onOpenBible }: { text: string; className?: string; onOpenBible?: (ref: string) => void }) {
  const refs = [...text.matchAll(SCRIPTURE_REF_REGEX)];
  if (refs.length === 0) return <p className={className}>{text}</p>;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  refs.forEach((match, i) => {
    if (match.index !== undefined && match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    if (onOpenBible) {
      result.push(
        <button
          key={i}
          onClick={() => onOpenBible(match[0])}
          className="text-gold-300 font-semibold hover:text-gold-200 transition-colors inline"
        >
          {match[0]}
        </button>,
      );
    } else {
      result.push(
        <span key={i} className="text-gold-300 font-semibold">
          {match[0]}
        </span>,
      );
    }
    if (match.index !== undefined) lastIndex = match.index + match[0].length;
  });
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  return <p className={className}>{result}</p>;
}

function renderParagraphs(text: string, className: string, onOpenBible?: (ref: string) => void) {
  return text
    .split('\n\n')
    .filter((p) => p.trim())
    .map((para, i) => <ScriptureText key={i} text={para} className={className} onOpenBible={onOpenBible} />);
}

// ============================================================
// ReadingSection — labeled paragraph block for continuous reading
// ============================================================

function ReadingSection({
  label,
  icon: Icon,
  content,
  authority,
  isDemo,
  hasDevelopmentContent,
  sectionClass,
}: {
  label: string;
  icon: typeof BookOpen;
  content: string;
  authority: AuthorityLevel;
  isDemo: boolean;
  hasDevelopmentContent?: boolean;
  sectionClass: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-gold-400/60 shrink-0" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-gold-400/70 font-medium">{label}</span>
        <AuthorityLabel level={authority} />
      </div>
      <div className="space-y-3">
        {renderParagraphs(content, `text-ivory-300 ${sectionClass}`)}
      </div>
      {isDemo && hasDevelopmentContent && (
        <p className="text-ivory-600 text-xs mt-2.5 italic">
          Verified theological sources are not yet connected for this topic.
        </p>
      )}
    </div>
  );
}

// ============================================================
// FollowUpSuggestions — horizontal swipeable suggestion cards with page indicator
// ============================================================

function generateFollowUps(response: StructuredTheologicalResponse): string[] {
  const suggestions: string[] = [];
  const question = response.answer_summary;

  if (response.recommended_scripture.length > 0) {
    const ref = response.recommended_scripture[0].reference;
    suggestions.push(`Can you explain ${ref} further?`);
  }

  if (response.biblical_basis.length > 0) {
    const ref = response.biblical_basis[0].reference;
    if (!suggestions.some((s) => s.includes(ref))) {
      suggestions.push(`What does ${ref} mean in context?`);
    }
  }

  suggestions.push('How can I apply this today?');

  if (response.recommended_scripture.length === 0 && response.biblical_basis.length === 0) {
    suggestions.push('What Scripture should I read next?');
  }

  if (response.reformed_understanding && !response.has_development_content) {
    suggestions.push('What does the Reformed tradition say about this?');
  }

  if (response.other_christian_views) {
    suggestions.push('How do other Christian traditions view this?');
  }

  return suggestions.slice(0, 5);
}

function FollowUpSuggestions({
  suggestions,
  onTap,
}: {
  suggestions: string[];
  onTap: (text: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (suggestions.length === 0) return null;

  const onScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / suggestions.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  return (
    <div className="mt-5 -mx-5">
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onTap(s)}
            className="shrink-0 w-[280px] snap-center flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-ink-800/50 border border-ink-600/30 text-ivory-200 text-[15px] hover:border-gold-500/30 hover:text-ivory-100 transition-all no-tap-highlight"
          >
            <span className="text-left leading-snug flex-1">{s}</span>
            <ArrowUpRight size={16} className="text-gold-400/60 shrink-0" />
          </button>
        ))}
      </div>
      {/* Page indicator */}
      {suggestions.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {suggestions.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 h-1.5 bg-gold-400/60' : 'w-1.5 h-1.5 bg-ivory-700/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// AssistantMessage — renders one AI response as continuous editorial reading
// ============================================================

interface AssistantMessageProps {
  itemId: string;
  response: StructuredTheologicalResponse;
  dismissedProposals: Set<string>;
  scale: { body: string; section: string; user: string };
  translation: BibleTranslation;
  onDismissProposal: (id: string) => void;
  onShowSources: () => void;
  onShowBiblicalBasis: () => void;
  onOpenBible: (reference: string) => void;
  onSuggestionTap: (text: string) => void;
  onShare: () => void;
  onReportConcern: () => void;
}

function AssistantMessage({
  itemId,
  response,
  dismissedProposals,
  scale,
  translation,
  onDismissProposal,
  onShowSources,
  onShowBiblicalBasis,
  onOpenBible,
  onSuggestionTap,
  onShare,
  onReportConcern,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const activeProposals = response.memory_proposals || [];
  const visibleProposals = activeProposals.filter((_, i) => !dismissedProposals.has(`${itemId}-${i}`));

  function handleCopy() {
    vibrate(6);
    navigator.clipboard.writeText(response.answer_summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleFeedback(type: 'up' | 'down') {
    vibrate(4);
    setFeedback(type);
  }

  return (
    <div data-msg-id={itemId} className="mb-8 animate-fade-in-up">
      {/* No dev/development mode indicators in production UI */}

      <div className="mb-4">
        <TheologicalConfidenceLabel confidence={response.theological_confidence} />
      </div>

      {/* Scripture-first encouragement */}
      {response.scripture_first_mode === 'ENCOURAGE_SCRIPTURE_FIRST' && response.recommended_scripture.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={15} className="text-gold-300" />
            <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
              {t.letsBegin}
            </p>
          </div>
          <h3 className="font-serif text-2xl text-gold-300 mb-1.5">
            {localizeRef(response.recommended_scripture[0].reference, translation)}
          </h3>
          <p className={`text-ivory-300 ${scale.section} mb-1`}>
            {response.recommended_scripture[0].reading_objective}
          </p>
          <p className="text-ivory-500 text-xs italic mb-3">
            {response.recommended_scripture[0].reason}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onOpenBible(response.recommended_scripture[0].reference)}
              className="btn-primary w-full text-sm"
            >
              <BookOpen size={16} />
              {t.openingMyBible}
            </button>
          </div>
        </div>
      )}

      {/* Scripture recommendation note */}
      {response.scripture_first_mode === 'ANSWER_WITH_SCRIPTURE_RECOMMENDATION' && response.recommended_scripture.length > 0 && (
        <p className="text-ivory-500 text-sm leading-relaxed mb-4">
          <BookOpen size={13} className="text-gold-400/60 inline shrink-0 mr-1 -mt-0.5" />
          Consider reading{' '}
          <span className="text-gold-300 font-semibold">{localizeRef(response.recommended_scripture[0].reference, translation)}</span>
          {' '}first. {response.recommended_scripture[0].reason}
        </p>
      )}

      {/* Divine revelation warning */}
      {response.divine_revelation_claim_detected && response.divine_revelation_response && (
        <div className="mb-5 pl-4 border-l-2 border-error/40">
          <div className="flex items-center gap-2 mb-2">
            <ShieldX size={15} className="text-error shrink-0" />
            <p className="text-xs uppercase tracking-[0.2em] text-error/80 font-medium">
              Scripture is the Standard
            </p>
          </div>
          <div className="space-y-2">
            {response.divine_revelation_response.split('\n\n').map((para, i) => (
              <p key={i} className={`text-ivory-200 ${scale.section} leading-relaxed`}>{para}</p>
            ))}
          </div>
          <p className="text-ivory-500 text-xs italic leading-relaxed mt-2">
            <ShieldCheck size={12} className="inline text-gold-400/60 mr-1 -mt-0.5" />
            SOLAPATH cannot authenticate private revelation. Personal impressions, circumstances, feelings, dreams, or inner thoughts should not be treated as equal to Scripture.
          </p>
        </div>
      )}

      {/* Teacher attribution blocked */}
      {response.teacher_attribution_blocked && (
        <div className="mb-4 flex items-start gap-2">
          <AlertCircle size={14} className="text-clay-400 shrink-0 mt-0.5" />
          <p className="text-ivory-400 text-xs leading-relaxed">{response.teacher_attribution_blocked}</p>
        </div>
      )}

      {/* Human support recommended */}
      {response.human_support_recommended && response.human_support_note && (
        <div className="mb-4 flex items-start gap-2">
          <Hand size={14} className="text-clay-400 shrink-0 mt-0.5" />
          <p className="text-ivory-400 text-xs leading-relaxed">{response.human_support_note}</p>
        </div>
      )}

      {/* MAIN RESPONSE — editorial reading directly on page background */}
      <div className="space-y-5">
        {/* Answer summary — the centerpiece, large serif reading text */}
        <div className="space-y-3">
          {renderParagraphs(response.answer_summary, `font-serif ${scale.body} text-ivory-100`, onOpenBible)}
        </div>

        {/* Inline Scripture blocks — exact local text from active translation */}
        {response.recommended_scripture.map((rec, i) => (
          <ScriptureBlock
            key={i}
            reference={rec.reference}
            translation={translation}
            onOpenBible={onOpenBible}
          />
        ))}

        {/* Scripture testing flow — rendered as reading sections */}
        {response.scripture_testing_flow && (
          <div className="space-y-4 pt-2 border-t border-ink-700/20">
            {response.scripture_testing_flow.what_scripture_clearly_teaches && (
              <ReadingSection label="What Scripture Clearly Teaches" icon={BookOpen} authority="scripture" content={response.scripture_testing_flow.what_scripture_clearly_teaches} isDemo={response.is_demo} sectionClass={scale.section} />
            )}
            {response.scripture_testing_flow.what_scripture_does_not_say && (
              <ReadingSection label="What Scripture Does Not Say" icon={AlertCircle} authority="explanation" content={response.scripture_testing_flow.what_scripture_does_not_say} isDemo={response.is_demo} sectionClass={scale.section} />
            )}
            {response.scripture_testing_flow.wisdom_considerations && (
              <ReadingSection label="Wisdom Considerations" icon={HelpCircle} authority="application" content={response.scripture_testing_flow.wisdom_considerations} isDemo={response.is_demo} sectionClass={scale.section} />
            )}
            {response.scripture_testing_flow.human_counsel && (
              <ReadingSection label="Human Counsel" icon={UserCheck} authority="explanation" content={response.scripture_testing_flow.human_counsel} isDemo={response.is_demo} sectionClass={scale.section} />
            )}
            {response.scripture_testing_flow.prayer && (
              <ReadingSection label="Prayer" icon={Heart} authority="application" content={response.scripture_testing_flow.prayer} isDemo={response.is_demo} sectionClass={scale.section} />
            )}
          </div>
        )}

        {/* Additional context sections — continuous reading */}
        {response.scripture_context && !response.has_development_content && (
          <div className="pt-2 border-t border-ink-700/20">
            <ReadingSection label="Scripture Context" icon={Scroll} authority="explanation" content={response.scripture_context} isDemo={response.is_demo} sectionClass={scale.section} />
          </div>
        )}

        {response.reformed_understanding && !response.has_development_content && (
          <div className="pt-2 border-t border-ink-700/20">
            <ReadingSection label="Historical Theology" icon={Landmark} authority="historic_theology" content={response.reformed_understanding} isDemo={false} sectionClass={scale.section} />
          </div>
        )}

        {response.other_christian_views && !response.has_development_content && (
          <div className="pt-2 border-t border-ink-700/20">
            <ReadingSection label="Other Christian Views" icon={AlertCircle} authority="explanation" content={response.other_christian_views} isDemo={response.is_demo} sectionClass={scale.section} />
          </div>
        )}

        {response.application && !response.has_development_content && (
          <div className="pt-2 border-t border-ink-700/20">
            <ReadingSection label="Application" icon={Lightbulb} authority="application" content={response.application} isDemo={response.is_demo} sectionClass={scale.section} />
          </div>
        )}

        {response.prayer_guidance && !response.has_development_content && (
          <div className="pt-2 border-t border-ink-700/20">
            <ReadingSection label="Prayer Guidance" icon={Heart} authority="application" content={response.prayer_guidance} isDemo={response.is_demo} sectionClass={scale.section} />
          </div>
        )}
      </div>

      {/* Memory proposals */}
      {visibleProposals.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {visibleProposals.map((proposal, idx) => (
            <MemoryProposalCard
              key={idx}
              proposal={proposal}
              onDismiss={() => onDismissProposal(`${itemId}-${idx}`)}
            />
          ))}
        </div>
      )}

      {/* Action bar — compact chips */}
      <div className="flex items-center gap-2 mt-5 flex-wrap">
        <button onClick={onShowBiblicalBasis} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
          <FileText size={13} />
          {t.biblicalBasis}
        </button>
        <button onClick={onShowSources} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
          <ShieldCheck size={13} />
          {t.sources}
        </button>
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
          {copied ? <Check size={13} className="text-sage-400" /> : <Copy size={13} />}
          {copied ? t.copied : t.copy}
        </button>
        <button onClick={onShare} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
          <Share size={13} />
          {t.share}
        </button>
        <button
          onClick={() => handleFeedback('up')}
          className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all no-tap-highlight ${
            feedback === 'up' ? 'bg-sage-500/10 border-sage-500/30 text-sage-400' : 'bg-ink-800/40 border-ink-600/30 text-ivory-400 hover:text-ivory-200'
          }`}
          aria-label="Helpful"
        >
          <ThumbsUp size={13} />
        </button>
        <button
          onClick={() => handleFeedback('down')}
          className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all no-tap-highlight ${
            feedback === 'down' ? 'bg-clay-500/10 border-clay-500/30 text-clay-400' : 'bg-ink-800/40 border-ink-600/30 text-ivory-400 hover:text-ivory-200'
          }`}
          aria-label="Not helpful"
        >
          <ThumbsDown size={13} />
        </button>
      </div>

      {/* Verification state + concern report */}
      <div className="mt-3 flex flex-col gap-1">
        {(() => {
          const vState: VerificationState = response.verification_state ||
            (response.source_confidence === 'verified' ? 'ALL_SOURCES_VERIFIED' :
             response.source_confidence === 'partial' ? 'PARTIALLY_VERIFIED' :
             'SOURCES_UNAVAILABLE');
          const showBadge = vState !== 'NO_EXTERNAL_SOURCES_REQUIRED';
          if (!showBadge) return null;
          const dotColor = vState === 'ALL_SOURCES_VERIFIED' ? 'bg-sage-400' :
            vState === 'PARTIALLY_VERIFIED' ? 'bg-gold-400' : 'bg-ivory-600';
          const label = vState === 'ALL_SOURCES_VERIFIED' ? t.allSourcesVerified :
            vState === 'PARTIALLY_VERIFIED' ? t.someSourcesVerified :
            t.sourcesUnavailable;
          return (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dotColor}`} />
              <p className="text-ivory-600 text-xs">{label}</p>
            </div>
          );
        })()}
        {!response.validation_passed && response.validation_warnings.length > 0 && (
          <div className="flex items-center gap-2">
            <ShieldX size={11} className="text-error shrink-0" />
            <p className="text-error text-xs">Response flagged by safety validator: {response.validation_warnings[0]}</p>
          </div>
        )}
        <button
          onClick={onReportConcern}
          className="flex items-center gap-1.5 mt-0.5 text-ivory-600 hover:text-clay-400 transition-colors text-xs no-tap-highlight"
        >
          <Flag size={10} />
          {t.reportConcern}
        </button>
      </div>

      {/* Follow-up suggestions — horizontal carousel with page indicator */}
      <FollowUpSuggestions suggestions={generateFollowUps(response)} onTap={onSuggestionTap} />
    </div>
  );
}
