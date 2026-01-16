import { render, screen, fireEvent } from '@testing-library/react';
import GameEngine from './GameEngine';

// Mock FaceMonitor because it uses webcam/canvas which isn't supported in jsdom
jest.mock('./FaceMonitor', () => {
    return function MockFaceMonitor({ onSmile, isGameRunning }: any) {
        return (
            <div data-testid="face-monitor">
                Mock Face Monitor (Running: {isGameRunning.toString()})
                <button onClick={() => onSmile({ p1: 0.8, p2: 0 })}>Simulate Smile P1</button>
            </div>
        );
    };
});

describe('GameEngine', () => {
    it('renders initial state correctly', () => {
        render(<GameEngine />);
        expect(screen.getByText('FACE OFF')).toBeInTheDocument();
        expect(screen.getByText("DON'T LAUGH")).toBeInTheDocument();
        expect(screen.getByText("BATTLE START")).toBeInTheDocument();
        expect(screen.getByText("Player 1")).toBeInTheDocument();
        expect(screen.getByText("Player 2")).toBeInTheDocument();
    });

    it('starts game on button click', () => {
        render(<GameEngine />);
        const startBtn = screen.getByText("BATTLE START");
        fireEvent.click(startBtn);
        expect(screen.queryByText("DON'T LAUGH")).not.toBeInTheDocument();
    });
});
