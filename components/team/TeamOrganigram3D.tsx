
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { UserProfile, UserRole } from '../../types';

// Fix: Local constants to bypass JSX intrinsic element errors when Three.js types are missing
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const SphereGeometry = 'sphereGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const TubeGeometry = 'tubeGeometry' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;

interface NodeProps {
  profile: UserProfile;
  position: [number, number, number];
  size: number;
  color: string;
}

const Node: React.FC<NodeProps> = ({ profile, position, size, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const scaleRef = useRef(1);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y += 0.01;
      
      // Smooth scaling on hover
      const targetScale = hovered ? 1.25 : 1;
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
      meshRef.current.scale.setScalar(scaleRef.current);

      // Pulsing glow when hovered
      if (hovered && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        const pulse = (Math.sin(state.clock.elapsedTime * 5) + 1) * 0.5;
        meshRef.current.material.emissiveIntensity = 0.5 + pulse * 1.5;
      }
    }
  });

  return (
    <Group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Mesh 
          ref={meshRef}
          onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={() => setHovered(false)}
        >
          <SphereGeometry args={[size, 64, 64]} />
          <MeshStandardMaterial 
            color={hovered ? "#60a5fa" : color} 
            metalness={0.9} 
            roughness={0.1} 
            emissive={hovered ? "#3b82f6" : "#000"}
            emissiveIntensity={0}
          />
        </Mesh>
      </Float>

      <Text
        position={[0, size + 0.8, 0]}
        fontSize={0.25}
        color="white"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyMZhrib2Bg-4.ttf"
        anchorX="center"
        anchorY="middle"
        fontWeight="900"
      >
        {profile.full_name?.toUpperCase()}
      </Text>
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.12}
        color={hovered ? "#60a5fa" : "#3b82f6"}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {profile.role.replace('_', ' ')}
      </Text>
    </Group>
  );
};

const Synapse: React.FC<{ start: [number, number, number], end: [number, number, number] }> = ({ start, end }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      // Simulated data flow animation
      const flow = (Math.sin(state.clock.elapsedTime * 2 - curve.getLength() * 0.5) + 1) * 0.5;
      meshRef.current.material.opacity = 0.2 + flow * 0.4;
      meshRef.current.material.emissiveIntensity = 0.5 + flow * 2;
    }
  });

  return (
    <Mesh ref={meshRef}>
      <TubeGeometry args={[curve, 40, 0.02, 8, false]} />
      <MeshStandardMaterial 
        color="#3b82f6" 
        emissive="#3b82f6" 
        emissiveIntensity={1} 
        transparent 
        opacity={0.3} 
        metalness={1}
      />
    </Mesh>
  );
};

const OrganigramScene: React.FC<{ employees: UserProfile[] }> = ({ employees }) => {
  const hierarchy = useMemo(() => {
    const nodes: any[] = [];
    const connections: any[] = [];

    const owner = employees.find(e => e.role === 'OWNER');
    const admins = employees.filter(e => e.role === 'ADMIN');
    const managers = employees.filter(e => e.role.includes('_MANAGER') || e.role === 'FINANCE_CONTROLLER');
    // Fix: role comparison now valid as 'OPERATIVE' added to UserRole type
    const technicals = employees.filter(e => e.role === 'CONTRIBUTOR' || e.role === 'OPERATIVE');
    const others = employees.filter(e => e.role === 'AUDITOR' || e.role === 'GUEST');
    
    // Level 1: Owner (Titanium Core)
    const ownerPos: [number, number, number] = [0, 6, 0];
    if (owner) {
      nodes.push({ profile: owner, pos: ownerPos, size: 1.0, color: "#000" });
    }

    // Level 2: Admins (Command Ring)
    admins.forEach((admin, i) => {
      const angle = (i / admins.length) * Math.PI * 2;
      const pos: [number, number, number] = [Math.cos(angle) * 4, 3, Math.sin(angle) * 4];
      nodes.push({ profile: admin, pos, size: 0.7, color: "#1a1615" });
      connections.push({ start: ownerPos, end: pos });
      
      // Connect Managers to Admins
      const mSize = Math.ceil(managers.length / (admins.length || 1));
      managers.slice(i * mSize, (i + 1) * mSize).forEach((mgr, j) => {
        const mAngle = angle + (j - (mSize-1)/2) * 0.6;
        const mPos: [number, number, number] = [Math.cos(mAngle) * 8, 0, Math.sin(mAngle) * 8];
        nodes.push({ profile: mgr, pos: mPos, size: 0.6, color: "#332e2c" });
        connections.push({ start: pos, end: mPos });

        // Connect Contributors to Managers
        const cSize = Math.ceil(technicals.length / (managers.length || 1));
        technicals.slice(j * cSize, (j + 1) * cSize).forEach((tech, k) => {
          const tAngle = mAngle + (k - (cSize-1)/2) * 0.4;
          const tPos: [number, number, number] = [Math.cos(tAngle) * 12, -4, Math.sin(tAngle) * 12];
          nodes.push({ profile: tech, pos: tPos, size: 0.45, color: "#4b5563" });
          connections.push({ start: mPos, end: tPos });
        });
      });
    });

    // Auditor/Guest on separate orbital
    others.forEach((other, i) => {
        const angle = (i / (others.length || 1)) * Math.PI * 2;
        const pos: [number, number, number] = [Math.cos(angle) * 16, -6, Math.sin(angle) * 16];
        nodes.push({ profile: other, pos, size: 0.35, color: "#9ca3af" });
        connections.push({ start: ownerPos, end: pos });
    });

    return { nodes, connections };
  }, [employees]);

  return (
    <>
      <AmbientLight intensity={0.4} />
      <PointLight position={[15, 15, 15]} intensity={1.5} />
      <PointLight position={[-15, -15, -15]} color="#3b82f6" intensity={2.5} />
      <Environment preset="city" />

      {hierarchy.nodes.map((node, i) => (
        <Node key={node.profile.id + i} profile={node.profile} position={node.pos} size={node.size} color={node.color} />
      ))}

      {hierarchy.connections.map((conn, i) => (
        <Synapse key={i} start={conn.start} end={conn.end} />
      ))}

      <ContactShadows position={[0, -8, 0]} opacity={0.5} scale={40} blur={2.5} far={10} />
      <OrbitControls minDistance={10} maxDistance={40} makeDefault />
    </>
  );
};

const TeamOrganigram3D: React.FC<{ employees: UserProfile[] }> = ({ employees }) => {
  return (
    <div className="w-full h-[850px] bg-[#0c0a09] rounded-[64px] border border-white/5 shadow-2xl overflow-hidden relative group">
      <div className="absolute top-12 left-12 z-20 space-y-4">
         <div className="flex items-center gap-4 text-blue-500">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-400/80">Flux en Direct de la Matrice Neuronale</span>
         </div>
         <h2 className="text-5xl font-[950] italic uppercase tracking-tighter text-white leading-none">
           Hiérarchie <br /> <span className="text-blue-600 drop-shadow-[0_0_20px_rgba(37,99,235,0.3)]">d'Unité Souveraine</span>
         </h2>
         <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Couche de Commande Interactive v7.4</p>
      </div>

      <div className="absolute bottom-12 right-12 z-20 flex flex-col items-end gap-2 text-right">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Orbite : Active</p>
        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Nœuds : {employees.length}</p>
      </div>

      <Canvas camera={{ position: [0, 10, 25], fov: 40 }} shadows dpr={[1, 2]}>
        <OrganigramScene employees={employees} />
      </Canvas>
    </div>
  );
};

export default TeamOrganigram3D;