import React, { useEffect, useState } from 'react';
import { Trophy, Award, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import './Leaderboard.css';

interface LeaderboardEntry {
    id: string;
    name: string;
    total_impact: string;
    donations_count: string;
}

export const Leaderboard: React.FC = () => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/social/leaderboard')
            .then(res => res.json())
            .then(data => {
                setEntries(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Trophy className="rank-1" />;
            case 1: return <Award className="rank-2" />;
            case 2: return <Award className="rank-3" />;
            default: return <Star className="rank-other" />;
        }
    };

    return (
        <div className="leaderboard-container">
            <h3 className="leaderboard-title">Generosity Leaderboard</h3>
            <div className="leaderboard-list">
                {entries.map((entry, index) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`leaderboard-item ${index < 3 ? 'top-tier' : ''}`}
                    >
                        <div className="rank-section">
                            <span className="rank-number">#{index + 1}</span>
                            {getRankIcon(index)}
                        </div>
                        <div className="user-section">
                            <span className="user-name">{entry.name}</span>
                            <span className="donations-count">{entry.donations_count} doações</span>
                        </div>
                        <div className="impact-section">
                            <Heart size={14} className="heart-icon" />
                            <span className="impact-value">${parseFloat(entry.total_impact).toLocaleString()}</span>
                        </div>
                    </motion.div>
                ))}
                {entries.length === 0 && !loading && (
                    <p className="empty">Nenhum impacto registrado ainda.</p>
                )}
            </div>
        </div>
    );
};
