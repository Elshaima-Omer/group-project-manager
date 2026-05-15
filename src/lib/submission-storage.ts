import { supabase } from "@/lib/supabase";

const BUCKET = "submissions";

/** Upload a task submission file; returns the storage path saved in submissions.file_url */
export async function uploadSubmissionFile(
  projectId: string,
  taskId: string,
  userId: string,
  file: File,
): Promise<{ path: string | null; error: string | null }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${projectId}/${taskId}/${userId}-${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    return { path: null, error: error.message };
  }
  return { path, error: null };
}

/** Old rows store only a filename; new rows store a storage path or full URL. */
export function isStoragePath(fileUrl: string): boolean {
  return Boolean(fileUrl) && !fileUrl.startsWith("http://") && !fileUrl.startsWith("https://");
}

/** Signed URL for viewing/downloading (works with private buckets). */
export async function getSubmissionDownloadUrl(
  fileUrlOrPath: string,
): Promise<{ url: string | null; error: string | null }> {
  if (!fileUrlOrPath) {
    return { url: null, error: "No file attached." };
  }

  if (!isStoragePath(fileUrlOrPath)) {
    return { url: fileUrlOrPath, error: null };
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileUrlOrPath, 60 * 60);

  if (error || !data?.signedUrl) {
    return { url: null, error: error?.message ?? "Could not open file." };
  }
  return { url: data.signedUrl, error: null };
}

export function displayFileName(fileUrlOrPath: string): string {
  if (!fileUrlOrPath) return "No file";
  const segment = fileUrlOrPath.split("/").pop() ?? fileUrlOrPath;
  // Strip leading userId-timestamp- prefix from stored paths
  const match = segment.match(/^[0-9a-f-]{36}-\d+-(.+)$/i);
  return match?.[1] ?? segment;
}
