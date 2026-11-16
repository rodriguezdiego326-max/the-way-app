const SPANISH_OBJECTIVES: Record<string, string> = {
  "Read Paul's introduction. Notice the theme verse in 1:16–17 — the power of God for salvation.":
    "Lee la introducción de Pablo. Observa el versículo central de 1:16–17: el poder de Dios para salvación.",
  "Read about the righteousness of God apart from the law. Trace the logic of justification by faith.":
    "Lee sobre la justicia de Dios aparte de la ley. Sigue la lógica de la justificación por la fe.",
  "Read about the fruits of justification. Notice the chain: suffering → endurance → character → hope.":
    "Lee sobre los frutos de la justificación. Observa la cadena: sufrimiento → perseverancia → carácter → esperanza.",
  "Continue your study of Romans. Trace Paul's argument from no condemnation to life in the Spirit.":
    "Continúa tu estudio de Romanos. Sigue el argumento de Pablo, desde la ausencia de condenación hasta la vida en el Espíritu.",
  "Continue in Romans 8. Read about the groaning of creation and the Spirit's intercession.":
    "Continúa en Romanos 8. Lee sobre el gemido de la creación y la intercesión del Espíritu.",
  "Continue in Romans 8. Read Paul's climactic declaration of God's inseparable love.":
    "Continúa en Romanos 8. Lee la declaración culminante de Pablo sobre el amor inseparable de Dios.",
  "Continue your study of John. Read the prologue — the Word made flesh.":
    "Continúa tu estudio de Juan. Lee el prólogo: el Verbo hecho carne.",
  "Continue in John. Read Jesus' conversation with Nicodemus about new birth.":
    "Continúa en Juan. Lee la conversación de Jesús con Nicodemo sobre el nuevo nacimiento.",
  "Continue in John. Read about the Good Shepherd and His sheep.":
    "Continúa en Juan. Lee sobre el Buen Pastor y sus ovejas.",
  "Continue in John. Read about the vine and the branches.":
    "Continúa en Juan. Lee sobre la vid y los pámpanos.",
  "Continue in John. Read Jesus' High Priestly Prayer for His people.":
    "Continúa en Juan. Lee la oración sacerdotal de Jesús por su pueblo.",
  "Continue in the Psalms. Read about the two ways — the righteous and the wicked.":
    "Continúa en los Salmos. Lee sobre los dos caminos: el del justo y el del impío.",
  "Continue in the Psalms. Read the shepherd psalm slowly.":
    "Continúa en los Salmos. Lee despacio el salmo del pastor.",
  "Continue in the Psalms. Read about God as refuge and strength.":
    "Continúa en los Salmos. Lee sobre Dios como refugio y fortaleza.",
  "Continue in the Psalms. Read David's prayer of repentance.":
    "Continúa en los Salmos. Lee la oración de arrepentimiento de David.",
  "Continue in the Psalms. Read about blessing the Lord and His benefits.":
    "Continúa en los Salmos. Lee sobre bendecir al Señor y sus beneficios.",
  "Read the psalm slowly. Notice what each image teaches you about the character of God.":
    "Lee el salmo despacio. Observa lo que cada imagen te enseña sobre el carácter de Dios.",
  "Read slowly. What does Jesus promise to those who come to Him?":
    "Lee despacio. ¿Qué promete Jesús a quienes vienen a Él?",
  "Read these three verses slowly. Let the steadfast love of the Lord sit with you.":
    "Lee estos tres versículos despacio. Deja que la misericordia fiel del Señor permanezca contigo.",
  "Read the psalm aloud if you can. Notice each image the shepherd uses — what does each one say about God?":
    "Lee el salmo en voz alta si puedes. Observa cada imagen que usa el pastor: ¿qué dice cada una sobre Dios?",
  "Read slowly. Pay attention to what Paul says can separate the believer from the love of Christ.":
    "Lee despacio. Presta atención a lo que Pablo dice que puede separar al creyente del amor de Cristo.",
  "Read carefully. Trace the relationship between abiding, bearing fruit, and joy.":
    "Lee con atención. Sigue la relación entre permanecer, dar fruto y gozo.",
  "Read the full passage. Trace Paul's argument from no condemnation to life in the Spirit.":
    "Lee el pasaje completo. Sigue el argumento de Pablo, desde la ausencia de condenación hasta la vida en el Espíritu.",
  "Read the entire chapter. Follow the progression: abiding, love, witness, opposition.":
    "Lee el capítulo completo. Sigue la progresión: permanecer, amar, testificar, oposición.",
  "Read carefully. Trace the work of each Person of the Trinity in salvation.":
    "Lee con atención. Observa la obra de cada Persona de la Trinidad en la salvación.",
  "Read slowly. Notice what Jesus says about worry and God's provision.":
    "Lee despacio. Observa lo que Jesús dice sobre la preocupación y la provisión de Dios.",
  "Read carefully. Notice what James says about asking God for wisdom.":
    "Lee con atención. Observa lo que Santiago dice sobre pedirle sabiduría a Dios.",
  "Read this verse slowly. Let the nearness of God sit with you.":
    "Lee este versículo despacio. Deja que la cercanía de Dios permanezca contigo.",
  "Read carefully. Notice what Paul says about anger and its limits.":
    "Lee con atención. Observa lo que Pablo dice sobre el enojo y sus límites.",
  "Read David's prayer slowly. Notice his honesty before God.":
    "Lee la oración de David despacio. Observa su sinceridad delante de Dios.",
  "Read Paul's words about weakness and God's grace.":
    "Lee las palabras de Pablo sobre la debilidad y la gracia de Dios.",
  "Read carefully. Notice what Paul promises about temptation.":
    "Lee con atención. Observa lo que Pablo promete acerca de la tentación.",
  "Read slowly. Let each benefit David lists sink in.":
    "Lee despacio. Deja que cada beneficio que enumera David penetre en tu corazón.",
  "Read these verses slowly. Notice the connection between trust and direction.":
    "Lee estos versículos despacio. Observa la relación entre confiar y recibir dirección.",
  "Read this brief exchange. Notice the father's honesty.":
    "Lee este breve diálogo. Observa la sinceridad del padre.",
  "Read carefully. Notice the standard Paul sets for relationships.":
    "Lee con atención. Observa la norma que Pablo establece para las relaciones.",
  "Read slowly. Let this passage speak to where you are today.":
    "Lee despacio. Deja que este pasaje hable a tu situación de hoy.",
};

