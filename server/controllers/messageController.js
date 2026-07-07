const asyncHandler = require('../middleware/asyncHandler');
const {
  createMessage,
  listUserConversations,
  listTeamMessages,
  listConversationMessages,
  markMessagesRead,
  supabase,
} = require('../lib/repo');
const { sendNotification } = require('../services/notificationService');

/**
 * Ensure a DM conversation exists between two users.
 * The unique constraint uses (participant_a, participant_b) sorted.
 */
const getOrCreateConversation = async (user1, user2) => {
  const [a, b] = [user1, user2].sort();

  // Try to find existing conversation
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  // Create new conversation
  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({ participant_a: a, participant_b: b })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
};

/**
 * Resolve a target ID to a conversation UUID.
 * The target may be either a conversationId or a userId.
 * Returns the conversation UUID, or null if it cannot be resolved.
 */
const resolveConversationId = async (targetId, currentUserId) => {
  if (!targetId) return null;

  // First check: is this already a valid conversation the current user participates in?
  const { data: asConvo } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', targetId)
    .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
    .maybeSingle();

  if (asConvo) return asConvo.id;

  // Second check: is this a user ID? If so, create/get a DM conversation with them
  const { data: asUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', targetId)
    .maybeSingle();

  if (asUser) {
    return await getOrCreateConversation(currentUserId, targetId);
  }

  return null;
};

const emitMessage = (req, message) => {
  if (!req.io || !message) return;

  if (message.teamId) {
    req.io.to(message.teamId).emit('newMessage', message);
    req.io.to(`conversation:${message.teamId}`).emit('newMessage', message);
  }

  if (message.conversationId) {
    req.io.to(`conversation:${message.conversationId}`).emit('newMessage', message);
  }
};

const sendMessage = asyncHandler(async (req, res) => {
  const {
    content,
    teamId,
    conversationId,
    recipientId,
    type,
    sessionRequest,
    session_request,
  } = req.body;

  const currentUserId = req.user._id || req.user.id;
  const messageType = type === 'session_request' ? 'session_request' : 'text';
  const requestPayload = messageType === 'session_request' ? (sessionRequest || session_request || {
    skill: req.body.skill,
    proposed_time: req.body.proposed_time,
    credits: req.body.credits,
    listing_id: req.body.listing_id,
  }) : null;

  const hasTeamTarget = Boolean(teamId);
  // Accept any of conversationId or recipientId as DM target
  const rawTarget = conversationId || recipientId;
  const hasDirectTarget = Boolean(rawTarget);

  if ((hasTeamTarget && hasDirectTarget) || (!hasTeamTarget && !hasDirectTarget)) {
    return res.status(400).json({ message: 'Provide either a teamId or a conversationId/recipientId' });
  }

  if (messageType === 'session_request') {
    if (!requestPayload?.skill || !requestPayload?.proposed_time || requestPayload?.credits === undefined || !requestPayload?.listing_id) {
      return res.status(400).json({ message: 'session_request requires skill, proposed_time, credits, and listing_id' });
    }
  } else if (!content) {
    return res.status(400).json({ message: 'content is required' });
  }

  // Resolve DM conversation ID (handles both userId and conversationId as input)
  let resolvedConversationId = null;
  if (hasDirectTarget) {
    try {
      resolvedConversationId = await resolveConversationId(rawTarget, currentUserId);
    } catch (resolveErr) {
      console.error('[sendMessage] Failed to resolve conversation:', resolveErr.message);
      return res.status(500).json({ message: 'Failed to resolve conversation' });
    }

    if (!resolvedConversationId) {
      return res.status(400).json({ message: 'Could not resolve conversation target' });
    }
  }

  // Security: Block check (only if user_conversation_settings table exists)
  if (resolvedConversationId) {
    try {
      const { data: blockedCheck } = await supabase
        .from('user_conversation_settings')
        .select('user_id')
        .eq('conversation_id', resolvedConversationId)
        .eq('is_blocked', true);

      if (blockedCheck && blockedCheck.length > 0) {
        return res.status(403).json({ message: 'Cannot send message. This conversation is blocked.' });
      }
    } catch (_) {
      // Table may not exist yet — skip block check gracefully
    }
  }

  const message = await createMessage({
    senderId: currentUserId,
    content,
    teamId: teamId || null,
    conversationId: resolvedConversationId,
  });

  emitMessage(req, message);

  // Notifications (fire-and-forget)
  try {
    if (message.conversationId) {
      const { data: convo } = await supabase
        .from('conversations')
        .select('participant_a, participant_b')
        .eq('id', message.conversationId)
        .maybeSingle();

      if (convo) {
        const recipientUserId = convo.participant_a === currentUserId ? convo.participant_b : convo.participant_a;
        sendNotification(req.io, {
          userId: recipientUserId,
          title: `New Message from ${req.user.name}`,
          message: message.content || 'Sent you a message',
          type: 'chat_message',
          data: { conversationId: message.conversationId, senderId: currentUserId },
        });
      }
    } else if (message.teamId) {
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', message.teamId);

      if (members) {
        for (const member of members.filter((m) => m.user_id !== currentUserId)) {
          sendNotification(req.io, {
            userId: member.user_id,
            title: `New Message in Team Chat`,
            message: `${req.user.name}: ${message.content || 'Sent a message'}`,
            type: 'team_message',
            data: { teamId: message.teamId, senderId: currentUserId },
          });
        }
      }
    }
  } catch (notifErr) {
    console.error('[sendMessage] Notification failed:', notifErr.message);
  }

  res.status(201).json(message);
});

const getTeamMessages = asyncHandler(async (req, res) => {
  res.json(await listTeamMessages(req.params.teamId));
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetId = req.params.conversationId;

  let resolvedConvoId;
  try {
    resolvedConvoId = await resolveConversationId(targetId, currentUserId);
  } catch (err) {
    console.error('[getConversationMessages] Resolution failed:', err.message);
    return res.status(500).json({ message: 'Failed to resolve conversation' });
  }

  if (!resolvedConvoId) {
    // Return empty array instead of 404 so chat panel shows empty state
    return res.json([]);
  }

  res.json(await listConversationMessages(resolvedConvoId));
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  await markMessagesRead({ userId: req.user._id, messageIds: req.body.messageIds || [] });
  res.json({ message: 'Messages marked as read' });
});

const getUserConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const convos = await listUserConversations(currentUserId);
  res.json(convos);
});

