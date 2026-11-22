"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { LiveComment, LiveSystemSettings } from "@/types/database";
import { getThemeConfig } from "@/lib/themes";
import { translations } from "@/lib/i18n";
import QRCodeCard from "@/components/QRCodeCard";
import LiveCommentCard from "@/components/LiveCommentCard";
import PinnedSpotlight from "@/components/PinnedSpotlight";
import StageHeader from "@/components/StageHeader";
import { MessageSquare, Lock, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function StageLiveScreen() {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [settings, setSettings] = useState<LiveSystemSettings>({
    id: "current",
    event_title: "Live Audience Comments",
    event_subtitle: "Scan the QR code to join the live conversation!",
    qr_url: "",
    auto_approve: true,
    allow_comments: true,
    announcement_banner: "",
    theme: "military-trucks",
    banned_words: [],
    language: "both",
    is_published: true,
    qr_fg_color: "#14532d",
    qr_bg_color: "#ffffff",
    qr_frame_style: "military-badge",
    qr_size: "large",
    qr_position: "left",
    qr_label_en: "Scan QR to Comment",
    qr_label_bn: "মন্তব্য করতে QR কোডটি স্ক্যান করুন",
    qr_logo_emoji: "",
    custom_bg_url: "",
    updated_at: new Date().toISOString(),
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Ignore audio autoplay restriction
    }
  };

  // Initial fetch
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);

        const { data: settingsData } = await supabase
          .from("live_system_settings")
          .select("*")
          .eq("id", "current")
          .single();

        if (settingsData) {
          setSettings((prev) => ({ ...prev, ...(settingsData as LiveSystemSettings) }));
        }

        const { data: commentsData } = await supabase
          .from("live_comments")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(100);

        if (commentsData) {
          setComments(commentsData as LiveComment[]);
        }
      } catch (err) {
        console.error("Error loading stage data:", err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    const commentsChannel = supabase
      .channel("stage-live-comments")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_comments" },
        (payload) => {
          const newComment = payload.new as LiveComment;
          if (newComment.status === "approved") {
            setComments((prev) => [newComment, ...prev.filter((c) => c.id !== newComment.id)]);
            playChime();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_comments" },
        (payload) => {
          const updated = payload.new as LiveComment;

          if (updated.is_pinned && updated.status === "approved") {
            confetti({
              particleCount: 70,
              spread: 70,
              origin: { y: 0.5 },
            });
            playChime();
          }

          if (updated.status !== "approved") {
            setComments((prev) => prev.filter((c) => c.id !== updated.id));
          } else {
            setComments((prev) => {
              const exists = prev.some((c) => c.id === updated.id);
              if (exists) {
                return prev.map((c) => (c.id === updated.id ? updated : c));
              } else {
                return [updated, ...prev];
              }
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "live_comments" },
        (payload) => {
          const deletedId = (payload.old as any).id;
          if (deletedId) {
            setComments((prev) => prev.filter((c) => c.id !== deletedId));
          }
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel("stage-live-settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_system_settings" },
        (payload) => {
          const updated = payload.new as LiveSystemSettings;
          setSettings((prev) => ({ ...prev, ...updated }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [soundEnabled]);

  const themeConfig = getThemeConfig(settings.theme);
  const bgImageUrl =
    settings.theme === "custom-image" && settings.custom_bg_url
      ? settings.custom_bg_url
      : themeConfig.bgImage;

  const pinnedComment = comments.find((c) => c.is_pinned);
  const streamComments = comments.filter((c) => !c.is_pinned);
  const lang = settings.language || "both";

  return (
    <div
      className={`min-h-screen w-full relative overflow-x-hidden transition-colors duration-500 ${themeConfig.pageBgClass}`}
    >
      {/* Background Artwork Layer for Picture Themes */}
      {bgImageUrl && (
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${bgImageUrl}')`,
          }}
        />
      )}

      {/* Main Content Wrapper (padded to keep top leaves & bottom trucks/soldiers visible) */}
      <main
        className={`relative z-10 min-h-screen max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-14 flex flex-col ${
          themeConfig.scenicPadding ? "pt-6 pb-28 sm:pb-36" : "py-6 sm:py-8"
        }`}
      >
        {/* Top Clean Header */}
        <StageHeader
          title={settings.event_title}
          subtitle={settings.event_subtitle}
          commentCount={comments.length}
          announcement={settings.announcement_banner}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          themeConfig={themeConfig}
          language={lang}
        />

        {/* Check if Published to Big Screen or in Standby Mode */}
        {!settings.is_published ? (
          <div className="flex-1 flex items-center justify-center my-8">
            <div
              className={`max-w-xl w-full rounded-3xl p-10 text-center space-y-4 ${themeConfig.headerCardClass}`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-800/15 border border-emerald-700/30 flex items-center justify-center mx-auto">
                <Sparkles
                  className={`w-8 h-8 ${
                    themeConfig.isLight ? "text-emerald-800" : "text-amber-400"
                  } animate-pulse`}
                />
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black ${themeConfig.titleTextClass}`}>
                {lang === "bn"
                  ? translations.bn.standbyTitle
                  : lang === "en"
                  ? translations.en.standbyTitle
                  : `${translations.bn.standbyTitle} • ${translations.en.standbyTitle}`}
              </h2>
              <p className={`text-sm sm:text-base ${themeConfig.subtitleTextClass}`}>
                {lang === "bn"
                  ? translations.bn.standbySubtitle
                  : lang === "en"
                  ? translations.en.standbySubtitle
                  : `${translations.bn.standbySubtitle}`}
              </p>
            </div>
          </div>
        ) : (
          /* Active Published Stage Layout: QR Code + Live Comments Side-by-Side */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 items-start mt-2">
            {/* QR CODE COLUMN */}
            <div
              className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 space-y-4 ${
                settings.qr_position === "right" ? "lg:order-2" : "lg:order-1"
              }`}
            >
              {settings.allow_comments ? (
                <QRCodeCard
                  customUrl={settings.qr_url}
                  fgColor={settings.qr_fg_color}
                  bgColor={settings.qr_bg_color}
                  frameStyle={settings.qr_frame_style}
                  size={settings.qr_size}
                  labelEn={settings.qr_label_en}
                  labelBn={settings.qr_label_bn}
                  logoEmoji={settings.qr_logo_emoji}
                  language={lang}
                  isLightTheme={themeConfig.isLight}
                />
              ) : (
                <div
                  className={`rounded-3xl p-8 text-center space-y-3 ${themeConfig.headerCardClass}`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className={`text-lg sm:text-xl font-bold ${themeConfig.titleTextClass}`}>
                    {lang === "bn"
                      ? translations.bn.closedTitle
                      : lang === "en"
                      ? translations.en.closedTitle
                      : `${translations.bn.closedTitle}`}
                  </h3>
                  <p className={`text-xs sm:text-sm ${themeConfig.subtitleTextClass}`}>
                    {lang === "bn"
                      ? translations.bn.closedSubtitle
                      : translations.en.closedSubtitle}
                  </p>
                </div>
              )}
            </div>

            {/* LIVE COMMENTS STREAM COLUMN */}
            <div
              className={`lg:col-span-7 xl:col-span-8 flex flex-col space-y-4 ${
                settings.qr_position === "right" ? "lg:order-1" : "lg:order-2"
              }`}
            >
              {/* Pinned Spotlight Comment */}
              {pinnedComment && (
                <PinnedSpotlight
                  pinnedComment={pinnedComment}
                  themeConfig={themeConfig}
                  language={lang}
                />
              )}

              {/* Comments Feed */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`rounded-2xl p-6 h-28 animate-pulse ${themeConfig.commentCardClass}`}
                    />
                  ))}
                </div>
              ) : streamComments.length === 0 && !pinnedComment ? (
                <div
                  className={`rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3 my-4 ${themeConfig.commentCardClass}`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-700/10 border border-emerald-700/20 flex items-center justify-center text-2xl">
                    <MessageSquare
                      className={`w-7 h-7 ${
                        themeConfig.isLight ? "text-emerald-800" : "text-indigo-400"
                      }`}
                    />
                  </div>
                  <h3 className={`text-xl font-extrabold ${themeConfig.titleTextClass}`}>
                    {lang === "bn"
                      ? translations.bn.emptyTitle
                      : lang === "en"
                      ? translations.en.emptyTitle
                      : `${translations.bn.emptyTitle} • ${translations.en.emptyTitle}`}
                  </h3>
                  <p className={`text-sm max-w-md ${themeConfig.subtitleTextClass}`}>
                    {lang === "bn"
                      ? translations.bn.emptySubtitle
                      : lang === "en"
                      ? translations.en.emptySubtitle
                      : `${translations.bn.emptySubtitle}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[68vh] overflow-y-auto pr-1.5">
                  {streamComments.map((comment) => (
                    <LiveCommentCard
                      key={comment.id}
                      comment={comment}
                      isStageView={true}
                      themeConfig={themeConfig}
                      language={lang}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
