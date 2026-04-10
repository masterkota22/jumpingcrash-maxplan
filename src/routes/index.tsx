import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import MeasurePage from '@/pages/MeasurePage';
import RecordsPage from '@/pages/RecordsPage';
import SchoolRankingPage from '@/pages/SchoolRankingPage';
import RankingPage from '@/pages/RankingPage';
import CompetitionPage from '@/pages/CompetitionPage';
import LoginPage from '@/pages/LoginPage';
import ProfilePage from '@/pages/ProfilePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/measure" element={<ProtectedRoute><MeasurePage /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
        <Route path="/ranking/school" element={<SchoolRankingPage />} />
        <Route path="/ranking/individual" element={<RankingPage />} />
        <Route path="/competition" element={<CompetitionPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
