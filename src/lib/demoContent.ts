import type { Walk } from './types';

export interface DemoWalk {
  passage_reference: string;
  reading_objective: string;
  observation_prompt: string;
  estimated_minutes: number;
}

export const demoWalks: DemoWalk[] = [
  {
    passage_reference: 'Romans 8:31–39',
    reading_objective:
      'Read slowly. Pay attention to what Paul says can separate the believer from the love of Christ.',
    observation_prompt: 'What words or phrases does Paul repeat? What does that repetition emphasize?',
    estimated_minutes: 7,
  },
  {
    passage_reference: 'Psalm 23',
    reading_objective:
      'Read the psalm aloud if you can. Notice each image the shepherd uses — what does each one say about God?',
    observation_prompt: 'Which image speaks most directly to your life right now?',
    estimated_minutes: 5,
  },
  {
    passage_reference: 'John 15:1–11',
    reading_objective:
      'Read carefully. Trace the relationship between abiding, bearing fruit, and joy.',
    observation_prompt: 'What does it mean to abide? What does Jesus promise will follow?',
    estimated_minutes: 8,
  },
  {
    passage_reference: 'Lamentations 3:22–33',
    reading_objective:
      'Read slowly. Let the tension between suffering and steadfast love sit together without resolving it too quickly.',
    observation_prompt: 'What does Lamentations say is new every morning? How does that sit with you today?',
    estimated_minutes: 6,
  },
];

export function pickDemoWalk(date = new Date()): DemoWalk {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return demoWalks[dayOfYear % demoWalks.length];
}

export function walkToInsert(walk: DemoWalk): Omit<Walk, 'id' | 'created_at' | 'started_at' | 'finished_at'> {
  return {
    passage_reference: walk.passage_reference,
    reading_objective: walk.reading_objective,
    observation_prompt: walk.observation_prompt,
    estimated_minutes: walk.estimated_minutes,
    status: 'pending',
  };
}
