// 'use client'

// import Image from "next/image";
// import {
//   ChevronRight,
//   Crown,
//   Feather,
//   Gamepad2,
//   Layers,
//   Play,
//   Settings,
//   Sparkle,
//   Sparkles,
//   Sun,
//   Swords,
//   BookOpen,
//   Users,
// } from "lucide-react";
// import { JSX } from "react";

// export default function App(): JSX.Element {
//   return (
//     <div className="bg-[#f5f0e8] text-[#2c2c2c] w-screen h-screen overflow-hidden">
//       <div className="flex w-full h-full">

//         {/* ================= SIDEBAR ================= */}
//         <aside
//           className="
//             hidden md:flex
//             relative
//             flex-col
//             justify-between
//             w-72
//             p-6
//             border-r
//             border-[#c9a84c40]
//             shrink-0
//             overflow-hidden
//           "
//           style={{
//             background: `
//               linear-gradient(
//                 180deg,
//                 #f6f1e7 0%,
//                 #efe6d3 50%,
//                 #e8dcc6 100%
//               )
//             `,
//             boxShadow: "inset -8px 0 24px rgba(0,0,0,0.04)",
//           }}
//         >

//           {/* Decorative glow */}
//           <div
//             className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30"
//             style={{
//               background:
//                 "radial-gradient(circle, rgba(201,168,76,0.45) 0%, transparent 70%)",
//             }}
//           />

//           {/* Decorative border */}
//           <div className="absolute inset-3 rounded-3xl border border-[#c9a84c35] pointer-events-none" />

//           {/* Decorative watermark */}
//           <div
//             className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-[0.05]"
//           >
//             <Crown
//               className="w-56 h-56 text-[#1e3a6e]"
//               strokeWidth={1}
//             />
//           </div>

//           {/* TOP */}
//           <div className="relative z-10 flex flex-col gap-10">

//             {/* LOGO */}
//             <div className="flex flex-col gap-5">

//               <div className="flex items-center gap-4">

//                 <div
//                   className="
//                     relative
//                     w-14
//                     h-14
//                     rounded-2xl
//                     flex
//                     items-center
//                     justify-center
//                     border
//                     border-[#c9a84c80]
//                     shadow-lg
//                   "
//                   style={{
//                     background:
//                       "linear-gradient(135deg, #1e3a6e 0%, #2b4f89 100%)",
//                     boxShadow:
//                       "0 10px 30px rgba(30,58,110,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
//                   }}
//                 >
//                   <div
//                     className="absolute inset-1 rounded-xl border border-[#fff4c255]"
//                   />

//                   <Crown className="size-6 text-[#fff4c2]" />
//                 </div>

//                 <div className="flex flex-col">
//                   <span
//                     className="
//                       uppercase
//                       text-[10px]
//                       tracking-[5px]
//                       text-[#8b7d6b]
//                     "
//                   >
//                     Arcane Arena
//                   </span>

//                   <span
//                     className="
//                       text-3xl
//                       leading-none
//                       tracking-wide
//                       text-[#1e3a6e]
//                     "
//                     style={{
//                       fontFamily: "serif",
//                     }}
//                   >
//                     SoulChess
//                   </span>
//                 </div>
//               </div>

//               <div
//                 className="h-px w-full"
//                 style={{
//                   background:
//                     "linear-gradient(90deg, transparent, #c9a84c, transparent)",
//                 }}
//               />
//             </div>

//             {/* NAVIGATION */}
//             <nav className="flex flex-col gap-4">

//               <span
//                 className="
//                   uppercase
//                   text-[10px]
//                   tracking-[5px]
//                   text-[#8b7d6b]
//                   pl-2
//                 "
//               >
//                 Navigation
//               </span>

