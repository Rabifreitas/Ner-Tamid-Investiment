/**
 * Ner Tamid - Dashboard Page
 * 
 * Main dashboard with portfolio overview and charity impact
 * 
 * #NerTamidEternal
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Heart, PieChart,
    ArrowUpRight, Clock, DollarSign, Target
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import './DashboardPage.css';

interface PortfolioSummary {
    totalValue: number;
    totalCost: number;
    totalUnrealizedProfit: number;
    totalRealizedProfit: number;
    totalCharityAllocated: number;
}

interface CharitySummary {
    totalDonated: number;
    totalDonations: number;
    averagePercentage: number;
}

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
    const [charity, setCharity] = useState<CharitySummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [portfolioData, charityData] = await Promise.all([
                    api.getPortfolio(),
                    api.getCharitySummary(),
                ]);
                setPortfolio(portfolioData.summary);
                setCharity(charityData);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Carregando sua carteira...</p>
            </div>
        );
    }

    const returnPercent = portfolio && portfolio.totalCost > 0
        ? ((portfolio.totalValue - portfolio.totalCost) / portfolio.totalCost) * 100
        : 0;

    return (
        <div className="dashboard-page">
            {/* Welcome Header */}
            <motion.header
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1>Shalom, {user?.fullName?.split(' ')[0]}! 🕎</h1>
                    <p className="header-subtitle">
                        Sua luz está fazendo a diferença no mundo
                    </p>
                </div>
                <div className="header-actions">
                    <Link to="/portfolio" className="btn btn-primary">
                        <PieChart size={18} />
                        Ver Portfólio Completo
                    </Link>
                </div>
            </motion.header>

            {/* Stats Grid */}
            <div className="stats-grid">
                {/* Portfolio Value */}
                <motion.div
                    className="stat-card stat-primary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="stat-header">
                        <DollarSign className="stat-icon" />
                        <span className="stat-label">Valor Total do Portfólio</span>
                    </div>
                    <div className="stat-value">
                        {formatCurrency(portfolio?.totalValue || 0)}
                    </div>
                    <div className={`stat-change ${returnPercent >= 0 ? 'positive' : 'negative'}`}>
                        {returnPercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{formatPercent(returnPercent)}</span>
                        <span className="change-label">desde o início</span>
                    </div>
                </motion.div>

                {/* Unrealized Profit */}
                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-header">
                        <Target className="stat-icon text-purple" />
                        <span className="stat-label">Lucro Não Realizado</span>
                    </div>
                    <div className="stat-value">
                        {formatCurrency(portfolio?.totalUnrealizedProfit || 0)}
                    </div>
                    <div className="stat-subtitle">
                        Potencial de caridade: {formatCurrency((portfolio?.totalUnrealizedProfit || 0) * 0.2)}
                    </div>
                </motion.div>

                {/* Realized Profit */}
                <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="stat-header">
                        <TrendingUp className="stat-icon text-gold" />
                        <span className="stat-label">Lucro Realizado</span>
                    </div>
                    <div className="stat-value">
                        {formatCurrency(portfolio?.totalRealizedProfit || 0)}
                    </div>
                    <div className="stat-subtitle">
                        <Clock size={14} />
                        Total desde abertura da conta
                    </div>
                </motion.div>

                {/* Charity Card - Highlighted */}
                <motion.div
                    className="stat-card stat-charity"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="stat-header">
                        <Heart className="stat-icon" />
                        <span className="stat-label">Total Doado para Caridade</span>
                    </div>
                    <div className="stat-value charity-value">
                        {formatCurrency(charity?.totalDonated || 0)}
                    </div>
                    <div className="charity-stats">
                        <span className="charity-stat">
                            <strong>{charity?.totalDonations || 0}</strong> doações
                        </span>
                        <span className="charity-divider">•</span>
                        <span className="charity-stat">
                            <strong>{charity?.averagePercentage || 20}%</strong> média
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions & Charity Impact */}
            <div className="dashboard-grid">
                {/* Quick Actions */}
                <motion.section
                    className="dashboard-section"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2>Ações Rápidas</h2>
                    <div className="quick-actions">
                        <Link to="/portfolio" className="action-card">
                            <div className="action-icon">
                                <PieChart size={24} />
                            </div>
                            <div className="action-content">
                                <h3>Gerenciar Portfólio</h3>
                                <p>Adicionar ou vender investimentos</p>
                            </div>
                            <ArrowUpRight size={20} className="action-arrow" />
                        </Link>

                        <Link to="/charity" className="action-card action-charity">
                            <div className="action-icon">
                                <Heart size={24} />
                            </div>
                            <div className="action-content">
                                <h3>Ver Impacto</h3>
                                <p>Acompanhe suas doações</p>
                            </div>
                            <ArrowUpRight size={20} className="action-arrow" />
                        </Link>
                    </div>
                </motion.section>

                {/* Charity Progress */}
                <motion.section
                    className="dashboard-section charity-section"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <h2>Seu Impacto Social 🌳</h2>
                    <div className="charity-progress-card">
                        <div className="charity-tree">
                            <div className="tree-emoji">🌳</div>
                            <div className="tree-growth">
                                {Math.floor((charity?.totalDonated || 0) / 100)} folhas plantadas
                            </div>
                        </div>
                        <div className="charity-message">
                            <p>
                                Cada €100 doados representa uma nova folha na sua árvore do bem.
                                Continue investindo com propósito!
                            </p>
                        </div>
                        <div className="charity-percentage">
                            <span className="percentage-label">Sua configuração:</span>
                            <span className="percentage-value">{user?.charityPercentage || 20}%</span>
                            <span className="percentage-badge">do lucro para caridade</span>
                        </div>
                    </div>
                </motion.section>
            </div>

            {/* Footer Message */}
            <motion.div
                className="dashboard-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <p>
                    💡 <strong>Lembre-se:</strong> 20% de todos os lucros realizados são automaticamente
                    destinados à caridade. Esta é a luz eterna que guia nossos investimentos.
                </p>
            </motion.div>
        </div>
    );
}
