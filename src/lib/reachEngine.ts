import type {
  TheyAskedMeResponse,
  GospelConversationPrep,
  ApologeticsCategory,
  GospelFoundationLesson,
  EvangelismBibleTrail,
} from './reachTypes';
import { retrieveSources } from './libraryEngine';
import type { Citation } from './libraryTypes';

// ============================================================
// REACH Engine — Demo content for evangelism equipping
// ============================================================

export const spiritualContextOptions: Array<{ id: string; label: string }> = [
  { id: 'doesnt_believe_in_god', label: "Doesn't believe in God" },
  { id: 'agnostic', label: 'Agnostic' },
  { id: 'atheist', label: 'Atheist' },
  { id: 'different_religion', label: 'Different religion' },
  { id: 'grew_up_christian_walked_away', label: 'Grew up Christian but walked away' },
  { id: 'church_hurt', label: 'Church hurt' },
  { id: 'curious_about_christianity', label: 'Curious about Christianity' },
  { id: 'doesnt_want_to_discuss', label: "Doesn't want to discuss religion" },
  { id: 'not_sure', label: "I'm not sure" },
  { id: 'other', label: 'Other' },
];

// ============================================================
// Apologetics Categories
// ============================================================

export const apologeticsCategories: ApologeticsCategory[] = [
  {
    id: 'atheism',
    label: 'Atheism',
    description: 'Conversations about whether God exists.',
    common_objections: [
      "There's no evidence for God.",
      'Science has made God unnecessary.',
      'Religion is just a crutch for weak people.',
    ],
  },
  {
    id: 'agnosticism',
    label: 'Agnosticism',
    description: 'Conversations about whether we can know God.',
    common_objections: [
      "We can't know if God exists.",
      'Nobody can be certain about spiritual things.',
    ],
  },
  {
    id: 'problem_of_evil',
    label: 'Problem of Evil',
    description: 'How could a good God allow suffering?',
    common_objections: [
      'If God is good and powerful, why is there so much suffering?',
      'A loving God would not allow natural disasters.',
    ],
  },
  {
    id: 'reliability_of_scripture',
    label: 'Reliability of Scripture',
    description: 'Can we trust the Bible?',
    common_objections: [
      "The Bible has been copied and changed too many times.",
      'The Bible was written by men, not God.',
      "We can't know what the original texts said.",
    ],
  },
  {
    id: 'resurrection',
    label: 'Resurrection',
    description: 'Did Jesus really rise from the dead?',
    common_objections: [
      'The resurrection is a legend that developed over time.',
      'The disciples stole the body.',
      'People do not come back from the dead.',
    ],
  },
  {
    id: 'science_and_faith',
    label: 'Science & Faith',
    description: 'Do science and Christianity conflict?',
    common_objections: [
      'Evolution disproves Genesis.',
      'Science and faith are incompatible.',
      'Christianity held back scientific progress.',
    ],
  },
  {
    id: 'other_religions',
    label: 'Other Religions',
    description: 'How Christianity relates to other faiths.',
    common_objections: [
      'All religions teach basically the same thing.',
      "How can Christianity be the only way?",
      'What about people who never heard of Jesus?',
    ],
  },
  {
    id: 'sexual_ethics',
    label: 'Sexual Ethics',
    description: 'Christian teaching on sexuality and identity.',
    common_objections: [
      "Christianity is hateful toward LGBTQ people.",
      'The Bible is outdated on sexuality.',
    ],
  },
  {
    id: 'church_hypocrisy',
    label: 'Church Hypocrisy',
    description: 'When Christians fail to live up to their faith.',
    common_objections: [
      'Christians are hypocrites.',
      'The church has caused more harm than good.',
      'I do not need church to be a good person.',
    ],
  },
  {
    id: 'hell',
    label: 'Hell',
    description: "God's justice and the reality of judgment.",
    common_objections: [
      'A loving God would not send anyone to hell.',
      'Eternal punishment is disproportionate.',
      'Hell is a medieval invention to control people.',
    ],
  },
  {
    id: 'exclusivity_of_christ',
    label: 'Exclusivity of Christ',
    description: 'Is Jesus the only way to God?',
    common_objections: [
      'All paths lead to God.',
      "It is arrogant to say Christianity is the only way.",
      'What about sincere followers of other religions?',
    ],
  },
  {
    id: 'morality',
    label: 'Morality',
    description: 'Can we be good without God?',
    common_objections: [
      'I do not need God to be a good person.',
      'Morality is just a social construct.',
      'Religion has caused most wars.',
    ],
  },
  {
    id: 'meaning_and_purpose',
    label: 'Meaning and Purpose',
    description: 'Where meaning comes from without God.',
    common_objections: [
      'Life has no inherent meaning — we create our own.',
      'Religion is a way to avoid facing the void.',
    ],
  },
];

// ============================================================
// Conversation Practice Scenarios
// ============================================================

export interface PracticeScenario {
  id: string;
  label: string;
  description: string;
  objection: string;
  coaching: {
    what_you_addressed_well: string;
    what_you_may_have_missed: string;
    listening: string;
    gospel_connection: string;
    scripture_to_study: string;
    apologetics_resources: string;
  };
}

