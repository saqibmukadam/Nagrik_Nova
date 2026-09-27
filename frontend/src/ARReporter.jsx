import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { XR, XRDomOverlay, createXRStore } from "@react-three/xr";
import * as THREE from "three";

// 1. The Premium Holographic Marker
function HologramPin({ position }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.02;
      groupRef.current.position.y = position.y + Math.sin(state.clock.getElapsedTime() * 3) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <mesh>
        <coneGeometry args={[0.15, 0.4, 32]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// 2. Mathematical Placement (100% Crash-Proof)
function ARSceneManager({ stagedPin, setStagedPin, setInAR }) {
  const { gl } = useThree();

  useEffect(() => {
    const handleEnd = () => {
      setInAR(false);
      setStagedPin(null);
    };
    gl.xr.addEventListener("sessionend", handleEnd);
    return () => gl.xr.removeEventListener("sessionend", handleEnd);
  }, [gl, setInAR, setStagedPin]);

  const handleScreenTap = (e) => {
    e.stopPropagation();
    if (stagedPin) return;

    const xrCamera = gl.xr.getCamera();
    const pos = new THREE.Vector3();
    xrCamera.getWorldPosition(pos);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(xrCamera.quaternion);

    // Drops pin exactly 1.5 meters away from the camera lens
    pos.add(dir.multiplyScalar(1.5));
    pos.y -= 0.4;

    setStagedPin({ x: pos.x, y: pos.y, z: pos.z });
  };

  return (
    <>
      <ambientLight intensity={2} />
      <mesh onPointerDown={handleScreenTap}>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} />
      </mesh>
      {stagedPin && <HologramPin position={stagedPin} />}
    </>
  );
}

// 3. The Main UI Component
export default function ARReporter({ onLocationSaved }) {
  const [stagedPin, setStagedPin] = useState(null);
  const [inAR, setInAR] = useState(false);
  const [geo, setGeo] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");

  const [store] = useState(() => createXRStore());

  useEffect(() => {
    if (!stagedPin) {
      setGeo(null);
      setGeoStatus("idle");
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoStatus("ready");
      },
      () => setGeoStatus("unavailable"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [stagedPin]);

  const startAR = () => {
    setStagedPin(null);
    setInAR(true);
    store.enterAR();
  };

  const handleConfirm = () => {
    onLocationSaved({ ...stagedPin, ...geo });
    setInAR(false);
    store.getState().session?.end();
  };

  return (
    <div style={{ width: "100%", height: "400px", position: "relative", borderRadius: "10px", overflow: "hidden", border: "2px solid #333", background: "#111" }}>
      {!inAR && (
        <div style={{ padding: "30px", textAlign: "center", color: "white" }}>
          <h3 style={{ margin: "0 0 10px 0" }}>AR Spatial Issue Scanner</h3>
          <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "20px" }}>
            Open the camera and tap the screen to anchor a high-precision 3D civic ticket.
          </p>
          <button
            type="button"
            onClick={startAR}
            style={{ padding: "14px 28px", background: "#00e5ff", color: "black", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
          >
            📸 Launch AR Scanner
          </button>
        </div>
      )}

      <Canvas>
        <XR store={store}>
          <ARSceneManager stagedPin={stagedPin} setStagedPin={setStagedPin} setInAR={setInAR} />

          <XRDomOverlay>
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              padding: "20px", boxSizing: "border-box", pointerEvents: "none"
            }}>
              <div style={{
                background: "rgba(10, 10, 10, 0.85)", color: "#00e5ff", padding: "12px 20px",
                borderRadius: "10px", border: "1px solid #00e5ff", textAlign: "center",
                fontWeight: "bold", fontSize: "15px", pointerEvents: "auto", backdropFilter: "blur(5px)",
                marginTop: "20px"
              }}>
                {!stagedPin
                  ? "🎯 Tap anywhere on the screen to anchor the ticket"
                  : geoStatus === "locating"
                  ? "📍 Ticket anchored — locking GPS…"
                  : geoStatus === "ready"
                  ? "📍 Ticket anchored — GPS locked"
                  : "📍 Ticket anchored (AR-only, no GPS)"}
              </div>

              {stagedPin && geoStatus === "locating" && (
                <div style={{ display: "flex", justifyContent: "center", pointerEvents: "auto", marginBottom: "30px" }}>
                  <div style={{
                    padding: "16px 24px", background: "rgba(10, 10, 10, 0.85)", color: "#00e5ff",
                    borderRadius: "10px", border: "1px solid #00e5ff", fontWeight: "bold",
                    fontSize: "16px", backdropFilter: "blur(5px)"
                  }}>
                    ⏳ Locking GPS Coordinates...
                  </div>
                </div>
              )}

              {stagedPin && geoStatus !== "locating" && (
                <div style={{ display: "flex", gap: "15px", pointerEvents: "auto", marginBottom: "30px" }}>
                  <button
                    type="button"
                    onClick={() => setStagedPin(null)}
                    style={{ flex: 1, padding: "16px", background: "#111", color: "#f44336", border: "2px solid #f44336", borderRadius: "10px", fontSize: "16px", fontWeight: "bold" }}
                  >
                    ↻ Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    style={{ flex: 1, padding: "16px", background: "#00e5ff", color: "#000", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", boxShadow: "0 0 15px rgba(0, 229, 255, 0.5)" }}
                  >
                    ✓ Confirm & Save
                  </button>
                </div>
              )}
            </div>
          </XRDomOverlay>
        </XR>
      </Canvas>
    </div>
  );
}