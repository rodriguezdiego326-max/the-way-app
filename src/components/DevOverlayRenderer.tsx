import type { Overlay } from '@/App';
import type { Profile } from '@/lib/types';
import ErrorBoundary from '@/components/ErrorBoundary';
import AdminSourceScreen from '@/screens/AdminSourceScreen';
import RetrievalDebugScreen from '@/screens/RetrievalDebugScreen';
import RAGTestScreen from '@/screens/RAGTestScreen';
import Phase6TestScreen from '@/screens/Phase6TestScreen';
import QADashboardScreen from '@/screens/QADashboardScreen';
import SourceBatchScreen from '@/screens/SourceBatchScreen';
import ReleaseGateScreen from '@/screens/ReleaseGateScreen';
import ProductionStatusScreen from '@/screens/ProductionStatusScreen';
import Phase8TestScreen from '@/screens/Phase8TestScreen';
import Phase9TestScreen from '@/screens/Phase9TestScreen';
import SystemHealthScreen from '@/screens/SystemHealthScreen';
import AIUsageDashboardScreen from '@/screens/AIUsageDashboardScreen';
import FeatureFlagsScreen from '@/screens/FeatureFlagsScreen';
import LegalPlaceholdersScreen from '@/screens/LegalPlaceholdersScreen';
import ProductionReadinessScreen from '@/screens/ProductionReadinessScreen';
import Phase10TestScreen from '@/screens/Phase10TestScreen';
import Phase11TestScreen from '@/screens/Phase11TestScreen';
import MobileBuildGuideScreen from '@/screens/MobileBuildGuideScreen';

interface DevOverlayRendererProps {
  overlay: Overlay;
  profile: Profile | null;
  onNavigate: (next: Overlay) => void;
}

export default function DevOverlayRenderer({ overlay, profile, onNavigate }: DevOverlayRendererProps) {
  const close = () => onNavigate({ type: 'none' });

  switch (overlay.type) {
    case 'admin_sources':
      return <ErrorBoundary><AdminSourceScreen onBack={close} /></ErrorBoundary>;
    case 'retrieval_debug':
      return <ErrorBoundary><RetrievalDebugScreen onBack={close} /></ErrorBoundary>;
    case 'rag_tests':
      return <ErrorBoundary><RAGTestScreen onBack={close} /></ErrorBoundary>;
    case 'phase6_tests':
      return <ErrorBoundary><Phase6TestScreen onBack={close} /></ErrorBoundary>;
    case 'qa_dashboard':
      return <ErrorBoundary><QADashboardScreen onBack={close} /></ErrorBoundary>;
    case 'source_batches':
      return <ErrorBoundary><SourceBatchScreen onBack={close} /></ErrorBoundary>;
    case 'release_gate':
      return <ErrorBoundary><ReleaseGateScreen onBack={close} /></ErrorBoundary>;
    case 'production_status':
      return <ErrorBoundary><ProductionStatusScreen onBack={close} /></ErrorBoundary>;
    case 'phase8_tests':
      return profile ? <ErrorBoundary><Phase8TestScreen profile={profile} onBack={close} /></ErrorBoundary> : null;
    case 'phase9_tests':
      return profile ? <ErrorBoundary><Phase9TestScreen profile={profile} onBack={close} /></ErrorBoundary> : null;
    case 'system_health':
      return <ErrorBoundary><SystemHealthScreen onBack={close} /></ErrorBoundary>;
    case 'ai_usage':
      return <ErrorBoundary><AIUsageDashboardScreen onBack={close} /></ErrorBoundary>;
    case 'feature_flags':
      return <ErrorBoundary><FeatureFlagsScreen onBack={close} /></ErrorBoundary>;
    case 'legal_placeholders':
      return <ErrorBoundary><LegalPlaceholdersScreen onBack={close} /></ErrorBoundary>;
    case 'production_readiness':
      return profile ? (
        <ErrorBoundary>
          <ProductionReadinessScreen onBack={close}
            onOpenHealth={() => onNavigate({ type: 'system_health' })}
            onOpenAiUsage={() => onNavigate({ type: 'ai_usage' })}
            onOpenFeedback={() => onNavigate({ type: 'beta_feedback' })}
            onOpenFeatureFlags={() => onNavigate({ type: 'feature_flags' })}
            onOpenLegal={() => onNavigate({ type: 'legal_placeholders' })}
            onOpenPrivacy={() => onNavigate({ type: 'privacy_center' })}
            onOpenPhase10Tests={() => onNavigate({ type: 'phase10_tests' })}
            onOpenPhase11Tests={() => onNavigate({ type: 'phase11_tests' })}
            onOpenMobileBuildGuide={() => onNavigate({ type: 'mobile_build_guide' })}
          />
        </ErrorBoundary>
      ) : null;
    case 'phase10_tests':
      return profile ? <ErrorBoundary><Phase10TestScreen profile={profile} onBack={close} /></ErrorBoundary> : null;
    case 'phase11_tests':
      return profile ? <ErrorBoundary><Phase11TestScreen profile={profile} onBack={close} /></ErrorBoundary> : null;
    case 'mobile_build_guide':
      return <ErrorBoundary><MobileBuildGuideScreen onBack={close} /></ErrorBoundary>;
    default:
      return null;
  }
}
