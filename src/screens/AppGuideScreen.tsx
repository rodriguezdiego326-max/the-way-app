import { useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Church,
  Compass,
  Heart,
  Home,
  Languages,
  MessageSquare,
  Mic,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

interface Props {
  onFinish: () => void;
  onClose: () => void;
}

type GuideStep = {
  icon: typeof Home;
  en: { title: string; body: string; bullets: string[] };
  es: { title: string; body: string; bullets: string[] };
};

const STEPS: GuideStep[] = [
  {
    icon: Home,
    en: {
      title: 'Today',
      body: 'Your daily starting point. SOLAPATH brings your current walk, check-in, and next faithful step into one place.',
      bullets: ['Start or continue a Bible walk.', 'Record how you are doing today.', 'Return here anytime with the Home button.'],
    },
    es: {
      title: 'Hoy',
      body: 'Tu punto de inicio diario. SOLAPATH reúne tu caminata actual, tu registro y tu próximo paso fiel en un solo lugar.',
      bullets: ['Comienza o continúa una caminata bíblica.', 'Registra cómo estás hoy.', 'Vuelve aquí en cualquier momento con el botón Inicio.'],
    },
  },
  {
    icon: BookOpen,
    en: {
      title: 'Bible',
      body: 'Read Scripture, mark passages, save bookmarks and notes, and move from reading into guided study.',
      bullets: ['Choose your Bible translation.', 'Highlight words or verses and create marking keys.', 'Open passage study, notes, bookmarks, and cross references.'],
    },
    es: {
      title: 'Biblia',
      body: 'Lee la Escritura, marca pasajes, guarda marcadores y notas, y pasa de la lectura al estudio guiado.',
      bullets: ['Elige tu traducción bíblica.', 'Resalta palabras o versículos y crea claves de marcado.', 'Abre estudios de pasajes, notas, marcadores y referencias cruzadas.'],
    },
  },
  {
    icon: MessageSquare,
    en: {
      title: 'Ask',
      body: 'Ask biblical and theological questions. SOLAPATH is designed to point you back to Scripture rather than replace it.',
      bullets: ['Ask about a passage, doctrine, life situation, doubt, or discipleship question.', 'Continue questions handed off from Family or Sermon Insights.', 'Review Scripture and source context alongside answers.'],
    },
    es: {
      title: 'Preguntar',
      body: 'Haz preguntas bíblicas y teológicas. SOLAPATH está diseñado para llevarte de regreso a la Escritura, no para reemplazarla.',
      bullets: ['Pregunta sobre un pasaje, doctrina, situación de vida, duda o discipulado.', 'Continúa preguntas enviadas desde Familia o Perspectivas del Sermón.', 'Revisa la Escritura y el contexto de las fuentes junto con las respuestas.'],
    },
  },
  {
    icon: Heart,
    en: {
      title: 'Prayer',
      body: 'Keep personal prayers, updates, answered prayers, and prayer history organized without mixing private prayer with church content.',
      bullets: ['Create and update personal prayers.', 'Mark prayers answered or closed.', 'Church Prayer is separate and managed only by verified church leadership.'],
    },
    es: {
      title: 'Oración',
      body: 'Organiza tus oraciones personales, actualizaciones, oraciones contestadas e historial sin mezclar la oración privada con el contenido de la iglesia.',
      bullets: ['Crea y actualiza oraciones personales.', 'Marca oraciones como contestadas o cerradas.', 'Oración de la Iglesia es separada y solo la administra liderazgo verificado.'],
    },
  },
  {
    icon: Compass,
    en: {
      title: 'Explore',
      body: 'Explore is the hub for the rest of SOLAPATH: Family, Together, My Church, REACH, activity, privacy, settings, and your theological library.',
      bullets: ['Open Family and household discipleship.', 'Open Together and private Circles.', 'Open My Church, REACH, settings, privacy, and this guide.'],
    },
    es: {
      title: 'Explorar',
      body: 'Explorar es el centro para el resto de SOLAPATH: Familia, Juntos, Mi Iglesia, Alcance, actividad, privacidad, configuración y biblioteca teológica.',
      bullets: ['Abre Familia y discipulado del hogar.', 'Abre Juntos y círculos privados.', 'Abre Mi Iglesia, Alcance, configuración, privacidad y esta guía.'],
    },
  },
  {
    icon: Users,
    en: {
      title: 'Together',
      body: 'Private Circles are for marriage, family, Bible study, prayer, accountability, discipleship, friends, and small-group life.',
      bullets: ['Circle owners can create or delete their own Circle.', 'Share prayer, Scripture study, check-ins, encouragement, and sermon discussions.', 'Circle content stays inside that Circle.'],
    },
    es: {
      title: 'Juntos',
      body: 'Los círculos privados sirven para matrimonio, familia, estudio bíblico, oración, rendición de cuentas, discipulado, amistades y grupos pequeños.',
      bullets: ['El propietario puede crear o eliminar su propio círculo.', 'Comparte oración, estudio bíblico, registros, ánimo y conversaciones de sermones.', 'El contenido del círculo permanece dentro de ese círculo.'],
    },
  },
  {
    icon: Church,
    en: {
      title: 'My Church',
      body: 'Connect SOLAPATH to your local church. Verified roles control what church leadership can publish or manage.',
      bullets: ['Only a verified Pastor can create and manage Church Studies.', 'Verified Pastor, Church Admin, Elder, and Leader can manage Church Prayer and create Small Groups.', 'Leadership sees all Small Groups; ordinary members see only groups they joined by invite.'],
    },
    es: {
      title: 'Mi Iglesia',
      body: 'Conecta SOLAPATH con tu iglesia local. Las funciones verificadas controlan lo que el liderazgo puede publicar o administrar.',
      bullets: ['Solo un Pastor verificado puede crear y administrar Estudios de la Iglesia.', 'Pastor, Administrador, Anciano y Líder verificados pueden administrar Oración de la Iglesia y crear Grupos Pequeños.', 'El liderazgo ve todos los grupos; los miembros comunes solo ven los grupos a los que se unieron por invitación.'],
    },
  },
  {
    icon: Mic,
    en: {
      title: 'Sermon Assistant',
      body: 'Capture a sermon, review the transcript, and work through sermon insights without losing the connection back to Scripture.',
      bullets: ['Record a sermon on supported iPhones.', 'Review transcript and insights.', 'Continue insights in Ask, Family, Together, or Scripture.'],
    },
    es: {
      title: 'Asistente de sermones',
      body: 'Captura un sermón, revisa la transcripción y trabaja con sus perspectivas sin perder la conexión con la Escritura.',
      bullets: ['Graba un sermón en iPhone compatibles.', 'Revisa la transcripción y las perspectivas.', 'Continúa en Preguntar, Familia, Juntos o Escritura.'],
    },
  },
  {
    icon: Users,
    en: {
      title: 'Family',
      body: 'Family supports household discipleship with child questions, catechism, parent guidance, prayer, family walks, and sermon discussions.',
      bullets: ['Create household profiles.', 'Use age-aware catechism and Parent Guide content.', 'Send a child question into Ask and return to Family when finished.'],
    },
    es: {
      title: 'Familia',
      body: 'Familia apoya el discipulado del hogar con preguntas de niños, catecismo, guía para padres, oración, caminatas familiares y conversaciones de sermones.',
      bullets: ['Crea perfiles del hogar.', 'Usa catecismo por edad y contenido de la Guía para Padres.', 'Envía una pregunta de un niño a Preguntar y regresa a Familia al terminar.'],
    },
  },
  {
    icon: Users,
    en: {
      title: 'REACH',
      body: 'REACH helps you pray for people, remember conversations, and follow a patient discipleship or evangelism journey.',
      bullets: ['Add people you are praying for.', 'Keep notes and next steps.', 'Use Prodigal Journey for longer-term prayer and care.'],
    },
    es: {
      title: 'Alcance',
      body: 'Alcance te ayuda a orar por personas, recordar conversaciones y seguir un camino paciente de discipulado o evangelismo.',
      bullets: ['Agrega personas por quienes estás orando.', 'Guarda notas y próximos pasos.', 'Usa Camino del Pródigo para oración y cuidado a largo plazo.'],
    },
  },
  {
    icon: ShieldCheck,
    en: {
      title: 'Privacy, Memory & Roles',
      body: 'You control remembered context, exports, deletion, and account privacy. Church privileges never come from a self-selected title.',
      bullets: ['Review, export, disable, or delete remembered context.', 'Pastor access requires SOLAPATH identity verification.', 'Church Admin, Elder, and Leader access requires authorization from verified church leadership or SOLAPATH Admin.'],
    },
    es: {
      title: 'Privacidad, memoria y funciones',
      body: 'Tú controlas el contexto recordado, las exportaciones, la eliminación y la privacidad de la cuenta. Los privilegios de iglesia nunca provienen de un título elegido por uno mismo.',
      bullets: ['Revisa, exporta, desactiva o elimina el contexto recordado.', 'El acceso de Pastor requiere verificación de identidad por SOLAPATH.', 'Administrador, Anciano y Líder requieren autorización de liderazgo verificado o del Administrador de SOLAPATH.'],
    },
  },
  {
    icon: Languages,
    en: {
      title: 'Language & Navigation',
      body: 'SOLAPATH currently supports English and Spanish interface modes. You can switch language later in Settings.',
      bullets: ['Use the bottom navigation for Today, Bible, Ask, Prayer, and Explore.', 'Use the floating Home button in deep Together and Church flows to return directly to Today.', 'Reopen this App Guide from Explore whenever you need it.'],
    },
    es: {
      title: 'Idioma y navegación',
      body: 'SOLAPATH actualmente admite interfaces en inglés y español. Puedes cambiar el idioma después en Configuración.',
      bullets: ['Usa la navegación inferior para Hoy, Biblia, Preguntar, Oración y Explorar.', 'Usa el botón flotante Inicio en las secciones profundas de Juntos e Iglesia para volver directamente a Hoy.', 'Vuelve a abrir esta Guía desde Explorar cuando la necesites.'],
    },
  },
];

export default function AppGuideScreen({ onFinish, onClose }: Props) {
  const { language } = useLanguage();
  const [step, setStep] = useState(0);
  const item = STEPS[step];
  const copy = language === 'es' ? item.es : item.en;
  const Icon = item.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button type="button" onClick={onClose} className="btn-ghost" aria-label={language === 'es' ? 'Cerrar guía' : 'Close guide'}>
          <X size={20} />
        </button>
        <p className="ui-label">{language === 'es' ? 'Guía de SOLAPATH' : 'SOLAPATH Guide'}</p>
        <span className="text-ivory-600 text-xs">{step + 1}/{STEPS.length}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all ${index <= step ? 'bg-gold-400/70' : 'bg-ink-700'}`}
            />
          ))}
        </div>

        <div className="animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-6">
            <Icon size={24} className="text-gold-300" />
          </div>
          <h1 className="font-serif text-4xl text-ivory-50 leading-tight">{copy.title}</h1>
          <p className="text-ivory-400 text-sm leading-relaxed mt-4">{copy.body}</p>

          <div className="flex flex-col gap-3 mt-7">
            {copy.bullets.map((bullet) => (
              <div key={bullet} className="premium-card p-4 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-gold-300 text-xs">✓</span>
                </div>
                <p className="text-ivory-300 text-sm leading-relaxed">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-10 safe-bottom flex gap-2">
        <button
          type="button"
          onClick={() => { vibrate(8); setStep((s) => Math.max(0, s - 1)); }}
          disabled={step === 0}
          className="btn-secondary flex-1 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
          {language === 'es' ? 'Atrás' : 'Back'}
        </button>
        <button
          type="button"
          onClick={() => {
            vibrate(8);
            if (isLast) onFinish();
            else setStep((s) => s + 1);
          }}
          className="btn-primary flex-1"
        >
          {isLast ? (language === 'es' ? 'Terminar' : 'Finish') : (language === 'es' ? 'Siguiente' : 'Next')}
          {!isLast && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
