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
        interests: profession + " career, discipline, learning",
        skills: "Not provided by user",
        goal: "Write ONLY 3 very short inspirational sentences in natural Telugu for " + name + " dreaming of becoming a " + profession + ". Mention the selected profession. Encourage practice, discipline and learning. Do not ask questions. Do not mention missing information. Do not invent age, education, skills, achievements or qualifications. Do not give alternate careers. No English except the profession name if necessary. No headings, lists, Markdown, ** or ###. Keep the entire response under 55 Telugu words.",
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
