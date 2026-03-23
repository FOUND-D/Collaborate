const crypto = require('crypto');
const Organisation = require('../models/Organisation');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');

const buildSlug = async (name, excludeId = null) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug = base;
  let suffix = 2;
  while (await Organisation.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
};

const hasOrgAccess = (org, userId) => org.members.some((m) => m.user.toString() === userId.toString());
const getUserRole = (org, userId) => org.members.find((m) => m.user.toString() === userId.toString())?.role;

const createOrganisation = async (req, res, next) => {
  try {
    console.log('createOrganisation request received');
    if (!req.user || !req.user._id) {
      console.warn('createOrganisation missing req.user context');
      return res.status(401).json({ message: 'Not authorized, user context missing' });
    }

    const body = req.body || {};
    const { name, description = '', logo = '' } = body;

    console.log('createOrganisation payload:', {
      userId: req.user._id?.toString?.() || req.user._id,
      hasName: Boolean(name),
      hasDescription: Boolean(description),
      hasLogo: Boolean(logo),
    });

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Organisation name is required' });
    }

    const slug = await buildSlug(name.trim());
    const org = await Organisation.create({
      name: name.trim(),
      slug,
      description,
      logo,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { organisations: org._id },
    });

    return res.status(201).json(org);
  } catch (err) {
    console.error('createOrganisation error:', err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Organisation slug already exists' });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  }
};

const getMyOrganisations = asyncHandler(async (req, res) => {
  const orgs = await Organisation.find({ 'members.user': req.user._id })
    .populate('owner', 'name email')
    .populate('members.user', 'name email profileImage');
  res.json(orgs);
});

const getOrganisationById = asyncHandler(async (req, res) => {
  const org = await Organisation.findById(req.params.id)
    .populate('owner', 'name email profileImage')
    .populate('members.user', 'name email profileImage')
    .populate({ path: 'teams', select: 'name members owner organisation' });
  if (!org) return res.status(404).json({ message: 'Organisation not found' });
  if (!hasOrgAccess(org, req.user._id)) return res.status(403).json({ message: 'Not authorized' });
  res.json(org);
});

const updateOrganisation = asyncHandler(async (req, res) => {
  const org = await Organisation.findById(req.params.id);
  if (!org) return res.status(404).json({ message: 'Organisation not found' });
  const role = getUserRole(org, req.user._id);
  if (!['owner', 'admin'].includes(role)) return res.status(403).json({ message: 'Not authorized' });

  const { name, description, logo, settings } = req.body;
  if (name && name !== org.name) {
    org.name = name;
    org.slug = await buildSlug(name, org._id);
  }
  if (description !== undefined) org.description = description;
  if (logo !== undefined) org.logo = logo;
  if (settings !== undefined) org.settings = { ...org.settings.toObject?.() ?? org.settings, ...settings };

  const updated = await org.save();
  res.json(updated);
});

const deleteOrganisation = asyncHandler(async (req, res) => {
  const org = await Organisation.findById(req.params.id);
  if (!org) return res.status(404).json({ message: 'Organisation not found' });
  if (org.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only owner can delete organisation' });

  await User.updateMany({ organisations: org._id }, { $pull: { organisations: org._id } });
  const teams = await Team.find({ organisation: org._id });
  for (const team of teams) {
    await Task.deleteMany({ team: team._id });
    await team.deleteOne();
  }
  await org.deleteOne();
  res.json({ message: 'Organisation deleted' });
});

const inviteMemberToOrg = asyncHandler(async (req, res) => {
  const org = await Organisation.findById(req.params.id);
  if (!org) return res.status(404).json({ message: 'Organisation not found' });
  const role = getUserRole(org, req.user._id);
  if (!['owner', 'admin'].includes(role)) return res.status(403).json({ message: 'Not authorized' });
  const { email, role: inviteRole = 'member' } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const existingUser = await User.findOne({ email });
  if (existingUser && org.members.some((m) => m.user.toString() === existingUser._id.toString())) {
    return res.status(400).json({ message: 'User is already a member' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  org.pendingInvites.push({ email, token, role: inviteRole, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), invitedBy: req.user._id });
  await org.save();
  console.log(`Invite link: /invite/accept?token=${token}&org=${org._id}`);
  res.json({ message: 'Invite sent' });
});

const acceptOrgInvite = asyncHandler(async (req, res) => {
  const { token, org: orgId } = req.query;
  const org = await Organisation.findById(orgId);
  if (!org) return res.status(400).json({ message: 'Invalid or expired invite' });
  const invite = org.pendingInvites.find((i) => i.token === token && i.expiresAt > new Date());
  if (!invite) return res.status(400).json({ message: 'Invalid or expired invite' });
  const user = await User.findOne({ email: invite.email });
  if (!user) return res.redirect(`/register?invite=${token}&org=${orgId}`);
  if (!org.members.some((m) => m.user.toString() === user._id.toString())) {
    org.members.push({ user: user._id, role: invite.role });
  }
  await User.findByIdAndUpdate(user._id, { $addToSet: { organisations: org._id } });
  org.pendingInvites = org.pendingInvites.filter((i) => i.token !== token);
  await org.save();
  res.json({ message: 'Joined organisation successfully', organisationId: org._id });
});

const removeMemberFromOrg = asyncHandler(async (req, res) => {
  const org = await Organisation.findById(req.params.id);
  if (!org) return res.status(404).json({ message: 'Organisation not found' });
  const targetUserId = req.params.userId;
  const actorRole = getUserRole(org, req.user._id);
  if (targetUserId !== req.user._id.toString() && !['owner', 'admin'].includes(actorRole)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (org.owner.toString() === targetUserId) return res.status(400).json({ message: 'Cannot remove owner' });
  org.members = org.members.filter((m) => m.user.toString() !== targetUserId);
  await User.findByIdAndUpdate(targetUserId, { $pull: { organisations: org._id } });
  await org.save();
  res.json({ message: 'Member removed' });
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const org = await Organisation.findById(req.params.id);
  if (!org) return res.status(404).json({ message: 'Organisation not found' });
  if (org.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only owner can change roles' });
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const member = org.members.find((m) => m.user.toString() === req.params.userId);
  if (!member) return res.status(404).json({ message: 'Member not found' });
  if (member.role === 'owner') return res.status(400).json({ message: "Cannot change owner's role" });
  member.role = role;
  await org.save();
  res.json(org);
});

const getOrgMembers = asyncHandler(async (req, res) => {
  const org = await Organisation.findById(req.params.id).populate('members.user', 'name email profileImage');
  if (!org) return res.status(404).json({ message: 'Organisation not found' });
  if (!hasOrgAccess(org, req.user._id)) return res.status(403).json({ message: 'Not authorized' });
  res.json(org.members);
});

const getOrgTeams = asyncHandler(async (req, res) => {
  const org = await Organisation.findById(req.params.id);
  if (!org) return res.status(404).json({ message: 'Organisation not found' });
  if (!hasOrgAccess(org, req.user._id)) return res.status(403).json({ message: 'Not authorized' });
  const teams = await Team.find({ organisation: org._id }).populate('members', 'name email profileImage').populate('owner', 'name email profileImage');
  res.json(teams);
});

module.exports = {
  createOrganisation,
  getMyOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
  inviteMemberToOrg,
  acceptOrgInvite,
  removeMemberFromOrg,
  updateMemberRole,
  getOrgMembers,
  getOrgTeams,
};
