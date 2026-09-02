import type { AgeQuestions, AgeRange } from './familyTypes';
import { retrieveSources } from './libraryEngine';
import type { Citation } from './libraryTypes';

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
// Catechism Demo Data (public domain)
// ============================================================

export interface CatechismQuestion {
  number: number;
  question: string;
  answer: string;
  scripture_basis: string;
  explanation: string;
  discussion_question: string;
  family_application: string;
  prayer: string;
}

export const westminsterShorterCatechism: CatechismQuestion[] = [
  {
    number: 1,
    question: 'What is the chief end of man?',
    answer: 'Man\'s chief end is to glorify God, and to enjoy Him forever.',
    scripture_basis: '1 Corinthians 10:31; Psalm 73:25–26',
    explanation: 'We were made for God\'s glory. Our highest purpose is not our own happiness or achievement — it is to glorify God by living for Him and finding our deepest joy in Him.',
    discussion_question: 'What does it mean to "glorify God" as a family in everyday life?',
    family_application: 'Choose one way your family will glorify God together this week — in how you speak, how you serve, or how you give thanks.',
    prayer: 'Lord, help our family to glorify You in all we do and to find our deepest joy in You. Amen.',
  },
  {
    number: 2,
    question: 'What rule has God given to direct us how to glorify and enjoy Him?',
    answer: 'The Word of God, which is contained in the Scriptures of the Old and New Testaments, is the only rule to direct us how we may glorify and enjoy Him.',
    scripture_basis: '2 Timothy 3:16–17; 1 John 1:3',
    explanation: 'God has not left us to figure out life on our own. He has given us His Word — the Bible — to show us how to live for Him and find joy in Him.',
    discussion_question: 'How can our family make Scripture a bigger part of our daily life?',
    family_application: 'Pick a time this week when the family will read Scripture together — even just five minutes.',
    prayer: 'Lord, thank You for Your Word. Help us to read it, trust it, and live by it together. Amen.',
  },
  {
    number: 3,
    question: 'What do the Scriptures principally teach?',
    answer: 'The Scriptures principally teach what man is to believe concerning God, and what duty God requires of man.',
    scripture_basis: '2 Timothy 1:13; Ecclesiastes 12:13',
    explanation: 'The Bible teaches us two main things: what to believe about God and how God calls us to live. Faith and obedience go together.',
    discussion_question: 'What is something new you have learned from the Bible recently about God or about how He calls us to live?',
    family_application: 'As a family, name one belief and one action the Bible teaches. Talk about how to live it out this week.',
    prayer: 'Lord, teach us through Your Word what to believe and how to live. Help our family to follow You in both. Amen.',
  },
  {
    number: 4,
    question: 'What is God?',
    answer: 'God is a Spirit, infinite, eternal, and unchangeable, in His being, wisdom, power, holiness, justice, goodness, and truth.',
    scripture_basis: 'John 4:24; Psalm 139:1–6; Psalm 90:2; James 1:17',
    explanation: 'God is not a physical being. He has no limits, no beginning, and no end. He never changes. Everything about Him — His wisdom, power, holiness, justice, goodness, and truth — is perfect and complete.',
    discussion_question: 'Which of God\'s attributes (wisdom, power, holiness, justice, goodness, truth) means the most to your family right now, and why?',
    family_application: 'As a family, pick one attribute of God to focus on this week. Look for it in Scripture and in your daily life.',
    prayer: 'Lord, You are infinite, eternal, and unchangeable. Help our family to know You better and to trust Your perfect character. Amen.',
  },
  {
    number: 5,
    question: 'Are there more Gods than one?',
    answer: 'There is but one only, the living and true God.',
    scripture_basis: 'Deuteronomy 6:4; Jeremiah 10:10',
    explanation: 'There is only one God. He is not one among many — He is the only God, and He alone is real, alive, and true.',
    discussion_question: 'Why does it matter that there is only one God, not many?',
    family_application: 'Talk as a family about how believing in one God changes how you live, pray, and make decisions.',
    prayer: 'Lord, You alone are God. Help our family to worship You only and to trust You alone. Amen.',
  },
];

