import { ThemeId, QRFrameStyle } from "@/types/database";

export interface ThemeConfig {
  id: ThemeId;
  nameEn: string;
  nameBn: string;
  previewThumb?: string;
  bgImage?: string;
  isLight: boolean;
  pageBgClass: string;
  headerCardClass: string;
  titleTextClass: string;
  subtitleTextClass: string;
  commentCardClass: string;
  pinnedCardClass: string;
  authorNameClass: string;
  commentTextClass: string;
  metaTextClass: string;
  accentBadgeClass: string;
  scenicPadding: boolean; // Adds extra clearance for top corners & bottom artwork
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  "military-trucks": {
    id: "military-trucks",
    nameEn: "Tactical Convoy & Mountains (Design 1)",
    nameBn: "সামরিক কনভয় ও পাহাড় (ডিজাইন ১)",
    previewThumb: "/themes/military-trucks.png",
    bgImage: "/themes/military-trucks.png",
    isLight: true,
    pageBgClass: "bg-[#eaf5ec] text-emerald-950",
    headerCardClass:
      "bg-white/85 backdrop-blur-md border-2 border-emerald-800/25 shadow-lg shadow-emerald-950/5",
    titleTextClass: "text-emerald-950",
    subtitleTextClass: "text-emerald-800",
    commentCardClass:
      "bg-white/90 backdrop-blur-md border-2 border-emerald-700/25 hover:border-emerald-700/50 shadow-lg shadow-emerald-950/5",
    pinnedCardClass:
      "bg-gradient-to-r from-amber-50/95 via-white/95 to-emerald-50/95 border-2 border-amber-500 shadow-xl shadow-amber-900/10",
    authorNameClass: "text-emerald-950",
    commentTextClass: "text-slate-800 font-medium",
    metaTextClass: "text-emerald-700/80",
    accentBadgeClass: "bg-emerald-800 text-white border-emerald-900",
    scenicPadding: true,
  },
  "military-soldiers": {
    id: "military-soldiers",
    nameEn: "Tactical Infantry & Flora (Design 2)",
    nameBn: "সামরিক পদাতিক ও প্রকৃতি (ডিজাইন ২)",
    previewThumb: "/themes/military-soldiers.png",
    bgImage: "/themes/military-soldiers.png",
    isLight: true,
    pageBgClass: "bg-[#eef7f0] text-emerald-950",
    headerCardClass:
      "bg-white/85 backdrop-blur-md border-2 border-emerald-900/25 shadow-lg shadow-emerald-950/5",
    titleTextClass: "text-emerald-950",
    subtitleTextClass: "text-emerald-800",
    commentCardClass:
      "bg-white/90 backdrop-blur-md border-2 border-emerald-800/25 hover:border-emerald-800/50 shadow-lg shadow-emerald-950/5",
    pinnedCardClass:
      "bg-gradient-to-r from-amber-50/95 via-white/95 to-emerald-50/95 border-2 border-amber-500 shadow-xl shadow-amber-900/10",
    authorNameClass: "text-emerald-950",
    commentTextClass: "text-slate-800 font-medium",
    metaTextClass: "text-emerald-700/80",
    accentBadgeClass: "bg-emerald-900 text-amber-300 border-emerald-950",
    scenicPadding: true,
  },
  "emerald-command": {
    id: "emerald-command",
    nameEn: "Emerald Command Dark",
    nameBn: "এমেরাল্ড কমান্ড ডার্ক",
    isLight: false,
    pageBgClass:
      "bg-gradient-to-br from-[#071c12] via-[#0c291b] to-[#04120b] text-white",
    headerCardClass:
      "bg-emerald-950/75 backdrop-blur-xl border border-emerald-500/30 shadow-xl",
    titleTextClass: "text-white",
    subtitleTextClass: "text-emerald-200/80",
    commentCardClass:
      "bg-emerald-950/70 backdrop-blur-md border border-emerald-600/30 hover:border-emerald-500/50 shadow-lg",
    pinnedCardClass:
      "bg-gradient-to-r from-amber-500/20 via-emerald-900/85 to-emerald-950/90 border-2 border-amber-400 shadow-xl",
    authorNameClass: "text-amber-300",
    commentTextClass: "text-emerald-50",
    metaTextClass: "text-emerald-300/70",
    accentBadgeClass: "bg-amber-500 text-slate-950 border-amber-400",
    scenicPadding: false,
  },
  "stage-dark": {
    id: "stage-dark",
    nameEn: "Cyber Stage Midnight",
    nameBn: "সাইবার স্টেজ ডার্ক",
    isLight: false,
    pageBgClass:
      "bg-gradient-to-br from-[#0f0c29] via-[#1a1642] to-[#060814] text-white",
    headerCardClass:
      "bg-slate-900/75 backdrop-blur-xl border border-indigo-500/30 shadow-xl",
    titleTextClass: "text-white",
    subtitleTextClass: "text-indigo-200/80",
    commentCardClass:
      "bg-slate-900/75 backdrop-blur-md border border-slate-700/70 hover:border-indigo-500/50 shadow-lg",
    pinnedCardClass:
      "bg-gradient-to-r from-amber-500/20 via-purple-900/50 to-indigo-950/80 border-2 border-amber-400 shadow-xl",
    authorNameClass: "text-white",
    commentTextClass: "text-slate-100",
    metaTextClass: "text-slate-400",
    accentBadgeClass: "bg-indigo-600 text-white border-indigo-500",
    scenicPadding: false,
  },
  "royal-navy": {
    id: "royal-navy",
    nameEn: "Ceremonial Royal Gold & Navy",
    nameBn: "রয়্যাল নেভি ও গোল্ড",
    isLight: false,
    pageBgClass:
      "bg-gradient-to-br from-[#071126] via-[#0e1e40] to-[#050a17] text-white",
    headerCardClass:
      "bg-[#0a162e]/85 backdrop-blur-xl border-2 border-amber-500/40 shadow-xl",
    titleTextClass: "text-amber-300",
    subtitleTextClass: "text-blue-100/85",
    commentCardClass:
      "bg-[#0c1a36]/80 backdrop-blur-md border border-amber-400/30 hover:border-amber-400/60 shadow-lg",
    pinnedCardClass:
      "bg-gradient-to-r from-amber-500/25 via-[#102347] to-[#0a162e] border-2 border-amber-400 shadow-2xl",
    authorNameClass: "text-amber-300",
    commentTextClass: "text-white",
    metaTextClass: "text-blue-200/70",
    accentBadgeClass: "bg-amber-400 text-slate-950 border-amber-300",
    scenicPadding: false,
  },
  "clean-light": {
    id: "clean-light",
    nameEn: "Executive Daylight White",
    nameBn: "ক্লিন ডে-লাইট হোয়াইট",
    isLight: true,
    pageBgClass:
      "bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 text-slate-900",
    headerCardClass:
      "bg-white/95 backdrop-blur-md border border-slate-200 shadow-md",
    titleTextClass: "text-slate-900",
    subtitleTextClass: "text-slate-600",
    commentCardClass:
      "bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm",
    pinnedCardClass:
      "bg-amber-50/90 border-2 border-amber-400 shadow-md",
    authorNameClass: "text-slate-900",
    commentTextClass: "text-slate-700",
    metaTextClass: "text-slate-400",
    accentBadgeClass: "bg-slate-900 text-white border-slate-800",
    scenicPadding: false,
  },
  "custom-image": {
    id: "custom-image",
    nameEn: "Custom Uploaded Background",
    nameBn: "কাস্টম ব্যাকগ্রাউন্ড ছবি",
    isLight: true,
    pageBgClass: "bg-slate-900 text-slate-900",
    headerCardClass:
      "bg-white/88 backdrop-blur-md border-2 border-slate-300/80 shadow-xl",
    titleTextClass: "text-slate-900",
    subtitleTextClass: "text-slate-700",
    commentCardClass:
      "bg-white/90 backdrop-blur-md border border-slate-300/80 shadow-lg",
    pinnedCardClass:
      "bg-amber-50/95 border-2 border-amber-500 shadow-xl",
    authorNameClass: "text-slate-900",
    commentTextClass: "text-slate-800 font-medium",
    metaTextClass: "text-slate-500",
    accentBadgeClass: "bg-emerald-800 text-white border-emerald-900",
    scenicPadding: true,
  },
};

