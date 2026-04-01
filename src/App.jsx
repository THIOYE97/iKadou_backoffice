import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/custome/ProtectedRoute';
import MainLayout from '@/components/custome/MainLayout';

import LoginPage from '@/pages/Auth/LoginPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import NotFoundPage from '@/pages/Notfound/NotFoundPage';

import LeadsPage from '@/pages/leads/leadsPage';
import LeadDetailPage from '@/pages/leads/leadDetailPage';

import ClientsPage from '@/pages/Clients/clientsPage';
import ClientDetailPage from '@/pages/Clients/ClientDetailPage';

import TerrainsPage from '@/pages/terrains/TerrainsPage';
import TerrainDetailPage from '@/pages/terrains/TerrainDetailPage';

import VisitesPage from '@/pages/Visites/VisitesPage';
import VisitCreatePage from '@/pages/Visites/VisitCreatePage';
import VisitDetailPage from '@/pages/Visites/VisitDetailPage';

import PaiementsPage from '@/pages/Paiements/PaiementsPage';
import PaiementCreatePage from '@/pages/Paiements/PaiementCreatePage';
import PaiementDetailPage from '@/pages/Paiements/PaiementDetailPage';

import DocumentsPage from '@/pages/Documents/DocumentsPage';

import TicketsPage from '@/pages/Support/TicketsPage';
import TicketCreatePage from '@/pages/Support/TicketCreatePage';
import TicketDetailPage from '@/pages/Support/TicketDetailPage';

import NotificationsPage from '@/pages/Notifications/NotificationsPage';

import UtilisateursPage from '@/pages/Utilisateurs/UtilisateursPage';

import AgentsPage from '@/pages/Agents/AgentsPage';
import AgentCreatePage from '@/pages/Agents/AgentCreatePage';
import AgentDetailPage from '@/pages/Agents/AgentDetailPage';

import ReportingPage from '@/pages/Reporting/ReportingPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />

            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />

            <Route path="/terrains" element={<TerrainsPage />} />
            <Route path="/terrains/:id" element={<TerrainDetailPage />} />

            <Route path="/visites" element={<VisitesPage />} />
            <Route path="/visites/new" element={<VisitCreatePage />} />
            <Route path="/visites/:id" element={<VisitDetailPage />} />

            <Route path="/documents" element={<DocumentsPage />} />

            <Route path="/support" element={<TicketsPage />} />
            <Route path="/support/new" element={<TicketCreatePage />} />
            <Route path="/support/:id" element={<TicketDetailPage />} />

            <Route path="/notifications" element={<NotificationsPage />} />

            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/new" element={<AgentCreatePage />} />
            <Route path="/agents/:id" element={<AgentDetailPage />} />

            <Route
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin', 'manager']} />
              }
            >
              <Route path="/reporting" element={<ReportingPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['admin', 'super_admin', 'manager', 'finance']}
                />
              }
            >
              <Route path="/paiements" element={<PaiementsPage />} />
              <Route path="/paiements/new" element={<PaiementCreatePage />} />
              <Route path="/paiements/:id" element={<PaiementDetailPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']} />
              }
            >
              <Route path="/utilisateurs" element={<UtilisateursPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}