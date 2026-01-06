// repositories/todosRepository.js
import { supabase } from "../supabaseClient.js";

/**
 * Get all todos for a user, ordered by created_at descending
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getTodosByUser(userId) {
  const { data, error } = await supabase
    .from("todos")
    .select("id, title, content, tags, due_date, created_at, updated_at")
    .eq("user_id", userId) // userId is string (UUID)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(todo => ({
    ...todo,
    tags: todo.tags ? safeParse(todo.tags) : [],
  }));
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/**
 * Create a new todo
 * @param {string} userId
 * @param {string} title
 * @param {string} content
 * @param {Array} tags
 * @param {string | null} dueDate - YYYY-MM-DD or null
 */
export async function createTodo(userId, title, content, tags = [], dueDate = null) {
  const { error } = await supabase
    .from("todos")
    .insert({
      user_id: userId,
      title,
      content,
      tags: JSON.stringify(tags),
      due_date: dueDate,
    });

  if (error) throw error;
}

/**
 * Delete a todo by id and userId
 * @param {number} id
 * @param {string} userId
 */
export async function deleteTodo(id, userId) {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Update a todo by id and userId
 * @param {number} id
 * @param {string} userId
 * @param {Object} updates - { title?, content?, tags?, due_date? }
 */
export async function updateTodo(id, userId, updates) {
  const updateData = { ...updates };
  if (updates.tags) updateData.tags = JSON.stringify(updates.tags);

  const { error } = await supabase
    .from("todos")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}


