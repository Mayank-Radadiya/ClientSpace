import { SupabaseClient } from "@supabase/supabase-js";

/**
 * All queries must strictly filter by org_id per multitenancy rules.
 */

export async function getProject(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(company_name, contact_name, email)")
    .eq("id", projectId)
    .eq("org_id", orgId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
  updates: Record<string, any>,
) {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("org_id", orgId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMilestones(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .order("order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createMilestone(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
  milestone: Record<string, any>,
) {
  const { data, error } = await supabase
    .from("milestones")
    .insert({ ...milestone, project_id: projectId, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMilestone(
  supabase: SupabaseClient,
  orgId: string,
  milestoneId: string,
  updates: Record<string, any>,
) {
  const { data, error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", milestoneId)
    .eq("org_id", orgId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProjectMembers(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("project_members")
    .select("*, user:users(id, name, email, avatar_url)")
    .eq("project_id", projectId)
    .select(); // Supabase join usually filters by view. We should also get org_memberships to know role
  // For now we get users. We might need a separate query or an RPC if we want the org_role directly
  if (error) throw error;
  return data;
}

export async function addProjectMember(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId })
    .select()
    .single(); // assuming RLS ensures orgId matching implicitly or user checks
  if (error) throw error;
  return data;
}

export async function removeProjectMember(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getFolders(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAssets(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getComments(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:users(id, name, avatar_url)")
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createComment(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
  comment: Record<string, any>,
) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ ...comment, project_id: projectId, org_id: orgId })
    .select("*, author:users(id, name, avatar_url)")
    .single();
  if (error) throw error;
  return data;
}

export async function getInvoices(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteProject(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
) {
  // If soft-deleting change to update
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("org_id", orgId);
  if (error) throw error;
}
