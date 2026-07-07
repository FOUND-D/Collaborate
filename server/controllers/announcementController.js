const { supabase } = require('../lib/repo');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = asyncHandler(async (req, res) => {
  const { team_id, page = 1 } = req.query;
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('announcements')
    .select('*, users!author_id(id, name, profile_image), announcement_rsvps(user_id)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (team_id) {
    query = query.eq('team_id', team_id);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const announcements = (data || []).map(a => ({
    id: a.id,
    _id: a.id,
    title: a.title,
    body: a.body,
    eventDate: a.event_date,
    authorId: a.author_id,
    authorName: a.users?.name,
    authorImage: a.users?.profile_image,
    teamId: a.team_id,
    createdAt: a.created_at,
    rsvpCount: a.announcement_rsvps?.length || 0,
    hasRsvped: (a.announcement_rsvps || []).some(r => r.user_id === req.user.id),
  }));

  res.json({
    announcements,
    total: count,
    page: Number(page),
    pages: Math.ceil(count / limit),
  });
});

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Private/Faculty
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, body, event_date, team_id } = req.body;

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body,
      event_date: event_date || null,
      team_id: team_id || null,
      author_id: req.user.id,
    })
    .select('*, users!author_id(id, name, profile_image)')
    .single();

  if (error) throw error;

  const announcement = {
    id: data.id,
    _id: data.id,
    title: data.title,
    body: data.body,
    eventDate: data.event_date,
    authorId: data.author_id,
    authorName: data.users?.name,
    authorImage: data.users?.profile_image,
    teamId: data.team_id,
    createdAt: data.created_at,
    rsvpCount: 0,
    hasRsvped: false,
  };

  // Emit socket event
  if (req.io) {
    req.io.emit('newAnnouncement', announcement);
  }

  // Trigger Notifications for Announcement
  try {
    const { sendNotification } = require('../services/notificationService');
    if (data.team_id) {
      // Notify all team members
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', data.team_id);
      
      if (members) {
        const otherMembers = members.filter(m => m.user_id !== req.user.id);
        for (const member of otherMembers) {
          sendNotification(req.io, {
            userId: member.user_id,
            title: `New Team Announcement`,
            message: `New team announcement: "${data.title}"`,
            type: 'announcement',
            data: { announcementId: data.id, teamId: data.team_id }
          });
        }
      }
    } else {
      // Notify all users (global announcement)
      const { data: users } = await supabase.from('users').select('id');
      if (users) {
        const otherUsers = users.filter(u => u.id !== req.user.id);
        for (const user of otherUsers) {
          sendNotification(req.io, {
            userId: user.id,
            title: `New Global Announcement`,
            message: `New global announcement: "${data.title}"`,
            type: 'announcement',
            data: { announcementId: data.id }
          });
        }
      }
    }
  } catch (notifErr) {
    console.error('Failed to trigger announcement notifications:', notifErr.message);
  }

  res.status(201).json(announcement);
});

// @desc    Toggle RSVP for announcement
// @route   POST /api/announcements/:id/rsvp
// @access  Private
const toggleRsvp = asyncHandler(async (req, res) => {
  const announcement_id = req.params.id;
  const user_id = req.user.id;

  // Check if RSVP exists
  const { data: existing, error: checkError } = await supabase
    .from('announcement_rsvps')
    .select('*')
    .eq('announcement_id', announcement_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (checkError) throw checkError;

  let rsvped = false;
  if (existing) {
    // Remove RSVP
    const { error: removeError } = await supabase
      .from('announcement_rsvps')
      .delete()
      .eq('announcement_id', announcement_id)
      .eq('user_id', user_id);
    if (removeError) throw removeError;
    rsvped = false;
  } else {
    // Add RSVP
    const { error: addError } = await supabase
      .from('announcement_rsvps')
      .insert({ announcement_id, user_id });
    if (addError) throw addError;
    rsvped = true;
  }

  // Get new count
  const { count, error: countError } = await supabase
    .from('announcement_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('announcement_id', announcement_id);

  if (countError) throw countError;

  res.json({ rsvped, count });
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { data: announcement, error: getError } = await supabase
    .from('announcements')
    .select('author_id')
    .eq('id', req.params.id)
    .maybeSingle();

  if (getError) throw getError;
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  // Only author or admin can delete
  if (announcement.author_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this announcement');
  }

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;

  res.json({ message: 'Announcement removed' });
});

module.exports = {
  getAnnouncements,
  createAnnouncement,
  toggleRsvp,
  deleteAnnouncement,
};
