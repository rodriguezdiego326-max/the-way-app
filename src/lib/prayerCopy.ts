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
  godAtWork: string;
  reflection: string;
  editReflection: string;
  noReflection: string;
  addReflection: string;
  updatesHeading: string;
  entryCount: (n: number) => string;
  update: string;
  noUpdates: string;
  addUpdate: string;
  cancel: string;
  save: string;
  saving: string;
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
  noPrayersTitle: 'No prayers yet',
  noPrayersBody: 'Bring your requests before God. SOLAPATH will walk with you as you pray, wait, and remember His faithfulness.',
  beginPrayer: 'Begin a Prayer',
  addPrayer: 'Add Prayer',
  updateCount: (n) => (n === 1 ? '1 update' : `${n} updates`),
  faithfulnessTitle: "God's Faithfulness",
  faithfulnessBody: 'A timeline of prayers, reflections, Scripture, and outcomes — a record of how God has been faithful across your life.',
  faithfulnessNote: 'This will populate as you record prayers and mark them answered or closed. Every answered prayer and every season of waiting becomes part of your faithfulness timeline.',
  answeredPrayers: 'Answered Prayers',
  answeredOn: (date) => `Answered · ${date}`,
  status: { praying: 'Praying', waiting: 'Waiting', answered: 'Answered', closed: 'Closed · Continuing to Trust' },
  started: (date) => `Started ${date}`,
  updateStatus: 'Update Status',
  godAtWork: 'How is God at work in this?',
  reflection: 'Reflection',
  editReflection: 'Edit Reflection',
  noReflection: 'No reflection added yet.',
  addReflection: 'Add Reflection',
  updatesHeading: 'Updates',
  entryCount: (n) => (n === 1 ? '1 entry' : `${n} entries`),
  update: 'Update',
  noUpdates: 'No updates yet. Add one as you see God at work.',
  addUpdate: 'Add Update',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',
  editPrayer: 'Edit prayer',
  editPrayerTitle: 'Edit Prayer',
  editSaveError: 'Could not save your changes. Your edits are still here, so please try again.',
  identifyError: 'Could not identify user. Please try again.',
  saveError: 'Could not save. Please try again.',
  updatePlaceholder: 'What is happening with this prayer?',
  reflectionPlaceholder: 'How is God at work in this?',
  addUpdateLabel: 'Add an update',
  addReflectionLabel: 'Add a reflection',
  updateTab: 'Update',
  reflectionTab: 'Reflection',
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
  noPrayersTitle: 'Aún no hay oraciones',
  noPrayersBody: 'Lleva tus peticiones delante de Dios. SOLAPATH te acompañará mientras oras, esperas y recuerdas Su fidelidad.',
  beginPrayer: 'Comienza una oración',
  addPrayer: 'Agregar oración',
  updateCount: (n) => (n === 1 ? '1 actualización' : `${n} actualizaciones`),
  faithfulnessTitle: 'La fidelidad de Dios',
  faithfulnessBody: 'Una línea de tiempo de oraciones, reflexiones, Escrituras y resultados: un registro de cómo Dios ha sido fiel a lo largo de tu vida.',
  faithfulnessNote: 'Esta sección se llenará a medida que registres oraciones y las marques como respondidas o cerradas. Cada oración respondida y cada temporada de espera forman parte de tu línea de tiempo de fidelidad.',
  answeredPrayers: 'Oraciones respondidas',
  answeredOn: (date) => `Respondida · ${date}`,
  status: { praying: 'Orando', waiting: 'Esperando', answered: 'Respondida', closed: 'Cerrada · Confiando en Dios' },
  started: (date) => `Iniciada ${date}`,
  updateStatus: 'Cambiar estado',
  godAtWork: '¿Cómo está obrando Dios en esto?',
  reflection: 'Reflexión',
  editReflection: 'Editar reflexión',
  noReflection: 'Aún no hay reflexión.',
  addReflection: 'Agregar reflexión',
  updatesHeading: 'Actualizaciones',
  entryCount: (n) => (n === 1 ? '1 entrada' : `${n} entradas`),
  update: 'Actualización',
  noUpdates: 'Aún no hay actualizaciones. Agrega una cuando veas a Dios obrar.',
  addUpdate: 'Agregar actualización',
  cancel: 'Cancelar',
  save: 'Guardar',
  saving: 'Guardando...',
  editPrayer: 'Editar oración',
  editPrayerTitle: 'Editar oración',
  editSaveError: 'No se pudieron guardar los cambios. Tus cambios siguen aquí; inténtalo de nuevo.',
  identifyError: 'No se pudo identificar al usuario. Inténtalo de nuevo.',
  saveError: 'No se pudo guardar. Inténtalo de nuevo.',
  updatePlaceholder: '¿Qué está pasando con esta oración?',
  reflectionPlaceholder: '¿Cómo está obrando Dios en esto?',
  addUpdateLabel: 'Agregar una actualización',
  addReflectionLabel: 'Agregar una reflexión',
  updateTab: 'Actualización',
  reflectionTab: 'Reflexión',
};

const COPY: Record<PrayerLang, PrayerCopy> = { en, es };

export function getPrayerCopy(lang: PrayerLang): PrayerCopy {
  return COPY[lang];
}
