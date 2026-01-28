import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shield, Key, Plus, RefreshCw, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ExchangeManager.css';

interface ExchangeConnection {
    id: string;
    exchange_id: string;
    is_active: boolean;
    last_used_at: string | null;
}

export const ExchangeManager: React.FC = () => {
    const [exchanges, setExchanges] = useState<ExchangeConnection[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        exchangeId: 'binance',
        apiKey: '',
        apiSecret: '',
        passphrase: ''
    });

    const fetchExchanges = async () => {
        try {
            const data = await api.getConnectedExchanges();
            setExchanges(data);
        } catch (err) {
            setError('Falha ao carregar conexões');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExchanges();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.connectExchange(formData);
            setShowForm(false);
            setFormData({ exchangeId: 'binance', apiKey: '', apiSecret: '', passphrase: '' });
            fetchExchanges();
        } catch (err: any) {
            setError(err.message || 'Erro ao conectar');
        } finally {
            setLoading(false);
        }
    };

    const supportedExchanges = [
        { id: 'binance', name: 'Binance' },
        { id: 'okx', name: 'OKX' },
        { id: 'bitget', name: 'Bitget' },
        { id: 'kraken', name: 'Kraken' },
        { id: 'kucoin', name: 'KuCoin' }
    ];

    return (
        <div className="exchange-manager">
            <header className="manager-header">
                <div>
                    <h2><Shield size={20} className="shield-icon" /> Minhas Exchanges</h2>
                    <p>Conecte suas contas via API Read-only para monitorar e automatizar.</p>
                </div>
                <button
                    className={`add-btn ${showForm ? 'active' : ''}`}
                    onClick={() => setShowForm(!showForm)}
                >
                    <Plus size={18} /> {showForm ? 'Cancelar' : 'Nova Conexão'}
                </button>
            </header>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        className="connection-form-card"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Exchange</label>
                                    <select
                                        value={formData.exchangeId}
                                        onChange={(e) => setFormData({ ...formData, exchangeId: e.target.value })}
                                    >
                                        {supportedExchanges.map(ex => (
                                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>API Key</label>
                                    <input
                                        type="password"
                                        placeholder="Min 5 characters"
                                        value={formData.apiKey}
                                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>API Secret</label>
                                    <input
                                        type="password"
                                        value={formData.apiSecret}
                                        onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                                        required
                                    />
                                </div>
                                {formData.exchangeId === 'okx' || formData.exchangeId === 'kucoin' ? (
                                    <div className="input-group">
                                        <label>Passphrase</label>
                                        <input
                                            type="password"
                                            value={formData.passphrase}
                                            onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            {error && <div className="form-error"><AlertCircle size={14} /> {error}</div>}

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? <RefreshCw className="spin" size={16} /> : <Key size={16} />}
                                Confirmar Conexão Segura
                            </button>
                            <p className="security-note">
                                <Shield size={12} />
                                Suas chaves são criptografadas com AES-256.
                                <a href="#" style={{ color: '#ffcc33', marginLeft: '5px' }}>Leia nosso Guia de Segurança</a>
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="connection-list">
                {exchanges.length === 0 && !loading && (
                    <div className="empty-state">
                        <AlertCircle size={40} />
                        <p>Nenhuma exchange conectada. Adicione uma para começar.</p>
                    </div>
                )}

                {exchanges.map(ex => (
                    <div key={ex.id} className="exchange-card">
                        <div className="card-top">
                            <div className="exchange-info">
                                <span className="exchange-badge">{ex.exchange_id.toUpperCase()}</span>
                                <span className={`status-pill ${ex.is_active ? 'active' : 'inactive'}`}>
                                    {ex.is_active ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                    {ex.is_active ? 'Conectado' : 'Erro'}
                                </span>
                            </div>
                            <button className="delete-btn"><Trash2 size={16} /></button>
                        </div>
                        <div className="card-footer">
                            <span className="last-used">
                                Último uso: {ex.last_used_at ? new Date(ex.last_used_at).toLocaleDateString() : 'Nunca'}
                            </span>
                            <button className="balance-btn">Ver Saldo</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
