import * as THREE from 'three';

export function createFloorGrid() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMotion: { value: 1 } },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: `
      varying vec2 vFloor;
      void main() {
        vFloor = uv * 11.4 - 5.7;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uMotion;
      varying vec2 vFloor;
      const float TAU = 6.28318530718;
      void main() {
        float radius = length(vFloor);
        float angle = atan(vFloor.y, vFloor.x) + 3.14159265359;
        float ringDistance = abs(mod(radius + 0.275, 0.55) - 0.275);
        float sector = angle / TAU * 48.0;
        float spokeDistance = abs(fract(sector + 0.5) - 0.5) * radius * TAU / 48.0;
        float edgeDistance = abs(radius - 5.5);
        float wireDistance = min(min(ringDistance, spokeDistance), edgeDistance);
        float aa = max(fwidth(radius), 0.002);
        float core = 1.0 - smoothstep(0.005, 0.005 + aa, wireDistance);
        float halo = exp(-wireDistance * wireDistance / 0.00065);
        float mask = (1.0 - smoothstep(5.50, 5.57, radius)) * smoothstep(0.12, 0.4, radius);

        // A soft surge moves outward on the spokes, then along each ring.
        // The quiet interval between surges keeps the floor unobtrusive.
        float cycle = mod(uTime + 1.4, 9.0);
        float front = (cycle - 1.0) * 1.65;
        float envelope = smoothstep(0.75, 1.25, cycle) * (1.0 - smoothstep(4.15, 4.85, cycle));
        float wave = exp(-pow((radius - front) / 0.22, 2.0)) * envelope;
        float ringRadius = floor(radius / 0.55 + 0.5) * 0.55;
        float sinceArrival = cycle - 1.0 - ringRadius / 1.65;
        float angleHead = sinceArrival * 2.7;
        float angularDistance = abs(mod(angle - angleHead + 3.14159265359, TAU) - 3.14159265359);
        float ringRun = exp(-angularDistance * angularDistance / 0.08)
          * smoothstep(0.0, 0.15, sinceArrival)
          * (1.0 - smoothstep(0.5, 1.6, sinceArrival));
        float ringOnly = 1.0 - smoothstep(0.012, 0.012 + aa, ringDistance);
        float pulse = (wave + ringRun * ringOnly * 0.65) * uMotion;
        float alpha = mask * (core * 0.13 + halo * 0.035 + pulse * (core * 0.42 + halo * 0.14));
        vec3 cyan = mix(vec3(0.10, 0.67, 0.60), vec3(0.34, 0.95, 0.91), min(pulse, 1.0));
        gl_FragColor = vec4(cyan, alpha);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 11.4), material);
  mesh.name = 'Cyan polar floor grid';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const setMotion = () => { material.uniforms.uMotion.value = preference.matches ? 0 : 1; };
  setMotion();
  preference.addEventListener('change', setMotion);
  return { mesh, update: (time) => { material.uniforms.uTime.value = time; } };
}
