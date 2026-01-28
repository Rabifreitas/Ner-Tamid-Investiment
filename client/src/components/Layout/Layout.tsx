/**
 * Ner Tamid - Layout Component
 * 
 * Main application shell with navigation
 * 
 * #NerTamidEternal
 */

import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Home, PieChart, Heart, LogOut, Menu, X, Zap, Users, Settings, Search } from 'lucide-react';
import { useState } from 'react';
import MenorahLogo from '../MenorahLogo/MenorahLogo';
import './Layout.css';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/portfolio', label: 'Portfólio', icon: PieChart },
        { path: '/terminal', label: 'Terminal Live', icon: Zap },
        { path: '/community', label: 'Comunidade', icon: Users },
        { path: '/discovery', label: 'Hunter AI', icon: Search },
        { path: '/charity', label: 'Caridade', icon: Heart },
        { path: '/settings', label: 'Configurações', icon: Settings },
    ];

    return (
        <div className="layout">
            {/* Header */}
            <header className="layout-header">
                <div className="header-content">
                    <Link to="/dashboard" className="header-logo">
                        <MenorahLogo size={40} />
                        <span className="logo-text">Ner Tamid</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="header-nav desktop-only">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="header-actions">
                        <div className="user-info desktop-only">
                            <span className="user-name">{user?.fullName}</span>
                            <span className="charity-badge">
                                <Heart size={12} />
                                {user?.charityPercentage}%
                            </span>
                        </div>

                        <button className="btn btn-icon" onClick={handleLogout} title="Sair">
                            <LogOut size={18} />
                        </button>

                        {/* Mobile menu button */}
                        <button
                            className="btn btn-icon mobile-only"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <nav className="mobile-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                )}
            </header>

            {/* Main Content */}
            <main className="layout-main">
                <div className="container">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="layout-footer">
                <div className="container">
                    <p className="footer-text">
                        🕎 Ner Tamid Eternal Insights | A Luz Eterna que guia investimentos com propósito
                    </p>
                    <p className="footer-charity">
                        <Heart size={14} className="text-emerald" />
                        20% de todos os lucros são destinados à caridade
                    </p>
                </div>
            </footer>
        </div>
    );
}
