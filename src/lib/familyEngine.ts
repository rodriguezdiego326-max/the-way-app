import type { AgeQuestions } from './familyTypes';

// ============================================================
// Family Walk Engine
// Continuity-based family discipleship walks with
// multi-age questions and parent prep.
// ============================================================

export interface FamilyWalkRecommendation {
  topic: string;
  passage_reference: string;
  reading_instruction: string;
  parent_prep: {
    main_truth: string;
    biblical_context: string;
    reformed_foundation: string;
    words_children_may_ask_about: string;
    common_misunderstanding: string;
    one_thing_to_emphasize: string;
  };
  age_questions: AgeQuestions;
  application: string;
  prayer_guide: string;
  estimated_minutes: number;
  reason: string;
  is_demo: boolean;
}

// ============================================================
// Family Study Sequences (continuity)
// ============================================================

const familySequences: Array<{
  series: string;
  walks: Omit<FamilyWalkRecommendation, 'reason'>[];
}> = [
  {
    series: 'Attributes of God',
    walks: [
      {
        topic: 'God Is Holy',
        passage_reference: 'Isaiah 6:1–7',
        reading_instruction: 'Have someone in the family read the passage aloud. After reading, pause for a moment of silence before discussing.',
        parent_prep: {
          main_truth: 'God is perfectly holy — completely set apart, pure, and glorious. When we truly see God\'s holiness, we see our own sin and our need for His grace.',
          biblical_context: 'Isaiah was a prophet in the temple. He saw a vision of the Lord on His throne, surrounded by angels calling out "Holy, holy, holy." In the presence of God\'s holiness, Isaiah realized his own unworthiness. An angel purified his lips with a coal from the altar, pointing forward to the cleansing we receive in Christ.',
          reformed_foundation: 'The holiness of God is the foundation of Reformed theology. God\'s holiness means He is completely separate from sin and utterly devoted to His own glory. The Creator/creature distinction is essential — we are not God and cannot approach Him on our own terms. The threefold "holy" emphasizes God\'s perfection in the highest degree.',
          words_children_may_ask_about: 'holy (set apart, special, pure), throne (a king\'s seat), angels (God\'s servants), unclean (dirty with sin), altar (the place where sacrifices were made)',
          common_misunderstanding: 'Children may think "holy" just means "good" or "nice." Help them see that holy means completely set apart — God is in a category all by Himself. He is not just a better version of us; He is totally other.',
          one_thing_to_emphasize: 'Seeing God\'s holiness leads to seeing our need for His grace. That is where true worship begins.',
        },
        age_questions: {
          '3-5': ['Who was sitting on the throne?', 'What did the angels say about God?'],
          '6-8': ['Why do you think Isaiah was afraid?', 'What does "holy" mean?', 'What did the angel do to make Isaiah clean?'],
          '9-12': ['What did Isaiah realize about himself when he saw God\'s holiness?', 'Why did the angel touch Isaiah\'s mouth with the coal? What does that show us about how God forgives?'],
          '13-15': ['How does God\'s holiness change how we understand sin?', 'Why is it significant that the angels call God "holy" three times?'],
          '16-17': ['How does this passage challenge the modern idea that God exists mainly to make us comfortable?', 'What does Isaiah\'s response reveal about the difference between genuine encounter with God and mere religious activity?'],
          '18+': ['What does Isaiah\'s response reveal about genuine encounters with God\'s holiness?', 'How does the doctrine of God\'s holiness shape our understanding of worship, sin, and grace?'],
        },
        application: 'As a family, talk about: What does it look like for our family to treat God as holy in our daily life? How does knowing God is holy change how we pray, how we speak, and how we treat one another?',
        prayer_guide: 'Pray together: "Lord, You are holy. We see Your glory and we see our need for Your grace. Thank You for cleansing us through Jesus. Help our family to live in a way that honors You. Amen."',
        estimated_minutes: 10,
        is_demo: true,
      },
      {
        topic: 'God Is Just',
        passage_reference: 'Psalm 97:1–12',
        reading_instruction: 'Read the psalm together. Notice what it says about God\'s justice and how His people respond.',
        parent_prep: {
          main_truth: 'God is perfectly just. He always does what is right, and He will one day judge all evil. His justice is good news for those who trust Him.',
          biblical_context: 'This psalm celebrates God as King over all the earth. It describes His justice, His power over false gods, and the protection He gives to His faithful people. The psalm calls God\'s people to rejoice and to hate evil.',
          reformed_foundation: 'God\'s justice is an expression of His holiness. He cannot ignore sin or treat it as though it does not matter. The Reformed tradition emphasizes that God\'s justice and God\'s mercy meet at the cross — Christ bore the justice we deserved so that we could receive the mercy we did not deserve.',
          words_children_may_ask_about: 'justice (doing what is right), judge (deciding what is fair), righteous (right in God\'s eyes), idols (fake gods), faithful (keeping promises)',
          common_misunderstanding: 'Children may think justice means "getting in trouble." Help them see that God\'s justice means He will always do what is right — He will never be unfair or ignore what is wrong. That is very good news.',
          one_thing_to_emphasize: 'God\'s justice and God\'s love are not opposites. At the cross, they work together perfectly.',
        },
        age_questions: {
          '3-5': ['What does God do that is right?', 'How should God\'s people feel about Him?'],
          '6-8': ['What does it mean that God is just?', 'What are idols, and why does God not like them?', 'How do God\'s people respond to His justice?'],
          '9-12': ['If God is just, why does evil still happen sometimes? What does this psalm promise about the future?', 'What does it mean to "hate evil" as a family?'],
          '13-15': ['How does God\'s justice relate to the cross? Why did Jesus need to die for God to be both just and forgiving?', 'What is the difference between God\'s justice and human ideas of fairness?'],
          '16-17': ['How does the doctrine of God\'s justice challenge the idea that God should just overlook sin?', 'How should God\'s justice shape how we think about evil in the world and in our own lives?'],
          '18+': ['How does the Reformed understanding of God\'s justice as an expression of His holiness differ from contemporary views of God as primarily tolerant?', 'How does the cross demonstrate both God\'s justice and His mercy simultaneously?'],
        },
        application: 'Talk as a family: Where do you see injustice in the world? How does knowing God is just change how we respond? How can our family stand for what is right?',
        prayer_guide: 'Pray together: "Lord, You are just and You always do what is right. Help us to trust Your justice even when we see evil in the world. Help our family to love what is right and hate what is wrong. Amen."',
        estimated_minutes: 10,
        is_demo: true,
      },
      {
        topic: 'God Is Merciful',
        passage_reference: 'Ephesians 2:1–10',
        reading_instruction: 'Read the passage together. Notice what we were before God\'s mercy, and what God did for us.',
        parent_prep: {
          main_truth: 'God is rich in mercy. Even when we were dead in sin, God made us alive in Christ. Salvation is His gift, not our achievement.',
          biblical_context: 'Paul writes to the Ephesian church describing their spiritual state before and after Christ. They were dead in trespasses and sins, following the world and the flesh. But God, being rich in mercy, made them alive with Christ, raised them, and seated them with Him. This was entirely by grace through faith, not by works.',
          reformed_foundation: 'This passage is central to the Reformed understanding of salvation. Total depravity (we were dead, not merely sick), unconditional election (God\'s love initiated our rescue), and sola gratia (grace alone saves) are all present here. The emphasis on "not of works" anticipates the Reformation\'s recovery of justification by faith alone.',
          words_children_may_ask_about: 'mercy (not getting the punishment we deserve), grace (getting a gift we did not earn), dead (unable to help ourselves), trespasses (going the wrong way), gift (something freely given)',
          common_misunderstanding: 'Children may think being "dead in sin" means we were really bad people. Help them see that "dead" means we could not save ourselves — not that we were the worst people ever. Even "good" people need God\'s mercy.',
          one_thing_to_emphasize: 'We did not earn God\'s love. He gave it freely. That is what makes it so amazing.',
        },
        age_questions: {
          '3-5': ['What did God do for us when we were in trouble?', 'What is a gift?'],
          '6-8': ['What does it mean that we were "dead" in sin?', 'What does "mercy" mean?', 'Why can\'t we save ourselves?'],
          '9-12': ['Paul says we were dead, not just sick. What is the difference, and why does it matter?', 'What does it mean that salvation is "not of works"? How is that different from earning a reward?'],
          '13-15': ['How does this passage show both God\'s justice (we deserved wrath) and His mercy (He saved us)?', 'What does "by grace through faith" mean for how we live every day?'],
          '16-17': ['How does this passage undermine the modern assumption that people are basically good and just need to try harder?', 'What does it mean to be God\'s "workmanship"? How does that shape our understanding of purpose and identity?'],
          '18+': ['How does this passage encapsulate the Reformed doctrines of total depravity, unconditional election, and sola gratia?', 'What are the practical implications of being "created in Christ Jesus for good works" — works as the fruit, not the root, of salvation?'],
        },
        application: 'As a family, share: When have you experienced God\'s mercy? How can our family show mercy to others the way God has shown mercy to us?',
        prayer_guide: 'Pray together: "Father, thank You for Your great mercy. We were dead and You made us alive. We did not earn this — it is Your gift. Help our family to live as Your workmanship, showing Your grace to others. Amen."',
        estimated_minutes: 10,
        is_demo: true,
      },
      {
        topic: 'God Is Faithful',
        passage_reference: 'Lamentations 3:22–33',
        reading_instruction: 'Read these verses slowly. Notice what is new every morning and how God\'s faithfulness meets us in hard times.',
        parent_prep: {
          main_truth: 'God is faithful. His steadfast love never ceases. Even in the hardest circumstances, His mercies are new every morning. We can trust Him and wait on Him.',
          biblical_context: 'Lamentations was written after Jerusalem was destroyed by Babylon. Jeremiah is grieving deeply, yet in the middle of his grief he remembers God\'s steadfast love. The faithfulness of God is not a fair-weather promise — it shines brightest in the darkest moments.',
          reformed_foundation: 'God\'s faithfulness is rooted in His unchanging nature. He cannot deny Himself. The Reformed tradition emphasizes the perseverance of the saints — not because we hold on to God, but because God holds on to us. His faithfulness, not ours, is the ground of our security.',
          words_children_may_ask_about: 'faithful (keeping promises), steadfast love (love that does not give up), mercies (kindness we do not earn), wait (trusting without rushing)',
          common_misunderstanding: 'Children may think God\'s faithfulness means nothing bad will happen. Help them see that Jeremiah wrote this while everything was falling apart. God\'s faithfulness does not mean no hard times — it means He is with us in them and will never leave us.',
          one_thing_to_emphasize: 'God\'s mercies are new every morning. No matter what happened yesterday, His love starts fresh today.',
        },
        age_questions: {
          '3-5': ['What is new every morning?', 'Does God ever stop loving us?'],
          '6-8': ['What does "faithful" mean?', 'What was happening when Jeremiah wrote this? Was it a happy time or a sad time?', 'How can we "wait for the Lord"?'],
          '9-12': ['How can God\'s love be new every morning? What does that mean?', 'Why is it important that God\'s faithfulness does not depend on how good we are?'],
          '13-15': ['How does this passage challenge the idea that God\'s faithfulness means life will be easy?', 'What does it look like to "wait for the Lord" as a family going through a hard time?'],
          '16-17': ['How does the Reformed doctrine of the perseverance of the saints connect to God\'s faithfulness rather than our willpower?', 'How does Jeremiah\'s honesty about his grief alongside his trust in God model a mature faith?'],
          '18+': ['How does this passage demonstrate that God\'s faithfulness is not circumstantial but covenantal?', 'How does the Reformed emphasis on God\'s immutability (unchangeableness) undergird the promise of His steadfast love?'],
        },
        application: 'As a family, share: When have you seen God\'s faithfulness in a hard time? What would it look like for our family to trust that His mercies are new every morning?',
        prayer_guide: 'Pray together: "Lord, Your steadfast love never ceases. Your mercies are new every morning. Thank You for being faithful when we are not. Help our family to trust You in hard times and wait for You. Amen."',
        estimated_minutes: 10,
        is_demo: true,
      },
      {
        topic: 'God Is Sovereign',
        passage_reference: 'Daniel 4:34–35',
        reading_instruction: 'Read these verses together. Notice who is in control of everything, and how King Nebuchadnezzar responds.',
        parent_prep: {
          main_truth: 'God is sovereign over all things. He rules over kings, kingdoms, and all of history. No one can stop His plans or question His authority. He does whatever He pleases in heaven and on earth.',
          biblical_context: 'King Nebuchadnezzar of Babylon was the most powerful man in the world. God humbled him for seven years until he acknowledged that God alone is sovereign. This passage is his confession after being restored. The most powerful king on earth admitted that God\'s rule is above his.',
          reformed_foundation: 'The sovereignty of God is the bedrock of Reformed theology. God\'s decree encompasses all things — from the rise and fall of nations to the details of our lives. This is not fatalism; it is the comfort that nothing happens outside God\'s wise, good, and holy purpose. The Reformed tradition distinguishes between God\'s sovereignty and human responsibility without compromising either.',
          words_children_may_ask_about: 'sovereign (in charge of everything), kingdom (a king\'s land), heaven (where God rules), earth (where we live), dominion (power to rule)',
          common_misunderstanding: 'Children may think "sovereign" means God is a bossy king. Help them see that God\'s sovereignty is not about being controlling — it is about being completely trustworthy. Everything is in His capable, loving hands.',
          one_thing_to_emphasize: 'If God is sovereign over everything, we never need to be afraid. Nothing surprises Him or slips past Him.',
        },
        age_questions: {
          '3-5': ['Who is in charge of everything?', 'Can anyone tell God what to do?'],
          '6-8': ['What does "sovereign" mean?', 'Who was Nebuchadnezzar, and what did he learn?', 'How does it feel to know God is in charge of everything?'],
          '9-12': ['If God is sovereign, why do bad things happen? How can we trust Him even when we do not understand?', 'What does it mean that God\'s "dominion is an everlasting dominion"?'],
          '13-15': ['How does God\'s sovereignty relate to human choices? If God is in control, do our choices matter?', 'How does knowing God is sovereign change how we face uncertain times?'],
          '16-17': ['How does the doctrine of sovereignty challenge the modern emphasis on human autonomy and self-determination?', 'What is the difference between God\'s sovereignty and fatalism? How does human responsibility fit in?'],
          '18+': ['How does the Reformed understanding of God\'s sovereignty over all things (including evil) avoid making God the author of sin while maintaining His absolute control?', 'How does Nebuchadnezzar\'s confession model the proper human response to divine sovereignty?'],
        },
        application: 'As a family, talk about: What is something that feels out of control right now? How does knowing God is sovereign help us trust Him with it?',
        prayer_guide: 'Pray together: "Lord, You are sovereign over everything. No king, no problem, no circumstance is beyond Your control. Help our family to trust Your rule and rest in Your wisdom. Amen."',
        estimated_minutes: 10,
        is_demo: true,
      },
    ],
  },
];

