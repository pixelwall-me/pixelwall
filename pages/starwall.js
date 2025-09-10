import { useEffect, useRef, useState } from "react";
import supabase from "../lib/supabaseClient";
import styles from "../styles/Starwall.module.css";

export default function Starwall() {
  const canvasRef = useRef(null);
  const [stars, setStars] = useState([]);
  const [selectedStar, setSelectedStar] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [userStarId, setUserStarId] = useState(null);
  const [searchId, setSearchId] = useState("");
  const shootingStarRef = useRef(null);

  const SAFE_ZONE_TOP = 120;
  const PADDING = 40;

  useEffect(() => {
    const savedId = localStorage.getItem("userStarId");
    if (savedId) setUserStarId(Number(savedId));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const fetchStars = async () => {
      const { data, error } = await supabase.from("pixelwall").select("*");
      if (error) {
        console.error("Error fetching stars:", error);
        return;
      }

      const updatedStars = data.map((star) => ({
        ...star,
        x:
          typeof star.x === "number"
            ? star.x
            : Math.random() * (window.innerWidth - 2 * PADDING) + PADDING,
        y:
          typeof star.y === "number"
            ? star.y
            : Math.random() *
                (window.innerHeight - SAFE_ZONE_TOP - PADDING) +
              SAFE_ZONE_TOP,
        flickerSpeed: 0.5 + Math.random() * 1.5,
        flickerPhase: Math.random() * Math.PI * 2,
      }));

      setStars(updatedStars);

      // schedule shooting stars every ~15s
      setInterval(() => {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * (canvas.height / 2);
        shootingStarRef.current = {
          x: startX,
          y: startY,
          vx: -6 + Math.random() * -4, // left diagonal
          vy: 4 + Math.random() * 2, // downward
          life: 0,
        };
      }, 15000);

      const drawStars = (time) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 🌟 draw static stars with twinkle
        updatedStars.forEach((star) => {
          if (!isFinite(star.x) || !isFinite(star.y)) return;

          const radius = star.id === userStarId ? 2 : 0.8;
          const flicker =
            0.7 +
            0.3 *
              Math.sin(time * 0.002 * star.flickerSpeed + star.flickerPhase) +
            (Math.random() - 0.5) * 0.05; // add jitter
          const glowRadius = (star.id === userStarId ? 14 : 9) * flicker;
          const color = star.id === userStarId ? "255,255,180" : "255,255,255";

          ctx.beginPath();
          ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);

          const gradient = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            glowRadius
          );
          gradient.addColorStop(0, `rgba(${color},1)`);
          gradient.addColorStop(0.4, `rgba(${color},0.7)`);
          gradient.addColorStop(1, `rgba(${color},0)`);
          ctx.fillStyle = gradient;
          ctx.fill();
        });

        // 🌠 shooting star
        if (shootingStarRef.current) {
          const s = shootingStarRef.current;
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 2;
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 5, s.y - s.vy * 5);
          ctx.stroke();

          s.x += s.vx;
          s.y += s.vy;
          s.life += 1;

          if (s.life > 100) shootingStarRef.current = null;
        }

        requestAnimationFrame(drawStars);
      };
      requestAnimationFrame(drawStars);
    };

    fetchStars();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [userStarId]);

  const handleStarClick = (star, e) => {
    let x = e.clientX;
    let y = e.clientY;

    const popupWidth = 220;
    const popupHeight = 120;

    if (x + popupWidth / 2 > window.innerWidth)
      x = window.innerWidth - popupWidth / 2 - 10;
    if (x - popupWidth / 2 < 0) x = popupWidth / 2 + 10;
    if (y + popupHeight > window.innerHeight)
      y = window.innerHeight - popupHeight - 10;
    if (y < SAFE_ZONE_TOP) y = SAFE_ZONE_TOP + 10;

    setPopupPos({ x, y });
    setSelectedStar(star);
  };

  const handleSearch = () => {
    const found = stars.find((s) => s.id === Number(searchId));
    if (found) {
      setSelectedStar(found);
      setPopupPos({ x: found.x, y: found.y });
    } else {
      alert("Star not found!");
    }
  };

  return (
    <div className={styles.cosmicContainer}>
      <div className={styles.overlay}></div>

      <div className={styles.searchContainer}>
        <input
          type="number"
          placeholder="Enter Star ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onClick={(e) => {
          const rect = e.target.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          let closest = null;
          let minDist = Infinity;
          stars.forEach((star) => {
            const dx = star.x - x;
            const dy = star.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist && dist < 10) {
              minDist = dist;
              closest = star;
            }
          });

          if (closest) handleStarClick(closest, e);
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const rect = e.target.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          let closest = null;
          let minDist = Infinity;
          stars.forEach((star) => {
            const dx = star.x - x;
            const dy = star.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist && dist < 10) {
              minDist = dist;
              closest = star;
            }
          });

          if (closest) handleStarClick(closest, touch);
        }}
      />

      {selectedStar && (
        <div
          className={styles.popup}
          style={{
            left: popupPos.x,
            top: popupPos.y,
            transform: "translate(-50%, -100%)",
          }}
          onClick={() => setSelectedStar(null)}
        >
          <h3>{selectedStar.name}</h3>
          <p>{selectedStar.message}</p>
        </div>
      )}
    </div>
  );
}