export const practiceScenarios: PracticeScenario[] = [
  {
    id: 'skeptical_friend',
    label: 'Skeptical Friend',
    description: 'A friend who does not trust the Bible.',
    objection: "I don't believe the Bible is trustworthy. It's been copied and changed too many times. How can you base your life on a book like that?",
    coaching: {
      what_you_addressed_well: 'Look for what you did well: a patient tone, a clear answer, and a question that invited more conversation.',
      what_you_may_have_missed: 'Consider whether you answered the real concern underneath the objection, such as hurt, fear, or a past experience with the Bible or church.',
      listening: 'Did you ask your friend what they mean by "changed"? Differentiating between textual variants and fundamental corruption is important. Did you listen before answering?',
      gospel_connection: 'The reliability of Scripture matters because it is through Scripture that we know Christ. The goal is not winning an argument about manuscripts but pointing to Jesus.',
      scripture_to_study: '2 Timothy 3:16–17; 2 Peter 1:20–21; John 10:35',
      apologetics_resources: 'Ask what kind of evidence would matter to your friend, then read a Gospel account together and talk about what it shows about Jesus.',
    },
  },
  {
    id: 'angry_at_god',
    label: 'Someone Angry at God',
    description: 'A friend who lost a child and is angry at God.',
    objection: 'My daughter died. She was eight years old. And you are telling me God is good? If your God exists, He took my child. I want nothing to do with Him.',
    coaching: {
      what_you_addressed_well: 'Notice whether you stayed with your friend in the loss before you spoke about God.',
      what_you_may_have_missed: 'In situations of profound grief, the primary calling is compassion and presence, not argument. Did you acknowledge the pain before offering any explanation?',
      listening: 'Did you listen more than you spoke? In grief, people need presence, not answers. Did you avoid shallow clichés like "everything happens for a reason"?',
      gospel_connection: 'The Gospel does not promise a pain-free life. It promises a God who entered into suffering in Christ and who promises to make all things new. But this truth must be shared with timing and tenderness.',
      scripture_to_study: 'John 11:33–36 (Jesus wept); Revelation 21:1–4; Lamentations 3:31–33',
      apologetics_resources: 'Read Lamentations 3 or Psalm 77 slowly together and let the honest laments of Scripture give your friend room to grieve.',
    },
  },
  {
    id: 'church_hurt',
    label: 'Church Hurt',
    description: 'Someone who left Christianity after being hurt by a church.',
    objection: 'I grew up in the church. The pastor was controlling and manipulative. The leaders covered up abuse. I do not want anything to do with Christianity anymore.',
    coaching: {
      what_you_addressed_well: 'Notice whether you named the harm plainly rather than defending the institution.',
      what_you_may_have_missed: 'Did you distinguish between the failures of human institutions and the truth of Christ? Did you acknowledge the real harm without dismissing it or defending the institution?',
      listening: 'Did you let them share their experience fully before responding? Church hurt is real and deep. Did you avoid minimizing or defending?',
      gospel_connection: 'Jesus warned about false shepherds and religious hypocrisy (Matthew 23). The church\'s failures do not disprove Christ — they confirm the human sin He came to address. But this must be shared with humility, not defensiveness.',
      scripture_to_study: 'Matthew 23:1–36; 1 Peter 2:21–25; Hebrews 13:7',
      apologetics_resources: 'Ask what healing would look like for your friend, then point to the Lord who binds up the brokenhearted (Psalm 147:3).',
    },
  },
];

// ============================================================
// Gospel Foundations Pathway
// ============================================================

export const gospelFoundations: GospelFoundationLesson[] = [
  { number: 1, title: 'God', passage: 'Psalm 139:1–12; Isaiah 40:25–26', description: 'Who God is — His holiness, sovereignty, and perfection.', key_truth: 'God is the holy, sovereign Creator of all things. He is perfect in justice, love, and power. He is not one option among many — He is the only God.' },
  { number: 2, title: 'Creation', passage: 'Genesis 1:26–27; Psalm 8', description: 'Why humanity exists and our purpose before God.', key_truth: 'God created us in His image to know Him, reflect His character, and live in relationship with Him. We were made for His glory.' },
  { number: 3, title: 'Fall', passage: 'Genesis 3:1–19; Romans 3:23', description: 'Human sin and its consequences.', key_truth: 'Sin is rejecting God\'s rule and choosing our own way. It has corrupted every part of us and separated us from God. We cannot fix ourselves.' },
  { number: 4, title: 'Christ', passage: 'John 1:1–14; Colossians 1:15–20', description: 'The person and work of Jesus.', key_truth: 'Jesus is fully God and fully man. He is the only one who could represent God to us and us to God. He lived the life we should have lived.' },
  { number: 5, title: 'Cross', passage: 'Isaiah 53:4–6; 2 Corinthians 5:21', description: 'The atonement — why Jesus had to die.', key_truth: 'On the cross, Jesus bore the wrath of God in our place. He paid the debt we could not pay so we could be forgiven. Justice and mercy meet at the cross.' },
  { number: 6, title: 'Resurrection', passage: '1 Corinthians 15:1–22', description: "Christ's victory over death.", key_truth: 'Jesus rose from the dead, proving His victory over sin and death. His resurrection is the guarantee of our future resurrection.' },
  { number: 7, title: 'Grace', passage: 'Ephesians 2:8–9; Titus 3:4–7', description: 'Salvation as God\'s free gift.', key_truth: 'Salvation is entirely God\'s gift. We do not earn it, deserve it, or contribute to it. Grace means God gives us what we could never achieve.' },
  { number: 8, title: 'Repentance', passage: 'Acts 2:38; 1 John 1:8–9', description: 'Turning from sin to Christ.', key_truth: 'Repentance is not just feeling sorry — it is turning. It means acknowledging our sin before God and turning to Christ as our only hope.' },
  { number: 9, title: 'Faith', passage: 'Romans 4:1–5; Galatians 2:15–16', description: 'Trusting in Christ alone.', key_truth: 'Faith is not trying harder or being a better person. It is trusting that what Christ has done is sufficient — resting in His finished work, not our own.' },
  { number: 10, title: 'New Life', passage: '2 Corinthians 5:17; Romans 6:1–4', description: 'Following Christ in everyday life.', key_truth: 'Salvation is not just a ticket to heaven — it is a new life. We are new creations, called to live for Christ in every area of life.' },
];

// ============================================================
// Evangelism Bible Trails
// ============================================================

export const evangelismBibleTrails: EvangelismBibleTrail[] = [
  {
    id: 'what_is_the_gospel',
    title: 'What Is the Gospel?',
    description: 'Trace the Gospel through Paul\'s letter to the Romans.',
    passages: [
      { reference: 'Romans 1', reading_objective: 'Read about the righteousness of God revealed in the Gospel and the universal need for it.' },
      { reference: 'Romans 3', reading_objective: 'Read about how all have sinned and how God justifies through Christ.' },
      { reference: 'Romans 5', reading_objective: 'Read about peace with God through Christ and the free gift of grace.' },
      { reference: 'Romans 6', reading_objective: 'Read about dying to sin and being alive to God in Christ.' },
      { reference: 'Romans 8', reading_objective: 'Read about life in the Spirit and the security of God\'s love.' },
      { reference: 'Romans 10', reading_objective: 'Read about calling on the Lord and the necessity of hearing the Gospel.' },
    ],
  },
  {
    id: 'who_is_jesus',
    title: 'Who Is Jesus?',
    description: 'Discover who Jesus is through John\'s Gospel.',
    passages: [
      { reference: 'John 1', reading_objective: 'Read the prologue — the Word who was God and became flesh.' },
      { reference: 'John 3', reading_objective: 'Read about new birth and God\'s love for the world.' },
      { reference: 'John 8', reading_objective: 'Read about Jesus as the light of the world and the truth that sets free.' },
      { reference: 'John 10', reading_objective: 'Read about the Good Shepherd who lays down His life for the sheep.' },
      { reference: 'John 14', reading_objective: 'Read about Jesus as the way, the truth, and the life.' },
      { reference: 'John 20', reading_objective: 'Read about the resurrection and the purpose of John\'s Gospel.' },
    ],
  },
  {
    id: 'why_the_cross',
    title: 'Why the Cross?',
    description: 'Understand the meaning of Christ\'s death.',
    passages: [
      { reference: 'Isaiah 53', reading_objective: 'Read the prophetic description of the suffering servant.' },
      { reference: 'Mark 10', reading_objective: 'Read about the Son of Man who came to give His life as a ransom.' },
      { reference: 'Romans 3', reading_objective: 'Read about God presenting Christ as a propitiation by His blood.' },
      { reference: '2 Corinthians 5', reading_objective: 'Read about God making Christ to be sin for us.' },
      { reference: '1 Peter 2', reading_objective: 'Read about Christ bearing our sins in His body on the tree.' },
    ],
  },
  {
    id: 'grace',
    title: 'Grace',
    description: 'Explore the free gift of salvation.',
    passages: [
      { reference: 'Ephesians 2', reading_objective: 'Read about being saved by grace through faith, not of works.' },
      { reference: 'Titus 3', reading_objective: 'Read about the kindness and love of God appearing and saving us.' },
      { reference: 'Romans 4', reading_objective: 'Read about Abraham being justified by faith apart from works.' },
      { reference: 'Galatians 2', reading_objective: 'Read about being justified by faith in Christ, not by works of the law.' },
    ],
  },
];

