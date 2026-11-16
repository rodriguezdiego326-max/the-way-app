import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AppLanguage = 'en' | 'es';

const STORAGE_KEY = 'solapath_ui_language';
const SCRIPTURE_STORAGE_KEY = 'solapath_translation';

const ES: Record<string, string> = {
  'Today': 'Hoy',
  'Bible': 'Biblia',
  'Ask': 'Preguntar',
  'Prayer': 'Oración',
  'Explore': 'Explorar',
  'Home': 'Inicio',
  'Back': 'Atrás',
  'Cancel': 'Cancelar',
  'Save': 'Guardar',
  'Edit': 'Editar',
  'Delete': 'Eliminar',
  'Close': 'Cerrar',
  'Continue': 'Continuar',
  'Begin': 'Comenzar',
  'Loading...': 'Cargando...',
  'Loading': 'Cargando',
  'Retry': 'Reintentar',
  'Search': 'Buscar',
  'Settings': 'Configuración',
  'Account': 'Cuenta',
  'Sign Out': 'Cerrar sesión',
  'Email': 'Correo electrónico',
  'Password': 'Contraseña',
  'Sign In': 'Iniciar sesión',
  'Create Account': 'Crear cuenta',
  'Get Started': 'Comenzar',
  'I Already Have an Account': 'Ya tengo una cuenta',
  'Privacy Policy': 'Política de privacidad',
  'Scripture for the road ahead.': 'Escritura para el camino que tienes por delante.',
  'Welcome': 'Bienvenido',
  'Language': 'Idioma',
  'English': 'English',
  'Spanish': 'Español',
  'Life Context': 'Contexto de vida',
  'Current Season': 'Temporada actual',
  'Translation': 'Traducción',
  'Preferred Translation': 'Traducción preferida',
  'Theological Depth': 'Profundidad teológica',
  'Almost There': 'Casi terminamos',
  'Available devotional time': 'Tiempo devocional disponible',
  'Bible familiarity': 'Familiaridad con la Biblia',
  'Your name': 'Tu nombre',
  'What may we call you?': '¿Cómo podemos llamarte?',
  'What is your life stage?': '¿Cuál es tu etapa de vida?',
  'How would you describe this season?': '¿Cómo describirías esta temporada?',
  'This helps SOLAPATH walk with you gently.': 'Esto ayuda a SOLAPATH a acompañarte con cuidado.',
  'Preferred Bible translation?': '¿Traducción bíblica preferida?',
  'You can change this anytime.': 'Puedes cambiar esto en cualquier momento.',
  'How deep would you like to go?': '¿Qué tan profundo te gustaría estudiar?',
  'A few final questions': 'Unas últimas preguntas',
  'Remember my context': 'Recordar mi contexto',
  'Starting...': 'Iniciando...',
  'Simple': 'Sencillo',
  'Study': 'Estudio',
  'Deep Study': 'Estudio profundo',
  'Plain-language explanation': 'Explicación en lenguaje sencillo',
  'Scripture, context, cross-references, doctrine': 'Escritura, contexto, referencias cruzadas y doctrina',
  'Confessional, historical, original-language depth': 'Profundidad confesional, histórica y de idiomas originales',
  'My Church': 'Mi Iglesia',
  'Church': 'Iglesia',
  'Church Features': 'Funciones de la iglesia',
  'Church Owner': 'Propietario de la iglesia',
  'Join My Church': 'Unirme a mi iglesia',
  'Your Role': 'Tu función',
  'Create a New Church': 'Crear una nueva iglesia',
  'Edit Church': 'Editar iglesia',
  'Church Name': 'Nombre de la iglesia',
  'Church name': 'Nombre de la iglesia',
  'City': 'Ciudad',
  'City (optional)': 'Ciudad (opcional)',
  'Search churches...': 'Buscar iglesias...',
  'Small Groups': 'Grupos pequeños',
  'No small groups yet.': 'Aún no hay grupos pequeños.',
  'Create Small Group': 'Crear grupo pequeño',
  'Join Small Group': 'Unirse a un grupo pequeño',
  'Invite Code': 'Código de invitación',
  'Enter invite code': 'Ingresa el código de invitación',
  'Join Group': 'Unirse al grupo',
  'Leave Group': 'Salir del grupo',
  'Delete Group': 'Eliminar grupo',
  'Delete small group': 'Eliminar grupo pequeño',
  'Group name': 'Nombre del grupo',
  'Meeting day (optional, e.g. Wednesday)': 'Día de reunión (opcional, p. ej. miércoles)',
  'Discussion topic': 'Tema de conversación',
  'Share your thoughts...': 'Comparte tus pensamientos...',
  'Church-connected small groups. Read before gathering, reflect, share, pray.': 'Grupos pequeños conectados con la iglesia. Lee antes de reunirte, reflexiona, comparte y ora.',
  'Your church hasn\'t added any small groups yet.': 'Tu iglesia aún no ha agregado grupos pequeños.',
  'Create a small group for your church.': 'Crea un grupo pequeño para tu iglesia.',
  'Church Studies': 'Estudios de la iglesia',
  'Manage Church Studies': 'Administrar estudios de la iglesia',
  'New Church Study': 'Nuevo estudio de la iglesia',
  'Study title': 'Título del estudio',
  'Short description (optional)': 'Descripción breve (opcional)',
  'Create Draft': 'Crear borrador',
  'Published': 'Publicado',
  'Drafts': 'Borradores',
  'Archived': 'Archivados',
  'Church Prayer': 'Oración de la iglesia',
  'Add Church Prayer': 'Agregar oración de la iglesia',
  'Add Church Prayer Item': 'Agregar petición de oración',
  'Prayer request title': 'Título de la petición',
  'Small group': 'Grupo pequeño',
  'Pastor': 'Pastor',
  'Church Admin': 'Administrador de iglesia',
  'Elder': 'Anciano',
  'Leader': 'Líder',
  'Verified Church Leadership': 'Liderazgo de iglesia verificado',
  'Leadership Requests': 'Solicitudes de liderazgo',
  'Request Pastor Verification': 'Solicitar verificación como pastor',
  'Request Church Leadership Access': 'Solicitar acceso de liderazgo',
  'Pastor Identity Verification': 'Verificación de identidad pastoral',
  'Verification Required': 'Verificación requerida',
  'Verified': 'Verificado',
  'Approve': 'Aprobar',
  'Reject': 'Rechazar',
  'Revoke': 'Revocar',
  'Admin Approval Center': 'Centro de aprobación administrativa',
  'Together': 'Juntos',
  'TOGETHER': 'JUNTOS',
  'You were never meant to walk alone.': 'Nunca fuiste llamado a caminar solo.',
  'My Circles': 'Mis círculos',
  'You haven\'t joined any Circles yet.': 'Aún no te has unido a ningún círculo.',
  'Create a private Circle for your marriage, small group, Bible study, or prayer group.': 'Crea un círculo privado para tu matrimonio, grupo pequeño, estudio bíblico o grupo de oración.',
  'Family': 'Familia',
  'SOLAPATH Family': 'Familia SOLAPATH',
  'Create Family': 'Crear familia',
  'Add Household Profile': 'Agregar perfil del hogar',
  'My Family': 'Mi familia',
  'Tonight\'s Family Walk': 'Caminata familiar de esta noche',
  'Children & Household Profiles': 'Perfiles de niños y del hogar',
  'Sermon Discussions': 'Conversaciones sobre sermones',
  'Reach': 'Alcance',
  'SOLAPATH Reach': 'Alcance SOLAPATH',
  'Journey': 'Camino',
  'Sermon Assistant': 'Asistente de sermones',
  'Saved Recordings': 'Grabaciones guardadas',
  'Discussion': 'Conversación',
  'My Bible Notes': 'Mis notas bíblicas',
  'Bookmarks': 'Marcadores',
  'Bookmark': 'Guardar marcador',
  'Bookmarked': 'Guardado',
  'No bookmarks yet. Select verses and tap Bookmark to save a passage.': 'Aún no hay marcadores. Selecciona versículos y toca Guardar marcador.',
  'Bible Version': 'Versión bíblica',
  'Other Translations': 'Otras traducciones',
  'Installed': 'Instalada',
  'Cross References': 'Referencias cruzadas',
  'Passage Study': 'Estudio del pasaje',
  'Select Book': 'Seleccionar libro',
  'Old Testament': 'Antiguo Testamento',
  'New Testament': 'Nuevo Testamento',
  'Previous chapter': 'Capítulo anterior',
  'Next chapter': 'Capítulo siguiente',
  'Text size': 'Tamaño del texto',
  'Loading Scripture...': 'Cargando Escritura...',
  'No verses found for this chapter.': 'No se encontraron versículos para este capítulo.',
  'Ask SOLAPATH a question': 'Haz una pregunta a SOLAPATH',
  'Send follow-up': 'Enviar seguimiento',
  'Helpful': 'Útil',
  'Not helpful': 'No fue útil',
  'Report Concern': 'Reportar inquietud',
  'Thank you': 'Gracias',
  'What SOLAPATH Remembers': 'Lo que SOLAPATH recuerda',
  'SOLAPATH doesn\'t remember anything yet.': 'SOLAPATH aún no recuerda nada.',
  'Privacy & Data': 'Privacidad y datos',
  'What SOLAPATH stores · Download · Delete': 'Lo que SOLAPATH guarda · Descargar · Eliminar',
  'Theological Library': 'Biblioteca teológica',
  'Confessional Documents': 'Documentos confesionales',
  'Historic Theologians': 'Teólogos históricos',
  'Selected Teachers': 'Maestros seleccionados',
  'Library Search': 'Buscar en la biblioteca',
  'About SOLAPATH': 'Acerca de SOLAPATH',
  'Send Feedback': 'Enviar comentarios',
  'Activity': 'Actividad',
  'Notifications': 'Notificaciones',
  'App Guide': 'Guía de la aplicación',
  'How to use SOLAPATH': 'Cómo usar SOLAPATH',
  'Depth · Translation · Memory · About': 'Profundidad · Traducción · Memoria · Acerca de',
  'Language · Depth · Translation · Memory · About': 'Idioma · Profundidad · Traducción · Memoria · Acerca de',
  'AI is the servant. Scripture is the authority.': 'La IA es la sierva. La Escritura es la autoridad.',
  'Coming': 'Próximamente',
  'Privacy Boundary': 'Límite de privacidad',
  'Active': 'Activo',
  'Category': 'Categoría',
  'Name': 'Nombre',
  'Description (optional)': 'Descripción (opcional)',
  'Saving...': 'Guardando...',
  'Create': 'Crear',
  'Share': 'Compartir',
  'Search notes': 'Buscar notas',
  'Search notes...': 'Buscar notas...',
  'Delete note': 'Eliminar nota',
  'Title (optional)': 'Título (opcional)',
  'Write your observation, interpretation, or application...': 'Escribe tu observación, interpretación o aplicación...',
  'Choose your language': 'Elige tu idioma',
  'You haven\'t joined any small groups yet.': 'Aún no te has unido a ningún grupo pequeño.',
  'Verified church leadership can see every small group for this church.': 'El liderazgo verificado puede ver todos los grupos pequeños de esta iglesia.',
  'You only see small groups you have joined with an invite code.': 'Solo ves los grupos pequeños a los que te uniste con un código de invitación.',
  'Enter the private invite code given to you by your church group leader.': 'Ingresa el código privado que te dio el líder de tu grupo de iglesia.',
  'Invite code not found, or this group belongs to a different church.': 'No se encontró el código, o este grupo pertenece a otra iglesia.',
  'Copy': 'Copiar',
  'New Code': 'Nuevo código',
  'Joining...': 'Uniéndote...',
  'Leaving...': 'Saliendo...',
  'Posting...': 'Publicando...',
  'No discussion yet. Be the first to share.': 'Aún no hay conversación. Sé el primero en compartir.',
  'Meets:': 'Se reúne:',
  'Only a Verified Pastor can manage this church\'s studies.': 'Solo un Pastor verificado puede administrar los estudios de esta iglesia.',
  'Only a verified Pastor can create or manage Church Studies.': 'Solo un Pastor verificado puede crear o administrar Estudios de la Iglesia.',
  'Please wait...': 'Espera por favor...',
  "Don't have an account? Sign up": '¿No tienes una cuenta? Regístrate',
  'Already have an account? Sign in': '¿Ya tienes una cuenta? Inicia sesión',
  'Authentication failed. Please try again.': 'La autenticación falló. Inténtalo de nuevo.',
  'Student': 'Estudiante',
  'Young adult': 'Adulto joven',
  'Married': 'Casado',
  'Parent of young children': 'Padre o madre de niños pequeños',
  'Parent of teens': 'Padre o madre de adolescentes',
  'Empty nest': 'Nido vacío',
  'Retired': 'Jubilado',
  'Growing': 'Creciendo',
  'Dry': 'Seca',
  'Busy': 'Ocupada',
  'Grieving': 'En duelo',
  'New to faith': 'Nuevo en la fe',
  'Returning to faith': 'Regresando a la fe',
  'Steady': 'Estable',
  'New to the Bible': 'Nuevo en la Biblia',
  'Some familiarity': 'Algo de familiaridad',
  'Comfortable': 'Cómodo',
  'Experienced': 'Experimentado',
  'Studied deeply': 'Estudio profundo',
  'Member': 'Miembro',
  'Regular Attender': 'Asistente regular',
  'Visitor': 'Visitante',
  'Serving': 'Sirviendo',
  'Deacon': 'Diácono',
  'Ministry Leader': 'Líder de ministerio',
  'Elige tu idioma · You can change this anytime.': 'Elige tu idioma · Puedes cambiarlo en cualquier momento.',
  "You haven't joined any small groups yet.": 'Aún no te has unido a ningún grupo pequeño.',
  'Share this code only with people who belong to this church. They will see this group after joining.': 'Comparte este código solo con personas que pertenezcan a esta iglesia. Verán el grupo después de unirse.',
  'We couldn\'t load your Family. Please try again.': 'No pudimos cargar tu Familia. Inténtalo de nuevo.',
  'Create a Family Profile to begin': 'Crea un perfil familiar para comenzar',
  'Bring a sermon point back to Scripture and talk through it together.': 'Lleva un punto del sermón de regreso a la Escritura y hablen de él juntos.',
  'Close Family': 'Cerrar Familia',
  'Close Reach': 'Cerrar Alcance',
  'Strengthen your relationship with your local church.': 'Fortalece tu relación con tu iglesia local.',
  'You haven\'t connected a church yet.': 'Aún no has conectado una iglesia.',
  'Join your church to access studies, prayer items, and small groups.': 'Únete a tu iglesia para acceder a estudios, peticiones de oración y grupos pequeños.',
  'Selecting "Pastor" does not grant privileged church administration rights.': 'Seleccionar "Pastor" no concede privilegios de administración de la iglesia.',
  'Church-managed prayer items. Your private prayers remain opt-in.': 'Peticiones de oración administradas por la iglesia. Tus oraciones privadas siguen siendo opcionales.',
  'Title': 'Título',
  'General': 'General',
  'Congregation': 'Congregación',
  'Missions': 'Misiones',
  'Leadership': 'Liderazgo',
  'Community': 'Comunidad',
  'Thanksgiving': 'Acción de gracias',
  'Edit Church Prayer Item': 'Editar petición de oración de la iglesia',
  'Delete this church prayer?': '¿Eliminar esta oración de la iglesia?',
  'Edit prayer item': 'Editar petición de oración',
  'Delete prayer item': 'Eliminar petición de oración',
  'Details about this prayer request...': 'Detalles sobre esta petición de oración...',
  'From My Church': 'De Mi Iglesia',
  'CHURCH CONTENT': 'CONTENIDO DE LA IGLESIA',
  'Studies from your church. Open your Bible, read, reflect, share, pray.': 'Estudios de tu iglesia. Abre tu Biblia, lee, reflexiona, comparte y ora.',
  'New studies start as drafts. Members cannot see them until you publish.': 'Los estudios nuevos comienzan como borradores. Los miembros no pueden verlos hasta que los publiques.',
  'New study': 'Nuevo estudio',
  'Profile': 'Perfil',
  'Edit Profile': 'Editar perfil',
  'Name · Season · Study · Time · Translation': 'Nombre · Temporada · Estudio · Tiempo · Traducción',
  'My Walk': 'Mi caminata',
  'Life & Faith Profile': 'Perfil de vida y fe',
  'Life Stage': 'Etapa de vida',
  'Life Areas': 'Áreas de vida',
  'Growth Areas': 'Áreas de crecimiento',
  'Back to profile': 'Volver al perfil',
  'Close profile': 'Cerrar perfil',
  'Updates from your Family and Circles.': 'Actualizaciones de tu Familia y tus Círculos.',
  'Nothing new yet.': 'Aún no hay novedades.',
  'When people in your Family or Circles share, you will see it here.': 'Cuando las personas de tu Familia o tus Círculos compartan algo, lo verás aquí.',
  'Activity settings': 'Configuración de actividad',
  'Open Your Bible': 'Abre tu Biblia',
  'Start Bible Time': 'Comenzar tiempo bíblico',
  'Put your phone down. Open your Bible. Take your time.': 'Deja tu teléfono. Abre tu Biblia. Tómate tu tiempo.',
  'Take your time.': 'Tómate tu tiempo.',
  'I\'m Finished': 'Terminé',
  'Reflect': 'Reflexionar',
  'What stood out to you?': '¿Qué te llamó la atención?',
  'Take a moment to reflect. Scripture first, understanding follows.': 'Tómate un momento para reflexionar. Primero la Escritura; luego viene la comprensión.',
  'Write what you noticed, what surprised you, what you\'re wondering about...': 'Escribe lo que notaste, lo que te sorprendió o lo que te estás preguntando...',
  'Recording...': 'Grabando...',
  'Voice input': 'Entrada de voz',
  'Or type above': 'O escribe arriba',
  'Skip for now': 'Omitir por ahora',
  'What do you think this passage is showing you about God?': '¿Qué crees que este pasaje te está mostrando acerca de Dios?',
  'Before SOLAPATH offers any explanation, sit with the text yourself.': 'Antes de que SOLAPATH ofrezca una explicación, permanece tú mismo con el texto.',
  'What does this passage reveal about God\'s character, His promises, His ways?': '¿Qué revela este pasaje sobre el carácter de Dios, sus promesas y sus caminos?',
  'Help Me Understand': 'Ayúdame a entender',
  'Save & Finish': 'Guardar y terminar',
  'Understanding': 'Comprensión',
  'What stood out': 'Lo que te llamó la atención',
  'What this shows about God': 'Lo que esto muestra acerca de Dios',
  'You\'ve spent time in Scripture. Now SOLAPATH can help you go deeper — context, theological understanding, historic witness, and application.': 'Has pasado tiempo en la Escritura. Ahora SOLAPATH puede ayudarte a profundizar: contexto, comprensión teológica, testimonio histórico y aplicación.',
  'Go Deeper': 'Profundizar',
  'Help Me Understand This Passage': 'Ayúdame a entender este pasaje',
  'I\'m Good — Finish Walk': 'Estoy bien — Terminar caminata',
  'You opened Scripture today.': 'Hoy abriste la Escritura.',
  'in the Word': 'en la Palabra',
  'One observation question': 'Una pregunta de observación',
  'Show less': 'Mostrar menos',
  'Open in Bible': 'Abrir en la Biblia',
  'Loading cross references...': 'Cargando referencias cruzadas...',
  'No cross references available for this verse.': 'No hay referencias cruzadas disponibles para este versículo.',
  'Loading preview...': 'Cargando vista previa...',
  'Previous': 'Anterior',
  'Next': 'Siguiente',
  'Edit Chapter Notes': 'Editar notas del capítulo',
  '+ Chapter Notes': '+ Notas del capítulo',
  'Word / Phrase': 'Palabra / Frase',
  'Whole Verse': 'Versículo completo',
  'Tap the first word to highlight': 'Toca la primera palabra para resaltar',
  'Selected': 'Seleccionado',
  'Tap another word to extend the selection.': 'Toca otra palabra para ampliar la selección.',
  'Set Up Your Marking Key': 'Configura tu clave de marcado',
  'Mark': 'Marcar',
  'Choose a Marking Key:': 'Elige una clave de marcado:',
  'Marking Key': 'Clave de marcado',
  'Create Marking Key': 'Crear clave de marcado',
  'Color': 'Color',
  'Mark Style': 'Estilo de marcado',
  'Symbol': 'Símbolo',
  'Live Preview': 'Vista previa',
  'Remove this Scripture marking?': '¿Eliminar este marcado de la Escritura?',
  'Already Highlighted': 'Ya está resaltado',
  'This text overlaps an existing highlight.': 'Este texto se superpone con un resaltado existente.',
  'Mark keyword:': 'Marcar palabra clave:',
  'No keywords yet. Create keywords from the Keywords view.': 'Aún no hay palabras clave. Crea palabras clave desde la vista Palabras clave.',
  'Highlighted': 'Resaltado',
  'Change Color': 'Cambiar color',
  'Scripture Marking': 'Marcado de la Escritura',
  'Marked as': 'Marcado como',
  'Tap the last word': 'Toca la última palabra',
  'Tap a new first word': 'Toca una nueva primera palabra',
  'Tap a new last word': 'Toca una nueva última palabra',
  'Choose a Marking Key first': 'Elige primero una clave de marcado',
  'Change Marking Key': 'Cambiar clave de marcado',
  'Promise': 'Promesa',
  'Keywords': 'Palabras clave',
  'Keyword marked': 'Palabra clave marcada',
  'e.g. Grace': 'p. ej. Gracia',
  'Create new marking key': 'Crear nueva clave de marcado',
  'Keyword (e.g. GRACE)': 'Palabra clave (p. ej. GRACIA)',
  'Unable to save note. Your text is preserved — try again.': 'No se pudo guardar la nota. Tu texto se conserva; inténtalo de nuevo.',
  'Observation': 'Observación',
  'Interpretation': 'Interpretación',
  'Application': 'Aplicación',
  'Question': 'Pregunta',
  'Word Study': 'Estudio de palabras',
  'Cross Reference': 'Referencia cruzada',
  'Sermon Note': 'Nota del sermón',
  'Gold': 'Dorado',
  'Underline': 'Subrayado',
  'Double Underline': 'Doble subrayado',
  'Highlight': 'Resaltar',
  'Box': 'Recuadro',
  'Oval': 'Óvalo',
  'Angled Box': 'Recuadro inclinado',
  'Slash': 'Tachado',
  'Symbol + Underline': 'Símbolo + subrayado',
  'Symbol + Highlight': 'Símbolo + resaltado',
  'Could not load groups.': 'No se pudieron cargar los grupos.',
  'Could not load church studies.': 'No se pudieron cargar los estudios de la iglesia.',
  'Choose a church in My Church to manage its studies.': 'Elige una iglesia en Mi Iglesia para administrar sus estudios.',
  'Could not create this study. Please try again.': 'No se pudo crear este estudio. Inténtalo de nuevo.',
  'Creating...': 'Creando...',
  'AI Summary of Shared Discussion': 'Resumen de IA de la conversación compartida',
  'Control & Library': 'Control y biblioteca',
  'View · Edit · Forget · Disable · Delete': 'Ver · Editar · Olvidar · Desactivar · Eliminar',
  'Authors · Confessions · Doctrines': 'Autores · Confesiones · Doctrinas',
  'Search verified theological sources': 'Buscar fuentes teológicas verificadas',
  'Bug · Feature · Concern': 'Error · Función · Inquietud',
  'Security · Privacy · Health · Flags': 'Seguridad · Privacidad · Estado · Indicadores',
};

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (english: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => undefined,
  t: (english) => english,
});

