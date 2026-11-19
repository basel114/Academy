export default function HeroArt() {
  return <svg className="hero-art" viewBox="0 0 480 330" fill="none" aria-hidden="true">
    <defs>
      <pattern id="hero-dots" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="#6d8cf6" opacity=".55"/></pattern>
      <linearGradient id="hero-book" x1="130" y1="77" x2="346" y2="263" gradientUnits="userSpaceOnUse"><stop stopColor="#a5bcff"/><stop offset="1" stopColor="#496ef7"/></linearGradient>
      <linearGradient id="hero-tile" x1="95" y1="76" x2="398" y2="324" gradientUnits="userSpaceOnUse"><stop stopColor="#28449c"/><stop offset="1" stopColor="#14265f"/></linearGradient>
    </defs>
    <path d="M12 23h456v285H12z" fill="url(#hero-dots)"/>
    <circle cx="241" cy="167" r="140" stroke="#5477ec" opacity=".4"/>
    <circle cx="241" cy="167" r="113" stroke="#5477ec" opacity=".5"/>
    <path d="M39 201c82 38 268 27 391-41M73 83c59 45 214 98 368 101" stroke="#819dff" strokeOpacity=".45" strokeDasharray="4 6"/>
    <rect x="119" y="64" width="243" height="204" rx="28" transform="rotate(-8 119 64)" fill="url(#hero-tile)" stroke="#6486ff"/>
    <path d="M144 109c43-11 71-5 98 15 24-20 56-28 97-18v112c-41-9-73-2-97 18-27-20-55-26-98-15V109Z" fill="#101d52" stroke="#9db3ff" strokeWidth="2"/>
    <path d="M153 98c38-7 64 0 89 21v107c-25-21-51-28-89-21V98Z" fill="url(#hero-book)"/>
    <path d="M331 98c-38-7-64 0-89 21v107c25-21 51-28 89-21V98Z" fill="#e3ebff"/>
    <path d="M168 127c23-3 40 1 57 12m-57 8c23-3 40 1 57 12m-57 8c23-3 40 1 57 12" stroke="#f0f4ff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round"/>
    <path d="M260 140c17-12 34-15 56-14m-56 35c17-12 34-15 56-14m-56 35c17-12 34-15 56-14" stroke="#7895ed" strokeWidth="3" strokeLinecap="round"/>
    <path d="M391 64v42m-21-21h42M85 207v26m-13-13h26" stroke="#ffca70" strokeWidth="3" strokeLinecap="round"/>
    <rect x="80" y="92" width="31" height="31" rx="8" transform="rotate(-13 80 92)" fill="#294bb8" stroke="#88a1ff"/>
    <path d="m91 104 5 5 8-11" stroke="#dce6ff" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="378" cy="235" r="7" fill="#ffca70"/><circle cx="103" cy="166" r="4" fill="#9db5ff"/>
  </svg>;
}