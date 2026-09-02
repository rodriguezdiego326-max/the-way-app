import type { DemoWalk } from './demoContent';
import type { Profile, Walk } from './types';

export interface WalkRecommendation {
  passage_reference: string;
  reading_objective: string;
  observation_prompt: string;
  estimated_minutes: number;
  reason: string;
  reflection_question: string;
}

// ============================================================
// Study Continuity System
// Each study has ordered passages. SOLAPATH continues where
// the user left off rather than generating random verses.
// ============================================================

interface StudySequence {
  passages: Array<{
    reference: string;
    reading_objective: string;
    observation_prompt: string;
    reflection_question: string;
    estimated_minutes: number;
  }>;
}

const studySequences: Record<string, StudySequence> = {
  Romans: {
    passages: [
      {
        reference: 'Romans 1:1–17',
        reading_objective: 'Read Paul\'s introduction. Notice the theme verse in 1:16–17 — the power of God for salvation.',
        observation_prompt: 'What does Paul say he is not ashamed of, and why?',
        reflection_question: 'What does this passage show about God\'s commitment to save?',
        estimated_minutes: 10,
      },
      {
        reference: 'Romans 3:21–31',
        reading_objective: 'Read about the righteousness of God apart from the law. Trace the logic of justification by faith.',
        observation_prompt: 'How does Paul describe being justified? What are the results?',
        reflection_question: 'What does this passage show about God\'s justice and mercy meeting at the cross?',
        estimated_minutes: 10,
      },
      {
        reference: 'Romans 5:1–11',
        reading_objective: 'Read about the fruits of justification. Notice the chain: suffering → endurance → character → hope.',
        observation_prompt: 'What does Paul say we have through faith in Christ?',
        reflection_question: 'How does this passage show God\'s love demonstrated in time?',
        estimated_minutes: 10,
      },
      {
        reference: 'Romans 8:1–17',
        reading_objective: 'Continue your study of Romans. Trace Paul\'s argument from no condemnation to life in the Spirit.',
        observation_prompt: 'What contrast does Paul draw between the flesh and the Spirit?',
        reflection_question: 'What does this passage show about the Spirit\'s role in the believer\'s life?',
        estimated_minutes: 10,
      },
      {
        reference: 'Romans 8:18–30',
        reading_objective: 'Continue in Romans 8. Read about the groaning of creation and the Spirit\'s intercession.',
        observation_prompt: 'How does Paul describe the hope of glory in this passage?',
        reflection_question: 'What does this passage show about God working all things for good?',
        estimated_minutes: 10,
      },
      {
        reference: 'Romans 8:31–39',
        reading_objective: 'Continue in Romans 8. Read Paul\'s climactic declaration of God\'s inseparable love.',
        observation_prompt: 'What does Paul list as unable to separate us from God\'s love?',
        reflection_question: 'What does this passage confirm about the security of those in Christ?',
        estimated_minutes: 7,
      },
    ],
  },
  John: {
    passages: [
      {
        reference: 'John 1:1–14',
        reading_objective: 'Continue your study of John. Read the prologue — the Word made flesh.',
        observation_prompt: 'What does John say the Word was, and what does that mean?',
        reflection_question: 'What does this passage show about who Jesus is?',
        estimated_minutes: 10,
      },
      {
        reference: 'John 3:1–21',
        reading_objective: 'Continue in John. Read Jesus\' conversation with Nicodemus about new birth.',
        observation_prompt: 'What does Jesus say must happen for someone to see the kingdom of God?',
        reflection_question: 'What does this passage show about God\'s love and the necessity of new birth?',
        estimated_minutes: 10,
      },
      {
        reference: 'John 10:1–18',
        reading_objective: 'Continue in John. Read about the Good Shepherd and His sheep.',
        observation_prompt: 'What does Jesus say about His sheep and His role as shepherd?',
        reflection_question: 'What does this passage show about Jesus\' knowledge of and care for His people?',
        estimated_minutes: 10,
      },
      {
        reference: 'John 15:1–11',
        reading_objective: 'Continue in John. Read about the vine and the branches.',
        observation_prompt: 'What does it mean to abide? What does Jesus promise will follow?',
        reflection_question: 'What does this passage show about the connection between abiding, fruit, and joy?',
        estimated_minutes: 8,
      },
      {
        reference: 'John 17:1–26',
        reading_objective: 'Continue in John. Read Jesus\' High Priestly Prayer for His people.',
        observation_prompt: 'What does Jesus ask the Father for His disciples?',
        reflection_question: 'What does this passage show about Jesus\' heart for His people?',
        estimated_minutes: 15,
      },
    ],
  },
  Psalms: {
    passages: [
      {
        reference: 'Psalm 1',
        reading_objective: 'Continue in the Psalms. Read about the two ways — the righteous and the wicked.',
        observation_prompt: 'What does the righteous person delight in?',
        reflection_question: 'What does this psalm show about the path of life and the path of destruction?',
        estimated_minutes: 5,
      },
      {
        reference: 'Psalm 23',
        reading_objective: 'Continue in the Psalms. Read the shepherd psalm slowly.',
        observation_prompt: 'Which image speaks most directly to your life right now?',
        reflection_question: 'What does this psalm show about the Lord as shepherd?',
        estimated_minutes: 5,
      },
      {
        reference: 'Psalm 46',
        reading_objective: 'Continue in the Psalms. Read about God as refuge and strength.',
        observation_prompt: 'What does it mean to be still and know that He is God?',
        reflection_question: 'What does this psalm show about God\'s presence in chaos?',
        estimated_minutes: 7,
      },
      {
        reference: 'Psalm 51',
        reading_objective: 'Continue in the Psalms. Read David\'s prayer of repentance.',
        observation_prompt: 'What does David ask God to do with his sin?',
        reflection_question: 'What does this psalm show about confession and God\'s mercy?',
        estimated_minutes: 7,
      },
      {
        reference: 'Psalm 103',
        reading_objective: 'Continue in the Psalms. Read about blessing the Lord and His benefits.',
        observation_prompt: 'What does David list as the benefits of the Lord?',
        reflection_question: 'What does this psalm show about God\'s steadfast love and compassion?',
        estimated_minutes: 7,
      },
    ],
  },
};

