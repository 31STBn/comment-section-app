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

export interface LiveSystemSettings {
  id: string;
  event_title: string;
  event_subtitle: string;
  qr_url: string;
  auto_approve: boolean;
  allow_comments: boolean;
  announcement_banner?: string;
  theme: string;
  banned_words: string[];
  admin_password?: string;
  updated_at: string;
}