export function getThemeConfig(themeId?: string): ThemeConfig {
  if (themeId && themeId in THEMES) {
    return THEMES[themeId as ThemeId];
  }
  return THEMES["military-trucks"];
}

export const QR_FRAME_STYLES: {
  id: QRFrameStyle;
  nameEn: string;
  nameBn: string;
  desc: string;
}[] = [
  {
    id: "military-badge",
    nameEn: "Tactical Command Frame",
    nameBn: "ট্যাকটিক্যাল কমান্ড ফ্রেম",
    desc: "Forest green & gold double border with tactical corner accents",
  },
  {
    id: "royal-gold",
    nameEn: "Ceremonial Gold Crest",
    nameBn: "রয়্যাল গোল্ড ক্রেস্ট",
    desc: "Regal golden frame with luxury trim",
  },
  {
    id: "modern-glass",
    nameEn: "Frosted Glass Panel",
    nameBn: "মডার্ন গ্লাস ফ্রেম",
    desc: "Translucent modern frosted glass card",
  },
  {
    id: "minimal-clean",
    nameEn: "Studio Minimalist Card",
    nameBn: "মিনিমাল ক্লিন কার্ড",
    desc: "Crisp white architectural card",
  },
  {
    id: "neon-pulse",
    nameEn: "Neon Glow Frame",
    nameBn: "নিয়ন গ্লো ফ্রেম",
    desc: "Vibrant glowing border for dark stages",
  },
];
