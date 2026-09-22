const N8N_WEBHOOK = "https://pavansai2013.app.n8n.cloud/webhook/naa-bhavishyathu-ai";
const professionTelugu = {
  "Police Officer":"పోలీస్ ఆఫీసర్","IAS Officer":"ఐఏఎస్ ఆఫీసర్","Lawyer":"న్యాయవాది",
  "Sports Teacher":"క్రీడా ఉపాధ్యాయుడు","Athlete":"క్రీడాకారుడు","Doctor":"డాక్టర్",
  "Teacher":"ఉపాధ్యాయుడు","Scientist":"శాస్త్రవేత్త","Pilot":"పైలట్",
  "Army Officer":"ఆర్మీ ఆఫీసర్","Chef":"షెఫ్","Entrepreneur":"వ్యాపారవేత్త","Engineer":"ఇంజనీర్"
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { name, age, education, profession, country, state } = req.body || {};
    if (!name || !profession) return res.status(400).json({ error: "Name and profession are required." });
    const professionTe = professionTelugu[profession] || profession;

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
        goal: "LANGUAGE REQUIREMENT: Your entire answer MUST be written in Telugu script (తెలుగు) only. Write exactly 3 short inspirational Telugu sentences for " + name + " who dreams of the selected profession: " + profession + ". Do not ask questions. Do not mention missing details. Do not invent age, education, achievements or qualifications. Do not suggest other careers. No headings, lists, Markdown, hashtags or English prose. Maximum 55 words.",
        language: "Telugu",
        response_language: "te-IN",
        output_format: "Exactly 3 short Telugu-script sentences only",
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
    output = output.replace(/\\s+/g, " ").trim();
    const teluguChars = (output.match(/[\\u0C00-\\u0C7F]/g) || []).length;
    const otherProfessions = Object.entries(professionTelugu)
      .filter(([key]) => key !== profession)
      .flatMap(([key, value]) => [key.toLowerCase(), value]);
    const mismatch = otherProfessions.some(p => output.toLowerCase().includes(p.toLowerCase()));
    if (teluguChars < 12 || mismatch) {
      output = name + " గారి " + professionTe + " కావాలనే కల ఎంతో అందమైన లక్ష్యం. ప్రతిరోజూ క్రమశిక్షణతో నేర్చుకుంటూ సాధన చేస్తే ఆ కలకు మరింత దగ్గరవుతారు. ఆత్మవిశ్వాసంతో ముందుకు సాగి మీ భవిష్యత్తును మీరే నిర్మించుకోండి.";
    }
    if (output.length > 520) output = output.slice(0, 520).replace(/\\s+\\S*$/, "") + "…";
    if (!output) return res.status(502).json({ error: "AI story service returned no text." });
    return res.status(200).json({ story: output });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unexpected story service error." });
  }
}