// ============================================================
// Non-study walks (adapted to available time)
// ============================================================

const shortWalks: WalkRecommendation[] = [
  {
    passage_reference: 'Psalm 23',
    reading_objective: 'Read the psalm slowly. Notice what each image teaches you about the character of God.',
    observation_prompt: 'Which image speaks most directly to your life right now?',
    reflection_question: 'What does this psalm show about the Lord as your shepherd?',
    estimated_minutes: 2,
    reason: 'A brief, meaningful passage for when you have only a moment.',
  },
  {
    passage_reference: 'Matthew 11:28–30',
    reading_objective: 'Read slowly. What does Jesus promise to those who come to Him?',
    observation_prompt: 'What does it mean that His yoke is easy and His burden is light?',
    reflection_question: 'What does this passage show about rest in Christ?',
    estimated_minutes: 2,
    reason: 'A short, restful passage for a quick moment with Scripture.',
  },
  {
    passage_reference: 'Lamentations 3:22–24',
    reading_objective: 'Read these three verses slowly. Let the steadfast love of the Lord sit with you.',
    observation_prompt: 'What is new every morning?',
    reflection_question: 'What does this passage show about God\'s faithfulness?',
    estimated_minutes: 2,
    reason: 'A brief passage of comfort and hope.',
  },
];

const mediumWalks: WalkRecommendation[] = [
  {
    passage_reference: 'Psalm 23',
    reading_objective: 'Read the psalm aloud if you can. Notice each image the shepherd uses — what does each one say about God?',
    observation_prompt: 'Which image speaks most directly to your life right now?',
    reflection_question: 'What does this psalm show about the Lord as your shepherd?',
    estimated_minutes: 5,
    reason: 'A familiar psalm that rewards slow reading.',
  },
  {
    passage_reference: 'Romans 8:31–39',
    reading_objective: 'Read slowly. Pay attention to what Paul says can separate the believer from the love of Christ.',
    observation_prompt: 'What words or phrases does Paul repeat? What does that repetition emphasize?',
    reflection_question: 'What does this passage show about the security of God\'s love?',
    estimated_minutes: 7,
    reason: 'A powerful passage about God\'s inseparable love.',
  },
  {
    passage_reference: 'John 15:1–11',
    reading_objective: 'Read carefully. Trace the relationship between abiding, bearing fruit, and joy.',
    observation_prompt: 'What does it mean to abide? What does Jesus promise will follow?',
    reflection_question: 'What does this passage show about the connection between abiding and joy?',
    estimated_minutes: 8,
    reason: 'A rich passage about union with Christ.',
  },
];

