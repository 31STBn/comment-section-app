"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { LiveComment, LiveSystemSettings } from "@/types/database";

const ADMIN_PASSWORD_FALLBACK = process.env.ADMIN_SECRET_PASSWORD || "admin123";

/**
 * Validates the admin password against database settings or fallback env var.
 */
export async function verifyAdminPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: settings } = await supabaseAdmin
      .from("live_system_settings")
      .select("admin_password")
      .eq("id", "current")
      .single();

    const expectedPassword = settings?.admin_password || ADMIN_PASSWORD_FALLBACK;
    if (password === expectedPassword) {
      return { success: true };
    }
    return { success: false, error: "Incorrect admin password." };
  } catch (err: any) {
    return { success: false, error: err.message || "Authentication error." };
  }
}

/**
 * Admin: Fetch all comments with filter support.
 */
export async function adminGetAllComments(password: string): Promise<{
  success: boolean;
  comments?: LiveComment[];
  error?: string;
}> {
  const auth = await verifyAdminPassword(password);
  if (!auth.success) return { success: false, error: auth.error };

  const { data, error } = await supabaseAdmin
    .from("live_comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, comments: (data as LiveComment[]) || [] };
}

/**
 * Admin: Update status of a comment (approved, pending, rejected, deleted).
 */
export async function adminUpdateCommentStatus(
  password: string,
  commentId: string,
  status: "approved" | "pending" | "rejected" | "deleted"
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminPassword(password);
  if (!auth.success) return { success: false, error: auth.error };

  const { error } = await supabaseAdmin
    .from("live_comments")
    .update({ status })
    .eq("id", commentId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Admin: Pin or unpin a comment to the live stage spotlight.
 */
export async function adminTogglePinComment(
  password: string,
  commentId: string,
  isPinned: boolean
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminPassword(password);
  if (!auth.success) return { success: false, error: auth.error };

  // If pinning this comment, we can either unpin all others or allow multiple.
  // Setting pinned_at timestamp helps with ordering.
  const { error } = await supabaseAdmin
    .from("live_comments")
    .update({
      is_pinned: isPinned,
      pinned_at: isPinned ? new Date().toISOString() : null,
      status: "approved", // Automatically ensure pinned comment is approved
    })
    .eq("id", commentId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Admin: Permanently delete a comment.
 */
export async function adminDeleteComment(
  password: string,
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminPassword(password);
  if (!auth.success) return { success: false, error: auth.error };

  const { error } = await supabaseAdmin
    .from("live_comments")
    .delete()
    .eq("id", commentId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Admin: Clear all comments for a fresh session/event.
 */
export async function adminClearAllComments(
  password: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminPassword(password);
  if (!auth.success) return { success: false, error: auth.error };

  const { error } = await supabaseAdmin
    .from("live_comments")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Admin: Fetch current live settings.
 */
export async function adminGetSettings(): Promise<{
  success: boolean;
  settings?: LiveSystemSettings;
  error?: string;
}> {
  const { data, error } = await supabaseAdmin
    .from("live_system_settings")
    .select("*")
    .eq("id", "current")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, settings: data as LiveSystemSettings };
}

/**
 * Admin: Update live system settings.
 */
export async function adminUpdateSettings(
  password: string,
  updates: Partial<LiveSystemSettings>
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminPassword(password);
  if (!auth.success) return { success: false, error: auth.error };

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.event_title !== undefined) payload.event_title = updates.event_title;
  if (updates.event_subtitle !== undefined) payload.event_subtitle = updates.event_subtitle;
  if (updates.qr_url !== undefined) payload.qr_url = updates.qr_url;
  if (updates.auto_approve !== undefined) payload.auto_approve = updates.auto_approve;
  if (updates.allow_comments !== undefined) payload.allow_comments = updates.allow_comments;
  if (updates.announcement_banner !== undefined) payload.announcement_banner = updates.announcement_banner;
  if (updates.theme !== undefined) payload.theme = updates.theme;
  if (updates.banned_words !== undefined) payload.banned_words = updates.banned_words;
  if (updates.admin_password !== undefined && updates.admin_password.trim()) {
    payload.admin_password = updates.admin_password.trim();
  }

  const { error } = await supabaseAdmin
    .from("live_system_settings")
    .update(payload)
    .eq("id", "current");

  if (error) return { success: false, error: error.message };
  return { success: true };
}
