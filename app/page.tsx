// ============================================================
// SOULCHESS — Main Menu (Refined + Animated)
// ============================================================
'use client';
import { useState, useEffect, useCallback } from "react";
import { startSoundtrack, stopSoundtrack, setSoundtrackVolume } from "./lib/soundtrack";
import Image from "next/image";
import {
  BookOpen, ChevronRight, Crown, Feather, Gamepad2,
  Layers, Play, Settings, Sparkle, Sparkles, Sun, Swords, Users,
} from "lucide-react";
import { JSX } from "react";
import { useRouter } from "next/navigation";

// ─── Keyframes ────────────────────────────────────────────────
const STYLES = `
  @keyframes sidebarIn  {
    from { opacity: 0; transform: translateX(-28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideDown  {
    from { opacity: 0; transform: translateY(-16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp    {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn     {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleUp    {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes navItemIn  {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes shimmerBar {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 0.6; }
  }
  @keyframes floatY     {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-10px); }
  }
  @keyframes glowBreath {
    0%, 100% { opacity: 0.28; transform: scale(1);    }
    50%       { opacity: 0.5;  transform: scale(1.06); }
  }
  @keyframes profileIn  {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ornDivider {
    from { opacity: 0; transform: scaleX(0.4); }
    to   { opacity: 0.6; transform: scaleX(1); }
  }
`;