// ============================================================
// "They Asked Me..." Demo Responses
// ============================================================

const theyAskedMeResponses: Record<string, Omit<TheyAskedMeResponse, 'is_demo'>> = {
  'why would a loving god send anyone to hell': {
    understand_the_question: 'This question often comes from a genuine sense of justice — how could eternal punishment be fair? It may also come from a misunderstanding of what hell is. Some people imagine hell as a place where God tortures people for fun. Others assume God "sends" people there against their will. The real question behind the question is often: "Is God just, and does He take evil seriously?"',
    understand_it_yourself: 'Hell is not God being cruel. It is God giving people what they have chosen — existence without Him. God respects human choice. He does not force anyone into His presence who has spent their life rejecting Him. But existence without God is not freedom — it is the absence of every good thing. Hell is also the place where God\'s justice is finally satisfied. If God simply forgave everyone without dealing with evil, He would not be just. The cross is where God\'s justice and mercy meet: Christ bore the punishment so that anyone who turns to Him can be forgiven.',
    open_your_bible: [
      { reference: 'Romans 2:4–11', reason: 'Shows that God\'s judgment is according to what people have done and that He shows no partiality.' },
      { reference: '2 Thessalonians 1:5–10', reason: 'Describes hell as separation from the presence of the Lord.' },
      { reference: 'Matthew 23:37', reason: 'Shows Jesus\' heart: He longed to gather people, but they were not willing.' },
    ],
    how_you_could_respond: 'You could say: "That is a really important question. I think the key is understanding that God does not force people into hell who want to be with Him. Hell is what it looks like to say to God, \'I do not want You or Your rule in my life\' — and God respecting that choice. But the amazing thing is that God went to extraordinary lengths to provide a way back. Jesus took the punishment we deserved so that anyone who turns to Him can be forgiven. God is not looking for reasons to send people to hell — He is looking for reasons to save them."',
    questions_to_ask_them: [
      'What do you think hell should look like if God is just?',
      'Do you think it would be loving for God to force people into His presence if they spent their life saying they did not want Him?',
      'What would you say to someone who said God should just forgive everyone without dealing with evil?',
    ],
    they_may_ask_next: [
      'But what about people who never heard of Jesus?',
      'Is not eternal punishment disproportionate to a finite life of sin?',
      'If God is sovereign, does not that mean He chooses who goes to hell?',
    ],
    biblical_foundation: 'Scripture teaches that God is perfectly just and that judgment for sin is real. No one is treated unfairly. The wonder is not that God would be right to condemn anyone, but that He saves those who trust Christ. Because God\'s grace is sovereign, salvation is entirely a gift, so those who are saved have nothing to boast about. The cross shows that God does not take evil lightly; He dealt with it fully in Christ.',
    other_christian_views: 'Christians differ on how to explain why some are saved and others are not. Some emphasize human free will; others emphasize God\'s sovereign decree. Both agree that hell is real, just, and avoidable through Christ.',
    sources: [],
  },
  'why does god allow suffering': {
    understand_the_question: 'This question usually comes from real pain, not abstract curiosity. Someone is hurting or has watched someone they love suffer. The question is deeply personal: "If God is good and powerful, why did He let this happen?" Before answering, it is essential to acknowledge the pain. Turning suffering into an apologetics debate too quickly can wound someone who is already wounded.',
    understand_it_yourself: 'God did not create the world with suffering in it. Suffering entered through the Fall — human rebellion against God\'s rule. But God is sovereign over suffering, and He promises to work all things for good for those who love Him. The cross is the supreme proof that God can bring the greatest good out of the greatest evil. We may not have every answer for why specific suffering happens, but we know God\'s character, His cross, and His promise to make all things new.',
    open_your_bible: [
      { reference: 'Romans 8:18–28', reason: 'Shows that present suffering is not worth comparing with future glory and that God works all things for good.' },
      { reference: 'Genesis 50:20', reason: 'Joseph: "You meant evil against me, but God meant it for good."' },
      { reference: '2 Corinthians 4:16–18', reason: 'Paul describes momentary affliction producing eternal glory.' },
    ],
    how_you_could_respond: 'You could say: "I do not have a complete answer for why God allows every specific suffering. But I know this: God did not stay distant from suffering — He entered it. Jesus suffered more than any of us ever will. And He promises that one day He will wipe away every tear and make all things new. I cannot explain everything, but I trust the God who went through suffering for me."',
    questions_to_ask_them: [
      'Can you tell me more about what you are going through?',
      'What would it look like if God removed all suffering — would that mean removing all human freedom too?',
      'Have you seen God bring anything good out of a hard situation in your life?',
    ],
    they_may_ask_next: [
      'But why did God create a world where suffering was possible?',
      'Why does not God just stop it now?',
      'How can you trust a God who allows children to suffer?',
    ],
    biblical_foundation: 'Scripture teaches that God is sovereign over all things, including suffering, without being the author of sin. He has a good purpose for all He allows. The cross is the supreme example: the greatest evil accomplished the greatest good (Acts 2:23; Genesis 50:20). We may not understand every instance of suffering, but we trust the character of God revealed at the cross.',
    other_christian_views: 'Christians differ on how God\'s sovereignty and human choices fit together. Some emphasize human free will as the main explanation for suffering. Scripture affirms both God\'s control and human responsibility. All agree that God is good, that suffering is real, and that God will ultimately defeat it.',
    sources: [],
  },
  'how do we know the bible is true': {
    understand_the_question: 'This question may come from genuine curiosity or from skepticism about whether the Bible is reliable. It may involve concerns about textual transmission, authorship, or whether the Bible is just a human book. The key is to distinguish between "can we trust the text?" and "is the text from God?" — both are important but different questions.',
    understand_it_yourself: 'We trust the Bible because God speaks through it. The Bible is not just a human book about God — it is God\'s Word given through human authors. Jesus treated Scripture as authoritative and reliable. The historical evidence for the Bible\'s transmission is strong — we have more and earlier manuscripts than any other ancient text. But ultimately, the authority of Scripture rests on God Himself speaking, confirmed by the witness of the Holy Spirit.',
    open_your_bible: [
      { reference: '2 Timothy 3:16–17', reason: 'All Scripture is breathed out by God.' },
      { reference: '2 Peter 1:20–21', reason: 'Prophecy was produced by men carried along by the Holy Spirit.' },
      { reference: 'John 10:35', reason: 'Jesus treated Scripture as God\'s unbreakable Word.' },
    ],
    how_you_could_respond: 'You could say: "That is a fair question. The Bible has more historical evidence supporting its transmission than any other ancient text — we have thousands of manuscripts. But the main reason I trust it is that Jesus trusted it. He treated the Old Testament as God\'s Word, and He rose from the dead — which gives Him unique authority to speak on the subject. I trust the Bible because I trust Him."',
    questions_to_ask_them: [
      'What have you heard about the Bible that makes you question it?',
      'Have you ever read any of it yourself, or is your impression mostly from what others have said?',
      'What standard would you use to decide whether a book is trustworthy?',
    ],
    they_may_ask_next: [
      'But what about all the contradictions people say are in the Bible?',
      'Was not the Bible compiled by a church council with political motives?',
      'What about the books that were left out?',
    ],
    biblical_foundation: 'Scripture is God\'s own Word, and its authority does not depend on the church, human reason, or historical evidence, though these can support it. Its ultimate ground is God speaking, and the Holy Spirit confirms this to the believer (2 Timothy 3:16; 2 Peter 1:20\u201321).',
    other_christian_views: 'Roman Catholic theology emphasizes the church\'s role in recognizing Scripture, while many Protestants emphasize Scripture\'s own authority as God\'s Word. Both agree that Scripture is God\'s Word.',
    sources: [],
  },
  'why did jesus have to die': {
    understand_the_question: 'This question may come from someone who sees the cross as unnecessary — could not God just forgive? Or it may come from someone who finds the idea of a loving Father punishing His Son disturbing. The question behind the question is: "Does sin really require death? And if so, is that just?"',
    understand_it_yourself: 'Jesus died because sin has a real cost. God is holy and just, and sin cannot simply be ignored. But God is also full of mercy. In His love, He sent His own Son to bear the punishment our sins deserved so that we could be forgiven and brought near to God. The cross is where God\'s justice and love meet perfectly. God did not punish Jesus reluctantly — Jesus willingly laid down His life. And the Father and Son acted together in love for us.',
    open_your_bible: [
      { reference: 'Romans 3:21–26', reason: 'Shows God as both just and the justifier through Christ.' },
      { reference: 'Isaiah 53:4–6', reason: 'The suffering servant bore our iniquities.' },
      { reference: '2 Corinthians 5:21', reason: 'Christ became sin for us so we could become God\'s righteousness.' },
    ],
    how_you_could_respond: 'You could say: "That is a great question. The short answer is that God is just — He cannot just sweep evil under the rug. But He is also loving — He did not want us to bear the cost ourselves. So He found a way to do both: Jesus, who is God the Son, took the cost on Himself. The cross is not God punishing an innocent third party — it is God Himself absorbing the cost of our sin so we could go free."',
    questions_to_ask_them: [
      'What do you think sin costs? Is it a big deal or a small deal?',
      'If God just forgave everyone without dealing with evil, would that be just?',
      'What would you think of a judge who let criminals go free without any consequence?',
    ],
    they_may_ask_next: [
      'Is not that divine child abuse — the Father punishing the Son?',
      'Could not God have found another way?',
      'What about people who lived before Jesus?',
    ],
    biblical_foundation: 'Scripture teaches that Christ bore the wrath of God in our place. This is a real and relational reality, not a metaphor. The cross satisfies God\'s justice, so that our justification rests not on leniency but on real payment (Romans 3:25\u201326; Isaiah 53:5).',
    other_christian_views: 'Some Christians emphasize Christ defeating the powers of evil (Christus Victor) or the moral example of Christ\'s love. Many affirm these as true and see Christ bearing our judgment as the center of the cross\'s saving work.',
    sources: [],
  },
  'all religions teach basically the same thing': {
    understand_the_question: 'This objection assumes all religions are different paths up the same mountain. It may come from a desire for tolerance or from a surface-level comparison of religions. The key is to show that religions make very different and often contradictory claims about God, humanity, salvation, and the nature of reality.',
    understand_it_yourself: 'Religions do not teach basically the same thing. Islam denies that God has a Son. Christianity says Jesus is God\'s Son. Buddhism does not even posit a personal God. Hinduism embraces many paths. These are not minor variations — they are fundamentally different claims about reality. The question is not which religion is "nicest" but which is true. Christianity is unique in teaching that God came to us, not that we climb to Him.',
    open_your_bible: [
      { reference: 'John 14:6', reason: 'Jesus says He is the way, the truth, and the life.' },
      { reference: 'Acts 4:10–12', reason: 'Peter says salvation is found in no one else but Jesus.' },
      { reference: '1 Corinthians 15:1–8', reason: 'Paul grounds the Gospel in specific historical events.' },
    ],
    how_you_could_respond: 'You could say: "I understand why people say that — it feels tolerant. But if you actually look at what different religions teach, they make very different claims about who God is, who we are, and how we are saved. They cannot all be true because they contradict each other. The real question is: which one is true? And Christianity is unique because it says God came to us in Christ, rather than telling us to climb to God by our own effort."',
    questions_to_ask_them: [
      'What do you think the different religions have in common?',
      'Have you looked at what different religions actually teach, or is this based on a general impression?',
      'If religions make contradictory claims, could they all be true?',
    ],
    they_may_ask_next: [
      'But what about people who are sincere in their religion?',
      'Is not it arrogant to say Christianity is the only way?',
      'What about people who never heard of Jesus?',
    ],
    biblical_foundation: 'Scripture teaches that salvation is through Christ alone. This is not arrogance; it is the claim that God has acted in history to save us in a way we could not achieve ourselves (John 14:6; Acts 4:12). The exclusivity of Christ is a claim about what God has done, not about our superiority.',
    other_christian_views: 'Some modern views propose inclusivism (Christ is present in other religions) or pluralism (all religions are valid paths). Christians who take Scripture as authoritative hold that there is no other name under heaven by which we must be saved.',
    sources: [],
  },
};


