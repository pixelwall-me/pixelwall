import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabaseClient";
import styles from "../styles/Index.module.css";

export default function Home() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimedId, setClaimedId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const savedId = localStorage.getItem("userStarId");
    if (savedId) setClaimedId(savedId);
  }, []);

  const handleClaim = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("pixelwall")
      .insert([{ name: name.trim(), message: message.trim() }])
      .select();

    setLoading(false);

    if (error) {
      alert("Error claiming star: " + error.message);
    } else {
      const id = data[0].id;
      localStorage.setItem("userStarId", id);
      setClaimedId(id);
    }
  };

  const viewUniverse = () => router.push("/starwall");
  const copyId = () => {
    navigator.clipboard.writeText(claimedId);
    alert("Star ID copied to clipboard!");
  };

  return (
    <div className={styles.cosmicContainer}>
      <div className={styles.overlay}></div>

      <div className={styles.contentCard}>
        <h1 className={styles.heading}>✨ Leave Your Mark in the Universe ✨</h1>
        <p className={styles.subheading}>
          Claim your star on the PixelWall and shine forever in the cosmic sky.
        </p>

        {!claimedId && (
          <form className={styles.form} onSubmit={handleClaim}>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              placeholder="What should the universe remember?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Claiming..." : "Claim Star ⭐"}
            </button>
          </form>
        )}

        {claimedId && (
          <div className={styles.card}>
            <h2>🌟 Your Star is Claimed!</h2>
            <p>
              <strong>Star ID:</strong> {claimedId}
              <button className={styles.copyBtn} onClick={copyId}>
                Copy
              </button>
            </p>
            <button className={styles.viewBtn} onClick={viewUniverse}>
              View Universe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
