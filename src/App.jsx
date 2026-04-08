import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }   from '@/context/AuthContext';
import ProtectedRoute     from '@/components/custome/ProtectedRoute';
import MainLayout         from '@/components/custome/MainLayout';

import LoginPage          from '@/pages/Auth/LoginPage';
import NotFoundPage       from '@/pages/Notfound/NotFoundPage';

import DashboardPage      from '@/pages/Dashboard/DashboardPage';
import ReportingPage      from '@/pages/Reporting/ReportingPage';

import LeadsPage          from '@/pages/leads/leadsPage';
import LeadDetailPage     from '@/pages/leads/leadDetailPage';

import ClientsPage        from '@/pages/Clients/clientsPage';
import ClientDetailPage   from '@/pages/Clients/ClientDetailPage';

import TerrainsPage       from '@/pages/terrains/TerrainsPage';
import TerrainDetailPage  from '@/pages/terrains/TerrainDetailPage';

import VisitesPage        from '@/pages/Visites/VisitesPage';
import VisiteDetailPage   from '@/pages/Visites/VisitDetailPage';

import PaiementsPage      from '@/pages/Paiements/PaiementsPage';
import PaymentDetailPage  from '@/pages/Paiements/PaymentDetailPage';

import DocumentsPage      from '@/pages/Documents/DocumentsPage';

import TicketsPage        from '@/pages/Support/TicketsPage';
import TicketDetailPage   from '@/pages/Support/TicketDetailPage';

import NotificationsPage  from '@/pages/Notifications/NotificationsPage';
import ParametresCanaux   from '@/pages/Notifications/ParametresCanaux';

import UtilisateursPage   from '@/pages/Utilisateurs/UtilisateursPage';
import AgentsPage         from '@/pages/Agents/AgentsPage';
import AgentDetailPage    from '@/pages/Agents/AgentDetailPage';

import ZonesPage from './pages/zones/ZonesPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public ─────────────────────────────── */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ── Protected ──────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>

            {/* Dashboard & Reporting */}
            <Route path="/dashboard"  element={<DashboardPage />} />

            {/* CRM */}
            <Route path="/leads"           element={<LeadsPage />} />
            <Route path="/leads/:id"       element={<LeadDetailPage />} />
            <Route path="/clients"         element={<ClientsPage />} />
            <Route path="/clients/:id"     element={<ClientDetailPage />} />
            <Route path="/terrains"        element={<TerrainsPage />} />
            <Route path="/terrains/:id"    element={<TerrainDetailPage />} />
            <Route path="/visites"         element={<VisitesPage />} />
            <Route path="/visites/:id"     element={<VisiteDetailPage />} />

            {/* Support & Docs */}
            <Route path="/documents"       element={<DocumentsPage />} />
            <Route path="/support"         element={<TicketsPage />} />
            <Route path="/support/:id"     element={<TicketDetailPage />} />

            {/* Notifications */}
            <Route path="/notifications"              element={<NotificationsPage />} />
            <Route path="/notifications/parametres"   element={<ParametresCanaux />} />

            {/* Admin */}
            <Route path="/agents"          element={<AgentsPage />} />
            <Route path="/agents/:id"      element={<AgentDetailPage />} />
            <Route path="/zones"           element={<ZonesPage />} />

            {/* Finance — role restricted */}
            <Route element={<ProtectedRoute allowedRoles={['admin','super_admin','manager','finance']} />}>
              <Route path="/paiements"       element={<PaiementsPage />} />
              <Route path="/paiements/:id"   element={<PaymentDetailPage />} />
              <Route path="/reporting"       element={<ReportingPage />} />
            </Route>
            

            {/* Admin-only */}
            <Route element={<ProtectedRoute allowedRoles={['admin','super_admin']} />}>
              <Route path="/utilisateurs"    element={<UtilisateursPage />} />
            </Route>

          </Route>
        </Route>

        {/* ── 404 ────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}