const longWalks: WalkRecommendation[] = [
  {
    passage_reference: 'Romans 8:1–17',
    reading_objective: 'Read the full passage. Trace Paul\'s argument from no condemnation to life in the Spirit.',
    observation_prompt: 'What contrast does Paul draw between the flesh and the Spirit?',
    reflection_question: 'What does this passage show about life in the Spirit versus life in the flesh?',
    estimated_minutes: 15,
    reason: 'A substantial passage for deeper study.',
  },
  {
    passage_reference: 'John 15:1–27',
    reading_objective: 'Read the entire chapter. Follow the progression: abiding, love, witness, opposition.',
    observation_prompt: 'How does abiding, loving, and witnessing connect in this passage?',
    reflection_question: 'What does this passage show about the cost and joy of following Christ?',
    estimated_minutes: 15,
    reason: 'A full chapter for extended meditation.',
  },
  {
    passage_reference: 'Ephesians 1:3–14',
    reading_objective: 'Read carefully. Trace the work of each Person of the Trinity in salvation.',
    observation_prompt: 'What does each member of the Trinity do in this passage?',
    reflection_question: 'What does this passage show about God\'s eternal purpose in Christ?',
    estimated_minutes: 10,
    reason: 'A theologically rich passage about God\'s plan of redemption.',
  },
];

function pickByDate<T>(arr: T[], date = new Date()): T {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return arr[dayOfYear % arr.length];
}

function pickByContext(text: string, availableTime: number): WalkRecommendation | null {
  const lower = text.toLowerCase();
  const themes: { keywords: string[]; passage: string; objective: string; prompt: string; question: string; reason: string }[] = [
    { keywords: ['anxious', 'anxiety', 'worried', 'worry', 'fear', 'afraid', 'nervous', 'stress', 'stressed', 'overwhelmed'],
      passage: 'Matthew 6:25–34', objective: 'Read slowly. Notice what Jesus says about worry and God\'s provision.',
      prompt: 'What does Jesus say about the value of worry?', question: 'What does this passage show about trusting God with your daily concerns?',
      reason: 'This passage speaks directly to anxiety and trust in God\'s provision.' },
    { keywords: ['meeting', 'speech', 'speak', 'words', 'what to say', 'wisdom', 'wise', 'decision', 'decide'],
      passage: 'James 1:5–8', objective: 'Read carefully. Notice what James says about asking God for wisdom.',
      prompt: 'What does James say God gives to those who ask?', question: 'How does this passage encourage you to seek God\'s wisdom for your situation?',
      reason: 'This passage addresses seeking God\'s wisdom for decisions and speech.' },
    { keywords: ['sad', 'grief', 'grieving', 'loss', 'lost', 'mourning', 'broken', 'heartbroken', 'cry', 'crying', 'tears'],
      passage: 'Psalm 34:18', objective: 'Read this verse slowly. Let the nearness of God sit with you.',
      prompt: 'What does it mean that the Lord is near to the brokenhearted?', question: 'How does this passage show God\'s presence in your grief?',
      reason: 'This passage speaks to grief and God\'s nearness to the brokenhearted.' },
    { keywords: ['angry', 'anger', 'frustrated', 'frustration', 'resent', 'bitter', 'offended'],
      passage: 'Ephesians 4:26–27', objective: 'Read carefully. Notice what Paul says about anger and its limits.',
      prompt: 'What does Paul say is the danger of unresolved anger?', question: 'How does this passage help you process anger righteously?',
      reason: 'This passage addresses anger and how to handle it without sin.' },
    { keywords: ['lonely', 'loneliness', 'alone', 'isolated', 'no one', 'friendless'],
      passage: 'Psalm 25:16–18', objective: 'Read David\'s prayer slowly. Notice his honesty before God.',
      prompt: 'What does David ask God to do?', question: 'How does this passage show that God sees you in loneliness?',
      reason: 'This passage speaks to loneliness and crying out to God.' },
    { keywords: ['sick', 'illness', 'pain', 'suffering', 'hurt', 'health', 'disease', 'cancer'],
      passage: '2 Corinthians 12:9–10', objective: 'Read Paul\'s words about weakness and God\'s grace.',
      prompt: 'What does Paul say about weakness and God\'s power?', question: 'How does this passage reframe suffering in light of Christ\'s power?',
      reason: 'This passage addresses suffering and God\'s sufficiency in weakness.' },
    { keywords: ['tempted', 'temptation', 'sin', 'struggle', 'falling', 'giving in', 'lust', 'addict'],
      passage: '1 Corinthians 10:13', objective: 'Read carefully. Notice what Paul promises about temptation.',
      prompt: 'What does Paul say God provides when you are tempted?', question: 'How does this passage give hope in the face of temptation?',
      reason: 'This passage addresses temptation and God\'s faithfulness to provide a way out.' },
    { keywords: ['thankful', 'gratitude', 'blessed', 'grateful', 'joy', 'happy', 'good day', 'gift'],
      passage: 'Psalm 103:1–5', objective: 'Read slowly. Let each benefit David lists sink in.',
      prompt: 'What benefits does David list?', question: 'How does this passage help you cultivate gratitude today?',
      reason: 'This passage is a call to bless the Lord and remember His benefits.' },
    { keywords: ['lost', 'direction', 'purpose', 'meaning', 'why am i', 'confused', 'path', 'guidance'],
      passage: 'Proverbs 3:5–6', objective: 'Read these verses slowly. Notice the connection between trust and direction.',
      prompt: 'What does Solomon promise when you trust the Lord?', question: 'How does this passage speak to your need for direction?',
      reason: 'This passage addresses trusting God for direction and purpose.' },
    { keywords: ['tired', 'exhausted', 'weary', 'burnout', 'burned out', 'rest', 'heavy', 'burden'],
      passage: 'Matthew 11:28–30', objective: 'Read slowly. What does Jesus promise to those who come to Him?',
      prompt: 'What does it mean that His yoke is easy?', question: 'How does this passage offer rest for your weariness?',
      reason: 'This passage is Jesus\' invitation to find rest in Him.' },
    { keywords: ['doubt', 'doubting', 'faith', 'struggle to believe', 'unbelief', 'question god'],
      passage: 'Mark 9:24', objective: 'Read this brief exchange. Notice the father\'s honesty.',
      prompt: 'What does the father cry out to Jesus?', question: 'How does this passage show that honest doubt is welcome before Christ?',
      reason: 'This passage addresses doubt and the prayer for greater faith.' },
    { keywords: ['conflict', 'fight', 'fighting', 'argument', 'argue', 'relationship', 'marriage', 'spouse', 'husband', 'wife'],
      passage: 'Ephesians 4:32', objective: 'Read carefully. Notice the standard Paul sets for relationships.',
      prompt: 'What does Paul say should replace bitterness and anger?', question: 'How does this passage guide you toward reconciliation?',
      reason: 'This passage addresses relational conflict and forgiveness.' },
  ];

  for (const theme of themes) {
    if (theme.keywords.some((kw) => lower.includes(kw))) {
      return {
        passage_reference: theme.passage,
        reading_objective: theme.objective,
        observation_prompt: theme.prompt,
        reflection_question: theme.question,
        estimated_minutes: Math.min(availableTime, 7),
        reason: theme.reason,
      };
    }
  }
  return null;
}

