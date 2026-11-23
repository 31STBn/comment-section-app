"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_GFORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScRqR0gp6qw9Jdjdi95dPSXLzmfdL6nCHCOhsunDE0Czgwlkg/formResponse";
const DEFAULT_ENTRY_NAME = "entry.1420692220";
const DEFAULT_ENTRY_COMMENT = "entry.1634634498";

export interface SubmitCommentResult {
  success: boolean;
  message: string;
  messageBn: string;
  commentId?: string;
  status?: "approved" | "pending";
  syncedToGoogleForm?: boolean;
}

export async function submitAudienceComment(formData: {
  author_name: string;
  author_avatar?: string;
  content: string;
}): Promise<SubmitCommentResult> {
  const author_name = (formData.author_name || "").trim();
  const content = (formData.content || "").trim();
  const author_avatar = formData.author_avatar || "🎖️";

  if (!author_name) {
    return {
      success: false,
      message: "Please provide your Rank/Designation & Name.",
      messageBn: "অনুগ্রহ করে আপনার পদবী এবং নাম লিখুন।",
    };
  }
  if (!content) {
    return {
      success: false,
      message: "Please enter a comment.",
      messageBn: "অনুগ্রহ করে আপনার কমেন্ট লিখুন।",
    };
  }
  if (author_name.length > 80) {
    return {
      success: false,
      message: "Name must be 80 characters or less.",
      messageBn: "পদবী এবং নাম ৮০ অক্ষরের মধ্যে হতে হবে।",
    };
  }
  if (content.length > 500) {
    return {
      success: false,
      message: "Comment must be 500 characters or less.",
      messageBn: "কমেন্ট ৫০০ অক্ষরের মধ্যে হতে হবে।",
    };
  }

  // Fetch current live settings
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("live_system_settings")
    .select(
      "allow_comments, auto_approve, banned_words, gform_action_url, gform_entry_name, gform_entry_comment"
    )
    .eq("id", "current")
    .single();

  if (settingsError) {
    console.error("Error reading settings:", settingsError);
  }

  if (settings && !settings.allow_comments) {
    return {
      success: false,
      message: "Comment submissions are currently turned OFF by the organizer.",
      messageBn: "আয়োজক বর্তমানে মন্তব্য গ্রহণ বন্ধ রেখেছেন।",
    };
  }

  // Check banned words
  let sanitizedContent = content;
  if (settings && settings.banned_words && settings.banned_words.length > 0) {
    for (const word of settings.banned_words) {
      if (word.trim()) {
        const regex = new RegExp(`\\b${word.trim()}\\b`, "gi");
        sanitizedContent = sanitizedContent.replace(regex, "***");
      }
    }
  }

  const initialStatus = settings?.auto_approve ? "approved" : "pending";

  // 1. Insert into Supabase Realtime database for Big Screen
  const { data: newComment, error: insertError } = await supabaseAdmin
    .from("live_comments")
    .insert({
      author_name,
      author_avatar,
      content: sanitizedContent,
      status: initialStatus,
      is_pinned: false,
      likes_count: 0,
    })
    .select("id, status")
    .single();

  if (insertError) {
    console.error("Failed to insert comment:", insertError);
    return {
      success: false,
      message: "Failed to post comment. Please try again.",
      messageBn: "মন্তব্য পাঠানো যায়নি। আবার চেষ্টা করুন।",
    };
  }

  // 2. Simultaneously forward to Google Form (পদবী এবং নাম -> entry.1420692220, কমেন্ট -> entry.1634634498)
  let syncedToGoogleForm = false;
  try {
    const actionUrl = settings?.gform_action_url || DEFAULT_GFORM_ACTION_URL;
    const entryNameKey = settings?.gform_entry_name || DEFAULT_ENTRY_NAME;
    const entryCommentKey = settings?.gform_entry_comment || DEFAULT_ENTRY_COMMENT;

    const params = new URLSearchParams();
    params.append(entryNameKey, author_name);
    params.append(entryCommentKey, sanitizedContent);

    const gRes = await fetch(actionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    syncedToGoogleForm = gRes.ok || gRes.status === 200 || gRes.status === 302;
  } catch (gErr) {
    console.warn("Google Form background sync warning:", gErr);
  }

  return {
    success: true,
    message:
      initialStatus === "approved"
        ? "Submitted to Google Form & now live on the big screen! 🎉"
        : "Submitted to Google Form & awaiting moderator approval! ⏳",
    messageBn:
      initialStatus === "approved"
        ? "গুগল ফর্ম এবং বড় পর্দায় আপনার কমেন্ট সফলভাবে প্রকাশিত হয়েছে! 🎉"
        : "আপনার কমেন্টটি গুগল ফর্মে জমা হয়েছে এবং অনুমোদনের অপেক্ষায় আছে! ⏳",
    commentId: newComment.id,
    status: initialStatus as "approved" | "pending",
    syncedToGoogleForm,
  };
}

export async function likeCommentAction(
  commentId: string
): Promise<{ success: boolean; likes: number }> {
  if (!commentId) return { success: false, likes: 0 };

  const { data: current, error: fetchErr } = await supabaseAdmin
    .from("live_comments")
    .select("likes_count")
    .eq("id", commentId)
    .single();

  if (fetchErr || !current) {
    return { success: false, likes: 0 };
  }

  const newLikes = (current.likes_count || 0) + 1;

  const { error: updateErr } = await supabaseAdmin
    .from("live_comments")
    .update({ likes_count: newLikes })
    .eq("id", commentId);

  if (updateErr) {
    return { success: false, likes: current.likes_count };
  }

  return { success: true, likes: newLikes };
}
