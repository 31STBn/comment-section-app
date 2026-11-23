"use client";

import React, { useState, useEffect } from "react";
import {
  verifyAdminPassword,
  adminGetAllComments,
  adminUpdateCommentStatus,
  adminTogglePinComment,
  adminDeleteComment,
  adminClearAllComments,
  adminGetSettings,
  adminUpdateSettings,
  adminToggleCommentSection,
} from "@/app/actions/admin-actions";
import { supabase } from "@/lib/supabase/client";
import {
  LiveComment,
  LiveSystemSettings,
  AppLanguage,
  ThemeId,
  QRFrameStyle,
  QRSizeOption,
  QRPositionOption,
} from "@/types/database";
import { THEMES, QR_FRAME_STYLES, getThemeConfig } from "@/lib/themes";
import QRCodeCard from "@/components/QRCodeCard";
import {
  Shield,
  KeyRound,
  CheckCircle,
  XCircle,
  Pin,
  Trash2,
  RefreshCw,
  Settings,
  Sliders,
  Download,
  FileText,
  AlertTriangle,
  Megaphone,
  Eye,
  EyeOff,
  LogOut,
  Search,
  Check,
  Palette,
  QrCode,
  Power,
  Rocket,
  Languages,
  Upload,
  Monitor,
  PauseCircle,
} from "lucide-react";

const QR_COLOR_PRESETS = [
  { name: "Forest Green", color: "#14532d" },
  { name: "Tactical Olive", color: "#365314" },
  { name: "Classic Black", color: "#0f172a" },
  { name: "Royal Navy", color: "#1e1b4b" },
  { name: "Crimson Command", color: "#7f1d1d" },
  { name: "Deep Purple", color: "#581c87" },
];

const QR_BG_PRESETS = [
  { name: "Pure White", color: "#ffffff" },
  { name: "Soft Mint", color: "#f0fdf4" },
  { name: "Warm Cream", color: "#fffbeb" },
  { name: "Ice Blue", color: "#f0f9ff" },
];

const QR_LOGO_PRESETS = ["", "🎖️", "🇧🇩", "⭐", "🛡️", "🎙️", "💬", "🔥"];

