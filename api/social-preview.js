export default function handler(req,res){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/><stop offset=".45" stop-color="#0ea5e9"/><stop offset="1" stop-color="#22c55e"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fff7ed"/>
    </linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-opacity=".22"/></filter>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)"/>
  <circle cx="1070" cy="80" r="145" fill="#fde047" opacity=".35"/><circle cx="95" cy="545" r="170" fill="#f472b6" opacity=".25"/>
  <g filter="url(#shadow)"><rect x="55" y="45" width="1090" height="540" rx="32" fill="url(#card)"/></g>
  <text x="600" y="105" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#6d28d9">✨ NAA BHAVISHYATHU AI</text>
  <text x="600" y="155" text-anchor="middle" font-family="Arial,sans-serif" font-size="45" font-weight="900" fill="#1f2937">YOUR DREAM • YOUR ROADMAP • YOUR FUTURE</text>
  <text x="600" y="195" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="#64748b">Photo → Dream Career → AI Portrait → Visual Career Roadmap</text>

  <g font-family="Arial,sans-serif" font-weight="800" text-anchor="middle">
    <rect x="95" y="245" width="185" height="150" rx="25" fill="#ede9fe"/><text x="188" y="300" font-size="42">📷</text><text x="188" y="345" font-size="22" fill="#5b21b6">YOUR PHOTO</text>
    <text x="305" y="332" font-size="34" fill="#7c3aed">➜</text>
    <rect x="330" y="245" width="185" height="150" rx="25" fill="#dbeafe"/><text x="422" y="300" font-size="42">🎯</text><text x="422" y="345" font-size="22" fill="#1d4ed8">DREAM CAREER</text>
    <text x="540" y="332" font-size="34" fill="#0ea5e9">➜</text>
    <rect x="565" y="245" width="185" height="150" rx="25" fill="#dcfce7"/><text x="658" y="300" font-size="42">🤖</text><text x="658" y="345" font-size="22" fill="#15803d">AI PORTRAIT</text>
    <text x="775" y="332" font-size="34" fill="#f97316">➜</text>
    <rect x="800" y="245" width="300" height="150" rx="25" fill="#fef3c7"/><text x="950" y="300" font-size="42">🛣️</text><text x="950" y="342" font-size="21" fill="#b45309">VISUAL CAREER ROADMAP</text>
  </g>

  <rect x="185" y="435" width="830" height="78" rx="39" fill="#6d28d9"/>
  <text x="600" y="485" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="900" fill="white">📍 WHERE I AM → 🧭 HOW TO GO → 🏆 MY DREAM</text>
  <text x="600" y="550" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="800" fill="#475569">naa-bhavishyathu-ai.vercel.app</text>
  </svg>`;
  res.setHeader("Content-Type","image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control","public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
  res.status(200).send(svg);
}