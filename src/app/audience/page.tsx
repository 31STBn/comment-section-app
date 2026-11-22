"use client";

import React, { useState, useEffect } from "react";
import { submitAudienceComment } from "@/app/actions/audience-actions";
import { supabase } from "@/lib/supabase/client";
import { LiveComment, LiveSystemSettings } from "@/types/database";
import { getThemeConfig } from "@/lib/themes";
import { translations, QUICK_REACTIONS_BN, QUICK_REACTIONS_EN } from "@/lib/i18n";
import LiveCommentCard from "@/components/LiveCommentCard";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  User,
  RefreshCw,
  Lock,
  Languages,
} from "lucide-react";
import confetti from "canvas-confetti";

const EMOJI_OPTIONS = ["💬", "🎖️", "🇧🇩", "⭐", "🔥", "🚀", "💡", "❤️", "👏", "🎉", "🙌", "💯"];

export default function AudiencePage() {
  const [activeTab, setActiveTab] = useState<"form" | "feed">("form");
  const [userLang, setUserLang] = useState<"bn" | "en">("bn");
  const [authorName, setAuthorName] = useState<string>("");
  const [authorAvatar, setAuthorAvatar] = useState<string>("💬");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [settings, setSettings] = useState<LiveSystemSettings | null>(null);
  const [recentComments, setRecentComments] = useState<LiveComment[]>([]);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("audience_name");
      const savedAvatar = localStorage.getItem("audience_avatar");
      const savedLang = localStorage.getItem("audience_lang") as "bn" | "en" | null;
      if (savedName) setAuthorName(savedName);
      if (savedAvatar) setAuthorAvatar(savedAvatar);
      if (savedLang === "bn" || savedLang === "en") setUserLang(savedLang);
    } catch (e) {}

    async function init() {
      const { data: s } = await supabase
        .from("live_system_settings")
        .select("*")
        .eq("id", "current")
        .single();
      if (s) {
        const sys = s as LiveSystemSettings;
        setSettings(sys);
        try {
          if (!localStorage.getItem("audience_lang")) {
            setUserLang(sys.language === "en" ? "en" : "bn");
          }
        } catch (e) {
          setUserLang(sys.language === "en" ? "en" : "bn");
        }
      }
    }
    init();

    // Realtime subscription for settings changes (e.g., comment section turned ON/OFF)
    const settingsSub = supabase
      .channel("audience-settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_system_settings" },
        (payload) => {
          setSettings((prev) => ({ ...(prev || {}), ...(payload.new as LiveSystemSettings) }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSub);
    };
  }, []);

  const toggleLanguage = (lang: "bn" | "en") => {
    setUserLang(lang);
    try {
      localStorage.setItem("audience_lang", lang);
    } catch (e) {}
  };

  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const { data } = await supabase
        .from("live_comments")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) setRecentComments(data as LiveComment[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (activeTab === "feed") {
      fetchFeed();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      try {
        localStorage.setItem("audience_name", authorName.trim());
        localStorage.setItem("audience_avatar", authorAvatar);
      } catch (err) {}

      const res = await submitAudienceComment({
        author_name: authorName.trim(),
        author_avatar: authorAvatar,
        content: content.trim(),
      });

      if (res.success) {
        setContent("");
        setFeedback({
          type: "success",
          text: userLang === "bn" ? res.messageBn : res.message,
        });

        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });

        setTimeout(() => {
          setFeedback(null);
        }, 6000);
      } else {
        setFeedback({
          type: "error",
          text: userLang === "bn" ? res.messageBn : res.message,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text:
          userLang === "bn"
            ? "মন্তব্য পাঠানো যায়নি। আবার চেষ্টা করুন।"
            : "Failed to submit comment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = translations[userLang];
  const quickList = userLang === "bn" ? QUICK_REACTIONS_BN : QUICK_REACTIONS_EN;
  const themeConfig = getThemeConfig(settings?.theme);
  const bgImageUrl =
    settings?.theme === "custom-image" && settings?.custom_bg_url
      ? settings.custom_bg_url
      : themeConfig.bgImage;

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden flex flex-col items-center p-4 sm:p-6 ${themeConfig.pageBgClass}`}
    >
      {/* Background Image if Theme has Artwork */}
      {bgImageUrl && (
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-90"
          style={{
            backgroundImage: `url('${bgImageUrl}')`,
          }}
        />
      )}

      <div className="relative z-10 w-full max-w-md flex flex-col items-center pb-16">
        {/* Top Bar: Language Toggle */}
        <div className="w-full flex items-center justify-end mb-2">
          <div className="inline-flex items-center bg-white/90 backdrop-blur-md p-1 rounded-full border border-emerald-900/20 shadow-sm">
            <Languages className="w-3.5 h-3.5 text-emerald-800 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => toggleLanguage("bn")}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                userLang === "bn"
                  ? "bg-emerald-800 text-white shadow"
                  : "text-slate-700 hover:text-emerald-900"
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => toggleLanguage("en")}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                userLang === "en"
                  ? "bg-emerald-800 text-white shadow"
                  : "text-slate-700 hover:text-emerald-900"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Event Title Card */}
        <div
          className={`w-full rounded-3xl p-5 text-center mb-4 space-y-1 ${themeConfig.headerCardClass}`}
        >
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${themeConfig.titleTextClass}`}>
            {settings?.event_title || (userLang === "bn" ? "লাইভ মন্তব্য" : "Live Comments")}
          </h1>
          <p className={`text-xs sm:text-sm ${themeConfig.subtitleTextClass}`}>
            {settings?.event_subtitle || t.scanInstruction}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full flex bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-900/20 shadow-md mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "form"
                ? "bg-emerald-800 text-white shadow-md"
                : "text-slate-600 hover:text-emerald-950"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{t.postCommentTab}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("feed")}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "feed"
                ? "bg-emerald-800 text-white shadow-md"
                : "text-slate-600 hover:text-emerald-950"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t.liveStreamTab}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="w-full">
          {activeTab === "form" ? (
            settings && !settings.allow_comments ? (
              /* Closed State when Admin switches OFF Comment Section */
              <div
                className={`rounded-3xl p-8 text-center space-y-3 ${themeConfig.headerCardClass}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className={`text-lg font-extrabold ${themeConfig.titleTextClass}`}>
                  {t.closedTitle}
                </h3>
                <p className={`text-xs sm:text-sm ${themeConfig.subtitleTextClass}`}>
                  {t.closedSubtitle}
                </p>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-emerald-900/20 text-slate-900 space-y-4">
                {/* Success or Error Feedback */}
                {feedback && (
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 animate-fade-in-up ${
                      feedback.type === "success"
                        ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-900"
                        : "bg-rose-50 border-2 border-rose-500 text-rose-900"
                    }`}
                  >
                    {feedback.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                    )}
                    <div className="font-bold">{feedback.text}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-700" />
                      <span>{t.yourName}</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-700 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium outline-none transition-all"
                    />
                  </div>

                  {/* Avatar Emoji Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-emerald-950">
                      {t.pickAvatar}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => setAuthorAvatar(emoji)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                            authorAvatar === emoji
                              ? "bg-emerald-800 text-white scale-110 shadow-md ring-2 ring-amber-400"
                              : "bg-slate-100 hover:bg-slate-200 border border-slate-200"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-950">
                      <span>{t.yourComment}</span>
                      <span
                        className={`text-xs ${
                          content.length > 400 ? "text-amber-600" : "text-slate-400"
                        }`}
                      >
                        {content.length}/500
                      </span>
                    </div>
                    <textarea
                      required
                      rows={4}
                      maxLength={500}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-700 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium outline-none transition-all resize-none leading-relaxed"
                    />
                  </div>

                  {/* Quick Reaction suggestions */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-semibold">
                      {t.quickReactions}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickList.map((quick) => (
                        <button
                          type="button"
                          key={quick}
                          onClick={() =>
                            setContent((prev) => (prev ? `${prev} ${quick}` : quick))
                          }
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold border border-emerald-200 transition-colors"
                        >
                          {quick}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 hover:from-emerald-900 hover:to-green-900 text-white font-extrabold text-base shadow-xl shadow-emerald-900/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{t.sending}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>{t.sendButton}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )
          ) : (
            /* Live Feed View */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${themeConfig.titleTextClass}`}
                >
                  {t.liveStreamTab}
                </span>
                <button
                  onClick={fetchFeed}
                  disabled={loadingFeed}
                  className="px-3 py-1.5 rounded-xl bg-white/90 text-emerald-900 border border-emerald-900/20 shadow-sm text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFeed ? "animate-spin" : ""}`} />
                  <span>{t.refresh}</span>
                </button>
              </div>

              {loadingFeed ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="rounded-2xl p-4 h-24 animate-pulse bg-white/70"
                    />
                  ))}
                </div>
              ) : recentComments.length === 0 ? (
                <div className="bg-white/90 rounded-2xl p-8 text-center text-slate-600 text-sm font-medium shadow">
                  {t.noCommentsYet}
                </div>
              ) : (
                recentComments.map((comment) => (
                  <LiveCommentCard
                    key={comment.id}
                    comment={comment}
                    isStageView={false}
                    themeConfig={themeConfig}
                    language={userLang}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
