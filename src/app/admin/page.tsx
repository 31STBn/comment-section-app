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
} from "@/app/actions/admin-actions";
import { LiveComment, LiveSystemSettings } from "@/types/database";
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
  AlertTriangle,
  Megaphone,
  Eye,
  LogOut,
  Search,
  Filter,
  Check,
  Sparkles,
} from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Data states
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [settings, setSettings] = useState<LiveSystemSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"moderation" | "settings">("moderation");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "pinned">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Settings form states
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventSubtitle, setEventSubtitle] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [autoApprove, setAutoApprove] = useState<boolean>(true);
  const [allowComments, setAllowComments] = useState<boolean>(true);
  const [announcementBanner, setAnnouncementBanner] = useState<string>("");
  const [bannedWordsInput, setBannedWordsInput] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsNotice, setSettingsNotice] = useState<string>("");

  // Check saved session
  useEffect(() => {
    try {
      const savedPass = sessionStorage.getItem("admin_password");
      if (savedPass) {
        setPassword(savedPass);
        handleLogin(savedPass);
      }
    } catch (e) {}
  }, []);

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
          sessionStorage.setItem("admin_password", p);
        } catch (e) {}
        loadDashboardData(p);
      } else {
        setAuthError(res.error || "Invalid password");
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    try {
      sessionStorage.removeItem("admin_password");
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
        setSettings(settingsRes.settings);
        setEventTitle(settingsRes.settings.event_title);
        setEventSubtitle(settingsRes.settings.event_subtitle);
        setQrUrl(settingsRes.settings.qr_url || "");
        setAutoApprove(settingsRes.settings.auto_approve);
        setAllowComments(settingsRes.settings.allow_comments);
        setAnnouncementBanner(settingsRes.settings.announcement_banner || "");
        setBannedWordsInput((settingsRes.settings.banned_words || []).join(", "));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Actions on comments
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
    if (!confirm("Are you sure you want to permanently delete this comment?")) return;
    await adminDeleteComment(password, id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "⚠️ DANGER: This will delete ALL comments submitted for this event. Are you sure?"
      )
    ) {
      return;
    }
    await adminClearAllComments(password);
    setComments([]);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsNotice("");

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
        announcement_banner: announcementBanner,
        banned_words: bannedArr,
        ...(newPassword.trim() ? { admin_password: newPassword.trim() } : {}),
      });

      if (res.success) {
        setSettingsNotice("Settings saved successfully!");
        if (newPassword.trim()) {
          setPassword(newPassword.trim());
          try {
            sessionStorage.setItem("admin_password", newPassword.trim());
          } catch (e) {}
          setNewPassword("");
        }
        setTimeout(() => setSettingsNotice(""), 3500);
      } else {
        setSettingsNotice(res.error || "Failed to update settings.");
      }
    } catch (err: any) {
      setSettingsNotice(err.message || "Failed to update settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (comments.length === 0) {
      alert("No comments to export.");
      return;
    }

    const headers = ["ID", "Author Name", "Avatar", "Comment Content", "Status", "Is Pinned", "Likes", "Created At"];
    const rows = comments.map((c) => [
      c.id,
      `"${c.author_name.replace(/"/g, '""')}"`,
      `"${(c.author_avatar || "").replace(/"/g, '""')}"`,
      `"${c.content.replace(/"/g, '""')}"`,
      c.status,
      c.is_pinned ? "Yes" : "No",
      c.likes_count,
      c.created_at,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `live-comments-export-${new Date().toISOString().slice(0, 10)}.csv`);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="glass-panel-glow w-full max-w-md rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Superadmin Portal</h1>
            <p className="text-xs text-slate-400">
              Enter the admin password to access live comment controls and screen settings.
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
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                Admin Password
              </label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: admin123"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Unlock Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Return to Stage Display
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Navbar */}
      <nav className="glass-panel border-b border-slate-800 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <span>Superadmin Control Center</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {settings?.event_title || "Live Comment System"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Stage</span>
          </a>

          <button
            onClick={() => loadDashboardData(password)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            title="Refresh comments and settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Total Received
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {comments.length}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              Approved Live
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              {approvedCount}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Pending Review
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
              {pendingCount}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
              Spotlight Pinned
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">
              {pinnedCount}
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab("moderation")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "moderation"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Comment Moderation</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-black font-extrabold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Screen & System Settings</span>
          </button>
        </div>

        {/* Tab 1: Moderation */}
        {activeTab === "moderation" && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search comments or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "all" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({comments.length})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "pending"
                      ? "bg-amber-500 text-black font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "approved"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Approved ({approvedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("pinned")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "pinned"
                      ? "bg-amber-400 text-black font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pinned ({pinnedCount})
                </button>
              </div>

              {/* CSV Export & Clear All */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Download all comments as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleClearAll}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                  title="Clear all comments"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Comments Moderation Table / List */}
            {filteredComments.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center text-slate-400">
                No comments matching current filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`glass-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      comment.is_pinned
                        ? "border-amber-400/50 bg-amber-500/5"
                        : comment.status === "pending"
                        ? "border-amber-500/30"
                        : "border-slate-800"
                    }`}
                  >
                    {/* Left: Author + Comment */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xl">{comment.author_avatar || "💬"}</span>
                        <span className="font-bold text-white text-base">
                          {comment.author_name}
                        </span>

                        {/* Status Badge */}
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
                            Spotlight Pinned
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          {new Date(comment.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <span className="text-xs text-rose-300">
                          ❤️ {comment.likes_count}
                        </span>
                      </div>

                      <p className="text-slate-200 text-sm sm:text-base leading-relaxed break-words">
                        {comment.content}
                      </p>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Approve */}
                      {comment.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(comment.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Approve comment for big screen"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {/* Reject */}
                      {comment.status !== "rejected" && (
                        <button
                          onClick={() => handleReject(comment.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Reject comment from big screen"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      {/* Pin / Spotlight */}
                      <button
                        onClick={() => handleTogglePin(comment.id, comment.is_pinned)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-colors ${
                          comment.is_pinned
                            ? "bg-amber-400 text-black border-amber-300"
                            : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
                        }`}
                        title={comment.is_pinned ? "Unpin comment" : "Pin and spotlight comment on stage"}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                        <span>{comment.is_pinned ? "Unpin" : "Pin Spotlight"}</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                        title="Delete permanently"
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

        {/* Tab 2: Settings */}
        {activeTab === "settings" && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Live Screen & System Configuration</h2>
              <p className="text-xs text-slate-400 mt-1">
                Customize titles, moderation rules, broadcast banners, and security settings.
              </p>
            </div>

            {settingsNotice && (
              <div className="p-3.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{settingsNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Live Event Title
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Annual Tech Conference 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Event Subtitle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Event Subtitle / Instructions
                </label>
                <input
                  type="text"
                  value={eventSubtitle}
                  onChange={(e) => setEventSubtitle(e.target.value)}
                  placeholder="e.g. Scan the QR code to post questions or reactions live!"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Custom QR Code Target URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Custom QR Code Target URL (Leave blank to auto-detect current domain)
                </label>
                <input
                  type="url"
                  value={qrUrl}
                  onChange={(e) => setQrUrl(e.target.value)}
                  placeholder="https://your-domain.vercel.app/audience"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Auto Approve */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Auto-Approve Comments</div>
                    <div className="text-xs text-slate-400">
                      When enabled, audience comments appear instantly. When disabled, admin must approve first.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                {/* Allow Submissions */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Accept New Comments</div>
                    <div className="text-xs text-slate-400">
                      Toggle to lock or unlock audience submissions during breaks or talk transitions.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Broadcast Announcement Banner */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                  Live Announcement Banner (Shows across top of stage screen)
                </label>
                <input
                  type="text"
                  value={announcementBanner}
                  onChange={(e) => setAnnouncementBanner(e.target.value)}
                  placeholder="e.g. Q&A session ending in 5 minutes! Submit your top questions now."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Banned Words Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Banned / Profanity Filter (Comma-separated words that will be censored with ***)
                </label>
                <input
                  type="text"
                  value={bannedWordsInput}
                  onChange={(e) => setBannedWordsInput(e.target.value)}
                  placeholder="spam, insult, curseword"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Change Password */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300">
                  Change Superadmin Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={savingSettings}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2"
              >
                {savingSettings ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
