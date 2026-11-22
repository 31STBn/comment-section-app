"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface SubmitCommentResult {
  success: boolean;
  message: string;
  commentId?: string;
  status?: "approved" | "pending";
}

export async function submitAudienceComment(formData: {
  author_name: string;
  author_avatar?: string;
  content: string;
}): Promise<SubmitCommentResult> {
  const author_name = (formData.author_name || "").trim();
  const content = (formData.content || "").trim();
  const author_avatar = formData.author_avatar || "💬";

  if (!author_name) {
    return { success: false, message: "Please provide your name." };
  }
  if (!content) {
    return { success: false, message: "Please enter a comment." };
  }
  if (author_name.length > 50) {
    return { success: false, message: "Name must be 50 characters or less." };
  }
  if (content.length > 500) {
    return { success: false, message: "Comment must be 500 characters or less." };
  }

  // Fetch current live settings
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("live_system_settings")
    .select("allow_comments, auto_approve, banned_words")
    .eq("id", "current")
    .single();

  if (settingsError) {
    console.error("Error reading settings:", settingsError);
  }

  if (settings && !settings.allow_comments) {
    return {
      success: false,
      message: "Comment submissions are currently paused by the organizer.",
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
    return { success: false, message: "Failed to post comment. Please try again." };
  }

  return {
    success: true,
    message:
      initialStatus === "approved"
        ? "Your comment is live on the big screen! 🎉"
        : "Your comment was submitted and is waiting for moderator approval! ⏳",
    commentId: newComment.id,
    status: initialStatus as "approved" | "pending",
  };
}

export async function likeCommentAction(commentId: string): Promise<{ success: boolean; likes: number }> {
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
