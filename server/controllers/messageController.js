const asyncHandler = require('../middleware/asyncHandler');
const { supabase } = require('../lib/repo');

const sendMessage = asyncHandler(async (req, res) => {
  const { content, teamId, conversationId, recipientId } = req.body;
  let conversation_id = conversationId || null;
  if (recipientId && !conversation_id) {
    const { data: conv } = await supabase.from('conversations').select('*').or(`participant_a.eq.${req.user._id},participant_b.eq.${req.user._id}`).single();
    conversation_id = conv?.id || null;
    if (!conversation_id) {
      const { data } = await supabase.from('conversations').insert({ participant_a: req.user._id, participant_b: recipientId }).select('*').single();
      conversation_id = data.id;
    }
  }
  const { data, error } = await supabase.from('messages').insert({ sender_id: req.user._id, content, team_id: teamId || null, conversation_id }).select('*').single();
  if (error) throw error;
  res.status(201).json(data);
});

const getTeamMessages = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('messages').select('*').eq('team_id', req.params.teamId).order('created_at', { ascending: true });
  if (error) throw error;
  res.json(data || []);
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', req.params.conversationId).order('created_at', { ascending: true });
  if (error) throw error;
  res.json(data || []);
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  await supabase.from('message_reads').insert((req.body.messageIds || []).map((messageId) => ({ message_id: messageId, user_id: req.user._id })));
  res.json({ message: 'Messages marked as read' });
});

module.exports = { sendMessage, getTeamMessages, getConversationMessages, markMessagesAsRead };
