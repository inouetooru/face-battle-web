'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface Props {
    onSmile: (score: number) => void;
    isGameRunning: boolean;
}

export default function FaceMonitor({ onSmile, isGameRunning }: Props) {
    const webcamRef = useRef<Webcam>(null);
    const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
    const [webcamReady, setWebcamReady] = useState(false);
    const requestRef = useRef<number>(0);

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
                numFaces: 1
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
                if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
                    // Check smile blendshapes
                    const shapes = result.faceBlendshapes[0].categories;
                    const smileLeft = shapes.find(s => s.categoryName === 'mouthSmileLeft')?.score || 0;
                    const smileRight = shapes.find(s => s.categoryName === 'mouthSmileRight')?.score || 0;
                    const avgSmile = (smileLeft + smileRight) / 2;

                    onSmile(avgSmile);
                }
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
    }, [isGameRunning, landmarker, webcamReady]);

    return (
        <div className="relative w-full h-full overflow-hidden rounded-xl border border-gray-700 bg-black">
            <Webcam
                ref={webcamRef}
                audio={false}
                className="w-full h-full object-cover scale-x-[-1]" // Mirror effect
                onUserMedia={() => setWebcamReady(true)}
                videoConstraints={{
                    facingMode: "user"
                }}
            />
            {!webcamReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    Loading Camera...
                </div>
            )}
            {!landmarker && (
                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-1 rounded">
                    Loading AI...
                </div>
            )}
        </div>
    );
}
