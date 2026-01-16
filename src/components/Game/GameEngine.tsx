'use client';

import React, { useState, useEffect, useRef } from 'react';
import FaceMonitor from './FaceMonitor';
import AdBanner from '../UI/AdBanner';
import { Heart, Skull, Play, RotateCcw } from 'lucide-react';

export default function GameEngine() {
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
    const [hp, setHp] = useState(100);
    const [smileScore, setSmileScore] = useState(0);
    const [score, setScore] = useState(0); // Time survived or points
    const MAX_HP = 100;

    // Game Constants
    const SMILE_THRESHOLD = 0.5;
    const DAMAGE_RATE = 0.5; // HP loss per frame if smiling
    const BURST_DAMAGE = 10; // Extra damage for big laugh (Optional)

    const handleSmile = (val: number) => {
        setSmileScore(val);
        if (gameState === 'PLAYING') {
            if (val > SMILE_THRESHOLD) {
                setHp(prev => Math.max(0, prev - (val * DAMAGE_RATE * 5))); // Multiplier for noticeable damage
            }
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'PLAYING') {
            if (hp <= 0) {
                setGameState('GAMEOVER');
            } else {
                interval = setInterval(() => {
                    setScore(prev => prev + 1); // Survival time in deciseconds? 
                }, 100);
            }
        }
        return () => clearInterval(interval);
    }, [gameState, hp]);

    const startGame = () => {
        setHp(MAX_HP);
        setScore(0);
        setGameState('PLAYING');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden font-mono">
            {/* Header / Info */}
            <div className="h-14 bg-gray-950/80 backdrop-blur-md flex items-center justify-between px-4 border-b border-gray-800 z-10 absolute top-0 w-full">
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                    FACE OFF
                </h1>
                <div className="flex items-center gap-2">
                    <Heart className={`w-5 h-5 ${hp < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                    <span className="text-lg font-bold">{Math.ceil(hp)}%</span>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 relative">
                <FaceMonitor onSmile={handleSmile} isGameRunning={true} />

                {/* Overlays */}
                {gameState === 'IDLE' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                        <h2 className="text-4xl font-black mb-4 tracking-tighter">DON'T LAUGH</h2>
                        <p className="mb-8 text-gray-400">Survival Mode: Endurance Test</p>
                        <button
                            onClick={startGame}
                            className="btn btn-primary btn-lg rounded-full px-8 shadow-[0_0_20px_rgba(168,85,247,0.5)] border-none bg-gradient-to-r from-violet-600 to-pink-600 text-white"
                        >
                            <Play className="mr-2" /> DATA START
                        </button>
                    </div>
                )}

                {gameState === 'GAMEOVER' && (
                    <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
                        <Skull className="w-20 h-20 text-white mb-4 animate-bounce" />
                        <h2 className="text-5xl font-black mb-2 text-white">FAILED</h2>
                        <p className="text-xl mb-6 text-red-200">You laughed!</p>
                        <div className="text-2xl font-bold mb-8">
                            Time: {(score / 10).toFixed(1)}s
                        </div>
                        <button
                            onClick={startGame}
                            className="btn btn-outline btn-warning rounded-full px-8"
                        >
                            <RotateCcw className="mr-2" /> RETRY
                        </button>
                    </div>
                )}

                {/* HUD during game */}
                {gameState === 'PLAYING' && (
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                        {/* Smile Meter */}
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                            <div
                                className={`h-full transition-all duration-100 ${smileScore > SMILE_THRESHOLD ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, smileScore * 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>NEUTRAL</span>
                            <span className={smileScore > SMILE_THRESHOLD ? 'text-red-400 font-bold' : ''}>
                                {smileScore > SMILE_THRESHOLD ? 'DETECTED!' : 'SAFE'}
                            </span>
                            <span>LAUGH</span>
                        </div>
                    </div>
                )}

                {/* Pain Overlay */}
                {gameState === 'PLAYING' && smileScore > SMILE_THRESHOLD && (
                    <div
                        className="absolute inset-0 border-4 border-red-500 opacity-50 pointer-events-none transition-opacity duration-100"
                        style={{ opacity: (smileScore - SMILE_THRESHOLD) * 2 }}
                    />
                )}
            </div>

            {/* Ad Banner */}
            <AdBanner />
        </div>
    );
}
