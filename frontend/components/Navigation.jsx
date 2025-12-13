"use client";

import { useEffect, useState } from "react";

export default function Navigation() {
  const [pathname, setPathname] = useState("");
  
  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);
  
  const navStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255, 107, 53, 0.1)",
    padding: "1rem 2rem",
    zIndex: 1000,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
  };

  const linkStyle = (isActive) => ({
    textDecoration: "none",
    color: isActive ? "#FF6B35" : "#6B7280",
    fontWeight: isActive ? "600" : "500",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    position: "relative",
    background: isActive ? "linear-gradient(135deg, #FFF5F0 0%, #FFFFFF 100%)" : "transparent"
  });

  return (
    <nav style={navStyle}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <a href="/" style={{
          textDecoration: "none",
          fontSize: "1.5rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #FF6B35 0%, #FF8C5A 50%, #FFD700 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontFamily: "'Playfair Display', serif",
          letterSpacing: "-0.02em"
        }}>
          ✨ Astro Playlist
        </a>
        <div style={{ display: "flex", gap: "1rem" }}>
          <a 
            href="/" 
            style={linkStyle(pathname === "/")}
            onMouseEnter={(e) => {
              if (pathname !== "/") {
                e.target.style.color = "#FF6B35";
                e.target.style.background = "#FFF5F0";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/") {
                e.target.style.color = "#6B7280";
                e.target.style.background = "transparent";
              }
            }}
          >
            Home
          </a>
          <a 
            href="/submissions" 
            style={linkStyle(pathname === "/submissions")}
            onMouseEnter={(e) => {
              if (pathname !== "/submissions") {
                e.target.style.color = "#FF6B35";
                e.target.style.background = "#FFF5F0";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/submissions") {
                e.target.style.color = "#6B7280";
                e.target.style.background = "transparent";
              }
            }}
          >
            Submissions
          </a>
          <a 
            href="/admin" 
            style={linkStyle(pathname === "/admin")}
            onMouseEnter={(e) => {
              if (pathname !== "/admin") {
                e.target.style.color = "#FF6B35";
                e.target.style.background = "#FFF5F0";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/admin") {
                e.target.style.color = "#6B7280";
                e.target.style.background = "transparent";
              }
            }}
          >
            Admin
          </a>
        </div>
      </div>
    </nav>
  );
}