export default function SecretSuperadminPage() {
  const [adminUiLang, setAdminUiLang] = useState<"bn" | "en">("en");
  const [password, setPassword] = useState<string>("");
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Data states
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"moderation" | "themes" | "qrcode" | "settings">(
    "moderation"
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "pinned">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Draft Settings states (Admin edits these and then clicks "Publish for Big Screen")
  const [eventTitle, setEventTitle] = useState<string>("Live Audience Comments");
  const [eventSubtitle, setEventSubtitle] = useState<string>(
    "Scan the QR code to join the live conversation!"
  );
  const [qrUrl, setQrUrl] = useState<string>("");
  const [autoApprove, setAutoApprove] = useState<boolean>(true);
  const [allowComments, setAllowComments] = useState<boolean>(true);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [announcementBanner, setAnnouncementBanner] = useState<string>("");
  const [bannedWordsInput, setBannedWordsInput] = useState<string>("");
  const [language, setLanguage] = useState<AppLanguage>("both");
  const [selectedTheme, setSelectedTheme] = useState<ThemeId | string>("military-trucks");
  const [customBgUrl, setCustomBgUrl] = useState<string>("");

  // QR Customization states
  const [qrFgColor, setQrFgColor] = useState<string>("#14532d");
  const [qrBgColor, setQrBgColor] = useState<string>("#ffffff");
  const [qrFrameStyle, setQrFrameStyle] = useState<QRFrameStyle | string>("military-badge");
  const [qrSize, setQrSize] = useState<QRSizeOption | string>("large");
  const [qrPosition, setQrPosition] = useState<QRPositionOption | string>("left");
  const [qrLabelEn, setQrLabelEn] = useState<string>("Scan QR to Comment");
  const [qrLabelBn, setQrLabelBn] = useState<string>("মন্তব্য করতে QR কোডটি স্ক্যান করুন");
  const [qrLogoEmoji, setQrLogoEmoji] = useState<string>("");
  const [gformMode, setGformMode] = useState<string>("hybrid");
  const [gformEmbedUrl, setGformEmbedUrl] = useState<string>(
    "https://docs.google.com/forms/d/e/1FAIpQLScRqR0gp6qw9Jdjdi95dPSXLzmfdL6nCHCOhsunDE0Czgwlkg/viewform?embedded=true"
  );

  // Password update state
  const [newPassword, setNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Action feedback states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isTogglingComments, setIsTogglingComments] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Check saved session
  useEffect(() => {
    try {
      const savedPass = sessionStorage.getItem("hq_ctrl_token");
      if (savedPass) {
        setPassword(savedPass);
        handleLogin(savedPass);
      }
    } catch (e) {}
  }, []);

  // Realtime subscription for incoming comments while admin dashboard is open
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel("admin-realtime-comments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_comments" },
        () => {
          adminGetAllComments(password).then((res) => {
            if (res.success && res.comments) {
              setComments(res.comments);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, password]);

  const handleLogin = async (passToTry?: string) => {
    const p = passToTry || password;
    if (!p) return;

    setIsAuthenticating(true);
    setAuthError("");

    try {
      const res = await verifyAdminPassword(p);
      if (res.success) {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem("hq_ctrl_token", p);
        } catch (e) {}
        loadDashboardData(p);
      } else {
        setAuthError(
          adminUiLang === "bn"
            ? "ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।"
            : "Access denied. Invalid credentials."
        );
      }
    } catch (err: any) {
      setAuthError("Authentication failed.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    try {
      sessionStorage.removeItem("hq_ctrl_token");
    } catch (e) {}
  };

  const loadDashboardData = async (adminPass: string) => {
    setLoading(true);
    try {
      const [commentsRes, settingsRes] = await Promise.all([
        adminGetAllComments(adminPass),
        adminGetSettings(),
      ]);

      if (commentsRes.success && commentsRes.comments) {
        setComments(commentsRes.comments);
      }
      if (settingsRes.success && settingsRes.settings) {
        const s = settingsRes.settings;
        setEventTitle(s.event_title || "");
        setEventSubtitle(s.event_subtitle || "");
        setQrUrl(s.qr_url || "");
        setAutoApprove(s.auto_approve ?? true);
        setAllowComments(s.allow_comments ?? true);
        setIsPublished(s.is_published ?? true);
        setAnnouncementBanner(s.announcement_banner || "");
        setBannedWordsInput((s.banned_words || []).join(", "));
        setLanguage(s.language || "both");
        setSelectedTheme(s.theme || "military-trucks");
        setCustomBgUrl(s.custom_bg_url || "");
        setQrFgColor(s.qr_fg_color || "#14532d");
        setQrBgColor(s.qr_bg_color || "#ffffff");
        setQrFrameStyle(s.qr_frame_style || "military-badge");
        setQrSize(s.qr_size || "large");
        setQrPosition(s.qr_position || "left");
        setQrLabelEn(s.qr_label_en || "Scan QR to Comment");
        setQrLabelBn(s.qr_label_bn || "মন্তব্য করতে QR কোডটি স্ক্যান করুন");
        setQrLogoEmoji(s.qr_logo_emoji || "");
        setGformMode(s.gform_mode || "hybrid");
        setGformEmbedUrl(
          s.gform_embed_url ||
            "https://docs.google.com/forms/d/e/1FAIpQLScRqR0gp6qw9Jdjdi95dPSXLzmfdL6nCHCOhsunDE0Czgwlkg/viewform?embedded=true"
        );
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Master Switch: Toggle Comment Section ON / OFF immediately
  const handleQuickToggleComments = async () => {
    setIsTogglingComments(true);
    const nextState = !allowComments;
    setAllowComments(nextState);
    try {
      const res = await adminToggleCommentSection(password, nextState);
      if (res.success) {
        showToast(
          nextState
            ? adminUiLang === "bn"
              ? "✅ মন্তব্য সেকশন চালু (ON) করা হয়েছে!"
              : "✅ Comment Section switched ON!"
            : adminUiLang === "bn"
            ? "🔴 মন্তব্য সেকশন বন্ধ (OFF) করা হয়েছে!"
            : "🔴 Comment Section switched OFF!"
        );
      }
    } finally {
      setIsTogglingComments(false);
    }
  };

  // Publish All Settings & Design to Big Screen
  const handlePublishToBigScreen = async (publishState: boolean = true) => {
    setIsPublishing(true);
    const bannedArr = bannedWordsInput
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    try {
      const res = await adminUpdateSettings(password, {
        event_title: eventTitle,
        event_subtitle: eventSubtitle,
        qr_url: qrUrl,
        auto_approve: autoApprove,
        allow_comments: allowComments,
        is_published: publishState,
        announcement_banner: announcementBanner,
        banned_words: bannedArr,
        language,
        theme: selectedTheme,
        custom_bg_url: customBgUrl,
        qr_fg_color: qrFgColor,
        qr_bg_color: qrBgColor,
        qr_frame_style: qrFrameStyle,
        qr_size: qrSize,
        qr_position: qrPosition,
        qr_label_en: qrLabelEn,
        qr_label_bn: qrLabelBn,
        qr_logo_emoji: qrLogoEmoji,
        gform_mode: gformMode,
        gform_embed_url: gformEmbedUrl,
        ...(newPassword.trim() ? { new_admin_password: newPassword.trim() } : {}),
      });

      if (res.success) {
        setIsPublished(publishState);
        setHasUnsavedChanges(false);
        if (newPassword.trim()) {
          setPassword(newPassword.trim());
          try {
            sessionStorage.setItem("hq_ctrl_token", newPassword.trim());
          } catch (e) {}
          setNewPassword("");
        }
        showToast(
          publishState
            ? adminUiLang === "bn"
              ? "🚀 সফলভাবে বড় পর্দায় প্রকাশ (Published) করা হয়েছে!"
              : "🚀 Published live to the Big Screen!"
            : adminUiLang === "bn"
            ? "⏸️ বড় পর্দা স্ট্যান্ডবাই (Standby) মোডে রাখা হয়েছে।"
            : "⏸️ Big Screen set to Standby Mode."
        );
      } else {
        showToast(res.error || "Failed to publish.");
      }
    } catch (err: any) {
      showToast(err.message || "Error publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Custom Background Image Upload (converts to compressed Data URL so no external storage bucket setup required)
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setCustomBgUrl(result);
        setSelectedTheme("custom-image");
        setHasUnsavedChanges(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Comment Moderation Actions
  const handleApprove = async (id: string) => {
    await adminUpdateCommentStatus(password, id, "approved");
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c)));
  };

  const handleReject = async (id: string) => {
    await adminUpdateCommentStatus(password, id, "rejected");
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c)));
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    await adminTogglePinComment(password, id, !currentPinned);
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, is_pinned: !currentPinned, status: "approved" }
          : currentPinned
          ? c
          : { ...c, is_pinned: false }
      )
    );
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        adminUiLang === "bn"
          ? "আপনি কি নিশ্চিতভাবে এই মন্তব্যটি মুছে ফেলতে চান?"
          : "Permanently delete this comment?"
      )
    )
      return;
    await adminDeleteComment(password, id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        adminUiLang === "bn"
          ? "⚠️ সতর্কতা: সকল মন্তব্য স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
          : "⚠️ WARNING: This will delete ALL comments. Are you sure?"
      )
    ) {
      return;
    }
    await adminClearAllComments(password);
    setComments([]);
    showToast(adminUiLang === "bn" ? "সকল মন্তব্য মুছে ফেলা হয়েছে।" : "All comments cleared.");
  };

  // Export Whole Comments in PDF Format (Full Bangla & English Unicode support!)
  const handleExportPDF = () => {
    if (comments.length === 0) {
      alert(adminUiLang === "bn" ? "ডাউনলোড করার মতো কোনো মন্তব্য নেই।" : "No comments to export.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=950,height=800");
    if (!printWindow) {
      alert("Please allow popups to generate the PDF report.");
      return;
    }

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const dateStr = new Date().toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const rowsHtml = comments
      .map(
        (c, idx) => `
        <tr>
          <td style="text-align:center; font-weight:600;">${idx + 1}</td>
          <td>
            <div style="font-weight:700; color:#064e3b;">${escapeHtml(c.author_avatar || "💬")} ${escapeHtml(
          c.author_name
        )}</div>
          </td>
          <td style="font-size:14px; line-height:1.5;">${escapeHtml(c.content)}</td>
          <td style="text-align:center;">
            <span class="badge ${c.status}">${escapeHtml(c.status.toUpperCase())}</span>
            ${c.is_pinned ? '<div style="margin-top:4px;"><span class="badge pinned">★ PINNED</span></div>' : ""}
          </td>
          <td style="text-align:center; font-weight:600;">${c.likes_count || 0}</td>
          <td style="font-size:12px; color:#475569; white-space:nowrap;">
            ${new Date(c.created_at).toLocaleString()}
          </td>
        </tr>
      `
      )
      .join("");

    const htmlDoc = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(eventTitle || "Live Comments")} - PDF Report</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', 'Hind Siliguri', sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 32px;
            background: #ffffff;
          }
          .header {
            border-bottom: 3px solid #14532d;
            padding-bottom: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #14532d;
            margin: 0 0 4px 0;
          }
          .subtitle {
            font-size: 13px;
            color: #475569;
            margin: 0;
          }
          .stats-bar {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 12px 18px;
            border-radius: 10px;
            font-size: 13px;
          }
          .stat-item strong {
            color: #14532d;
            font-size: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #14532d;
            color: #ffffff;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
          }
          .badge.approved { background: #dcfce7; color: #166534; }
          .badge.pending { background: #fef3c7; color: #92400e; }
          .badge.rejected { background: #ffe4e6; color: #9f1239; }
          .badge.pinned { background: #f59e0b; color: #000000; }
          .no-print-bar {
            background: #0f172a;
            color: #fff;
            padding: 12px 20px;
            border-radius: 10px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .btn-print {
            background: #16a34a;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            font-size: 14px;
          }
          @media print {
            .no-print-bar { display: none !important; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span>📄 <strong>Official Comments PDF Report</strong> — Choose "Save as PDF" in the destination dialog.</span>
          <button class="btn-print" onclick="window.print()">🖨️ Save / Download PDF</button>
        </div>
        <div class="header">
          <div>
            <h1 class="title">${escapeHtml(eventTitle || "Live Audience Comments Report")}</h1>
            <p class="subtitle">${escapeHtml(eventSubtitle || "Complete Audience Comments Record")}</p>
          </div>
          <div style="text-align:right; font-size:12px; color:#64748b;">
            <div><strong>Generated:</strong> ${escapeHtml(dateStr)}</div>
            <div><strong>Total Comments:</strong> ${comments.length}</div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-item">Total Received: <strong>${comments.length}</strong></div>
          <div class="stat-item">Approved: <strong>${comments.filter((c) => c.status === "approved").length}</strong></div>
          <div class="stat-item">Pinned Highlights: <strong>${comments.filter((c) => c.is_pinned).length}</strong></div>
          <div class="stat-item">Pending: <strong>${comments.filter((c) => c.status === "pending").length}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:45px; text-align:center;">#</th>
              <th style="width:180px;">Author Name / নাম</th>
              <th>Comment / মন্তব্য</th>
              <th style="width:95px; text-align:center;">Status</th>
              <th style="width:60px; text-align:center;">Likes</th>
              <th style="width:145px;">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
  };

  // Export CSV with UTF-8 BOM so Excel opens Bangla characters properly!
  const handleExportCSV = () => {
    if (comments.length === 0) {
      alert("No comments to export.");
      return;
    }

    const headers = [
      "SL",
      "Author Name",
      "Avatar",
      "Comment Content",
      "Status",
      "Pinned",
      "Likes",
      "Created At",
    ];
    const rows = comments.map((c, idx) => [
      idx + 1,
      `"${c.author_name.replace(/"/g, '""')}"`,
      `"${(c.author_avatar || "").replace(/"/g, '""')}"`,
      `"${c.content.replace(/"/g, '""')}"`,
      c.status,
      c.is_pinned ? "Yes" : "No",
      c.likes_count,
      c.created_at,
    ]);

    const csvString = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `comments-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered comments
  const filteredComments = comments.filter((c) => {
    const matchesSearch =
      c.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return c.status === "pending";
    if (statusFilter === "approved") return c.status === "approved";
    if (statusFilter === "pinned") return c.is_pinned;
    return true;
  });

  const pendingCount = comments.filter((c) => c.status === "pending").length;
  const approvedCount = comments.filter((c) => c.status === "approved").length;
  const pinnedCount = comments.filter((c) => c.is_pinned).length;
  const previewThemeConfig = getThemeConfig(selectedTheme);
  const previewBgImage =
    selectedTheme === "custom-image" && customBgUrl ? customBgUrl : previewThemeConfig.bgImage;

  // LOGIN SCREEN (Secret Route, No Password Hints Visible!)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="glass-panel-glow w-full max-w-md rounded-3xl p-7 sm:p-8 space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setAdminUiLang((prev) => (prev === "en" ? "bn" : "en"))}
              className="px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700"
            >
              {adminUiLang === "en" ? "🇧🇩 বাংলা" : "🇬🇧 English"}
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {adminUiLang === "bn" ? "সুপারঅ্যাডমিন কন্ট্রোল প্যানেল" : "Restricted Command Access"}
            </h1>
            <p className="text-xs text-slate-400">
              {adminUiLang === "bn"
                ? "অনুমোদিত পাসওয়ার্ড দিয়ে প্রবেশ করুন"
                : "Authorized personnel only. Enter your secret key."}
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>{adminUiLang === "bn" ? "অ্যাডমিন পাসওয়ার্ড" : "Secret Passkey"}</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswordInput ? "text" : "password"}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-sm shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{adminUiLang === "bn" ? "প্রবেশ করুন" : "Authenticate"}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-24 sm:pb-12">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-emerald-900 border-2 border-emerald-400 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-bold animate-fade-in-up">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Responsive Header */}
      <nav className="glass-panel border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
                <span>
                  {adminUiLang === "bn" ? "সুপারঅ্যাডমিন কন্ট্রোল" : "Superadmin Control"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isPublished
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {isPublished ? "SCREEN LIVE" : "STANDBY"}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                {eventTitle}
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* UI Language Toggle */}
            <button
              onClick={() => setAdminUiLang((prev) => (prev === "en" ? "bn" : "en"))}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{adminUiLang === "en" ? "বাংলা" : "EN"}</span>
            </button>

            <a
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">
                {adminUiLang === "bn" ? "বড় পর্দা দেখুন" : "Open Big Screen"}
              </span>
            </a>

            <button
              onClick={() => loadDashboardData(password)}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {adminUiLang === "bn" ? "লগআউট" : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Master Quick Control Bar (Comment Switch ON/OFF + Publish for Big Screen) */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* 1-Click Comment Section ON/OFF Switch */}
          <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  allowComments ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <div>
                <div className="text-xs font-bold text-white">
                  {adminUiLang === "bn" ? "মন্তব্য সেকশন (Comment Section)" : "Comment Section"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {allowComments
                    ? adminUiLang === "bn"
                      ? "চালু আছে — দর্শকরা মন্তব্য করতে পারছেন"
                      : "ACTIVE — Audience can submit comments"
                    : adminUiLang === "bn"
                    ? "বন্ধ আছে — নতুন মন্তব্য নেওয়া বন্ধ"
                    : "TURNED OFF — Submissions paused"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickToggleComments}
              disabled={isTogglingComments}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                allowComments
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{allowComments ? "ON (চালু)" : "OFF (বন্ধ)"}</span>
            </button>
          </div>

          {/* Publish for Big Screen Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePublishToBigScreen(!isPublished)}
              disabled={isPublishing}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                isPublished
                  ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}
              title="Toggle Standby / Hold Screen"
            >
              <PauseCircle className="w-4 h-4" />
              <span>
                {isPublished
                  ? adminUiLang === "bn"
                    ? "স্ট্যান্ডবাই রাখুন"
                    : "Hold Screen"
                  : adminUiLang === "bn"
                  ? "স্ট্যান্ডবাই মোডে আছে"
                  : "In Standby"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePublishToBigScreen(true)}
              disabled={isPublishing}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
            >
              {isPublishing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              <span>
                {adminUiLang === "bn"
                  ? "বড় পর্দায় প্রকাশ করুন (Publish)"
                  : "Publish for Big Screen"}
              </span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-panel rounded-2xl p-4">
            <div className="text-[11px] text-slate-400 font-bold uppercase">
              {adminUiLang === "bn" ? "মোট মন্তব্য" : "Total Comments"}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {comments.length}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="text-[11px] text-emerald-400 font-bold uppercase">
              {adminUiLang === "bn" ? "অনুমোদিত (লাইভ)" : "Approved Live"}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {approvedCount}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="text-[11px] text-amber-400 font-bold uppercase">
              {adminUiLang === "bn" ? "অপেক্ষমান (Pending)" : "Pending Review"}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {pendingCount}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="text-[11px] text-purple-400 font-bold uppercase">
              {adminUiLang === "bn" ? "পিন করা মন্তব্য" : "Pinned Spotlight"}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">
              {pinnedCount}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Mobile Compatible) */}
        <div className="flex overflow-x-auto border-b border-slate-800 gap-2 sm:gap-6 no-scrollbar">
          <button
            onClick={() => setActiveTab("moderation")}
            className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "moderation"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{adminUiLang === "bn" ? "মন্তব্য নিয়ন্ত্রণ" : "Comments & PDF"}</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("themes")}
            className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "themes"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{adminUiLang === "bn" ? "থিম ও ব্যাকগ্রাউন্ড ডিজাইন" : "Themes & Designs"}</span>
          </button>

          <button
            onClick={() => setActiveTab("qrcode")}
            className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "qrcode"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{adminUiLang === "bn" ? "QR কোড কাস্টমাইজেশন" : "QR Code Designer"}</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "settings"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{adminUiLang === "bn" ? "ইভেন্ট ও ভাষা সেটিংস" : "Event & Security"}</span>
          </button>
        </div>

        {/* ==================== TAB 1: COMMENT MODERATION & PDF EXPORT ==================== */}
        {activeTab === "moderation" && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    adminUiLang === "bn"
                      ? "নাম বা মন্তব্য দিয়ে খুঁজুন..."
                      : "Search comments or author name..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                {(["all", "pending", "approved", "pinned"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${
                      statusFilter === st
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st === "all"
                      ? `${adminUiLang === "bn" ? "সব" : "All"} (${comments.length})`
                      : st === "pending"
                      ? `${adminUiLang === "bn" ? "অপেক্ষমান" : "Pending"} (${pendingCount})`
                      : st === "approved"
                      ? `${adminUiLang === "bn" ? "অনুমোদিত" : "Approved"} (${approvedCount})`
                      : `${adminUiLang === "bn" ? "পিন করা" : "Pinned"} (${pinnedCount})`}
                  </button>
                ))}
              </div>

              {/* Export PDF, Export CSV, Clear All */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>{adminUiLang === "bn" ? "PDF ডাউনলোড" : "Export PDF"}</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={handleClearAll}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{adminUiLang === "bn" ? "সব মুছুন" : "Clear All"}</span>
                </button>
              </div>
            </div>

            {/* Comments List */}
            {filteredComments.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 text-sm">
                {adminUiLang === "bn"
                  ? "কোনো মন্তব্য পাওয়া যায়নি।"
                  : "No comments matching current filter."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`glass-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      comment.is_pinned
                        ? "border-amber-400/60 bg-amber-500/5"
                        : comment.status === "pending"
                        ? "border-amber-500/40"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl">{comment.author_avatar || "💬"}</span>
                        <span className="font-bold text-white text-base">
                          {comment.author_name}
                        </span>

                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            comment.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : comment.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {comment.status}
                        </span>

                        {comment.is_pinned && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black flex items-center gap-1">
                            <Pin className="w-3 h-3 fill-current" />
                            PINNED
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          {new Date(comment.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <span className="text-xs text-rose-300">❤️ {comment.likes_count}</span>
                      </div>

                      <p className="text-slate-100 text-sm sm:text-base leading-relaxed break-words">
                        {comment.content}
                      </p>
                    </div>

                    {/* Action Buttons (Mobile & Desktop Friendly) */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
                      {comment.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(comment.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{adminUiLang === "bn" ? "অনুমোদন" : "Approve"}</span>
                        </button>
                      )}

                      {comment.status !== "rejected" && (
                        <button
                          onClick={() => handleReject(comment.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{adminUiLang === "bn" ? "বাতিল" : "Hide"}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleTogglePin(comment.id, comment.is_pinned)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 ${
                          comment.is_pinned
                            ? "bg-amber-400 text-black border-amber-300"
                            : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {comment.is_pinned
                            ? adminUiLang === "bn"
                              ? "আনপিন"
                              : "Unpin"
                            : adminUiLang === "bn"
                            ? "পিন করুন"
                            : "Pin"}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: THEMES & DESIGNS (WITH PICTURE BACKGROUNDS) ==================== */}
        {activeTab === "themes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Theme Gallery Selector */}
            <div className="lg:col-span-7 glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {adminUiLang === "bn"
                    ? "বড় পর্দার থিম ও ব্যাকগ্রাউন্ড ডিজাইন নির্বাচন করুন"
                    : "Choose Big Screen Theme & Background Artwork"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {adminUiLang === "bn"
                    ? "ডিজাইন পছন্দ করার পর উপরে 'বড় পর্দায় প্রকাশ করুন (Publish)' বাটনে ক্লিক করুন।"
                    : "Select a visual theme below, preview it on the right, and click 'Publish for Big Screen'."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(THEMES).map((t) => {
                  const isSelected = selectedTheme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTheme(t.id);
                        if (t.id === "military-trucks" || t.id === "military-soldiers") {
                          setQrFgColor("#14532d");
                          setQrFrameStyle("military-badge");
                        } else if (t.id === "royal-navy") {
                          setQrFgColor("#1e1b4b");
                          setQrFrameStyle("royal-gold");
                        } else if (t.id === "stage-dark") {
                          setQrFgColor("#1e1b4b");
                          setQrFrameStyle("neon-pulse");
                        }
                        setHasUnsavedChanges(true);
                      }}
                      className={`cursor-pointer rounded-2xl p-3 border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-950/30 shadow-lg shadow-emerald-500/10"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      {/* Thumbnail Preview */}
                      <div className="h-28 w-full rounded-xl overflow-hidden mb-3 relative border border-white/10">
                        {t.previewThumb ? (
                          <img
                            src={t.previewThumb}
                            alt={t.nameEn}
                            className="w-full h-full object-cover"
                          />
                        ) : t.id === "custom-image" && customBgUrl ? (
                          <img
                            src={customBgUrl}
                            alt="Custom"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center ${t.pageBgClass}`}
                          >
                            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-black/30 text-white backdrop-blur-sm">
                              {t.nameEn}
                            </span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                            SELECTED
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-white">
                          {adminUiLang === "bn" ? t.nameBn : t.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {adminUiLang === "bn" ? t.nameEn : t.nameBn}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Background Image Upload / URL Input */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>
                    {adminUiLang === "bn"
                      ? "অথবা আপনার নিজের ব্যাকগ্রাউন্ড ছবি আপলোড করুন"
                      : "Or Upload Custom Background Image / Paste URL"}
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomBgUpload}
                    className="text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customBgUrl.startsWith("data:") ? "" : customBgUrl}
                    onChange={(e) => {
                      setCustomBgUrl(e.target.value);
                      setSelectedTheme("custom-image");
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Or paste image URL (https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Mini Stage Preview */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {adminUiLang === "bn" ? "বড় পর্দার লাইভ প্রিভিউ" : "Live Big Screen Preview"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {adminUiLang === "bn"
                    ? previewThemeConfig.nameBn
                    : previewThemeConfig.nameEn}
                </span>
              </div>

              {/* Scaled Preview Box */}
              <div
                className={`w-full rounded-2xl overflow-hidden border-2 border-slate-700 relative p-4 min-h-[340px] flex flex-col justify-between ${previewThemeConfig.pageBgClass}`}
                style={
                  previewBgImage
                    ? {
                        backgroundImage: `url('${previewBgImage}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                {/* Mini Header */}
                <div
                  className={`rounded-xl p-3 text-center mb-3 ${previewThemeConfig.headerCardClass}`}
                >
                  <div
                    className={`text-sm font-black truncate ${previewThemeConfig.titleTextClass}`}
                  >
                    {eventTitle || "Live Audience Comments"}
                  </div>
                  <div
                    className={`text-[10px] truncate ${previewThemeConfig.subtitleTextClass}`}
                  >
                    {eventSubtitle}
                  </div>
                </div>

                {/* Mini Grid */}
                <div className="grid grid-cols-12 gap-3 items-center my-auto pb-6">
                  <div
                    className={`col-span-5 ${
                      qrPosition === "right" ? "order-2" : "order-1"
                    }`}
                  >
                    <QRCodeCard
                      customUrl={qrUrl}
                      fgColor={qrFgColor}
                      bgColor={qrBgColor}
                      frameStyle={qrFrameStyle}
                      size="normal"
                      labelEn={qrLabelEn}
                      labelBn={qrLabelBn}
                      logoEmoji={qrLogoEmoji}
                      language={language}
                      isLightTheme={previewThemeConfig.isLight}
                      isPreview={true}
                    />
                  </div>
                  <div
                    className={`col-span-7 space-y-2 ${
                      qrPosition === "right" ? "order-1" : "order-2"
                    }`}
                  >
                    <div className={`rounded-xl p-3 ${previewThemeConfig.pinnedCardClass}`}>
                      <div
                        className={`text-xs font-extrabold ${previewThemeConfig.authorNameClass}`}
                      >
                        🎙️ Host
                      </div>
                      <div className={`text-[11px] mt-0.5 ${previewThemeConfig.commentTextClass}`}>
                        Welcome! Scan the QR code to share your live comment.
                      </div>
                    </div>
                    <div className={`rounded-xl p-3 ${previewThemeConfig.commentCardClass}`}>
                      <div
                        className={`text-xs font-extrabold ${previewThemeConfig.authorNameClass}`}
                      >
                        🎖️ Audience Member
                      </div>
                      <div className={`text-[11px] mt-0.5 ${previewThemeConfig.commentTextClass}`}>
                        চমৎকার আয়োজন! অভিনন্দন ও শুভকামনা।
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePublishToBigScreen(true)}
                disabled={isPublishing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>
                  {adminUiLang === "bn"
                    ? "এই ডিজাইনটি বড় পর্দায় প্রকাশ করুন"
                    : "Publish Design to Big Screen"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: QR CODE CUSTOMIZATION STUDIO ==================== */}
        {activeTab === "qrcode" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {adminUiLang === "bn"
                    ? "QR কোড ডিজাইন ও কাস্টমাইজেশন"
                    : "QR Code Design & Customization"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {adminUiLang === "bn"
                    ? "QR কোডের ফ্রেম, রঙ, আকার, অবস্থান এবং বাংলা/ইংরেজি লেখা পরিবর্তন করুন।"
                    : "Customize the QR frame style, colors, center badge, size, and bilingual captions."}
                </p>
              </div>

              {/* 1. QR Frame Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  {adminUiLang === "bn" ? "১. QR কার্ড ফ্রেম ডিজাইন" : "1. QR Card Frame Design"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {QR_FRAME_STYLES.map((st) => (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => {
                        setQrFrameStyle(st.id);
                        setHasUnsavedChanges(true);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        qrFrameStyle === st.id
                          ? "border-emerald-400 bg-emerald-950/40 text-white"
                          : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">
                        {adminUiLang === "bn" ? st.nameBn : st.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. QR Foreground & Background Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    {adminUiLang === "bn" ? "২. QR কোডের রঙ (Foreground)" : "2. QR Code Color"}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {QR_COLOR_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.color}
                        onClick={() => {
                          setQrFgColor(p.color);
                          setHasUnsavedChanges(true);
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          qrFgColor === p.color ? "scale-110 border-white ring-2 ring-emerald-400" : "border-slate-700"
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={qrFgColor}
                      onChange={(e) => {
                        setQrFgColor(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                      title="Custom Color"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    {adminUiLang === "bn" ? "৩. QR ব্যাকগ্রাউন্ড রঙ" : "3. QR Background Color"}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {QR_BG_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.color}
                        onClick={() => {
                          setQrBgColor(p.color);
                          setHasUnsavedChanges(true);
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          qrBgColor === p.color ? "scale-110 border-emerald-500 ring-2 ring-emerald-400" : "border-slate-700"
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => {
                        setQrBgColor(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                      title="Custom Background"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Size & Screen Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {adminUiLang === "bn" ? "৪. বড় পর্দায় QR কোডের আকার" : "4. QR Size on Big Screen"}
                  </label>
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {(["normal", "large", "xlarge"] as const).map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => {
                          setQrSize(sz);
                          setHasUnsavedChanges(true);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${
                          qrSize === sz ? "bg-emerald-600 text-white" : "text-slate-400"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {adminUiLang === "bn" ? "৫. পর্দায় QR কোডের অবস্থান" : "5. QR Position on Screen"}
                  </label>
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {(["left", "right"] as const).map((pos) => (
                      <button
                        type="button"
                        key={pos}
                        onClick={() => {
                          setQrPosition(pos);
                          setHasUnsavedChanges(true);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${
                          qrPosition === pos ? "bg-emerald-600 text-white" : "text-slate-400"
                        }`}
                      >
                        {pos === "left"
                          ? adminUiLang === "bn"
                            ? "বাম পাশে (Left)"
                            : "Left Side"
                          : adminUiLang === "bn"
                          ? "ডান পাশে (Right)"
                          : "Right Side"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Center Logo Emoji */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {adminUiLang === "bn"
                    ? "৬. QR কোডের মাঝখানে ব্যাজ / আইকন"
                    : "6. Center Badge / Emblem Inside QR Code"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {QR_LOGO_PRESETS.map((em) => (
                    <button
                      type="button"
                      key={em || "none"}
                      onClick={() => {
                        setQrLogoEmoji(em);
                        setHasUnsavedChanges(true);
                      }}
                      className={`px-3 py-2 rounded-xl text-sm font-bold border ${
                        qrLogoEmoji === em
                          ? "bg-emerald-600 text-white border-emerald-400"
                          : "bg-slate-900 text-slate-300 border-slate-800"
                      }`}
                    >
                      {em || (adminUiLang === "bn" ? "কোনোটি নয়" : "None")}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. QR Call-to-action Titles (Bangla & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {adminUiLang === "bn" ? "বাংলা শিরোনাম (QR Card)" : "QR Caption (Bangla)"}
                  </label>
                  <input
                    type="text"
                    value={qrLabelBn}
                    onChange={(e) => {
                      setQrLabelBn(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {adminUiLang === "bn" ? "ইংরেজি শিরোনাম (QR Card)" : "QR Caption (English)"}
                  </label>
                  <input
                    type="text"
                    value={qrLabelEn}
                    onChange={(e) => {
                      setQrLabelEn(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Live QR Card Preview */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-between space-y-5">
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {adminUiLang === "bn" ? "QR কার্ড প্রিভিউ" : "Live QR Card Preview"}
                </span>
              </div>

              <div className="w-full max-w-xs my-auto">
                <QRCodeCard
                  customUrl={qrUrl}
                  fgColor={qrFgColor}
                  bgColor={qrBgColor}
                  frameStyle={qrFrameStyle}
                  size="normal"
                  labelEn={qrLabelEn}
                  labelBn={qrLabelBn}
                  logoEmoji={qrLogoEmoji}
                  language={language}
                  isLightTheme={previewThemeConfig.isLight}
                />
              </div>

              <button
                type="button"
                onClick={() => handlePublishToBigScreen(true)}
                disabled={isPublishing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>
                  {adminUiLang === "bn"
                    ? "QR ডিজাইন বড় পর্দায় প্রকাশ করুন"
                    : "Publish QR Design to Big Screen"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: EVENT, LANGUAGE & SECURITY SETTINGS ==================== */}
        {activeTab === "settings" && (
          <div className="glass-panel rounded-3xl p-5 sm:p-8 max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {adminUiLang === "bn"
                  ? "ইভেন্টের নাম, ভাষা এবং নিরাপত্তা সেটিংস"
                  : "Event Titles, Language & Security Configuration"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {adminUiLang === "bn"
                  ? "সেটিংস পরিবর্তন শেষে 'বড় পর্দায় প্রকাশ করুন' বাটনে ক্লিক করুন।"
                  : "Configure event text, language mode, moderation rules, and secret password."}
              </p>
            </div>

            <div className="space-y-5">
              {/* System Language Mode (Bangla, English, Both) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Languages className="w-4 h-4" />
                  <span>
                    {adminUiLang === "bn"
                      ? "বড় পর্দা ও দর্শকদের ভাষা (Display Language)"
                      : "Big Screen & Audience Default Language"}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "bn", label: "🇧🇩 শুধু বাংলা (Bangla)" },
                    { id: "en", label: "🇬🇧 English Only" },
                    { id: "both", label: "🇧🇩+🇬🇧 উভয় (Bilingual)" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => {
                        setLanguage(opt.id as AppLanguage);
                        setHasUnsavedChanges(true);
                      }}
                      className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                        language === opt.id
                          ? "bg-emerald-600 text-white border-emerald-400 shadow-lg"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {adminUiLang === "bn"
                    ? "অনুষ্ঠানের শিরোনাম (Event Title - বাংলা বা ইংরেজি)"
                    : "Live Event Title (Bangla or English)"}
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => {
                    setEventTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="যেমন: দরবার ও মতবিনিময় সভা ২০২৬ / Annual Interactive Session"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Event Subtitle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {adminUiLang === "bn"
                    ? "সাবটাইটেল / নির্দেশনা (Subtitle)"
                    : "Event Subtitle / Instructions"}
                </label>
                <input
                  type="text"
                  value={eventSubtitle}
                  onChange={(e) => {
                    setEventSubtitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="আপনার মোবাইল দিয়ে QR কোডটি স্ক্যান করে মতামত দিন"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Broadcast Announcement Banner */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {adminUiLang === "bn"
                      ? "জরুরি ঘোষণা ব্যানার (বড় পর্দার উপরে দেখাবে)"
                      : "Live Broadcast Announcement Banner"}
                  </span>
                </label>
                <input
                  type="text"
                  value={announcementBanner}
                  onChange={(e) => {
                    setAnnouncementBanner(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder={
                    adminUiLang === "bn"
                      ? "যেমন: প্রশ্নোত্তর পর্ব আর ৫ মিনিট চলবে..."
                      : "e.g. Q&A session closing in 5 minutes!"
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {adminUiLang === "bn" ? "অটো-অ্যাপ্রুভ মন্তব্য" : "Auto-Approve Comments"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {adminUiLang === "bn"
                        ? "চালু থাকলে মন্তব্য সাথে সাথে পর্দায় দেখাবে। বন্ধ থাকলে আপনার অনুমোদনের পর দেখাবে।"
                        : "Show comments immediately vs require manual approval first."}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => {
                      setAutoApprove(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {adminUiLang === "bn" ? "মন্তব্য গ্রহণ চালু" : "Accept New Comments"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {adminUiLang === "bn"
                        ? "বন্ধ করলে কেউ নতুন মন্তব্য পাঠাতে পারবে না।"
                        : "Turn ON or OFF audience comment submissions."}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => {
                      setAllowComments(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* Google Form Mobile UI Mode */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
                <label className="text-xs font-bold text-emerald-400 block">
                  {adminUiLang === "bn"
                    ? "মোবাইল গুগল ফর্ম মোড (Google Form Mobile UI Mode)"
                    : "Google Form Mobile UI Mode"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: "hybrid",
                      label:
                        adminUiLang === "bn"
                          ? "✨ প্রিমিয়াম + গুগল ফর্ম (উভয় ট্যাব)"
                          : "✨ Smart Form + Google Form Tabs",
                    },
                    {
                      id: "iframe-only",
                      label:
                        adminUiLang === "bn"
                          ? "📋 শুধু গুগল ফর্ম (Direct Embed)"
                          : "📋 Embedded Google Form Only",
                    },
                    {
                      id: "premium-only",
                      label:
                        adminUiLang === "bn"
                          ? "🎖️ শুধু প্রিমিয়াম সিঙ্ক ফর্ম"
                          : "🎖️ Premium Synced UI Only",
                    },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        setGformMode(m.id);
                        setHasUnsavedChanges(true);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        gformMode === m.id
                          ? "bg-emerald-600 text-white border-emerald-400 shadow"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    {adminUiLang === "bn"
                      ? "গুগল ফর্ম এমবেড লিংক (Google Form Embed URL)"
                      : "Google Form Embed URL"}
                  </label>
                  <input
                    type="url"
                    value={gformEmbedUrl}
                    onChange={(e) => {
                      setGformEmbedUrl(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Custom QR URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {adminUiLang === "bn"
                    ? "কাস্টম QR লিংক (ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে বর্তমান ওয়েবসাইটের লিংক নেবে)"
                    : "Custom QR Target URL (Leave blank to auto-detect)"}
                </label>
                <input
                  type="url"
                  value={qrUrl}
                  onChange={(e) => {
                    setQrUrl(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="https://comment-section-app-pied.vercel.app/audience"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Banned Words Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {adminUiLang === "bn"
                    ? "নিষিদ্ধ শব্দ ফিল্টার (কমা দিয়ে লিখুন)"
                    : "Filtered / Banned Words (Comma-separated)"}
                </label>
                <input
                  type="text"
                  value={bannedWordsInput}
                  onChange={(e) => {
                    setBannedWordsInput(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="spam, badword"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Change Secret Admin Password (Hidden by default) */}
              <div className="space-y-1.5 pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300">
                  {adminUiLang === "bn"
                    ? "সুপারঅ্যাডমিন গোপন পাসওয়ার্ড পরিবর্তন করুন"
                    : "Change Secret Superadmin Password"}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder={
                      adminUiLang === "bn"
                        ? "পাসওয়ার্ড অপরিবর্তিত রাখতে ফাঁকা রাখুন"
                        : "Leave blank to keep current secret password"
                    }
                    autoComplete="new-password"
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Save & Publish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handlePublishToBigScreen(true)}
                  disabled={isPublishing}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  <span>
                    {adminUiLang === "bn"
                      ? "সেভ করুন ও বড় পর্দায় প্রকাশ করুন"
                      : "Save & Publish for Big Screen"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