// ============================================================
// Family Journey Pathways
// ============================================================

export const journeyPathways: Array<{
  id: string;
  title: string;
  description: string;
  lessons: Array<{ number: number; title: string; description: string }>;
  available: boolean;
}> = [
  {
    id: 'foundations',
    title: 'Foundations',
    description: 'The core truths of the Christian faith for families.',
    available: true,
    lessons: [
      { number: 1, title: 'Who Is God?', description: 'God is the Creator of all things — perfect, holy, and full of love.' },
      { number: 2, title: 'What Is the Bible?', description: 'God\'s Word, given to show us who He is and how to live.' },
      { number: 3, title: 'Creation', description: 'God made everything good, including us, for His glory.' },
      { number: 4, title: 'What Is Sin?', description: 'Sin is rejecting God\'s rule. It separates us from Him.' },
      { number: 5, title: 'Who Is Jesus?', description: 'Jesus is God the Son, who came to save us from sin.' },
      { number: 6, title: 'Why Did Jesus Die?', description: 'Jesus took the punishment we deserved so we could be forgiven.' },
      { number: 7, title: 'The Resurrection', description: 'Jesus rose from the dead, proving His victory over sin and death.' },
      { number: 8, title: 'Grace', description: 'God saves us not by our works but by His free gift.' },
      { number: 9, title: 'Faith', description: 'Faith is trusting in Jesus alone for salvation.' },
      { number: 10, title: 'Prayer', description: 'Prayer is talking to God — our Father who hears us.' },
      { number: 11, title: 'The Church', description: 'The church is God\'s family, called to worship and serve together.' },
      { number: 12, title: 'Christian Life', description: 'Following Jesus every day — at home, at school, and everywhere.' },
    ],
  },
  {
    id: 'attributes_of_god',
    title: 'Attributes of God',
    description: 'Who God is — His character and perfections.',
    available: false,
    lessons: [
      { number: 1, title: 'God Is Holy', description: 'Coming soon' },
      { number: 2, title: 'God Is Just', description: 'Coming soon' },
      { number: 3, title: 'God Is Merciful', description: 'Coming soon' },
      { number: 4, title: 'God Is Faithful', description: 'Coming soon' },
      { number: 5, title: 'God Is Sovereign', description: 'Coming soon' },
    ],
  },
  {
    id: 'ten_commandments',
    title: 'Ten Commandments',
    description: 'God\'s law as a guide for life and worship.',
    available: false,
    lessons: [
      { number: 1, title: 'No Other Gods', description: 'Coming soon' },
      { number: 2, title: 'No Idols', description: 'Coming soon' },
    ],
  },
  {
    id: 'lords_prayer',
    title: 'Lord\'s Prayer',
    description: 'Learning to pray from the prayer Jesus taught.',
    available: false,
    lessons: [
      { number: 1, title: 'Our Father', description: 'Coming soon' },
    ],
  },
  {
    id: 'apostles_creed',
    title: 'Apostles\' Creed',
    description: 'The core doctrines of the Christian faith.',
    available: false,
    lessons: [
      { number: 1, title: 'I Believe in God', description: 'Coming soon' },
    ],
  },
  {
    id: 'five_solas',
    title: 'Five Solas',
    description: 'The rallying cries of the Reformation.',
    available: false,
    lessons: [
      { number: 1, title: 'Sola Scriptura', description: 'Coming soon' },
    ],
  },
  {
    id: 'doctrines_of_grace',
    title: 'Doctrines of Grace',
    description: 'The Reformed understanding of salvation.',
    available: false,
    lessons: [
      { number: 1, title: 'Total Depravity', description: 'Coming soon' },
    ],
  },
  {
    id: 'covenant_theology',
    title: 'Covenant Theology',
    description: 'God\'s covenants throughout Scripture.',
    available: false,
    lessons: [
      { number: 1, title: 'Covenant of Works', description: 'Coming soon' },
    ],
  },
  {
    id: 'church_history',
    title: 'Church History',
    description: 'How God has preserved His church through the ages.',
    available: false,
    lessons: [
      { number: 1, title: 'The Early Church', description: 'Coming soon' },
    ],
  },
  {
    id: 'reformation',
    title: 'Reformation',
    description: 'The recovery of biblical truth in the 16th century.',
    available: false,
    lessons: [
      { number: 1, title: 'Luther and the 95 Theses', description: 'Coming soon' },
    ],
  },
  {
    id: 'apologetics',
    title: 'Apologetics',
    description: 'Defending and explaining the faith.',
    available: false,
    lessons: [
      { number: 1, title: 'Why We Believe', description: 'Coming soon' },
    ],
  },
  {
    id: 'christian_worldview',
    title: 'Christian Worldview',
    description: 'Seeing all of life through the lens of Scripture.',
    available: false,
    lessons: [
      { number: 1, title: 'What Is a Worldview?', description: 'Coming soon' },
    ],
  },
  {
    id: 'missions',
    title: 'Missions',
    description: 'God\'s heart for the nations and our part in it.',
    available: false,
    lessons: [
      { number: 1, title: 'The Great Commission', description: 'Coming soon' },
    ],
  },
];

