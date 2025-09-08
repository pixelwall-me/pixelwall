// pages/api/ClaimPixel.js
import supabase from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { name, message } = req.body;

      // Insert star into Supabase
      const { data, error } = await supabase
        .from("pixelwall")
        .insert([{ name, message }])
        .select();

      if (error) throw error;

      res.status(200).json({ data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
