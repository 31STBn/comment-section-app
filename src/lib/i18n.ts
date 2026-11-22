import { AppLanguage } from "@/types/database";

export const translations = {
  en: {
    liveBadge: "LIVE",
    commentsCount: (n: number) => `${n} ${n === 1 ? "Comment" : "Comments"}`,
    pointCamera: "Point your phone camera at the QR code",
    scanInstruction: "Scan to enter your name & comment live on screen",
    featuredComment: "Featured Comment",
    liveStreamTitle: "Live Audience Comments",
    emptyTitle: "Waiting for First Comment",
    emptySubtitle: "Scan the QR code with your phone to share your thoughts live on the screen!",
    commentsPaused: "Comment submissions are currently turned OFF.",
    standbyTitle: "Live Session Starting Soon",
    standbySubtitle: "Please wait while the organizer prepares the live screen.",
    justNow: "Just now",
    postCommentTab: "Post Comment",
    liveStreamTab: "Live Feed",
    yourName: "Your Name / Designation",
    namePlaceholder: "Enter your name...",
    pickAvatar: "Choose Badge / Icon",
    yourComment: "Your Comment",
    commentPlaceholder: "Write your comment here...",
    quickReactions: "Quick Reactions:",
    sendButton: "Submit Comment",
    sending: "Submitting...",
    closedTitle: "Comment Section is Currently Turned Off",
    closedSubtitle: "The organizer has paused comment submissions at this moment.",
    refresh: "Refresh",
    noCommentsYet: "No comments yet. Be the first to post!",
  },
  bn: {
    liveBadge: "লাইভ",
    commentsCount: (n: number) => `${n} টি মন্তব্য`,
    pointCamera: "আপনার ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন",
    scanInstruction: "স্ক্যান করে আপনার নাম ও মন্তব্য লিখলে তা পর্দায় দেখা যাবে",
    featuredComment: "নির্বাচিত মন্তব্য",
    liveStreamTitle: "সরাসরি দর্শকদের মন্তব্য",
    emptyTitle: "মন্তব্যের অপেক্ষায়...",
    emptySubtitle: "আপনার মোবাইল দিয়ে পাশের QR কোডটি স্ক্যান করে প্রথম মন্তব্যটি করুন!",
    commentsPaused: "মন্তব্য গ্রহণ বর্তমানে বন্ধ রয়েছে।",
    standbyTitle: "লাইভ সেশন শীঘ্রই শুরু হবে",
    standbySubtitle: "অনুগ্রহ করে অপেক্ষা করুন, অ্যাডমিন বড় পর্দার জন্য সেশন প্রস্তুত করছেন।",
    justNow: "এইমাত্র",
    postCommentTab: "মন্তব্য লিখুন",
    liveStreamTab: "সকল মন্তব্য",
    yourName: "আপনার নাম / পদবী",
    namePlaceholder: "আপনার নাম লিখুন...",
    pickAvatar: "আইকন নির্বাচন করুন",
    yourComment: "আপনার মন্তব্য",
    commentPlaceholder: "আপনার মতামত বা মন্তব্য এখানে লিখুন...",
    quickReactions: "দ্রুত মন্তব্য:",
    sendButton: "মন্তব্য পাঠান",
    sending: "পাঠানো হচ্ছে...",
    closedTitle: "মন্তব্য সেকশন বর্তমানে বন্ধ আছে",
    closedSubtitle: "আয়োজক এই মুহূর্তে নতুন মন্তব্য গ্রহণ বন্ধ রেখেছেন।",
    refresh: "রিফ্রেশ",
    noCommentsYet: "এখনো কোনো মন্তব্য আসেনি। প্রথম মন্তব্যটি আপনি করুন!",
  },
};

export const QUICK_REACTIONS_BN = [
  "👏 চমৎকার আয়োজন!",
  "🎖️ অভিনন্দন ও শুভকামনা!",
  "🔥 অসাধারণ উপস্থাপনা!",
  "❤️ খুবই ভালো লাগলো!",
  "💡 একটি প্রশ্ন ছিল:",
];

export const QUICK_REACTIONS_EN = [
  "👏 Excellent presentation!",
  "🎖️ Congratulations & best wishes!",
  "🔥 Great initiative!",
  "❤️ Really inspiring!",
  "💡 Question:",
];

export function formatBilingual(lang: AppLanguage, bnText: string, enText: string): string {
  if (lang === "bn") return bnText;
  if (lang === "en") return enText;
  return `${bnText} • ${enText}`;
}
