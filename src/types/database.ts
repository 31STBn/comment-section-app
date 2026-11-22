export interface LiveComment {
  id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  status: "approved" | "pending" | "rejected" | "deleted";
  is_pinned: boolean;
  pinned_at?: string | null;
  likes_count: number;
  created_at: string;
}

export type AppLanguage = "bn" | "en" | "both";

export type ThemeId =
  | "military-trucks"
  | "military-soldiers"
  | "emerald-command"
  | "stage-dark"
  | "royal-navy"
  | "clean-light"
  | "custom-image";

export type QRFrameStyle =
  | "military-badge"
  | "modern-glass"
  | "royal-gold"
  | "minimal-clean"
  | "neon-pulse";

export type QRSizeOption = "normal" | "large" | "xlarge";
export type QRPositionOption = "left" | "right";

export interface LiveSystemSettings {
  id: string;
  event_title: string;
  event_subtitle: string;
  qr_url: string;
  auto_approve: boolean;
  allow_comments: boolean;
  announcement_banner?: string;
  theme: ThemeId | string;
  banned_words: string[];
  language: AppLanguage;
  is_published: boolean;
  qr_fg_color: string;
  qr_bg_color: string;
  qr_frame_style: QRFrameStyle | string;
  qr_size: QRSizeOption | string;
  qr_position: QRPositionOption | string;
  qr_label_en: string;
  qr_label_bn: string;
  qr_logo_emoji: string;
  custom_bg_url: string;
  updated_at: string;
}