const theyAskedMeResponsesEs: Record<string, Omit<TheyAskedMeResponse, 'is_demo'>> = {
  'why would a loving god send anyone to hell': {
    understand_the_question: 'Esta pregunta suele surgir de un verdadero sentido de justicia: ¿cómo podría ser justo un castigo eterno? También puede venir de una idea equivocada de lo que es el infierno. La pregunta de fondo suele ser: «¿Es Dios justo y toma el mal en serio?»',
    understand_it_yourself: 'La Biblia presenta a Dios como perfectamente santo, justo y misericordioso. El pecado es real y el juicio también, pero la cruz muestra que Dios mismo proveyó en Cristo el camino de perdón. No debemos hablar del infierno con ligereza ni como si nosotros fuéramos moralmente superiores; nuestra esperanza descansa únicamente en la gracia de Dios en Cristo.',
    open_your_bible: [
      { reference: 'Romanos 2:4–11', reason: 'Muestra la justicia e imparcialidad del juicio de Dios.' },
      { reference: '2 Tesalonicenses 1:5–10', reason: 'Habla del juicio y de estar apartado de la presencia del Señor.' },
      { reference: 'Mateo 23:37', reason: 'Muestra el corazón de Jesús al llamar a personas que no quisieron venir.' },
    ],
    how_you_could_respond: 'Podrías decir: «Esa es una pregunta muy importante. La Biblia no presenta a Dios como cruel, sino como santo y justo. También muestra algo asombroso: Dios no se mantuvo distante de nuestro problema, sino que en Cristo cargó con el juicio que merecemos para ofrecer perdón a todo el que confía en Él. Por eso hablar del infierno también debe llevarnos a hablar de la gracia y de la cruz».',
    questions_to_ask_them: [
      '¿Qué parte de la idea del infierno te resulta más difícil?',
      '¿Cómo crees que un Dios perfectamente justo debería responder al mal?',
      '¿Has pensado en lo que la cruz dice acerca de la justicia y la misericordia de Dios?',
    ],
    they_may_ask_next: [
      '¿Qué pasa con las personas que nunca han oído de Jesús?',
      '¿No es desproporcionado un castigo eterno por una vida finita?',
      'Si Dios es soberano, ¿cómo encaja eso con la responsabilidad humana?',
    ],
    biblical_foundation: 'La Escritura enseña que Dios es perfectamente justo, que el pecado merece juicio y que la salvación es un regalo de gracia en Cristo. La cruz muestra que Dios no ignora el mal: lo enfrenta plenamente mientras salva a pecadores que no pueden salvarse a sí mismos.',
    other_christian_views: 'Los cristianos difieren en cómo explican la relación entre la soberanía de Dios y la responsabilidad humana. Sin embargo, el cristianismo histórico afirma la realidad del juicio, la necesidad de la gracia y que la salvación se encuentra en Cristo.',
    sources: [],
  },
  'why does god allow suffering': {
    understand_the_question: 'Esta pregunta suele venir del dolor real, no de una curiosidad abstracta. Antes de responder, conviene escuchar qué ha vivido la persona y reconocer el peso de su sufrimiento. Convertir demasiado rápido el dolor en un debate puede herir a alguien que ya está herido.',
    understand_it_yourself: 'La Biblia enseña que el sufrimiento forma parte de un mundo caído y, al mismo tiempo, que Dios sigue siendo soberano y bueno. No siempre sabemos por qué permite un sufrimiento específico. Sí sabemos que Dios entró en nuestro sufrimiento en Cristo, que puede obrar aun en medio del mal y que promete hacer nuevas todas las cosas.',
    open_your_bible: [
      { reference: 'Romanos 8:18–28', reason: 'Sitúa el sufrimiento presente a la luz de la gloria futura y de la providencia de Dios.' },
      { reference: 'Génesis 50:20', reason: 'Muestra que Dios puede obrar para bien aun a través del mal que otros intentan.' },
      { reference: '2 Corintios 4:16–18', reason: 'Pablo mira la aflicción presente a la luz de la gloria eterna.' },
    ],
    how_you_could_respond: 'Podrías decir: «No tengo una explicación completa de por qué Dios permite cada sufrimiento particular. Pero sé que Dios no permaneció lejos del sufrimiento: Jesús entró en él. La cruz me muestra su amor, y la resurrección me da esperanza de que el sufrimiento no tendrá la última palabra».',
    questions_to_ask_them: [
      '¿Quieres contarme un poco más de lo que estás viviendo?',
      '¿Qué parte de esto ha sido la más difícil para ti?',
      '¿Cómo ha afectado esto tu manera de ver a Dios?',
    ],
    they_may_ask_next: [
      '¿Por qué creó Dios un mundo donde el sufrimiento era posible?',
      '¿Por qué Dios no lo detiene ahora mismo?',
      '¿Cómo se puede confiar en Dios cuando sufren los niños?',
    ],
    biblical_foundation: 'La Escritura afirma la bondad y soberanía de Dios sin presentar a Dios como autor del pecado. La cruz es el ejemplo supremo de cómo el mayor mal cometido por seres humanos fue usado por Dios para realizar el mayor bien.',
    other_christian_views: 'Los cristianos expresan de distintas maneras cómo encajan la soberanía divina y las decisiones humanas. Todos deben evitar respuestas simplistas al sufrimiento y mantener juntos la bondad de Dios, la realidad del mal y la esperanza final de la resurrección.',
    sources: [],
  },
  'how do we know the bible is true': {
    understand_the_question: 'La persona puede estar preguntando si el texto bíblico fue transmitido de manera confiable, si sus autores son dignos de confianza o si realmente procede de Dios. Es útil distinguir esas preguntas en vez de responderlas como si fueran una sola.',
    understand_it_yourself: 'Los cristianos reciben la Escritura como Palabra de Dios dada por medio de autores humanos. Jesús trató la Escritura como autoritativa. La evidencia histórica y textual puede responder preguntas importantes sobre transmisión y confiabilidad, pero la autoridad última de la Escritura descansa en Dios que habla por medio de ella.',
    open_your_bible: [
      { reference: '2 Timoteo 3:16–17', reason: 'Afirma que toda la Escritura es inspirada por Dios.' },
      { reference: '2 Pedro 1:20–21', reason: 'Describe a hombres hablando de parte de Dios guiados por el Espíritu Santo.' },
      { reference: 'Juan 10:35', reason: 'Muestra cómo Jesús trató la Escritura como palabra autoritativa.' },
    ],
    how_you_could_respond: 'Podrías decir: «Es una pregunta justa. Podemos examinar históricamente cómo se transmitió la Biblia y si tenemos buenas razones para confiar en su texto. Pero para mí la pregunta central también es Jesús: Él recibió la Escritura como Palabra de Dios, y su muerte y resurrección son centrales para saber por qué tomo en serio su autoridad».',
    questions_to_ask_them: [
      '¿Qué has oído acerca de la Biblia que te hace dudar de ella?',
      '¿Tu pregunta principal es sobre cómo se transmitió el texto o sobre si viene de Dios?',
      '¿Qué tipo de evidencia considerarías suficiente para tomarla en serio?',
    ],
    they_may_ask_next: [
      '¿Qué pasa con las supuestas contradicciones de la Biblia?',
      '¿No decidió un concilio qué libros incluir?',
      '¿Qué pasa con los libros que no quedaron en el canon?',
    ],
    biblical_foundation: 'La Escritura se presenta como Palabra de Dios y como producto de autores humanos guiados por el Espíritu Santo. Su autoridad no nace de que la iglesia se la conceda, aunque la iglesia reconoce y recibe los libros que Dios dio.',
    other_christian_views: 'Las tradiciones cristianas describen de distintas maneras el papel de la iglesia al reconocer el canon. Comparten, sin embargo, la convicción de que la Escritura ocupa un lugar normativo en la fe cristiana.',
    sources: [],
  },
  'why did jesus have to die': {
    understand_the_question: 'La pregunta puede ser por qué Dios no podía simplemente perdonar, o puede expresar incomodidad con la idea del Padre y el Hijo en la cruz. Conviene aclarar que la cruz no presenta a un tercero inocente obligado contra su voluntad, sino al Dios trino obrando para salvar.',
    understand_it_yourself: 'El pecado tiene una culpa real ante un Dios santo. En la cruz, la justicia y el amor de Dios no compiten: Cristo, voluntariamente, lleva el juicio que merece su pueblo para reconciliarnos con Dios. El Padre envía al Hijo en amor y el Hijo entrega su vida voluntariamente.',
    open_your_bible: [
      { reference: 'Romanos 3:21–26', reason: 'Muestra a Dios como justo y como quien justifica por medio de Cristo.' },
      { reference: 'Isaías 53:4–6', reason: 'Describe al Siervo sufriente llevando nuestras iniquidades.' },
      { reference: '2 Corintios 5:21', reason: 'Muestra la obra sustitutiva de Cristo a favor de pecadores.' },
    ],
    how_you_could_respond: 'Podrías decir: «Dios no simplemente ignora el mal. En Jesús, Dios mismo asumió el costo de nuestra reconciliación. La cruz no es el Padre castigando a un tercero indefenso; es el Hijo entregándose voluntariamente, en unidad con el Padre, para que pecadores puedan ser perdonados sin que la justicia de Dios sea descartada».',
    questions_to_ask_them: [
      '¿Qué piensas que debería hacer un Dios perfectamente justo con el mal?',
      '¿Qué te resulta más difícil de entender acerca de la cruz?',
      '¿Cómo cambia la pregunta si Jesús entrega su vida voluntariamente?',
    ],
    they_may_ask_next: [
      '¿No es esto abuso del Padre contra el Hijo?',
      '¿No podía Dios salvar de otra manera?',
      '¿Qué pasó con quienes vivieron antes de Jesús?',
    ],
    biblical_foundation: 'La Escritura presenta a Cristo llevando nuestro juicio y reconciliándonos con Dios. Su muerte no es un accidente ni la acción de un Padre contra un Hijo reacio, sino la obra salvadora del Dios trino.',
    other_christian_views: 'Los cristianos también hablan de la cruz como victoria sobre el pecado y los poderes del mal, como demostración del amor de Dios y como ejemplo de obediencia. Estas dimensiones no tienen que excluir la obra sustitutiva de Cristo.',
    sources: [],
  },
  'all religions teach basically the same thing': {
    understand_the_question: 'Esta afirmación puede surgir del deseo de ser tolerante o de una comparación muy general entre religiones. Es útil mostrar con respeto que las religiones hacen afirmaciones distintas —y a veces incompatibles— sobre Dios, la humanidad, la salvación y la realidad.',
    understand_it_yourself: 'Las religiones no enseñan exactamente lo mismo. Por ejemplo, el cristianismo confiesa al Dios trino y que Jesucristo es verdaderamente Dios y hombre; otras religiones niegan esas afirmaciones. La pregunta importante no es cuál tradición parece más agradable, sino cuáles afirmaciones son verdaderas.',
    open_your_bible: [
      { reference: 'Juan 14:6', reason: 'Jesús se identifica como el camino, la verdad y la vida.' },
      { reference: 'Hechos 4:10–12', reason: 'Pedro proclama la salvación en Jesucristo.' },
      { reference: '1 Corintios 15:1–8', reason: 'Pablo fundamenta el evangelio en acontecimientos históricos concretos.' },
    ],
    how_you_could_respond: 'Podrías decir: «Entiendo por qué esa idea parece respetuosa. Pero cuando miramos lo que las religiones realmente enseñan, encontramos afirmaciones muy diferentes acerca de Dios, Jesús y la salvación. No pueden ser verdaderas en el mismo sentido cuando se contradicen. Entonces la pregunta pasa a ser: ¿qué es verdadero y qué razones tenemos para creerlo?»',
    questions_to_ask_them: [
      '¿Qué enseñanzas crees que tienen en común las religiones?',
      '¿Has comparado lo que realmente afirman acerca de Dios y la salvación?',
      'Si dos religiones hacen afirmaciones contradictorias, ¿pueden ambas ser verdaderas en el mismo sentido?',
    ],
    they_may_ask_next: [
      '¿Qué pasa con alguien que es sincero en otra religión?',
      '¿No es arrogante decir que Cristo es el único camino?',
      '¿Qué pasa con quienes nunca han oído de Jesús?',
    ],
    biblical_foundation: 'La Escritura presenta la salvación como obra de Dios en Cristo. La exclusividad de Cristo no es una afirmación de superioridad personal del cristiano, sino una afirmación acerca de quién es Jesús y lo que Dios ha hecho por medio de Él.',
    other_christian_views: 'Algunas corrientes modernas proponen inclusivismo o pluralismo religioso. El cristianismo histórico, sin embargo, ha confesado de manera central que la salvación está unida a Jesucristo.',
    sources: [],
  },
};

