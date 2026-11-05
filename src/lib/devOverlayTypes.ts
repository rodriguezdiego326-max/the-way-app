export const DEV_OVERLAY_TYPES = [
  'admin_sources',
  'retrieval_debug',
  'rag_tests',
  'phase6_tests',
  'qa_dashboard',
  'source_batches',
  'release_gate',
  'production_status',
  'phase8_tests',
  'phase9_tests',
  'system_health',
  'ai_usage',
  'feature_flags',
  'legal_placeholders',
  'production_readiness',
  'phase10_tests',
  'phase11_tests',
  'mobile_build_guide',
] as const;

export function isDevOverlayType(type: string): boolean {
  return (DEV_OVERLAY_TYPES as readonly string[]).includes(type);
}
