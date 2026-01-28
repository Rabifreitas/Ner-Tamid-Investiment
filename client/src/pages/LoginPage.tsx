/**
 * Ner Tamid - Login Page
 * 
 * #NerTamidEternal
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import MenorahLogo from '../components/MenorahLogo/MenorahLogo';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import './AuthPages.css';

import { SocialButtons } from '../components/SocialButtons/SocialButtons';

export default function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Phone Login State
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.login(email, password);
            login(response.user, response.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha no login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            // Simulated OAuth result
            const res = await api.loginGoogle({
                email: 'google_user@example.com',
                fullName: 'Google User',
                providerId: 'google_' + Math.random(),
                token: 'mock_token'
            });
            login(res.user, res.token);
            navigate('/dashboard');
        } catch (err) {
            setError('Falha no login com Google');
        }
    };

    const handleAppleLogin = async () => {
        setError('');
        try {
            const res = await api.loginApple({
                email: 'apple_user@example.com',
                fullName: 'Apple User',
                providerId: 'apple_' + Math.random(),
                token: 'mock_token'
            });
            login(res.user, res.token);
            navigate('/dashboard');
        } catch (err) {
            setError('Falha no login com Apple');
        }
    };

    const handlePhoneLogin = async () => {
        const p = prompt('Digite seu número de telefone:');
        if (!p) return;
        setPhone(p);
        setError('');
        try {
            await api.sendPhoneOTP(p);
            setShowOtp(true);
        } catch (err) {
            setError('Falha ao enviar código');
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const res = await api.verifyPhoneOTP(phone, otp);
            login(res.user, res.token);
            navigate('/dashboard');
        } catch (err) {
            setError('Código inválido');
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

                    <h1>Bem-vindo de Volta</h1>
                    <p className="auth-subtitle">Entre na sua conta para continuar</p>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!showOtp ? (
                        <>
                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <div className="input-wrapper">
                                        <Mail size={18} className="input-icon" />
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Senha</label>
                                    <div className="input-wrapper">
                                        <Lock size={18} className="input-icon" />
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Entrando...' : 'Entrar'}
                                    {!loading && <ArrowRight size={18} />}
                                </button>
                            </form>

                            <SocialButtons
                                onGoogle={handleGoogleLogin}
                                onApple={handleAppleLogin}
                                onPhone={handlePhoneLogin}
                            />
                        </>
                    ) : (
                        <div className="otp-container">
                            <h2>Verificar Telefone</h2>
                            <p>Enviamos um código para {phone}</p>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="777888"
                                className="input"
                            />
                            <button onClick={handleVerifyOtp} className="btn btn-primary btn-full mt-1">
                                Confirmar Código
                            </button>
                            <button onClick={() => setShowOtp(false)} className="btn-text mt-1">
                                Voltar
                            </button>
                        </div>
                    )}

                    <p className="auth-footer">
                        Não tem uma conta?{' '}
                        <Link to="/register">Criar conta gratuita</Link>
                    </p>
                </motion.div>

                <div className="auth-decoration">
                    <div className="glow-orb" />
                </div>
            </div>
        </div>
    );
}
