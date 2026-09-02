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
      what_you_addressed_well: 'Development content — SOLAPATH will analyze your response after the full intelligence engine is connected.',
      what_you_may_have_missed: 'Development content — coaching will highlight areas you may have missed, such as historical evidence, listening, or Gospel connection.',
      listening: 'Did you ask your friend what they mean by "changed"? Differentiating between textual variants and fundamental corruption is important. Did you listen before answering?',
      gospel_connection: 'The reliability of Scripture matters because it is through Scripture that we know Christ. The goal is not winning an argument about manuscripts but pointing to Jesus.',
      scripture_to_study: '2 Timothy 3:16–17; 2 Peter 1:20–21; John 10:35',
      apologetics_resources: 'Development content — verified apologetics resources will be connected through SOLAPATH\'s approved library.',
    },
  },
  {
    id: 'angry_at_god',
    label: 'Someone Angry at God',
    description: 'A friend who lost a child and is angry at God.',
    objection: 'My daughter died. She was eight years old. And you are telling me God is good? If your God exists, He took my child. I want nothing to do with Him.',
    coaching: {
      what_you_addressed_well: 'Development content — SOLAPATH will analyze your response after the full intelligence engine is connected.',
      what_you_may_have_missed: 'In situations of profound grief, the primary calling is compassion and presence, not argument. Did you acknowledge the pain before offering any explanation?',
      listening: 'Did you listen more than you spoke? In grief, people need presence, not answers. Did you avoid shallow clichés like "everything happens for a reason"?',
      gospel_connection: 'The Gospel does not promise a pain-free life. It promises a God who entered into suffering in Christ and who promises to make all things new. But this truth must be shared with timing and tenderness.',
      scripture_to_study: 'John 11:33–36 (Jesus wept); Revelation 21:1–4; Lamentations 3:31–33',
      apologetics_resources: 'Development content — verified resources on suffering and the Gospel will be connected through SOLAPATH\'s approved library.',
    },
  },
  {
    id: 'church_hurt',
    label: 'Church Hurt',
    description: 'Someone who left Christianity after being hurt by a church.',
    objection: 'I grew up in the church. The pastor was controlling and manipulative. The leaders covered up abuse. I do not want anything to do with Christianity anymore.',
    coaching: {
      what_you_addressed_well: 'Development content — SOLAPATH will analyze your response after the full intelligence engine is connected.',
      what_you_may_have_missed: 'Did you distinguish between the failures of human institutions and the truth of Christ? Did you acknowledge the real harm without dismissing it or defending the institution?',
      listening: 'Did you let them share their experience fully before responding? Church hurt is real and deep. Did you avoid minimizing or defending?',
      gospel_connection: 'Jesus warned about false shepherds and religious hypocrisy (Matthew 23). The church\'s failures do not disprove Christ — they confirm the human sin He came to address. But this must be shared with humility, not defensiveness.',
      scripture_to_study: 'Matthew 23:1–36; 1 Peter 2:21–25; Hebrews 13:7',
      apologetics_resources: 'Development content — verified resources on church hurt and healing will be connected through SOLAPATH\'s approved library.',
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
    reformed_foundation: 'The Reformed tradition teaches that God is perfectly just and that hell is the just punishment for sin. No one is treated unfairly. The wonder is not that God sends anyone to hell — the wonder is that He saves any at all. The Reformed emphasis on God\'s sovereignty means that salvation is entirely of grace, and those who are saved have nothing to boast about. The cross demonstrates that God does not take evil lightly — He dealt with it fully in Christ.',
    other_christian_views: 'Some Christian traditions emphasize free will as the primary reason people go to hell, while the Reformed tradition emphasizes God\'s sovereign decree. Both agree that hell is real, just, and avoidable through Christ. The difference is in the explanation of why some are saved and others are not.',
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
    reformed_foundation: 'The Reformed tradition teaches that God is sovereign over all things, including suffering, without being the author of sin. He has a good purpose for all He allows. The cross is the supreme example: the greatest evil accomplished the greatest good. We may not understand every instance of suffering, but we trust the character of God revealed at the cross.',
    other_christian_views: 'Some traditions emphasize free will as the primary explanation for suffering. The Reformed tradition emphasizes God\'s sovereignty while maintaining human responsibility. Both agree that God is good, that suffering is real, and that God will ultimately defeat it.',
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
    reformed_foundation: 'The Reformed tradition teaches the self-authentication of Scripture (autopiston). The authority of Scripture does not depend on the church, human reason, or historical evidence, though these support it. The ultimate ground is God speaking, and the internal witness of the Holy Spirit confirms this in the believer.',
    other_christian_views: 'Roman Catholic theology emphasizes the church\'s role in authenticating Scripture, while the Reformed tradition emphasizes Scripture\'s self-authentication. Both agree that Scripture is God\'s Word.',
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
    reformed_foundation: 'The Reformed tradition teaches penal substitutionary atonement — Christ bore the wrath of God in our place. This is not a metaphor but a legal and relational reality. The cross satisfies God\'s justice so that justification is grounded not in leniency but in real payment.',
    other_christian_views: 'Some traditions emphasize Christus Victor (Christ defeating the powers) or moral influence theories. The Reformed tradition sees these as true but secondary to penal substitution as the central achievement of the cross.',
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
    reformed_foundation: 'The Reformed tradition teaches that salvation is through Christ alone (solus Christus). This is not arrogance — it is the claim that God has acted in history to save us in a way we could not achieve ourselves. The exclusivity of Christ is a claim about what God has done, not about our superiority.',
    other_christian_views: 'Some modern traditions propose inclusivism (Christ is present in other religions) or pluralism (all religions are valid paths). The Reformed tradition, following Scripture, holds to exclusivity: there is no other name under heaven by which we must be saved.',
    sources: [],
  },
};

export async function getTheyAskedMeResponse(question: string): Promise<TheyAskedMeResponse> {
  const lower = question.toLowerCase().trim();

  // Retrieve verified sources from the shared RAG engine
  const retrieval = await retrieveSources(question);
  const ragCitations: Citation[] = retrieval.citations;

  for (const [key, response] of Object.entries(theyAskedMeResponses)) {
    if (lower.includes(key)) {
      return { ...response, sources: ragCitations, is_demo: true };
    }
  }

  return {
    understand_the_question: 'Development content — SOLAPATH will help you understand the question behind the question once the full intelligence engine is connected. For now, listen carefully to what they are really asking. Is it intellectual? Emotional? Relational? The answer to that question shapes how you respond.',
    understand_it_yourself: 'Development content — SOLAPATH will provide biblical and theological preparation for this question. For now, read the relevant passages and think through what Scripture actually says before responding.',
    open_your_bible: [
      { reference: '1 Peter 3:15', reason: 'Be prepared to make a defense to anyone who asks you for a reason for the hope that is in you.' },
      { reference: 'Colossians 4:5–6', reason: 'Walk in wisdom toward outsiders, letting your speech be gracious.' },
    ],
    how_you_could_respond: 'Development content — SOLAPATH will provide natural conversation guidance for this question. For now, listen first, acknowledge what they are saying, and gently point to Christ.',
    questions_to_ask_them: [
      'Can you tell me more about what makes you ask that?',
      'What is your own thinking on it?',
      'Have you had an experience that shaped your view on this?',
    ],
    they_may_ask_next: [
      'But how do you know your view is right?',
      'What about people who disagree?',
    ],
    reformed_foundation: 'Development content — SOLAPATH will connect this to the Reformed theological framework once the full intelligence engine is available.',
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
