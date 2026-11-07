export interface ParentGuideScripture {
  reference: string;
  note: string;
}

export interface ParentGuideAgeNote {
  ages: string;
  note: string;
}

export interface ParentGuide {
  id: string;
  title: string;
  description: string;
  goal: string;
  start_here: string;
  steps: string[];
  what_you_can_say: string[];
  adjust_by_age: ParentGuideAgeNote[];
  common_mistakes: string[];
  try_this_week: string;
  scripture: ParentGuideScripture[];
  pray: string;
}

export const parentGuides: ParentGuide[] = [
  {
    id: 'teaching_scripture',
    title: 'Teaching Scripture',
    description: 'How to open the Bible with your children.',
    goal: 'Help your children learn to read the Bible for themselves, understand what it says, and respond to it with faith and obedience.',
    start_here: 'Pick one short passage this week. Read it aloud twice, slowly, before you say anything about it.',
    steps: [
      'Read the passage aloud, once slowly and once again.',
      'Observe: ask what is happening, who is speaking, and what words repeat.',
      'Understand: ask what the passage meant to the first people who heard it.',
      'Connect: show how the passage points to Jesus or to the wider story of Scripture.',
      'Apply: ask what this changes about how we think, speak, or act this week.',
      'Pray: thank God for what the passage shows and ask Him to help you live it.',
    ],
    what_you_can_say: [
      'Let\'s read this slowly. What do you notice first?',
      'What does this tell us about God?',
      'I don\'t know that yet. Let\'s look at the text together.',
      'Where do we see this same truth in another part of the Bible?',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Use short stories, simple questions, and one main truth. Let them act out or retell the passage.' },
      { ages: 'Ages 9–12', note: 'Add observation questions and ask them to find the key verse and explain it in their own words.' },
      { ages: 'Ages 13–17', note: 'Invite them to lead the discussion, compare passages, and wrestle with what the text means for their choices.' },
    ],
    common_mistakes: [
      'Rushing to the application before the children understand the passage.',
      'Treating the reading as a lesson to finish instead of a text to explore.',
      'Pretending to have every answer. Saying "let\'s find out" builds trust.',
    ],
    try_this_week: 'Read one chapter of a Gospel together at dinner. Ask each person to share one thing they noticed about Jesus.',
    scripture: [
      { reference: 'Deuteronomy 6:6–7', note: 'Parents are to speak God\'s words at home, all day long.' },
      { reference: 'Nehemiah 8:8', note: 'The Word is read clearly, with its meaning explained.' },
      { reference: '2 Timothy 3:14–17', note: 'Scripture is able to make us wise for salvation and equip us for every good work.' },
    ],
    pray: 'Lord, open our eyes to see wonderful things in Your Word. Help us to read it, understand it, and live it together. Amen.',
  },
  {
    id: 'family_worship',
    title: 'Family Worship',
    description: 'A simple pattern for worship at home.',
    goal: 'Build a steady, unhurried rhythm where the family reads Scripture, prays, and sings together.',
    start_here: 'Choose a time that already exists, such as breakfast, after dinner, or bedtime. Keep it short enough to repeat every day.',
    steps: [
      'Gather everyone and put phones away.',
      'Read a short passage, five to ten verses is enough.',
      'Ask one or two simple questions about what you read.',
      'Pray together. Let each person pray a sentence if they are willing.',
      'Sing or say a short hymn, psalm, or the Lord\'s Prayer if you can.',
    ],
    what_you_can_say: [
      'We\'re going to read together, then pray. It only takes a few minutes.',
      'What word or idea stood out to you today?',
      'Let\'s thank God for one thing from this passage.',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Keep it brief and active. Short songs and simple prayers work well.' },
      { ages: 'Ages 9–12', note: 'Let them choose the passage or read aloud, and invite a prayer request.' },
      { ages: 'Ages 13–17', note: 'Give them space to explain a passage or lead a prayer. Expect honest questions.' },
    ],
    common_mistakes: [
      'Making worship so long that children dread it.',
      'Waiting for a perfect schedule instead of starting with five minutes.',
      'Giving up after one missed night. Consistency matters more than length.',
    ],
    try_this_week: 'Pick one meal this week for a five-minute family reading and prayer. Repeat it on at least three days.',
    scripture: [
      { reference: 'Joshua 24:15', note: 'Joshua commits his whole household to serve the Lord.' },
      { reference: 'Psalm 78:4–7', note: 'Parents are to tell the next generation what God has done.' },
      { reference: 'Colossians 3:16', note: 'The Word of Christ dwells richly as we teach and sing together.' },
    ],
    pray: 'Father, make our home a place where Your Word is read and Your name is praised. Give us patience to keep showing up together. Amen.',
  },
  {
    id: 'difficult_questions',
    title: 'Difficult Questions',
    description: 'When children ask hard things.',
    goal: 'Respond to hard questions with calm, honesty, and a clear path to Scripture, so children learn that questions are welcome.',
    start_here: 'Pause before you answer. Thank your child for asking, and find out what is behind the question.',
    steps: [
      'Listen fully and ask what made them wonder about this.',
      'Say honestly what you know and what you are still learning.',
      'Look together at what Scripture clearly says.',
      'Admit where Scripture is silent, and say so plainly.',
      'Follow up later. Bring it back up at dinner or at bedtime.',
    ],
    what_you_can_say: [
      'That\'s a really good question. Tell me what made you think of it.',
      'The Bible is clear about this part. Let\'s read it together.',
      'I don\'t know everything about that. Let\'s find out what God has told us.',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Give short, true answers. Avoid details they are not ready for.' },
      { ages: 'Ages 9–12', note: 'Explain the reasons behind the answer and show how Scripture fits together.' },
      { ages: 'Ages 13–17', note: 'Engage the strongest version of the objection and show where the answer rests.' },
    ],
    common_mistakes: [
      'Shutting the question down because it feels uncomfortable.',
      'Pretending to be certain about something Scripture does not directly address.',
      'Answering a different question than the one your child asked.',
    ],
    try_this_week: 'Ask your children what question they have been wanting to ask about God. Write it down and look for an answer together.',
    scripture: [
      { reference: 'James 1:5', note: 'God gives wisdom generously to those who ask.' },
      { reference: '1 Peter 3:15', note: 'Be ready to give an answer with gentleness and respect.' },
      { reference: 'Jude 22', note: 'Show mercy to those who are doubting.' },
    ],
    pray: 'Lord, give us wisdom to answer well and humility to say "I don\'t know" when we need to. Let our children grow closer to You through their questions. Amen.',
  },
  {
    id: 'gospel_conversations',
    title: 'Gospel Conversations With Children',
    description: 'Sharing the Gospel at home.',
    goal: 'Help children understand who Jesus is, what He has done, and what it means to trust Him, in everyday words.',
    start_here: 'Look for ordinary moments, such as a drive, a meal, or a bedtime talk, where the Gospel fits naturally.',
    steps: [
      'Name the problem: everyone has sinned against God.',
      'Name the answer: Jesus lived, died, and rose again for sinners.',
      'Name the response: we repent, trust Him, and follow Him.',
      'Ask what they understand and what questions they still have.',
      'Pray together, and let them pray in their own words.',
    ],
    what_you_can_say: [
      'Do you know why Jesus came to earth?',
      'When we do wrong, who can make it right? Jesus can.',
      'What does it mean to trust Jesus?',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Use simple words: God loves us, we do wrong, Jesus saves us. Repeat often.' },
      { ages: 'Ages 9–12', note: 'Explain sin, the cross, and the resurrection with clear examples they can picture.' },
      { ages: 'Ages 13–17', note: 'Talk about what the Gospel means for identity, doubt, and their own decisions.' },
    ],
    common_mistakes: [
      'Making the Gospel only a formula to recite, without showing what it means.',
      'Waiting for a formal talk instead of speaking about Jesus in daily life.',
      'Forcing a response. Pray for them, and keep the door open.',
    ],
    try_this_week: 'Share one way Jesus has helped you this week, and ask your child to tell you one way they have seen Jesus at work.',
    scripture: [
      { reference: 'Mark 10:14', note: 'Jesus welcomes children and says the kingdom belongs to such as these.' },
      { reference: 'Romans 3:23–24', note: 'All have sinned, and all are justified freely by His grace.' },
      { reference: 'Romans 10:9', note: 'Confess Jesus as Lord and believe that God raised Him from the dead.' },
    ],
    pray: 'Jesus, thank You for dying for our sins and rising again. Help our children know You personally and trust You completely. Amen.',
  },
  {
    id: 'parenting_ages',
    title: 'Parenting Through Different Ages',
    description: 'How discipleship changes as children grow.',
    goal: 'Adjust how you teach and guide your children as they grow, while keeping the truth of God\'s Word the same.',
    start_here: 'Think about the age of each child and what they are able to understand, care about, and carry.',
    steps: [
      'Young children: teach through story, repetition, and wonder.',
      'School-age children: teach through questions, discovery, and simple responsibility.',
      'Teenagers: teach through dialogue, honest conversation, and growing ownership.',
      'At every age: model what you teach, and show repentance when you fall short.',
    ],
    what_you_can_say: [
      'What do you think about this? I want to hear your answer.',
      'Let\'s think through this choice together.',
      'I was wrong about that. Will you forgive me?',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Give clear, loving boundaries and short explanations. Praise faith in small steps.' },
      { ages: 'Ages 9–12', note: 'Give reasons for rules and let them practice making simple choices.' },
      { ages: 'Ages 13–17', note: 'Give more freedom with more conversation. Expect them to own their faith and decisions.' },
    ],
    common_mistakes: [
      'Treating teenagers like young children, or young children like adults.',
      'Changing the truth you teach instead of changing how you explain it.',
      'Relying on rules without relationship.',
    ],
    try_this_week: 'Ask each child one question about what they are learning or enjoying right now, and listen without correcting.',
    scripture: [
      { reference: 'Proverbs 22:6', note: 'Train up a child in the way he should go.' },
      { reference: 'Ephesians 6:4', note: 'Fathers are not to provoke their children, but to bring them up in the discipline of the Lord.' },
      { reference: 'Luke 2:52', note: 'Jesus grew in wisdom, stature, and favor with God and man.' },
    ],
    pray: 'Lord, give us wisdom for each child at each stage. Help us grow in patience and love as they grow in faith. Amen.',
  },
  {
    id: 'technology_worldview',
    title: 'Technology & Worldview',
    description: 'Discipling in a digital age.',
    goal: 'Help children evaluate what they see, hear, and use online through the lens of God\'s truth.',
    start_here: 'Talk about one thing your family watches, plays, or scrolls. Ask what it teaches about people, success, and happiness.',
    steps: [
      'Name what your children use and enjoy.',
      'Ask what it says about God, people, and what is good.',
      'Compare it with what Scripture teaches about the same thing.',
      'Agree on simple family limits and explain why they exist.',
      'Revisit the conversation regularly, not only when something goes wrong.',
    ],
    what_you_can_say: [
      'What do you think this video is saying about what matters?',
      'Does this make you more thankful or more discontent?',
      'Let\'s test this against what the Bible says.',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Limit screens closely and watch together. Name what is true, kind, and good.' },
      { ages: 'Ages 9–12', note: 'Talk about advertising, influencers, and how media shapes desire.' },
      { ages: 'Ages 13–17', note: 'Discuss their own choices, accountability, and how to walk away from what harms them.' },
    ],
    common_mistakes: [
      'Banning everything without explaining why, which invites secret use.',
      'Lecturing instead of asking questions that let children think.',
      'Forgetting that parents also need to model healthy habits.',
    ],
    try_this_week: 'Choose one screen-free block this week, and at the end, ask what each person noticed about their own habits.',
    scripture: [
      { reference: 'Philippians 4:8', note: 'Think about whatever is true, honorable, just, pure, lovely, and commendable.' },
      { reference: 'Romans 12:2', note: 'Do not be conformed to this world, but be transformed by the renewal of your mind.' },
      { reference: 'Psalm 101:3', note: 'Set no wicked thing before your eyes.' },
    ],
    pray: 'Lord, guard our hearts and minds from what does not honor You. Help us fill our attention with what is true and good. Amen.',
  },
  {
    id: 'doubt',
    title: 'Doubt',
    description: 'When your child struggles with faith.',
    goal: 'Respond to doubt with patience, honesty, and prayer, so your child feels safe bringing questions to you and to God.',
    start_here: 'Listen more than you speak. Ask how long they have been struggling and what has made it harder.',
    steps: [
      'Listen without correcting or rushing to fix.',
      'Ask what they are really wondering about.',
      'Acknowledge the difficulty and say that questions are welcome in your home.',
      'Turn toward Scripture and honest prayer together.',
      'Connect them with trusted believers, such as a pastor, mentor, or youth leader.',
    ],
    what_you_can_say: [
      'Thank you for telling me. I want to understand what you are feeling.',
      'You can ask me anything. I may not have every answer, but I will not shut you down.',
      'Let\'s pray about this together and look at what God has said.',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Reassure them of God\'s love and keep answers simple. Pray with them.' },
      { ages: 'Ages 9–12', note: 'Name the feeling and look at honest Bible examples of faithful people who doubted.' },
      { ages: 'Ages 13–17', note: 'Take the questions seriously, invite them to read widely, and stay close even when they push back.' },
    ],
    common_mistakes: [
      'Treating doubt as rebellion before you understand it.',
      'Dismissing questions with a quick answer.',
      'Making your child feel that doubt means they are not really saved.',
    ],
    try_this_week: 'Ask your child to tell you one question about faith they have never asked out loud. Listen, and thank them for trusting you.',
    scripture: [
      { reference: 'Mark 9:24', note: 'The father cries, "I believe; help my unbelief!"' },
      { reference: 'Psalm 42:5', note: 'Why are you cast down, O my soul? Hope in God.' },
      { reference: 'Jude 22', note: 'Have mercy on those who doubt.' },
    ],
    pray: 'Lord, meet our child in their doubt. Give them honest hearts, patient friends, and the assurance of Your love. Amen.',
  },
  {
    id: 'teenage_questions',
    title: 'Teenage Questions',
    description: 'Navigating faith with older children.',
    goal: 'Engage teenagers\' big questions about truth, suffering, identity, and the world with honesty and Scripture.',
    start_here: 'Ask what they are hearing from school, friends, and social media, and what they actually believe about it.',
    steps: [
      'Ask what they think and why, before offering your view.',
      'Take the strongest version of their question seriously.',
      'Read Scripture together and look for what it actually says.',
      'Share your own reasoning and your experience of God\'s faithfulness.',
      'Encourage them to bring their own questions to a pastor or trusted adult.',
    ],
    what_you_can_say: [
      'What do you think, and what makes you believe that?',
      'That is a hard question. I want to answer it well, so let\'s look at it together.',
      'I want you to know you can be honest with me.',
    ],
    adjust_by_age: [
      { ages: 'Ages 13–15', note: 'Ask concrete questions and help them connect faith to friendships, school, and choices.' },
      { ages: 'Ages 16–17', note: 'Discuss the broader worldview questions, including suffering, science, other religions, and identity.' },
    ],
    common_mistakes: [
      'Responding to a question with fear or anger instead of curiosity.',
      'Giving a one-line answer to a serious question.',
      'Lecturing when they need to be heard.',
    ],
    try_this_week: 'Ask your teenager what question about faith or the world they would most like help thinking through, and set a time to talk.',
    scripture: [
      { reference: 'Proverbs 1:7', note: 'The fear of the Lord is the beginning of knowledge.' },
      { reference: '1 Timothy 4:12', note: 'Let no one despise your youth; set an example in speech, conduct, and faith.' },
      { reference: 'Ecclesiastes 12:13–14', note: 'Fear God and keep His commandments; He will judge every deed.' },
    ],
    pray: 'Lord, give our teenagers courage to ask and humility to learn. Help them trust Your Word more than the voices around them. Amen.',
  },
  {
    id: 'church',
    title: 'Church',
    description: 'Why the local church matters for your family.',
    goal: 'Help your family see the local church as God\'s people gathered to worship, learn, and serve, not an optional extra.',
    start_here: 'Ask each child what they most enjoy or find hard about church, and listen before you plan.',
    steps: [
      'Make worship on the Lord\'s Day a priority as a family.',
      'Talk about the sermon together on the way home or at lunch.',
      'Introduce children to adults of different ages in the congregation.',
      'Find a way to serve together, even in small ways.',
      'Pray for your pastor, elders, and church family by name.',
    ],
    what_you_can_say: [
      'What stood out to you in the sermon today?',
      'Who in our church has encouraged you lately?',
      'Let\'s find a way to serve someone this week.',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Help them participate with simple tasks, such as passing out bulletins or singing.' },
      { ages: 'Ages 9–12', note: 'Give them a role, such as greeting, helping in the nursery, or joining a service project.' },
      { ages: 'Ages 13–17', note: 'Invite them into real responsibility, such as serving, teaching, or mentoring younger children.' },
    ],
    common_mistakes: [
      'Treating church as a weekly event instead of a community.',
      'Letting sports or activities regularly crowd out worship and fellowship.',
      'Relying on family discipleship alone and neglecting the wider church.',
    ],
    try_this_week: 'Invite another family or a single adult from church to a meal, and let your children ask them about their faith story.',
    scripture: [
      { reference: 'Hebrews 10:24–25', note: 'Do not neglect meeting together; encourage one another.' },
      { reference: 'Acts 2:42–47', note: 'The early church devoted itself to teaching, fellowship, prayer, and breaking bread.' },
      { reference: 'Ephesians 4:11–13', note: 'Christ gives pastors and teachers to equip His people for service.' },
    ],
    pray: 'Lord, make our family a faithful part of Your church. Help us love Your people, serve them gladly, and honor the ministry of our pastors. Amen.',
  },
  {
    id: 'prayer',
    title: 'Prayer',
    description: 'Teaching your family to pray.',
    goal: 'Help your children pray honestly and regularly, so prayer becomes a natural conversation with God.',
    start_here: 'Pray out loud with your children this week, in simple, honest words, so they hear what praying sounds like.',
    steps: [
      'Model prayer by praying aloud, honestly, and briefly.',
      'Invite children to pray a sentence at a time.',
      'Pray for specific needs, including family, friends, church, and the world.',
      'Pray thanks as well as requests.',
      'Return to requests later and ask what God has done.',
    ],
    what_you_can_say: [
      'What would you like to thank God for today?',
      'Let\'s bring this to God right now.',
      'God answered that prayer. Let\'s remember it.',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Use short prayers, and let them name what they are thankful for. Pray with simple actions.' },
      { ages: 'Ages 9–12', note: 'Teach them to pray through Scripture, such as the Lord\'s Prayer, and keep a prayer list.' },
      { ages: 'Ages 13–17', note: 'Encourage private prayer and invite them to lead family prayer or pray for specific friends.' },
    ],
    common_mistakes: [
      'Praying only at mealtimes or bedtime without teaching what prayer is.',
      'Making prayer sound formal or rehearsed, which discourages honest talk.',
      'Forgetting to pray with children about their real fears and hopes.',
    ],
    try_this_week: 'At dinner, ask everyone for one thing to thank God for and one prayer request, then pray through the list together.',
    scripture: [
      { reference: 'Matthew 6:9–13', note: 'Jesus teaches His disciples how to pray.' },
      { reference: 'Philippians 4:6–7', note: 'Bring everything to God in prayer with thanksgiving.' },
      { reference: '1 Thessalonians 5:17', note: 'Pray without ceasing.' },
    ],
    pray: 'Father, teach our family to pray with honesty and trust. Hear our children when they speak to You, and answer in Your wisdom and love. Amen.',
  },
  {
    id: 'character',
    title: 'Character',
    description: 'Building godly character through Scripture.',
    goal: 'Shape children\'s character so that they love what is good and grow in the fruit of the Spirit.',
    start_here: 'Pick one virtue to focus on this month. Name it, define it from Scripture, and look for chances to practice it.',
    steps: [
      'Name the virtue and explain what it looks like in action.',
      'Read a Scripture passage that describes it.',
      'Notice it when your children show it, and say so specifically.',
      'Talk about what gets in the way, and pray for help.',
      'Show repentance when you fall short, so they see grace at work.',
    ],
    what_you_can_say: [
      'I saw you be patient with your brother. That was kind.',
      'What do you think would help you show self-control in this situation?',
      'I failed to be kind earlier. Will you forgive me?',
    ],
    adjust_by_age: [
      { ages: 'Ages 3–8', note: 'Use stories and praise specific actions, such as sharing or telling the truth.' },
      { ages: 'Ages 9–12', note: 'Connect character to choices, friendships, and responsibilities at school and home.' },
      { ages: 'Ages 13–17', note: 'Discuss the motives behind their actions and how character shapes their future.' },
    ],
    common_mistakes: [
      'Focusing only on behavior and ignoring the heart.',
      'Praising performance without naming the virtue.',
      'Expecting perfection from children while modeling impatience yourself.',
    ],
    try_this_week: 'Choose one fruit of the Spirit, such as patience or kindness, and each evening name one time you saw it in someone at home.',
    scripture: [
      { reference: 'Galatians 5:22–23', note: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.' },
      { reference: 'Philippians 2:3–4', note: 'Do nothing from selfish ambition, but in humility count others more significant.' },
      { reference: '2 Peter 1:5–8', note: 'Make every effort to add virtue, knowledge, self-control, and love to your faith.' },
    ],
    pray: 'Lord, form our children\'s hearts after Your own. Give them love for what is good, and help us to be examples of the character we teach. Amen.',
  },
];
