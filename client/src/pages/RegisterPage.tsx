/**
 * Ner Tamid - Register Page
 * 
 * #NerTamidEternal
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Heart, ArrowRight, AlertCircle, Info } from 'lucide-react';
import MenorahLogo from '../components/MenorahLogo/MenorahLogo';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import './AuthPages.css';

export default function RegisterPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        charityPercentage: 20,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'charityPercentage' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            const response = await api.register({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                charityPercentage: Math.max(formData.charityPercentage, 20), // Enforce 20% minimum
            });
            login(response.user, response.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha no registro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <motion.div
                    className="auth-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link to="/" className="auth-logo">
                        <MenorahLogo size={60} />
                    </Link>

                    <h1>Criar Conta</h1>
                    <p className="auth-subtitle">Junte-se a nós e invista com propósito</p>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="fullName">Nome Completo</label>
                            <div className="input-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Seu nome completo"
                                    className="input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="seu@email.com"
                                    className="input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Senha</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirmar Senha</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="charityPercentage">
                                <Heart size={16} className="text-emerald" /> Percentual para Caridade
                            </label>
                            <div className="charity-slider">
                                <input
                                    type="range"
                                    id="charityPercentage"
                                    name="charityPercentage"
                                    min="20"
                                    max="50"
                                    value={formData.charityPercentage}
                                    onChange={handleChange}
                                    className="slider"
                                />
                                <span className="slider-value">{formData.charityPercentage}%</span>
                            </div>
                            <div className="form-hint">
                                <Info size={14} />
                                <span>Mínimo de 20% - o coração ético da plataforma</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                        >
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Já tem uma conta?{' '}
                        <Link to="/login">Entrar</Link>
                    </p>
                </motion.div>

                <div className="auth-decoration">
                    <div className="glow-orb" />
                </div>
            </div>
        </div>
    );
}
