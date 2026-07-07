const asyncHandler = require('../middleware/asyncHandler');
const { supabase, toPublicMeeting } = require('../lib/repo');
const Groq = require('groq-sdk');

const generateRoomId = () => Math.random().toString(36).substring(2, 15);
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const getSessionById = async (meetingId) => {
  const { data, error } = await supabase.from('sessions').select('*').eq('id', meetingId).maybeSingle();
  if (error) throw error;
  return data;
};

const startMeeting = asyncHandler(async (req, res) => {
  if (!req.params.teamId) {
    return res.status(400).json({ message: 'teamId is required to start a session' });
  }
  const { data, error } = await supabase.from('sessions').insert({
    team_id: req.params.teamId,
    room_id: generateRoomId(),
    status: 'active',
    started_by: req.user._id,
    agenda: req.body.agenda || '',
  }).select('*').single();
  if (error) throw error;
  const session = toPublicMeeting(data);
  req.io.to(req.params.teamId).emit('sessionStarted', session);
  req.io.to(req.params.teamId).emit('meetingStarted', session);
  
  // Emit to user's personal room to refresh sessions list
  req.io.to(req.user._id).emit('sessionCreated', session);

  // Trigger Notifications to all other team members
  try {
    const { sendNotification } = require('../services/notificationService');
    const { data: members } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', req.params.teamId);

    if (members) {
      const currentUserId = req.user.id || req.user._id;
      const otherMembers = members.filter(m => m.user_id !== currentUserId);
      for (const member of otherMembers) {
        sendNotification(req.io, {
          userId: member.user_id,
          title: 'Collaboration Session Started',
          message: `${req.user.name || 'A team member'} started an active meeting in your team.`,
          type: 'meeting_started',
          data: { teamId: req.params.teamId, meetingId: data.id }
        });
      }
    }
  } catch (notifErr) {
    console.error('Failed to trigger meeting start notifications:', notifErr.message);
  }
  
  res.status(201).json(session);
});

const getMeeting = asyncHandler(async (req, res) => {
  if (!req.params.teamId) {
    return res.status(400).json({ message: 'teamId is required to fetch an active session' });
  }
  const { data, error } = await supabase.from('sessions').select('*').eq('team_id', req.params.teamId).eq('status', 'active').maybeSingle();
  if (error || !data) return res.status(404).json({ message: 'No active session found' });
  res.json(toPublicMeeting(data));
});

const updateMeetingAgenda = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .update({ agenda: req.body.agenda || '' })
    .eq('id', req.params.meetingId)
    .select('*')
    .single();
  if (error) throw error;
  res.json(toPublicMeeting(data));
});

const summariseMeeting = asyncHandler(async (req, res) => {
  const session = await getSessionById(req.params.meetingId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const transcript = Array.isArray(req.body.transcript) ? req.body.transcript.join('\n') : String(req.body.transcript || '').trim();
  const chatLogFromBody = Array.isArray(req.body.chatLog) ? req.body.chatLog.join('\n') : String(req.body.chatLog || '').trim();

  let chatLog = chatLogFromBody;
  if (!chatLog) {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('content')
      .eq('team_id', session.team_id)
      .gte('created_at', session.created_at)
      .order('created_at', { ascending: true });
    if (error) throw error;
    chatLog = (messages || []).map((message) => message.content).join('\n');
  }

  if (!groq) {
    return res.json({
      summary: transcript || chatLog
        ? `Session summary unavailable because GROQ_API_KEY is not configured. Agenda: ${session.agenda || 'None provided'}.`
        : 'Session summary unavailable because GROQ_API_KEY is not configured and no transcript or chat log was provided.',
    });
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Summarise an academic collaboration session. Produce a concise summary with agenda coverage, key decisions, action items, and unresolved questions.',
      },
      {
        role: 'user',
        content: `Agenda:\n${session.agenda || 'No agenda provided'}\n\nTranscript:\n${transcript || 'No transcript provided'}\n\nChat log:\n${chatLog || 'No chat log provided'}`,
      },
    ],
    temperature: 0.3,
  });

  res.json({ summary: completion.choices?.[0]?.message?.content?.trim() || 'No summary generated.' });
});

const endMeeting = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('sessions').update({ status: 'inactive' }).eq('id', req.params.meetingId).select('*').single();
  if (error) throw error;
  const session = toPublicMeeting(data);
  const teamId = req.params.teamId || data.team_id;
  if (teamId) {
    req.io.to(teamId).emit('sessionEnded', session);
    req.io.to(teamId).emit('meetingEnded', session);
  }
  res.json(session);
});

module.exports = { startMeeting, getMeeting, updateMeetingAgenda, summariseMeeting, endMeeting };