export function localizeReadingObjective(objective: string, lang: 'en' | 'es'): string {
  if (lang === 'en') return objective;
  return SPANISH_OBJECTIVES[objective] ?? objective;
}


const SPANISH_OBSERVATION_PROMPTS: Record<string, string> = {
  'What does Paul say he is not ashamed of, and why?':
    '¿De qué dice Pablo que no se avergüenza, y por qué?',
  'How does Paul describe being justified? What are the results?':
    '¿Cómo describe Pablo la justificación? ¿Cuáles son sus resultados?',
  'What does Paul say we have through faith in Christ?':
    '¿Qué dice Pablo que tenemos por medio de la fe en Cristo?',
  'What contrast does Paul draw between the flesh and the Spirit?':
    '¿Qué contraste establece Pablo entre la carne y el Espíritu?',
  'How does Paul describe the hope of glory in this passage?':
    '¿Cómo describe Pablo la esperanza de gloria en este pasaje?',
  "What does Paul list as unable to separate us from God's love?":
    '¿Qué cosas enumera Pablo como incapaces de separarnos del amor de Dios?',
  'What does John say the Word was, and what does that mean?':
    '¿Qué dice Juan que era el Verbo, y qué significa eso?',
  'What does Jesus say must happen for someone to see the kingdom of God?':
    '¿Qué dice Jesús que debe suceder para que alguien vea el reino de Dios?',
  'What does Jesus say about His sheep and His role as shepherd?':
    '¿Qué dice Jesús acerca de sus ovejas y de su función como pastor?',
  'What does it mean to abide? What does Jesus promise will follow?':
    '¿Qué significa permanecer? ¿Qué promete Jesús que ocurrirá como resultado?',
  'What does Jesus ask the Father for His disciples?':
    '¿Qué le pide Jesús al Padre por sus discípulos?',
  'What does the righteous person delight in?':
    '¿En qué se deleita la persona justa?',
  'Which image speaks most directly to your life right now?':
    '¿Qué imagen habla más directamente a tu vida en este momento?',
  'What does it mean to be still and know that He is God?':
    '¿Qué significa estar quieto y saber que Él es Dios?',
  'What does David ask God to do with his sin?':
    '¿Qué le pide David a Dios que haga con su pecado?',
  'What does David list as the benefits of the Lord?':
    '¿Qué beneficios del Señor enumera David?',
  'What does it mean that His yoke is easy and His burden is light?':
    '¿Qué significa que su yugo es fácil y su carga ligera?',
  'What is new every morning?':
    '¿Qué es nuevo cada mañana?',
  'What words or phrases does Paul repeat? What does that repetition emphasize?':
    '¿Qué palabras o frases repite Pablo? ¿Qué enfatiza esa repetición?',
  'How does abiding, loving, and witnessing connect in this passage?':
    '¿Cómo se relacionan permanecer, amar y dar testimonio en este pasaje?',
  'What does each member of the Trinity do in this passage?':
    '¿Qué hace cada Persona de la Trinidad en este pasaje?',
  'What stands out to you in this passage?':
    '¿Qué te llama la atención en este pasaje?',
};

