import { supabase } from "./supabaseClient";

// Load a user's cloud save
export async function loadCloudSave(userId) {
  const { data, error } = await supabase
    .from("game_saves")
    .select("game_data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data?.game_data ?? null;
}

// Save the entire game to the cloud
export async function saveCloudGame(userId, game) {
  const { error } = await supabase
    .from("game_saves")
    .upsert(
      {
        user_id: userId,
        game_data: game,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) throw error;
}

// Delete a user's cloud save
export async function deleteCloudSave(userId) {
  const { error } = await supabase
    .from("game_saves")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}