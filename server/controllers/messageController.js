const asyncHandler = require('../middleware/asyncHandler');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content, teamId, conversationId, recipientId } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  let message;

  if (teamId) {
    // Sending a message to a team
    message = await Message.create({
      sender: req.user._id,
      content,
      team: teamId,
    });
  } else if (recipientId) {
    // Sending a direct message
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
      });
    }

    message = await Message.create({
      sender: req.user._id,
      content,
      conversation: conversation._id,
    });
  } else if (conversationId) {
    // Sending a message to an existing conversation
    message = await Message.create({
        sender: req.user._id,
        content,
        conversation: conversationId,
    });
  } else {
    res.status(400);
    throw new Error('Either teamId, recipientId, or conversationId is required');
  }

  // Populate sender details for the response
  const populatedMessage = await Message.findById(message._id).populate('sender', 'name email');

  res.status(201).json(populatedMessage);
});

// @desc    Get all messages for a team
// @route   GET /api/messages/team/:teamId
// @access  Private
const getTeamMessages = asyncHandler(async (req, res) => {
    const messages = await Message.find({ team: req.params.teamId })
        .populate('sender', 'name email')
        .sort({ createdAt: 1 });

    res.json(messages);
});

// @desc    Get all messages for a conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Private
const getConversationMessages = asyncHandler(async (req, res) => {
    const messages = await Message.find({ conversation: req.params.conversationId })
        .populate('sender', 'name email')
        .sort({ createdAt: 1 });

    res.json(messages);
});

// @desc    Mark messages as read
// @route   PUT /api/messages/read
// @access  Private
const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { messageIds } = req.body;

    await Message.updateMany(
        { _id: { $in: messageIds }, readBy: { $ne: req.user._id } },
        { $addToSet: { readBy: req.user._id } }
    );

    res.json({ message: 'Messages marked as read' });
});


module.exports = {
  sendMessage,
  getTeamMessages,
  getConversationMessages,
  markMessagesAsRead,
};