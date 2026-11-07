import type { AgeRange } from './familyTypes';

export interface CatechismQuestion {
  number: number;
  question: string;
  answer: string;
  scripture_basis: string;
  explanations: Record<AgeRange, string>;
  discussion_question: string;
  family_application: string;
  prayer: string;
}

export const CATECHISM_AGE_BANDS: Array<{ value: AgeRange; label: string }> = [
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
  { value: '13-15', label: '13–15' },
  { value: '16-17', label: '16–17' },
  { value: '18+', label: 'Adult' },
];

// Original wording: Westminster Shorter Catechism (1647). Questions 1–9.
export const westminsterShorterCatechism: CatechismQuestion[] = [
  {
    number: 1,
    question: 'What is the chief end of man?',
    answer: 'Man\'s chief end is to glorify God, and to enjoy him for ever.',
    scripture_basis: '1 Corinthians 10:31; Psalm 73:25–26',
    explanations: {
      '3-5': 'God made you to know Him, love Him, and be happy with Him. Everything we do can be a way to thank Him.',
      '6-8': 'We were made to bring God glory, which means showing how wonderful He is, and to enjoy Him forever. Loving God is where our deepest happiness comes from.',
      '9-12': 'Our purpose is bigger than school, sports, or getting what we want. God made us to glorify Him by living for Him and to find our deepest joy in knowing Him.',
      '13-15': 'Many things compete for a teenager\'s sense of purpose. The catechism says our highest end is to glorify God and enjoy Him, so God, not success or approval, is the center of a life that makes sense.',
      '16-17': 'Glorifying God and enjoying Him are not two separate goals. Joy in God is part of the purpose, not a reward added after duty.',
      '18+': 'The answer unites glory and enjoyment: God is glorified as His creatures delight in Him. It frames work, vocation, and family under a single end.',
    },
    discussion_question: 'What does it mean to "glorify God" as a family in everyday life?',
    family_application: 'Choose one way your family will glorify God together this week, in how you speak, how you serve, or how you give thanks.',
    prayer: 'Lord, help our family to glorify You in all we do and to find our deepest joy in You. Amen.',
  },
  {
    number: 2,
    question: 'What rule hath God given to direct us how we may glorify and enjoy him?',
    answer: 'The Word of God, which is contained in the Scriptures of the Old and New Testaments, is the only rule to direct us how we may glorify and enjoy him.',
    scripture_basis: '2 Timothy 3:16–17; 1 John 1:3',
    explanations: {
      '3-5': 'The Bible is God\'s special book. It tells us about Him and how to love Him.',
      '6-8': 'God gave us the Bible so we would know what He is like and how to live for Him. It is the one rule we can trust completely.',
      '9-12': 'The Bible is God\'s written Word, given in the Old and New Testaments. It is our guide for knowing God, so we test our thoughts and choices by it.',
      '13-15': 'Scripture is the only rule for knowing and enjoying God. Feelings, culture, and opinions have to be measured by what God has said in the Bible.',
      '16-17': 'Scripture is the rule for faith and life. Reading it honestly, even when it challenges us, is how we learn to glorify God rather than our own preferences.',
      '18+': 'The answer affirms Scripture as God\'s written rule of life. Every area of thought and practice is to be examined under its direction.',
    },
    discussion_question: 'How can our family make Scripture a bigger part of our daily life?',
    family_application: 'Pick a time this week when the family will read Scripture together, even if it is only five minutes.',
    prayer: 'Lord, thank You for Your Word. Help us to read it, trust it, and live by it together. Amen.',
  },
  {
    number: 3,
    question: 'What do the Scriptures principally teach?',
    answer: 'The Scriptures principally teach what man is to believe concerning God, and what duty God requires of man.',
    scripture_basis: '2 Timothy 1:13; Ecclesiastes 12:13',
    explanations: {
      '3-5': 'The Bible teaches us what to believe about God and how God wants us to live.',
      '6-8': 'The Bible teaches two big things: what is true about God, and what God asks us to do. We learn to believe and to obey.',
      '9-12': 'The Bible tells us what to believe about God and what God asks of us. Knowing the truth and living it go together.',
      '13-15': 'Scripture is first about truth: who God is and what He has done. Then it calls for a response. Belief that never changes how we live is not the biblical picture.',
      '16-17': 'Scripture principally teaches doctrine and duty. Keeping both in view protects us from truth without obedience and from obedience without truth.',
      '18+': 'The Scriptures principally teach what we are to believe about God and what duty He requires. Doctrine and duty are distinct but never separated in the believer\'s life.',
    },
    discussion_question: 'What is something new you have learned from the Bible recently about God or about how He calls us to live?',
    family_application: 'As a family, name one belief and one action the Bible teaches. Talk about how to live it out this week.',
    prayer: 'Lord, teach us through Your Word what to believe and how to live. Help our family to follow You in both. Amen.',
  },
  {
    number: 4,
    question: 'What is God?',
    answer: 'God is a Spirit, infinite, eternal, and unchangeable, in his being, wisdom, power, holiness, justice, goodness, and truth.',
    scripture_basis: 'John 4:24; Psalm 139:1–6; Psalm 90:2; James 1:17',
    explanations: {
      '3-5': 'God is a Spirit. He does not have a body like ours, and He is always good, always true, and always with us.',
      '6-8': 'God is a Spirit, which means He does not have a body. He has no beginning and no end, He never changes, and everything about Him is perfect.',
      '9-12': 'God is spirit, without a physical body. He is infinite and eternal, He never changes, and His wisdom, power, holiness, justice, goodness, and truth are all perfect.',
      '13-15': 'The catechism names God\'s attributes: infinite, eternal, unchangeable, wise, powerful, holy, just, good, and true. These describe who God is, not just what He does, so they give us a firm place to stand when life shifts.',
      '16-17': 'The answer ties God\'s being to His attributes. Because He is unchanging in His perfections, His promises can be trusted completely.',
      '18+': 'The answer states the doctrine of God: spirituality, infinity, eternity, immutability, and the moral perfections. These attributes ground confidence in God\'s promises.',
    },
    discussion_question: 'Which of God\'s attributes (wisdom, power, holiness, justice, goodness, truth) means the most to your family right now, and why?',
    family_application: 'As a family, pick one attribute of God to focus on this week. Look for it in Scripture and in your daily life.',
    prayer: 'Lord, You are infinite, eternal, and unchangeable. Help our family to know You better and to trust Your perfect character. Amen.',
  },
  {
    number: 5,
    question: 'Are there more Gods than one?',
    answer: 'There is but one only, the living and true God.',
    scripture_basis: 'Deuteronomy 6:4; Jeremiah 10:10',
    explanations: {
      '3-5': 'There is only one God. He is real, alive, and true.',
      '6-8': 'There is only one God. Other things people worship are not God, but the living God alone is real and alive.',
      '9-12': 'There is only one true God. Our family worships Him alone, not the many idols our culture offers.',
      '13-15': 'There is one living and true God. Many things can take His place in our hearts, from money to approval to entertainment, but none of them are God.',
      '16-17': 'The oneness of God sets the terms for our loyalty. Calling Him the only true God rules out rival gods in every form.',
      '18+': 'The unity of God rules out polytheism and every functional rival. The living and true God is the sole object of worship and trust.',
    },
    discussion_question: 'Why does it matter that there is only one God, not many?',
    family_application: 'Talk as a family about how believing in one God changes how you live, pray, and make decisions.',
    prayer: 'Lord, You alone are God. Help our family to worship You only and to trust You alone. Amen.',
  },
  {
    number: 6,
    question: 'How many persons are there in the Godhead?',
    answer: 'There are three persons in the Godhead; the Father, the Son, and the Holy Ghost; and these three are one God, the same in substance, equal in power and glory.',
    scripture_basis: 'Matthew 28:19; 2 Corinthians 13:14',
    explanations: {
      '3-5': 'God is three persons, the Father, the Son, and the Holy Spirit, and yet there is one God.',
      '6-8': 'God is one God in three persons: the Father, the Son, and the Holy Spirit. Each is fully God, and they are equal in power and glory.',
      '9-12': 'The Father, the Son, and the Holy Spirit are three persons, but they are one God. This is a mystery we cannot fully understand, so we receive it with worship.',
      '13-15': 'The Trinity is a mystery we do not fully grasp. The Father, Son, and Spirit are distinct persons, not three names for one person, and each is fully God.',
      '16-17': 'The doctrine of the Trinity holds the distinction of persons together with the unity of God. Each person is the same in substance and equal in glory.',
      '18+': 'The answer affirms one substance and three persons, equal in power and glory. It guards both the distinction of persons and the unity of the divine being.',
    },
    discussion_question: 'How can God be three persons and still one God, and why does that matter for how we pray?',
    family_application: 'This week, pray to the Father, the Son, and the Holy Spirit, one each day, and name what each one has done for you.',
    prayer: 'Father, Son, and Holy Spirit, one God, we worship You. Help our family to know You truly. Amen.',
  },
  {
    number: 7,
    question: 'What are the decrees of God?',
    answer: 'The decrees of God are, his eternal purpose, according to the counsel of his will, whereby, for his own glory, he hath foreordained whatsoever comes to pass.',
    scripture_basis: 'Ephesians 1:11; Acts 2:23',
    explanations: {
      '3-5': 'God has a plan for everything that happens. Nothing surprises Him.',
      '6-8': 'God planned everything that will happen, and He planned it for His own glory. His plan is wise and good, and nothing happens outside of it.',
      '9-12': 'God has an eternal purpose for all things. Everything that happens is part of His plan, and He planned it for His glory and for the good of His people.',
      '13-15': 'God\'s decrees are His eternal plan, made by His own wise will. This is hard to think about when life hurts, but it means nothing is random and nothing escapes His purpose.',
      '16-17': 'This answer affirms God\'s sovereign decree. His plan is eternal, rooted in His own counsel, and always for His glory. It is a source of comfort, not fatalism.',
      '18+': 'The decrees are God\'s eternal purpose according to the counsel of His will, by which He foreordains whatever comes to pass for His own glory.',
    },
    discussion_question: 'How does knowing that God\'s plan includes hard things change how we respond when something goes wrong?',
    family_application: 'When something hard happens this week, pause as a family and say together that God\'s plan is good and that He is still in control.',
    prayer: 'Lord, You have planned all things for Your glory. Help us trust Your wise plan when we cannot see it. Amen.',
  },
  {
    number: 8,
    question: 'How doth God execute his decrees?',
    answer: 'God executeth his decrees in the works of creation and providence.',
    scripture_basis: 'Psalm 135:6; Psalm 145:9',
    explanations: {
      '3-5': 'God makes His plan happen by creating the world and by taking care of everything in it.',
      '6-8': 'God carries out His plan in two ways. He created everything, and He keeps everything going every day.',
      '9-12': 'God carries out His decrees through creation, when He made the world, and through providence, when He continually cares for and governs everything He made.',
      '13-15': 'God\'s decrees are carried out in creation, which He made at the beginning, and in providence, His ongoing governing of every detail of the world.',
      '16-17': 'Creation and providence are the two works in which God carries out His eternal decree. Providence means God is not distant; He sustains and directs all things.',
      '18+': 'The decrees are executed in creation and providence. Providence is God\'s ongoing preservation and governance of all creatures and their actions, for His glory.',
    },
    discussion_question: 'Where do you see God caring for the world today, in nature, in people, or in everyday events?',
    family_application: 'Go on a family walk this week and name three things that show God\'s care in creation.',
    prayer: 'Lord, You made the world and You keep it every day. Thank You for caring for us. Amen.',
  },
  {
    number: 9,
    question: 'What is the work of creation?',
    answer: 'The work of creation is, God\'s making all things of nothing, by the word of his power, in the space of six days, and all very good.',
    scripture_basis: 'Genesis 1:1–31; Psalm 33:6',
    explanations: {
      '3-5': 'God made everything out of nothing. He spoke, and everything came into being in six days, and all of it was very good.',
      '6-8': 'God made everything from nothing, just by speaking. He did it in six days, and when He finished, everything He made was very good.',
      '9-12': 'God made everything that exists out of nothing, by the power of His word, in six days. Everything He made was good, not something to fear.',
      '13-15': 'God made everything from nothing by His powerful word, in six days, and declared it all very good. That goodness is the starting point for understanding our bodies, the world, and our work.',
      '16-17': 'Creation came from God\'s word alone, out of nothing. The goodness of creation is an important answer to any view that the material world is evil.',
      '18+': 'Creation out of nothing by God\'s creative word, in six days, and pronounced very good. That goodness grounds a Christian view of the body, work, and the material world.',
    },
    discussion_question: 'What does it mean that God called His creation "very good," and how should that shape the way we treat our bodies and the earth?',
    family_application: 'Choose one way to care for God\'s good world this week, such as tidying a shared space or looking after a pet or plant.',
    prayer: 'Lord, You made everything out of nothing and called it good. Help us to see Your goodness in all You have made. Amen.',
  },
];

