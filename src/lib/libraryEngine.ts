import { supabase } from './supabase';
import type {
  LibrarySource, SourceChunk, Citation, SourceConfidence,
  RetrievalResult, RAGAnswer, SourceType,
} from './libraryTypes';

// ============================================================
// Authority level labels
// ============================================================

export const authorityLevelLabels: Record<number, string> = {
  1: 'Scripture',
  2: 'Historic Christian Orthodoxy',
  3: 'Reformed Confession / Catechism',
  4: 'Historic Reformed Theology',
  5: 'Approved Modern Teacher',
  6: 'SOLAPATH Editorial / Application',
};

export const authorityLevelColors: Record<number, string> = {
  1: 'text-gold-300',
  2: 'text-gold-400',
  3: 'text-sage-400',
  4: 'text-sage-400',
  5: 'text-ivory-400',
  6: 'text-ivory-500',
};

export const sourceTypeLabels: Record<SourceType, string> = {
  scripture: 'Scripture',
  creed: 'Creed',
  confession: 'Confession',
  catechism: 'Catechism',
  historic_theologian: 'Historic Theology',
  modern_teacher: 'Modern Teaching',
  editorial: 'SOLAPATH Editorial',
  family_discipleship: 'Family Discipleship',
  apologetics: 'Apologetics',
  church_history: 'Church History',
  biblical_theology: 'Biblical Theology',
};

// ============================================================
// Doctrine Taxonomy (stable IDs)
// ============================================================

export interface DoctrineCategory {
  category: string;
  doctrines: Array<{ id: string; label: string; description: string }>;
}

