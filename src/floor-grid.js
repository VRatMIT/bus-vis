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
      varying float vDepth;
      void main() {
        vFloor = uv * 200.0 - 100.0;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vDepth = -viewPosition.z;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uMotion;
      varying vec2 vFloor;
      varying float vDepth;
      const float TAU = 6.28318530718;
      void main() {
        float radius = length(vFloor);
        float angle = atan(vFloor.y, vFloor.x) + 3.14159265359;
        float ringDistance = abs(mod(radius + 0.275, 0.55) - 0.275);
        float sector = angle / TAU * 48.0;
        float spokeDistance = abs(fract(sector + 0.5) - 0.5) * radius * TAU / 48.0;
        float wireDistance = min(ringDistance, spokeDistance);
        float aa = max(fwidth(radius), 0.002);
        float core = 1.0 - smoothstep(0.005, 0.005 + aa, wireDistance);
        float halo = exp(-wireDistance * wireDistance / 0.00065);
        // The floor continues beyond the camera's fog range; there is no circular rim.
        float fogFade = 1.0 - smoothstep(14.0, 70.0, vDepth);
        float detailFade = 1.0 - smoothstep(0.10, 0.38, aa);
        float mask = fogFade * detailFade * smoothstep(0.12, 0.4, radius);

        // A soft surge moves outward on the spokes, then along each ring.
        // The quiet interval between surges keeps the floor unobtrusive.
        float cycle = mod(uTime + 1.4, 12.0);
        float front = (cycle - 1.0) * 6.0;
        float envelope = smoothstep(0.75, 1.25, cycle) * (1.0 - smoothstep(8.5, 10.0, cycle));
        float wave = exp(-pow((radius - front) / 0.22, 2.0)) * envelope;
        float ringRadius = floor(radius / 0.55 + 0.5) * 0.55;
        float sinceArrival = cycle - 1.0 - ringRadius / 6.0;
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
  // A flat central clearing blends into an irregular, softly parabolic ridge.
  const geometry = new THREE.PlaneGeometry(200, 200, 320, 320);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getY(i);
    const radius = Math.hypot(x, z), angle = Math.atan2(z, x);
    const ridge = 30 + 2.2 * Math.sin(angle * 3 + 0.7) + 1.1 * Math.cos(angle * 5);
    const radial = Math.max(0, 1 - Math.pow((radius - ridge) / 7.5, 2));
    let height = 0.45;
    for (let peak = 0; peak < 15; peak++) {
      const center = peak * Math.PI * 2 / 15 + 0.065 * Math.sin(peak * 2.7);
      const delta = Math.atan2(Math.sin(angle - center), Math.cos(angle - center));
      const width = 0.19 + 0.035 * Math.sin(peak * 1.9);
      const parabola = Math.max(0, 1 - Math.pow(delta / width, 2));
      height += (2.2 + 0.8 * Math.sin(peak * 2.3) + 0.5 * Math.cos(peak * 0.9)) * parabola * parabola;
    }
    positions.setZ(i, radial * radial * height * 0.72);
  }
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: 0x11191c, roughness: 1, metalness: 0, envMapIntensity: 0.3,
  }));
  terrain.name = 'Distant parabolic mountain ring';
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.008;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Cyan polar floor grid';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const setMotion = () => { material.uniforms.uMotion.value = preference.matches ? 0 : 1; };
  setMotion();
  preference.addEventListener('change', setMotion);
  return { mesh, terrain, update: (time) => { material.uniforms.uTime.value = time; } };
}
