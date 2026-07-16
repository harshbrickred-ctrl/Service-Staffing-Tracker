import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './app-layout';
import { ProtectedRoute } from './protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { RequirementsPage } from '@/features/requirements/pages/requirements-page';
import { RequirementDetailPage } from '@/features/requirements/pages/requirement-detail-page';
import { CandidatesPage } from '@/features/candidates/pages/candidates-page';
import { CandidateDetailPage } from '@/features/candidates/pages/candidate-detail-page';
import { OffersPage } from '@/features/offers/pages/offers-page';
import { OfferDetailPage } from '@/features/offers/pages/offer-detail-page';
import { OnboardingPage } from '@/features/onboarding/pages/onboarding-page';
import { OnboardingDetailPage } from '@/features/onboarding/pages/onboarding-detail-page';
import { AdminPage } from '@/features/admin/pages/admin-page';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="requirements" element={<RequirementsPage />} />
            <Route path="requirements/:id" element={<RequirementDetailPage />} />
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="candidates/:id" element={<CandidateDetailPage />} />
            <Route path="offers" element={<OffersPage />} />
            <Route path="offers/:id" element={<OfferDetailPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="onboarding/:id" element={<OnboardingDetailPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
