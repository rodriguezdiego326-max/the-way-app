import { supabase } from './supabase';
import type {
  IntelligenceRequest,
  StructuredTheologicalResponse,
} from './intelligenceTypes';
import type { Profile, Memory } from './types';

// ============================================================
// SOLAPATH Intelligence — Client Service
// Calls the server-side edge function, handles development fallback,
// and manages selective memory retrieval.
// ============================================================

export async function fetchIntelligenceResponse(
  question: string,
  profile: Profile | null,
  theologicalDepth: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; body: string }>,
  sessionId?: string,
  responseLanguage?: string,
): Promise<StructuredTheologicalResponse> {
  // Retrieve relevant memories (selective, not all)
  const relevantMemories = await retrieveRelevantMemories(question, profile);

  const request: IntelligenceRequest = {
    question,
    theological_depth: theologicalDepth,
    response_language: responseLanguage,
    profile: profile
      ? {
          display_name: profile.display_name,
          life_stage: profile.life_stage,
          season: profile.season,
          current_study: profile.current_study,
          theological_familiarity: profile.reformed_familiarity,
          bible_familiarity: profile.bible_familiarity,
          available_time_minutes: profile.available_time_minutes,
        }
      : undefined,
    relevant_memories: relevantMemories,
    conversation_history: conversationHistory,
    session_id: sessionId,
  };

  // Call the edge function
  const { data: sessionData } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (sessionData?.session?.access_token) {
    headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(
    `${supabaseUrl}/functions/v1/the-way-intelligence`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    let errorMessage = 'Something went wrong. Please try again.';
    try {
      const errData = await response.json();
      if (errData?.message) errorMessage = errData.message;
    } catch {
      // Response wasn't JSON — use status-based message
      if (response.status === 401) errorMessage = 'Please sign in and try again.';
      else if (response.status === 403) errorMessage = 'You do not have access to this feature.';
      else if (response.status === 429) errorMessage = 'Too many requests. Please wait a moment and try again.';
      else if (response.status >= 500) errorMessage = 'Something went wrong. Please try again.';
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data as StructuredTheologicalResponse;
}

// ============================================================
// Selective Memory Retrieval
// Only retrieves memories relevant to the current question.
// Does NOT dump the user's entire personal history.
// ============================================================

async function retrieveRelevantMemories(
  question: string,
  profile: Profile | null,
): Promise<Array<{ category: string; content: string }>> {
  if (!profile?.memory_enabled) return [];

  const { data: memories } = await supabase
    .from('memories')
    .select('category, content')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!memories || memories.length === 0) return [];

  const q = question.toLowerCase();
  const filtered: Array<{ category: string; content: string }> = [];

  for (const m of memories as Pick<Memory, 'category' | 'content'>[]) {
    const content = m.content.toLowerCase();
    const category = m.category.toLowerCase();

    // Category-based relevance
    if (
      (q.includes('wife') || q.includes('marriage') || q.includes('husband')) &&
      (category.includes('family') || category.includes('relation') || content.includes('marriage'))
    ) {
      filtered.push({ category: m.category, content: m.content });
      continue;
    }
    if (
      (q.includes('work') || q.includes('job') || q.includes('business')) &&
      (category.includes('work') || content.includes('work') || content.includes('job'))
    ) {
      filtered.push({ category: m.category, content: m.content });
      continue;
    }
    if (
      (q.includes('pray') || q.includes('prayer')) &&
      (category.includes('prayer') || content.includes('pray'))
    ) {
      filtered.push({ category: m.category, content: m.content });
      continue;
    }
    if (
      (q.includes('patience') || q.includes('anger') || q.includes('stress')) &&
      (category.includes('growth') || content.includes('patience') || content.includes('anger'))
    ) {
      filtered.push({ category: m.category, content: m.content });
      continue;
    }
    if (
      (q.includes('child') || q.includes('parent') || q.includes('family')) &&
      (category.includes('family') || content.includes('child') || content.includes('parent'))
    ) {
      filtered.push({ category: m.category, content: m.content });
      continue;
    }

    // Keyword overlap for general questions
    const keywords = q.split(/\s+/).filter((w) => w.length > 4);
    if (keywords.some((k) => content.includes(k))) {
      filtered.push({ category: m.category, content: m.content });
    }
  }

  // Limit to most relevant
  return filtered.slice(0, 5);
}

// ============================================================
// Memory Proposal Handler
// ============================================================

export async function saveMemoryProposal(
  content: string,
  type: string,
  sensitivity: 'normal' | 'personal' | 'highly_sensitive',
): Promise<void> {
  const categoryMap: Record<string, string> = {
    PROFILE: 'life_stage',
    PREFERENCE: 'preference',
    CURRENT_SEASON: 'life',
    SPIRITUAL_GOAL: 'goals',
    BIBLE_STUDY: 'bible_study',
    PRAYER_CONTEXT: 'prayer',
    LIFE_EVENT: 'life_event',
    RELATIONSHIP_CONTEXT: 'family',
    TEMPORARY_CONTEXT: 'life',
    REFLECTION_PATTERN: 'reflection',
  };

  // Map sensitivity levels to database values
  const sensitivityMap: Record<string, string> = {
    normal: 'low',
    personal: 'medium',
    highly_sensitive: 'high',
  };

  await supabase.from('memories').insert({
    category: categoryMap[type] || 'life',
    content,
    source: 'user_input',
    active: true,
    user_confirmed: true,
    sensitivity: sensitivityMap[sensitivity] || 'low',
  });
}
