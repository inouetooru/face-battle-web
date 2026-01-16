import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as THREE from 'three';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { vertexShader, fragmentShader } from './FunnyFaceShader';

interface Props {
    onSmile: (scores: { p1: number; p2: number }) => void;
    isGameRunning: boolean;
}

export default function FaceMonitor({ onSmile, isGameRunning }: Props) {
    const webcamRef = useRef<Webcam>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
    const [webcamReady, setWebcamReady] = useState(false);

    // Three.js Refs
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const textureRef = useRef<THREE.VideoTexture | null>(null);

    const requestRef = useRef<number>(0);
    const onSmileRef = useRef(onSmile);

    useEffect(() => {
        onSmileRef.current = onSmile;
    }, [onSmile]);

    // 1. Initialize AI
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
                numFaces: 2
            });
            setLandmarker(faceLandmarker);
        }
        initMediapipe();
    }, []);

    // 2. Initialize Three.js
    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        // Orthographic camera for 2D feel (-1 to 1)
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        containerRef.current.appendChild(renderer.domElement);

        // Plane geometry covers the screen
        const geometry = new THREE.PlaneGeometry(2, 2);

        // Shader Material Placeholder (Texture will be set later)
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                map: { value: null },
                facePoints: { value: [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)] },
                strength: { value: 0.0 } // Start with 0 distortion
            }
        });

        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        materialRef.current = material;

        const handleResize = () => {
            if (!containerRef.current || !rendererRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            rendererRef.current.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    const detect = () => {
        const video = webcamRef.current?.video;

        // A. Init Video Texture once ready
        if (video && video.readyState >= 2 && !textureRef.current && materialRef.current) {
            const texture = new THREE.VideoTexture(video);
            texture.colorSpace = THREE.SRGBColorSpace;
            textureRef.current = texture;
            materialRef.current.uniforms.map.value = texture;
            setWebcamReady(true);
        }

        // B. Run Detection Loop
        if (webcamRef.current && video && landmarker && webcamReady && materialRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
            if (video.currentTime > 0) {
                // 1. Detect Faces
                const startTime = performance.now();
                const result = landmarker.detectForVideo(video, startTime);

                // 2. Process Logic
                let p1Score = 0;
                let p2Score = 0;
                const points = [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)];

                if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
                    const processFace = (idx: number) => {
                        const shapes = result.faceBlendshapes[idx].categories;
                        const smileLeft = shapes.find(s => s.categoryName === 'mouthSmileLeft')?.score || 0;
                        const smileRight = shapes.find(s => s.categoryName === 'mouthSmileRight')?.score || 0;
                        return (smileLeft + smileRight) / 2;
                    };

                    const getNosePoint = (idx: number) => {
                        // Nose tip is index 1
                        if (result.faceLandmarks[idx] && result.faceLandmarks[idx][1]) {
                            const p = result.faceLandmarks[idx][1];
                            // Map 0..1 to UV coords? GLSL expects 0..1. 
                            // MediaPipe X is 0(left)..1(right), Y is 0(top)..1(bottom)
                            // This matches UV texture coords often, but check mirroring.
                            return new THREE.Vector2(p.x, 1.0 - p.y); // Flip Y for WebGL texture
                        }
                        return new THREE.Vector2(0, 0);
                    };

                    p1Score = processFace(0);
                    points[0] = getNosePoint(0);

                    if (result.faceBlendshapes.length > 1) {
                        p2Score = processFace(1);
                        points[1] = getNosePoint(1);
                    }
                }

                // 3. Update Callbacks
                onSmileRef.current({ p1: p1Score, p2: p2Score });

                // 4. Update Uniforms and Render
                materialRef.current.uniforms.facePoints.value = points;

                // Dynamic Breathing Effect (Bulge Pulses)
                // Base strength 0.3, pulses +/- 0.15. Speed 0.005
                const time = performance.now();
                const pulse = Math.sin(time * 0.005);
                materialRef.current.uniforms.strength.value = 0.4 + (pulse * 0.2);

                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        }

        // Loop
        requestRef.current = requestAnimationFrame(detect);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(detect);
        return () => cancelAnimationFrame(requestRef.current);
    }, [landmarker, webcamReady]);

    return (
        <div className="relative w-full h-full overflow-hidden rounded-xl border border-gray-700 bg-black">
            {/* Hidden Webcam (Source) */}
            <Webcam
                ref={webcamRef}
                audio={false}
                className="absolute opacity-0 pointer-events-none"
                width={480}
                height={640} // Low res source is fine for distortion
                videoConstraints={{ facingMode: "user" }}
                onUserMedia={() => setWebcamReady(true)}
            />

            {/* Three.js Container */}
            <div ref={containerRef} className="w-full h-full scale-x-[-1]" />

            {!webcamReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    Loading Camera...
                </div>
            )}
            {!landmarker && (
                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-1 rounded z-10">
                    Loading AI...
                </div>
            )}
        </div>
    );
}