//               {/* PLAY */}
//               <button
//                 className="
//                   group
//                   relative
//                   overflow-hidden
//                   rounded-2xl
//                   border
//                   border-[#c9a84c90]
//                   h-16
//                   px-5
//                   flex
//                   items-center
//                   gap-4
//                   transition-all
//                   hover:scale-[1.01]
//                   cursor-pointer
//                 "
//                 style={{
//                   background:
//                     "linear-gradient(135deg, #27467a 0%, #1e3a6e 100%)",
//                   boxShadow:
//                     "0 8px 24px rgba(30,58,110,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
//                 }}
//               >

//                 {/* inner glow */}
//                 <div
//                   className="
//                     absolute
//                     inset-0
//                     opacity-20
//                     pointer-events-none
//                   "
//                   style={{
//                     background:
//                       "radial-gradient(circle at top left, #fff4c2 0%, transparent 55%)",
//                   }}
//                 />

//                 <div
//                   className="
//                     w-10
//                     h-10
//                     rounded-xl
//                     flex
//                     items-center
//                     justify-center
//                     border
//                     border-[#fff4c240]
//                     bg-[#fff4c214]
//                     shrink-0
//                   "
//                 >
//                   <Gamepad2 className="size-5 text-[#fff4c2]" />
//                 </div>

//                 <div className="flex flex-col items-start">
//                   <span className="text-[#fff4c2] font-semibold tracking-wide">
//                     Play
//                   </span>

//                   <span className="text-[11px] text-[#d8d1c3]">
//                     Enter the battlefield
//                   </span>
//                 </div>

//                 <ChevronRight className="size-4 ml-auto text-[#fff4c2]" />
//               </button>

//               {/* DECK BUILDS */}
//               <button
//                 className="
//                   group
//                   rounded-2xl
//                   border
//                   border-[#c9a84c35]
//                   bg-[#ffffff55]
//                   h-16
//                   px-5
//                   flex
//                   items-center
//                   gap-4
//                   transition-all
//                   hover:bg-[#ffffff88]
//                   hover:border-[#c9a84c80]
//                   cursor-pointer
//                 "
//               >

//                 <div
//                   className="
//                     w-10
//                     h-10
//                     rounded-xl
//                     flex
//                     items-center
//                     justify-center
//                     border
//                     border-[#c9a84c30]
//                     bg-[#c9a84c10]
//                     shrink-0
//                   "
//                 >
//                   <Layers className="size-5 text-[#b8860b]" />
//                 </div>

//                 <div className="flex flex-col items-start">
//                   <span className="font-semibold tracking-wide text-[#2c2c2c]">
//                     Deck Builds
//                   </span>

//                   <span className="text-[11px] text-[#7b6d5a]">
//                     Craft your strategy
//                   </span>
//                 </div>
//               </button>

//               {/* SETTINGS */}
//               <button
//                 className="
//                   group
//                   rounded-2xl
//                   border
//                   border-[#c9a84c35]
//                   bg-[#ffffff55]
//                   h-16
//                   px-5
//                   flex
//                   items-center
//                   gap-4
//                   transition-all
//                   hover:bg-[#ffffff88]
//                   hover:border-[#c9a84c80]
//                   cursor-pointer
//                 "
//               >

//                 <div
//                   className="
//                     w-10
//                     h-10
//                     rounded-xl
//                     flex
//                     items-center
//                     justify-center
//                     border
//                     border-[#c9a84c30]
//                     bg-[#c9a84c10]
//                     shrink-0
//                   "
//                 >
//                   <Settings className="size-5 text-[#b8860b]" />
//                 </div>

//                 <div className="flex flex-col items-start">
//                   <span className="font-semibold tracking-wide text-[#2c2c2c]">
//                     Settings
//                   </span>

//                   <span className="text-[11px] text-[#7b6d5a]">
//                     Game & account
//                   </span>
//                 </div>
//               </button>
//             </nav>
//           </div>

//           {/* BOTTOM PROFILE */}
//           <div className="relative z-10 flex flex-col gap-5">

//             <div
//               className="h-px w-full"
//               style={{
//                 background:
//                   "linear-gradient(90deg, transparent, #c9a84c, transparent)",
//               }}
//             />