const SPANISH_WALK_REASONS: Record<string, string> = {
  'A brief, meaningful passage for when you have only a moment.':
    'Un pasaje breve y significativo para cuando solo tienes un momento.',
  'A short, restful passage for a quick moment with Scripture.':
    'Un pasaje corto y sereno para un momento breve con la Escritura.',
  'A brief passage of comfort and hope.':
    'Un pasaje breve de consuelo y esperanza.',
  'A familiar psalm that rewards slow reading.':
    'Un salmo conocido que vale la pena leer despacio.',
  "A powerful passage about God's inseparable love.":
    'Un pasaje poderoso sobre el amor inseparable de Dios.',
  'A rich passage about union with Christ.':
    'Un pasaje rico sobre la unión con Cristo.',
  'A substantial passage for deeper study.':
    'Un pasaje sustancioso para un estudio más profundo.',
  'A full chapter for extended meditation.':
    'Un capítulo completo para una meditación más extensa.',
  "A theologically rich passage about God's plan of redemption.":
    'Un pasaje teológicamente rico sobre el plan de redención de Dios.',
  "This passage speaks directly to anxiety and trust in God's provision.":
    'Este pasaje habla directamente de la ansiedad y de confiar en la provisión de Dios.',
  "This passage addresses seeking God's wisdom for decisions and speech.":
    'Este pasaje trata de buscar la sabiduría de Dios para las decisiones y las palabras.',
  "This passage speaks to grief and God's nearness to the brokenhearted.":
    'Este pasaje habla del dolor y de la cercanía de Dios a los quebrantados de corazón.',
  'This passage addresses anger and how to handle it without sin.':
    'Este pasaje trata la ira y cómo manejarla sin pecar.',
  'This passage speaks to loneliness and crying out to God.':
    'Este pasaje habla de la soledad y de clamar a Dios.',
  "This passage addresses suffering and God's sufficiency in weakness.":
    'Este pasaje trata el sufrimiento y la suficiencia de Dios en la debilidad.',
  "This passage addresses temptation and God's faithfulness to provide a way out.":
    'Este pasaje trata la tentación y la fidelidad de Dios al proveer una salida.',
  'This passage is a call to bless the Lord and remember His benefits.':
    'Este pasaje llama a bendecir al Señor y recordar sus beneficios.',
  'This passage addresses trusting God for direction and purpose.':
    'Este pasaje trata de confiar en Dios para recibir dirección y propósito.',
  "This passage is Jesus' invitation to find rest in Him.":
    'Este pasaje es la invitación de Jesús a encontrar descanso en Él.',
  'This passage addresses doubt and the prayer for greater faith.':
    'Este pasaje trata la duda y la oración por una fe mayor.',
  'This passage addresses relational conflict and forgiveness.':
    'Este pasaje trata el conflicto en las relaciones y el perdón.',
  'A passage selected for your mood today.':
    'Un pasaje seleccionado para cómo te sientes hoy.',
  'A suggested passage for today.':
    'Un pasaje sugerido para hoy.',
};

export function localizeObservationPrompt(prompt: string | null | undefined, lang: 'en' | 'es'): string {
  if (!prompt || lang === 'en') return prompt ?? '';
  return SPANISH_OBSERVATION_PROMPTS[prompt] ?? prompt;
}

export function localizeWalkReason(reason: string | null | undefined, lang: 'en' | 'es'): string {
  if (!reason || lang === 'en') return reason ?? '';
  if (SPANISH_WALK_REASONS[reason]) return SPANISH_WALK_REASONS[reason];

  const continuing = reason.match(/^Continuing your study of (.+)\. This is passage (\d+) of (\d+)\.$/);
  if (continuing) {
    return `Continuando tu estudio de ${continuing[1]}. Este es el pasaje ${continuing[2]} de ${continuing[3]}.`;
  }

  const beginning = reason.match(/^Beginning your study of (.+)\.$/);
  if (beginning) {
    return `Comenzando tu estudio de ${beginning[1]}.`;
  }

  return reason;
}
