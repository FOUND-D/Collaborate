const asyncHandler = require('../middleware/asyncHandler');
const {
  createMessage,
  listTeamMessages,
  listConversationMessages,
  markMessagesRead,
} = require('../lib/repo');

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

  const messageType = type === 'session_request' ? 'session_request' : 'text';
  const requestPayload = messageType === 'session_request' ? (sessionRequest || session_request || {
    skill: req.body.skill,
    proposed_time: req.body.proposed_time,
    credits: req.body.credits,
    listing_id: req.body.listing_id,
  }) : null;
  const hasTeamTarget = Boolean(teamId);
  const hasDirectTarget = Boolean(conversationId || recipientId);

  if ((hasTeamTarget && hasDirectTarget) || (!hasTeamTarget && !hasDirectTarget)) {
    return res.status(400).json({ message: 'Provide either a team target or a direct-message target' });
  }

  if (messageType === 'session_request') {
    if (!requestPayload?.skill || !requestPayload?.proposed_time || requestPayload?.credits === undefined || !requestPayload?.listing_id) {
      return res.status(400).json({ message: 'session_request requires skill, proposed_time, credits, and listing_id' });
    }
  } else if (!content) {
    return res.status(400).json({ message: 'content is required' });
  }

  const message = await createMessage({
    senderId: req.user._id,
    content,
    teamId: teamId || null,
    conversationId: conversationId || null,
    recipientId: recipientId || null,
    messageType,
    sessionRequest: requestPayload,
  });

  emitMessage(req, message);
  res.status(201).json(message);
});

const getTeamMessages = asyncHandler(async (req, res) => {
  res.json(await listTeamMessages(req.params.teamId));
});

const getConversationMessages = asyncHandler(async (req, res) => {
  res.json(await listConversationMessages(req.params.conversationId));
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  await markMessagesRead({ userId: req.user._id, messageIds: req.body.messageIds || [] });
  res.json({ message: 'Messages marked as read' });
});

module.exports = { sendMessage, getTeamMessages, getConversationMessages, markMessagesAsRead };
