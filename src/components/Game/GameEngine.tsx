'use client';

import React, { useState, useEffect, useRef } from 'react';
import FaceMonitor from './FaceMonitor';
import AdBanner from '../UI/AdBanner';
import { Heart, Skull, Play, RotateCcw } from 'lucide-react';

export default function GameEngine() {
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
    const [hp1, setHp1] = useState(100);
    const [hp2, setHp2] = useState(100);
    const [smileScore1, setSmileScore1] = useState(0);
    const [smileScore2, setSmileScore2] = useState(0);
    const [score, setScore] = useState(0); // Time survived or points
    const MAX_HP = 100;

    // Game Constants
    const SMILE_THRESHOLD = 0.5;
    const DAMAGE_RATE = 0.5; // HP loss per frame if smiling
    const BURST_DAMAGE = 10; // Extra damage for big laugh (Optional)

    const handleSmile = (scores: { p1: number; p2: number }) => {
        setSmileScore1(scores.p1);
        setSmileScore2(scores.p2);
        if (gameState === 'PLAYING') {
            if (scores.p1 > SMILE_THRESHOLD) {
                setHp1(prev => Math.max(0, prev - (scores.p1 * DAMAGE_RATE * 5))); // Multiplier for noticeable damage
            }
            if (scores.p2 > SMILE_THRESHOLD) {
                setHp2(prev => Math.max(0, prev - (scores.p2 * DAMAGE_RATE * 5)));
            }
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'PLAYING') {
            if (hp1 <= 0 || hp2 <= 0) {
                setGameState('GAMEOVER');
            } else {
                interval = setInterval(() => {
                    setScore(prev => prev + 1); // Survival time in deciseconds? 
                }, 100);
            }
        }
        return () => clearInterval(interval);
    }, [gameState, hp1, hp2]);

    const startGame = () => {
        setHp1(MAX_HP);
        setHp2(MAX_HP);
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
                <div className="flex gap-4">
                    {/* P1 HP */}
                    <div className="flex items-center gap-2">
                        <span className="text-pink-500 font-bold">P1</span>
                        <Heart className={`w-5 h-5 ${hp1 < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                        <span className="text-lg font-bold">{Math.ceil(hp1)}%</span>
                    </div>
                    {/* P2 HP */}
                    <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                        <span className="text-blue-500 font-bold">P2</span>
                        <Heart className={`w-5 h-5 ${hp2 < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                        <span className="text-lg font-bold">{Math.ceil(hp2)}%</span>
                    </div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 relative">
                <FaceMonitor onSmile={handleSmile} isGameRunning={true} />

                {/* Overlays */}
                {gameState === 'IDLE' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                        <h2 className="text-4xl font-black mb-4 tracking-tighter">DON'T LAUGH</h2>
                        <p className="mb-4 text-gray-400">2-Player: Look at the screen together</p>
                        <div className="flex gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-pink-500 font-bold mb-2">Player 1</div>
                                <div className="text-xs text-gray-500">Left Side</div>
                            </div>
                            <div className="text-center">
                                <div className="text-blue-500 font-bold mb-2">Player 2</div>
                                <div className="text-xs text-gray-500">Right Side</div>
                            </div>
                        </div>
                        <button
                            onClick={startGame}
                            className="btn btn-primary btn-lg rounded-full px-8 shadow-[0_0_20px_rgba(168,85,247,0.5)] border-none bg-gradient-to-r from-violet-600 to-pink-600 text-white"
                        >
                            <Play className="mr-2" /> BATTLE START
                        </button>
                    </div>
                )}

                {gameState === 'GAMEOVER' && (
                    <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
                        <Skull className="w-20 h-20 text-white mb-4 animate-bounce" />
                        <h2 className="text-5xl font-black mb-2 text-white">
                            {hp1 <= 0 && hp2 <= 0 ? "DRAW" : hp1 <= 0 ? "P2 WINS" : "P1 WINS"}
                        </h2>
                        <p className="text-xl mb-6 text-red-200">
                            {hp1 <= 0 ? "Player 1 Laughed!" : "Player 2 Laughed!"}
                        </p>
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
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex gap-4">
                        {/* P1 Meter */}
                        <div className="flex-1">
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full transition-all duration-100 ${smileScore1 > SMILE_THRESHOLD ? 'bg-pink-500' : 'bg-gray-600'}`}
                                    style={{ width: `${Math.min(100, smileScore1 * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-pink-400 font-bold">
                                <span>P1</span>
                                <span>{smileScore1 > SMILE_THRESHOLD ? 'WARNING' : 'SAFE'}</span>
                            </div>
                        </div>

                        {/* P2 Meter */}
                        <div className="flex-1">
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full transition-all duration-100 ${smileScore2 > SMILE_THRESHOLD ? 'bg-blue-500' : 'bg-gray-600'}`}
                                    style={{ width: `${Math.min(100, smileScore2 * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-blue-400 font-bold">
                                <span>P2</span>
                                <span>{smileScore2 > SMILE_THRESHOLD ? 'WARNING' : 'SAFE'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pain Overlay P1 */}
                {gameState === 'PLAYING' && smileScore1 > SMILE_THRESHOLD && (
                    <div
                        className="absolute inset-y-0 left-0 w-1/2 border-4 border-l-0 border-pink-500 opacity-50 pointer-events-none transition-opacity duration-100"
                        style={{ opacity: (smileScore1 - SMILE_THRESHOLD) * 2 }}
                    />
                )}
                {/* Pain Overlay P2 */}
                {gameState === 'PLAYING' && smileScore2 > SMILE_THRESHOLD && (
                    <div
                        className="absolute inset-y-0 right-0 w-1/2 border-4 border-r-0 border-blue-500 opacity-50 pointer-events-none transition-opacity duration-100"
                        style={{ opacity: (smileScore2 - SMILE_THRESHOLD) * 2 }}
                    />
                )}
            </div>

            {/* Ad Banner */}
            <AdBanner />


        </div>
    );
}
