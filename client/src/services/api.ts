/**
 * Ner Tamid - API Service
 * 
 * HTTP client for backend communication
 * 
 * #NerTamidEternal
 */

const API_BASE = '/api';

class ApiService {
    private getToken(): string | null {
        const stored = localStorage.getItem('ner-tamid-auth');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return parsed.state?.token || null;
            } catch {
                return null;
            }
        }
        return null;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = this.getToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // Auth endpoints
    async login(email: string, password: string) {
        return this.request<{
            user: { id: string; email: string; fullName: string; charityPercentage: number };
            token: string;
        }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async register(data: {
        email: string;
        password: string;
        fullName: string;
        charityPercentage?: number;
    }) {
        return this.request<{
            user: { id: string; email: string; fullName: string; charityPercentage: number };
            token: string;
        }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getCurrentUser() {
        return this.request<{
            id: string;
            email: string;
            fullName: string;
            charityPercentage: number;
        }>('/auth/me');
    }

    // Social & Phone Logins
    async loginGoogle(data: { email: string; fullName: string; providerId: string; token: string }) {
        return this.request<any>('/auth/google', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async loginApple(data: { email: string; fullName: string; providerId: string; token: string }) {
        return this.request<any>('/auth/apple', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sendPhoneOTP(phone: string) {
        return this.request<any>('/auth/phone/send-otp', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    }

    async verifyPhoneOTP(phone: string, otp: string) {
        return this.request<any>('/auth/phone/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, otp }),
        });
    }

    // Portfolio endpoints
    async getPortfolio() {
        return this.request<{
            investments: Array<{
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
            }>;
            summary: {
                totalValue: number;
                totalCost: number;
                totalUnrealizedProfit: number;
                totalRealizedProfit: number;
                totalCharityAllocated: number;
                charityPercentageOfProfit: string;
            };
        }>('/portfolio');
    }

    async addInvestment(data: {
        symbol: string;
        assetName?: string;
        assetType: string;
        quantity: number;
        pricePerUnit: number;
    }) {
        return this.request('/portfolio', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sellInvestment(
        id: string,
        data: { quantity: number; pricePerUnit: number }
    ) {
        return this.request<{
            transaction: {
                profitLoss: number;
                isProfitable: boolean;
            };
            charity: {
                amount: number;
                percentage: number;
            } | null;
        }>(`/portfolio/${id}/sell`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getTransactions() {
        return this.request<{
            transactions: Array<{
                id: string;
                type: string;
                symbol: string;
                quantity: number;
                pricePerUnit: number;
                totalAmount: number;
                profitLoss: number | null;
                charityAmount: number | null;
                executedAt: string;
            }>;
        }>('/portfolio/transactions');
    }

    // Charity endpoints
    async getCharitySummary() {
        return this.request<{
            totalDonated: number;
            totalDonations: number;
            averagePercentage: number;
            topCategories: Array<{ category: string; amount: number }>;
        }>('/charity/summary');
    }

    async getCharityHistory() {
        return this.request<{
            transactions: Array<{
                id: string;
                profit_amount: number;
                charity_amount: number;
                charity_percentage: number;
                status: string;
                charity_name: string | null;
                created_at: string;
            }>;
        }>('/charity/history');
    }

    async getCharityOrganizations(category?: string) {
        const url = category
            ? `/charity/organizations?category=${category}`
            : '/charity/organizations';
        return this.request<{
            organizations: Array<{
                id: string;
                name: string;
                description: string;
                category: string;
                is_verified: boolean;
                total_received: number;
            }>;
            categories: Array<{ id: string; name: string; icon: string }>;
        }>(url);
    }

    async getPlatformMetrics() {
        return this.request<{
            totalDonated: number;
            totalDonors: number;
            totalTransactions: number;
            averagePercentage: number;
        }>('/charity/platform-metrics');
    }

    // Market data endpoints
    async getQuote(symbol: string) {
        return this.request<{
            symbol: string;
            price: number;
            change: number;
            changePercent: number;
        }>(`/market/quote/${symbol}`);
    }

    async searchSymbols(query: string) {
        return this.request<{
            results: Array<{
                symbol: string;
                name: string;
                type: string;
                region: string;
            }>;
        }>(`/market/search?q=${encodeURIComponent(query)}`);
    }

    // Social & Community
    async getSocialFeed() {
        return this.request<any[]>('/social/feed');
    }

    async getImpactLeaderboard() {
        return this.request<any[]>('/social/leaderboard');
    }

    async getVotingStandings() {
        return this.request<{ round: any; standings: any[] }>('/social/voting/standings');
    }

    async castCharityVote(charityId: string) {
        return this.request<any>('/social/voting/vote', {
            method: 'POST',
            body: JSON.stringify({ charityId }),
        });
    }

    // Exchange Connections
    async connectExchange(data: { exchangeId: string; apiKey: string; apiSecret: string; passphrase?: string }) {
        return this.request<any>('/exchanges/connect', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getConnectedExchanges() {
        return this.request<any[]>('/exchanges/list');
    }

    async getExchangeBalance(exchangeId: string) {
        return this.request<any>(`/exchanges/balance/${exchangeId}`);
    }

    // AI Discovery (Pearl Hunter)
    async getMarketGems() {
        return this.request<{ count: number; gems: any[] }>('/discovery/gems');
    }

    async triggerMarketScan() {
        return this.request<{ message: string; count: number; gems: any[] }>('/discovery/scan', {
            method: 'POST'
        });
    }
}

export const api = new ApiService();
