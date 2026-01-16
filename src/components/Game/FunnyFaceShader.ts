
/**
 * Simple Vertex Shader
 * Passes UVs and Position
 */
export const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;


/**
 * Fragment Shader for Face Distortion
 * uniform: map (video texture)
 * uniform: facePoints[2] (normalized coordinates of faces)
 * uniform: strength (distortion strength)
 */
export const fragmentShader = `
uniform sampler2D map;
uniform vec2 facePoints[2]; // Center points for distortion
uniform float strength;     // Controls bulge amount
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  
  // Apply distortion for each face point
  for (int i = 0; i < 2; i++) {
    vec2 center = facePoints[i];
    if (center.x == 0.0 && center.y == 0.0) continue; 

    float dist = distance(uv, center);
    float radius = 0.35; // Effect radius (covers substantial part of face but not all)
    
    if (dist < radius) {
        // Smooth Bulge Effect (Magnify center)
        // Strength > 0 expands, Strength < 0 shrinks
        // We use a smooth function: uv -= (uv - center) * amount
        
        float falloff = smoothstep(radius, 0.0, dist); // 1.0 at center, 0.0 at edge
        float amount = falloff * strength; 
        
        uv -= (uv - center) * amount;
    }
  }

  gl_FragColor = texture2D(map, uv);
}
`;