//             <div
//               className="
//                 rounded-2xl
//                 border
//                 border-[#c9a84c35]
//                 bg-[#ffffff66]
//                 p-4
//                 backdrop-blur-sm
//               "
//             >
//               <div className="flex items-center gap-3">

//                 <div
//                   className="
//                     relative
//                     w-12
//                     h-12
//                     rounded-full
//                     flex
//                     items-center
//                     justify-center
//                     text-[#fff4c2]
//                     font-semibold
//                     shrink-0
//                     border-2
//                     border-[#c9a84c]
//                   "
//                   style={{
//                     background:
//                       "linear-gradient(135deg, #1e3a6e 0%, #31579a 100%)",
//                   }}
//                 >
//                   AR
//                 </div>

//                 <div className="flex flex-col overflow-hidden">
//                   <span className="font-semibold truncate">
//                     Archmage Rowan
//                   </span>

//                   <span className="flex items-center gap-1 text-xs text-[#b8860b]">
//                     <Sparkles className="size-3" />
//                     Grandmaster · 2410
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </aside>

//         {/* ================= MAIN ================= */}
//         <main
//           className="relative p-6 lg:p-12 flex-1 flex flex-col overflow-hidden"
//           style={{
//             background:
//               "radial-gradient(ellipse at top, #fff4c2 0%, #f5f0e8 45%, #ece4d3 100%)",
//           }}
//         >

//           {/* Background pattern */}
//           <div
//             className="pointer-events-none opacity-[0.08] absolute inset-0"
//             style={{
//               backgroundImage:
//                 "repeating-conic-gradient(#2c2c2c 0deg 90deg, transparent 90deg 180deg)",
//               backgroundPosition: "center",
//               backgroundSize: "80px 80px",
//               maskImage:
//                 "radial-gradient(ellipse at center, black 0%, transparent 70%)",
//               WebkitMaskImage:
//                 "radial-gradient(ellipse at center, black 0%, transparent 70%)",
//             }}
//           />

//           {/* TOP BAR */}
//           <div className="z-10 flex absolute inset-x-6 lg:inset-x-12 top-6 lg:top-8 justify-between items-center hidden sm:flex">
//             <div className="flex items-center gap-2">
//               <Sun className="size-4 text-[#b8860b]" />

//               <span className="uppercase text-xs tracking-[4px] text-[#8b7d6b]">
//                 Hall of the Arcane Tacticians
//               </span>
//             </div>
//           </div>

//           {/* HERO */}
//           <div className="relative z-10 flex flex-col justify-center items-center h-full py-8">

//             <div className="flex mb-4 items-center gap-4">
//               <div
//                 className="w-16 h-px"
//                 style={{
//                   background:
//                     "linear-gradient(90deg, transparent, #c9a84c)",
//                 }}
//               />

//               <Sparkle className="size-3 text-[#b8860b]" />

//               <span
//                 className="
//                   font-medium
//                   uppercase
//                   text-[10px]
//                   tracking-[6px]
//                   text-[#1e3a6e]
//                 "
//               >
//                 Welcome, Archmage
//               </span>

//               <Sparkle className="size-3 text-[#b8860b]" />

//               <div
//                 className="w-16 h-px"
//                 style={{
//                   background:
//                     "linear-gradient(90deg, #c9a84c, transparent)",
//                 }}
//               />
//             </div>

//             <h1
//               className="
//                 font-light
//                 text-center
//                 text-5xl
//                 md:text-6xl
//                 lg:text-7xl
//                 leading-none
//                 tracking-[2px]
//                 text-[#1e3a6e]
//               "
//               style={{
//                 fontFamily: "serif",
//               }}
//             >
//               SOUL
//               <span
//                 style={{
//                   backgroundImage:
//                     "linear-gradient(135deg, #c9a84c 0%, #b8860b 50%, #c9a84c 100%)",
//                   WebkitBackgroundClip: "text",
//                   backgroundClip: "text",
//                   WebkitTextFillColor: "transparent",
//                   color: "transparent",
//                 }}
//               >
//                 CHESS
//               </span>
//             </h1>