// ─── Conversation settings ────────────────────────────────────────────────────

const getConversationSettings = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  let conversationId;

  try {
    conversationId = await resolveConversationId(req.params.conversationId, currentUserId);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resolve conversation' });
  }

  if (!conversationId) {
    return res.json({
      is_starred: false,
      is_archived: false,
      is_muted: false,
      is_blocked: false,
      is_blocked_by_other: false,
    });
  }

  try {
    const { data: mySettings } = await supabase
      .from('user_conversation_settings')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('conversation_id', conversationId)
      .maybeSingle();

    const { data: otherSettings } = await supabase
      .from('user_conversation_settings')
      .select('is_blocked')
      .eq('conversation_id', conversationId)
      .neq('user_id', currentUserId)
      .maybeSingle();

    res.json({
      is_starred: mySettings?.is_starred ?? false,
      is_archived: mySettings?.is_archived ?? false,
      is_muted: mySettings?.is_muted ?? false,
      is_blocked: mySettings?.is_blocked ?? false,
      is_blocked_by_other: otherSettings?.is_blocked ?? false,
    });
  } catch (_) {
    // Table may not exist yet
    res.json({
      is_starred: false,
      is_archived: false,
      is_muted: false,
      is_blocked: false,
      is_blocked_by_other: false,
    });
  }
});

const updateConversationSettings = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  let conversationId;

  try {
    conversationId = await resolveConversationId(req.params.conversationId, currentUserId);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resolve conversation' });
  }

  if (!conversationId) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const { isStarred, isArchived, isMuted, isBlocked } = req.body;
  const updates = {};
  if (isStarred !== undefined) updates.is_starred = isStarred;
  if (isArchived !== undefined) updates.is_archived = isArchived;
  if (isMuted !== undefined) updates.is_muted = isMuted;
  if (isBlocked !== undefined) updates.is_blocked = isBlocked;

  try {
    const { data, error } = await supabase
      .from('user_conversation_settings')
      .upsert(
        { user_id: currentUserId, conversation_id: conversationId, ...updates },
        { onConflict: 'user_id,conversation_id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    // If table doesn't exist yet, return the update as-is
    res.json({ user_id: currentUserId, conversation_id: conversationId, ...updates });
  }
});

module.exports = {
  sendMessage,
  getUserConversations,
  getTeamMessages,
  getConversationMessages,
  markMessagesAsRead,
  getConversationSettings,
  updateConversationSettings,
};
