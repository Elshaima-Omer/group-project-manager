import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type NotificationType =
  | "join_request"
  | "join_accepted"
  | "join_rejected"
  | "submission_received"
  | "submission_approved"
  | "submission_rejected";

/** Fallback types if the database only allows a subset (e.g. join_request, submission_received). */
const TYPE_FALLBACKS: Partial<Record<NotificationType, NotificationType>> = {
  join_accepted: "join_request",
  join_rejected: "join_request",
  submission_approved: "submission_received",
  submission_rejected: "submission_received",
};

/** Insert an in-app notification for a user (bell icon + dashboard). */
export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  message: string;
}): Promise<boolean> {
  const typesToTry = [params.type, TYPE_FALLBACKS[params.type]].filter(
    (t, i, arr): t is NotificationType => Boolean(t) && arr.indexOf(t) === i,
  );

  let lastError: { message: string } | null = null;

  for (const type of typesToTry) {
    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      type,
      message: params.message,
      read: false,
    });

    if (!error) return true;
    lastError = error;
    console.error(`Notification failed (type=${type}):`, error.message);
  }

  toast.error(`Notification failed: ${lastError?.message ?? "Unknown error"}`);
  return false;
}

/** Who submitted this work — supports submitted_by or user_id column names. */
export function getSubmissionSubmitterId(submission: {
  submitted_by?: string | null;
  user_id?: string | null;
  profiles?: { id?: string } | null;
}): string | undefined {
  return submission.submitted_by ?? submission.user_id ?? submission.profiles?.id ?? undefined;
}
