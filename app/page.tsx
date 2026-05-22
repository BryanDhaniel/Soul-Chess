'use client'
import Image from "next/image";
import {
  BookOpen,
  ChevronRight,
  Crown,
  Feather,
  Gamepad2,
  Layers,
  Play,
  Settings,
  Sparkle,
  Sparkles,
  Sun,
  Swords,
  Users,
} from "lucide-react";
import { JSX } from "react";
import { useRouter } from "next/navigation";

export default function App(): JSX.Element {
  const router = useRouter();

  return (
    <div className="bg-[#f5f0e8] text-[#2c2c2c] w-screen h-screen overflow-hidden">
      <div className="flex w-full h-full">
        
        {/* SIDEBAR - LIGHT FANTASY THEME */}
        <aside
          className="hidden md:flex flex-col justify-between w-64 p-4 lg:p-6 shrink-0 relative z-20 border-r border-[#c9a84c]/40"
          style={{ 
            background: "linear-gradient(180deg, #fdfbf7 0%, #f5f0e8 100%)",
            boxShadow: "4px 0 24px rgba(201,168,76,0.05)"
          }}
        >
          {/* Subtle parchment texture overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.02]" 
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #1e3a6e, #1e3a6e 1px, transparent 1px, transparent 4px)" }} 
          />

          <div className="flex flex-col gap-6 lg:gap-8 relative z-10 pt-2">
            
            {/* Logo Section */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className="relative flex justify-center items-center w-14 h-14 shrink-0 rounded-full border border-[#c9a84c] bg-linear-to-br from-[#fdfbf7] to-[#ece4d3]"
                style={{ boxShadow: "0 4px 12px rgba(201,168,76,0.15), inset 0 0 10px rgba(255,255,255,0.8)" }}
              >
                <Crown className="size-6 text-[#b8860b] drop-shadow-sm" />
                {/* Decorative outer ring */}
                <div className="absolute -inset-1 border border-[#c9a84c] rounded-full opacity-40 border-dashed" />
              </div>
              <div className="flex flex-col items-center text-center">
                <span 
                  className="font-serif font-bold text-2xl tracking-[0.15em] text-[#1e3a6e] uppercase" 
                >
                  SoulChess
                </span>
                <span className="uppercase text-[9px] tracking-[0.4em] text-[#8b7d6b] mt-1 font-medium">
                  Anno MMXXV
                </span>
              </div>
            </div>

            {/* Ornate Divider */}
            <div className="flex items-center w-full opacity-60">
              <div className="h-px flex-1 bg-linear-to-r from-transparent to-[#c9a84c]" />
              <div className="w-1.5 h-1.5 rotate-45 border border-[#c9a84c] mx-2 bg-[#fdfbf7]" />
              <div className="h-px flex-1 bg-linear-to-l from-transparent to-[#c9a84c]" />
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-3">
              <span className="font-serif italic text-[11px] tracking-widest mb-1 text-[#8b7d6b] text-center">
                ~ Tome of Tactics ~
              </span>
              
              {/* Active Menu Item */}
              <button
                onClick={() => router.push("/play/local")}
                className="relative group flex justify-start items-center gap-4 w-full h-12 px-4 cursor-pointer transition-all overflow-hidden border border-[#c9a84c]/40 bg-linear-to-r from-[#c9a84c]/10 to-transparent"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c9a84c] shadow-[0_0_8px_#c9a84c]" />

                <Gamepad2 className="size-5 shrink-0 text-[#1e3a6e]" />

                <span className="font-serif font-semibold tracking-widest text-sm text-[#1e3a6e]">
                  PLAY
                </span>

                <ChevronRight className="size-4 ml-auto shrink-0 text-[#c9a84c]" />
              </button>

              {/* Inactive Menu Items */}
              <button className="group flex justify-start items-center gap-4 w-full h-12 px-4 border border-transparent hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 transition-all cursor-pointer">
                <Layers className="size-5 shrink-0 text-[#8b7d6b] group-hover:text-[#1e3a6e] transition-colors" />
                <span className="font-serif tracking-widest text-sm text-[#8b7d6b] group-hover:text-[#1e3a6e] transition-colors">DECKS</span>
              </button>
              
              <button className="group flex justify-start items-center gap-4 w-full h-12 px-4 border border-transparent hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 transition-all cursor-pointer">
                <Settings className="size-5 shrink-0 text-[#8b7d6b] group-hover:text-[#1e3a6e] transition-colors" />
                <span className="font-serif tracking-widest text-sm text-[#8b7d6b] group-hover:text-[#1e3a6e] transition-colors">SETTINGS</span>
              </button>
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="flex flex-col gap-4 relative z-10">
            {/* Ornate Divider */}
            <div className="flex items-center w-full opacity-60">
              <div className="h-px flex-1 bg-linear-to-r from-transparent to-[#c9a84c]" />
              <div className="w-1.5 h-1.5 rotate-45 border border-[#c9a84c] mx-2 bg-[#fdfbf7]" />
              <div className="h-px flex-1 bg-linear-to-l from-transparent to-[#c9a84c]" />
            </div>

            <div className="flex items-center gap-3 bg-[#c9a84c]/5 p-2.5 border border-[#c9a84c]/20 hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/10 transition-colors cursor-pointer group">
              <div className="relative flex items-center justify-center w-11 h-11 shrink-0 bg-linear-to-br from-[#1e3a6e] to-[#2a4a85] border border-[#c9a84c] shadow-sm">
                <span className="font-serif text-[#fff4c2] text-sm font-bold">AR</span>
                {/* RPG Style Rank Gem */}
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rotate-45 bg-[#b8860b] border border-[#fdfbf7] flex items-center justify-center shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fff4c2] animate-pulse" />
                </div>
              </div>
              
              <div className="flex flex-col overflow-hidden">
                <span className="font-serif font-semibold text-sm text-[#1e3a6e] truncate">Archmage Rowan</span>
                <span className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 text-[#b8860b] whitespace-nowrap mt-0.5">
                  <Sparkles className="size-3 shrink-0" />
                  Grandmaster · 2410
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main
          className="relative p-6 lg:p-12 flex-1 flex flex-col overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at top, #fff4c2 0%, #f5f0e8 45%, #ece4d3 100%)",
          }}
        >
          {/* Background chess pattern */}
          <div
            className="pointer-events-none opacity-[0.08] absolute inset-0"
            style={{
              backgroundImage:
                "repeating-conic-gradient(#2c2c2c 0deg 90deg, transparent 90deg 180deg)",
              backgroundPosition: "center",
              backgroundSize: "80px 80px",
              maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
            }}
          />
          {/* Top bar */}
          <div className="z-10 flex absolute inset-x-6 lg:inset-x-12 top-6 lg:top-8 justify-between items-center sm:flex">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-[#b8860b]" />
              <span className="uppercase text-[10px] lg:text-xs leading-4 tracking-[4px] text-[#8b7d6b]">
                Hall of the Arcane Tacticians
              </span>
            </div>
          </div>
          {/* Hero content */}
          <div className="relative z-10 flex flex-col justify-center items-center h-full min-h-0 py-8">
            <div className="flex mb-3 lg:mb-4 items-center gap-2 lg:gap-4">
              <div
                className="w-10 lg:w-16 h-px"
                style={{ background: "linear-gradient(90deg, transparent, #c9a84c)" }}
              />
              <Sparkle className="size-3 text-[#b8860b]" />
              <span className="font-medium uppercase text-[9px] lg:text-[10px] leading-4 tracking-[4px] lg:tracking-[6px] text-[#1e3a6e] whitespace-nowrap">
                Welcome, Archmage
              </span>
              <Sparkle className="size-3 text-[#b8860b]" />
              <div
                className="w-10 lg:w-16 h-px"
                style={{ background: "linear-gradient(90deg, #c9a84c, transparent)" }}
              />
            </div>
            {/* Title */}
            <h1
              className="font-light text-center text-4xl md:text-5xl lg:text-6xl leading-tight lg:leading-15 tracking-[2.4px] text-[#1e3a6e] shrink-0"
              style={{ fontFamily: "serif" }}
            >
              SOUL
              <span
                style={{
                  background: "linear-gradient(135deg, #c9a84c 0%, #b8860b 50%, #c9a84c 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                CHESS
              </span>
            </h1>
            <p className="uppercase text-[9px] lg:text-[11px] leading-5 tracking-[2px] lg:tracking-[4px] mt-1 lg:mt-2 text-[#8b7d6b] text-center">
              · A Game of Mind, Magic &amp; Mastery ·
            </p>
            {/* Hero image */}
            <div className="relative mt-4 lg:mt-8 shrink min-h-0 flex justify-center items-center">
              <div
                className="opacity-40 rounded-full absolute inset-0 lg:-inset-8 scale-150"
                style={{ background: "radial-gradient(circle, #fff4c2 0%, transparent 70%)" }}
              />
              <Image
                alt="Chess King"
                className="relative object-contain w-auto h-[30vh] max-h-100 min-h-40"
                src="/images/piece2.png"
                width={400}
                height={400}
                style={{
                  filter: "drop-shadow(0 20px 40px rgba(30,58,110,0.25)) sepia(0.15)",
                }}
              />
            </div>
            {/* CTA buttons */}
            <div className="flex mt-6 lg:mt-10 flex-col items-center gap-3 shrink-0 w-full max-w-lg">
              <button
                className="font-medium uppercase flex items-center justify-center rounded-lg text-xs lg:text-sm leading-6 tracking-[3px] lg:tracking-[4px] border-2 border-[#fff4c2] px-8 lg:px-12 h-10 lg:h-12 text-[#faf6ed] cursor-pointer transition-opacity hover:opacity-90 w-full sm:w-auto"
                style={{
                  background: "linear-gradient(135deg, #c9a84c 0%, #b8860b 100%)",
                  boxShadow: "0 8px 24px rgba(184,134,11,0.35), inset 0 1px 0 rgba(255,244,194,0.5)",
                }}
              >
                <Play className="size-3 lg:size-4 fill-current mr-3" />
                Enter the Hall
              </button>
              <div className="flex flex-wrap justify-center mt-1 items-center gap-2 lg:gap-3 w-full">
                <button className="bg-transparent flex items-center justify-center rounded-lg px-4 gap-2 h-9 lg:h-10 border border-[#c9a84c80] text-[#1e3a6e] cursor-pointer hover:bg-[#c9a84c10] transition-colors text-[11px] lg:text-xs flex-1 sm:flex-none whitespace-nowrap">
                  <Swords className="size-3.5" />
                  Ranked Duel
                </button>
                <button className="bg-transparent flex items-center justify-center rounded-lg px-4 gap-2 h-9 lg:h-10 border border-[#c9a84c80] text-[#1e3a6e] cursor-pointer hover:bg-[#c9a84c10] transition-colors text-[11px] lg:text-xs flex-1 sm:flex-none whitespace-nowrap">
                  <BookOpen className="size-3.5" />
                  Campaign
                </button>
                <button className="bg-transparent flex items-center justify-center rounded-lg px-4 gap-2 h-9 lg:h-10 border border-[#c9a84c80] text-[#1e3a6e] cursor-pointer hover:bg-[#c9a84c10] transition-colors text-[11px] lg:text-xs flex-1 sm:flex-none whitespace-nowrap">
                  <Users className="size-3.5" />
                  Play a Friend
                </button>
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="z-10 flex absolute inset-x-6 lg:inset-x-12 bottom-6 lg:bottom-8 justify-between items-center">
            <div className="text-[10px] lg:text-xs leading-4 items-center gap-2 text-[#8b7d6b] hidden sm:flex">
              <Feather className="size-3 shrink-0" />
              <span className="italic">&quot;The board is a battlefield of souls.&quot;</span>
            </div>
            <div className="text-[10px] lg:text-xs leading-4 flex items-center gap-4 text-[#8b7d6b] w-full sm:w-auto justify-center sm:justify-end">
              <span>v 2.4.1</span>
              <div className="flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-[#1e3a6e] shrink-0" />
                <span>12,408 mages online</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}