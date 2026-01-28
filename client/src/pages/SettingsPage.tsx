import React from 'react';
import { Settings, Shield, User, Bell } from 'lucide-react';
import { ExchangeManager } from '../components/ExchangeManager/ExchangeManager';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
    return (
        <div className="settings-page">
            <header className="settings-header">
                <h1><Settings className="header-icon" /> Configurações</h1>
                <p>Gerencie sua segurança, conexões e preferências da Luz Eterna.</p>
            </header>

            <div className="settings-container">
                <aside className="settings-nav">
                    <button className="nav-item active"><Shield size={18} /> Conexões & API</button>
                    <button className="nav-item"><User size={18} /> Perfil & Impacto</button>
                    <button className="nav-item"><Bell size={18} /> Notificações</button>
                </aside>

                <main className="settings-content">
                    <section className="settings-section">
                        <ExchangeManager />
                    </section>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
