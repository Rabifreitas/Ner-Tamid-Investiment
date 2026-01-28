import React from 'react';
import { Phone, Chrome, Apple } from 'lucide-react';
import { motion } from 'framer-motion';
import './SocialButtons.css';

interface SocialButtonsProps {
    onGoogle: () => void;
    onApple: () => void;
    onPhone: () => void;
}

export const SocialButtons: React.FC<SocialButtonsProps> = ({ onGoogle, onApple, onPhone }) => {
    return (
        <div className="social-auth-container">
            <div className="social-divider">
                <span>ou continue com</span>
            </div>

            <div className="social-grid">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="social-btn google-btn"
                    onClick={onGoogle}
                >
                    <Chrome size={20} />
                    <span>Google</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="social-btn apple-btn"
                    onClick={onApple}
                >
                    <Apple size={20} />
                    <span>Apple</span>
                </motion.button>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="phone-auth-btn"
                onClick={onPhone}
            >
                <Phone size={18} /> Entrar com Número de Telefone
            </motion.button>
        </div>
    );
};