//             <p
//               className="
//                 uppercase
//                 text-[11px]
//                 tracking-[4px]
//                 mt-3
//                 text-[#8b7d6b]
//               "
//             >
//               · A Game of Mind, Magic & Mastery ·
//             </p>

//             {/* HERO IMAGE */}
//             <div className="relative mt-10 flex justify-center items-center shrink min-h-0">

//               <div
//                 className="opacity-40 rounded-full absolute inset-0 scale-150 blur-2xl"
//                 style={{
//                   background:
//                     "radial-gradient(circle, #fff4c2 0%, transparent 70%)",
//                 }}
//               />

//               <Image
//                 alt="Chess King"
//                 className="relative object-contain w-auto h-[30vh] max-h-[440px] min-h-[160px]"
//                 src="/images/piece2.png"
//                 width={400}
//                 height={400}
//                 style={{
//                   filter:
//                     "drop-shadow(0 20px 40px rgba(30,58,110,0.25)) sepia(0.15)",
//                 }}
//               />
//             </div>

//             {/* CTA */}
//             <div className="flex mt-10 flex-col items-center gap-4 shrink-0 w-full max-w-lg">

//               <button
//                 className="
//                   font-medium
//                   uppercase
//                   flex
//                   items-center
//                   justify-center
//                   rounded-2xl
//                   text-sm
//                   tracking-[4px]
//                   border-2
//                   border-[#fff4c2]
//                   px-12
//                   h-14
//                   text-[#faf6ed]
//                   cursor-pointer
//                   transition-all
//                   hover:scale-[1.02]
//                   w-full sm:w-auto
//                 "
//                 style={{
//                   background:
//                     "linear-gradient(135deg, #c9a84c 0%, #b8860b 100%)",
//                   boxShadow:
//                     "0 10px 30px rgba(184,134,11,0.35), inset 0 1px 0 rgba(255,244,194,0.5)",
//                 }}
//               >
//                 <Play className="size-4 fill-current mr-3" />
//                 Enter the Hall
//               </button>

//               <div className="flex flex-wrap justify-center items-center gap-3 w-full">

//                 <button className="bg-transparent flex items-center justify-center rounded-xl px-4 lg:px-5 gap-2 h-11 border border-[#c9a84c80] text-[#1e3a6e] cursor-pointer hover:bg-[#c9a84c10] transition-colors text-xs flex-1 sm:flex-none whitespace-nowrap">
//                   <Swords className="size-4" />
//                   Ranked Duel
//                 </button>

//                 <button className="bg-transparent flex items-center justify-center rounded-xl px-4 lg:px-5 gap-2 h-11 border border-[#c9a84c80] text-[#1e3a6e] cursor-pointer hover:bg-[#c9a84c10] transition-colors text-xs flex-1 sm:flex-none whitespace-nowrap">
//                   <BookOpen className="size-4" />
//                   Campaign
//                 </button>

//                 <button className="bg-transparent flex items-center justify-center rounded-xl px-4 lg:px-5 gap-2 h-11 border border-[#c9a84c80] text-[#1e3a6e] cursor-pointer hover:bg-[#c9a84c10] transition-colors text-xs flex-1 sm:flex-none whitespace-nowrap">
//                   <Users className="size-4" />
//                   Play a Friend
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* BOTTOM */}
//           <div className="z-10 flex absolute inset-x-6 lg:inset-x-12 bottom-6 justify-between items-center">

//             <div className="text-xs flex items-center gap-2 text-[#8b7d6b] hidden sm:flex">
//               <Feather className="size-3 shrink-0" />
//               <span className="italic">
//                 &quot;The board is a battlefield of souls.&quot;
//               </span>
//             </div>

//             <div className="text-xs flex items-center gap-4 text-[#8b7d6b] w-full sm:w-auto justify-center sm:justify-end">
//               <span>v 2.4.1</span>

//               <div className="flex items-center gap-1">
//                 <div className="size-1.5 rounded-full bg-[#1e3a6e]" />
//                 <span>12,408 mages online</span>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }