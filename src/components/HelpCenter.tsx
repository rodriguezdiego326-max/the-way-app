import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Church,
  Compass,
  Heart,
  HelpCircle,
  Home,
  Landmark,
  Languages,
  MessageSquare,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { vibrate } from '@/lib/utils';
import PurposeFilmPlayer from '@/components/PurposeFilmPlayer';

type GuideId =
  | 'overview'
  | 'today'
  | 'bible'
  | 'ask'
  | 'prayer'
  | 'explore'
  | 'activity'
  | 'family'
  | 'together'
  | 'my_church'
  | 'sermon_assistant'
  | 'reach'
  | 'legacy'
  | 'library'
  | 'privacy'
  | 'language';

type LocalizedCopy = {
  en: string;
  es: string;
};

type HelpFrame = {
  title: LocalizedCopy;
  body: LocalizedCopy;
  points?: LocalizedCopy[];
};

type HelpGuide = {
  id: GuideId;
  icon: typeof Home;
  title: LocalizedCopy;
  summary: LocalizedCopy;
  frames: HelpFrame[];
  narrated?: boolean;
  videoSrc?: LocalizedCopy;
};

const GUIDE_FRAME_MS = 4500;

const c = (en: string, es: string): LocalizedCopy => ({ en, es });

const GUIDES: HelpGuide[] = [
  {
    id: 'overview',
    icon: Volume2,
    title: c('What is SOLAPATH?', '¿Qué es SOLAPATH?'),
    summary: c('A narrated overview of why SOLAPATH exists and how the whole app works together.', 'Una introducción narrada sobre por qué existe SOLAPATH y cómo funciona toda la aplicación en conjunto.'),
    narrated: true,
    videoSrc: c('/videos/solapath-purpose-en.mp4', '/videos/solapath-purpose-es.mp4'),
    frames: [
      {
        title: c('Scripture at the center', 'La Escritura en el centro'),
        body: c(
          'SOLAPATH is a Christian discipleship app built to help Scripture shape everyday life. It supports discipleship without replacing the Bible, your church, your pastor, your family, or Christian community.',
          'SOLAPATH es una aplicación cristiana de discipulado creada para ayudar a que la Escritura forme la vida diaria. Apoya el discipulado sin reemplazar la Biblia, tu iglesia, tu pastor, tu familia ni la comunidad cristiana.',
        ),
      },
      {
        title: c('Walk, read, ask, and pray', 'Camina, lee, pregunta y ora'),
        body: c(
          'Today gives you a faithful starting point. Bible helps you read and study. Ask helps you work through biblical and life questions. Prayer keeps your personal prayer life organized.',
          'Hoy te da un punto de inicio fiel. Biblia te ayuda a leer y estudiar. Preguntar te ayuda con preguntas bíblicas y de la vida. Oración organiza tu vida personal de oración.',
        ),
      },
      {
        title: c('Disciple with real people', 'Discípula con personas reales'),
        body: c(
          'Family supports discipleship at home, while Together gives you private Circles for prayer, study, accountability, encouragement, and Christian conversation.',
          'Familia apoya el discipulado en el hogar, mientras Juntos ofrece Círculos privados para oración, estudio, rendición de cuentas, ánimo y conversación cristiana.',
        ),
      },
      {
        title: c('Stay connected to your church', 'Mantente conectado con tu iglesia'),
        body: c(
          'My Church connects SOLAPATH to your local congregation. Verified leadership can serve through church prayer and small groups, and verified pastors can publish church studies.',
          'Mi Iglesia conecta SOLAPATH con tu congregación local. El liderazgo verificado puede servir mediante oración y grupos pequeños, y los pastores verificados pueden publicar estudios de la iglesia.',
        ),
      },
      {
        title: c('Carry sermons into the week', 'Lleva el sermón a la semana'),
        body: c(
          'Sermon Assistant can capture a sermon, create a transcript, surface key insights, and help continue the sermon into Scripture, Ask, Family, or a Circle.',
          'El Asistente de Sermones puede capturar un sermón, crear una transcripción, destacar ideas clave y continuar el sermón en la Escritura, Preguntar, Familia o un Círculo.',
        ),
      },
      {
        title: c('Reach people and remember faithfulness', 'Alcanza personas y recuerda la fidelidad'),
        body: c(
          'REACH helps you pray for people and remember gospel conversations. Legacy helps you look back on seasons, prayers, Scripture, testimony, milestones, and God’s faithfulness.',
          'ALCANCE te ayuda a orar por personas y recordar conversaciones del evangelio. Legado te ayuda a mirar temporadas, oraciones, Escritura, testimonio, hitos y la fidelidad de Dios.',
        ),
      },
      {
        title: c('You stay in control', 'Tú mantienes el control'),
        body: c(
          'SOLAPATH includes controls for privacy, memory, notifications, exports, deletion, and language, with English and Spanish support throughout the app.',
          'SOLAPATH incluye controles de privacidad, memoria, notificaciones, exportaciones, eliminación e idioma, con soporte en inglés y español en toda la aplicación.',
        ),
      },
      {
        title: c('A tool for the road', 'Una herramienta para el camino'),
        body: c(
          'SOLAPATH is designed to help move from information to faithful action. Scripture remains the authority. Christ remains the center. Discipleship remains something we live out with real people, in real churches, in everyday life.',
          'SOLAPATH está diseñado para ayudarte a pasar de la información a la acción fiel. La Escritura sigue siendo la autoridad. Cristo sigue siendo el centro. El discipulado se vive con personas reales, en iglesias reales y en la vida cotidiana.',
        ),
      },
    ],
  },
  {
    id: 'today',
    icon: Home,
    title: c('Today', 'Hoy'),
    summary: c('Start your daily walk, check in, and see your next faithful step.', 'Comienza tu caminata diaria, registra cómo estás y ve tu próximo paso fiel.'),
    frames: [
      {
        title: c('Start on Today', 'Comienza en Hoy'),
        body: c('Today is your daily starting point. It gathers your current walk, check-in, and next step in one place.', 'Hoy es tu punto de inicio diario. Reúne tu caminata actual, tu registro y tu próximo paso en un solo lugar.'),
      },
      {
        title: c('Continue your walk', 'Continúa tu caminata'),
        body: c('Open the current Bible walk to read, reflect, study, or continue where you stopped.', 'Abre la caminata bíblica actual para leer, reflexionar, estudiar o continuar donde te quedaste.'),
      },
      {
        title: c('Check in honestly', 'Regístrate con sinceridad'),
        body: c('Use the feeling check-in to tell SOLAPATH how you are arriving today. It helps shape the experience without replacing Scripture.', 'Usa el registro de ánimo para indicar cómo llegas hoy. Esto ayuda a orientar la experiencia sin reemplazar la Escritura.'),
      },
    ],
  },
  {
    id: 'bible',
    icon: BookOpen,
    title: c('Bible', 'Biblia'),
    summary: c('Read, highlight, bookmark, take notes, and open guided passage study.', 'Lee, resalta, guarda marcadores, toma notas y abre estudios guiados.'),
    frames: [
      {
        title: c('Choose a passage', 'Elige un pasaje'),
        body: c('Use the book and chapter controls to move through Scripture. Your selected translation follows your language settings.', 'Usa los controles de libro y capítulo para recorrer la Escritura. La traducción seleccionada sigue tu configuración de idioma.'),
      },
      {
        title: c('Mark what matters', 'Marca lo importante'),
        body: c('Highlight words or verses, add bookmarks, and save notes so you can return to important passages later.', 'Resalta palabras o versículos, agrega marcadores y guarda notas para volver a pasajes importantes después.'),
      },
      {
        title: c('Go deeper', 'Profundiza'),
        body: c('Open passage study, cross references, notes, or Ask when you want help understanding the text.', 'Abre el estudio del pasaje, referencias cruzadas, notas o Preguntar cuando necesites ayuda para entender el texto.'),
      },
    ],
  },
  {
    id: 'ask',
    icon: MessageSquare,
    title: c('Ask', 'Preguntar'),
    summary: c('Ask biblical, theological, discipleship, and life questions with Scripture in view.', 'Haz preguntas bíblicas, teológicas, de discipulado y de vida con la Escritura a la vista.'),
    frames: [
      {
        title: c('Ask naturally', 'Pregunta con naturalidad'),
        body: c('Type your question the way you would ask a trusted Christian teacher. You can ask about Scripture, doctrine, doubts, or life situations.', 'Escribe tu pregunta como se la harías a un maestro cristiano de confianza. Puedes preguntar sobre Escritura, doctrina, dudas o situaciones de vida.'),
      },
      {
        title: c('Review the biblical basis', 'Revisa la base bíblica'),
        body: c('Read the answer together with the Scripture references and source context. SOLAPATH is meant to point you back to the Bible.', 'Lee la respuesta junto con las referencias bíblicas y el contexto de las fuentes. SOLAPATH está diseñado para llevarte de regreso a la Biblia.'),
      },
      {
        title: c('Continue connected questions', 'Continúa preguntas conectadas'),
        body: c('Family questions and Sermon Assistant insights can hand off directly into Ask so you can keep the same context.', 'Las preguntas de Familia y las perspectivas del Asistente de Sermones pueden pasar directamente a Preguntar para conservar el contexto.'),
      },
    ],
  },
  {
    id: 'prayer',
    icon: Heart,
    title: c('Prayer', 'Oración'),
    summary: c('Keep personal prayers, updates, answered prayers, and history organized.', 'Organiza oraciones personales, actualizaciones, respuestas e historial.'),
    frames: [
      {
        title: c('Create a prayer', 'Crea una oración'),
        body: c('Add a private prayer request and keep it separate from Church Prayer and shared Circle prayer.', 'Agrega una petición privada y mantenla separada de Oración de la Iglesia y de las oraciones compartidas en Círculos.'),
      },
      {
        title: c('Add updates', 'Agrega actualizaciones'),
        body: c('Return to a prayer as circumstances change and add updates instead of losing the history.', 'Vuelve a una oración cuando cambien las circunstancias y agrega actualizaciones sin perder el historial.'),
      },
      {
        title: c('Close or delete', 'Cierra o elimina'),
        body: c('Mark prayers answered or closed when appropriate. You can also permanently delete your own prayer.', 'Marca las oraciones como contestadas o cerradas cuando corresponda. También puedes eliminar permanentemente tus propias oraciones.'),
      },
    ],
  },
  {
    id: 'explore',
    icon: Compass,
    title: c('Explore', 'Explorar'),
    summary: c('Open Family, Together, My Church, REACH, Activity, settings, privacy, and more.', 'Abre Familia, Juntos, Mi Iglesia, Alcance, Actividad, configuración, privacidad y más.'),
    frames: [
      {
        title: c('Your feature hub', 'Tu centro de funciones'),
        body: c('Explore is where the larger SOLAPATH tools live beyond the five primary bottom-navigation sections.', 'Explorar es donde se encuentran las herramientas más amplias de SOLAPATH fuera de las cinco secciones principales.'),
      },
      {
        title: c('Open discipleship spaces', 'Abre espacios de discipulado'),
        body: c('Use Family for your household, Together for private Circles, My Church for local-church tools, and REACH for evangelism and discipleship care.', 'Usa Familia para tu hogar, Juntos para Círculos privados, Mi Iglesia para herramientas de la iglesia local y Alcance para evangelismo y discipulado.'),
      },
      {
        title: c('Manage your account', 'Administra tu cuenta'),
        body: c('Explore also gives you access to Activity, settings, memory controls, privacy, theological resources, and this Help Center.', 'Explorar también te da acceso a Actividad, configuración, controles de memoria, privacidad, recursos teológicos y este Centro de Ayuda.'),
      },
    ],
  },
  {
    id: 'activity',
    icon: Bell,
    title: c('Activity', 'Actividad'),
    summary: c('See new Family and Circle activity, read status, and notification preferences.', 'Ve actividad nueva de Familia y Círculos, estado de lectura y preferencias de notificación.'),
    frames: [
      {
        title: c('See what changed', 'Ve lo que cambió'),
        body: c('Activity collects supported Family and Circle events in one place so you can quickly see what is new.', 'Actividad reúne eventos compatibles de Familia y Círculos en un solo lugar para que puedas ver rápidamente qué hay de nuevo.'),
      },
      {
        title: c('Open the source', 'Abre el contenido'),
        body: c('Tap an Activity item to move into the relevant Family or Circle context instead of searching for it manually.', 'Toca un elemento de Actividad para ir al contexto correspondiente de Familia o Círculo sin tener que buscarlo manualmente.'),
      },
      {
        title: c('Control alerts', 'Controla las alertas'),
        body: c('Use Activity settings to choose the categories you want to see and whether this iPhone should receive supported push alerts.', 'Usa la configuración de Actividad para elegir las categorías que deseas ver y si este iPhone debe recibir alertas push compatibles.'),
      },
    ],
  },
  {
    id: 'family',
    icon: Users,
    title: c('Family', 'Familia'),
    summary: c('Household discipleship, child questions, catechism, parent guidance, prayer, and sermon discussion.', 'Discipulado del hogar, preguntas de niños, catecismo, guía para padres, oración y sermones.'),
    frames: [
      {
        title: c('Build your household', 'Configura tu hogar'),
        body: c('Create your Family and add household members with age ranges so age-aware discipleship tools can respond appropriately.', 'Crea tu Familia y agrega miembros del hogar con rangos de edad para que las herramientas de discipulado se adapten correctamente.'),
      },
      {
        title: c('Disciple together', 'Discipulen juntos'),
        body: c('Use Family Walk, Catechism, Parent Guide, Family Prayer, and sermon discussions as shared discipleship tools.', 'Usa Caminata Familiar, Catecismo, Guía para Padres, Oración Familiar y conversaciones de sermones como herramientas compartidas.'),
      },
      {
        title: c('Handle hard questions', 'Aborda preguntas difíciles'),
        body: c('Use My Child Asked to prepare a faithful response, then hand the question to Ask when you want deeper help.', 'Usa Mi hijo preguntó para preparar una respuesta fiel y luego envía la pregunta a Preguntar cuando necesites más profundidad.'),
      },
    ],
  },
  {
    id: 'together',
    icon: Users,
    title: c('Together', 'Juntos'),
    summary: c('Private Circles for prayer, Bible study, accountability, encouragement, and sermon discussion.', 'Círculos privados para oración, estudio bíblico, rendición de cuentas, ánimo y sermones.'),
    frames: [
      {
        title: c('Create or join a Circle', 'Crea o únete a un Círculo'),
        body: c('Create a private Circle or join one through an invitation. Circle content stays inside that Circle.', 'Crea un Círculo privado o únete mediante una invitación. El contenido permanece dentro de ese Círculo.'),
      },
      {
        title: c('Share intentionally', 'Comparte con intención'),
        body: c('Use shared prayer, Scripture study, check-ins, encouragement, and sermon discussions to strengthen real Christian relationships.', 'Usa oración compartida, estudio bíblico, registros, ánimo y conversaciones de sermones para fortalecer relaciones cristianas reales.'),
      },
      {
        title: c('Keep people central', 'Mantén a las personas en el centro'),
        body: c('Together is designed to support real relationships, not replace your local church, family, pastor, or Christian community.', 'Juntos está diseñado para apoyar relaciones reales, no para reemplazar tu iglesia local, familia, pastor o comunidad cristiana.'),
      },
    ],
  },
  {
    id: 'my_church',
    icon: Church,
    title: c('My Church', 'Mi Iglesia'),
    summary: c('Connect to your local church, studies, prayer, small groups, leadership, and sermons.', 'Conéctate con tu iglesia local, estudios, oración, grupos pequeños, liderazgo y sermones.'),
    frames: [
      {
        title: c('Connect your church', 'Conecta tu iglesia'),
        body: c('Search for your church, join it, and keep your church tools connected to the correct congregation.', 'Busca tu iglesia, únete y mantén las herramientas conectadas con la congregación correcta.'),
      },
      {
        title: c('Understand verified roles', 'Entiende las funciones verificadas'),
        body: c('Only a verified Pastor can publish Church Studies. Verified Pastor, Church Admin, Elder, and Leader roles can manage Church Prayer and Small Groups.', 'Solo un Pastor verificado puede publicar Estudios de la Iglesia. Pastor, Administrador, Anciano y Líder verificados pueden administrar Oración y Grupos Pequeños.'),
      },
      {
        title: c('Use Small Groups privately', 'Usa Grupos Pequeños con privacidad'),
        body: c('Verified church leadership can see all church Small Groups. Ordinary members see only groups they have joined through an invitation.', 'El liderazgo verificado puede ver todos los Grupos Pequeños de la iglesia. Los miembros comunes solo ven los grupos a los que se unieron mediante invitación.'),
      },
    ],
  },
  {
    id: 'sermon_assistant',
    icon: Mic,
    title: c('Sermon Assistant', 'Asistente de Sermones'),
    summary: c('Record a sermon, review the transcript, and continue into Scripture and discussion.', 'Graba un sermón, revisa la transcripción y continúa hacia la Escritura y la conversación.'),
    frames: [
      {
        title: c('Start a recording', 'Inicia una grabación'),
        body: c('Open Sermon Assistant and tap Record Sermon. Keep your iPhone positioned where the sermon audio is clear.', 'Abre Asistente de Sermones y toca Grabar sermón. Coloca tu iPhone donde el audio del sermón se escuche claramente.'),
      },
      {
        title: c('Review the transcript', 'Revisa la transcripción'),
        body: c('After recording, review the transcript and generated sermon insights. You stay in control of the saved recording.', 'Después de grabar, revisa la transcripción y las perspectivas generadas. Tú mantienes el control de la grabación guardada.'),
      },
      {
        title: c('Continue the sermon', 'Continúa con el sermón'),
        body: c('Open referenced Scripture, continue an insight in Ask, or share discussion into Family or a Circle when appropriate.', 'Abre la Escritura mencionada, continúa una perspectiva en Preguntar o comparte una conversación con Familia o un Círculo cuando corresponda.'),
      },
    ],
  },
  {
    id: 'reach',
    icon: Compass,
    title: c('REACH', 'ALCANCE'),
    summary: c('Pray for people, remember conversations, and follow patient discipleship journeys.', 'Ora por personas, recuerda conversaciones y acompaña procesos pacientes de discipulado.'),
    frames: [
      {
        title: c('Add people you care about', 'Agrega personas por quienes oras'),
        body: c('Use People I’m Praying For to remember who you are praying for and what their current situation is.', 'Usa Personas por quienes oro para recordar por quién estás orando y cuál es su situación actual.'),
      },
      {
        title: c('Prepare for conversations', 'Prepárate para conversaciones'),
        body: c('Use They Asked Me, Gospel Conversation, Apologetics Coach, and Bible Trails to prepare thoughtful biblical responses.', 'Usa Me preguntaron, Conversación del Evangelio, Entrenador de Apologética y Rutas Bíblicas para preparar respuestas bíblicas consideradas.'),
      },
      {
        title: c('Walk patiently', 'Acompaña con paciencia'),
        body: c('Prodigal Journey helps you keep prayer, Scripture, reflections, and updates together over a longer season.', 'Camino del Pródigo te ayuda a mantener oración, Escritura, reflexiones y actualizaciones juntas durante una temporada más larga.'),
      },
    ],
  },
  {
    id: 'legacy',
    icon: Landmark,
    title: c('Legacy', 'Legado'),
    summary: c('Look back on God’s faithfulness through seasons, prayers, Scripture, testimony, and milestones.', 'Mira hacia atrás a la fidelidad de Dios mediante temporadas, oraciones, Escritura, testimonio e hitos.'),
    frames: [
      {
        title: c('Review the journey', 'Revisa el camino'),
        body: c('Legacy brings together long-term reflections so you can remember seasons, answered prayers, Scripture, and milestones over time.', 'Legado reúne reflexiones a largo plazo para que recuerdes temporadas, oraciones contestadas, Escritura e hitos con el paso del tiempo.'),
      },
      {
        title: c('Build a testimony', 'Construye un testimonio'),
        body: c('Use testimony, faithfulness, letters, and year review tools to record what God has taught you without turning the app into the source of that story.', 'Usa testimonio, fidelidad, cartas y revisión anual para registrar lo que Dios te ha enseñado sin convertir la app en la fuente de esa historia.'),
      },
      {
        title: c('Keep private things private', 'Mantén lo privado en privado'),
        body: c('Legacy entries stay under the same account privacy model as your other personal SOLAPATH content.', 'Las entradas de Legado permanecen bajo el mismo modelo de privacidad de cuenta que tu otro contenido personal de SOLAPATH.'),
      },
    ],
  },
  {
    id: 'library',
    icon: BookOpen,
    title: c('Library & Confessions', 'Biblioteca y Confesiones'),
    summary: c('Search trusted theological sources and browse confessional resources.', 'Busca fuentes teológicas confiables y explora recursos confesionales.'),
    frames: [
      {
        title: c('Search trusted sources', 'Busca fuentes confiables'),
        body: c('Use the theological library to search curated Reformed and historic Christian sources that support deeper study.', 'Usa la biblioteca teológica para buscar fuentes reformadas e históricas cristianas seleccionadas que apoyan un estudio más profundo.'),
      },
      {
        title: c('Browse confessional resources', 'Explora recursos confesionales'),
        body: c('Open the confessional library to review catechisms and confessional documents available inside SOLAPATH.', 'Abre la biblioteca confesional para revisar catecismos y documentos confesionales disponibles dentro de SOLAPATH.'),
      },
      {
        title: c('Use sources as support', 'Usa las fuentes como apoyo'),
        body: c('The library helps explain and contextualize doctrine, but Scripture remains the final authority for faith and practice.', 'La biblioteca ayuda a explicar y contextualizar la doctrina, pero la Escritura sigue siendo la autoridad final para la fe y la práctica.'),
      },
    ],
  },
  {
    id: 'privacy',
    icon: ShieldCheck,
    title: c('Privacy & Memory', 'Privacidad y Memoria'),
    summary: c('Control remembered context, exports, deletion, AI consent, and account privacy.', 'Controla contexto recordado, exportaciones, eliminación, consentimiento de IA y privacidad.'),
    frames: [
      {
        title: c('Control memory', 'Controla la memoria'),
        body: c('Review remembered context, turn memory off, or delete individual and all memories from your account controls.', 'Revisa el contexto recordado, desactiva la memoria o elimina memorias individuales o todas desde los controles de tu cuenta.'),
      },
      {
        title: c('Export your data', 'Exporta tus datos'),
        body: c('Privacy Center lets you create a sanitized export of your SOLAPATH data and share or save it from your device.', 'El Centro de Privacidad te permite crear una exportación depurada de tus datos de SOLAPATH y compartirla o guardarla desde tu dispositivo.'),
      },
      {
        title: c('Delete when you choose', 'Elimina cuando tú decidas'),
        body: c('You can delete prayers, journeys, family members, sermon notes, and your entire account through their protected confirmation flows.', 'Puedes eliminar oraciones, caminos, miembros de la familia, notas de sermones y toda tu cuenta mediante flujos de confirmación protegidos.'),
      },
    ],
  },
  {
    id: 'language',
    icon: Languages,
    title: c('Language & Navigation', 'Idioma y Navegación'),
    summary: c('Switch English or Spanish and move quickly through SOLAPATH.', 'Cambia entre inglés y español y navega rápidamente por SOLAPATH.'),
    frames: [
      {
        title: c('Use the bottom navigation', 'Usa la navegación inferior'),
        body: c('Today, Bible, Ask, Prayer, and Explore are always your five primary destinations.', 'Hoy, Biblia, Preguntar, Oración y Explorar son siempre tus cinco destinos principales.'),
      },
      {
        title: c('Use Home in deeper flows', 'Usa Inicio en secciones profundas'),
        body: c('In deeper Church and Together flows, the floating Home control returns you directly to Today.', 'En secciones profundas de Iglesia y Juntos, el control flotante Inicio te lleva directamente a Hoy.'),
      },
      {
        title: c('Change language anytime', 'Cambia el idioma cuando quieras'),
        body: c('Open Settings to switch the app between English and Spanish. The selected language persists when you relaunch or sign back in.', 'Abre Configuración para cambiar la app entre inglés y español. El idioma seleccionado permanece al volver a abrir la app o iniciar sesión.'),
      },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  currentGuideId?: GuideId;
}

function localize(copy: LocalizedCopy, language: 'en' | 'es'): string {
  return copy[language];
}

export default function HelpCenter({ open, onClose, currentGuideId }: Props) {
  const { language } = useLanguage();
  const [selectedId, setSelectedId] = useState<GuideId | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const narrationRunRef = useRef(0);

  const selected = useMemo(
    () => GUIDES.find((guide) => guide.id === selectedId) ?? null,
    [selectedId],
  );

  useEffect(() => {
    if (!open) {
      narrationRunRef.current += 1;
      window.speechSynthesis?.cancel();
      setSelectedId(null);
      setFrameIndex(0);
      setPlaying(false);
      setAudioProgress(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !selected || !playing || selected.narrated) return;
    const timer = window.setTimeout(() => {
      if (frameIndex >= selected.frames.length - 1) {
        setPlaying(false);
        return;
      }
      setFrameIndex((index) => index + 1);
    }, GUIDE_FRAME_MS);
    return () => window.clearTimeout(timer);
  }, [frameIndex, open, playing, selected]);

  useEffect(() => {
    if (!selected?.narrated) return;
    narrationRunRef.current += 1;
    window.speechSynthesis?.cancel();
    setFrameIndex(0);
    setPlaying(false);
    setAudioProgress(0);
  }, [language, selected?.id, selected?.narrated]);

  if (!open) return null;

  const chooseGuide = (id: GuideId) => {
    vibrate(8);
    narrationRunRef.current += 1;
    window.speechSynthesis?.cancel();
    setSelectedId(id);
    setFrameIndex(0);
    setAudioProgress(0);
    const guide = GUIDES.find((item) => item.id === id);
    setPlaying(!guide?.narrated);
  };

  const close = () => {
    vibrate(8);
    onClose();
  };

  const current = GUIDES.find((guide) => guide.id === currentGuideId);
  const CurrentIcon = current?.icon;
  const speakNarratedFrame = (index: number, runId: number) => {
    if (!selected?.narrated || !('speechSynthesis' in window)) {
      setPlaying(false);
      return;
    }
    const bounded = Math.max(0, Math.min(selected.frames.length - 1, index));
    const frame = selected.frames[bounded];
    const utterance = new SpeechSynthesisUtterance(
      `${localize(frame.title, language)}. ${localize(frame.body, language)}`,
    );
    utterance.lang = language === 'es' ? 'es-US' : 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1;
    const preferredVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith(language === 'es' ? 'es' : 'en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      if (runId !== narrationRunRef.current) return;
      setFrameIndex(bounded);
      setPlaying(true);
      setAudioProgress((bounded / selected.frames.length) * 100);
    };
    utterance.onend = () => {
      if (runId !== narrationRunRef.current) return;
      const next = bounded + 1;
      if (next >= selected.frames.length) {
        setFrameIndex(selected.frames.length - 1);
        setAudioProgress(100);
        setPlaying(false);
        return;
      }
      setFrameIndex(next);
      setAudioProgress((next / selected.frames.length) * 100);
      window.setTimeout(() => {
        if (runId === narrationRunRef.current) speakNarratedFrame(next, runId);
      }, 180);
    };
    utterance.onerror = () => {
      if (runId !== narrationRunRef.current) return;
      setPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const seekNarratedFrame = (nextFrame: number, shouldPlay = false) => {
    if (!selected?.narrated) return;
    narrationRunRef.current += 1;
    window.speechSynthesis?.cancel();
    const bounded = Math.max(0, Math.min(selected.frames.length - 1, nextFrame));
    setFrameIndex(bounded);
    setAudioProgress((bounded / selected.frames.length) * 100);
    setPlaying(false);
    if (shouldPlay) {
      const runId = narrationRunRef.current;
      window.setTimeout(() => speakNarratedFrame(bounded, runId), 80);
    }
  };

  const togglePlayback = () => {
    if (!selected) return;
    vibrate(8);
    if (!selected.narrated) {
      if (frameIndex === selected.frames.length - 1 && !playing) setFrameIndex(0);
      setPlaying((value) => !value);
      return;
    }

    if (!('speechSynthesis' in window)) {
      setPlaying(false);
      return;
    }
    if (playing) {
      narrationRunRef.current += 1;
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const startFrame = frameIndex >= selected.frames.length - 1 && audioProgress >= 100 ? 0 : frameIndex;
    if (startFrame === 0 && frameIndex !== 0) setFrameIndex(0);
    narrationRunRef.current += 1;
    const runId = narrationRunRef.current;
    window.speechSynthesis.cancel();
    window.setTimeout(() => speakNarratedFrame(startFrame, runId), 80);
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-ink-950/75 backdrop-blur-sm animate-fade-in">
      <button type="button" aria-label={language === 'es' ? 'Cerrar ayuda' : 'Close help'} className="absolute inset-0" onClick={close} />

      <section className="relative flex h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] border border-ink-700/70 bg-ink-900 shadow-2xl animate-fade-in-up">
        <header className="flex items-center justify-between border-b border-ink-700/60 px-5 pb-4 pt-5 safe-top">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gold-500/20 bg-gold-500/10">
              <HelpCircle size={20} className="text-gold-300" />
            </div>
            <div>
              <p className="font-serif text-xl text-ivory-50">{language === 'es' ? 'Ayuda y videos' : 'Help & Video Guides'}</p>
              <p className="text-[11px] text-ivory-500">{language === 'es' ? 'Guías rápidas dentro de SOLAPATH' : 'Quick guides inside SOLAPATH'}</p>
            </div>
          </div>
          <button type="button" onClick={close} className="btn-ghost" aria-label={language === 'es' ? 'Cerrar' : 'Close'}>
            <X size={20} />
          </button>
        </header>

        {!selected ? (
          <div className="flex-1 overflow-y-auto px-5 pb-10 pt-5">
            {current && CurrentIcon && (
              <button
                type="button"
                onClick={() => chooseGuide(current.id)}
                className="mb-5 w-full rounded-2xl border border-gold-500/25 bg-gold-500/10 p-4 text-left"
              >
                <p className="ui-label text-gold-300">{language === 'es' ? 'Tu sección actual' : 'Your current section'}</p>
                <div className="mt-2 flex items-center gap-3">
                  <CurrentIcon size={20} className="text-gold-300" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ivory-50">{localize(current.title, language)}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ivory-400">{localize(current.summary, language)}</p>
                  </div>
                  <Play size={17} className="shrink-0 text-gold-300" />
                </div>
              </button>
            )}

            <p className="ui-label mb-3">{language === 'es' ? 'Videos de ayuda' : 'Help videos'}</p>
            <div className="flex flex-col gap-3">
              {GUIDES.map((guide) => {
                const Icon = guide.icon;
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => chooseGuide(guide.id)}
                    className="premium-card flex items-center gap-4 p-4 text-left transition-transform active:scale-[0.99]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-ink-600 bg-ink-800">
                      <Icon size={20} className="text-gold-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ivory-50">{localize(guide.title, language)}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide ${guide.narrated ? 'bg-gold-500/15 text-gold-300' : 'bg-ink-700 text-ivory-500'}`}>
                          {guide.videoSrc
                            ? (language === 'es' ? 'película' : 'film')
                            : guide.narrated
                              ? (language === 'es' ? 'con narración' : 'narrated')
                              : (language === 'es' ? 'video corto' : 'quick video')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ivory-500">{localize(guide.summary, language)}</p>
                    </div>
                    {guide.narrated
                      ? <Volume2 size={16} className="shrink-0 text-gold-300" />
                      : <Play size={16} className="shrink-0 text-ivory-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : selected.videoSrc ? (
          <PurposeFilmPlayer
            src={localize(selected.videoSrc, language)}
            title={localize(selected.title, language)}
            onBack={() => {
              vibrate(8);
              setSelectedId(null);
              setPlaying(false);
            }}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  vibrate(8);
                  narrationRunRef.current += 1;
                  window.speechSynthesis?.cancel();
                  setSelectedId(null);
                  setPlaying(false);
                  setAudioProgress(0);
                }}
                className="btn-ghost"
                aria-label={language === 'es' ? 'Volver a videos' : 'Back to videos'}
              >
                <ChevronLeft size={18} />
              </button>
              <p className="flex-1 truncate text-center text-sm font-medium text-ivory-200">{localize(selected.title, language)}</p>
              <span className="w-10 text-right text-[10px] text-ivory-600">{frameIndex + 1}/{selected.frames.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <div className="overflow-hidden rounded-3xl border border-ink-700 bg-ink-950 shadow-xl">
                <div className="relative aspect-[9/12] min-h-[390px] overflow-hidden bg-gradient-to-b from-ink-850 to-ink-950 p-6">
                  <div className="absolute inset-x-0 top-0 h-1 bg-ink-700">
                    <div
                      className="h-full bg-gold-400 transition-all duration-500"
                      style={{ width: `${selected.narrated ? audioProgress : ((frameIndex + 1) / selected.frames.length) * 100}%` }}
                    />
                  </div>

                  {(() => {
                    const Icon = selected.icon;
                    const frame = selected.frames[frameIndex];
                    return (
                      <div key={frameIndex} className="flex h-full flex-col animate-fade-in-up">
                        <div className="mt-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-gold-500/20 bg-gold-500/10">
                          <Icon size={28} className="text-gold-300" />
                        </div>
                        <p className="ui-label mt-8 text-gold-300">{localize(selected.title, language)}</p>
                        <h2 className="mt-2 font-serif text-3xl leading-tight text-ivory-50">{localize(frame.title, language)}</h2>
                        <p className="mt-4 text-sm leading-relaxed text-ivory-300">{localize(frame.body, language)}</p>
                        {frame.points && (
                          <div className="mt-5 flex flex-col gap-2">
                            {frame.points.map((point) => (
                              <div key={point.en} className="rounded-2xl border border-ink-700 bg-ink-850/70 px-4 py-3 text-xs leading-relaxed text-ivory-300">
                                {localize(point, language)}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-auto pt-8 text-center text-[10px] uppercase tracking-[0.18em] text-ivory-600">
                          {playing
                            ? (language === 'es' ? 'Reproduciendo' : 'Playing')
                            : (language === 'es' ? 'En pausa' : 'Paused')}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-ink-700 bg-ink-850 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(6);
                      if (selected.narrated) {
                        seekNarratedFrame(frameIndex - 1, playing);
                      } else {
                        setPlaying(false);
                        setFrameIndex((index) => Math.max(0, index - 1));
                      }
                    }}
                    disabled={frameIndex === 0}
                    className="btn-ghost disabled:opacity-30"
                    aria-label={language === 'es' ? 'Anterior' : 'Previous'}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={togglePlayback}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-400 text-ink-950 shadow-lg"
                    aria-label={playing ? (language === 'es' ? 'Pausar' : 'Pause') : (language === 'es' ? 'Reproducir' : 'Play')}
                  >
                    {playing ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrate(6);
                      if (selected.narrated) {
                        if (frameIndex >= selected.frames.length - 1) {
                          narrationRunRef.current += 1;
                          window.speechSynthesis?.cancel();
                          setFrameIndex(0);
                          setAudioProgress(0);
                          const runId = narrationRunRef.current;
                          window.setTimeout(() => speakNarratedFrame(0, runId), 80);
                        } else {
                          seekNarratedFrame(frameIndex + 1, playing);
                        }
                      } else if (frameIndex >= selected.frames.length - 1) {
                        setFrameIndex(0);
                        setPlaying(true);
                      } else {
                        setPlaying(false);
                        setFrameIndex((index) => index + 1);
                      }
                    }}
                    className="btn-ghost"
                    aria-label={frameIndex >= selected.frames.length - 1 ? (language === 'es' ? 'Repetir' : 'Replay') : (language === 'es' ? 'Siguiente' : 'Next')}
                  >
                    {frameIndex >= selected.frames.length - 1 ? <RotateCcw size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-ivory-600">
                {selected.narrated
                  ? (language === 'es'
                    ? 'La narración por voz del dispositivo y las imágenes permanecen sincronizadas mientras se reproduce.'
                    : 'Device voice narration and visuals stay synchronized while the overview plays.')
                  : (language === 'es'
                    ? 'Estas guías se reproducen dentro de SOLAPATH y no abren sitios externos.'
                    : 'These guides play inside SOLAPATH and do not open an external website.')}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export type { GuideId };
