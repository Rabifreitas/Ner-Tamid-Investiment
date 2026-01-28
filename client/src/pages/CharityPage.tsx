/**
 * Ner Tamid - Charity Page
 * 
 * Charity impact tracking and organization management
 * 
 * #NerTamidEternal
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import './CharityPage.css';

interface CharitySummary {
    totalDonated: number;
    totalDonations: number;
    averagePercentage: number;
    topCategories: Array<{ category: string; amount: number }>;
}

interface CharityOrg {
    id: string;
    name: string;
    description: string;
    category: string;
    is_verified: boolean;
    total_received: number;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

export default function CharityPage() {
    const [summary, setSummary] = useState<CharitySummary | null>(null);
    const [orgs, setOrgs] = useState<CharityOrg[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [selectedCategory]);

    async function loadData() {
        try {
            const [summaryData, orgsData] = await Promise.all([
                api.getCharitySummary(),
                api.getCharityOrganizations(selectedCategory || undefined),
            ]);
            setSummary(summaryData);
            setOrgs(orgsData.organizations);
            if (categories.length === 0) {
                setCategories(orgsData.categories);
            }
        } catch (error) {
            console.error('Failed to load charity data:', error);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    };

    const categoryNames: Record<string, string> = {
        health: 'Saúde',
        children: 'Crianças',
        education: 'Educação',
        environment: 'Meio Ambiente',
        humanitarian: 'Humanitário',
        food: 'Alimentação',
        social: 'Social',
    };

    return (
        <div className="charity-page">
            <header className="page-header">
                <div>
                    <h1>Seu Impacto Social 🌳</h1>
                    <p className="header-subtitle">
                        Acompanhe como seus investimentos estão fazendo a diferença
                    </p>
                </div>
            </header>

            {/* Impact Stats */}
            <div className="impact-stats">
                <motion.div
                    className="impact-card main-impact"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="impact-icon">
                        <Heart size={40} />
                    </div>
                    <div className="impact-content">
                        <span className="impact-label">Total Doado</span>
                        <span className="impact-value">
                            {formatCurrency(summary?.totalDonated || 0)}
                        </span>
                    </div>
                    <div className="impact-tree">🌳</div>
                </motion.div>

                <motion.div
                    className="impact-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="impact-icon small">
                        <TrendingUp size={24} />
                    </div>
                    <div className="impact-content">
                        <span className="impact-label">Doações</span>
                        <span className="impact-value small">{summary?.totalDonations || 0}</span>
                    </div>
                </motion.div>

                <motion.div
                    className="impact-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="impact-icon small">
                        <Users size={24} />
                    </div>
                    <div className="impact-content">
                        <span className="impact-label">Média</span>
                        <span className="impact-value small">{summary?.averagePercentage || 20}%</span>
                    </div>
                </motion.div>
            </div>

            {/* Category Filter */}
            <div className="category-filter">
                <h2>Organizações Parceiras</h2>
                <div className="category-tabs">
                    <button
                        className={`category-tab ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('')}
                    >
                        Todas
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Organizations Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Carregando organizações...</p>
                </div>
            ) : (
                <div className="orgs-grid">
                    {orgs.map((org, index) => (
                        <motion.div
                            key={org.id}
                            className="org-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="org-header">
                                <h3>{org.name}</h3>
                                {org.is_verified && (
                                    <span className="verified-badge">
                                        <CheckCircle size={14} />
                                        Verificada
                                    </span>
                                )}
                            </div>
                            <span className="org-category">
                                {categoryNames[org.category] || org.category}
                            </span>
                            <p className="org-description">{org.description}</p>
                            <div className="org-footer">
                                <span className="org-received">
                                    {formatCurrency(org.total_received)} recebidos
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* The 20% Promise */}
            <motion.div
                className="promise-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="promise-icon">🕎</div>
                <h2>A Promessa dos 20%</h2>
                <p>
                    Cada lucro realizado na plataforma automaticamente aloca <strong>20%</strong> para
                    causas sociais. Esta regra está codificada no coração do sistema e registrada em
                    blockchain para total transparência.
                </p>
                <div className="promise-features">
                    <div className="promise-feature">
                        <CheckCircle size={20} />
                        <span>Automático e instantâneo</span>
                    </div>
                    <div className="promise-feature">
                        <CheckCircle size={20} />
                        <span>Verificável em blockchain</span>
                    </div>
                    <div className="promise-feature">
                        <CheckCircle size={20} />
                        <span>100% transparente</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