function getInitialLanguage(): AppLanguage {
  if (typeof localStorage === 'undefined') return 'en';
  return localStorage.getItem(STORAGE_KEY) === 'es' ? 'es' : 'en';
}

function translateTextNode(node: Text) {
  const parent = node.parentElement;
  if (parent && ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return;
  const raw = node.nodeValue ?? '';
  const trimmed = raw.trim();
  const translated = ES[trimmed];
  if (!translated || translated === trimmed) return;
  node.nodeValue = raw.replace(trimmed, translated);
}

function translateAttributes(el: Element) {
  for (const attr of ['placeholder', 'aria-label', 'title']) {
    const raw = el.getAttribute(attr);
    if (!raw) continue;
    const translated = ES[raw.trim()];
    if (translated && translated !== raw) el.setAttribute(attr, translated);
  }
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root as Element);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) translateTextNode(current as Text);
    else translateAttributes(current as Element);
    current = walker.nextNode();
  }
}

function LanguageBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  const setLanguage = useCallback((next: AppLanguage) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
      // The app language owns the bundled Scripture language for now:
      // English -> WEB, Spanish -> Reina-Valera 1909.
      localStorage.setItem(SCRIPTURE_STORAGE_KEY, next === 'es' ? 'RV1909' : 'WEB');
    }
    setLanguageState((current) => current === next ? current : next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    if (language !== 'es') return;

    const apply = (root: Node = document.body) => {
      if (root) translateTree(root);
    };

    apply();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData' && record.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(record.target as Text);
        }
        for (const node of record.addedNodes) apply(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (english) => language === 'es' ? ES[english] ?? english : english,
  }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      <LanguageBoundary key={language}>{children}</LanguageBoundary>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
