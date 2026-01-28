/**
 * Ner Tamid - Landing Page
 * 
 * Beautiful landing page with Luz Eterna theme
 * 
 * #NerTamidEternal
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, TrendingUp, Users, ArrowRight, Star } from 'lucide-react';
import MenorahLogo from '../components/MenorahLogo/MenorahLogo';
import './LandingPage.css';

export default function LandingPage() {
    const features = [
        {
            icon: Heart,
            title: 'Caridade Automática',
            description: '20% de todos os lucros são automaticamente destinados a causas sociais. Seu sucesso financeiro gera impacto real.',
            color: 'emerald',
        },
        {
            icon: Shield,
            title: 'IA Magen (Proteção)',
            description: 'Sistema inteligente de proteção que monitora riscos e protege seu patrimônio 24/7.',
            color: 'purple',
        },
        {
            icon: TrendingUp,
            title: 'Gestão Inteligente',
            description: 'Algoritmos avançados para otimização de carteira e recomendações personalizadas.',
            color: 'gold',
        },
        {
            icon: Users,
            title: 'Transparência Total',
            description: 'Todas as doações são registradas em blockchain para rastreabilidade completa.',
            color: 'blue',
        },
    ];

    const stats = [
        { value: '20%', label: 'Mínimo para Caridade' },
        { value: '€0', label: 'Taxas Escondidas' },
        { value: '24/7', label: 'Proteção IA' },
        { value: '100%', label: 'Transparência' },
    ];

    return (
        <div className="landing-page">
            {/* Starfield background */}
            <div className="starfield">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="star"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <header className="landing-header">
                <div className="container">
                    <Link to="/" className="logo-link">
                        <MenorahLogo size={48} />
                        <span className="logo-text">Ner Tamid</span>
                    </Link>
                    <nav className="landing-nav">
                        <Link to="/login" className="nav-link">Entrar</Link>
                        <Link to="/register" className="btn btn-primary">
                            Começar Agora
                            <ArrowRight size={16} />
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <motion.div
                        className="hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="hero-badge">
                            <Star size={14} />
                            <span>A Luz Eterna dos Investimentos</span>
                        </div>

                        <h1 className="hero-title">
                            Investimentos com <span className="text-gold">Propósito</span>
                        </h1>

                        <p className="hero-subtitle">
                            Plataforma autônoma de gestão de investimentos onde <strong>20% de todos os lucros</strong> são
                            automaticamente destinados a causas sociais. Seu sucesso gera impacto real no mundo.
                        </p>

                        <div className="hero-cta">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Criar Conta Gratuita
                                <ArrowRight size={20} />
                            </Link>
                            <Link to="/login" className="btn btn-secondary btn-lg">
                                Já tenho conta
                            </Link>
                        </div>

                        <div className="hero-stats">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    className="stat-item"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                >
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Animated Menorah */}
                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                    >
                        <div className="glow-orb" />
                        <MenorahLogo size={300} animated />
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2>Por que escolher <span className="text-gold">Ner Tamid</span>?</h2>
                        <p>Uma plataforma construída sobre princípios éticos e tecnologia de ponta</p>
                    </motion.div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className={`feature-card feature-${feature.color}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="feature-icon">
                                    <feature.icon size={28} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Charity Highlight Section */}
            <section className="charity-section">
                <div className="container">
                    <motion.div
                        className="charity-content"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <div className="charity-icon">
                            <Heart size={64} />
                        </div>
                        <h2>O Coração Ético da Plataforma</h2>
                        <p className="charity-description">
                            <strong>20% de todos os lucros realizados</strong> são automaticamente alocados para
                            organizações de caridade verificadas. Esta regra é inviolável - está integrada no
                            código central da plataforma e registrada em blockchain para total transparência.
                        </p>
                        <div className="charity-features">
                            <div className="charity-feature">
                                <span className="check">✓</span>
                                Alocação automática e instantânea
                            </div>
                            <div className="charity-feature">
                                <span className="check">✓</span>
                                Escolha suas causas favoritas
                            </div>
                            <div className="charity-feature">
                                <span className="check">✓</span>
                                Rastreamento em blockchain
                            </div>
                            <div className="charity-feature">
                                <span className="check">✓</span>
                                Relatórios de impacto detalhados
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <motion.div
                        className="cta-content"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>Pronto para investir com propósito?</h2>
                        <p>Junte-se a uma comunidade de investidores que fazem a diferença</p>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Começar Agora - É Grátis
                            <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <MenorahLogo size={40} />
                            <span>Ner Tamid Eternal Insights</span>
                        </div>
                        <p className="footer-tagline">
                            🕎 A Luz Eterna que guia investimentos com propósito
                        </p>
                        <p className="footer-copyright">
                            © 2024 Ner Tamid. Todos os direitos reservados. #NerTamidEternal
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
