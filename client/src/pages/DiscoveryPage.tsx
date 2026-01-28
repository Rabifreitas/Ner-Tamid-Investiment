import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Gem, Zap, Search, RefreshCw, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './DiscoveryPage.css';

interface MarketGem {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    marketCap: number;
    volume24h: number;
    volumeChangePct: number;
    jewelScore: number;
    signals: string[];
    analysis: string;
    type: 'crypto' | 'stock';
}

const DiscoveryPage: React.FC = () => {
    const [gems, setGems] = useState<MarketGem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);

    const fetchGems = async () => {
        try {
            const res = await api.getMarketGems();
            setGems(res.gems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        try {
            const res = await api.triggerMarketScan();
            setGems(res.gems);
        } catch (err) {
            console.error(err);
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        fetchGems();
    }, []);

    return (
        <div className="discovery-page">
            <header className="discovery-header">
                <div className="header-text">
                    <h1><Gem className="header-icon" /> Caçador de Pérolas (AI)</h1>
                    <p>Scanner profundo de mercado em busca de oportunidades assimétricas ocultas.</p>
                </div>
                <button
                    className={`scan-btn ${isScanning ? 'scanning' : ''}`}
                    onClick={handleScan}
                    disabled={isScanning}
                >
                    {isScanning ? <RefreshCw className="spin" /> : <Search size={18} />}
                    {isScanning ? 'Analisando Mercado...' : 'Novo Scan Profundo'}
                </button>
            </header>

            <div className="status-banner">
                <ShieldCheck size={16} />
                <span>Nossa IA analisa divergências de volume, RSI e fluxo de "Smart Money" em tempo real.</span>
            </div>

            {loading ? (
                <div className="loading-state">
                    <RefreshCw className="spin" size={40} />
                    <p>Calibrando radar de pérolas...</p>
                </div>
            ) : (
                <div className="discovery-grid">
                    <AnimatePresence>
                        {gems.map((gem, index) => (
                            <motion.div
                                key={gem.symbol}
                                className="pearl-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="card-top">
                                    <div className="asset-info">
                                        <span className="symbol-badge">{gem.symbol}</span>
                                        <h3 className="asset-name">{gem.name}</h3>
                                    </div>
                                    <div className="score-badge" style={{
                                        borderColor: gem.jewelScore > 90 ? '#ffcc33' : '#00ff88',
                                        color: gem.jewelScore > 90 ? '#ffcc33' : '#00ff88'
                                    }}>
                                        <Zap size={14} />
                                        <span>{gem.jewelScore}% Confiança</span>
                                    </div>
                                </div>

                                <div className="card-metrics">
                                    <div className="metric">
                                        <span className="label">Preço Atual</span>
                                        <span className="value">${gem.price?.toLocaleString()}</span>
                                    </div>
                                    <div className="metric">
                                        <span className="label">Volume 24h</span>
                                        <span className="value">+{gem.volumeChangePct.toFixed(0)}%</span>
                                    </div>
                                    <div className="metric">
                                        <span className="label">Market Cap</span>
                                        <span className="value">${(gem.marketCap / 1e6).toFixed(1)}M</span>
                                    </div>
                                </div>

                                <div className="card-analysis">
                                    <h4><TrendingUp size={14} /> Análise Deep Ner Tamid</h4>
                                    <p>{gem.analysis}</p>
                                </div>

                                <div className="card-signals">
                                    {gem.signals.map(s => (
                                        <span key={s} className="signal-tag">
                                            <ShieldCheck size={12} /> {s}
                                        </span>
                                    ))}
                                </div>

                                <div className="card-footer">
                                    <button className="trade-btn">Adicionar ao Radar</button>
                                    <div className="risk-level">
                                        <AlertTriangle size={12} /> Risco: Moderado
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default DiscoveryPage;
