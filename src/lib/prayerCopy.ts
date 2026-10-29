export type PrayerLang = 'en' | 'es';

export function getPrayerLang(): PrayerLang {
  return typeof localStorage !== 'undefined' && localStorage.getItem('solapath_translation') === 'RV1909' ? 'es' : 'en';
}

export interface PrayerCopy {
  prayerLabel: string;
  pageTitle: string;
  tabActive: string;
  tabFaithfulness: string;
  newPrayer: string;
  titleLabel: string;
  titlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  scriptureLabel: string;
  scripturePlaceholder: string;
  beginPraying: string;
  saving: string;
  saveErrorNew: string;
  noPrayersTitle: string;
  noPrayersBody: string;
  beginPrayer: string;
  addPrayer: string;
  updateCount: (n: number) => string;
  faithfulnessTitle: string;
  faithfulnessBody: string;
  faithfulnessNote: string;
  answeredPrayers: string;
  answeredOn: (date: string) => string;
  status: { praying: string; waiting: string; answered: string; closed: string };
  started: (date: string) => string;
  updateStatus: string;
  reflection: string;
  editReflection: string;
  addReflection: string;
  update: string;
  addUpdate: string;
  cancel: string;
  save: string;
  editPrayer: string;
  editPrayerTitle: string;
  editSaveError: string;
  identifyError: string;
  saveError: string;
  updatePlaceholder: string;
  reflectionPlaceholder: string;
  addUpdateLabel: string;
  addReflectionLabel: string;
  updateTab: string;
  reflectionTab: string;
  pray: string;
  journeyHeading: string;
  journeyBegan: string;
  journeyPrayed: string;
  journeyAnswered: string;
  returnedSeveralTimes: string;
  lastPrayed: (date: string) => string;
  modeClose: string;
  modeRequestLabel: string;
  modeScriptureLabel: string;
  modeBeStillTitle: string;
  modeBeStillBody: string;
  modeBringTitle: string;
  modeBringBody: string;
  modeEntrustTitle: string;
  modeEntrustBody: string;
  modeComplete: string;
  modeRecorded: string;
  modeSaveError: string;
  modeRecording: string;
}

const en: PrayerCopy = {
  prayerLabel: 'Prayer',
  pageTitle: 'Pray',
  tabActive: 'Active Prayers',
  tabFaithfulness: "God's Faithfulness",
  newPrayer: 'New Prayer',
  titleLabel: 'Title',
  titlePlaceholder: 'What are you praying for?',
  descriptionLabel: 'Description (optional)',
  descriptionPlaceholder: 'Describe the request, the context, who is involved...',
  scriptureLabel: 'Related Scripture (optional)',
  scripturePlaceholder: 'e.g. Philippians 4:6–7',
  beginPraying: 'Begin Praying',
  saving: 'Saving...',
  saveErrorNew: 'Could not save prayer. Please try again.',
  noPrayersTitle: 'No active prayers yet.',
  noPrayersBody: 'Bring something before God and return to it as you continue to pray.',
  beginPrayer: 'Begin a Prayer',
  addPrayer: 'Add Prayer',
  updateCount: (n) => (n === 1 ? '1 update' : `${n} updates`),
  faithfulnessTitle: "God's Faithfulness",
  faithfulnessBody: 'A timeline of prayers, reflections, Scripture, and outcomes — a record of how God has been faithful across your life.',
  faithfulnessNote: 'This will populate as you record prayers and mark them answered or closed. Every answered prayer and every season of waiting becomes part of your faithfulness timeline.',
  answeredPrayers: 'Answered Prayers',
  answeredOn: (date) => `Answered · ${date}`,
  status: { praying: 'Praying', waiting: 'Waiting', answered: 'Answered', closed: 'Closed · Continuing to Trust' },
  started: (date) => `Praying since ${date}`,
  updateStatus: 'Update Status',
  reflection: 'Reflection',
  editReflection: 'Edit Reflection',
  addReflection: 'Add Reflection',
  update: 'Update',
  addUpdate: 'Add Update',
  cancel: 'Cancel',
  save: 'Save',
  editPrayer: 'Edit prayer',
  editPrayerTitle: 'Edit Prayer',
  editSaveError: 'Could not save your changes. Your edits are still here, so please try again.',
  identifyError: 'Could not identify user. Please try again.',
  saveError: 'Could not save. Please try again.',
  updatePlaceholder: 'What is happening with this prayer?',
  reflectionPlaceholder: 'What are you learning as you continue to pray?',
  addUpdateLabel: 'Add an update',
  addReflectionLabel: 'Add a reflection',
  updateTab: 'Update',
  reflectionTab: 'Reflection',
  pray: 'Pray',
  journeyHeading: 'Prayer Journey',
  journeyBegan: 'Prayer began',
  journeyPrayed: 'Prayed',
  journeyAnswered: 'Prayer answered',
  returnedSeveralTimes: "You've returned to this prayer several times.",
  lastPrayed: (date) => `Last prayed ${date}`,
  modeClose: 'Close',
  modeRequestLabel: 'Your request',
  modeScriptureLabel: 'Related Scripture',
  modeBeStillTitle: 'Be still',
  modeBeStillBody: 'Take a moment to quiet your heart before God.',
  modeBringTitle: 'Bring this before God',
  modeBringBody: 'Pray honestly about what is on your heart.',
  modeEntrustTitle: 'Entrust the outcome to Him',
  modeEntrustBody: 'Ask according to God\'s will and rest in His wisdom.',
  modeComplete: "I've prayed about this",
  modeRecorded: 'Prayer recorded.',
  modeSaveError: 'Could not record this prayer. Please try again.',
  modeRecording: 'Recording...',
};