export const heidelbergCatechism: CatechismQuestion[] = [
  {
    number: 1,
    question: 'What is your only comfort in life and in death?',
    answer: 'That I am not my own, but belong — body and soul, in life and in death — to my faithful Savior, Jesus Christ.',
    scripture_basis: 'Romans 14:7–8; 1 Corinthians 6:19–20',
    explanation: 'Our deepest comfort is not a feeling or a circumstance — it is the fact that we belong to Jesus. We are not our own; we are His, and He will never let us go.',
    discussion_question: 'What does it mean to "belong to Jesus" as a family? How does that change how we face hard things?',
    family_application: 'Talk about a time when knowing you belong to Jesus gave your family comfort. Share it together.',
    prayer: 'Lord, thank You that we belong to You. Help our family to live as people who are loved and held by Jesus. Amen.',
  },
  {
    number: 2,
    question: 'How many things must you know to live and die in the joy of this comfort?',
    answer: 'Three: first, how great my sin and misery is; second, how I am set free from all my sins and misery; third, how I am to thank God for such deliverance.',
    scripture_basis: 'Romans 3:22–24; John 17:3; Matthew 5:16',
    explanation: 'To know our comfort, we need to know three things: our sin (guilt), our salvation (grace), and our response (gratitude). Guilt, grace, gratitude — the three parts of the Heidelberg Catechism.',
    discussion_question: 'Which of the three — sin, salvation, or thankfulness — does your family need to think about most right now?',
    family_application: 'As a family, share one thing you are thankful to God for this week.',
    prayer: 'Lord, help us to know our need for You, to trust Your salvation, and to live in gratitude. Amen.',
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
// Parent Guide Sections
// ============================================================

export const parentGuideSections: Array<{
  id: string;
  title: string;
  description: string;
  content: string;
}> = [
  {
    id: 'teaching_scripture',
    title: 'Teaching Scripture',
    description: 'How to open the Bible with your children.',
    content: 'Development content — SOLAPATH will help you teach Scripture to your children by providing age-appropriate questions, parent prep, and a simple structure: read, observe, understand, discuss, apply, pray. The goal is not to be a Bible expert but to be a faithful guide. Start with a passage, read it together, and let the text speak. You do not need to have all the answers — you need to be willing to explore together.',
  },
  {
    id: 'family_worship',
    title: 'Family Worship',
    description: 'A simple pattern for worship at home.',
    content: 'Development content — Family worship does not need to be long or complicated. A simple pattern: read a passage, discuss it briefly, pray together, and sing if you can. Even five minutes matters. Consistency matters more than perfection. SOLAPATH\'s Family Walks are designed to give you a ready-made pattern.',
  },
  {
    id: 'difficult_questions',
    title: 'Difficult Questions',
    description: 'When children ask hard things.',
    content: 'Development content — When your child asks a hard question, do not panic. It is good that they are asking. Listen carefully, affirm the question, and be honest about what Scripture clearly teaches and what it does not directly address. Use the "My Child Asked..." feature for guidance. Never shut down a question — it may be the beginning of genuine faith.',
  },
  {
    id: 'gospel_conversations',
    title: 'Gospel Conversations With Children',
    description: 'Sharing the Gospel at home.',
    content: 'Development content — The Gospel is best shared in the ordinary moments of family life, not just in formal sit-down conversations. Let your children see your faith in how you pray, how you repent, how you forgive, and how you trust God in hard times. Talk about Jesus naturally, the way you talk about anyone you love.',
  },
  {
    id: 'parenting_ages',
    title: 'Parenting Through Different Ages',
    description: 'How discipleship changes as children grow.',
    content: 'Development content — Young children learn through story and wonder. School-age children learn through questions and discovery. Teenagers learn through dialogue and ownership. The truth does not change, but the way we teach it must grow with the child. SOLAPATH\'s age-adapted questions help you meet your child where they are.',
  },
  {
    id: 'technology_worldview',
    title: 'Technology & Worldview',
    description: 'Discipling in a digital age.',
    content: 'Development content — Technology is not the enemy, but it shapes how we see the world. Help your family develop a Christian worldview by talking about what you watch, read, and hear together. Ask: "What does this say about God, about us, about what is good?" Let Scripture be the lens through which you evaluate everything else.',
  },
  {
    id: 'doubt',
    title: 'Doubt',
    description: 'When your child struggles with faith.',
    content: 'Development content — Doubt is not the opposite of faith — it can be part of honest faith seeking understanding. When your child doubts, listen more than you talk. Do not rush to fix. Let them know that questions are welcome in your home and in God\'s house. Point them to Scripture, to honest prayer, and to the local church. Doubt handled with love and truth can lead to deeper, more rooted faith.',
  },
  {
    id: 'teenage_questions',
    title: 'Teenage Questions',
    description: 'Navigating faith with older children.',
    content: 'Development content — Teenagers need to know that Christianity is not just a set of rules but a whole view of reality. Engage their questions about evolution, other religions, suffering, and sexuality honestly. Show them that the Reformed tradition has been thinking about these questions for centuries and is not afraid of honest inquiry.',
  },
  {
    id: 'church',
    title: 'Church',
    description: 'Why the local church matters for your family.',
    content: 'Development content — Family discipleship is not a replacement for the local church — it is a complement to it. Your children need to see believers of all ages worshiping together, hearing the Word preached, and living in community. Prioritize faithful church attendance and involvement as a family.',
  },
  {
    id: 'prayer',
    title: 'Prayer',
    description: 'Teaching your family to pray.',
    content: 'Development content — Prayer is not about perfect words but about coming honestly to God. Teach your children to pray by praying with them and letting them hear you pray. Use the Family Prayer feature to create prayer threads together. Let prayer be a natural part of your family\'s daily rhythm, not just a bedtime ritual.',
  },
  {
    id: 'character',
    title: 'Character',
    description: 'Building godly character through Scripture.',
    content: 'Development content — Character is not produced by rules alone — it is shaped by what we love. Help your children love what is good by showing them the beauty of godliness in Scripture and in your own life. Talk about character not as performance but as the fruit of knowing God.',
  },
];

// ============================================================
// "My Child Asked" Demo Responses
// ============================================================

export const childAskedResponses: Record<string, {
  understand_it_yourself: string;
  open_the_bible_together: Array<{ reference: string; reason: string }>;
  how_to_explain_it: Record<AgeRange, string>;
  ask_them: string[];
  they_may_ask_next: string[];
  reformed_foundation: string;
}> = {
  'why did jesus have to die': {
    understand_it_yourself: 'Jesus died because sin has a real cost. God is holy and just, and sin cannot simply be ignored. But God is also full of mercy. In His love, He sent His own Son to bear the punishment our sins deserved so that we could be forgiven and brought near to God. The cross is where God\'s justice and love meet perfectly.',
    open_the_bible_together: [
      { reference: 'Romans 5:6–8', reason: 'Shows that Christ died for us while we were still sinners.' },
      { reference: '2 Corinthians 5:21', reason: 'Explains that Jesus, who knew no sin, became sin for us so we could become the righteousness of God.' },
      { reference: 'Isaiah 53:4–6', reason: 'A prophecy written hundreds of years before Jesus, showing that His suffering was God\'s plan.' },
    ],
    how_to_explain_it: {
      '3-5': 'Jesus died because we needed someone to save us. We all do wrong things, and God is so good and fair that wrong things have to be paid for. Jesus loves us so much that He paid for them Himself, so we can be with God forever.',
      '6-8': 'Imagine you did something wrong and there was a cost to pay — like a fine. You could not pay it yourself. Jesus is like a friend who steps in and pays it for you, even though He did nothing wrong. He did that because He loves you and wants you to be with God.',
      '9-12': 'Sin has a real cost — death. God is just, which means He cannot just ignore sin. But God is also merciful, which means He wants to save us. Jesus solved this by taking the punishment we deserved so we could go free. It is like a judge who pays the fine Himself so the guilty person can go home.',
      '13-15': 'The cross is where God\'s justice and mercy meet. Justice says sin must be punished. Mercy says God wants to forgive. Jesus bore the punishment so God could be both just and the one who justifies. This is the heart of the Gospel — not that God overlooked sin, but that He dealt with it fully in Christ.',
      '16-17': 'The Reformed understanding emphasizes that Christ\'s death was substitutionary and sufficient — He actually bore the wrath of God in our place, not merely showed us an example of love. The cross satisfies God\'s justice so that grace can flow to us without compromising God\'s holiness. This is what the Reformers recovered: that our salvation is accomplished by Christ, not by us.',
      '18+': 'The Reformed tradition emphasizes penal substitutionary atonement — Christ bore the full weight of divine wrath in our place. This is not a metaphor but a legal and relational reality. The cross satisfies God\'s justice so that justification is grounded not in leniency but in real payment. The Reformers recovered this from Scripture against medieval distortions that made salvation dependent on human merit.',
    },
    ask_them: [
      'Why do you think Jesus had to die instead of just forgiving us?',
      'What does this show us about how serious sin is?',
      'What does this show us about how much God loves us?',
    ],
    they_may_ask_next: [
      'Did God punish Jesus? Was God angry at Him?',
      'Why could not God just forgive without anyone dying?',
      'Does this mean everyone is saved, or only some people?',
    ],
    reformed_foundation: 'The Reformed tradition teaches penal substitutionary atonement — Christ bore the wrath of God in our place. This is rooted in passages like Isaiah 53, Romans 3:25–26, and 2 Corinthians 5:21. The cross is not merely an example of love but a real satisfaction of divine justice, so that God can be both "just and the justifier of the one who has faith in Jesus" (Romans 3:26).',
  },
  'why did god allow grandma to die': {
    understand_it_yourself: 'Death is one of the hardest parts of living in a world broken by sin. God did not originally create us to die — death entered the world through sin. But God is sovereign even over death, and He promises to bring His people through death into eternal life. We grieve because we love, and that grief is good. But we do not grieve without hope, because Jesus has defeated death by rising from the dead.',
    open_the_bible_together: [
      { reference: 'John 11:25–26', reason: 'Jesus says He is the resurrection and the life.' },
      { reference: '1 Thessalonians 4:13–14', reason: 'Paul tells us not to grieve as those who have no hope.' },
      { reference: 'Revelation 21:1–4', reason: 'Shows the future when God will wipe away every tear and death will be no more.' },
    ],
    how_to_explain_it: {
      '3-5': 'Grandma died because our bodies get old and stop working. But God loves Grandma and God loves us. Jesus is stronger than death — He rose from the dead — and He promises that everyone who trusts Him will live with God forever. Grandma is safe with God.',
      '6-8': 'Death is hard and sad. It came into the world because of sin, not because God wanted us to die. But God is bigger than death. Jesus died and came back to life to show that death does not have the last word. If we trust Jesus, we will live with God forever, and we will see Grandma again.',
      '9-12': 'Death was not part of God\'s original plan — it entered the world through sin. But God is sovereign over even death, and He has defeated it through Jesus. When someone we love dies, we grieve because we miss them. But as Christians, we grieve with hope because Jesus has promised to raise us to eternal life.',
      '13-15': 'This is a deep question about suffering and God\'s sovereignty. God did not create death — it is a consequence of the Fall. But God is sovereign over it and works through it. For believers, death is not the end but a passage into the presence of God. Jesus\' resurrection is the guarantee that death will ultimately be destroyed.',
      '16-17': 'The Reformed tradition teaches that death is both a consequence of sin and a defeated enemy. God\'s sovereignty extends over death without making God the author of death in a way that absolves human responsibility. The resurrection of Christ is the firstfruits — the guarantee that death will not have the final word for those who are in Christ.',
      '18+': 'The Reformed tradition teaches that death is both the wages of sin and a defeated enemy through Christ\'s resurrection. God\'s sovereignty over death does not make Him the author of evil, but it means that even death serves His redemptive purposes. The hope of resurrection is not metaphorical — it is the certain future for those who are in Christ.',
    },
    ask_them: [
      'What is your favorite memory with Grandma?',
      'How does it feel to miss someone you love?',
      'What do you think heaven will be like?',
    ],
    they_may_ask_next: [
      'Will we see Grandma again?',
      'Where is Grandma right now?',
      'Why could not God just stop people from dying?',
    ],
    reformed_foundation: 'The Reformed tradition teaches that death is a consequence of the Fall but is now conquered by Christ. The intermediate state (present with the Lord) and the final resurrection are both grounded in Christ\'s own resurrection. God is sovereign over death without being the author of it, and He promises to wipe away every tear (Revelation 21:4).',
  },
  'what is sin': {
    understand_it_yourself: 'Sin is not just doing bad things — it is rejecting God\'s rule and choosing our own way instead. God made us to live with Him as His children, but sin breaks that relationship. The good news is that God has provided a way back through Jesus.',
    open_the_bible_together: [
      { reference: '1 John 3:4', reason: 'Defines sin as lawlessness — going our own way instead of God\'s way.' },
      { reference: 'Romans 3:23', reason: 'Shows that everyone has sinned and falls short of God\'s glory.' },
      { reference: 'Isaiah 59:1–2', reason: 'Shows that sin separates us from God.' },
    ],
    how_to_explain_it: {
      '3-5': 'Sin is when we choose our way instead of God\'s way. It is like saying "I do not want to listen" to someone who loves us. God made us to be close to Him, but sin pushes us away. The good news is that Jesus brings us back.',
      '6-8': 'Sin is not just doing bad things — it is going our own way instead of God\'s way. It is like a child who runs away from a loving parent. The parent is not being mean by calling it wrong — the running away is what is dangerous. God calls sin wrong because it hurts us and separates us from Him.',
      '9-12': 'Sin is more than breaking rules — it is a condition of the heart that wants our own way instead of God\'s way. Everyone has sinned. Sin separates us from God, but God sent Jesus to take our sin away so we can be close to God again.',
      '13-15': 'The Reformed tradition teaches that sin is not just actions but a condition — total depravity. This does not mean everyone is as bad as they could be, but that sin affects every part of us. We cannot fix ourselves, which is why we need God\'s grace. The good news is that Christ\'s righteousness is given to us by faith.',
      '16-17': 'The Reformed doctrine of total depravity teaches that sin has corrupted every faculty — mind, will, affections — not that humans are incapable of any good, but that no part of us is untouched by sin. This makes the Gospel necessary, not optional. We cannot earn salvation; we can only receive it as a gift.',
      '18+': 'The Reformed doctrine of total depravity teaches that sin has corrupted every faculty of the human person — mind, will, and affections. This does not mean humans are as bad as they could possibly be, but that no part of us is untouched by sin. This is why salvation must be by grace alone, through faith alone, in Christ alone — we cannot contribute to our own rescue.',
    },
    ask_them: [
      'What does it feel like when you know you did something wrong?',
      'Why do you think God calls sin "wrong"?',
      'How does Jesus help us when we sin?',
    ],
    they_may_ask_next: [
      'Why did God let people sin in the first place?',
      'If God forgives, why does sin still matter?',
      'Can we stop sinning if we try hard enough?',
    ],
    reformed_foundation: 'The Reformed tradition teaches that sin is both an act and a condition (total depravity). Sin is not merely a mistake but a rebellion against God\'s authority. The Heidelberg Catechism describes our misery as the knowledge of our sin and God\'s just judgment. The solution is not moral improvement but the imputation of Christ\'s righteousness through faith alone.',
  },
  'how do we know the bible is true': {
    understand_it_yourself: 'We trust the Bible because God Himself speaks through it. The Bible is not just a human book about God — it is God\'s Word given to us through human authors. We trust it because God has proven Himself faithful in it, through fulfilled prophecy, the resurrection of Jesus, and the witness of His Spirit in our hearts.',
    open_the_bible_together: [
      { reference: '2 Timothy 3:16–17', reason: 'All Scripture is breathed out by God.' },
      { reference: '2 Peter 1:20–21', reason: 'Prophecy was produced by men carried along by the Holy Spirit.' },
      { reference: 'John 10:35', reason: 'Jesus Himself treated Scripture as God\'s unbreakable Word.' },
    ],
    how_to_explain_it: {
      '3-5': 'We know the Bible is true because God wrote it. He told people what to write, and they wrote it down. Jesus read the Bible and said it was all about Him. We can trust it because we can trust God.',
      '6-8': 'The Bible is not just a book people made up — it is God\'s Word. God told people what to write, and the Holy Spirit helped them write it exactly right. Jesus believed the Bible, and He is the smartest, most truthful person who ever lived. If Jesus trusted it, we can too.',
      '9-12': 'We know the Bible is true because God Himself speaks through it. Jesus treated the Old Testament as God\'s Word and never corrected it — He fulfilled it. The Bible has been preserved for thousands of years, and everything it says about Jesus came true. The Holy Spirit helps us trust it from the inside.',
      '13-15': 'We trust the Bible because God speaks through it. Jesus treated Scripture as authoritative and reliable. Fulfilled prophecy, the historical reliability of the Gospels, and the internal witness of the Holy Spirit all confirm this. The Reformed tradition emphasizes that Scripture is self-authenticating — God\'s Word proves itself to the believer.',
      '16-17': 'The Reformed tradition teaches that Scripture is self-authenticating — it does not need external proof to establish its authority, because God speaks through it. The witness of the Holy Spirit confirms in the believer\'s heart that Scripture is God\'s Word. Historical evidence supports this, but the ultimate ground of confidence is God Himself speaking.',
      '18+': 'The Reformed tradition teaches that Scripture is self-authenticating (autopiston). It does not derive its authority from the church, reason, or experience, but from God as its author. The internal testimony of the Holy Spirit enables believers to recognize Scripture as God\'s Word. This is not a circular argument but an appeal to the ultimate authority — God Himself speaking — which no higher authority can confirm.',
    },
    ask_them: [
      'How do you know when someone is telling the truth?',
      'Why do you think Jesus trusted the Bible?',
      'What is your favorite story from the Bible?',
    ],
    they_may_ask_next: [
      'But how do we know the people who wrote it did not make mistakes?',
      'What about other holy books?',
      'Has the Bible been changed over the years?',
    ],
    reformed_foundation: 'The Reformed tradition teaches the self-authentication of Scripture (autopiston). The authority of Scripture does not depend on the church, human reason, or historical evidence, though these support it. The ultimate ground is God speaking, and the internal witness of the Holy Spirit confirms this in the believer.',
  },
  'why does god allow bad things': {
    understand_it_yourself: 'This is one of the hardest questions, and it is good to ask it. God did not create the world with bad things in it — sin and suffering entered through the Fall. But God is sovereign over all things, and He promises to work all things for good for those who love Him. We may not understand why He allows specific suffering, but we know His character, His cross, and His promise to make all things new.',
    open_the_bible_together: [
      { reference: 'Romans 8:28', reason: 'God works all things together for good for those who love Him.' },
      { reference: 'Genesis 50:20', reason: 'Joseph says what others meant for evil, God meant for good.' },
      { reference: 'Revelation 21:1–4', reason: 'God promises to end all suffering and death.' },
    ],
    how_to_explain_it: {
      '3-5': 'Bad things happen because the world is not the way God first made it. People chose to go their own way, and that brought broken things. But God is still in charge, and He promises to fix everything one day. Jesus is proof that God is stronger than every bad thing.',
      '6-8': 'God made the world good, but people chose to go their own way, and that brought broken things into the world. God is still in charge of everything, even the hard things. He promises that one day He will make everything new and there will be no more sad things. Jesus dying and coming back to life shows us that God is stronger than the worst things.',
      '9-12': 'God did not create the world with bad things in it. Sin and suffering came through the Fall. But God is sovereign — He is in charge even of the hard things. He does not always tell us why He allows specific suffering, but He shows us at the cross that He is willing to suffer with us and for us. And He promises to make all things new.',
      '13-15': 'This is the question of theodicy. The Reformed answer is that God is sovereign over all things, including evil, without being the author of it. He has a good purpose for all He allows, even when we cannot see it. The cross is the proof that God can bring the greatest good out of the greatest evil.',
      '16-17': 'The Reformed tradition teaches that God is sovereign over all things, including evil, without being the author of sin. The cross is the supreme example: the greatest evil in history (the murder of God\'s Son) accomplished the greatest good (the salvation of sinners). This does not answer every specific question, but it grounds our trust in God\'s character and proven faithfulness.',
      '18+': 'The Reformed tradition teaches that God\'s sovereignty extends over all things, including evil, without making Him the author of sin. The cross is the supreme demonstration that God can bring the greatest good out of the greatest evil. We may not have every answer, but we have the character of God revealed at the cross, and the promise that He will make all things new.',
    },
    ask_them: [
      'What is a bad thing that has happened to you or someone you know?',
      'How do you think God feels about bad things?',
      'How does Jesus show us that God is stronger than bad things?',
    ],
    they_may_ask_next: [
      'If God is in charge, why does He not just stop the bad things?',
      'Did God make Satan?',
      'Will bad things always happen?',
    ],
    reformed_foundation: 'The Reformed tradition teaches that God is sovereign over all things, including evil, without being the author of it. The cross demonstrates that God can bring the greatest good out of the greatest evil. The eschatological hope (Revelation 21) guarantees that suffering is temporary and will be ultimately defeated.',
  },
};

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

export async function getChildAskedResponse(
  question: string,
  ageRange: AgeRange,
): Promise<import('./familyTypes').ChildAskedResponse> {
  const lower = question.toLowerCase().trim();

  // Retrieve verified sources from the shared RAG engine
  const retrieval = await retrieveSources(question);
  const ragCitations: Citation[] = retrieval.citations;

  // Find matching demo response
  for (const [key, response] of Object.entries(childAskedResponses)) {
    if (lower.includes(key)) {
      return {
        understand_it_yourself: response.understand_it_yourself,
        open_the_bible_together: response.open_the_bible_together,
        how_to_explain_it: response.how_to_explain_it[ageRange],
        ask_them: response.ask_them,
        they_may_ask_next: response.they_may_ask_next,
        reformed_foundation: response.reformed_foundation,
        sources: ragCitations,
        is_demo: true,
      };
    }
  }

  // Generic fallback
  return {
    understand_it_yourself: 'Development content — SOLAPATH will provide a parent-level explanation of this question once the full intelligence engine is connected. For now, here is how to approach it: listen carefully to your child, affirm the question, and look together at what Scripture says.',
    open_the_bible_together: [
      { reference: 'Psalm 119:33–40', reason: 'A prayer for understanding from God\'s Word.' },
    ],
    how_to_explain_it: 'Development content — SOLAPATH will provide an age-appropriate explanation for this question. For now, read the passage together and discuss what it shows about God and about us.',
    ask_them: [
      'What made you think of this question?',
      'What do you think is the answer?',
      'How can we look at what the Bible says about this together?',
    ],
    they_may_ask_next: [
      'Will you help me find the answer in the Bible?',
      'What if I do not understand the answer?',
    ],
    reformed_foundation: 'Development content — SOLAPATH will connect this question to the Reformed theological framework once the full intelligence engine is available.',
    sources: ragCitations,
    is_demo: true,
  };
}
