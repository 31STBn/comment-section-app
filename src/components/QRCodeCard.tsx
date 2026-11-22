"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, QrCode } from "lucide-react";
import { AppLanguage, QRFrameStyle, QRSizeOption } from "@/types/database";
import { translations } from "@/lib/i18n";

interface QRCodeCardProps {
  customUrl?: string;
  fgColor?: string;
  bgColor?: string;
  frameStyle?: QRFrameStyle | string;
  size?: QRSizeOption | string;
  labelEn?: string;
  labelBn?: string;
  logoEmoji?: string;
  language?: AppLanguage;
  isLightTheme?: boolean;
  isPreview?: boolean;
  className?: string;
}

export default function QRCodeCard({
  customUrl,
  fgColor = "#14532d",
  bgColor = "#ffffff",
  frameStyle = "military-badge",
  size = "large",
  labelEn = "Scan QR to Comment",
  labelBn = "মন্তব্য করতে QR কোডটি স্ক্যান করুন",
  logoEmoji = "",
  language = "both",
  isLightTheme = true,
  isPreview = false,
  className = "",
}: QRCodeCardProps) {
  const [audienceUrl, setAudienceUrl] = useState<string>("");

  useEffect(() => {
    if (customUrl && customUrl.trim()) {
      setAudienceUrl(customUrl.trim());
    } else if (typeof window !== "undefined") {
      setAudienceUrl(`${window.location.origin}/audience`);
    }
  }, [customUrl]);

  const pixelSize = isPreview
    ? 140
    : size === "xlarge"
    ? 300
    : size === "normal"
    ? 200
    : 250;

  // Frame styling
  const getFrameOuterClasses = () => {
    switch (frameStyle) {
      case "military-badge":
        return "bg-white/95 backdrop-blur-md border-[3px] border-emerald-800 shadow-2xl shadow-emerald-950/15 ring-4 ring-amber-400/50 text-emerald-950";
      case "royal-gold":
        return "bg-gradient-to-b from-[#0c1a36]/95 to-[#071126]/95 backdrop-blur-xl border-2 border-amber-400 shadow-2xl shadow-amber-500/20 ring-2 ring-amber-300/30 text-white";
      case "minimal-clean":
        return "bg-white border border-slate-200 shadow-xl text-slate-900";
      case "neon-pulse":
        return "bg-slate-900/90 backdrop-blur-xl border-2 border-indigo-500 shadow-[0_0_35px_rgba(99,102,241,0.35)] text-white";
      case "modern-glass":
      default:
        return isLightTheme
          ? "bg-white/85 backdrop-blur-xl border border-emerald-900/20 shadow-xl text-slate-900"
          : "bg-slate-900/80 backdrop-blur-xl border border-white/15 shadow-2xl text-white";
    }
  };

  const getQRContainerClasses = () => {
    switch (frameStyle) {
      case "military-badge":
        return "p-4 sm:p-5 rounded-2xl border-2 border-emerald-800/30 shadow-inner";
      case "royal-gold":
        return "p-4 sm:p-5 rounded-2xl border-2 border-amber-400 shadow-lg";
      case "neon-pulse":
        return "p-4 sm:p-5 rounded-2xl border-2 border-indigo-400/60 qr-glow";
      case "minimal-clean":
        return "p-3 sm:p-4 rounded-xl border border-slate-100";
      default:
        return "p-4 sm:p-5 rounded-2xl shadow-lg border border-black/5";
    }
  };

  const isDarkCard =
    frameStyle === "royal-gold" ||
    frameStyle === "neon-pulse" ||
    (frameStyle === "modern-glass" && !isLightTheme);

  return (
    <div
      className={`rounded-3xl ${
        isPreview ? "p-4" : "p-6 sm:p-7"
      } flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 ${getFrameOuterClasses()} ${className}`}
    >
      {/* Decorative Tactical Corner Accents for Military / Royal styles */}
      {(frameStyle === "military-badge" || frameStyle === "royal-gold") && (
        <>
          <div
            className={`absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 rounded-tl ${
              frameStyle === "military-badge" ? "border-emerald-800" : "border-amber-400"
            }`}
          />
          <div
            className={`absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 rounded-tr ${
              frameStyle === "military-badge" ? "border-emerald-800" : "border-amber-400"
            }`}
          />
          <div
            className={`absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 rounded-bl ${
              frameStyle === "military-badge" ? "border-emerald-800" : "border-amber-400"
            }`}
          />
          <div
            className={`absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 rounded-br ${
              frameStyle === "military-badge" ? "border-emerald-800" : "border-amber-400"
            }`}
          />
        </>
      )}

      {/* Top Call to Action Header */}
      <div className="mb-3 space-y-1">
        {(language === "bn" || language === "both") && (
          <div
            className={`font-extrabold tracking-tight leading-snug ${
              isPreview ? "text-sm" : "text-lg sm:text-xl"
            } ${
              frameStyle === "military-badge"
                ? "text-emerald-900"
                : frameStyle === "royal-gold"
                ? "text-amber-300"
                : isDarkCard
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {labelBn || "মন্তব্য করতে QR কোডটি স্ক্যান করুন"}
          </div>
        )}
        {(language === "en" || language === "both") && (
          <div
            className={`font-bold tracking-tight ${
              language === "both"
                ? isPreview
                  ? "text-xs opacity-80"
                  : "text-sm sm:text-base opacity-85"
                : isPreview
                ? "text-sm"
                : "text-lg sm:text-xl"
            } ${
              frameStyle === "military-badge"
                ? "text-emerald-800"
                : frameStyle === "royal-gold"
                ? "text-amber-200"
                : isDarkCard
                ? "text-slate-200"
                : "text-slate-700"
            }`}
          >
            {labelEn || "Scan QR to Comment"}
          </div>
        )}
      </div>

      {/* Main QR Code Container */}
      <div className="relative my-1">
        <div
          className={`transition-transform duration-300 ${getQRContainerClasses()}`}
          style={{ backgroundColor: bgColor || "#ffffff" }}
        >
          {audienceUrl ? (
            <div className="relative flex items-center justify-center">
              <QRCodeSVG
                value={audienceUrl}
                size={pixelSize}
                bgColor={bgColor || "#ffffff"}
                fgColor={fgColor || "#14532d"}
                level="H"
                includeMargin={false}
              />
              {logoEmoji && logoEmoji.trim() && (
                <div
                  className="absolute flex items-center justify-center rounded-xl shadow-md border-2"
                  style={{
                    backgroundColor: bgColor || "#ffffff",
                    borderColor: fgColor || "#14532d",
                    width: isPreview ? 30 : 46,
                    height: isPreview ? 30 : 46,
                    fontSize: isPreview ? "16px" : "24px",
                  }}
                >
                  {logoEmoji}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{ width: pixelSize, height: pixelSize }}
              className="flex items-center justify-center bg-gray-100 rounded-xl"
            >
              <QrCode className="w-14 h-14 text-gray-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Camera Instruction */}
      {!isPreview && (
        <div className="mt-4 space-y-1 max-w-xs">
          <div
            className={`inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold ${
              frameStyle === "military-badge"
                ? "bg-emerald-900 text-amber-300"
                : frameStyle === "royal-gold"
                ? "bg-amber-400 text-slate-950"
                : isDarkCard
                ? "bg-white/10 text-white"
                : "bg-emerald-900/10 text-emerald-950"
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>
              {language === "bn"
                ? translations.bn.pointCamera
                : language === "en"
                ? translations.en.pointCamera
                : "ফোনের ক্যামেরা দিয়ে স্ক্যান করুন • Scan with Phone"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
