const N8N_WEBHOOK = "https://pavansai2013.app.n8n.cloud/webhook/naa-bhavishyathu-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { name, age, education, profession, country, state } = req.body || {};
    if (!name || !profession) return res.status(400).json({ error: "Name and profession are required." });

    const r = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        age: age || "",
        education: education || "",
        profession,
        interests: profession + ", AI, Technology",
        skills: "Learning and future career skills",
        goal: "Create ONLY a short inspirational Telugu career story for " + name + " as a future " + profession + ". Maximum 5 short sentences, about 80-120 words. No headings, no numbered lists, no Markdown, no **, no ###, no invented age/education/qualifications, and no exam or career claims unless supplied by the user.",
        country: country || "India",
        state: state || ""
      })
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { output: text }; }
    if (!r.ok) return res.status(r.status).json({ error: data?.message || data?.error || "AI story service failed." });

    let output = data?.output || data?.text || data?.message || data?.response || "";
    output = String(output).replace(/#{1,6}\\s*/g, "").replace(/\\*\\*/g, "").replace(/__+/g, "").replace(/`+/g, "").replace(/\\n{3,}/g, "\\n\\n").trim();
    if (output.length > 900) output = output.slice(0, 900).replace(/\\s+\\S*$/, "") + "…";
    if (!output) return res.status(502).json({ error: "AI story service returned no text." });
    return res.status(200).json({ story: output });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unexpected story service error." });
  }
}
