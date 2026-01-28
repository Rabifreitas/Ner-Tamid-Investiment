import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CheckCircle2, Circle, Users, Vote } from 'lucide-react';
import { motion } from 'framer-motion';
import './VotingWidget.css';

interface Standing {
    id: string;
    name: string;
    category: string;
    vote_count: string;
}

export const VotingWidget: React.FC = () => {
    const [standings, setStandings] = useState<Standing[]>([]);
    const [votedId, setVotedId] = useState<string | null>(null);

    const fetchStandings = async () => {
        try {
            const res = await api.getVotingStandings();
            setStandings(res.standings);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStandings();
    }, []);

    const handleVote = async (charityId: string) => {
        try {
            await api.castCharityVote(charityId);
            setVotedId(charityId);
            fetchStandings();
        } catch (err) {
            console.error(err);
        }
    };

    const totalVotes = standings.reduce((acc: number, s: Standing) => acc + parseInt(s.vote_count), 0);

    return (
        <div className="voting-widget">
            <h3 className="voting-title"><Vote size={18} /> Charity of the Month</h3>
            <p className="voting-subtitle">Vote na causa que receberá o destaque do próximo mês.</p>

            <div className="standings-list">
                {standings.map((charity) => {
                    const percentage = totalVotes > 0
                        ? (parseInt(charity.vote_count) / totalVotes) * 100
                        : 0;

                    return (
                        <div key={charity.id} className="standing-row" onClick={() => handleVote(charity.id)}>
                            <div className="standing-info">
                                <span className="charity-name">{charity.name}</span>
                                <span className="vote-pct">{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="progress-bar-bg">
                                <motion.div
                                    className="progress-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="vote-action">
                                {votedId === charity.id ? (
                                    <CheckCircle2 size={16} className="voted-icon" />
                                ) : (
                                    <Circle size={16} className="unvoted-icon" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="voting-footer">
                <Users size={14} />
                <span>{totalVotes} membros já votaram</span>
            </div>
        </div>
    );
};
