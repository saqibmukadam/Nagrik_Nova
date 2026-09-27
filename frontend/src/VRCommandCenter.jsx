import React, { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import * as THREE from "three";
import { api } from "./main.jsx";

const store = createXRStore();

function IssuePillar({ issue, position }) {
  const priority = issue.priority?.toLowerCase() || "pending";

  let color;
  let height;

  switch (priority) {
    case "high":
      color = "#ff4444";
      height = 2.4;
      break;

    case "medium":
      color = "#ffcc00";
      height = 1.6;
      break;

    case "low":
      color = "#4CAF50";
      height = 1.1;
      break;

    case "pending":
    default:
      color = "#00e5ff";
      height = 0.5;
      break;
  }

  const labelRef = useRef();

  useFrame(({ camera }) => {
    if (!labelRef.current) return;

    const camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);

    const dx = camPos.x - position.x;
    const dz = camPos.z - position.z;

    labelRef.current.rotation.y = Math.atan2(dx, dz);
  });

  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, height, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      <group ref={labelRef} position={[0, height + 0.15, 0]}>
        <Text
          position={[0, 0.08, 0]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {issue.title || "Unknown Issue"}
        </Text>

        <Text
          position={[0, -0.08, 0]}
          fontSize={0.07}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
        >
          {`${priority} Priority`.toUpperCase()}
        </Text>
      </group>
    </group>
  );
}

export default function VRCommandCenter() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadIssues = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/issues");
        setIssues(response.data || []);
      } catch (err) {
        console.error("Failed to fetch VR issues:", err);
        setError(err.response?.data?.message || "Could not load civic issues.");
      } finally {
        setLoading(false);
      }
    };
    loadIssues();
  }, []);

  const positionedIssues = useMemo(() => {
    return issues.map((issue, index) => ({
      ...issue,
      position: {
        x: ((index % 7) - 3) * 1.1,
        z: (Math.floor(index / 7) % 7 - 3) * 1.1,
      },
    }));
  }, [issues]);

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#111", position: "relative" }}>
      <button
        className="btn"
        onClick={() => store.enterVR()}
        style={{ position: "absolute", top: 20, left: 20, zIndex: 10, padding: "10px 20px" }}
      >
        Enter VR Mode
      </button>

      {loading && (
        <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10, color: "white" }}>
          Loading civic issues...
        </div>
      )}

      {error && (
        <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10, color: "#ff6666" }}>
          {error}
        </div>
      )}

      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls />
          <Grid infiniteGrid fadeDistance={10} sectionColor="#444" cellColor="#222" />

          {positionedIssues.map((issue) => (
            <IssuePillar key={issue.id || issue._id} issue={issue} position={issue.position} />
          ))}
        </XR>
      </Canvas>
    </div>
  );
}