// ============================================================
// Recommendation Engine
// ============================================================

export function recommendFamilyWalk(
  recentWalkTopics?: string[],
  date = new Date(),
): FamilyWalkRecommendation {
  const sequence = familySequences[0];

  // Check for continuity — continue where left off
  if (recentWalkTopics && recentWalkTopics.length > 0) {
    const recentTopics = recentWalkTopics.slice(0, 10);
    const nextIndex = sequence.walks.findIndex(
      (w) => !recentTopics.includes(w.topic),
    );

    if (nextIndex !== -1) {
      const walk = sequence.walks[nextIndex];
      return {
        ...walk,
        reason: `Continuing your family study of ${sequence.series}. This is walk ${nextIndex + 1} of ${sequence.walks.length}.`,
      };
    }
  }

  // No recent walks — pick by day of week
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend && sequence.walks.length > 0) {
    // Weekend — suggest review/prayer
    const lastWalk = sequence.walks[Math.min(recentWalkTopics?.length || 0, sequence.walks.length - 1)];
    return {
      ...lastWalk,
      topic: 'Review & Family Prayer',
      passage_reference: lastWalk.passage_reference,
      reading_instruction: 'Take time to review what your family has been learning this week. Share what stood out, what questions you still have, and pray together.',
      reason: 'Weekend review — looking back at what God has been teaching your family this week.',
    };
  }

  // Start from beginning
  const walk = sequence.walks[0];
  return {
    ...walk,
    reason: `Beginning your family study of ${sequence.series}.`,
  };
}