const spanishTheyAskedAliases: Record<string, string> = {
  'dios amoroso': 'why would a loving god send anyone to hell',
  'mandaría al infierno': 'why would a loving god send anyone to hell',
  'enviar al infierno': 'why would a loving god send anyone to hell',
  'permite el sufrimiento': 'why does god allow suffering',
  'por qué sufrimos': 'why does god allow suffering',
  'biblia es verdadera': 'how do we know the bible is true',
  'confiar en la biblia': 'how do we know the bible is true',
  'jesús tuvo que morir': 'why did jesus have to die',
  'jesus tuvo que morir': 'why did jesus have to die',
  'religiones enseñan lo mismo': 'all religions teach basically the same thing',
  'todas las religiones': 'all religions teach basically the same thing',
};

export async function getTheyAskedMeResponse(question: string, language: 'en' | 'es' = 'en'): Promise<TheyAskedMeResponse> {
  const lower = question.toLowerCase().trim();

  // Retrieve verified sources from the shared RAG engine
  const retrieval = await retrieveSources(question);
  const ragCitations: Citation[] = retrieval.citations;

  let matchedKey: string | null = null;
  for (const key of Object.keys(theyAskedMeResponses)) {
    if (lower.includes(key)) {
      matchedKey = key;
      break;
    }
  }
  if (!matchedKey && language === 'es') {
    for (const [alias, key] of Object.entries(spanishTheyAskedAliases)) {
      if (lower.includes(alias)) {
        matchedKey = key;
        break;
      }
    }
  }
  if (matchedKey) {
    const response = language === 'es'
      ? theyAskedMeResponsesEs[matchedKey] ?? theyAskedMeResponses[matchedKey]
      : theyAskedMeResponses[matchedKey];
    return { ...response, sources: ragCitations, is_demo: true };
  }

  if (language === 'es') {
    return {
      understand_the_question: 'Escucha con cuidado lo que la persona realmente está preguntando. Puede haber una pregunta intelectual, emocional o relacional detrás de sus palabras. Entender eso cambia la manera de responder.',
      understand_it_yourself: 'Lee los pasajes relevantes y piensa primero en lo que la Escritura realmente enseña antes de intentar responder.',
      open_your_bible: [
        { reference: '1 Pedro 3:15', reason: 'Llama a estar preparados para responder con mansedumbre y reverencia acerca de nuestra esperanza.' },
        { reference: 'Colosenses 4:5–6', reason: 'Llama a andar con sabiduría y a hablar con gracia.' },
      ],
      how_you_could_respond: 'Escucha primero, reconoce con respeto lo que la persona está diciendo y dirige la conversación hacia Cristo sin convertirla en una competencia.',
      questions_to_ask_them: [
        '¿Puedes contarme un poco más de lo que te lleva a preguntar eso?',
        '¿Qué piensas tú acerca de este tema?',
        '¿Hubo alguna experiencia que influyó en tu manera de verlo?',
      ],
      they_may_ask_next: [
        '¿Cómo sabes que tu punto de vista es correcto?',
        '¿Qué pasa con las personas que no están de acuerdo?',
      ],
      biblical_foundation: 'La Escritura debe gobernar nuestra respuesta. Lee los pasajes relevantes en su contexto y observa lo que Dios revela acerca de sí mismo, del ser humano y de lo que llama a creer y hacer.',
      other_christian_views: null,
      sources: ragCitations,
      is_demo: true,
    };
  }

  return {
    understand_the_question: 'Listen carefully to what they are really asking. Is it intellectual? Emotional? Relational? The answer to that question shapes how you respond.',
    understand_it_yourself: 'Read the relevant passages and think through what Scripture actually says before responding.',
    open_your_bible: [
      { reference: '1 Peter 3:15', reason: 'Be prepared to make a defense to anyone who asks you for a reason for the hope that is in you.' },
      { reference: 'Colossians 4:5–6', reason: 'Walk in wisdom toward outsiders, letting your speech be gracious.' },
    ],
    how_you_could_respond: 'Listen first, acknowledge what they are saying, and gently point to Christ.',
    questions_to_ask_them: [
      'Can you tell me more about what makes you ask that?',
      'What is your own thinking on it?',
      'Have you had an experience that shaped your view on this?',
    ],
    they_may_ask_next: [
      'But how do you know your view is right?',
      'What about people who disagree?',
    ],
    biblical_foundation: 'Scripture speaks to this question directly. Read the passages together and notice what God reveals about Himself and what He calls His people to believe and do.',
    other_christian_views: null,
    sources: ragCitations,
    is_demo: true,
  };
}

