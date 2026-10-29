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
