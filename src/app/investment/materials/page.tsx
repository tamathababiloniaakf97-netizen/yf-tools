import AuthGuard from '@/components/AuthGuard';
import ResearchMaterialLibrary from './components/ResearchMaterialLibrary';

export default function ResearchMaterialsPage() {
  return <AuthGuard><ResearchMaterialLibrary /></AuthGuard>;
}