// ============================================================
// Gospel Conversation Prep
// ============================================================

export function getGospelConversationPrep(situation: string): GospelConversationPrep {
  const lower = situation.toLowerCase();

  if (lower.includes('hell') || lower.includes('loving god')) {
    return {
      pray_first: 'Before the conversation, pray for your friend. Pray that God would give you compassion, wisdom, and the right words. Pray that the Holy Spirit would be at work in their heart.',
      listen: 'Listen for the real question behind the objection. Is it about justice? Fairness? A personal experience of loss? Do not rush to give answers. Let them speak fully first.',
      questions_worth_asking: [
        'What do you think hell should look like if God is just?',
        'Do you think it would be loving for God to force people into His presence if they do not want Him?',
        'What would you say to someone who said God should just forgive everyone without dealing with evil?',
      ],
      gospel_connection: 'The Gospel is not "believe or God will punish you." The Gospel is "God has already taken the punishment on Himself in Christ so that anyone who turns to Him can be forgiven." Hell is real, but the good news is that Christ has made a way out.',
      scripture_to_know: [
        { reference: 'Romans 2:4–11', reason: 'Shows God\'s just judgment and patience.' },
        { reference: '2 Peter 3:9', reason: 'Shows God is not willing that any should perish.' },
        { reference: 'Matthew 23:37', reason: 'Shows Jesus\' longing to gather people who were unwilling.' },
      ],
      things_not_to_force: [
        'Do not turn this into a debate about Calvinism or election.',
        'Do not minimize the emotional weight of the question.',
        'Do not use fear as a manipulation tactic.',
        'Do not pretend you have an answer for every specific case.',
      ],
      follow_up: 'After the conversation, pray for your friend. If they are open, offer to read through a Gospel together. If they are not, continue to love them, pray for them, and be available if they want to talk more.',
      is_demo: true,
    };
  }

  if (lower.includes('hypocrit') || lower.includes('church') || lower.includes('christians are')) {
    return {
      pray_first: 'Pray for humility. The church\'s failures are real, and you may be tempted to be defensive. Pray that God would help you acknowledge sin honestly while pointing to Christ.',
      listen: 'Listen for what specifically happened. Was it a personal hurt? An institutional failure? A doctrinal disagreement? Do not dismiss or minimize. Acknowledge the real harm.',
      questions_worth_asking: [
        'Can you tell me more about what happened?',
        'How did that affect your view of God, not just the church?',
        'What would it look like for a church to be what it should be?',
      ],
      gospel_connection: 'The church\'s failures do not disprove Christ — they confirm the human sin He came to address. Jesus warned about false shepherds and religious hypocrisy. The Gospel is not "Christians are perfect" — it is "we are all sinners who need grace, and Christ is the only one who never failed."',
      scripture_to_know: [
        { reference: 'Matthew 23:1–36', reason: 'Jesus\' strongest words were for religious hypocrites.' },
        { reference: '1 Peter 2:21–25', reason: 'Christ committed no sin, and we are called to follow His steps.' },
        { reference: 'Romans 3:23', reason: 'All have sinned — including Christians.' },
      ],
      things_not_to_force: [
        'Do not defend the institution automatically.',
        'Do not dismiss genuine abuse or wrongdoing.',
        'Do not say "that was not real Christianity" as a way to avoid acknowledging failure.',
        'Do not rush to invite them to church before acknowledging the hurt.',
      ],
      follow_up: 'If abuse or wrongdoing is involved, encourage appropriate professional, pastoral, or legal support. Continue to pray and be a faithful friend. Trust that your consistent love over time may do more than any single conversation.',
      is_demo: true,
    };
  }

  // Default / general prep
  return {
    pray_first: 'Before the conversation, pray. Pray for the person, for yourself, and for the Holy Spirit to be at work. Evangelism is not a technique — it is dependence on God.',
    listen: 'Listen more than you speak. Try to understand their actual question, their experience, and where they are coming from. People can tell when you are listening versus when you are waiting to talk.',
    questions_worth_asking: [
      'Can you tell me more about that?',
      'What has your experience been with Christianity?',
      'What would it take for you to consider it seriously?',
    ],
    gospel_connection: 'The Gospel is not "try harder" or "be a better person." The Gospel is "God has done for you what you could not do for yourself." Christ lived the life you should have lived, died the death you deserved, and rose again so you could have new life. That is the message.',
    scripture_to_know: [
      { reference: '1 Peter 3:15', reason: 'Be prepared to give a reason for the hope that is in you, with gentleness and respect.' },
      { reference: 'Romans 1:16', reason: 'The Gospel is the power of God for salvation to everyone who believes.' },
      { reference: '2 Corinthians 5:18–20', reason: 'God has entrusted to us the ministry of reconciliation.' },
    ],
    things_not_to_force: [
      'Do not force a Gospel presentation into every conversation.',
      'Do not treat the person as a project or a prospect.',
      'Do not use manipulative techniques or fear-based pressure.',
      'Do not argue about secondary issues when the main issue is Christ.',
    ],
    follow_up: 'After the conversation, pray. If they are open, offer to read a Gospel together. If they are not, continue to love them, pray for them, and be available. Faithfulness belongs to you. The outcome belongs to God.',
    is_demo: true,
  };
}

