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
  'Choose your language': 'Elige tu idioma',
  'Elige tu idioma · You can change this anytime.': 'Elige tu idioma · Puedes cambiarlo en cualquier momento.',
  'No small groups yet.': 'Aún no hay grupos pequeños.',
  "You haven't joined any small groups yet.": 'Aún no te has unido a ningún grupo pequeño.',
  'Invite Code': 'Código de invitación',
  'Share this code only with people who belong to this church. They will see this group after joining.': 'Comparte este código solo con personas que pertenezcan a esta iglesia. Verán el grupo después de unirse.',
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
