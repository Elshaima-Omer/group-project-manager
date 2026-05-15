import { supabase } from "@/lib/supabase";

/** Random 6-character code students type when creating a project (e.g. K7M2XP) */
export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type ClassroomLookup = {
  id: string;
  name: string;
  term: string | null;
  join_code: string;
  professor_id: string;
  profiles?: { full_name: string | null } | null;
};

/** Find a classroom by the code the professor shared with students */
export async function lookupClassroomByJoinCode(
  rawCode: string,
): Promise<{ classroom: ClassroomLookup | null; error: string | null }> {
  const joinCode = rawCode.trim().toUpperCase();
  if (!joinCode) {
    return { classroom: null, error: "Please enter a classroom code." };
  }

  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name, term, join_code, professor_id, profiles(full_name)")
    .eq("join_code", joinCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return { classroom: null, error: error.message };
  }
  if (!data) {
    return { classroom: null, error: "No classroom found with that code. Check with your professor." };
  }

  return { classroom: data as ClassroomLookup, error: null };
}
