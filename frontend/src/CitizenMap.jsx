import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import axios from "axios";
import "leaflet/dist/leaflet.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://nagrik-nova.onrender.com/api',
});

// Automatically attach the JWT token to every map request to clear 401 Unauthorized errors
api.interceptors.request.use((config) => {
  // Pulling Saniya's specific 'nn-token' key
  const token = localStorage.getItem('nn-token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function CitizenMap() {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");

  const center = [18.7278, 73.6781];

  useEffect(() => {
    const loadIssues = async () => {
      try {
        setError("");
        const response = await api.get("/issues");
        setIssues(response.data || []);
      } catch (err) {
        console.error("Failed to fetch map issues:", err);
        setError(err.response?.data?.message || "Could not load civic issues.");
      }
    };

    loadIssues();
  }, []);

  /*
   * Keep fallback marker positions stable.
   * They should not jump around on every render.
   */
  const positionedIssues = useMemo(() => {
    return issues.map((issue, index) => {
      const location = issue.location || issue.street || "";
      const match = String(location).match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
      let coords;

      if (match) {
        coords = [parseFloat(match[1]), parseFloat(match[2])];
      } else {
        /*
         * Stable fallback position around the map center.
         */
        const angle = index * 0.7;
        const radius = 0.005 + (index % 5) * 0.002;
        coords = [
          center[0] + Math.sin(angle) * radius,
          center[1] + Math.cos(angle) * radius,
        ];
      }

      return {
        ...issue,
        coords,
      };
    });
  }, [issues]);

  const getColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#ff4444";
      case "medium":
        return "#ffcc00";
      case "low":
        return "#4CAF50";
      default:
        return "#00e5ff";
    }
  };

  return (
    <section
      className="page"
      style={{ padding: 0, height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          top: "80px",
          left: "20px",
          zIndex: 1000,
          background: "rgba(10,10,10,0.85)",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #333",
          backdropFilter: "blur(5px)",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "white", display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={16} />
          Live Citizen Heatmap
        </h2>
        <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>
          Tracking active signals across the city.
        </p>
        {error && (
          <p style={{ marginTop: "10px", color: "#ff6666", fontSize: "12px" }}>
            {error}
          </p>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%", background: "#111" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {positionedIssues.map((issue) => {
          const safeLocation = issue.location || issue.street || issue.city || "Location not specified";
          const color = getColor(issue.priority);

          return (
            <CircleMarker
              key={issue.id || issue._id}
              center={issue.coords}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 2,
              }}
              radius={8}
            >
              <Popup className="custom-popup">
                <div style={{ minWidth: "180px" }}>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", color, fontWeight: "bold", letterSpacing: "1px" }}>
                    {issue.analyzed ? `${issue.priority || "Medium"} Priority` : "Pending Analysis"}
                  </span>
                  <h3 style={{ margin: "5px 0", fontSize: "16px", color: "#fff" }}>
                    {issue.title || "Untitled Issue"}
                  </h3>
                  <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#aaa" }}>
                    {safeLocation.length > 40 ? safeLocation.substring(0, 40) + "..." : safeLocation}
                  </p>
                  <Link
                    to={`/issues/${issue.id || issue._id}`}
                    style={{ color: "#4CAF50", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: "bold" }}
                  >
                    View Civic Brief
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </section>
  );
}