const es: PrayerCopy = {
  prayerLabel: 'Oración',
  pageTitle: 'Orar',
  tabActive: 'Oraciones activas',
  tabFaithfulness: 'La fidelidad de Dios',
  newPrayer: 'Nueva oración',
  titleLabel: 'Título',
  titlePlaceholder: '¿Por qué estás orando?',
  descriptionLabel: 'Descripción (opcional)',
  descriptionPlaceholder: 'Describe la petición, el contexto y quiénes están involucrados...',
  scriptureLabel: 'Escritura relacionada (opcional)',
  scripturePlaceholder: 'ej. Filipenses 4:6–7',
  beginPraying: 'Comenzar a orar',
  saving: 'Guardando...',
  saveErrorNew: 'No se pudo guardar la oración. Inténtalo de nuevo.',
  noPrayersTitle: 'Aún no tienes oraciones activas.',
  noPrayersBody: 'Presenta algo delante de Dios y vuelve a ello mientras continúas orando.',
  beginPrayer: 'Comienza una oración',
  addPrayer: 'Agregar oración',
  updateCount: (n) => (n === 1 ? '1 actualización' : `${n} actualizaciones`),
  faithfulnessTitle: 'La fidelidad de Dios',
  faithfulnessBody: 'Una línea de tiempo de oraciones, reflexiones, Escrituras y resultados: un registro de cómo Dios ha sido fiel a lo largo de tu vida.',
  faithfulnessNote: 'Esta sección se llenará a medida que registres oraciones y las marques como respondidas o cerradas. Cada oración respondida y cada temporada de espera forman parte de tu línea de tiempo de fidelidad.',
  answeredPrayers: 'Oraciones respondidas',
  answeredOn: (date) => `Respondida · ${date}`,
  status: { praying: 'Orando', waiting: 'Esperando', answered: 'Respondida', closed: 'Cerrada · Confiando en Dios' },
  started: (date) => `Orando desde el ${date}`,
  updateStatus: 'Cambiar estado',
  reflection: 'Reflexión',
  editReflection: 'Editar reflexión',
  addReflection: 'Agregar reflexión',
  update: 'Actualización',
  addUpdate: 'Agregar actualización',
  cancel: 'Cancelar',
  save: 'Guardar',
  editPrayer: 'Editar oración',
  editPrayerTitle: 'Editar oración',
  editSaveError: 'No se pudieron guardar los cambios. Tus cambios siguen aquí; inténtalo de nuevo.',
  identifyError: 'No se pudo identificar al usuario. Inténtalo de nuevo.',
  saveError: 'No se pudo guardar. Inténtalo de nuevo.',
  updatePlaceholder: '¿Qué está pasando con esta oración?',
  reflectionPlaceholder: '¿Qué estás aprendiendo mientras continúas orando?',
  addUpdateLabel: 'Agregar una actualización',
  addReflectionLabel: 'Agregar una reflexión',
  updateTab: 'Actualización',
  reflectionTab: 'Reflexión',
  pray: 'Orar',
  journeyHeading: 'Camino de oración',
  journeyBegan: 'Comenzó la oración',
  journeyPrayed: 'Oraste',
  journeyAnswered: 'Oración respondida',
  returnedSeveralTimes: 'Has vuelto a esta oración varias veces.',
  lastPrayed: (date) => `Última oración: ${date}`,
  modeClose: 'Cerrar',
  modeRequestLabel: 'Tu petición',
  modeScriptureLabel: 'Escritura relacionada',
  modeBeStillTitle: 'Quédate en quietud',
  modeBeStillBody: 'Toma un momento para aquietar tu corazón delante de Dios.',
  modeBringTitle: 'Preséntalo ante Dios',
  modeBringBody: 'Ora con sinceridad acerca de lo que hay en tu corazón.',
  modeEntrustTitle: 'Confía el resultado a Él',
  modeEntrustBody: 'Pide conforme a la voluntad de Dios y descansa en su sabiduría.',
  modeComplete: 'He orado por esto',
  modeRecorded: 'Oración registrada.',
  modeSaveError: 'No se pudo registrar esta oración. Inténtalo de nuevo.',
  modeRecording: 'Registrando...',
};

const COPY: Record<PrayerLang, PrayerCopy> = { en, es };

export function getPrayerCopy(lang: PrayerLang): PrayerCopy {
  return COPY[lang];
}

export function formatPrayerDate(iso: string | null | undefined, lang: PrayerLang): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const withYear = date.getFullYear() !== new Date().getFullYear();
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
    month: 'long',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
  }).format(date);
}
