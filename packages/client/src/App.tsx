import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from './store/authStore';
import AdminLayout from './layouts/AdminLayout';

const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const CustomersPage = lazy(() => import('./pages/Customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/Customers/CustomerDetailPage'));
const NewCustomerPage = lazy(() => import('./pages/Customers/NewCustomerPage'));
const BulkImportPage = lazy(() => import('./pages/Customers/BulkImportPage'));
const CustomerServicesPage = lazy(() => import('./pages/Services/CustomerServicesPage'));
const PaymentsPage = lazy(() => import('./pages/Payments/PaymentsPage'));
const ServiceCatalogPage = lazy(() => import('./pages/ServiceCatalog/ServiceCatalogPage'));
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

const PageLoader: React.FC = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
    <CircularProgress size={40} />
  </Box>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/new" element={<NewCustomerPage />} />
        <Route path="customers/import" element={<BulkImportPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="customer-services" element={<CustomerServicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="service-catalog" element={<ServiceCatalogPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;
