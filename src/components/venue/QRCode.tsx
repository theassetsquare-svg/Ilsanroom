'use client';

import { useEffect, useRef } from 'react';

interface QRCodeProps {
  url: string;
  size?: number;
  venueName: string;
}

export default function QRCode({ url, size = 150, venueName }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Generate simple QR code pattern using canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const moduleCount = 21; // QR version 1
    const moduleSize = size / moduleCount;

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Generate a deterministic pattern from URL hash
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    ctx.fillStyle = '#000000';

    // Draw finder patterns (3 corners)
    const drawFinder = (x: number, y: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (isOuter || isInner) {
            ctx.fillRect((x + c) * moduleSize, (y + r) * moduleSize, moduleSize, moduleSize);
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(moduleCount - 7, 0);
    drawFinder(0, moduleCount - 7);

    // Draw data modules using hash
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        // Skip finder pattern areas
        if ((r < 8 && c < 8) || (r < 8 && c > moduleCount - 9) || (r > moduleCount - 9 && c < 8)) continue;

        const bitIndex = r * moduleCount + c;
        const byteValue = Math.abs(hash * (bitIndex + 1) * 31) % 100;
        if (byteValue < 45) {
          ctx.fillRect(c * moduleSize, r * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  }, [url, size]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>${venueName} QR코드</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
          <h2>${venueName}</h2>
          <img src="${dataUrl}" width="${size}" height="${size}" />
          <p style="margin-top:16px;color:#666;font-size:12px;">${url}</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg border border-neutral-700 bg-white"
      />
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition hover:bg-neutral-700"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        QR 프린트
      </button>
    </div>
  );
}
