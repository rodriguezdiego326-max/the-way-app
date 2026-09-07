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
    const keywords = extractKeywords(q);
    const recallInfo = classifyRecallIntent(q);

    const evidence: MemoryEvidence[] = [];
    const headers = {
      Authorization: `Bearer ${callerToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };

    const queries: Promise<MemoryEvidence[]>[] = [
      queryBibleNotes(supabaseUrl, headers, q, keywords, recallInfo),
      queryReadingHistory(supabaseUrl, headers, q, keywords, recallInfo),
      queryBookmarks(supabaseUrl, headers, q, keywords, recallInfo),
      queryHighlights(supabaseUrl, headers, q, keywords, recallInfo),
      queryWalks(supabaseUrl, headers, q, keywords, recallInfo),
      queryPrayers(supabaseUrl, headers, q, keywords, recallInfo),
      queryAskConversations(supabaseUrl, headers, q, keywords, recallInfo),
    ];

    const results = await Promise.allSettled(queries);
    for (const result of results) {
      if (result.status === "fulfilled") {
        evidence.push(...result.value);
      }
    }

    const ranked = rankEvidence(evidence, q, keywords, recallInfo);
    const limited = ranked.slice(0, 8);

    return new Response(JSON.stringify({ evidence: limited }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ evidence: [], error: "Memory retrieval failed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// ============================================================
// RECALL INTENT CLASSIFICATION
// Distinguishes direct recall questions from generative questions.
// ============================================================

interface RecallIntent {
  isRecall: boolean;
  recallType: "bookmark" | "highlight" | "note" | "prayer" | "reading" | "conversation" | "walk" | "general" | null;
  isSpiritualInterpretation: boolean;
  isCurrentStatement: boolean;
}

function classifyRecallIntent(q: string): RecallIntent {
  const isRecall = /\b(?:did i|do i|have i|what (?:verse|passage|chapter) did i|what did i|what was i|what were we|what have i|do you remember|what did we|what \w+ did we|what was that|last time|previously|what have we|what has god been|what is god (?:trying|doing)|what has god been teaching|what has god been showing)\b/.test(q);
  const isSpiritualInterpretation = /\b(?:what has god been (?:teaching|showing|doing)|what is god (?:trying to (?:tell|show|teach)|doing)|what is the lord (?:teaching|showing|doing))\b/.test(q);

  let recallType: RecallIntent["recallType"] = null;
  if (/\b(?:save|saved|bookmark)\b/.test(q)) recallType = "bookmark";
  else if (/\b(?:highlight|highlighted|underline|marked)\b/.test(q)) recallType = "highlight";
  else if (/\b(?:note|noted|wrote|wrote down|jot)\b/.test(q)) recallType = "note";
  else if (/\b(?:pray|prayed|prayer)\b/.test(q)) recallType = "prayer";
  else if (/\b(?:read|reading|was reading|what was i reading)\b/.test(q)) recallType = "reading";
  else if (/\b(?:talk|talked|discuss|discussed|conversation|asked about)\b/.test(q)) recallType = "conversation";
  else if (/\b(?:walk|studied|study|today's walk)\b/.test(q)) recallType = "walk";
  else if (isRecall) recallType = "general";

  return {
    isRecall,
    recallType,
    isSpiritualInterpretation,
    isCurrentStatement: false,
  };
}

// ============================================================
// KEYWORD EXTRACTION
// Filters stop words and short tokens.
// ============================================================

const STOP_WORDS = new Set([
  "the", "this", "that", "what", "have", "does", "did", "was", "were", "been",
  "about", "with", "from", "your", "you", "me", "my", "mine", "our", "ours",
  "they", "them", "their", "there", "here", "when", "where", "which", "who",
  "whom", "whose", "why", "how", "all", "any", "some", "not", "nor", "but",
  "and", "for", "are", "is", "am", "be", "been", "being", "had", "has",
  "will", "would", "could", "should", "may", "might", "must", "shall",
  "can", "into", "onto", "over", "under", "than", "then", "these", "those",
  "very", "just", "also", "only", "such", "same", "other", "more", "most",
  "many", "much", "few", "less", "least", "one", "two", "three", "first",
  "last", "next", "new", "old", "before", "after", "again", "still",
  "even", "ever", "never", "always", "often", "sometimes", "usually",
  "save", "saved", "verse", "passage", "chapter", "scripture", "bible",
  "word", "words", "god", "jesus", "christ", "lord", "holy", "spirit",
  "church", "pray", "prayer", "prayed", "study", "studied", "highlight",
  "highlighted", "bookmark", "note", "remember", "talk", "talked",
]);

function extractKeywords(q: string): string[] {
  return q
    .split(/[\s,.?!;:'"()-]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .map((w) => w.toLowerCase());
}

// ============================================================
// SEMANTIC TOPIC GROUPS
// Maps related concepts so recall can find semantically related records.
// ============================================================

const TOPIC_SYNONYMS: Record<string, string[]> = {
  forgive: ["forgiveness", "pardon", "resentment", "bitterness", "grudge", "mercy"],
  patience: ["patient", "endurance", "perseverance", "waiting", "longsuffering", "steadfastness"],
  meditate: ["meditation", "meditating", "reflect", "reflection", "ponder", "dwell", "delight"],
  justify: ["justification", "justified", "righteous", "righteousness", "declared", "imputed"],
  adopt: ["adoption", "adopted", "children", "sons", "heirs", "inheritance"],
  sanctif: ["sanctification", "sanctified", "holy", "holiness", "consecrated", "transform"],
  predestin: ["election", "elected", "chosen", "predestined", "ordained", "foreknew"],
  providen: ["providence", "sovereign", "sovereignty", "ordain", "govern", "control"],
  atonement: ["atonement", "substitution", "sacrifice", "propitiation", "reconciliation"],
  trinity: ["triune", "godhead", "father", "son", "spirit", "three"],
  faith: ["faithful", "faithfulness", "believe", "belief", "trust", "trusted"],
  grace: ["gracious", "favor", "mercy", "lovingkindness"],
  prayer: ["pray", "prayed", "praying", "intercession", "supplication", "petition"],
  teach: ["teaching", "taught", "disciple", "discipleship", "instruct", "instruction"],
  love: ["loving", "beloved", "charity", "agape"],
  hope: ["hopeful", "expectation", "promise", "future"],
  peace: ["peaceful", "rest", "calm", "quiet"],
  joy: ["joyful", "rejoice", "glad", "gladness", "delight"],
  wisdom: ["wise", "understanding", "insight", "prudence"],
  obedience: ["obey", "obeyed", "keep", "keeping", "command", "commandment"],
  stewardship: ["steward", "generous", "giving", "tithe", "offering", "money", "resource"],
  gossip: ["slander", "talebearer", "whisperer", "tongue", "words"],
  lazy: ["laziness", "sloth", "sluggard", "idle", "diligent", "diligence", "work"],
  hospitality: ["guest", "stranger", "welcome", "host", "entertain"],
  widow: ["widows", "orphan", "fatherless", "affliction", "pure religion"],
  marriage: ["wife", "husband", "spouse", "wed", "wedding", "matrimony"],
  divorce: ["divorce", "separation", "remarriage"],
  anger: ["wrath", "rage", "furious", "indignation"],
  fear: ["afraid", "anxiety", "anxious", "worry", "worried", "dread"],
  salvation: ["saved", "save", "redeemed", "redemption", "deliverance"],
  covenant: ["promise", "oath", "agreement", "testament"],
  kingdom: ["reign", "rule", "throne", "dominion", "authority"],
  worship: ["praise", "adoration", "exalt", "magnify", "glorify"],
  suffering: ["affliction", "trial", "tribulation", "persecution", "hardship", "pain"],
  temptation: ["tempt", "tempted", "trial", "test", "tested", "lust", "desire"],
  repent: ["repentance", "repented", "turn", "turned", "conversion", "change"],
  resurrection: ["resurrect", "raised", "life", "eternal", "immortality"],
  creation: ["create", "created", "creator", "beginning", "genesis"],
  exile: ["exile", "captivity", "babylon", "dispersion"],
  exodus: ["exodus", "deliverance", "egypt", "passover", "departure"],
  law: ["commandment", "torah", "legal", "statute", "decree", "ordinance"],
  grace_alone: ["sola", "alone", "only", "sole", "exclusive"],
  faith_alone: ["sola fide", "faith alone", "believing alone"],
  scripture_alone: ["sola scriptura", "scripture alone", "word alone"],
  christ_alone: ["solus christus", "christ alone", "jesus alone"],
  glory_alone: ["soli deo", "glory alone", "god alone"],
  "god's word": ["word of god", "scripture", "bible", "law", "truth", "precepts", "statutes"],
  consistent: ["consistency", "faithful", "regular", "habit", "discipline", "daily", "routine"],
  exhausted: ["tired", "weary", "drained", "burnout", "burned out", "fatigue", "no energy"],
  alaska: ["alaska", "move", "moving", "relocate", "relocation"],
};

function getSemanticTerms(q: string): Set<string> {
  const terms = new Set<string>();
  for (const [key, synonyms] of Object.entries(TOPIC_SYNONYMS)) {
    if (q.includes(key) || synonyms.some((s) => q.includes(s))) {
      terms.add(key);
      for (const s of synonyms) terms.add(s);
    }
  }
  return terms;
}

function matchesSemantic(text: string, q: string, keywords: string[]): boolean {
  if (keywords.length === 0) return false;
  if (keywords.some((k) => text.includes(k))) return true;
  const semanticTerms = getSemanticTerms(q);
  if (semanticTerms.size > 0) {
    let semanticMatches = 0;
    for (const term of semanticTerms) {
      if (text.includes(term)) semanticMatches++;
    }
    return semanticMatches >= 1;
  }
  return false;
}

function formatRef(book: string, chapter: number, verseStart?: number, verseEnd?: number): string {
  if (verseStart !== undefined && verseStart !== null) {
    return `${book} ${chapter}:${verseStart}${verseEnd && verseEnd !== verseStart ? `–${verseEnd}` : ""}`;
  }
  return `${book} ${chapter}`;
}

// ============================================================
// SOURCE-SPECIFIC QUERIES
// Each query filters by recall type when specified.
// ============================================================

async function queryBibleNotes(
  supabaseUrl: string,
  headers: Record<string, string>,
  q: string,
  keywords: string[],
  recall: RecallIntent,
): Promise<MemoryEvidence[]> {
  if (recall.recallType === "highlight" || recall.recallType === "bookmark" || recall.recallType === "prayer") return [];
  const res = await fetch(
    `${supabaseUrl}/rest/v1/bible_notes?select=id,book,chapter,verse_start,verse_end,title,content,created_at&order=created_at.desc&limit=20`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const note of rows) {
    const ref = formatRef(note.book, note.chapter, note.verse_start, note.verse_end);
    const noteText = `${note.title || ""} ${note.content || ""}`.toLowerCase();
    const refLower = ref.toLowerCase();
    const matches = recall.isRecall
      ? matchesSemantic(noteText, q, keywords) || matchesSemantic(refLower, q, keywords)
      : matchesSemantic(noteText, q, keywords) || matchesSemantic(refLower, q, keywords);
    if (matches) {
      results.push({
        source_type: "bible_note",
        source_id: note.id,
        created_at: note.created_at,
        scripture_reference: ref,
        topic: note.title || undefined,
        factual_summary: `Note in ${ref}: ${(note.title || note.content || "").slice(0, 150)}`,
        relevance_reason: `Note content matches question`,
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
  recall: RecallIntent,
): Promise<MemoryEvidence[]> {
  if (recall.recallType && !["reading", "general", null].includes(recall.recallType)) {
    if (recall.recallType !== "reading" && recall.recallType !== "general") return [];
  }
  const res = await fetch(
    `${supabaseUrl}/rest/v1/bible_reading_history?select=id,book,chapter,verse,updated_at&order=updated_at.desc&limit=20`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const h of rows) {
    const ref = formatRef(h.book, h.chapter, h.verse);
    const refLower = ref.toLowerCase();
    const matches = recall.isRecall
      ? matchesSemantic(refLower, q, keywords)
      : matchesSemantic(refLower, q, keywords);
    if (matches) {
      results.push({
        source_type: "bible_reading",
        source_id: h.id,
        created_at: h.updated_at,
        scripture_reference: ref,
        factual_summary: `Read ${ref}`,
        relevance_reason: `Recently read passage`,
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
  recall: RecallIntent,
): Promise<MemoryEvidence[]> {
  if (recall.recallType && recall.recallType !== "bookmark" && recall.recallType !== "general") return [];
  const res = await fetch(
    `${supabaseUrl}/rest/v1/bible_bookmarks?select=id,book,chapter,verse_start,verse_end,label,created_at&order=created_at.desc&limit=20`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const bm of rows) {
    const ref = formatRef(bm.book, bm.chapter, bm.verse_start, bm.verse_end);
    const labelText = (bm.label || "").toLowerCase();
    const refLower = ref.toLowerCase();
    const matches = recall.isRecall
      ? matchesSemantic(labelText, q, keywords) || matchesSemantic(refLower, q, keywords)
      : matchesSemantic(labelText, q, keywords) || matchesSemantic(refLower, q, keywords);
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
  recall: RecallIntent,
): Promise<MemoryEvidence[]> {
  if (recall.recallType && recall.recallType !== "highlight" && recall.recallType !== "general") return [];
  const res = await fetch(
    `${supabaseUrl}/rest/v1/bible_highlights?select=id,book,chapter,verse_start,verse_end,selected_text,color_key,created_at&order=created_at.desc&limit=20`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const hl of rows) {
    const ref = formatRef(hl.book, hl.chapter, hl.verse_start, hl.verse_end);
    const hlText = (hl.selected_text || "").toLowerCase();
    const refLower = ref.toLowerCase();
    const matches = recall.isRecall
      ? matchesSemantic(hlText, q, keywords) || matchesSemantic(refLower, q, keywords)
      : matchesSemantic(hlText, q, keywords) || matchesSemantic(refLower, q, keywords);
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
  recall: RecallIntent,
): Promise<MemoryEvidence[]> {
  if (recall.recallType && recall.recallType !== "walk" && recall.recallType !== "general") return [];
  const res = await fetch(
    `${supabaseUrl}/rest/v1/walks?select=id,passage_reference,reading_objective,status,created_at&order=created_at.desc&limit=15`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const w of rows) {
    const refText = `${w.passage_reference || ""} ${w.reading_objective || ""}`.toLowerCase();
    const matches = recall.isRecall
      ? matchesSemantic(refText, q, keywords)
      : matchesSemantic(refText, q, keywords);
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
  recall: RecallIntent,
): Promise<MemoryEvidence[]> {
  if (recall.recallType && recall.recallType !== "prayer" && recall.recallType !== "general") return [];
  const res = await fetch(
    `${supabaseUrl}/rest/v1/prayers?select=id,title,description,related_scripture,status,created_at&order=created_at.desc&limit=20`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const p of rows) {
    const prayerText = `${p.title || ""} ${p.description || ""} ${p.related_scripture || ""}`.toLowerCase();
    const matches = recall.isRecall
      ? matchesSemantic(prayerText, q, keywords)
      : matchesSemantic(prayerText, q, keywords) || q.includes("pray");
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
  recall: RecallIntent,
): Promise<MemoryEvidence[]> {
  if (recall.recallType && recall.recallType !== "conversation" && recall.recallType !== "general") return [];
  const res = await fetch(
    `${supabaseUrl}/rest/v1/ask_conversations?select=id,title,intent,created_at&order=created_at.desc&limit=15`,
    { headers },
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const results: MemoryEvidence[] = [];
  for (const c of rows) {
    const convText = `${c.title || ""} ${c.intent || ""}`.toLowerCase();
    const matches = recall.isRecall
      ? matchesSemantic(convText, q, keywords)
      : matchesSemantic(convText, q, keywords);
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

// ============================================================
// RANKING
// Combines recency, semantic relevance, recall boost, and source-type priority.
// ============================================================

function rankEvidence(
  evidence: MemoryEvidence[],
  q: string,
  keywords: string[],
  recall: RecallIntent,
): MemoryEvidence[] {
  const now = Date.now();
  const semanticTerms = getSemanticTerms(q);
  const sourcePriority: Record<string, number> = {
    bookmark: 10,
    highlight: 9,
    prayer: 8,
    bible_note: 7,
    today_walk: 6,
    ask_conversation: 5,
    bible_reading: 4,
  };

  return evidence
    .map((e) => {
      let score = 0;
      const ageDays = (now - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 30 - ageDays) * 0.5;

      if (recall.isRecall) {
        score += 25;
        if (recall.recallType && e.source_type.includes(recall.recallType)) score += 15;
      }

      const text = `${e.factual_summary} ${e.topic || ""} ${e.scripture_reference || ""}`.toLowerCase();
      if (keywords.some((k) => text.includes(k))) score += 10;

      if (semanticTerms.size > 0) {
        let semMatches = 0;
        for (const term of semanticTerms) {
          if (text.includes(term)) semMatches++;
        }
        score += semMatches * 5;
      }

      score += (sourcePriority[e.source_type] || 0) * 0.3;

      return { evidence: e, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.evidence);
}
