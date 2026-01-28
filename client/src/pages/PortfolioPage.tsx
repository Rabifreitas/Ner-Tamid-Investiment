/**
 * Ner Tamid - Portfolio Page
 * 
 * Investment portfolio management with buy/sell functionality
 * 
 * #NerTamidEternal
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, TrendingUp, TrendingDown, X,
    ArrowRight, Heart,
    AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import './PortfolioPage.css';

interface Investment {
    id: string;
    symbol: string;
    name: string;
    type: string;
    quantity: number;
    averageCost: number;
    currentPrice: number | null;
    unrealizedProfit: number;
    realizedProfit: number;
    charityAllocated: number;
    value: number;
}

export default function PortfolioPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
    const [charityResult, setCharityResult] = useState<{ amount: number; percentage: number } | null>(null);

    useEffect(() => {
        loadPortfolio();
    }, []);

    async function loadPortfolio() {
        try {
            const data = await api.getPortfolio();
            setInvestments(data.investments);
        } catch (error) {
            console.error('Failed to load portfolio:', error);
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

    const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);

    return (
        <div className="portfolio-page">
            <header className="page-header">
                <div>
                    <h1>Portfólio de Investimentos</h1>
                    <p className="header-subtitle">
                        Gerencie seus investimentos com propósito
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus size={18} />
                    Adicionar Investimento
                </button>
            </header>

            {/* Portfolio Summary */}
            <div className="portfolio-summary">
                <div className="summary-card">
                    <span className="summary-label">Valor Total</span>
                    <span className="summary-value">{formatCurrency(totalValue)}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Posições Ativas</span>
                    <span className="summary-value">{investments.length}</span>
                </div>
            </div>

            {/* Investments List */}
            {loading ? (
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Carregando portfólio...</p>
                </div>
            ) : investments.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>Nenhum investimento ainda</h3>
                    <p>Comece adicionando seu primeiro investimento</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={18} />
                        Adicionar Investimento
                    </button>
                </div>
            ) : (
                <div className="investments-grid">
                    {investments.map((investment, index) => (
                        <motion.div
                            key={investment.id}
                            className="investment-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="investment-header">
                                <div className="investment-symbol">
                                    <span className="symbol">{investment.symbol}</span>
                                    <span className="type-badge">{investment.type}</span>
                                </div>
                                <div className={`profit-indicator ${investment.unrealizedProfit >= 0 ? 'positive' : 'negative'}`}>
                                    {investment.unrealizedProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                </div>
                            </div>

                            <div className="investment-name">{investment.name || investment.symbol}</div>

                            <div className="investment-metrics">
                                <div className="metric">
                                    <span className="metric-label">Quantidade</span>
                                    <span className="metric-value">{investment.quantity.toLocaleString()}</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">Custo Médio</span>
                                    <span className="metric-value">{formatCurrency(investment.averageCost)}</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">Valor Atual</span>
                                    <span className="metric-value">{formatCurrency(investment.value)}</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">Lucro/Prejuízo</span>
                                    <span className={`metric-value ${investment.unrealizedProfit >= 0 ? 'text-emerald' : 'text-red'}`}>
                                        {formatCurrency(investment.unrealizedProfit)}
                                    </span>
                                </div>
                            </div>

                            {investment.charityAllocated > 0 && (
                                <div className="charity-allocated">
                                    <Heart size={14} />
                                    {formatCurrency(investment.charityAllocated)} já doados
                                </div>
                            )}

                            <div className="investment-actions">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                        setSelectedInvestment(investment);
                                        setShowAddModal(true);
                                    }}
                                >
                                    Comprar Mais
                                </button>
                                <button
                                    className="btn btn-charity btn-sm"
                                    onClick={() => {
                                        setSelectedInvestment(investment);
                                        setShowSellModal(true);
                                    }}
                                >
                                    Vender
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Charity Result Toast */}
            {charityResult && (
                <motion.div
                    className="charity-toast"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                >
                    <Heart size={24} />
                    <div>
                        <strong>{formatCurrency(charityResult.amount)}</strong> ({charityResult.percentage}%)
                        <br />
                        alocados para caridade! 🎉
                    </div>
                    <button onClick={() => setCharityResult(null)}>
                        <X size={20} />
                    </button>
                </motion.div>
            )}

            {/* Add Investment Modal */}
            {showAddModal && (
                <AddInvestmentModal
                    existingInvestment={selectedInvestment}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedInvestment(null);
                    }}
                    onSuccess={() => {
                        setShowAddModal(false);
                        setSelectedInvestment(null);
                        loadPortfolio();
                    }}
                />
            )}

            {/* Sell Investment Modal */}
            {showSellModal && selectedInvestment && (
                <SellInvestmentModal
                    investment={selectedInvestment}
                    onClose={() => {
                        setShowSellModal(false);
                        setSelectedInvestment(null);
                    }}
                    onSuccess={(charity) => {
                        setShowSellModal(false);
                        setSelectedInvestment(null);
                        if (charity) {
                            setCharityResult(charity);
                            setTimeout(() => setCharityResult(null), 5000);
                        }
                        loadPortfolio();
                    }}
                />
            )}
        </div>
    );
}