// ─── Ornate divider ───────────────────────────────────────────
function OrnDivider({ delay = "0s" }: { delay?: string }) {
  return (
    <div
      className="flex items-center w-full"
      style={{
        animation: `ornDivider 0.6s ease both ${delay}`,
        transformOrigin: "center",
      }}
    >
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,#c9a84c)" }} />
      <div
        style={{
          width: 6, height: 6,
          transform: "rotate(45deg)",
          border: "1px solid #c9a84c",
          background: "#fdfbf7",
          margin: "0 8px",
        }}
      />
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,#c9a84c,transparent)" }} />
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────
// All items look the same by default.
// On hover: gradient bg + left bar + chevron appear (same as old "active" style).
function NavItem({
  icon, label, onClick, delay,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  delay: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-4 w-full h-12 px-4 overflow-hidden cursor-pointer"
      style={{
        background: hovered
          ? "linear-gradient(90deg,rgba(201,168,76,0.12) 0%,transparent 100%)"
          : "transparent",
        border: `1px solid ${hovered ? "rgba(201,168,76,0.35)" : "transparent"}`,
        borderRadius: 8,
        transition: "background 0.22s ease, border-color 0.22s ease",
        animation: `navItemIn 0.4s ease both ${delay}`,
      }}
    >
      {/* Hover left bar — slides in from left */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
        style={{
          background: "#c9a84c",
          boxShadow: "0 0 8px #c9a84c",
          transform: hovered ? "scaleY(1) translateX(0)" : "scaleY(0.4) translateX(-4px)",
          opacity: hovered ? 1 : 0,
          transformOrigin: "center",
          transition: "transform 0.22s ease, opacity 0.22s ease",
        }}
      />

      {/* Icon */}
      <span
        style={{
          color: hovered ? "#1e3a6e" : "#8b7d6b",
          transition: "color 0.22s ease",
          display: "flex",
          alignItems: "center",
        }}
      >
        {icon}
      </span>

      {/* Label */}
      <span
        className="font-serif font-semibold tracking-widest text-sm"
        style={{
          color: hovered ? "#1e3a6e" : "#8b7d6b",
          transition: "color 0.22s ease",
        }}
      >
        {label}
      </span>

      {/* Chevron — slides in from right on hover */}
      <ChevronRight
        className="size-4 ml-auto shrink-0"
        style={{
          color: "#c9a84c",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateX(0)" : "translateX(-6px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      />
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function App(): JSX.Element {
  const router  = useRouter();
  const [mounted, setMounted]   = useState(false);
  const [musicOn, setMusicOn]   = useState(false);

  // Start soundtrack on first user interaction (browser autoplay policy)
  const toggleMusic = useCallback(() => {
    if (musicOn) {
      stopSoundtrack(1.5);
      setMusicOn(false);
    } else {
      startSoundtrack(0.32);
      setMusicOn(true);
    }
  }, [musicOn]);

  // Auto-start after mount with small delay
  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      // Try auto-start (works if user has already interacted with page)
      startSoundtrack(0.32);
      setMusicOn(true);
    }, 800);
    return () => {
      clearTimeout(t);
      stopSoundtrack(0.5);
    };
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="bg-[#f5f0e8] text-[#2c2c2c] w-screen h-screen overflow-hidden">
        <div className="flex w-full h-full">

          {/* ═══════════════════════════════════════════
              SIDEBAR
          ═══════════════════════════════════════════ */}
          <aside
            className="hidden md:flex flex-col justify-between w-64 shrink-0 relative z-20"
            style={{
              background: "linear-gradient(180deg,#fdfbf7 0%,#f5f0e8 100%)",
              borderRight: "1px solid rgba(201,168,76,0.3)",
              boxShadow: "4px 0 32px rgba(201,168,76,0.06), 2px 0 8px rgba(0,0,0,0.04)",
              animation: mounted ? "sidebarIn 0.5s cubic-bezier(0.22,1,0.36,1) both" : "none",
            }}
          >
            {/* Subtle diagonal texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg,#1e3a6e,#1e3a6e 1px,transparent 1px,transparent 5px)",
                opacity: 0.018,
              }}
            />

            {/* ── TOP SECTION ── */}
            <div className="flex flex-col gap-6 relative z-10 p-5 pt-7">

              {/* Logo */}
              <div
                className="flex flex-col items-center gap-3"
                style={{ animation: mounted ? "fadeIn 0.5s ease both 0.18s" : "none" }}
              >
                {/* Crown icon */}
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,#fdfbf7 0%,#ece4d3 100%)",
                      border: "1.5px solid rgba(201,168,76,0.6)",
                      boxShadow: "0 4px 16px rgba(201,168,76,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    <Crown className="size-6 text-[#b8860b]" style={{ filter: "drop-shadow(0 1px 3px rgba(184,134,11,0.3))" }} />
                  </div>
                  {/* Dashed orbit ring */}
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      inset: -5,
                      border: "1px dashed rgba(201,168,76,0.4)",
                      borderRadius: "50%",
                    }}
                  />
                </div>

                {/* Title */}
                <div className="flex flex-col items-center text-center gap-0.5">
                  <span
                    className="font-serif font-bold text-2xl tracking-[0.15em] text-[#1e3a6e] uppercase"
                    style={{ textShadow: "0 1px 0 rgba(255,255,255,0.8)" }}
                  >
                    SoulChess
                  </span>
                  <span
                    className="uppercase font-medium"
                    style={{ fontSize: 9, letterSpacing: "0.42em", color: "#8b7d6b" }}
                  >
                    Anno MMXXV
                  </span>
                </div>
              </div>

              <OrnDivider delay={mounted ? "0.28s" : "99s"} />

              {/* Navigation */}
              <nav className="flex flex-col gap-1.5">
                <span
                  className="font-serif italic text-center mb-1"
                  style={{
                    fontSize: 11, letterSpacing: "0.12em", color: "#8b7d6b",
                    animation: mounted ? "fadeIn 0.4s ease both 0.32s" : "none",
                  }}
                >
                  ~ Tome of Tactics ~
                </span>

                <NavItem
                  icon={<Gamepad2 className="size-5" />}
                  label="PLAY"
                  onClick={() => router.push("/play/local")}
                  delay={mounted ? "0.38s" : "99s"}
                />
                <NavItem
                  icon={<Layers className="size-5" />}
                  label="DECKS"
                  onClick={() => router.push("/decks")}
                  delay={mounted ? "0.44s" : "99s"}
                />
                <NavItem
                  icon={<Settings className="size-5" />}
                  label="SETTINGS"
                  delay={mounted ? "0.5s" : "99s"}
                />
              </nav>
            </div>

            {/* ── BOTTOM SECTION ── */}
            <div
              className="flex flex-col gap-4 relative z-10 p-5 pb-6"
              style={{ animation: mounted ? "profileIn 0.5s ease both 0.5s" : "none" }}
            >
              <OrnDivider />

              {/* Profile card */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer group transition-all"
                style={{
                  background: "rgba(201,168,76,0.05)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: 10,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(201,168,76,0.1)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.45)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(201,168,76,0.05)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)";
                }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-11 h-11 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,#1e3a6e 0%,#2a4a85 100%)",
                      border: "1.5px solid #c9a84c",
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(30,58,110,0.25)",
                    }}
                  >
                    <span className="font-serif text-[#fff4c2] text-sm font-bold">AR</span>
                  </div>
                  {/* Rank gem */}
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 flex items-center justify-center"
                    style={{
                      background: "#b8860b",
                      border: "1.5px solid #fdfbf7",
                      transform: "rotate(45deg)",
                      boxShadow: "0 1px 4px rgba(184,134,11,0.4)",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "#fff4c2", transform: "rotate(-45deg)" }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col overflow-hidden">
                  <span className="font-serif font-semibold text-sm text-[#1e3a6e] truncate">
                    Archmage Rowan
                  </span>
                  <span
                    className="flex items-center gap-1 font-medium uppercase truncate"
                    style={{ fontSize: 10, letterSpacing: "0.08em", color: "#b8860b" }}
                  >
                    <Sparkles className="size-3 shrink-0" />
                    Grandmaster · 2410
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ═══════════════════════════════════════════
              MAIN CONTENT
          ═══════════════════════════════════════════ */}
          <main
            className="relative flex-1 flex flex-col overflow-hidden"
            style={{
              background: "radial-gradient(ellipse at 50% -10%,#fff4c2 0%,#f5f0e8 42%,#ece4d3 100%)",
            }}
          >
            {/* Chess pattern */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: "repeating-conic-gradient(#2c2c2c 0deg 90deg,transparent 90deg 180deg)",
                backgroundPosition: "center",
                backgroundSize: "72px 72px",
                maskImage: "radial-gradient(ellipse at center,black 0%,transparent 68%)",
                WebkitMaskImage: "radial-gradient(ellipse at center,black 0%,transparent 68%)",
                opacity: 0.055,
              }}
            />

            {/* Top bar */}
            <div
              className="absolute inset-x-6 lg:inset-x-10 top-5 lg:top-7 flex items-center justify-between z-10"
              style={{ animation: mounted ? "slideDown 0.4s ease both 0.1s" : "none" }}
            >
              <div className="flex items-center gap-2">
                <Sun className="size-3.5 text-[#b8860b]" />
                <span
                  className="uppercase"
                  style={{ fontSize: 10, letterSpacing: "0.32em", color: "#8b7d6b" }}
                >
                  Hall of the Arcane Tacticians
                </span>
              </div>
            </div>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col justify-center items-center h-full min-h-0 py-10 px-6">

              {/* Welcome line */}
              <div
                className="flex items-center gap-3 mb-3"
                style={{ animation: mounted ? "fadeIn 0.5s ease both 0.22s" : "none" }}
              >
                <div className="w-10 lg:w-14 h-px" style={{ background: "linear-gradient(90deg,transparent,#c9a84c)" }} />
                <Sparkle className="size-3 text-[#b8860b]" />
                <span
                  className="font-medium uppercase whitespace-nowrap"
                  style={{ fontSize: 10, letterSpacing: "0.48em", color: "#1e3a6e" }}
                >
                  Welcome, Archmage
                </span>
                <Sparkle className="size-3 text-[#b8860b]" />
                <div className="w-10 lg:w-14 h-px" style={{ background: "linear-gradient(90deg,#c9a84c,transparent)" }} />
              </div>

              {/* Title */}
              <h1
                className="text-center font-light shrink-0"
                style={{
                  fontFamily: "serif",
                  fontSize: "clamp(2.4rem, 6vw, 4rem)",
                  lineHeight: 1.05,
                  letterSpacing: "0.06em",
                  color: "#1e3a6e",
                  animation: mounted ? "slideDown 0.55s cubic-bezier(0.22,1,0.36,1) both 0.18s" : "none",
                }}
              >
                SOUL
                <span
                  style={{
                    background: "linear-gradient(135deg,#c9a84c 0%,#b8860b 50%,#c9a84c 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  CHESS
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="uppercase text-center mt-2"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  color: "#8b7d6b",
                  animation: mounted ? "fadeIn 0.5s ease both 0.32s" : "none",
                }}
              >
                · A Game of Mind, Magic &amp; Mastery ·
              </p>

              {/* Hero image */}
              <div
                className="relative mt-5 lg:mt-8 shrink min-h-0 flex justify-center items-center"
                style={{ animation: mounted ? "scaleUp 0.6s ease both 0.26s" : "none" }}
              >
                {/* Breathing glow */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: "-20%",
                    background: "radial-gradient(circle,#fff4c2 0%,transparent 70%)",
                    animation: "glowBreath 3.5s ease-in-out infinite",
                  }}
                />
                <Image
                  alt="Chess King"
                  className="relative object-contain w-auto"
                  src="/images/piece2.png"
                  width={400}
                  height={400}
                  style={{
                    height: "clamp(130px, 28vh, 380px)",
                    filter: "drop-shadow(0 18px 36px rgba(30,58,110,0.22)) sepia(0.12)",
                    animation: "floatY 4.5s ease-in-out infinite 0.8s",
                  }}
                />
              </div>

              {/* CTA */}
              <div
                className="flex flex-col items-center gap-3 mt-6 lg:mt-9 shrink-0 w-full max-w-md"
                style={{ animation: mounted ? "slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both 0.42s" : "none" }}
              >
                {/* Primary CTA */}
                <button
                  onClick={() => router.push("/play/local")}
                  className="font-medium uppercase flex items-center justify-center w-full sm:w-auto px-10 h-11 lg:h-12 text-[#faf6ed] cursor-pointer transition-all hover:opacity-92 hover:scale-[1.02]"
                  style={{
                    fontFamily: "serif",
                    fontSize: 12,
                    letterSpacing: "0.32em",
                    background: "linear-gradient(135deg,#c9a84c 0%,#b8860b 100%)",
                    border: "1.5px solid rgba(255,244,194,0.5)",
                    borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(184,134,11,0.3), inset 0 1px 0 rgba(255,244,194,0.4)",
                  }}
                >
                  <Play className="size-3.5 fill-current mr-3" />
                  Enter the Hall
                </button>

                {/* Secondary CTAs */}
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  {[
                    { icon: <Swords className="size-3.5" />, label: "Ranked Duel",  delay: "0.48s" },
                    { icon: <BookOpen className="size-3.5" />, label: "Campaign",   delay: "0.54s" },
                    { icon: <Users className="size-3.5" />, label: "Play a Friend", delay: "0.60s" },
                  ].map(({ icon, label, delay }) => (
                    <button
                      key={label}
                      className="flex items-center gap-2 px-4 h-9 flex-1 sm:flex-none whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02]"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        color: "#1e3a6e",
                        background: "rgba(253,251,247,0.5)",
                        border: "1px solid rgba(201,168,76,0.45)",
                        borderRadius: 8,
                        backdropFilter: "blur(4px)",
                        animation: mounted ? `slideUp 0.4s ease both ${delay}` : "none",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.1)"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(253,251,247,0.5)"}
                    >
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div
              className="absolute inset-x-6 lg:inset-x-10 bottom-5 lg:bottom-7 flex justify-between items-center z-10"
              style={{ animation: mounted ? "slideUp 0.4s ease both 0.58s" : "none" }}
            >
              <div className="hidden sm:flex items-center gap-3 text-[#8b7d6b]" style={{ fontSize: 10 }}>
                <Feather className="size-3 shrink-0" />
                <span className="italic">&quot;The board is a battlefield of souls.&quot;</span>
                {/* Music toggle */}
                <button
                  onClick={toggleMusic}
                  className="flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: musicOn ? "rgba(201,168,76,0.1)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${musicOn ? "rgba(201,168,76,0.4)" : "rgba(0,0,0,0.1)"}`,
                    borderRadius: 20,
                    padding: "3px 8px",
                    color: musicOn ? "#b8860b" : "#8b7d6b",
                  }}
                >
                  <span style={{ fontSize: 11 }}>{musicOn ? "♪" : "♪"}</span>
                  <span style={{ fontSize: 9, letterSpacing: "0.05em" }}>{musicOn ? "ON" : "OFF"}</span>
                </button>
              </div>
              <div
                className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end"
                style={{ fontSize: 10, color: "#8b7d6b" }}
              >
                <span>v 2.4.1</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="size-1.5 rounded-full animate-pulse"
                    style={{ background: "#1e3a6e" }}
                  />
                  <span>12,408 mages online</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}


// 'use client';
// import { useState, useEffect } from "react";
// import Image from "next/image";
// import {
//   BookOpen, ChevronRight, Crown, Feather, Gamepad2,
//   Layers, Play, Settings, Sparkle, Sparkles, Sun, Swords, Users,
// } from "lucide-react";
// import { JSX } from "react";
// import { useRouter } from "next/navigation";

// // ─── Keyframes ────────────────────────────────────────────────
// const STYLES = `
//   @keyframes sidebarIn  {
//     from { opacity: 0; transform: translateX(-28px); }
//     to   { opacity: 1; transform: translateX(0); }
//   }
//   @keyframes slideDown  {
//     from { opacity: 0; transform: translateY(-16px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//   @keyframes slideUp    {
//     from { opacity: 0; transform: translateY(18px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//   @keyframes fadeIn     {
//     from { opacity: 0; }
//     to   { opacity: 1; }
//   }
//   @keyframes scaleUp    {
//     from { opacity: 0; transform: scale(0.88); }
//     to   { opacity: 1; transform: scale(1); }
//   }
//   @keyframes navItemIn  {
//     from { opacity: 0; transform: translateX(-10px); }
//     to   { opacity: 1; transform: translateX(0); }
//   }
//   @keyframes shimmerBar {
//     from { transform: scaleX(0); opacity: 0; }
//     to   { transform: scaleX(1); opacity: 0.6; }
//   }
//   @keyframes floatY     {
//     0%, 100% { transform: translateY(0px);   }
//     50%       { transform: translateY(-10px); }
//   }
//   @keyframes glowBreath {
//     0%, 100% { opacity: 0.28; transform: scale(1);    }
//     50%       { opacity: 0.5;  transform: scale(1.06); }
//   }
//   @keyframes profileIn  {
//     from { opacity: 0; transform: translateY(12px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//   @keyframes activeBarPulse {
//     0%, 100% { box-shadow: 0 0 6px #c9a84c; }
//     50%       { box-shadow: 0 0 14px #c9a84c, 0 0 28px #c9a84c60; }
//   }
//   @keyframes ornDivider {
//     from { opacity: 0; transform: scaleX(0.4); }
//     to   { opacity: 0.6; transform: scaleX(1); }
//   }
// `;

// // ─── Ornate divider ───────────────────────────────────────────
// function OrnDivider({ delay = "0s" }: { delay?: string }) {
//   return (
//     <div
//       className="flex items-center w-full"
//       style={{
//         animation: `ornDivider 0.6s ease both ${delay}`,
//         transformOrigin: "center",
//       }}
//     >
//       <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,#c9a84c)" }} />
//       <div
//         style={{
//           width: 6, height: 6,
//           transform: "rotate(45deg)",
//           border: "1px solid #c9a84c",
//           background: "#fdfbf7",
//           margin: "0 8px",
//         }}
//       />
//       <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,#c9a84c,transparent)" }} />
//     </div>
//   );
// }

// // ─── Nav Item ─────────────────────────────────────────────────
// function NavItem({
//   icon, label, active, onClick, delay,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   active?: boolean;
//   onClick?: () => void;
//   delay: string;
// }) {
//   const [hovered, setHovered] = useState(false);

//   return (
//     <button
//       onClick={onClick}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//       className="relative flex items-center gap-4 w-full h-12 px-4 overflow-hidden cursor-pointer"
//       style={{
//         background: active
//           ? "linear-gradient(90deg,rgba(201,168,76,0.12) 0%,transparent 100%)"
//           : hovered
//             ? "rgba(201,168,76,0.05)"
//             : "transparent",
//         border: `1px solid ${active ? "rgba(201,168,76,0.35)" : hovered ? "rgba(201,168,76,0.2)" : "transparent"}`,
//         borderRadius: 8,
//         transition: "background 0.2s ease, border-color 0.2s ease",
//         animation: `navItemIn 0.4s ease both ${delay}`,
//       }}
//     >
//       {/* Active left bar */}
//       {active && (
//         <div
//           className="absolute left-0 top-2 bottom-2 w-0.75 rounded-r"
//           style={{
//             background: "#c9a84c",
//             animation: "activeBarPulse 2.5s ease infinite",
//           }}
//         />
//       )}

//       {/* Icon */}
//       <span
//         style={{
//           color: active ? "#1e3a6e" : hovered ? "#1e3a6e" : "#8b7d6b",
//           transition: "color 0.2s ease",
//           display: "flex",
//           alignItems: "center",
//         }}
//       >
//         {icon}
//       </span>

//       {/* Label */}
//       <span
//         className="font-serif font-semibold tracking-widest text-sm"
//         style={{
//           color: active ? "#1e3a6e" : hovered ? "#1e3a6e" : "#8b7d6b",
//           transition: "color 0.2s ease",
//         }}
//       >
//         {label}
//       </span>

//       {/* Chevron for active */}
//       {active && (
//         <ChevronRight
//           className="size-4 ml-auto shrink-0"
//           style={{ color: "#c9a84c" }}
//         />
//       )}
//     </button>
//   );
// }

// // ─── Main ─────────────────────────────────────────────────────
// export default function App(): JSX.Element {
//   const router  = useRouter();
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     const t = setTimeout(() => setMounted(true), 40);
//     return () => clearTimeout(t);
//   }, []);

//   return (
//     <>
//       <style>{STYLES}</style>
//       <div className="bg-[#f5f0e8] text-[#2c2c2c] w-screen h-screen overflow-hidden">
//         <div className="flex w-full h-full">

//           {/* ═══════════════════════════════════════════
//               SIDEBAR
//           ═══════════════════════════════════════════ */}
//           <aside
//             className="hidden md:flex flex-col justify-between w-64 shrink-0 relative z-20"
//             style={{
//               background: "linear-gradient(180deg,#fdfbf7 0%,#f5f0e8 100%)",
//               borderRight: "1px solid rgba(201,168,76,0.3)",
//               boxShadow: "4px 0 32px rgba(201,168,76,0.06), 2px 0 8px rgba(0,0,0,0.04)",
//               animation: mounted ? "sidebarIn 0.5s cubic-bezier(0.22,1,0.36,1) both" : "none",
//             }}
//           >
//             {/* Subtle diagonal texture */}
//             <div
//               className="absolute inset-0 pointer-events-none"
//               style={{
//                 backgroundImage: "repeating-linear-gradient(45deg,#1e3a6e,#1e3a6e 1px,transparent 1px,transparent 5px)",
//                 opacity: 0.018,
//               }}
//             />

//             {/* ── TOP SECTION ── */}
//             <div className="flex flex-col gap-6 relative z-10 p-5 pt-7">

//               {/* Logo */}
//               <div
//                 className="flex flex-col items-center gap-3"
//                 style={{ animation: mounted ? "fadeIn 0.5s ease both 0.18s" : "none" }}
//               >
//                 {/* Crown icon */}
//                 <div className="relative">
//                   <div
//                     className="w-14 h-14 rounded-full flex items-center justify-center"
//                     style={{
//                       background: "linear-gradient(135deg,#fdfbf7 0%,#ece4d3 100%)",
//                       border: "1.5px solid rgba(201,168,76,0.6)",
//                       boxShadow: "0 4px 16px rgba(201,168,76,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
//                     }}
//                   >
//                     <Crown className="size-6 text-[#b8860b]" style={{ filter: "drop-shadow(0 1px 3px rgba(184,134,11,0.3))" }} />
//                   </div>
//                   {/* Dashed orbit ring */}
//                   <div
//                     className="absolute rounded-full pointer-events-none"
//                     style={{
//                       inset: -5,
//                       border: "1px dashed rgba(201,168,76,0.4)",
//                       borderRadius: "50%",
//                     }}
//                   />
//                 </div>

//                 {/* Title */}
//                 <div className="flex flex-col items-center text-center gap-0.5">
//                   <span
//                     className="font-serif font-bold text-2xl tracking-[0.15em] text-[#1e3a6e] uppercase"
//                     style={{ textShadow: "0 1px 0 rgba(255,255,255,0.8)" }}
//                   >
//                     SoulChess
//                   </span>
//                   <span
//                     className="uppercase font-medium"
//                     style={{ fontSize: 9, letterSpacing: "0.42em", color: "#8b7d6b" }}
//                   >
//                     Anno MMXXV
//                   </span>
//                 </div>
//               </div>

//               <OrnDivider delay={mounted ? "0.28s" : "99s"} />

//               {/* Navigation */}
//               <nav className="flex flex-col gap-1.5">
//                 <span
//                   className="font-serif italic text-center mb-1"
//                   style={{
//                     fontSize: 11, letterSpacing: "0.12em", color: "#8b7d6b",
//                     animation: mounted ? "fadeIn 0.4s ease both 0.32s" : "none",
//                   }}
//                 >
//                   ~ Tome of Tactics ~
//                 </span>

//                 <NavItem
//                   icon={<Gamepad2 className="size-5" />}
//                   label="PLAY"
//                   active
//                   onClick={() => router.push("/play/local")}
//                   delay={mounted ? "0.38s" : "99s"}
//                 />
//                 <NavItem
//                   icon={<Layers className="size-5" />}
//                   label="DECKS"
//                   onClick={() => router.push("/decks")}
//                   delay={mounted ? "0.44s" : "99s"}
//                 />
//                 <NavItem
//                   icon={<Settings className="size-5" />}
//                   label="SETTINGS"
//                   delay={mounted ? "0.5s" : "99s"}
//                 />
//               </nav>
//             </div>

//             {/* ── BOTTOM SECTION ── */}
//             <div
//               className="flex flex-col gap-4 relative z-10 p-5 pb-6"
//               style={{ animation: mounted ? "profileIn 0.5s ease both 0.5s" : "none" }}
//             >
//               <OrnDivider />

//               {/* Profile card */}
//               <div
//                 className="flex items-center gap-3 p-3 cursor-pointer group transition-all"
//                 style={{
//                   background: "rgba(201,168,76,0.05)",
//                   border: "1px solid rgba(201,168,76,0.2)",
//                   borderRadius: 10,
//                 }}
//                 onMouseEnter={e => {
//                   (e.currentTarget as HTMLDivElement).style.background = "rgba(201,168,76,0.1)";
//                   (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.45)";
//                 }}
//                 onMouseLeave={e => {
//                   (e.currentTarget as HTMLDivElement).style.background = "rgba(201,168,76,0.05)";
//                   (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)";
//                 }}
//               >
//                 {/* Avatar */}
//                 <div className="relative shrink-0">
//                   <div
//                     className="w-11 h-11 flex items-center justify-center"
//                     style={{
//                       background: "linear-gradient(135deg,#1e3a6e 0%,#2a4a85 100%)",
//                       border: "1.5px solid #c9a84c",
//                       borderRadius: 8,
//                       boxShadow: "0 2px 8px rgba(30,58,110,0.25)",
//                     }}
//                   >
//                     <span className="font-serif text-[#fff4c2] text-sm font-bold">AR</span>
//                   </div>
//                   {/* Rank gem */}
//                   <div
//                     className="absolute -bottom-1.5 -right-1.5 w-4 h-4 flex items-center justify-center"
//                     style={{
//                       background: "#b8860b",
//                       border: "1.5px solid #fdfbf7",
//                       transform: "rotate(45deg)",
//                       boxShadow: "0 1px 4px rgba(184,134,11,0.4)",
//                     }}
//                   >
//                     <div
//                       className="w-1.5 h-1.5 rounded-full animate-pulse"
//                       style={{ background: "#fff4c2", transform: "rotate(-45deg)" }}
//                     />
//                   </div>
//                 </div>

//                 {/* Info */}
//                 <div className="flex flex-col overflow-hidden">
//                   <span className="font-serif font-semibold text-sm text-[#1e3a6e] truncate">
//                     Archmage Rowan
//                   </span>
//                   <span
//                     className="flex items-center gap-1 font-medium uppercase truncate"
//                     style={{ fontSize: 10, letterSpacing: "0.08em", color: "#b8860b" }}
//                   >
//                     <Sparkles className="size-3 shrink-0" />
//                     Grandmaster · 2410
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </aside>

//           {/* ═══════════════════════════════════════════
//               MAIN CONTENT
//           ═══════════════════════════════════════════ */}
//           <main
//             className="relative flex-1 flex flex-col overflow-hidden"
//             style={{
//               background: "radial-gradient(ellipse at 50% -10%,#fff4c2 0%,#f5f0e8 42%,#ece4d3 100%)",
//             }}
//           >
//             {/* Chess pattern */}
//             <div
//               className="pointer-events-none absolute inset-0"
//               style={{
//                 backgroundImage: "repeating-conic-gradient(#2c2c2c 0deg 90deg,transparent 90deg 180deg)",
//                 backgroundPosition: "center",
//                 backgroundSize: "72px 72px",
//                 maskImage: "radial-gradient(ellipse at center,black 0%,transparent 68%)",
//                 WebkitMaskImage: "radial-gradient(ellipse at center,black 0%,transparent 68%)",
//                 opacity: 0.055,
//               }}
//             />

//             {/* Top bar */}
//             <div
//               className="absolute inset-x-6 lg:inset-x-10 top-5 lg:top-7 flex items-center justify-between z-10"
//               style={{ animation: mounted ? "slideDown 0.4s ease both 0.1s" : "none" }}
//             >
//               <div className="flex items-center gap-2">
//                 <Sun className="size-3.5 text-[#b8860b]" />
//                 <span
//                   className="uppercase"
//                   style={{ fontSize: 10, letterSpacing: "0.32em", color: "#8b7d6b" }}
//                 >
//                   Hall of the Arcane Tacticians
//                 </span>
//               </div>
//             </div>

//             {/* Hero content */}
//             <div className="relative z-10 flex flex-col justify-center items-center h-full min-h-0 py-10 px-6">

//               {/* Welcome line */}
//               <div
//                 className="flex items-center gap-3 mb-3"
//                 style={{ animation: mounted ? "fadeIn 0.5s ease both 0.22s" : "none" }}
//               >
//                 <div className="w-10 lg:w-14 h-px" style={{ background: "linear-gradient(90deg,transparent,#c9a84c)" }} />
//                 <Sparkle className="size-3 text-[#b8860b]" />
//                 <span
//                   className="font-medium uppercase whitespace-nowrap"
//                   style={{ fontSize: 10, letterSpacing: "0.48em", color: "#1e3a6e" }}
//                 >
//                   Welcome, Archmage
//                 </span>
//                 <Sparkle className="size-3 text-[#b8860b]" />
//                 <div className="w-10 lg:w-14 h-px" style={{ background: "linear-gradient(90deg,#c9a84c,transparent)" }} />
//               </div>

//               {/* Title */}
//               <h1
//                 className="text-center font-light shrink-0"
//                 style={{
//                   fontFamily: "serif",
//                   fontSize: "clamp(2.4rem, 6vw, 4rem)",
//                   lineHeight: 1.05,
//                   letterSpacing: "0.06em",
//                   color: "#1e3a6e",
//                   animation: mounted ? "slideDown 0.55s cubic-bezier(0.22,1,0.36,1) both 0.18s" : "none",
//                 }}
//               >
//                 SOUL
//                 <span
//                   style={{
//                     background: "linear-gradient(135deg,#c9a84c 0%,#b8860b 50%,#c9a84c 100%)",
//                     WebkitBackgroundClip: "text",
//                     WebkitTextFillColor: "transparent",
//                     backgroundClip: "text",
//                   }}
//                 >
//                   CHESS
//                 </span>
//               </h1>

//               {/* Subtitle */}
//               <p
//                 className="uppercase text-center mt-2"
//                 style={{
//                   fontSize: 10,
//                   letterSpacing: "0.3em",
//                   color: "#8b7d6b",
//                   animation: mounted ? "fadeIn 0.5s ease both 0.32s" : "none",
//                 }}
//               >
//                 · A Game of Mind, Magic &amp; Mastery ·
//               </p>

//               {/* Hero image */}
//               <div
//                 className="relative mt-5 lg:mt-8 shrink min-h-0 flex justify-center items-center"
//                 style={{ animation: mounted ? "scaleUp 0.6s ease both 0.26s" : "none" }}
//               >
//                 {/* Breathing glow */}
//                 <div
//                   className="absolute rounded-full"
//                   style={{
//                     inset: "-20%",
//                     background: "radial-gradient(circle,#fff4c2 0%,transparent 70%)",
//                     animation: "glowBreath 3.5s ease-in-out infinite",
//                   }}
//                 />
//                 <Image
//                   alt="Chess King"
//                   className="relative object-contain w-auto"
//                   src="/images/piece2.png"
//                   width={400}
//                   height={400}
//                   style={{
//                     height: "clamp(130px, 28vh, 380px)",
//                     filter: "drop-shadow(0 18px 36px rgba(30,58,110,0.22)) sepia(0.12)",
//                     animation: "floatY 4.5s ease-in-out infinite 0.8s",
//                   }}
//                 />
//               </div>

//               {/* CTA */}
//               <div
//                 className="flex flex-col items-center gap-3 mt-6 lg:mt-9 shrink-0 w-full max-w-md"
//                 style={{ animation: mounted ? "slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both 0.42s" : "none" }}
//               >
//                 {/* Primary CTA */}
//                 <button
//                   onClick={() => router.push("/play/local")}
//                   className="font-medium uppercase flex items-center justify-center w-full sm:w-auto px-10 h-11 lg:h-12 text-[#faf6ed] cursor-pointer transition-all hover:opacity-92 hover:scale-[1.02]"
//                   style={{
//                     fontFamily: "serif",
//                     fontSize: 12,
//                     letterSpacing: "0.32em",
//                     background: "linear-gradient(135deg,#c9a84c 0%,#b8860b 100%)",
//                     border: "1.5px solid rgba(255,244,194,0.5)",
//                     borderRadius: 10,
//                     boxShadow: "0 8px 24px rgba(184,134,11,0.3), inset 0 1px 0 rgba(255,244,194,0.4)",
//                   }}
//                 >
//                   <Play className="size-3.5 fill-current mr-3" />
//                   Enter the Hall
//                 </button>

//                 {/* Secondary CTAs */}
//                 <div className="flex flex-wrap justify-center gap-2 w-full">
//                   {[
//                     { icon: <Swords className="size-3.5" />, label: "Ranked Duel",  delay: "0.48s" },
//                     { icon: <BookOpen className="size-3.5" />, label: "Campaign",   delay: "0.54s" },
//                     { icon: <Users className="size-3.5" />, label: "Play a Friend", delay: "0.60s" },
//                   ].map(({ icon, label, delay }) => (
//                     <button
//                       key={label}
//                       className="flex items-center gap-2 px-4 h-9 flex-1 sm:flex-none whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02]"
//                       style={{
//                         fontSize: 11,
//                         letterSpacing: "0.06em",
//                         color: "#1e3a6e",
//                         background: "rgba(253,251,247,0.5)",
//                         border: "1px solid rgba(201,168,76,0.45)",
//                         borderRadius: 8,
//                         backdropFilter: "blur(4px)",
//                         animation: mounted ? `slideUp 0.4s ease both ${delay}` : "none",
//                       }}
//                       onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.1)"}
//                       onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(253,251,247,0.5)"}
//                     >
//                       {icon}{label}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Bottom bar */}
//             <div
//               className="absolute inset-x-6 lg:inset-x-10 bottom-5 lg:bottom-7 flex justify-between items-center z-10"
//               style={{ animation: mounted ? "slideUp 0.4s ease both 0.58s" : "none" }}
//             >
//               <div className="hidden sm:flex items-center gap-2 text-[#8b7d6b]" style={{ fontSize: 10 }}>
//                 <Feather className="size-3 shrink-0" />
//                 <span className="italic">&quot;The board is a battlefield of souls.&quot;</span>
//               </div>
//               <div
//                 className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end"
//                 style={{ fontSize: 10, color: "#8b7d6b" }}
//               >
//                 <span>v 2.4.1</span>
//                 <div className="flex items-center gap-1.5">
//                   <div
//                     className="size-1.5 rounded-full animate-pulse"
//                     style={{ background: "#1e3a6e" }}
//                   />
//                   <span>12,408 mages online</span>
//                 </div>
//               </div>
//             </div>
//           </main>
//         </div>
//       </div>
//     </>
//   );
// }