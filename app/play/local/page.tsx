'use client'
import { JSX } from "react";

export default function OctagonArena(): JSX.Element {
  const GRID_SIZE = 16;
  const board = [];

  // Men-generate matriks 16x16
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Logika untuk memotong sudut (Segitiga berukuran 4x4)
      const isTopLeft = r + c < 4;
      const isTopRight = c - r > 11;
      const isBottomLeft = r - c > 11;
      const isBottomRight = r + c > 26;

      // Jika tidak berada di sudut, maka itu adalah kotak arena aktif
      const isInside = !(isTopLeft || isTopRight || isBottomLeft || isBottomRight);
      
      // Menentukan warna kotak (selang-seling layaknya papan catur)
      const isLightSquare = (r + c) % 2 === 0;

      board.push({
        id: `${r}-${c}`,
        row: r,
        col: c,
        isInside,
        isLightSquare
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f0e8] p-4 lg:p-8 font-serif">
      {/* Header Arena */}
      <div className="text-center mb-6 flex flex-col items-center gap-2">
        <h2 className="text-[#2c2c2c] text-xl lg:text-2xl font-bold tracking-[0.15em] uppercase">
          The Arcane Octagon
        </h2>
        <div className="flex items-center gap-4 opacity-60">
          <div className="w-12 h-px bg-linear-to-r from-transparent to-[#2c2c2c]" />
          <span className="text-[#2c2c2c] text-[10px] uppercase tracking-widest">216 Squares</span>
          <div className="w-12 h-px bg-linear-to-l from-transparent to-[#2c2c2c]" />
        </div>
      </div>

      {/* Frame Arena (Diubah menjadi warna batu/perkamen tua agar kotak putih kontras) */}
      <div 
        className="relative p-3 lg:p-4 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.15)]"
        style={{
          background: "linear-gradient(135deg, #e4dcce 0%, #c3b9a5 100%)",
          border: "2px solid #2c2c2c"
        }}
      >
        {/* Grid Papan Catur dengan Border Hitam Tegas di sekelilingnya */}
        <div 
          className="grid gap-0 aspect-square w-[85vw] max-w-90 lg:max-w-115 bg-transparent overflow-hidden border-2 border-[#2c2c2c]" 
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
          }}
        >
          {board.map((cell) => (
            <div
              key={cell.id}
              className={`
                w-full h-full flex items-center justify-center transition-colors duration-200
                ${cell.isInside 
                  ? cell.isLightSquare 
                    ? "bg-[#ffffff] hover:bg-[#eaeaea] border border-[#2c2c2c]/5" // Putih (Terang)
                    : "bg-[#2c2c2c] hover:bg-[#1a1a1a]" // Hitam (Gelap)
                  : "bg-transparent" // Area luar oktagon
                }
              `}
              style={{
                cursor: cell.isInside ? "pointer" : "default",
              }}
            >
            </div>
          ))}
        </div>

        {/* Dekorasi Bingkai Sudut Monokrom */}
        <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-[#2c2c2c] rounded-tl-md pointer-events-none" />
        <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-[#2c2c2c] rounded-tr-md pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-[#2c2c2c] rounded-bl-md pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-[#2c2c2c] rounded-br-md pointer-events-none" />
      </div>
    </div>
  );
}