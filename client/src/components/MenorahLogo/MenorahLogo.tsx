/**
 * Ner Tamid - Menorah Logo Component
 * 
 * Animated stylized Menorah with eternal flame effect
 * 
 * #NerTamidEternal
 */

import './MenorahLogo.css';

interface MenorahLogoProps {
    size?: number;
    animated?: boolean;
}

export default function MenorahLogo({ size = 48, animated = true }: MenorahLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={`menorah-logo ${animated ? 'animated' : ''}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Base */}
            <path
                d="M35 90 H65 L60 80 H40 L35 90Z"
                fill="url(#goldGradient)"
                className="menorah-base"
            />

            {/* Central stem */}
            <rect
                x="47"
                y="30"
                width="6"
                height="50"
                fill="url(#goldGradient)"
                className="menorah-stem"
            />

            {/* Branches - Left side */}
            <path
                d="M50 55 Q30 55 25 35"
                stroke="url(#goldGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                className="menorah-branch"
            />
            <path
                d="M50 45 Q35 45 32 35"
                stroke="url(#goldGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                className="menorah-branch"
            />
            <path
                d="M50 35 Q40 35 39 30"
                stroke="url(#goldGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                className="menorah-branch"
            />

            {/* Branches - Right side */}
            <path
                d="M50 55 Q70 55 75 35"
                stroke="url(#goldGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                className="menorah-branch"
            />
            <path
                d="M50 45 Q65 45 68 35"
                stroke="url(#goldGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                className="menorah-branch"
            />
            <path
                d="M50 35 Q60 35 61 30"
                stroke="url(#goldGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                className="menorah-branch"
            />

            {/* Flames */}
            <g className="flames">
                {/* Center flame (largest - Shamash) */}
                <ellipse cx="50" cy="22" rx="5" ry="8" fill="url(#flameGradient)" className="flame flame-center" />

                {/* Left flames */}
                <ellipse cx="25" cy="28" rx="4" ry="6" fill="url(#flameGradient)" className="flame flame-1" />
                <ellipse cx="32" cy="28" rx="4" ry="6" fill="url(#flameGradient)" className="flame flame-2" />
                <ellipse cx="39" cy="24" rx="4" ry="6" fill="url(#flameGradient)" className="flame flame-3" />

                {/* Right flames */}
                <ellipse cx="75" cy="28" rx="4" ry="6" fill="url(#flameGradient)" className="flame flame-4" />
                <ellipse cx="68" cy="28" rx="4" ry="6" fill="url(#flameGradient)" className="flame flame-5" />
                <ellipse cx="61" cy="24" rx="4" ry="6" fill="url(#flameGradient)" className="flame flame-6" />
            </g>

            {/* Gradients */}
            <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E5C76B" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#B8912A" />
                </linearGradient>

                <linearGradient id="flameGradient" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#FF6B00" />
                    <stop offset="40%" stopColor="#FFA500" />
                    <stop offset="70%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#FFFFE0" />
                </linearGradient>
            </defs>
        </svg>
    );
}