export const doctrineTaxonomy: DoctrineCategory[] = [
  {
    category: 'Theology Proper',
    doctrines: [
      { id: 'theology_proper_existence', label: 'Existence of God', description: 'Arguments and biblical basis for God\'s existence.' },
      { id: 'theology_proper_attributes', label: 'Attributes of God', description: 'God\'s communicable and incommunicable attributes.' },
      { id: 'theology_proper_trinity', label: 'Trinity', description: 'One God in three persons: Father, Son, and Holy Spirit.' },
      { id: 'theology_proper_decrees', label: 'Decrees', description: 'God\'s eternal plan for all that occurs.' },
      { id: 'theology_proper_providence', label: 'Providence', description: 'God\'s sovereign governance of all things.' },
    ],
  },
  {
    category: 'Revelation',
    doctrines: [
      { id: 'revelation_general', label: 'General Revelation', description: 'God revealed through creation and conscience.' },
      { id: 'revelation_special', label: 'Special Revelation', description: 'God revealed through Scripture and Christ.' },
      { id: 'revelation_inspiration', label: 'Inspiration', description: 'God breathed out Scripture through human authors.' },
      { id: 'revelation_inerrancy', label: 'Inerrancy', description: 'Scripture is without error in all it affirms.' },
      { id: 'revelation_sufficiency', label: 'Sufficiency', description: 'Scripture is all we need for life and godliness.' },
      { id: 'revelation_authority', label: 'Authority of Scripture', description: 'Scripture is the final authority for faith and life.' },
      { id: 'revelation_canon', label: 'Canon', description: 'The recognized books of Holy Scripture.' },
    ],
  },
  {
    category: 'Creation & Humanity',
    doctrines: [
      { id: 'creation_creation', label: 'Creation', description: 'God created all things from nothing.' },
      { id: 'creation_image_of_god', label: 'Image of God', description: 'Humanity created in God\'s image.' },
      { id: 'creation_man', label: 'Man', description: 'God\'s creation of male humanity.' },
      { id: 'creation_woman', label: 'Woman', description: 'God\'s creation of female humanity.' },
      { id: 'creation_marriage', label: 'Marriage', description: 'God\'s design for marriage.' },
      { id: 'creation_purpose', label: 'Human Purpose', description: 'Glorifying God and enjoying Him forever.' },
    ],
  },
  {
    category: 'Hamartiology',
    doctrines: [
      { id: 'hamartiology_fall', label: 'Fall', description: 'The first sin and its consequences.' },
      { id: 'hamartiology_original_sin', label: 'Original Sin', description: 'Inherited guilt and corruption from Adam.' },
      { id: 'hamartiology_total_depravity', label: 'Total Depravity', description: 'Sin has corrupted every part of human nature.' },
      { id: 'hamartiology_actual_sin', label: 'Actual Sin', description: 'Sins committed in thought, word, and deed.' },
      { id: 'hamartiology_guilt', label: 'Guilt', description: 'Humanity\'s liability to punishment.' },
      { id: 'hamartiology_corruption', label: 'Corruption', description: 'The moral pollution of human nature.' },
    ],
  },
  {
    category: 'Christology',
    doctrines: [
      { id: 'christology_person', label: 'Person of Christ', description: 'Who Jesus is as the God-man.' },
      { id: 'christology_deity', label: 'Deity of Christ', description: 'Jesus is fully God.' },
      { id: 'christology_humanity', label: 'Humanity of Christ', description: 'Jesus is fully man.' },
      { id: 'christology_incarnation', label: 'Incarnation', description: 'The Word became flesh.' },
      { id: 'christology_offices', label: 'Offices of Christ', description: 'Prophet, Priest, and King.' },
      { id: 'christology_active_obedience', label: 'Active Obedience', description: 'Christ\'s perfect fulfillment of the law.' },
      { id: 'christology_passive_obedience', label: 'Passive Obedience', description: 'Christ\'s suffering the penalty of sin.' },
    ],
  },
  {
    category: 'Soteriology',
    doctrines: [
      { id: 'soteriology_election', label: 'Election', description: 'God\'s choice of sinners for salvation before creation.' },
      { id: 'soteriology_predestination', label: 'Predestination', description: 'God\'s foreordination of all things.' },
      { id: 'soteriology_calling', label: 'Calling', description: 'God\'s effective summons to salvation.' },
      { id: 'soteriology_regeneration', label: 'Regeneration', description: 'The new birth by the Holy Spirit.' },
      { id: 'soteriology_conversion', label: 'Conversion', description: 'Turning from sin to Christ.' },
      { id: 'soteriology_repentance', label: 'Repentance', description: 'Turning from sin.' },
      { id: 'soteriology_faith', label: 'Faith', description: 'Trusting in Christ alone.' },
      { id: 'soteriology_union', label: 'Union with Christ', description: 'Believers joined to Christ.' },
      { id: 'soteriology_justification', label: 'Justification', description: 'Declared righteous through Christ\'s imputed righteousness.' },
      { id: 'soteriology_adoption', label: 'Adoption', description: 'Received as God\'s children.' },
      { id: 'soteriology_sanctification', label: 'Sanctification', description: 'Progressive holiness through the Spirit.' },
      { id: 'soteriology_perseverance', label: 'Perseverance', description: 'God preserves His people to the end.' },
      { id: 'soteriology_assurance', label: 'Assurance', description: 'Confidence of salvation.' },
      { id: 'soteriology_glorification', label: 'Glorification', description: 'Final transformation into Christ\'s likeness.' },
    ],
  },
  {
    category: 'Atonement',
    doctrines: [
      { id: 'atonement_penal_substitution', label: 'Penal Substitution', description: 'Christ bore God\'s wrath in our place.' },
      { id: 'atonement_propitiation', label: 'Propitiation', description: 'Christ satisfied God\'s wrath.' },
      { id: 'atonement_redemption', label: 'Redemption', description: 'Christ purchased us from slavery to sin.' },
      { id: 'atonement_reconciliation', label: 'Reconciliation', description: 'Christ restored our relationship with God.' },
      { id: 'atonement_particular_redemption', label: 'Particular Redemption', description: 'Christ died specifically for His people.' },
    ],
  },
  {
    category: 'Covenant Theology',
    doctrines: [
      { id: 'covenant_redemption', label: 'Covenant of Redemption', description: 'The intra-Trinitarian covenant for salvation.' },
      { id: 'covenant_works', label: 'Covenant of Works', description: 'God\'s covenant with Adam in Eden.' },
      { id: 'covenant_grace', label: 'Covenant of Grace', description: 'God\'s covenant to save sinners through Christ.' },
      { id: 'covenant_abrahamic', label: 'Abrahamic Covenant', description: 'God\'s promises to Abraham.' },
      { id: 'covenant_mosaic', label: 'Mosaic Covenant', description: 'God\'s law given through Moses.' },
      { id: 'covenant_davidic', label: 'Davidic Covenant', description: 'God\'s promise to David of an eternal kingdom.' },
      { id: 'covenant_new', label: 'New Covenant', description: 'The covenant fulfilled in Christ.' },
    ],
  },
  {
    category: 'Pneumatology',
    doctrines: [
      { id: 'pneumatology_holy_spirit', label: 'Holy Spirit', description: 'The third person of the Trinity.' },
      { id: 'pneumatology_regeneration', label: 'Regeneration', description: 'The Spirit gives new life.' },
      { id: 'pneumatology_indwelling', label: 'Indwelling', description: 'The Spirit lives in believers.' },
      { id: 'pneumatology_sanctification', label: 'Sanctification', description: 'The Spirit produces holiness.' },
      { id: 'pneumatology_gifts', label: 'Spiritual Gifts', description: 'The Spirit equips the church.' },
    ],
  },
  {
    category: 'Ecclesiology',
    doctrines: [
      { id: 'ecclesiology_church', label: 'Church', description: 'The body and bride of Christ.' },
      { id: 'ecclesiology_elders', label: 'Elders', description: 'Shepherds who lead the church.' },
      { id: 'ecclesiology_deacons', label: 'Deacons', description: 'Servants who minister to practical needs.' },
      { id: 'ecclesiology_discipline', label: 'Discipline', description: 'Restorative correction in the church.' },
      { id: 'ecclesiology_worship', label: 'Worship', description: 'The church\'s response to God\'s grace.' },
      { id: 'ecclesiology_baptism', label: 'Baptism', description: 'The sacrament of initiation.' },
      { id: 'ecclesiology_lords_supper', label: 'Lord\'s Supper', description: 'The sacrament of remembrance.' },
      { id: 'ecclesiology_membership', label: 'Membership', description: 'Commitment to a local body.' },
      { id: 'ecclesiology_mission', label: 'Mission', description: 'The church\'s calling to make disciples.' },
    ],
  },
  {
    category: 'Christian Life',
    doctrines: [
      { id: 'christian_life_prayer', label: 'Prayer', description: 'Communion with God.' },
      { id: 'christian_life_worship', label: 'Worship', description: 'Living all of life for God\'s glory.' },
      { id: 'christian_life_holiness', label: 'Holiness', description: 'Pursuing godliness.' },
      { id: 'christian_life_obedience', label: 'Obedience', description: 'Keeping God\'s commands.' },
      { id: 'christian_life_suffering', label: 'Suffering', description: 'Enduring hardship with faith.' },
      { id: 'christian_life_stewardship', label: 'Stewardship', description: 'Managing God\'s resources faithfully.' },
      { id: 'christian_life_vocation', label: 'Vocation', description: 'Serving God in daily work.' },
      { id: 'christian_life_marriage', label: 'Marriage', description: 'Reflecting Christ and the church.' },
      { id: 'christian_life_parenting', label: 'Parenting', description: 'Discipling children.' },
      { id: 'christian_life_evangelism', label: 'Evangelism', description: 'Sharing the Gospel faithfully.' },
      { id: 'christian_life_missions', label: 'Missions', description: 'Taking the Gospel to the nations.' },
    ],
  },
  {
    category: 'Eschatology',
    doctrines: [
      { id: 'eschatology_death', label: 'Death', description: 'The end of earthly life.' },
      { id: 'eschatology_intermediate_state', label: 'Intermediate State', description: 'Between death and resurrection.' },
      { id: 'eschatology_return', label: 'Return of Christ', description: 'Jesus will come again.' },
      { id: 'eschatology_resurrection', label: 'Resurrection', description: 'Bodily resurrection of the dead.' },
      { id: 'eschatology_judgment', label: 'Judgment', description: 'God\'s final assessment of all.' },
      { id: 'eschatology_heaven', label: 'Heaven', description: 'Eternal joy with God.' },
      { id: 'eschatology_hell', label: 'Hell', description: 'Eternal separation from God.' },
      { id: 'eschatology_new_creation', label: 'New Creation', description: 'The renewed heavens and earth.' },
    ],
  },
];

