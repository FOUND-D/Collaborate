import React, { useEffect, useState, useRef, memo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

/* =========================================================================
   1. ISOLATED VIDEO COMPONENT
   ========================================================================= */
const VideoPlayer = memo(({ stream, isLocal, isCameraOn, isScreenShare, name, isMicOn }) => {
  const videoRef = useRef(null);

  // Only attach the stream when the stream reference actually changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // CSS Class Logic
  const shouldHideVideo = !isCameraOn && !isScreenShare;
  // For local camera, we flip. Screen share is never flipped. Remote is flipped if it's a camera (convention varies, usually remote is NOT mirrored, but let's stick to existing logic or standard: Remote is usually normal, Local is mirrored).
  // Let's mirror Local Camera only.
  const flipClass = isLocal && !isScreenShare ? "local-video-flipped" : "";

  return (
    <>
      <video
        ref={(el) => {
          videoRef.current = el;
          if (el) el.muted = isLocal; // Mute only local to prevent feedback
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
        {isScreenShare && " (Screen)"}
        <span className="media-status-icons">
          {!isCameraOn && !isScreenShare && <FaVideoSlash size={10} />}
          {!isMicOn && <FaMicrophoneSlash size={10} />}
        </span>
      </div>
    </>
  );
});

/* =========================================================================
   2. MAIN SCREEN COMPONENT
   ========================================================================= */
const MeetingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.userLogin);
  // Refs for state accessed inside event listeners
  const userInfoRef = useRef(userInfo);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  // Track active peer connections in a Ref (stable across renders)
  const peerConnections = useRef({});

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);

  // --- Media States ---
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); // Array of { userId, stream }
  const [remoteMediaStatus, setRemoteMediaStatus] = useState({});

  // Controls
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [mainScreenUserId, setMainScreenUserId] = useState(null);

  // Audio Analysis
  const [speakingUsers, setSpeakingUsers] = useState({});
  const audioContextRef = useRef(null);

  // Socket Ref
  const socketRef = useRef(null);

  /* =====================================
      INITIALIZATION & CLEANUP
  ===================================== */
  useEffect(() => {
    // 1. Update Refs
    userInfoRef.current = userInfo;

    // 2. Fetch Meeting Info
    const fetchMeeting = async () => {
      try {
        const { data } = await axios.get(`/api/teams/${id}/meetings`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setMeeting(data);
      } catch (err) {
        console.error("Failed to fetch meeting", err);
      }
    };
    fetchMeeting();

    // 3. Initialize Media (Start with Tracks Disabled)
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getAudioTracks().forEach(t => t.enabled = false);
        stream.getVideoTracks().forEach(t => t.enabled = false);

        setLocalStream(stream);
        localStreamRef.current = stream;
        initAudioAnalyser(stream, "local");
      } catch (err) {
        console.error("Media Init Error:", err);
        alert("Could not access camera/microphone. Please allow permissions.");
      }
    };
    initMedia();

    // 4. Initialize Socket & Events
    // Use a production-aware URL
    const BACKEND_URL = process.env.NODE_ENV === "production"
      ? "https://collaborate-arin.onrender.com"
      : "http://localhost:3002";

    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log("Socket connected:", socket.id);
      // Only join if we have the local stream ready (or can send a placeholder)
      // But since getUserMedia is async, we'll wait for that effect below
    });

    // --- Cleanup ---
    return () => {
      // Stop all tracks
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());

      // Close Peers
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};

      // Close Socket
      if (socketRef.current) {
        // Notify leave
        socketRef.current.emit("userLeft", { teamId: id, userId: userInfo._id });
        socketRef.current.disconnect();
      }

      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [id, userInfo.token, userInfo._id]); // Only re-run if ID or User changes significantly

  /* =====================================
      JOIN ROOM TRIGGER
  ===================================== */
  useEffect(() => {
    // Join when both socket and stream are ready
    if (socketRef.current && localStream && socketRef.current.connected) {
      joinRoom();
    } else if (socketRef.current && localStream) {
      // If socket exists but not connected yet, wait for it
      const onConnect = () => joinRoom();
      socketRef.current.on('connect', onConnect);
      return () => socketRef.current.off('connect', onConnect);
    }
  }, [localStream, id]);

  const joinRoom = () => {
    console.log("Joining room for Team:", id);
    socketRef.current.emit("joinTeamRoom", id);
    socketRef.current.emit("userJoined", {
      teamId: id,
      user: {
        ...userInfoRef.current,
        socketId: socketRef.current.id,
        cameraOn: false,
        micOn: false
      },
    });
  };

  /* =====================================
      SOCKET EVENT LISTENERS
  ===================================== */
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    const handleParticipants = (updatedParticipants) => {
      setParticipants(updatedParticipants);
      // Sync media status
      const statusMap = {};
      updatedParticipants.forEach(p => {
        if (p._id !== userInfoRef.current._id) {
          statusMap[p._id] = {
            cameraOn: p.cameraOn || false,
            micOn: p.micOn || false
          };
        }
      });
      setRemoteMediaStatus(prev => ({ ...prev, ...statusMap }));
    };

    const handleUserDisconnected = ({ userId }) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setRemoteStreams(prev => prev.filter(s => s.userId !== userId));
    };

    // WebRTC Signal Handlers
    const handleOtherUsers = (users) => {
      // This user just joined, existing users are sent here
      // Initiate offers to all existing users
      users.forEach(user => createPeerConnection(user.userId, user.socketId, true));
    };

    const handleOffer = async ({ senderSocketId, sdp, senderUserId }) => {
      const pc = createPeerConnection(senderUserId, senderSocketId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", {
        target: senderSocketId,
        sdp: pc.localDescription,
        senderUserId: userInfoRef.current._id,
        targetUserId: senderUserId,
        senderSocketId: socket.id
      });
    };

    const handleAnswer = async ({ sdp, senderUserId }) => {
      const pc = peerConnections.current[senderUserId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const handleIceCandidate = async ({ candidate, senderUserId }) => {
      const pc = peerConnections.current[senderUserId];
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    // Media Toggles
    const handleToggleCamera = ({ userId, cameraOn }) => {
      setRemoteMediaStatus(prev => ({ ...prev, [userId]: { ...prev[userId], cameraOn } }));
    };
    const handleToggleMic = ({ userId, micOn }) => {
      setRemoteMediaStatus(prev => ({ ...prev, [userId]: { ...prev[userId], micOn } }));
    };
    const handleSharing = ({ userId }) => {
      setRemoteMediaStatus(prev => ({ ...prev, [userId]: { ...prev[userId], isSharingScreen: true } }));
      if (!mainScreenUserId && !isSharingScreen) setMainScreenUserId(userId);
    };
    const handleStopSharing = ({ userId }) => {
      setRemoteMediaStatus(prev => ({ ...prev, [userId]: { ...prev[userId], isSharingScreen: false } }));
      if (mainScreenUserId === userId) setMainScreenUserId(null);
    };

    socket.on("participantsUpdated", handleParticipants);
    socket.on("user-disconnected", handleUserDisconnected);
    socket.on("other-users", handleOtherUsers);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("toggle-camera", handleToggleCamera);
    socket.on("toggle-mic", handleToggleMic);
    socket.on("sharing-screen", handleSharing);
    socket.on("stop-sharing-screen", handleStopSharing);

    return () => {
      socket.off("participantsUpdated");
      socket.off("user-disconnected");
      socket.off("other-users");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("toggle-camera");
      socket.off("toggle-mic");
      socket.off("sharing-screen");
      socket.off("stop-sharing-screen");
    };
  }, [mainScreenUserId, isSharingScreen]); // Dependencies that might affect logic inside handlers? Ideally keep minimal.

  /* =====================================
      WEBRTC HELPERS
  ===================================== */
  const createPeerConnection = (targetUserId, targetSocketId, isInitiator) => {
    if (peerConnections.current[targetUserId]) return peerConnections.current[targetUserId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ]
    });

    // Add Local Tracks
    const streamToSend = screenStreamRef.current || localStreamRef.current;
    if (streamToSend) {
      streamToSend.getTracks().forEach(track => pc.addTrack(track, streamToSend));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          target: targetSocketId,
          candidate: event.candidate,
          senderUserId: userInfoRef.current._id,
          targetUserId: targetUserId,
          senderSocketId: socketRef.current.id
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams(prev => {
        if (prev.find(s => s.userId === targetUserId)) return prev;
        return [...prev, { userId: targetUserId, stream: remoteStream }];
      });
      if (event.track.kind === 'audio') {
        initAudioAnalyser(remoteStream, targetUserId);
      }
    };

    peerConnections.current[targetUserId] = pc;

    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socketRef.current.emit("offer", {
          target: targetSocketId,
          sdp: pc.localDescription,
          senderUserId: userInfoRef.current._id,
          targetUserId: targetUserId,
          senderSocketId: socketRef.current.id
        });
      });
    }

    return pc;
  };

  /* =====================================
      AUDIO ANALYZER
  ===================================== */
  const initAudioAnalyser = (stream, id) => {
    if (stream.getAudioTracks().length === 0) return;
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();

    const ctx = audioContextRef.current;

    // We need to create a source, but usually can only do one per stream object?
    // Wrap in try-catch to avoid "Source already connected" errors
    try {
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(data);
        const volume = data.reduce((a, b) => a + b) / data.length;

        // Update state only if changed significantly to reduce renders
        const isTalk = volume > 15;
        setSpeakingUsers(prev => prev[id] === isTalk ? prev : { ...prev, [id]: isTalk });
        requestAnimationFrame(update);
      };
      update();
    } catch (e) {
      // console.warn("Audio Context Error (harmless if re-init):", e);
    }
  };

  /* =====================================
      USER ACTIONS
  ===================================== */
  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOn(track.enabled);
      socketRef.current.emit("toggle-camera", { userId: userInfoRef.current._id, cameraOn: track.enabled });
    }
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
      socketRef.current.emit("toggle-mic", { userId: userInfoRef.current._id, micOn: track.enabled });
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      setIsSharingScreen(true);
      setMainScreenUserId(userInfoRef.current._id);

      const screenTrack = stream.getVideoTracks()[0];

      // Replace tracks in all peer connections
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = stopScreenShare;

      socketRef.current.emit("sharing-screen", { userId: userInfoRef.current._id });
    } catch (e) {
      console.error("Screen Share Error:", e);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsSharingScreen(false);
    setMainScreenUserId(null);

    // Revert to Camera Track
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (cameraTrack) {
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(cameraTrack);
      });
    }
    socketRef.current.emit("stop-sharing-screen", { userId: userInfoRef.current._id });
  };

  const leaveMeeting = () => {
    navigate(`/team/${id}`);
  };

  /* =====================================
      UI RENDER HELPERS
  ===================================== */
  const renderTile = (stream, userId, isLocal) => {
    const isCam = isLocal ? isCameraOn : remoteMediaStatus[userId]?.cameraOn;
    const isMic = isLocal ? isMicOn : remoteMediaStatus[userId]?.micOn;
    const isShare = isLocal ? false : remoteMediaStatus[userId]?.isSharingScreen;

    let name = "Guest";
    if (isLocal) name = "You";
    else {
      const p = participants.find(x => x._id === userId);
      if (p) name = p.name;
    }

    return (
      <div key={userId} className={`video-participant-container ${speakingUsers[userId] ? 'speaking' : ''} ${mainScreenUserId === userId ? 'main-screen-share' : ''}`}>
        <VideoPlayer
          stream={stream}
          isLocal={isLocal}
          isCameraOn={isCam}
          isScreenShare={isShare}
          name={name}
          isMicOn={isMic}
        />
      </div>
    );
  };

  return (
    <div className="meeting-screen-container">
      <div className="meeting-header">
        <h1>{meeting ? `Meeting: ${meeting.roomId}` : 'Connecting...'}</h1>
        <p>{participants.length} Active Participants</p>
      </div>

      <div className={`video-grid-container ${mainScreenUserId ? 'has-main-screen' : ''}`}>

        {/* SCREEN SHARE AREA */}
        {mainScreenUserId && (
          <>
            {/* 1. Show the Main Screen (Local or Remote) */}
            {mainScreenUserId === userInfo._id && isSharingScreen && (
              <div className="video-participant-container main-screen-share">
                <VideoPlayer stream={screenStreamRef.current} isLocal={true} isCameraOn={true} isScreenShare={true} name="You (Screen)" isMicOn={false} />
              </div>
            )}
            {remoteStreams.map(r => {
              if (r.userId === mainScreenUserId) {
                // This remote user is main
                return renderTile(r.stream, r.userId, false);
              }
              return null;
            })}

            {/* 2. Sidebar for Others */}
            <div className="video-sidebar">
              {/* Local Cam */}
              {mainScreenUserId !== userInfo._id && renderTile(localStream, "local", true)}

              {/* Remote Cams */}
              {remoteStreams.map(r => {
                if (r.userId !== mainScreenUserId) {
                  return renderTile(r.stream, r.userId, false);
                }
                return null;
              })}
            </div>
          </>
        )}

        {/* GRID AREA (No One Sharing) */}
        {!mainScreenUserId && (
          <>
            {renderTile(localStream, "local", true)}
            {isSharingScreen && (
              <div className="video-participant-container">
                <VideoPlayer stream={screenStreamRef.current} isLocal={true} isCameraOn={true} isScreenShare={true} name="You (Screen)" isMicOn={false} />
              </div>
            )}
            {remoteStreams.map(r => renderTile(r.stream, r.userId, false))}
          </>
        )}
      </div>

      <div className="meeting-controls">
        <button className={`btn ${isCameraOn ? '' : 'btn-danger'}`} onClick={toggleCamera}>
          {isCameraOn ? <><FaVideo /> Stop Video</> : <><FaVideoSlash /> Start Video</>}
        </button>
        <button className={`btn ${isMicOn ? '' : 'btn-danger'}`} onClick={toggleMic}>
          {isMicOn ? <><FaMicrophone /> Mute</> : <><FaMicrophoneSlash /> Unmute</>}
        </button>
        <button className="btn" onClick={isSharingScreen ? stopScreenShare : startScreenShare}>
          {isSharingScreen ? "Stop Sharing" : "Share Screen"}
        </button>
        <button className="btn btn-danger" onClick={leaveMeeting}>
          Leave
        </button>
      </div>
    </div>
  );
};

export default MeetingScreen;