import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ============================================================
// SOLAPATH Memory Retrieval Edge Function
// Queries user-owned records server-side using the caller's JWT.
// RLS enforces owner-scoping — no service role key used for data.
// Returns structured MemoryEvidence objects for the Ask engine.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MemoryEvidence {
  source_type: string;
  source_id: string;
  created_at: string;
  scripture_reference?: string;
  topic?: string;
  factual_summary: string;
  relevance_reason: string;
}

interface MemoryRequest {
  question: string;
  conversation_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerToken = authHeader.slice(7);

  let verifiedUserId: string;
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${callerToken}`, apikey: supabaseAnonKey },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userData = await userRes.json();
    if (!userData?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    verifiedUserId = userData.id as string;
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { question } = (await req.json()) as MemoryRequest;
    if (!question || !question.trim()) {
      return new Response(JSON.stringify({ evidence: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const q = question.toLowerCase().trim();
    const keywords = q.split(/\s+/).filter((w) => w.length > 3);
    const isRecallQuery = isMemoryRecallQuestion(q);

    const evidence: MemoryEvidence[] = [];
    const headers = {
      Authorization: `Bearer ${callerToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const queries: Promise<MemoryEvidence[]>[] = [
      queryBibleNotes(supabaseUrl, headers, q, keywords, isRecallQuery),
      queryReadingHistory(supabaseUrl, headers, q, keywords, isRecallQuery),
      queryBookmarks(supabaseUrl, headers, q, keywords, isRecallQuery),
      queryHighlights(supabaseUrl, headers, q, keywords, isRecallQuery),
      queryWalks(supabaseUrl, headers, q, keywords, isRecallQuery),
      queryPrayers(supabaseUrl, headers, q, keywords, isRecallQuery),
      queryAskConversations(supabaseUrl, headers, q, keywords, isRecallQuery),
    ];

    const results = await Promise.allSettled(queries);
    for (const result of results) {
      if (result.status === "fulfilled") {
        evidence.push(...result.value);
      }
    }

    const ranked = rankEvidence(evidence, q, isRecallQuery);
    const limited = ranked.slice(0, 8);

    return new Response(JSON.stringify({ evidence: limited }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ evidence: [], error: "Memory retrieval failed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function isMemoryRecallQuestion(q: string): boolean {
  const recallPhrases = [
    "do you remember", "what did i", "what was that", "have i prayed",
    "have i studied", "what verse was i", "what did we talk about",
    "last time", "previously", "before i asked",
  ];
  return recallPhrases.some((p) => q.includes(p));
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return false;
  return keywords.some((k) => text.includes(k));
}

function formatRef(book: string, chapter: number, verseStart?: number, verseEnd?: number): string {
  if (verseStart !== undefined && verseStart !== null) {
    return `${book} ${chapter}:${verseStart}${verseEnd && verseEnd !== verseStart ? `–${verseEnd}` : ""}`;
  }
  return `${book} ${chapter}`;
}

async function queryBibleNotes(
  supabaseUrl: string,
  headers: Record<string, string>,
  q: string,
  keywords: string[],
  isRecall: boolean,
): Promise<MemoryEvidence[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/bible_notes?select=id,book,chapter,verse_start,verse_end,title,content,created_at&order=created_at.desc&limit=15`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const note of rows) {
    const ref = formatRef(note.book, note.chapter, note.verse_start, note.verse_end);
    const noteText = `${note.title || ""} ${note.content || ""}`.toLowerCase();
    const matches = isRecall || matchesKeywords(noteText, keywords) || matchesKeywords(ref.toLowerCase(), keywords);
    if (matches) {
      results.push({
        source_type: "bible_note",
        source_id: note.id,
        created_at: note.created_at,
        scripture_reference: ref,
        topic: note.title || undefined,
        factual_summary: `Note in ${ref}: ${(note.title || note.content || "").slice(0, 150)}`,
        relevance_reason: `Note content matches question keywords`,
      });
    }
  }
  return results;
}

async function queryReadingHistory(
  supabaseUrl: string,
  headers: Record<string, string>,
  q: string,
  keywords: string[],
  isRecall: boolean,
): Promise<MemoryEvidence[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/bible_reading_history?select=id,book,chapter,verse,updated_at&order=updated_at.desc&limit=15`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const h of rows) {
    const ref = formatRef(h.book, h.chapter, h.verse);
    const matches = isRecall || matchesKeywords(ref.toLowerCase(), keywords);
    if (matches) {
      results.push({
        source_type: "bible_reading",
        source_id: h.id,
        created_at: h.updated_at,
        scripture_reference: ref,
        factual_summary: `Read ${ref}`,
        relevance_reason: `Recently read passage matches question`,
      });
    }
  }
  return results;
}

async function queryBookmarks(
  supabaseUrl: string,
  headers: Record<string, string>,
  q: string,
  keywords: string[],
  isRecall: boolean,
): Promise<MemoryEvidence[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/bible_bookmarks?select=id,book,chapter,verse_start,verse_end,label,created_at&order=created_at.desc&limit=15`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const bm of rows) {
    const ref = formatRef(bm.book, bm.chapter, bm.verse_start, bm.verse_end);
    const labelText = (bm.label || "").toLowerCase();
    const matches = isRecall || matchesKeywords(ref.toLowerCase(), keywords) || matchesKeywords(labelText, keywords);
    if (matches) {
      results.push({
        source_type: "bookmark",
        source_id: bm.id,
        created_at: bm.created_at,
        scripture_reference: ref,
        topic: bm.label || undefined,
        factual_summary: `Bookmarked ${ref}${bm.label ? ` (${bm.label})` : ""}`,
        relevance_reason: `Saved passage matches question`,
      });
    }
  }
  return results;
}

async function queryHighlights(
  supabaseUrl: string,
  headers: Record<string, string>,
  q: string,
  keywords: string[],
  isRecall: boolean,
): Promise<MemoryEvidence[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/bible_highlights?select=id,book,chapter,verse_start,verse_end,selected_text,color_key,created_at&order=created_at.desc&limit=15`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const hl of rows) {
    const ref = formatRef(hl.book, hl.chapter, hl.verse_start, hl.verse_end);
    const hlText = (hl.selected_text || "").toLowerCase();
    const matches = isRecall || matchesKeywords(hlText, keywords) || matchesKeywords(ref.toLowerCase(), keywords);
    if (matches) {
      results.push({
        source_type: "highlight",
        source_id: hl.id,
        created_at: hl.created_at,
        scripture_reference: ref,
        factual_summary: `Highlighted ${ref}: ${(hl.selected_text || "").slice(0, 120)}`,
        relevance_reason: `Highlighted text matches question`,
      });
    }
  }
  return results;
}

async function queryWalks(
  supabaseUrl: string,
  headers: Record<string, string>,
  q: string,
  keywords: string[],
  isRecall: boolean,
): Promise<MemoryEvidence[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/walks?select=id,passage_reference,reading_objective,status,created_at&order=created_at.desc&limit=10`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const w of rows) {
    const refText = `${w.passage_reference || ""} ${w.reading_objective || ""}`.toLowerCase();
    const matches = isRecall || matchesKeywords(refText, keywords);
    if (matches) {
      results.push({
        source_type: "today_walk",
        source_id: w.id,
        created_at: w.created_at,
        scripture_reference: w.passage_reference || undefined,
        topic: w.reading_objective || undefined,
        factual_summary: `Today's Walk on ${w.passage_reference || "a passage"} (${w.status})`,
        relevance_reason: `Walk topic matches question`,
      });
    }
  }
  return results;
}