// ============================================================
// Author Metadata (metadata only — no fabricated positions)
// ============================================================

export interface AuthorMetadata {
  name: string;
  birth_year: number | null;
  death_year: number | null;
  era: string;
  theological_tradition: string;
  doctrine_specialties: string[];
  public_domain_default: boolean;
  source_permissions: string;
}

export const historicAuthors: AuthorMetadata[] = [
  { name: 'Huldrych Zwingli', birth_year: 1484, death_year: 1531, era: 'reformation', theological_tradition: 'continental_reformed', doctrine_specialties: ['Scripture', 'Sacraments'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'John Calvin', birth_year: 1509, death_year: 1564, era: 'reformation', theological_tradition: 'continental_reformed', doctrine_specialties: ['Sovereignty', 'Providence', 'Justification', 'Predestination'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'Heinrich Bullinger', birth_year: 1504, death_year: 1575, era: 'reformation', theological_tradition: 'continental_reformed', doctrine_specialties: ['Covenant Theology'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'Theodore Beza', birth_year: 1519, death_year: 1605, era: 'reformation', theological_tradition: 'continental_reformed', doctrine_specialties: ['Predestination', 'Atonement'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'William Ames', birth_year: 1576, death_year: 1633, era: 'post_reformation', theological_tradition: 'continental_reformed', doctrine_specialties: ['Theology', 'Casuistry'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'Francis Turretin', birth_year: 1623, death_year: 1687, era: 'post_reformation', theological_tradition: 'continental_reformed', doctrine_specialties: ['Systematic Theology', 'Atonement', 'Covenant'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'John Owen', birth_year: 1616, death_year: 1683, era: 'puritan', theological_tradition: 'westminster_presbyterian', doctrine_specialties: ['Atonement', 'Indwelling Sin', 'Trinity', 'Spirit'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'Johannes Cocceius', birth_year: 1603, death_year: 1669, era: 'post_reformation', theological_tradition: 'continental_reformed', doctrine_specialties: ['Covenant Theology'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'Jonathan Edwards', birth_year: 1703, death_year: 1758, era: 'awakening', theological_tradition: 'broad_historic_reformed', doctrine_specialties: ['Free Will', 'Revival', 'Beauty of God'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'Archibald Alexander', birth_year: 1772, death_year: 1851, era: 'old_princeton', theological_tradition: 'westminster_presbyterian', doctrine_specialties: ['Theology', 'Experience'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'Charles Hodge', birth_year: 1797, death_year: 1878, era: 'old_princeton', theological_tradition: 'westminster_presbyterian', doctrine_specialties: ['Systematic Theology', 'Scripture'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'B. B. Warfield', birth_year: 1851, death_year: 1921, era: 'old_princeton', theological_tradition: 'westminster_presbyterian', doctrine_specialties: ['Scripture', 'Inerrancy', 'Christology'], public_domain_default: true, source_permissions: 'public_domain' },
  { name: 'Herman Bavinck', birth_year: 1854, death_year: 1921, era: 'modern_reformed', theological_tradition: 'continental_reformed', doctrine_specialties: ['Reformed Dogmatics', 'Worldview'], public_domain_default: false, source_permissions: 'mixed' },
  { name: 'Abraham Kuyper', birth_year: 1837, death_year: 1920, era: 'modern_reformed', theological_tradition: 'continental_reformed', doctrine_specialties: ['Worldview', 'Culture'], public_domain_default: false, source_permissions: 'mixed' },
  { name: 'J. Gresham Machen', birth_year: 1881, death_year: 1937, era: 'modern_reformed', theological_tradition: 'westminster_presbyterian', doctrine_specialties: ['Scripture', 'Liberalism', 'Virgin Birth'], public_domain_default: false, source_permissions: 'mixed' },
  { name: 'John Murray', birth_year: 1898, death_year: 1975, era: 'modern_reformed', theological_tradition: 'westminster_presbyterian', doctrine_specialties: ['Justification', 'Union with Christ', 'Ethics'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'J. I. Packer', birth_year: 1926, death_year: 2020, era: 'modern_reformed', theological_tradition: 'broad_historic_reformed', doctrine_specialties: ['Holiness', 'Evangelism', 'Sovereignty'], public_domain_default: false, source_permissions: 'copyrighted' },
];

export const modernAuthors: AuthorMetadata[] = [
  { name: 'R. C. Sproul', birth_year: 1939, death_year: 2017, era: 'modern_approved', theological_tradition: 'broad_historic_reformed', doctrine_specialties: ['Holiness of God', 'Sovereignty', 'Reformed Theology', 'Justification', 'Church History'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'John MacArthur', birth_year: 1939, death_year: null, era: 'modern_approved', theological_tradition: 'reformed_baptist', doctrine_specialties: ['Biblical Exposition', 'Scripture', 'Church', 'Sanctification', 'Christology'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'Sinclair Ferguson', birth_year: 1948, death_year: null, era: 'modern_approved', theological_tradition: 'continental_reformed', doctrine_specialties: ['Union with Christ', 'Sanctification', 'Pastoral Theology', 'Assurance', 'Christian Life'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'John Piper', birth_year: 1946, death_year: null, era: 'modern_approved', theological_tradition: 'broad_historic_reformed', doctrine_specialties: ['Glory of God', 'Christian Joy', 'Missions', 'Providence', 'Suffering'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'Matt Chandler', birth_year: 1974, death_year: null, era: 'modern_approved', theological_tradition: 'reformed_baptist', doctrine_specialties: ['Gospel', 'Church', 'Culture'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'David Platt', birth_year: 1978, death_year: null, era: 'modern_approved', theological_tradition: 'broad_historic_reformed', doctrine_specialties: ['Missions', 'Radical', 'Church'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'Paul Washer', birth_year: 1961, death_year: null, era: 'modern_approved', theological_tradition: 'reformed_baptist', doctrine_specialties: ['Evangelism', 'Repentance', 'Missions'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'Timothy Keller', birth_year: 1950, death_year: 2023, era: 'modern_approved', theological_tradition: 'broad_historic_reformed', doctrine_specialties: ['Apologetics', 'Gospel Application', 'Culture', 'Idolatry', 'Grace'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'Alistair Begg', birth_year: 1952, death_year: null, era: 'modern_approved', theological_tradition: 'broad_historic_reformed', doctrine_specialties: ['Pastoral Theology', 'Preaching', 'Christian Living'], public_domain_default: false, source_permissions: 'copyrighted' },
  { name: 'Voddie Baucham', birth_year: 1967, death_year: null, era: 'modern_approved', theological_tradition: 'reformed_baptist', doctrine_specialties: ['Biblical Authority', 'Family Discipleship', 'Apologetics', 'Worldview', 'Church and Culture'], public_domain_default: false, source_permissions: 'copyrighted' },
];

// ============================================================
// Perspective Profiles
// ============================================================

export const perspectiveProfiles: Array<{ id: string; label: string; description: string }> = [
  { id: 'broad_historic_reformed', label: 'Broad Historic Reformed', description: 'General Reformed tradition without specifying a particular confessional tradition.' },
  { id: 'westminster_presbyterian', label: 'Westminster / Presbyterian', description: 'Westminster Confession of Faith and Catechisms.' },
  { id: 'continental_reformed', label: 'Continental Reformed', description: 'Three Forms of Unity (Belgic, Heidelberg, Dort).' },
  { id: 'reformed_baptist', label: 'Reformed Baptist', description: 'Reformed theology with credobaptist position (1689 Confession).' },
];

// ============================================================
// RAG Pipeline — Error-safe retrieval
// ============================================================

export interface DoctrineMatch {
  doctrine_id: string;
  label: string;
  category: string;
}

export function classifyIntent(query: string): { intent: string; doctrines: DoctrineMatch[] } {
  const lower = query.toLowerCase();
  const matches: DoctrineMatch[] = [];

  for (const cat of doctrineTaxonomy) {
    for (const d of cat.doctrines) {
      const keywords = d.label.toLowerCase().split(' ');
      const idKeywords = d.id.split('_').slice(1).join(' ');
      if (lower.includes(d.label.toLowerCase()) || lower.includes(idKeywords)) {
        if (!matches.find((m) => m.doctrine_id === d.id)) {
          matches.push({ doctrine_id: d.id, label: d.label, category: cat.category });
        }
      }
      for (const kw of keywords) {
        if (kw.length > 4 && lower.includes(kw)) {
          if (!matches.find((m) => m.doctrine_id === d.id)) {
            matches.push({ doctrine_id: d.id, label: d.label, category: cat.category });
          }
        }
      }
    }
  }

  let intent = 'general_theological';
  if (lower.includes('what is') || lower.includes('what does') || lower.includes('explain')) intent = 'definitional';
  else if (lower.includes('why')) intent = 'causal';
  else if (lower.includes('how')) intent = 'practical';
  else if (lower.includes('did ') && (lower.includes('teach') || lower.includes('say') || lower.includes('argue'))) intent = 'historical_attribution';
  else if (lower.includes('compare') || lower.includes('difference')) intent = 'comparative';
  else if (lower.includes('quote') || lower.includes('exact')) intent = 'quote_request';

  return { intent, doctrines: matches.slice(0, 5) };
}

// Detect author name in query for attribution validation
export function detectAuthorInQuery(query: string): string | null {
  const lower = query.toLowerCase();
  const allAuthors = [...historicAuthors, ...modernAuthors];
  for (const a of allAuthors) {
    const nameLower = a.name.toLowerCase();
    const lastPart = nameLower.split(' ').slice(-1)[0];
    if (lower.includes(nameLower) || (lastPart.length > 3 && lower.includes(lastPart))) {
      return a.name;
    }
  }
  return null;
}

// Retrieve sources from the library database — error-safe
export async function retrieveSources(query: string): Promise<RetrievalResult> {
  const { intent, doctrines } = classifyIntent(query);
  const doctrineIds = doctrines.map((d) => d.doctrine_id);
  const detectedAuthor = detectAuthorInQuery(query);

  let sources: LibrarySource[] = [];
  let chunks: SourceChunk[] = [];

  try {
    // Search library_sources for verified content only
    const { data: sourceData, error: srcErr } = await supabase
      .from('library_sources')
      .select('*')
      .eq('content_status', 'verified')
      .eq('verified', true)
      .order('authority_level', { ascending: true })
      .limit(50);

    if (srcErr) {
      console.error('[RAG] Error fetching sources:', srcErr.message);
    }
    sources = (sourceData as LibrarySource[]) || [];

    // Search source_chunks by doctrine tags
    if (doctrineIds.length > 0) {
      const { data: chunkData, error: chunkErr } = await supabase
        .from('source_chunks')
        .select('*')
        .eq('verified', true)
        .overlaps('doctrine_tags', doctrineIds)
        .limit(30);

      if (chunkErr) {
        console.error('[RAG] Error fetching chunks:', chunkErr.message);
      }
      chunks = (chunkData as SourceChunk[]) || [];
    }

    // Also do keyword search on chunk text
    if (query.trim().length > 3) {
      const searchTerm = query.trim().split(' ').filter(w => w.length > 3).join(' | ');
      if (searchTerm) {
        const { data: kwChunks, error: kwErr } = await supabase
          .from('source_chunks')
          .select('*')
          .eq('verified', true)
          .textSearch('text', searchTerm)
          .limit(20);

        if (!kwErr && kwChunks) {
          // Merge with doctrine-matched chunks, dedup by id
          const existingIds = new Set(chunks.map(c => c.id));
          for (const c of kwChunks as SourceChunk[]) {
            if (!existingIds.has(c.id)) {
              chunks.push(c);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[RAG] Retrieval failed:', err);
    return {
      citations: [],
      confidence: 'source_unavailable',
      context_summary: 'Retrieval error: database unavailable.',
      detected_intent: intent,
      detected_doctrine: doctrineIds,
      retrieved_sources: [],
      rejected_sources: [],
    };
  }

  const retrievedSources: RetrievalResult['retrieved_sources'] = [];
  const rejectedSources: RetrievalResult['rejected_sources'] = [];
  const citations: Citation[] = [];
  const sourceMap = new Map<string, LibrarySource>();

  for (const s of sources) {
    sourceMap.set(s.id, s);
  }

  // Also fetch sources for chunks whose parent source wasn't in the verified list
  const chunkSourceIds = new Set(chunks.map(c => c.source_id));
  for (const csid of chunkSourceIds) {
    if (!sourceMap.has(csid)) {
      try {
        const { data: src } = await supabase
          .from('library_sources')
          .select('*')
          .eq('id', csid)
          .maybeSingle();
        if (src) {
          const s = src as LibrarySource;
          // Check if this source is verified — if not, reject
          if (!s.verified || s.content_status !== 'verified') {
            rejectedSources.push({ source_id: csid, reason: `Source "${s.title}" is ${s.content_status}, not verified` });
            continue;
          }
          sourceMap.set(s.id, s);
        }
      } catch {
        // skip
      }
    }
  }

  // Group chunks by source
  const chunksBySource = new Map<string, SourceChunk[]>();
  for (const c of chunks) {
    if (!chunksBySource.has(c.source_id)) chunksBySource.set(c.source_id, []);
    chunksBySource.get(c.source_id)!.push(c);
  }

  // Build retrieved sources with authority-based ranking
  for (const [sourceId, sourceChunks] of chunksBySource) {
    const source = sourceMap.get(sourceId);
    if (!source) {
      rejectedSources.push({ source_id: sourceId, reason: 'Source not found' });
      continue;
    }
    if (!source.verified || source.content_status !== 'verified') {
      rejectedSources.push({ source_id: sourceId, reason: `Source "${source.title}" is ${source.content_status}, not verified` });
      continue;
    }
    const relevance = sourceChunks.length / 10 + (6 - source.authority_level) * 0.1;
    retrievedSources.push({ source, chunks: sourceChunks, relevance });
  }

  // Also add verified sources without chunks (for Scripture references)
  for (const source of sources) {
    if (!chunksBySource.has(source.id) && source.verified) {
      // Only include if doctrine matches or no doctrine was detected (broad query)
      retrievedSources.push({ source, chunks: [], relevance: (6 - source.authority_level) * 0.05 });
    }
  }

  // Sort by authority level (ascending = Scripture first), then by relevance (descending)
  retrievedSources.sort((a, b) => {
    if (a.source.authority_level !== b.source.authority_level) {
      return a.source.authority_level - b.source.authority_level;
    }
    return b.relevance - a.relevance;
  });

  // Build citations
  for (const rs of retrievedSources) {
    const source = rs.source;
    let authorName = sourceTypeLabels[source.source_type] || 'Unknown';
    if (source.author_id) {
      try {
        const { data: author } = await supabase
          .from('library_authors')
          .select('name')
          .eq('id', source.author_id)
          .maybeSingle();
        if (author?.name) authorName = author.name;
      } catch {
        // use fallback
      }
    }

    citations.push({
      source_id: source.id,
      display_author: authorName,
      display_title: source.title,
      chapter_section: source.chapter || source.section || null,
      page: source.page_start || null,
      source_type: source.source_type,
      authority_level: source.authority_level,
      verified: source.verified,
      source_link: source.source_url || source.canonical_url || null,
    });
  }

  // Determine confidence
  let confidence: SourceConfidence = 'source_unavailable';
  if (citations.length > 0 && citations.some((c) => c.authority_level <= 3)) {
    confidence = 'verified';
  } else if (citations.length > 0) {
    confidence = 'partially_supported';
  }

  // Attribution check: if author detected in query, check if we have their source
  if (detectedAuthor) {
    const hasAuthorSource = citations.some(c =>
      c.display_author.toLowerCase().includes(detectedAuthor.toLowerCase())
    );
    if (!hasAuthorSource) {
      confidence = 'source_unavailable';
    }
  }

  const contextSummary = citations.length > 0
    ? `Retrieved ${citations.length} verified source(s) across ${retrievedSources.length} source group(s). Authority range: L${Math.min(...citations.map(c => c.authority_level))}-L${Math.max(...citations.map(c => c.authority_level))}.`
    : 'No verified sources found for this query.';

  // Log retrieval (fire and forget — don't block on this)
  try {
    await supabase.from('retrieval_log').insert({
      query,
      detected_intent: intent,
      detected_doctrine: doctrineIds,
      retrieved_source_ids: retrievedSources.map((r) => r.source.id),
      rejected_source_ids: rejectedSources.map((r) => r.source_id),
      final_context_summary: contextSummary,
      citations_generated: { citations, detected_author: detectedAuthor },
      theological_validation: confidence,
    });
  } catch (err) {
    console.error('[RAG] Failed to log retrieval:', err);
  }

  return {
    citations,
    confidence,
    context_summary: contextSummary,
    detected_intent: intent,
    detected_doctrine: doctrineIds,
    retrieved_sources: retrievedSources,
    rejected_sources: rejectedSources,
  };
}

// ============================================================
// Attribution Validator
// ============================================================

export function validateAttribution(
  claim: string,
  authorName: string,
  citations: Citation[],
): { valid: boolean; reason: string } {
  const matchingCitation = citations.find((c) =>
    c.display_author.toLowerCase().includes(authorName.toLowerCase()),
  );

  if (!matchingCitation) {
    return {
      valid: false,
      reason: `No verified source for "${authorName}" was retrieved. Attribution removed.`,
    };
  }

  if (!matchingCitation.verified) {
    return {
      valid: false,
      reason: `Source for "${authorName}" is not verified. Attribution removed.`,
    };
  }

  return { valid: true, reason: 'Attribution verified against retrieved source.' };
}

// ============================================================
// Quote Validator
// ============================================================

export function validateQuote(
  quote: string,
  sourceText: string,
): { valid: boolean; reason: string } {
  if (!sourceText || sourceText.length === 0) {
    return { valid: false, reason: 'No source text available for validation.' };
  }

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalize(sourceText).includes(normalize(quote))) {
    return { valid: true, reason: 'Exact match confirmed.' };
  }

  return {
    valid: false,
    reason: 'Exact match failed. Convert to paraphrase or remove quotation marks.',
  };
}

// ============================================================
// Paraphrase Labeling
// ============================================================

export interface ParaphraseLabel {
  is_paraphrase: boolean;
  label: string;
}

export function labelParaphrase(isDirectQuote: boolean, quoteValid: boolean): ParaphraseLabel {
  if (isDirectQuote && quoteValid) {
    return { is_paraphrase: false, label: 'Direct quotation' };
  }
  return { is_paraphrase: true, label: 'Summary of source argument' };
}

// ============================================================
// Generate RAG Answer (development mode — honest, no fabrication)
// ============================================================

export async function generateRAGAnswer(query: string): Promise<RAGAnswer> {
  const retrieval = await retrieveSources(query);
  const detectedAuthor = detectAuthorInQuery(query);

  // Check for quote request without verified source
  const isQuoteRequest = query.toLowerCase().includes('quote') || query.toLowerCase().includes('exact');

  // If author detected but no matching source, return honest empty state
  if (detectedAuthor && !retrieval.citations.some(c => c.display_author.toLowerCase().includes(detectedAuthor.toLowerCase()))) {
    return {
      scripture_first: null,
      short_answer: `SOLAPATH's verified Library does not currently contain a source supporting attribution to ${detectedAuthor}.`,
      biblical_context: null,
      reformed_understanding: null,
      confessional_witness: null,
      historic_voices: null,
      modern_teaching: null,
      other_christian_views: null,
      application: null,
      prayer_reflection: null,
      citations: [],
      confidence: 'source_unavailable',
      is_development_mode: true,
    };
  }

  // If quote request and no verified exact-match text, return honest state
  if (isQuoteRequest && retrieval.confidence === 'source_unavailable') {
    return {
      scripture_first: null,
      short_answer: 'SOLAPATH cannot provide a verified direct quotation from the current Library. No exact-match verified quote exists for this request.',
      biblical_context: null,
      reformed_understanding: null,
      confessional_witness: null,
      historic_voices: null,
      modern_teaching: null,
      other_christian_views: null,
      application: null,
      prayer_reflection: null,
      citations: [],
      confidence: 'source_unavailable',
      is_development_mode: true,
    };
  }

  // If no verified sources at all, return honest empty state
  if (retrieval.citations.length === 0) {
    return {
      scripture_first: null,
      short_answer: null,
      biblical_context: null,
      reformed_understanding: null,
      confessional_witness: null,
      historic_voices: null,
      modern_teaching: null,
      other_christian_views: null,
      application: null,
      prayer_reflection: null,
      citations: [],
      confidence: 'source_unavailable',
      is_development_mode: true,
    };
  }

  // Build structured answer from retrieved sources
  const scriptureCitations = retrieval.citations.filter((c) => c.authority_level === 1);
  const confessionalCitations = retrieval.citations.filter((c) => c.authority_level === 3);
  const historicCitations = retrieval.citations.filter((c) => c.authority_level === 4);
  const modernCitations = retrieval.citations.filter((c) => c.authority_level === 5);

  return {
    scripture_first: scriptureCitations.length > 0
      ? `Scripture references retrieved: ${scriptureCitations.map((c) => c.display_title).join(', ')}`
      : null,
    short_answer: null,
    biblical_context: null,
    reformed_understanding: null,
    confessional_witness: confessionalCitations.length > 0
      ? `Confessional sources: ${confessionalCitations.map((c) => `${c.display_title} — ${c.chapter_section || c.display_title}`).join('; ')}`
      : null,
    historic_voices: historicCitations.length > 0
      ? `Historic sources: ${historicCitations.map((c) => `${c.display_author}, ${c.display_title} (${c.chapter_section || 'n.d.'})`).join('; ')}`
      : null,
    modern_teaching: modernCitations.length > 0
      ? `Modern sources: ${modernCitations.map((c) => c.display_author).join(', ')}`
      : null,
    other_christian_views: null,
    application: null,
    prayer_reflection: null,
    citations: retrieval.citations,
    confidence: retrieval.confidence,
    is_development_mode: true,
  };
}

// ============================================================
// RAG Test Queries
// ============================================================

export const ragTestQueries: Array<{
  id: string;
  query: string;
  expected_behavior: string;
  description: string;
}> = [
  {
    id: 'test1',
    query: 'What is justification?',
    expected_behavior: 'Scripture → Reformed position → confession where available → citations only from verified sources',
    description: 'Core soteriological doctrine',
  },
  {
    id: 'test2',
    query: 'What did John Owen teach about the death of Christ?',
    expected_behavior: 'If verified Owen source exists: retrieve it. If not: state source unavailable. Do not answer from model memory.',
    description: 'Historic attribution — requires verified source',
  },
  {
    id: 'test3',
    query: 'What did R.C. Sproul say about holiness?',
    expected_behavior: 'No direct quote without verified Sproul source. State source unavailable if no verified source exists.',
    description: 'Modern teacher attribution — copyright safeguard',
  },
  {
    id: 'test4',
    query: 'Compare Presbyterian and Reformed Baptist baptism.',
    expected_behavior: 'Fair distinction. No strawman. Represent both positions accurately.',
    description: 'Comparative theology — requires honest representation',
  },
  {
    id: 'test5',
    query: 'What does Romans 8:28 mean?',
    expected_behavior: 'Read in context. Do not promise pleasant circumstances. Point to broader context (Romans 8).',
    description: 'Scripture interpretation — context matters',
  },
  {
    id: 'test6',
    query: 'Did Calvin teach that God causes evil?',
    expected_behavior: 'Careful retrieval. Avoid simplistic attribution. Show nuance and sources.',
    description: 'Sensitive historical attribution',
  },
  {
    id: 'test7',
    query: 'What is covenant theology?',
    expected_behavior: 'Scripture → confession → historical Reformed theology. Multi-source retrieval.',
    description: 'Broad doctrinal question',
  },
];

// ============================================================
// Empty State Messages
// ============================================================

export const emptyStateMessages = {
  no_sources: 'SOLAPATH is still building its verified library for this subject.',
  no_modern_sources: 'No verified modern teaching source is connected for this topic yet.',
  no_historic_sources: 'No verified historic source has been ingested for this topic yet.',
  source_unavailable: 'SOLAPATH does not currently have a verified source for this claim.',
};

// ============================================================
// Source Boundary Protection (prompt injection defense)
// ============================================================

export function sanitizeSourceText(text: string): string {
  return text
    .replace(/\b(SYSTEM|INSTRUCTION|PROMPT|IGNORE|OVERRIDE|DISREGARD)\b/gi, '[FILTERED]')
    .replace(/(?:^|\n)\s*(?:ACT AS|PRETEND|YOU ARE|FORGET|REMEMBER)\b/gi, '[FILTERED]')
    .trim();
}