// ============================================================
// Missions Sections (foundational)
// ============================================================

export const missionsSections: Array<{ id: string; title: string; description: string; available: boolean }> = [
  { id: 'biblical_theology', title: 'Biblical Theology of Missions', description: 'God\'s heart for the nations from Genesis to Revelation.', available: false },
  { id: 'pray_for_nations', title: 'Pray for the Nations', description: 'Scripture-informed prayer for unreached peoples.', available: false },
  { id: 'supporting_missionaries', title: 'Supporting Missionaries', description: 'How to faithfully support those sent out.', available: false },
  { id: 'my_church_missions', title: 'My Church\'s Missions', description: 'Connect with your local church\'s missions involvement.', available: false },
  { id: 'preparing_to_go', title: 'Preparing to Go', description: 'Discerning whether God may be calling you to go.', available: false },
];

// ============================================================
// Boundary-Aware Guidance
// ============================================================

export const boundaryGuidance = {
  title: 'Respecting Boundaries',
  content: 'If someone has asked you not to talk about Christianity, respect that boundary. You can continue to love them, pray privately, live faithfully, and remain willing to answer if they initiate. Faithful evangelism must not become harassment. The Holy Spirit is the one who opens hearts — you do not need to force the door.',
  scripture: '1 Peter 3:1–2 — "They may be won without a word by the conduct of their wives" — conduct, not pressure, is sometimes the witness God uses.',
};