// Original wording: Heidelberg Catechism (1563), Lord's Day 1 and 2. Questions 1–2 only.
export const heidelbergCatechism: CatechismQuestion[] = [
  {
    number: 1,
    question: 'What is your only comfort in life and in death?',
    answer: 'That I am not my own, but belong\u2014body and soul, in life and in death\u2014to my faithful Saviour Jesus Christ.',
    scripture_basis: 'Romans 14:7–8; 1 Corinthians 6:19–20',
    explanations: {
      '3-5': 'We belong to Jesus. Even when we are scared or sad, we are never alone, because Jesus holds us.',
      '6-8': 'Our greatest comfort is that we belong to Jesus, body and soul, in life and in death. We are not our own; Jesus is our faithful Savior.',
      '9-12': 'Our greatest comfort is not our health, friends, or success. It is that we belong to Jesus, now and forever, and He never lets us go.',
      '13-15': 'When life falls apart, our comfort is not in ourselves. It is in belonging to Jesus Christ, who owns us, saves us, and keeps us whether we live or die.',
      '16-17': 'This question grounds comfort in union with Christ rather than in feelings or circumstances. Belonging to Christ is the comfort that holds in life and in death.',
      '18+': 'The answer grounds comfort in belonging to Christ, body and soul, in life and in death. Assurance flows from His ownership of us, not from our grip on God.',
    },
    discussion_question: 'What does it mean to "belong to Jesus" as a family? How does that change how we face hard things?',
    family_application: 'Talk about a time when knowing you belong to Jesus gave your family comfort. Share it together.',
    prayer: 'Lord, thank You that we belong to You. Help our family to live as people who are loved and held by Jesus. Amen.',
  },
  {
    number: 2,
    question: 'What do you need to know in order to live and die in the joy of this comfort?',
    answer: 'First, how great my sins and misery are; second, how I am delivered from all my sins and misery; third, how I am to be thankful to God for such deliverance.',
    scripture_basis: 'Romans 3:9–10; 1 John 1:10; John 17:3; Acts 4:12; Matthew 5:16',
    explanations: {
      '3-5': 'To live happily with Jesus, we need to know that we have sinned, that Jesus rescues us from sin, and that we should thank God.',
      '6-8': 'There are three things to know: how big our sin is, how Jesus rescues us from it, and how we should thank God for rescuing us.',
      '9-12': 'Three things help us live in this comfort: knowing how serious our sin is, knowing how Jesus delivers us, and thanking God for it.',
      '13-15': 'The catechism gives a three-part structure: honesty about sin and misery, the good news of deliverance in Christ, and a grateful response that shapes daily obedience.',
      '16-17': 'The catechism moves from misery to deliverance to gratitude. Gratitude is not optional; it is the shape the gospel takes in a changed life.',
      '18+': 'The three parts, misery, deliverance, and gratitude, organize the whole catechism. A right knowledge of sin is necessary for a right knowledge of grace.',
    },
    discussion_question: 'Which of the three, sin, deliverance, or thankfulness, does your family need to think about most right now?',
    family_application: 'As a family, share one thing you are thankful to God for this week.',
    prayer: 'Lord, help us to know our need for You, to trust Your deliverance, and to live in gratitude. Amen.',
  },
];
