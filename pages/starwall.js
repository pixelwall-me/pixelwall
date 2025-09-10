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
            : Math.random() * window.innerWidth,
        y:
          typeof star.y === "number"
            ? star.y
            : Math.random() * window.innerHeight,
      }));

      setStars(updatedStars);

      const drawStars = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        updatedStars.forEach((star) => {
          if (!isFinite(star.x) || !isFinite(star.y)) return;

          const radius = star.id === userStarId ? 2.5 : 1.2;
          const glowRadius = star.id === userStarId ? 10 : 6;
          const color = star.id === userStarId ? "255,255,0" : "255,255,255";

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
          gradient.addColorStop(1, `rgba(${color},0)`);
          ctx.fillStyle = gradient;
          ctx.fill();
        });

        requestAnimationFrame(drawStars);
      };
      drawStars();
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
    if (y < 0) y = 10;

    setPopupPos({ x, y });
    setSelectedStar(star);
  };

  const handleSearch = () => {
    const found = stars.find((s) => s.id === Number(searchId));
    if (found) {
      setSelectedStar(found);
      const x = found.x;
      const y = found.y;
      setPopupPos({ x, y });
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
