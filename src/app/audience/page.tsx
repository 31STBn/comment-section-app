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
  Sparkles,
  FileSpreadsheet,
  Award,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";

const DEFAULT_GFORM_EMBED_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScRqR0gp6qw9Jdjdi95dPSXLzmfdL6nCHCOhsunDE0Czgwlkg/viewform?embedded=true";
const DEFAULT_GFORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScRqR0gp6qw9Jdjdi95dPSXLzmfdL6nCHCOhsunDE0Czgwlkg/formResponse";

const EMOJI_OPTIONS = ["🎖️", "🇧🇩", "⭐", "💬", "🔥", "🚀", "💡", "❤️", "👏", "🎉", "🛡️", "💯"];

export default function AudiencePage() {
  const [activeTab, setActiveTab] = useState<"premium" | "gform" | "feed">("premium");
  const [userLang, setUserLang] = useState<"bn" | "en">("bn");
  const [authorName, setAuthorName] = useState<string>("");
  const [authorAvatar, setAuthorAvatar] = useState<string>("🎖️");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
    synced?: boolean;
  } | null>(null);
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
        if (sys.gform_mode === "iframe-only") {
          setActiveTab("gform");
        }
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

    const settingsSub = supabase
      .channel("audience-settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_system_settings" },
        (payload) => {
          const updated = payload.new as LiveSystemSettings;
          setSettings((prev) => ({ ...(prev || {}), ...updated }));
          if (updated.gform_mode === "iframe-only") {
            setActiveTab("gform");
          } else if (updated.gform_mode === "premium-only" && activeTab === "gform") {
            setActiveTab("premium");
          }
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

      // Also trigger client-side no-cors POST to Google Form as backup guarantee
      try {
        const gAction = settings?.gform_action_url || DEFAULT_GFORM_ACTION_URL;
        const entryName = settings?.gform_entry_name || "entry.1420692220";
        const entryComment = settings?.gform_entry_comment || "entry.1634634498";
        const formData = new FormData();
        formData.append(entryName, authorName.trim());
        formData.append(entryComment, content.trim());
        fetch(gAction, {
          method: "POST",
          mode: "no-cors",
          body: formData,
        }).catch(() => {});
      } catch (e) {}

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
          synced: true,
        });

        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.7 },
        });

        setTimeout(() => {
          setFeedback(null);
        }, 7000);
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

  const embedUrl = settings?.gform_embed_url || DEFAULT_GFORM_EMBED_URL;
  const gformMode = settings?.gform_mode || "hybrid";

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden flex flex-col items-center px-3.5 py-4 sm:p-6 ${themeConfig.pageBgClass}`}
    >
      {/* Scenic Background Artwork Layer */}
      {bgImageUrl && (
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-95"
          style={{
            backgroundImage: `url('${bgImageUrl}')`,
          }}
        />
      )}

      {/* Subtle Ambient Top Halo */}
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center pb-20">
        {/* Top Floating Bar: Live Status Pill + Language Switcher */}
        <div className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/90 text-amber-300 border border-amber-400/40 shadow-md backdrop-blur-md text-[11px] font-extrabold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>{userLang === "bn" ? "লাইভ কমেন্ট পোর্টাল" : "LIVE COMMENT PORTAL"}</span>
          </div>

          <div className="inline-flex items-center bg-white/95 backdrop-blur-md p-1 rounded-full border border-emerald-900/20 shadow-md">
            <Languages className="w-3.5 h-3.5 text-emerald-800 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => toggleLanguage("bn")}
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all ${
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
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all ${
                userLang === "en"
                  ? "bg-emerald-800 text-white shadow"
                  : "text-slate-700 hover:text-emerald-900"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Premium Hero Event Crest Card */}
        <div className="w-full rounded-3xl p-[2px] bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-800 shadow-xl mb-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-[22px] px-5 py-4 text-center relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 leading-snug">
              {settings?.event_title ||
                (userLang === "bn" ? "কমেন্ট সেকশন" : "Comment Section")}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-800/90 font-medium mt-0.5">
              {settings?.event_subtitle ||
                (userLang === "bn"
                  ? "আপনার পদবী, নাম এবং কমেন্ট নিচে প্রদান করুন"
                  : "Enter your Designation, Name & Comment below")}
            </p>
          </div>
        </div>

        {/* Segmented Mode Navigation Tabs */}
        <div className="w-full flex bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border-2 border-emerald-900/15 shadow-lg mb-4 gap-1">
          {gformMode !== "iframe-only" && (
            <button
              type="button"
              onClick={() => setActiveTab("premium")}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "premium"
                  ? "bg-gradient-to-r from-emerald-800 to-green-800 text-white shadow-md"
                  : "text-slate-600 hover:text-emerald-950"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">
                {userLang === "bn" ? "প্রিমিয়াম ফর্ম" : "Smart Form"}
              </span>
            </button>
          )}

          {gformMode !== "premium-only" && (
            <button
              type="button"
              onClick={() => setActiveTab("gform")}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "gform"
                  ? "bg-gradient-to-r from-emerald-800 to-green-800 text-white shadow-md"
                  : "text-slate-600 hover:text-emerald-950"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">
                {userLang === "bn" ? "গুগল ফর্ম" : "Google Form"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("feed")}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "feed"
                ? "bg-gradient-to-r from-emerald-800 to-green-800 text-white shadow-md"
                : "text-slate-600 hover:text-emerald-950"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {userLang === "bn" ? "লাইভ কমেন্ট" : "Live Feed"}
            </span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="w-full">
          {settings && !settings.allow_comments && activeTab !== "feed" ? (
            /* Locked State when Admin turns OFF Comment Section */
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 text-center space-y-3 border-2 border-amber-500/40 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-emerald-950">{t.closedTitle}</h3>
              <p className="text-xs sm:text-sm text-slate-600">{t.closedSubtitle}</p>
            </div>
          ) : activeTab === "premium" ? (
            /* ==================== MODE 1: ULTRA-PREMIUM NATIVE MOBILE GOOGLE FORM UI ==================== */
            <div className="rounded-3xl p-[2px] bg-gradient-to-b from-emerald-700/40 via-amber-400/50 to-emerald-900/40 shadow-2xl">
              <div className="bg-white/95 backdrop-blur-2xl rounded-[22px] p-5 sm:p-6 text-slate-900 space-y-4 relative overflow-hidden">
                {/* Top Decorative Header inside Form */}
                <div className="flex items-center justify-between pb-3 border-b border-emerald-900/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center shadow">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                        {userLang === "bn" ? "মতামত ও কমেন্ট ফর্ম" : "Official Comment Form"}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        {userLang === "bn"
                          ? "গুগল ফর্ম ও বড় পর্দায় সরাসরি যুক্ত"
                          : "Synced with Google Forms & Live Screen"}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    * {userLang === "bn" ? "আবশ্যক" : "Required"}
                  </span>
                </div>

                {/* Success or Error Feedback Toast Card */}
                {feedback && (
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 animate-fade-in-up ${
                      feedback.type === "success"
                        ? "bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-500 text-emerald-950 shadow-md"
                        : "bg-rose-50 border-2 border-rose-500 text-rose-900"
                    }`}
                  >
                    {feedback.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                    )}
                    <div className="space-y-1">
                      <div className="font-extrabold">{feedback.text}</div>
                      {feedback.synced && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          ✓ Google Form & Live Display Recorded
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* FIELD 1: পদবী এবং নাম (entry.1420692220) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/[0.03] border border-emerald-900/15 space-y-2 transition-all focus-within:border-emerald-700 focus-within:bg-white focus-within:shadow-md">
                    <label className="text-sm font-extrabold text-emerald-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-700" />
                        <span>
                          {userLang === "bn"
                            ? "পদবী এবং নাম"
                            : "পদবী এবং নাম (Rank & Name)"}
                        </span>
                        <span className="text-rose-600">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder={
                        userLang === "bn"
                          ? "আপনার পদবী এবং নাম লিখুন..."
                          : "Enter your Designation / Rank and Name..."
                      }
                      className="w-full px-3.5 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-emerald-700 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none transition-all shadow-inner"
                    />
                  </div>

                  {/* Badge / Icon Picker */}
                  <div className="space-y-1.5 px-1">
                    <label className="text-xs font-extrabold text-emerald-900">
                      {userLang === "bn"
                        ? "আইকন / ব্যাজ নির্বাচন করুন"
                        : "Select Badge Icon"}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => setAuthorAvatar(emoji)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                            authorAvatar === emoji
                              ? "bg-emerald-800 text-white scale-110 shadow-md ring-2 ring-amber-400"
                              : "bg-slate-100 hover:bg-slate-200 border border-slate-200/80"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FIELD 2: কমেন্ট (entry.1634634498) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/[0.03] border border-emerald-900/15 space-y-2 transition-all focus-within:border-emerald-700 focus-within:bg-white focus-within:shadow-md">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-700" />
                        <span>
                          {userLang === "bn" ? "কমেন্ট" : "কমেন্ট (Your Comment)"}
                        </span>
                        <span className="text-rose-600">*</span>
                      </label>
                      <span
                        className={`text-[11px] font-bold ${
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
                      placeholder={
                        userLang === "bn"
                          ? "আপনার কমেন্ট বা মতামত এখানে লিখুন..."
                          : "Write your comment or feedback here..."
                      }
                      className="w-full px-3.5 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-emerald-700 text-slate-900 placeholder-slate-400 text-sm font-medium outline-none transition-all resize-none leading-relaxed shadow-inner"
                    />

                    {/* Quick Reaction Chips */}
                    <div className="pt-1 space-y-1.5">
                      <span className="text-[11px] text-slate-500 font-bold block">
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
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-300/80 shadow-sm transition-all active:scale-95"
                          >
                            {quick}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-700 to-green-800 hover:from-emerald-950 hover:to-green-900 text-white font-black text-base shadow-xl shadow-emerald-950/30 border border-amber-400/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                        <span>{t.sending}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 text-amber-300" />
                        <span>
                          {userLang === "bn"
                            ? "কমেন্ট জমা দিন (Submit)"
                            : "Submit Comment"}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab === "gform" ? (
            /* ==================== MODE 2: EMBEDDED GOOGLE FORM IN LUXURY MOBILE CONTAINER ==================== */
            <div className="rounded-3xl p-[2px] bg-gradient-to-b from-emerald-800 via-amber-400 to-emerald-900 shadow-2xl overflow-hidden">
              <div className="bg-white rounded-[22px] overflow-hidden flex flex-col">
                {/* Luxury Top Frame Bar */}
                <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-4 py-3 flex items-center justify-between border-b-2 border-amber-400/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-extrabold tracking-wide text-amber-300">
                      {userLang === "bn"
                        ? "অফিসিয়াল গুগল ফর্ম (পদবী, নাম ও কমেন্ট)"
                        : "Official Google Form"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIframeLoaded(false);
                        setIframeKey((prev) => prev + 1);
                      }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 transition-colors"
                      title="Reload Form"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={embedUrl.replace("?embedded=true", "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 text-xs flex items-center gap-1 transition-colors"
                      title="Open Form in New Tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Responsive Iframe Container */}
                <div className="relative w-full bg-white min-h-[580px] sm:min-h-[620px]">
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 p-6 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
                      <div className="text-sm font-bold text-emerald-950">
                        {userLang === "bn"
                          ? "গুগল ফর্ম লোড হচ্ছে..."
                          : "Loading Google Form..."}
                      </div>
                    </div>
                  )}

                  <iframe
                    key={iframeKey}
                    src={embedUrl}
                    width="640"
                    height="561"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    onLoad={() => setIframeLoaded(true)}
                    className="w-full min-h-[580px] sm:min-h-[620px] border-0"
                    title="Comment Section Google Form"
                  >
                    Loading…
                  </iframe>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== MODE 3: LIVE FEED VIEW ==================== */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-2">
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider ${themeConfig.titleTextClass}`}
                >
                  {t.liveStreamTab}
                </span>
                <button
                  onClick={fetchFeed}
                  disabled={loadingFeed}
                  className="px-3 py-1.5 rounded-xl bg-white/95 text-emerald-900 border border-emerald-900/20 shadow-sm text-xs font-bold flex items-center gap-1.5"
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
                <div className="bg-white/95 rounded-2xl p-8 text-center text-slate-600 text-sm font-medium shadow">
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