// Add Investment Modal Component
function AddInvestmentModal({
    existingInvestment,
    onClose,
    onSuccess
}: {
    existingInvestment: Investment | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        symbol: existingInvestment?.symbol || '',
        assetName: existingInvestment?.name || '',
        assetType: existingInvestment?.type || 'stock',
        quantity: '',
        pricePerUnit: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.addInvestment({
                symbol: formData.symbol.toUpperCase(),
                assetName: formData.assetName,
                assetType: formData.assetType,
                quantity: parseFloat(formData.quantity),
                pricePerUnit: parseFloat(formData.pricePerUnit),
            });
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao adicionar investimento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{existingInvestment ? 'Comprar Mais' : 'Adicionar Investimento'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="modal-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Símbolo</label>
                            <input
                                type="text"
                                value={formData.symbol}
                                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                                placeholder="Ex: AAPL"
                                className="input"
                                required
                                disabled={!!existingInvestment}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select
                                value={formData.assetType}
                                onChange={(e) => setFormData(prev => ({ ...prev, assetType: e.target.value }))}
                                className="input"
                                disabled={!!existingInvestment}
                            >
                                <option value="stock">Ação</option>
                                <option value="etf">ETF</option>
                                <option value="crypto">Crypto</option>
                                <option value="bond">Obrigação</option>
                                <option value="fund">Fundo</option>
                            </select>
                        </div>
                    </div>

                    {!existingInvestment && (
                        <div className="form-group">
                            <label>Nome (opcional)</label>
                            <input
                                type="text"
                                value={formData.assetName}
                                onChange={(e) => setFormData(prev => ({ ...prev, assetName: e.target.value }))}
                                placeholder="Ex: Apple Inc."
                                className="input"
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantidade</label>
                            <input
                                type="number"
                                step="0.00000001"
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                placeholder="0"
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Preço por Unidade (€)</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={formData.pricePerUnit}
                                onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                                placeholder="0.00"
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    {formData.quantity && formData.pricePerUnit && (
                        <div className="form-total">
                            <span>Total:</span>
                            <span className="total-value">
                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
                                    .format(parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit))}
                            </span>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Adicionando...' : 'Adicionar'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Sell Investment Modal Component
function SellInvestmentModal({
    investment,
    onClose,
    onSuccess,
}: {
    investment: Investment;
    onClose: () => void;
    onSuccess: (charity: { amount: number; percentage: number } | null) => void;
}) {
    const [quantity, setQuantity] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState(
        investment.currentPrice?.toString() || investment.averageCost.toString()
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sellValue = parseFloat(quantity || '0') * parseFloat(pricePerUnit || '0');
    const costBasis = parseFloat(quantity || '0') * investment.averageCost;
    const profit = sellValue - costBasis;
    const charityEstimate = profit > 0 ? profit * 0.2 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await api.sellInvestment(investment.id, {
                quantity: parseFloat(quantity),
                pricePerUnit: parseFloat(pricePerUnit),
            });
            onSuccess(result.charity);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao vender');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Vender {investment.symbol}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="sell-info">
                    <p>Posição atual: <strong>{investment.quantity.toLocaleString()}</strong> unidades</p>
                    <p>Custo médio: <strong>€{investment.averageCost.toFixed(4)}</strong></p>
                </div>

                {error && (
                    <div className="modal-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantidade a Vender</label>
                            <input
                                type="number"
                                step="0.00000001"
                                max={investment.quantity}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="0"
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Preço de Venda (€)</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={pricePerUnit}
                                onChange={(e) => setPricePerUnit(e.target.value)}
                                placeholder="0.00"
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    {quantity && pricePerUnit && (
                        <div className="sell-preview">
                            <div className="preview-row">
                                <span>Valor da Venda:</span>
                                <span className="preview-value">
                                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(sellValue)}
                                </span>
                            </div>
                            <div className="preview-row">
                                <span>Lucro/Prejuízo:</span>
                                <span className={`preview-value ${profit >= 0 ? 'text-emerald' : 'text-red'}`}>
                                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(profit)}
                                </span>
                            </div>
                            {profit > 0 && (
                                <div className="preview-row charity-preview">
                                    <span>
                                        <Heart size={16} /> Caridade (20%):
                                    </span>
                                    <span className="preview-value text-emerald">
                                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(charityEstimate)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-charity" disabled={loading}>
                            {loading ? 'Vendendo...' : 'Confirmar Venda'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
