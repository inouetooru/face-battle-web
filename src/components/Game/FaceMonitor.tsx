'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface Props {
    onSmile: (scores: { p1: number; p2: number }) => void;
    isGameRunning: boolean;
}

export default function FaceMonitor({ onSmile, isGameRunning }: Props) {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
    const [webcamReady, setWebcamReady] = useState(false);
    const requestRef = useRef<number>(0);

    // Fix stale closure: Keep latest callback in ref
    const onSmileRef = useRef(onSmile);
    useEffect(() => {
        onSmileRef.current = onSmile;
    }, [onSmile]);

    useEffect(() => {
        async function initMediapipe() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "/models/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 2 // Support 2 faces
            });
            setLandmarker(faceLandmarker);
        }
        initMediapipe();
    }, []);

    const detect = () => {
        if (webcamRef.current && webcamRef.current.video && landmarker && webcamReady) {
            const video = webcamRef.current.video;
            if (video.currentTime > 0) {
                const result = landmarker.detectForVideo(video, performance.now());

                let p1Score = 0;
                let p2Score = 0;

                if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
                    // Sort faces by X coordinate to assign P1 (Left) and P2 (Right) consistently
                    // Note: Camera is mirrored via CSS scale-x-[-1], so:
                    // Visual Left (Screen Left) -> Actual Right in video frame? 
                    // result.faceLandmarks[i][0].x can be used for position.

                    // Simple approach: Index 0 is P1, Index 1 is P2 (if exists)
                    // But tracking might swap them. For MVP, we just take up to 2.

                    const processFace = (idx: number) => {
                        const shapes = result.faceBlendshapes[idx].categories;
                        const smileLeft = shapes.find(s => s.categoryName === 'mouthSmileLeft')?.score || 0;
                        const smileRight = shapes.find(s => s.categoryName === 'mouthSmileRight')?.score || 0;
                        return (smileLeft + smileRight) / 2;
                    };

                    p1Score = processFace(0);
                    if (result.faceBlendshapes.length > 1) {
                        p2Score = processFace(1);
                    }

                    // Draw AR effects (Simple Canvas overlay)
                    if (canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
                        const ctx = canvasRef.current.getContext('2d');
                        if (ctx) {
                            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                            // Loop through all detected faces
                            result.faceLandmarks.forEach((landmarks) => {
                                const width = canvasRef.current!.width;
                                const height = canvasRef.current!.height;

                                // Helper to magnify a region
                                const magnify = (limitIndex: number, scale: number, sizeMult: number) => {
                                    const point = landmarks[limitIndex];
                                    const cx = point.x * width;
                                    const cy = point.y * height;

                                    // Estimate face size (simple approximation using distance between eyes or just fixed relative to frame)
                                    // Better: use distance between index 234 and 454 (cheekbones) for scale
                                    const leftCheek = landmarks[234];
                                    const rightCheek = landmarks[454];
                                    const faceWidth = Math.abs(leftCheek.x - rightCheek.x) * width;

                                    const size = faceWidth * sizeMult; // Feature size

                                    const sx = cx - size / 2;
                                    const sy = cy - size / 2;

                                    // Save context to clip circular region
                                    ctx.save();
                                    ctx.beginPath();
                                    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
                                    ctx.clip();

                                    // Draw the magnified image
                                    // We assume 'video' is the source. Note: source coords match canvas coords if both map to video frame.
                                    // However, we want to sample a *smaller* region and draw it *larger* (or same region larger?)
                                    // To make "Big Eyes", we sample normal size and draw bigger? 
                                    // Or sample from center and scale up?

                                    // Source: Small region around center
                                    const srcSize = size / scale;
                                    const srcX = cx - srcSize / 2;
                                    const srcY = cy - srcSize / 2;

                                    ctx.drawImage(
                                        video,
                                        srcX, srcY, srcSize, srcSize, // Source
                                        sx, sy, size, size // Destination (Original size bounding box, but filled with smaller source = zoom)
                                    );

                                    // Optional: Add border or glow
                                    // ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                                    // ctx.lineWidth = 2;
                                    // ctx.stroke();

                                    ctx.restore();
                                };

                                // Left Eye (468), Right Eye (473), Mouth (13)
                                magnify(468, 2.0, 0.25); // Left Eye
                                magnify(473, 2.0, 0.25); // Right Eye
                                magnify(13, 1.5, 0.35);  // Mouth
                            });
                        }
                    }
                }

                // Always call callback with latest scores
                onSmileRef.current({ p1: p1Score, p2: p2Score });
            }
        }
        if (isGameRunning) {
            requestRef.current = requestAnimationFrame(detect);
        }
    };

    useEffect(() => {
        if (isGameRunning && landmarker && webcamReady) {
            requestRef.current = requestAnimationFrame(detect);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isGameRunning, landmarker, webcamReady]); // Removed detect/onSmile from deps

    return (
        <div className="relative w-full h-full overflow-hidden rounded-xl border border-gray-700 bg-black">
            <Webcam
                ref={webcamRef}
                audio={false}
                className="w-full h-full object-cover scale-x-[-1]"
                onUserMedia={() => setWebcamReady(true)}
                videoConstraints={{ facingMode: "user" }}
            />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
            />
            {!webcamReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    Loading Camera...
                </div>
            )}
            {!landmarker && (
                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-1 rounded">
                    Loading AI (2 Users)...
                </div>
            )}
        </div>
    );
}
