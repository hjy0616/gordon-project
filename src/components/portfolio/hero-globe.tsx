"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

const ORANGE = new THREE.Color("#d4842a");
const ORANGE_DIM = new THREE.Color("#8a5a25");

function generateSurfacePoints(count: number, radius: number) {
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    positions.push(
      new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
    );
  }
  return positions;
}

function createArcCurve(start: THREE.Vector3, end: THREE.Vector3) {
  const mid = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(1.6);
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

function GlobeWireframe({ animate }: { animate: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && animate) {
      groupRef.current.rotation.y += 0.0008;
      groupRef.current.rotation.x += 0.0002;
    }
  });

  const nodes = useMemo(() => generateSurfacePoints(40, 1.52), []);

  const arcLines = useMemo(() => {
    const lines: THREE.Line[] = [];
    const material = new THREE.LineBasicMaterial({
      color: ORANGE,
      transparent: true,
      opacity: 0.25,
    });
    const pairs = [
      [0, 5], [1, 8], [2, 12], [3, 15], [4, 18],
      [6, 20], [7, 25], [9, 30], [10, 22], [11, 35],
      [13, 28], [14, 32], [16, 38], [19, 27], [21, 36],
    ];
    for (const [a, b] of pairs) {
      if (nodes[a] && nodes[b]) {
        const curve = createArcCurve(nodes[a], nodes[b]);
        const geo = new THREE.BufferGeometry().setFromPoints(
          curve.getPoints(32)
        );
        lines.push(new THREE.Line(geo, material));
      }
    }
    return lines;
  }, [nodes]);

  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(nodes.length * 3);
    nodes.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [nodes]);

  return (
    <group ref={groupRef} position={[1.5, 0.3, 0]}>
      {/* Wireframe sphere */}
      <mesh>
        <sphereGeometry args={[1.5, 36, 24]} />
        <meshBasicMaterial
          color={ORANGE_DIM}
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>

      {/* Second sphere for depth */}
      <mesh rotation={[Math.PI / 4, 0, Math.PI / 6]}>
        <sphereGeometry args={[1.5, 18, 12]} />
        <meshBasicMaterial
          color={ORANGE_DIM}
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Surface nodes */}
      <points geometry={pointsGeometry}>
        <pointsMaterial
          color={ORANGE}
          size={0.045}
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>

      {/* Connection arcs */}
      {arcLines.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}

export function HeroGlobe() {
  const prefersReduced = useReducedMotion();

  return (
    <div className="absolute inset-0 -z-10" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.1} />
        <GlobeWireframe animate={!prefersReduced} />
      </Canvas>
    </div>
  );
}
