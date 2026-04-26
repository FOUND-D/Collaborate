import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import io from 'socket.io-client';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { SOCKET_URL } from '../config/runtime';
import '../styles/workspace.css';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const VideoPlayer = memo(({ stream, isLocal, isCameraOn, isScreenShare, name, isMicOn }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  const shouldHideVideo = !isCameraOn && !isScreenShare;
  const flipClass = isLocal && !isScreenShare ? 'local-video-flipped' : '';

  return (
    <>
      <video
        ref={(el) => {
          videoRef.current = el;
          if (el) el.muted = isLocal;
        }}
        autoPlay
        playsInline
        className={`${flipClass} ${shouldHideVideo ? 'hidden-video' : ''}`}
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

  const socketRef = useRef(null);
  const userInfoRef = useRef(userInfo);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const joinedRoomRef = useRef(false);

  useEffect(() => {
    userInfoRef.current = userInfo;
  }, [userInfo]);

  const closePeerConnection = useCallback((userId) => {
    const peerConnection = peerConnectionsRef.current[userId];
    if (peerConnection) {
      peerConnection.close();
      delete peerConnectionsRef.current[userId];
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
      },
    });
  }, [id]);

  const createPeerConnection = useCallback((targetUserId, targetSocketId, isInitiator) => {
    if (peerConnectionsRef.current[targetUserId]) {
      return peerConnectionsRef.current[targetUserId];
    }

    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const streamToSend = screenStreamRef.current || localStreamRef.current;

    if (streamToSend) {
      streamToSend.getTracks().forEach((track) => peerConnection.addTrack(track, streamToSend));
    }

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

      setRemoteStreams((prev) => (
        prev.some((streamEntry) => streamEntry.userId === targetUserId)
          ? prev
          : [...prev, { userId: targetUserId, stream: remoteStream }]
      ));
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
  }, []);

  useEffect(() => {
    if (!userInfo?.token) {
      navigate('/login');
      return undefined;
    }

    let isCancelled = false;

    const fetchMeeting = async () => {
      try {
        const { data } = await axios.get(`/api/teams/${id}/sessions`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        if (!isCancelled) {
          setMeeting(data);
          setAgenda(data?.agenda || '');
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
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    const handleParticipantsUpdated = (updatedParticipants) => {
      setParticipants(updatedParticipants);

      const nextStatus = {};
      updatedParticipants.forEach((participant) => {
        if (participant._id !== userInfoRef.current?._id) {
          nextStatus[participant._id] = {
            cameraOn: participant.cameraOn || false,
            micOn: participant.micOn || false,
            isSharingScreen: participant.isSharingScreen || false,
          };
        }
      });
      setRemoteMediaStatus(nextStatus);
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
      users.forEach((user) => createPeerConnection(user.userId, user.socketId, true));
    };

    const handleOffer = async ({ senderSocketId, sdp, senderUserId }) => {
      if (!sdp) return;
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
      setRemoteMediaStatus((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || {}), isSharingScreen: true },
      }));
      setMainScreenUserId(userId);
    };

    const handleStopSharingScreen = ({ userId }) => {
      setRemoteMediaStatus((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || {}), isSharingScreen: false },
      }));
      setMainScreenUserId((current) => (current === userId ? null : current));
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
  }, [closePeerConnection, createPeerConnection, hasJoinedSession, id, joinRoom, userInfo?.token]);

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

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (cameraTrack) {
      Object.values(peerConnectionsRef.current).forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find((item) => item.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      });
    }

    setIsSharingScreen(false);
    setMainScreenUserId(null);

    socketRef.current?.emit('stop-sharing-screen', {
      userId: userInfoRef.current?._id,
    });
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      setScreenStream(stream);

      const screenTrack = stream.getVideoTracks()[0];
      Object.values(peerConnectionsRef.current).forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find((item) => item.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      screenTrack.onended = stopScreenShare;

      setIsSharingScreen(true);
      setMainScreenUserId(userInfoRef.current?._id || null);

      socketRef.current?.emit('sharing-screen', {
        userId: userInfoRef.current?._id,
      });
    } catch (error) {
      console.error('Screen share error:', error);
    }
  }, [stopScreenShare]);

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
      const { data } = await axios.patch(
        `/api/teams/${id}/sessions/${meeting._id}/agenda`,
        { agenda },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setMeeting(data);
      setAgenda(data?.agenda || '');
      setHasJoinedSession(true);
    } catch (error) {
      setSessionError(error.response?.data?.message || 'Failed to save the session agenda.');
    } finally {
      setIsJoining(false);
    }
  }, [agenda, id, meeting?._id, userInfo?.token]);

  const renderTile = (stream, userId, isLocal) => {
    const isCam = isLocal ? isCameraOn : remoteMediaStatus[userId]?.cameraOn;
    const isMic = isLocal ? isMicOn : remoteMediaStatus[userId]?.micOn;
    const isShare = isLocal ? false : remoteMediaStatus[userId]?.isSharingScreen;

    let name = 'Guest';
    if (isLocal) {
      name = 'You';
    } else {
      const participant = participants.find((entry) => entry._id === userId);
      if (participant) {
        name = participant.name;
      }
    }

    return (
      <div
        key={userId}
        className={`video-participant-container ${mainScreenUserId === userId ? 'main-screen-share' : ''}`}
      >
        <VideoPlayer
          stream={stream}
          isLocal={isLocal}
          isCameraOn={Boolean(isCam)}
          isScreenShare={Boolean(isShare)}
          name={name}
          isMicOn={Boolean(isMic)}
        />
      </div>
    );
  };

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
            {mainScreenUserId === userInfo?._id && isSharingScreen && (
              <div className="video-participant-container main-screen-share">
                <VideoPlayer
                  stream={screenStream}
                  isLocal={true}
                  isCameraOn={true}
                  isScreenShare={true}
                  name="You (Screen)"
                  isMicOn={false}
                />
              </div>
            )}

            {remoteStreams.map((remoteStream) => (
              remoteStream.userId === mainScreenUserId
                ? renderTile(remoteStream.stream, remoteStream.userId, false)
                : null
            ))}

            <div className="video-sidebar">
              {mainScreenUserId !== userInfo?._id && renderTile(localStream, 'local', true)}
              {remoteStreams.map((remoteStream) => (
                remoteStream.userId !== mainScreenUserId
                  ? renderTile(remoteStream.stream, remoteStream.userId, false)
                  : null
              ))}
            </div>
          </>
        )}

        {!mainScreenUserId && (
          <>
            {renderTile(localStream, 'local', true)}
            {isSharingScreen && (
              <div className="video-participant-container">
                <VideoPlayer
                  stream={screenStream}
                  isLocal={true}
                  isCameraOn={true}
                  isScreenShare={true}
                  name="You (Screen)"
                  isMicOn={false}
                />
              </div>
            )}
            {remoteStreams.map((remoteStream) => renderTile(remoteStream.stream, remoteStream.userId, false))}
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
        <button className="btn btn-danger workspace-btn workspace-btn-danger" onClick={leaveMeeting} type="button">
          Leave
        </button>
      </div>
    </div>
  );
};

export default MeetingScreen;
