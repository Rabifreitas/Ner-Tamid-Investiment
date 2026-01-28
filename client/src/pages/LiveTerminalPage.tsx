import React, { useEffect, useState } from 'react';
import { useLiveStore } from '../stores/liveStore';
import { NerTamidVisualizer } from '../components/NerTamidVisualizer';
import { ImpactFeed } from '../components/ImpactFeed/ImpactFeed';
import { Leaderboard } from '../components/Leaderboard/Leaderboard';
import { api } from '../services/api';
import { TrendingUp, Bell, Zap } from 'lucide-react';
import './LiveTerminalPage.css';

const LiveTerminalPage: React.FC = () => {
    const { prices, notifications } = useLiveStore();
    const [portfolioSymbols, setPortfolioSymbols] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const res = await api.getPortfolio();
                const symbols = res.investments.map(i => i.symbol);
                setPortfolioSymbols(Array.from(new Set(symbols)));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolio();
    }, []);

    // Price activity calculation for the 3D visualizer intensity
    const activityLevel = Object.keys(prices).length > 0 ? 1.5 : 1.0;

    return (
        <div className="live-terminal">
            <header className="terminal-header">
                <h1><Zap className="zap-icon" /> Ner Tamid Live Terminal</h1>
                <p>Real-time Market Orchestration & Philanthropic Impact</p>
            </header>

            <div className="terminal-content">
                <div className="visualizer-section">
                    <NerTamidVisualizer activityLevel={activityLevel} />
                    <div className="visualizer-overlay">
                        <div className="status-badge">
                            <span className="live-dot"></span> LIVE
                        </div>
                    </div>
                </div>

                <div className="data-sections community-grid">
                    <section className="price-feed">
                        <h3><TrendingUp size={20} /> Market Feed</h3>
                        <div className="price-grid">
                            {portfolioSymbols.map(symbol => (
                                <div key={symbol} className="price-card">
                                    <span className="symbol">{symbol}</span>
                                    <span className={`price ${prices[symbol] ? 'updated' : ''}`}>
                                        {prices[symbol] ? `$${prices[symbol].toLocaleString()}` : 'Waiting...'}
                                    </span>
                                </div>
                            ))}
                            {portfolioSymbols.length === 0 && !loading && (
                                <p className="empty-msg">No active positions.</p>
                            )}
                        </div>
                    </section>

                    <section className="social-column">
                        <ImpactFeed />
                    </section>

                    <section className="leaderboard-column">
                        <Leaderboard />
                    </section>

                    <section className="notifications-area">
                        <h3><Bell size={20} /> Execution Activity</h3>
                        <div className="notification-list">
                            {notifications.map((n, i) => (
                                <div key={i} className="notification-item">
                                    <div className="content">
                                        <span className="msg">{n.message}</span>
                                        <span className="time">{new Date(n.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <p className="empty-msg">Waiting for automated executions...</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LiveTerminalPage;
