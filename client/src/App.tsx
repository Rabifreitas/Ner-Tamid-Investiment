/**
 * Ner Tamid Eternal Insights - Main App Component
 * 
 * #NerTamidEternal
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PortfolioPage from './pages/PortfolioPage';
import CharityPage from './pages/CharityPage';
import LiveTerminalPage from './pages/LiveTerminalPage';
import CommunityPage from './pages/CommunityPage';
import DiscoveryPage from './pages/DiscoveryPage';
import SettingsPage from './pages/SettingsPage';
import { useSocket } from './hooks/useSocket';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

// Socket Manager to bridge Auth and Real-time
function SocketManager({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    useSocket(token);
    return <>{children}</>;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <SocketManager>
                                <Layout>
                                    <Routes>
                                        <Route path="dashboard" element={<DashboardPage />} />
                                        <Route path="portfolio" element={<PortfolioPage />} />
                                        <Route path="terminal" element={<LiveTerminalPage />} />
                                        <Route path="community" element={<CommunityPage />} />
                                        <Route path="discovery" element={<DiscoveryPage />} />
                                        <Route path="charity" element={<CharityPage />} />
                                        <Route path="settings" element={<SettingsPage />} />
                                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                                    </Routes>
                                </Layout>
                            </SocketManager>
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
