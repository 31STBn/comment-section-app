"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { LiveComment, LiveSystemSettings } from "@/types/database";

const ADMIN_PASSWORD_FALLBACK = process.env.ADMIN_SECRET_PASSWORD || "31stbn@admin2026";

/**
 * Validates the admin password against private live_admin_secrets table.
 */
export async function verifyAdminPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: secretRow } = await supabaseAdmin
      .from("live_admin_secrets")
      .select("admin_password")
      .eq("id", "current")
      .single();

    const expectedPassword = secretRow?.admin_password || ADMIN_PASSWORD_FALLBACK;
    if (password === expectedPassword) {
      return { success: true };
    }
    return { success: false, error: "Invalid credentials." };
  } catch (err: any) {
    return { success: false, error: "Authentication error." };
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

  const { error } = await supabaseAdmin
    .from("live_comments")
    .update({
      is_pinned: isPinned,
      pinned_at: isPinned ? new Date().toISOString() : null,
      status: "approved",
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
    .neq("id", "00000000-0000-0000-0000-000000000000");

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
 * Admin: Quick toggle comment section ON / OFF.
 */
export async function adminToggleCommentSection(
  password: string,
  allowComments: boolean
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminPassword(password);
  if (!auth.success) return { success: false, error: auth.error };

  const { error } = await supabaseAdmin
    .from("live_system_settings")
    .update({
      allow_comments: allowComments,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "current");

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Admin: Update & Publish live system settings for the Big Screen.
 */
export async function adminUpdateSettings(
  password: string,
  updates: Partial<LiveSystemSettings> & { new_admin_password?: string }
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminPassword(password);
  if (!auth.success) return { success: false, error: auth.error };

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  const allowedKeys: (keyof LiveSystemSettings)[] = [
    "event_title",
    "event_subtitle",
    "qr_url",
    "auto_approve",
    "allow_comments",
    "announcement_banner",
    "theme",
    "banned_words",
    "language",
    "is_published",
    "qr_fg_color",
    "qr_bg_color",
    "qr_frame_style",
    "qr_size",
    "qr_position",
    "qr_label_en",
    "qr_label_bn",
    "qr_logo_emoji",
    "custom_bg_url",
  ];

  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }

  const { error } = await supabaseAdmin
    .from("live_system_settings")
    .update(payload)
    .eq("id", "current");

  if (error) return { success: false, error: error.message };

  // If password change requested, update private live_admin_secrets table
  if (updates.new_admin_password && updates.new_admin_password.trim()) {
    const { error: passErr } = await supabaseAdmin
      .from("live_admin_secrets")
      .update({
        admin_password: updates.new_admin_password.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", "current");

    if (passErr) return { success: false, error: passErr.message };
  }

  return { success: true };
}
