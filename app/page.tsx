'use client'

import Image from "next/image";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Coins,
  Crown,
  Feather,
  Gamepad2,
  Gem,
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

export default function App(): JSX.Element {
  return (
    <div className="bg-[#f5f0e8] text-[#2c2c2c] w-screen h-screen overflow-hidden">
      <div className="flex w-full h-full">

        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col justify-between w-64 p-4 lg:p-8 border-r border-[#c9a84c66] shrink-0"
          style={{ background: "linear-gradient(180deg, #faf6ed 0%, #f5f0e8 100%)" }}
        >
          <div className="flex flex-col gap-8 lg:gap-12">

            {/* Logo */}
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-lg flex justify-center items-center w-10 h-10 shrink-0"
                  style={{ background: "linear-gradient(135deg, #c9a84c 0%, #b8860b 100%)" }}
                >
                  <Crown className="size-5 text-[#faf6ed]" />
                </div>
                <div className="flex flex-col">
                  <span className="uppercase text-[10px] tracking-[4.8px] text-[#8b7d6b]">
                    Anno MMXXV
                  </span>
                  <span className="font-semibold text-lg leading-7 tracking-wide text-[#1e3a6e]">
                    SoulChess
                  </span>
                </div>
              </div>
              <div
                className="w-full h-px"
                style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }}
              />
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-2">
              <span className="uppercase text-[10px] tracking-[4.8px] mb-2 text-[#8b7d6b]">
                Menu
              </span>
              <button
                className="rounded-lg border border-[#c9a84c] flex justify-start items-center gap-4 w-full h-12 px-4 text-[#fff4c2] cursor-pointer transition-opacity hover:opacity-90 shrink-0"
                style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #2a4a85 100%)" }}
              >
                <Gamepad2 className="size-4 shrink-0" />
                <span className="font-medium tracking-wide">Play</span>
                <ChevronRight className="size-4 ml-auto shrink-0" />
              </button>
              <button className="rounded-lg flex justify-start items-center gap-4 w-full h-12 px-4 text-[#2c2c2c] bg-transparent cursor-pointer hover:bg-black/5 transition-colors shrink-0">
                <Layers className="size-4 text-[#b8860b] shrink-0" />
                <span className="font-medium tracking-wide">Decks</span>
              </button>
              <button className="rounded-lg flex justify-start items-center gap-4 w-full h-12 px-4 text-[#2c2c2c] bg-transparent cursor-pointer hover:bg-black/5 transition-colors shrink-0">
                <Settings className="size-4 text-[#b8860b] shrink-0" />
                <span className="font-medium tracking-wide">Settings</span>
              </button>
            </nav>
          </div>

          {/* User profile */}
          <div className="flex flex-col gap-4">
            <div
              className="w-full h-px shrink-0"
              style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }}
            />
            <div className="flex items-center gap-2">
              <div className="border-2 border-[#c9a84c] w-10 h-10 rounded-full flex items-center justify-center bg-[#1e3a6e] text-[#fff4c2] text-sm font-semibold shrink-0">
                AR
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-sm leading-5 truncate">Archmage Rowan</span>
                <span className="text-xs leading-4 flex items-center gap-1 text-[#b8860b] whitespace-nowrap">
                  <Sparkles className="size-3 shrink-0" />
                  Grandmaster · 2410
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
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
          <div className="z-10 flex absolute inset-x-6 lg:inset-x-12 top-6 lg:top-8 justify-between items-center hidden sm:flex">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-[#b8860b]" />
              <span className="uppercase text-[10px] lg:text-xs leading-4 tracking-[4px] text-[#8b7d6b]">
                Hall of the Arcane Tacticians
              </span>
            </div>
          </div>

          {/* Hero content */}
          <div className="relative z-10 flex flex-col justify-center items-center h-full min-h-0 py-8">

            {/* Welcome line - Smaller margins */}
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

            {/* Title - Reduced font size and line height */}
            <h1
              className="font-light text-center text-4xl md:text-5xl lg:text-6xl leading-tight lg:leading-[60px] tracking-[2.4px] text-[#1e3a6e] shrink-0"
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

            {/* Hero image - Increased height allocation (40vh instead of 25vh) */}
            <div className="relative mt-4 lg:mt-8 shrink min-h-0 flex justify-center items-center">
              <div
                className="opacity-40 rounded-full absolute inset-0 lg:-inset-8 scale-150"
                style={{ background: "radial-gradient(circle, #fff4c2 0%, transparent 70%)" }}
              />
              <Image
                alt="Chess King"
                className="relative object-contain w-auto h-[40vh] max-h-[400px] min-h-[160px]"
                src="/images/piece2.png"
                width={400}
                height={400}
                style={{
                  filter: "drop-shadow(0 20px 40px rgba(30,58,110,0.25)) sepia(0.15)",
                }}
              />
            </div>

            {/* CTA buttons - Tighter spacing and slightly smaller buttons */}
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
            <div className="text-[10px] lg:text-xs leading-4 flex items-center gap-2 text-[#8b7d6b] hidden sm:flex">
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