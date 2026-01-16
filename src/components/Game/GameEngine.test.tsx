import { render, screen, fireEvent } from '@testing-library/react';
import GameEngine from './GameEngine';

// Mock FaceMonitor because it uses webcam/canvas which isn't supported in jsdom
jest.mock('./FaceMonitor', () => {
    return function MockFaceMonitor({ onSmile, isGameRunning }: any) {
        return (
            <div data-testid="face-monitor">
                Mock Face Monitor (Running: {isGameRunning.toString()})
                <button onClick={() => onSmile(0.8)}>Simulate Smile</button>
            </div>
        );
    };
});

describe('GameEngine', () => {
    it('renders initial state correctly', () => {
        render(<GameEngine />);

        // Check Title
        expect(screen.getByText('FACE OFF')).toBeInTheDocument();

        // Check Start Button or Initial Overlay
        expect(screen.getByText("DON'T LAUGH")).toBeInTheDocument();
        expect(screen.getByText("DATA START")).toBeInTheDocument();
    });

    it('starts game on button click', () => {
        render(<GameEngine />);

        const startBtn = screen.getByText("DATA START");
        fireEvent.click(startBtn);

        // Initial overlay should disappear (or start button gone)
        // Note: In GameEngine logic, IDLE state overlays "Data Start".
        // After click, state becomes PLAYING, so overlay should be gone.
        expect(screen.queryByText("DON'T LAUGH")).not.toBeInTheDocument();
    });
});
