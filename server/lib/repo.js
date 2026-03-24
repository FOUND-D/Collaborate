const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('./supabase');

const toPublicUser = (u) => u && ({
  _id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  profileImage: u.profile_image || '',
  techStack: u.tech_stack || [],
  reputationScore: u.reputation_score || 0,
  createdAt: u.created_at,
  updatedAt: u.updated_at,
});

const toPublicOrganisation = (o) => o && ({
  _id: o.id,
  name: o.name,
  slug: o.slug,
  description: o.description,
  logo: o.logo,
  ownerId: o.owner_id,
  settings: o.settings,
  createdAt: o.created_at,
  updatedAt: o.updated_at,
});

const getUserById = async (id) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toPublicUser(data) : null;
};

const getUserByEmail = async (email) => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (error) throw error;
  return data ? toPublicUser(data) : null;
};

const createUser = async ({ name, email, password, role, techStack, profileImage }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert({
    name, email, password_hash: passwordHash, role: role || 'Developer',
    tech_stack: techStack || [], profile_image: profileImage || '',
  }).select('*').single();
  if (error) throw error;
  return toPublicUser(data);
};

const verifyUserPassword = async (email, password) => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (error || !data) return null;
  const ok = await bcrypt.compare(password, data.password_hash);
  return ok ? toPublicUser(data) : null;
};

const updateUser = async (id, patch) => {
  const updates = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.email !== undefined) updates.email = patch.email;
  if (patch.role !== undefined) updates.role = patch.role;
  if (patch.profileImage !== undefined) updates.profile_image = patch.profileImage;
  if (patch.techStack !== undefined) updates.tech_stack = patch.techStack;
  if (patch.password !== undefined) updates.password_hash = await bcrypt.hash(patch.password, 10);
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return toPublicUser(data);
};

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const uniqueSlug = async (name, excludeId) => {
  const base = slugify(name);
  let slug = base;
  let i = 2;
  while (true) {
    let q = supabase.from('organisations').select('id').eq('slug', slug);
    if (excludeId) q = q.neq('id', excludeId);
    const { data, error } = await q.limit(1);
    if (error) throw error;
    if (!data.length) return slug;
    slug = `${base}-${i++}`;
  }
};

module.exports = { supabase, crypto, toPublicUser, toPublicOrganisation, getUserById, getUserByEmail, createUser, verifyUserPassword, updateUser, uniqueSlug };
