import React from 'react';
import { Users, Globe } from 'lucide-react';
import { VotingWidget } from '../components/VotingWidget/VotingWidget';
import { Leaderboard } from '../components/Leaderboard/Leaderboard';
import { ImpactFeed } from '../components/ImpactFeed/ImpactFeed';
import './CommunityPage.css';

const CommunityPage: React.FC = () => {
    return (
        <div className="community-page">
            <header className="community-header">
                <h1><Users className="header-icon" /> Ner Tamid Community</h1>
                <p>Nossa luz brilha mais forte quando investimos juntos por um propósito maior.</p>
            </header>

            <div className="community-main">
                <div className="community-sidebar">
                    <VotingWidget />
                    <div className="community-stats-card">
                        <h3><Globe size={18} /> Impacto Global</h3>
                        <div className="stat">
                            <span className="label">Membros Ativos</span>
                            <span className="value">1,240</span>
                        </div>
                        <div className="stat">
                            <span className="label">Total Destinado</span>
                            <span className="value">$42,850 HKD</span>
                        </div>
                        <div className="stat">
                            <span className="label">Vidas Impactadas</span>
                            <span className="value">~15,000</span>
                        </div>
                    </div>
                </div>

                <div className="community-content">
                    <div className="content-grid">
                        <section className="community-section">
                            <ImpactFeed />
                        </section>
                        <section className="community-section">
                            <Leaderboard />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPage;
