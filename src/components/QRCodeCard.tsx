"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, ExternalLink, Copy, Check, Sparkles, QrCode } from "lucide-react";

interface QRCodeCardProps {
  customUrl?: string;
  className?: string;
}

export default function QRCodeCard({ customUrl, className = "" }: QRCodeCardProps) {
  const [audienceUrl, setAudienceUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (customUrl && customUrl.trim()) {
      setAudienceUrl(customUrl.trim());
    } else if (typeof window !== "undefined") {
      setAudienceUrl(`${window.location.origin}/audience`);
    }
  }, [customUrl]);

  const handleCopy = async () => {
    if (!audienceUrl) return;
    try {
      await navigator.clipboard.writeText(audienceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div
      className={`glass-panel-glow rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Scan To Post
        </span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Feed Active
        </span>
      </div>

      {/* Main QR Code container with high contrast */}
      <div className="relative group my-2">
        <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105 border-4 border-indigo-500/30 qr-glow">
          {audienceUrl ? (
            <QRCodeSVG
              value={audienceUrl}
              size={240}
              level="H"
              includeMargin={false}
              className="w-48 h-48 sm:w-60 sm:h-60"
            />
          ) : (
            <div className="w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center bg-gray-100 rounded-xl">
              <QrCode className="w-16 h-16 text-gray-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 space-y-1.5 max-w-xs">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-lg sm:text-xl">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <span>Point Your Camera</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
          Scan with your phone to submit your name and live comment instantly!
        </p>
      </div>

      {/* URL bar & Copy Button */}
      <div className="w-full mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
        <div className="text-left overflow-hidden">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Direct Link</div>
          <div className="text-xs text-slate-200 truncate font-mono select-all">
            {audienceUrl || "Generating link..."}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={audienceUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors border border-indigo-500/40"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