// ============================================================
// Main Recommendation Engine
// ============================================================

export async function recommendWalk(
  profile: Profile | null,
  recentWalks?: Walk[],
  date = new Date(),
  contextText?: string | null,
): Promise<WalkRecommendation> {
  const availableTime = profile?.available_time_minutes ?? 7;

  // If user provided context text, try to find contextually relevant scripture
  if (contextText && contextText.trim().length > 3) {
    const contextualPick = pickByContext(contextText.trim(), availableTime);
    if (contextualPick) return contextualPick;
  }

  // Check for current study with continuity
  const study = profile?.current_study?.trim();
  if (study && studySequences[study]) {
    const sequence = studySequences[study];

    // Find where the user left off based on recent walks
    if (recentWalks && recentWalks.length > 0) {
      const recentRefs = recentWalks.slice(0, 10).map((w) => w.passage_reference);
      const nextIndex = sequence.passages.findIndex(
        (p) => !recentRefs.includes(p.reference),
      );

      if (nextIndex !== -1) {
        const passage = sequence.passages[nextIndex];
        return {
          passage_reference: passage.reference,
          reading_objective: passage.reading_objective,
          observation_prompt: passage.observation_prompt,
          reflection_question: passage.reflection_question,
          estimated_minutes: passage.estimated_minutes,
          reason: `Continuing your study of ${study}. This is passage ${nextIndex + 1} of ${sequence.passages.length}.`,
        };
      }
    }

    // No recent walks — start from beginning or pick by date
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const passage = sequence.passages[dayOfYear % sequence.passages.length];
    return {
      passage_reference: passage.reference,
      reading_objective: passage.reading_objective,
      observation_prompt: passage.observation_prompt,
      reflection_question: passage.reflection_question,
      estimated_minutes: passage.estimated_minutes,
      reason: `Beginning your study of ${study}.`,
    };
  }

  // No current study — adapt to available time
  if (availableTime <= 2) {
    return pickByDate(shortWalks, date);
  }
  if (availableTime >= 15) {
    return pickByDate(longWalks, date);
  }
  return pickByDate(mediumWalks, date);
}

export function walkToInsert(walk: WalkRecommendation): Omit<Walk, 'id' | 'created_at' | 'started_at' | 'finished_at'> {
  return {
    passage_reference: walk.passage_reference,
    reading_objective: walk.reading_objective,
    observation_prompt: walk.observation_prompt,
    estimated_minutes: walk.estimated_minutes,
    status: 'pending',
  };
}

export function demoWalkToRecommendation(walk: DemoWalk): WalkRecommendation {
  return {
    ...walk,
    reason: 'A suggested passage for today.',
    reflection_question: 'What is this passage showing you about God?',
  };
}
