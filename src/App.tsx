import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/components/auth/LoginPage';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MemberListPage } from '@/components/members/MemberListPage';
import { MemberFormPage } from '@/components/members/MemberFormPage';
import { MemberDetailPage } from '@/components/members/MemberDetailPage';
import { TreePage } from '@/components/tree/TreePage';
import { useEffect } from 'react';
import { needsSeed, seedDatabase } from '@/utils/seedData';

function SeedInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (needsSeed()) {
      seedDatabase();
    }
  }, []);
  return <>{children}</>;
}

export default function App() {
  return (
    <SeedInitializer>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/members" element={<MemberListPage />} />
                <Route path="/members/new" element={<MemberFormPage />} />
                <Route path="/members/:id" element={<MemberDetailPage />} />
                <Route path="/members/:id/edit" element={<MemberFormPage />} />
                <Route path="/tree" element={<TreePage />} />
                <Route path="/tree/:id" element={<TreePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SeedInitializer>
  );
}
