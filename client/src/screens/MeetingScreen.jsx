import React, { Fragment, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createSocketConnection } from '../utils/socket';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import api from '../utils/api';
import '../styles/workspace.css';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const isScreenShareTrack = (track) => {
  if (!track || track.kind !== 'video') return false;

  const label = track.label?.toLowerCase() || '';
  if (label.includes('screen') || label.includes('window') || label.includes('display')) {
    return true;
  }

  try {
    const settings = track.getSettings();
    if (settings.displaySurface) return true;
  } catch {
    // getSettings may fail on some browsers
  }

  return track.contentHint === 'detail' || track.contentHint === 'text';
};

const hasVisibleVideo = (stream) => {
  if (!stream) return false;
  return stream.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled);
};

const VideoPlayer = memo(({ stream, isLocal, isCameraOn, isScreenShare, name, isMicOn }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  const shouldHideVideo = !isScreenShare && !isCameraOn && !hasVisibleVideo(stream);
  const flipClass = isLocal && !isScreenShare ? 'local-video-flipped' : '';
  const videoFitClass = isScreenShare ? 'screen-share-video' : '';

  return (
    <>
      <video
        ref={(el) => {
          videoRef.current = el;
          if (el) el.muted = isLocal;
        }}
        autoPlay
        playsInline
        className={`${flipClass} ${videoFitClass} ${shouldHideVideo ? 'hidden-video' : ''}`}
      />
      {shouldHideVideo && (
        <div className="video-overlay-icon">
          <FaVideoSlash size={50} />
        </div>
      )}
      <div className="participant-name">
        {name}
        {isScreenShare && ' (Screen)'}
        <span className="media-status-icons">
          {!isCameraOn && !isScreenShare && <FaVideoSlash size={10} />}
          {!isMicOn && <FaMicrophoneSlash size={10} />}
        </span>
      </div>
    </>
  );
});

const MeetingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [remoteMediaStatus, setRemoteMediaStatus] = useState({});
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [mainScreenUserId, setMainScreenUserId] = useState(null);
  const [agenda, setAgenda] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoinedSession, setHasJoinedSession] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');
  const [isSummarising, setIsSummarising] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const socketRef = useRef(null);
  const userInfoRef = useRef(userInfo);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const peerSocketIdsRef = useRef({});
  const joinedRoomRef = useRef(false);

  const getParticipantName = useCallback((userId) => {
    if (userId === 'local') return 'You';
    const participant = participants.find((entry) => entry._id === userId);
    return participant?.name || 'Guest';
  }, [participants]);

  const addLocalTracksToPeer = useCallback((peerConnection) => {
    const local = localStreamRef.current;
    if (local) {
      local.getTracks().forEach((track) => peerConnection.addTrack(track, local));
    }

    const screen = screenStreamRef.current;
    if (screen) {
      screen.getVideoTracks().forEach((track) => peerConnection.addTrack(track, screen));
    }
  }, []);

  const findScreenSender = (peerConnection) => (
    peerConnection.getSenders().find((sender) => isScreenShareTrack(sender.track))
  );

  useEffect(() => {
    userInfoRef.current = userInfo;
  }, [userInfo]);

  const closePeerConnection = useCallback((userId) => {
    const peerConnection = peerConnectionsRef.current[userId];
    if (peerConnection) {
      peerConnection.close();
      delete peerConnectionsRef.current[userId];
    }
    delete peerSocketIdsRef.current[userId];
  }, []);

  const summariseSession = useCallback(async (meetingId) => {
    if (!meetingId) return;
    setIsSummarising(true);
    try {
      const { data } = await api.post(`/api/meetings/${meetingId}/summarise`, {});
      setSessionSummary(data?.summary || 'No summary generated.');
    } catch (error) {
      setSessionSummary(error.response?.data?.message || 'Failed to generate the session summary.');
    } finally {
      setIsSummarising(false);
    }
  }, []);

  const joinRoom = useCallback(() => {
    const socket = socketRef.current;
    const currentUser = userInfoRef.current;

    if (!socket || !currentUser || !localStreamRef.current || !socket.connected || joinedRoomRef.current) {
      return;
    }

    joinedRoomRef.current = true;
    socket.emit('joinTeamRoom', id);
    socket.emit('userJoined', {
      teamId: id,
      user: {
        ...currentUser,
        socketId: socket.id,
        cameraOn: false,
        micOn: false,
        isSharingScreen: Boolean(screenStreamRef.current),
      },
    });
  }, [id]);

  const renegotiatePeerConnection = useCallback(async (targetUserId, targetSocketId) => {
    const peerConnection = peerConnectionsRef.current[targetUserId];
    const socket = socketRef.current;
    if (!peerConnection || !socket || !targetSocketId) return;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', {
        target: targetSocketId,
        sdp: peerConnection.localDescription,
        senderUserId: userInfoRef.current?._id,
        targetUserId,
        senderSocketId: socket.id,
      });
    } catch (error) {
      console.error('WebRTC renegotiation error:', error);
    }
  }, []);

  const updateRemoteScreenShareState = useCallback((userId, sharing) => {
    setRemoteMediaStatus((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), isSharingScreen: sharing },
    }));
    if (sharing) {
      setMainScreenUserId(userId);
    } else {
      setMainScreenUserId((current) => (current === userId ? null : current));
    }
  }, []);

  const upsertRemoteMedia = useCallback((userId, track, stream) => {
    if (!stream) return;

    const isScreen = isScreenShareTrack(track);

    setRemoteStreams((prev) => {
      const existing = prev.find((entry) => entry.userId === userId);
      const nextEntry = existing
        ? { ...existing }
        : { userId, cameraStream: null, screenStream: null };

      if (isScreen) {
        nextEntry.screenStream = stream;
      } else if (track.kind === 'video') {
        nextEntry.cameraStream = stream;
      } else if (track.kind === 'audio' && !nextEntry.cameraStream) {
        nextEntry.cameraStream = stream;
      }

      if (existing) {
        return prev.map((entry) => (entry.userId === userId ? nextEntry : entry));
      }
      return [...prev, nextEntry];
    });

    if (isScreen) {
      updateRemoteScreenShareState(userId, true);
      track.onended = () => {
        updateRemoteScreenShareState(userId, false);
        setRemoteStreams((prev) => (
          prev.map((entry) => (
            entry.userId === userId ? { ...entry, screenStream: null } : entry
          ))
        ));
      };
    }
  }, [updateRemoteScreenShareState]);

  const createPeerConnection = useCallback((targetUserId, targetSocketId, isInitiator) => {
    if (peerConnectionsRef.current[targetUserId]) {
      return peerConnectionsRef.current[targetUserId];
    }

    peerSocketIdsRef.current[targetUserId] = targetSocketId;

    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    addLocalTracksToPeer(peerConnection);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          target: targetSocketId,
          candidate: event.candidate,
          senderUserId: userInfoRef.current?._id,
          targetUserId,
          senderSocketId: socketRef.current.id,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;

      upsertRemoteMedia(targetUserId, event.track, remoteStream);
      event.track.onunmute = () => upsertRemoteMedia(targetUserId, event.track, remoteStream);
    };

    peerConnectionsRef.current[targetUserId] = peerConnection;

    if (isInitiator) {
      peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          if (!socketRef.current || !peerConnection.localDescription) return;

          socketRef.current.emit('offer', {
            target: targetSocketId,
            sdp: peerConnection.localDescription,
            senderUserId: userInfoRef.current?._id,
            targetUserId,
            senderSocketId: socketRef.current.id,
          });
        })
        .catch((error) => {
          console.error('WebRTC offer error:', error);
        });
    }

    return peerConnection;
  }, [addLocalTracksToPeer, upsertRemoteMedia]);

  useEffect(() => {
    if (!userInfo?.token) {
      navigate('/login');
      return undefined;
    }

    let isCancelled = false;

    const fetchMeeting = async () => {
      try {
        const { data } = await api.get(`/api/teams/${id}/sessions`);
        if (!isCancelled) {
          setMeeting(data);
          setAgenda(data?.agenda || '');
          setSessionEnded(false);
          setSessionSummary('');
        }
      } catch (error) {
        if (!isCancelled) {
          setSessionError('No active session found for this team.');
          console.error('Failed to fetch session', error);
        }
      }
    };

    fetchMeeting();

    return () => {
      isCancelled = true;
    };
  }, [id, navigate, userInfo?.token]);

  useEffect(() => {
    if (!hasJoinedSession || !userInfo?.token) {
      return undefined;
    }

    let isCancelled = false;
    const socket = createSocketConnection();
    socketRef.current = socket;

    const handleParticipantsUpdated = (updatedParticipants) => {
      setParticipants(updatedParticipants);

      const nextStatus = {};
      let activeSharer = null;
      updatedParticipants.forEach((participant) => {
        if (participant._id !== userInfoRef.current?._id) {
          nextStatus[participant._id] = {
            cameraOn: participant.cameraOn || false,
            micOn: participant.micOn || false,
            isSharingScreen: participant.isSharingScreen || false,
          };
          if (participant.isSharingScreen) {
            activeSharer = participant._id;
          }
        }
      });
      setRemoteMediaStatus(nextStatus);
      if (activeSharer) {
        setMainScreenUserId(activeSharer);
      }
    };

    const handleUserDisconnected = ({ userId }) => {
      closePeerConnection(userId);
      setRemoteStreams((prev) => prev.filter((streamEntry) => streamEntry.userId !== userId));
      setRemoteMediaStatus((prev) => {
        if (!prev[userId]) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    const handleOtherUsers = (users) => {
      users.forEach((user) => {
        if (user.isSharingScreen) {
          updateRemoteScreenShareState(user.userId, true);
        }
        createPeerConnection(user.userId, user.socketId, true);
      });
    };

    const handleOffer = async ({ senderSocketId, sdp, senderUserId }) => {
      if (!sdp) return;
      peerSocketIdsRef.current[senderUserId] = senderSocketId;
      const peerConnection = createPeerConnection(senderUserId, senderSocketId, false);
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('answer', {
        target: senderSocketId,
        sdp: peerConnection.localDescription,
        senderUserId: userInfoRef.current?._id,
        targetUserId: senderUserId,
        senderSocketId: socket.id,
      });
    };

    const handleAnswer = async ({ sdp, senderUserId }) => {
      const peerConnection = peerConnectionsRef.current[senderUserId];
      if (peerConnection && sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const handleIceCandidate = async ({ candidate, senderUserId }) => {
      const peerConnection = peerConnectionsRef.current[senderUserId];
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleCameraToggle = ({ userId, cameraOn }) => {
      setRemoteMediaStatus((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || {}), cameraOn },
      }));
    };

    const handleMicToggle = ({ userId, micOn }) => {
      setRemoteMediaStatus((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || {}), micOn },
      }));
    };

    const handleSharingScreen = ({ userId }) => {
      updateRemoteScreenShareState(userId, true);
    };

    const handleStopSharingScreen = ({ userId }) => {
      updateRemoteScreenShareState(userId, false);
      setRemoteStreams((prev) => (
        prev.map((entry) => (
          entry.userId === userId ? { ...entry, screenStream: null } : entry
        ))
      ));
    };

    const handleSessionEnded = async (endedSession) => {
      setMeeting(endedSession || null);
      setHasJoinedSession(false);
      setSessionEnded(true);
      await summariseSession(endedSession?._id || meeting?._id);
    };

    socket.on('connect', joinRoom);
    socket.on('participantsUpdated', handleParticipantsUpdated);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('other-users', handleOtherUsers);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('camera-toggled', handleCameraToggle);
    socket.on('toggle-camera', handleCameraToggle);
    socket.on('mic-toggled', handleMicToggle);
    socket.on('toggle-mic', handleMicToggle);
    socket.on('sharing-screen', handleSharingScreen);
    socket.on('stop-sharing-screen', handleStopSharingScreen);
    socket.on('sessionEnded', handleSessionEnded);

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });

        if (!isCancelled) {
          setLocalStream(stream);
          localStreamRef.current = stream;
          setIsMicOn(false);
          setIsCameraOn(false);
          joinRoom();
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Media init error:', error);
          alert('Could not access camera or microphone. Please allow permissions.');
        }
      }
    };

    initMedia();

    return () => {
      isCancelled = true;
      joinedRoomRef.current = false;

      socket.off('connect', joinRoom);
      socket.off('participantsUpdated', handleParticipantsUpdated);
      socket.off('user-disconnected', handleUserDisconnected);
      socket.off('other-users', handleOtherUsers);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('camera-toggled', handleCameraToggle);
      socket.off('toggle-camera', handleCameraToggle);
      socket.off('mic-toggled', handleMicToggle);
      socket.off('toggle-mic', handleMicToggle);
      socket.off('sharing-screen', handleSharingScreen);
      socket.off('stop-sharing-screen', handleStopSharingScreen);
      socket.off('sessionEnded', handleSessionEnded);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      Object.values(peerConnectionsRef.current).forEach((peerConnection) => peerConnection.close());
      peerConnectionsRef.current = {};

      socket.disconnect();
      socketRef.current = null;
    };
  }, [closePeerConnection, createPeerConnection, hasJoinedSession, id, joinRoom, meeting?._id, renegotiatePeerConnection, summariseSession, updateRemoteScreenShareState, userInfo?.token]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track || !socketRef.current) return;

    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
    socketRef.current.emit('toggle-camera', {
      userId: userInfoRef.current?._id,
      cameraOn: track.enabled,
    });
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track || !socketRef.current) return;

    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
    socketRef.current.emit('toggle-mic', {
      userId: userInfoRef.current?._id,
      micOn: track.enabled,
    });
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);

    const peerEntries = Object.entries(peerConnectionsRef.current);
    for (const [targetUserId, peerConnection] of peerEntries) {
      const screenSender = findScreenSender(peerConnection);
      if (screenSender) {
        peerConnection.removeTrack(screenSender);
        await renegotiatePeerConnection(targetUserId, peerSocketIdsRef.current[targetUserId]);
      }
    }

    setIsSharingScreen(false);
    setMainScreenUserId((current) => (
      current === userInfoRef.current?._id ? null : current
    ));

    socketRef.current?.emit('stop-sharing-screen', {
      userId: userInfoRef.current?._id,
    });
  }, [renegotiatePeerConnection]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      setScreenStream(stream);

      const screenTrack = stream.getVideoTracks()[0];
      const peerEntries = Object.entries(peerConnectionsRef.current);

      for (const [targetUserId, peerConnection] of peerEntries) {
        if (!findScreenSender(peerConnection)) {
          peerConnection.addTrack(screenTrack, stream);
          await renegotiatePeerConnection(targetUserId, peerSocketIdsRef.current[targetUserId]);
        }
      }

      screenTrack.onended = stopScreenShare;

      setIsSharingScreen(true);
      setMainScreenUserId(userInfoRef.current?._id || null);

      socketRef.current?.emit('sharing-screen', {
        userId: userInfoRef.current?._id,
      });
    } catch (error) {
      console.error('Screen share error:', error);
    }
  }, [renegotiatePeerConnection, stopScreenShare]);

  const leaveMeeting = useCallback(() => {
    socketRef.current?.emit('userLeft', {
      teamId: id,
      user: userInfoRef.current,
    });
    navigate(`/team/${id}`);
  }, [id, navigate]);

  const joinSession = useCallback(async () => {
    if (!meeting?._id || !userInfo?.token) return;

    setIsJoining(true);
    setSessionError('');

    try {
      const { data } = await api.patch(`/api/meetings/${meeting._id}/agenda`, { agenda });
      setMeeting(data);
      setAgenda(data?.agenda || '');
      setSessionEnded(false);
      setHasJoinedSession(true);
    } catch (error) {
      setSessionError(error.response?.data?.message || 'Failed to save the session agenda.');
    } finally {
      setIsJoining(false);
    }
  }, [agenda, meeting?._id, userInfo?.token]);

  const endSession = useCallback(async () => {
    if (!meeting?._id) return;
    setSessionError('');
    try {
      await api.put(`/api/meetings/${meeting._id}`, {});
    } catch (error) {
      setSessionError(error.response?.data?.message || 'Failed to end the session.');
    }
  }, [meeting?._id]);

  const renderCameraTile = (userId, isLocal, stream) => {
    const isCam = isLocal ? isCameraOn : remoteMediaStatus[userId]?.cameraOn;
    const isMic = isLocal ? isMicOn : remoteMediaStatus[userId]?.micOn;
    const name = getParticipantName(userId);

    return (
      <div key={`${userId}-camera`} className="video-participant-container">
        <VideoPlayer
          stream={stream}
          isLocal={isLocal}
          isCameraOn={Boolean(isCam)}
          isScreenShare={false}
          name={name}
          isMicOn={Boolean(isMic)}
        />
      </div>
    );
  };

  const renderScreenTile = (userId, isLocal, stream, options = {}) => {
    const { isMain = false } = options;
    const isMic = isLocal ? isMicOn : remoteMediaStatus[userId]?.micOn;
    const name = isLocal ? 'You (Screen)' : `${getParticipantName(userId)} (Screen)`;

    return (
      <div
        key={`${userId}-screen`}
        className={`video-participant-container ${isMain ? 'main-screen-share' : ''}`}
      >
        <VideoPlayer
          stream={stream}
          isLocal={isLocal}
          isCameraOn={true}
          isScreenShare={true}
          name={name}
          isMicOn={Boolean(isMic)}
        />
      </div>
    );
  };

  if (!hasJoinedSession && sessionEnded) {
    return (
      <div className="meeting-screen-container">
        <div className="meeting-header workspace-surface">
          <h1 className="workspace-page-title">Session complete</h1>
          <p className="workspace-page-subtitle">The live session has ended. Review the generated summary below.</p>
        </div>

        <div className="workspace-surface" style={{ padding: '24px', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
          {isSummarising ? (
            <p style={{ color: '#cbd5e1' }}>Generating session summary...</p>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', lineHeight: 1.6 }}>
              {sessionSummary || 'No summary available.'}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="btn workspace-btn workspace-btn-secondary" type="button" onClick={() => navigate(`/team/${id}`)}>
              Back to Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasJoinedSession) {
    return (
      <div className="meeting-screen-container">
        <div className="meeting-header workspace-surface">
          <h1 className="workspace-page-title">{meeting ? `Session: ${meeting.roomId}` : 'Session setup'}</h1>
          <p className="workspace-page-subtitle">
            {meeting ? 'Add the agenda before joining the live session.' : 'Preparing the live session.'}
          </p>
        </div>

        <div className="workspace-surface" style={{ padding: '24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          {sessionError && (
            <div style={{ marginBottom: '14px', color: '#fda4af' }}>{sessionError}</div>
          )}
          <label htmlFor="session-agenda" style={{ display: 'block', marginBottom: '8px', color: '#f1f5f9', fontWeight: 600 }}>
            Session Agenda
          </label>
          <textarea
            id="session-agenda"
            value={agenda}
            onChange={(event) => setAgenda(event.target.value)}
            placeholder="Add the goal, discussion points, or outcomes for this session."
            rows={5}
            style={{
              width: '100%',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(8,10,12,0.72)',
              color: '#f8fafc',
              padding: '14px 16px',
              resize: 'vertical',
              marginBottom: '16px',
            }}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn workspace-btn workspace-btn-secondary" type="button" onClick={() => navigate(`/team/${id}`)}>
              Back to Team
            </button>
            <button className="btn btn-primary workspace-btn" type="button" onClick={joinSession} disabled={!meeting || isJoining}>
              {isJoining ? 'Joining Session...' : 'Join Session'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-screen-container">
      <div className="meeting-header workspace-surface">
        <h1 className="workspace-page-title">{meeting ? `Session: ${meeting.roomId}` : 'Connecting to session...'}</h1>
        <p className="workspace-page-subtitle">{participants.length} Active Participants</p>
      </div>

      <div className={`video-grid-container ${mainScreenUserId ? 'has-main-screen' : ''}`}>
        {mainScreenUserId && (
          <>
            {mainScreenUserId === userInfo?._id && isSharingScreen && screenStream && (
              renderScreenTile('local', true, screenStream, { isMain: true })
            )}

            {remoteStreams.map((remoteEntry) => (
              remoteEntry.userId === mainScreenUserId && remoteEntry.screenStream
                ? renderScreenTile(remoteEntry.userId, false, remoteEntry.screenStream, { isMain: true })
                : null
            ))}

            <div className="video-sidebar">
              {renderCameraTile('local', true, localStream)}
              {remoteStreams.map((remoteEntry) => (
                renderCameraTile(remoteEntry.userId, false, remoteEntry.cameraStream)
              ))}
            </div>
          </>
        )}

        {!mainScreenUserId && (
          <>
            {renderCameraTile('local', true, localStream)}
            {isSharingScreen && screenStream && renderScreenTile('local', true, screenStream)}
            {remoteStreams.map((remoteEntry) => (
              <Fragment key={remoteEntry.userId}>
                {renderCameraTile(remoteEntry.userId, false, remoteEntry.cameraStream)}
                {remoteEntry.screenStream && remoteMediaStatus[remoteEntry.userId]?.isSharingScreen
                  ? renderScreenTile(remoteEntry.userId, false, remoteEntry.screenStream)
                  : null}
              </Fragment>
            ))}
          </>
        )}
      </div>

      <div className="meeting-controls workspace-surface">
        {meeting?.agenda && (
          <div style={{ width: '100%', color: 'rgba(241,245,249,0.82)', marginBottom: '12px' }}>
            <strong style={{ color: '#f8fafc' }}>Session Agenda:</strong> {meeting.agenda}
          </div>
        )}
        <button className={`btn workspace-btn ${isCameraOn ? 'workspace-btn-secondary' : 'btn-danger workspace-btn-danger'}`} onClick={toggleCamera} type="button">
          {isCameraOn ? <><FaVideo /> Stop Video</> : <><FaVideoSlash /> Start Video</>}
        </button>
        <button className={`btn workspace-btn ${isMicOn ? 'workspace-btn-secondary' : 'btn-danger workspace-btn-danger'}`} onClick={toggleMic} type="button">
          {isMicOn ? <><FaMicrophone /> Mute</> : <><FaMicrophoneSlash /> Unmute</>}
        </button>
        <button className="btn workspace-btn workspace-btn-secondary" onClick={isSharingScreen ? stopScreenShare : startScreenShare} type="button">
          {isSharingScreen ? 'Stop Sharing' : 'Share Screen'}
        </button>
        {meeting?.startedBy === userInfo?._id && (
          <button className="btn btn-danger workspace-btn workspace-btn-danger" onClick={endSession} type="button">
            End Session
          </button>
        )}
        <button className="btn btn-danger workspace-btn workspace-btn-danger" onClick={leaveMeeting} type="button">
          Leave
        </button>
      </div>
    </div>
  );
};

export default MeetingScreen;