export const workplaceGuidance = {
  title: 'Workplace Wisdom',
  content: 'In the workplace, be wise about policies, power differences, and voluntary conversation. Do not use your position to pressure subordinates. Do not jeopardize your employment or harass coworkers. Let your work ethic and integrity be your first witness, and let spiritual conversations arise naturally and voluntarily.',
  scripture: 'Colossians 3:23 — "Whatever you do, work heartily, as for the Lord and not for men." 1 Thessalonians 4:11–12 — "Aspire to live quietly, and to mind your own affairs."',
};

// ============================================================
// Family Evangelism Guidance
// ============================================================

export const familyEvangelismGuidance = {
  title: 'When Your Child Does Not Believe',
  content: 'For parents whose children do not currently profess faith: Do not manipulate a profession of faith. Teach Gospel clarity, pray continually, live a consistent Christian life, have age-appropriate conversations, listen well, and involve your church. Avoid language that pressures children to say particular words merely to satisfy you. Trust God with your child\'s soul — He is more committed to their salvation than you are.',
  scripture: 'Ephesians 6:4 — "Fathers, do not provoke your children to anger, but bring them up in the discipline and instruction of the Lord." 2 Timothy 1:5 — Timothy\'s sincere faith lived first in his grandmother and mother.',
};

// ============================================================
// Prayer for the Unsaved
// ============================================================

export const prayingForSomeoneThemes = [
  { theme: "God's Mercy", scripture: '1 Timothy 2:1–4', prayer: 'Lord, have mercy on ___ . Open their eyes to see the beauty of Christ.' },
  { theme: 'Clarity of Gospel', scripture: '2 Corinthians 4:4–6', prayer: 'Father, shine the light of the Gospel into ___\'s heart.' },
  { theme: 'Repentance', scripture: '2 Timothy 2:24–26', prayer: 'Lord, grant ___ repentance leading to the knowledge of the truth.' },
  { theme: 'Faith', scripture: 'Ephesians 2:8–9', prayer: 'Lord, give ___ the gift of faith to trust in Christ alone.' },
  { theme: 'Opportunities', scripture: 'Colossians 4:3', prayer: 'Lord, open a door for the Gospel in ___\'s life, and help me walk through it.' },
  { theme: 'Wisdom', scripture: 'James 1:5', prayer: 'Lord, give me wisdom to know when to speak and when to listen with ___.' },
  { theme: 'My Love and Patience', scripture: '1 Corinthians 13:4–7', prayer: 'Lord, help me love ___ with patience and kindness, not pressure or frustration.' },
];
