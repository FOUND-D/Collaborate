const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// To distinguish between team chats and DMs
messageSchema.pre('save', async function () {
  if (this.team && this.conversation) {
    throw new Error('Message cannot belong to both a team and a conversation.');
  }
  if (!this.team && !this.conversation) {
    throw new Error('Message must belong to a team or a conversation.');
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
