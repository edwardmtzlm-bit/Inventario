
import React, { useEffect, useRef } from 'react';

declare const QRCode: any;

interface QRGeneratorProps {
  value: string;
  size?: number;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ value, size = 180 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      // We'll use a data URL approach via a Google Charts API or similar simple QR gen 
      // because injecting external scripts dynamically is cleaner here.
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
      const img = document.createElement('img');
      img.src = qrUrl;
      img.alt = "QR Order";
      img.className = "mx-auto rounded-lg shadow-sm border border-slate-100";
      containerRef.current.appendChild(img);
    }
  }, [value, size]);

  return <div ref={containerRef} className="flex justify-center p-4" />;
};