async function queryPrayers(
  supabaseUrl: string,
  headers: Record<string, string>,
  q: string,
  keywords: string[],
  isRecall: boolean,
): Promise<MemoryEvidence[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/prayers?select=id,title,description,related_scripture,status,created_at&order=created_at.desc&limit=15`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const p of rows) {
    const prayerText = `${p.title || ""} ${p.description || ""} ${p.related_scripture || ""}`.toLowerCase();
    const matches = isRecall || matchesKeywords(prayerText, keywords) || q.includes("pray");
    if (matches) {
      results.push({
        source_type: "prayer",
        source_id: p.id,
        created_at: p.created_at,
        scripture_reference: p.related_scripture || undefined,
        topic: p.title || undefined,
        factual_summary: `Prayer: ${p.title || "untitled"} (${p.status})${p.related_scripture ? `, Scripture: ${p.related_scripture}` : ""}`,
        relevance_reason: `Prayer topic matches question`,
      });
    }
  }
  return results;
}

async function queryAskConversations(
  supabaseUrl: string,
  headers: Record<string, string>,
  q: string,
  keywords: string[],
  isRecall: boolean,
): Promise<MemoryEvidence[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/ask_conversations?select=id,title,intent,created_at&order=created_at.desc&limit=10`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const c of rows) {
    const convText = `${c.title || ""} ${c.intent || ""}`.toLowerCase();
    const matches = isRecall || matchesKeywords(convText, keywords);
    if (matches) {
      results.push({
        source_type: "ask_conversation",
        source_id: c.id,
        created_at: c.created_at,
        topic: c.title || undefined,
        factual_summary: `Previous conversation: ${c.title || "untitled"} (${c.intent || "general"})`,
        relevance_reason: `Prior conversation topic matches question`,
      });
    }
  }
  return results;
}

function rankEvidence(evidence: MemoryEvidence[], q: string, isRecall: boolean): MemoryEvidence[] {
  const now = Date.now();
  return evidence
    .map((e) => {
      let score = 0;
      const ageDays = (now - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 30 - ageDays) * 0.5;
      if (isRecall) score += 20;
      if (e.scripture_reference && q.includes(e.scripture_reference.toLowerCase().split(" ")[0])) score += 15;
      if (e.topic && matchesKeywords(e.topic.toLowerCase(), q.split(/\s+/).filter((w) => w.length > 3))) score += 10;
      return { evidence: e, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.evidence);
}
