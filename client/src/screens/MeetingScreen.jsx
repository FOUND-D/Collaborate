import React, { useEffect, useState, useRef, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

// Global object to track connections
const peerConnections = {}; 

/* =========================================================================
   1. ISOLATED VIDEO COMPONENT (Prevents Blinking during Audio updates)
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
    const flipClass = isLocal && !isScreenShare ? "local-video-flipped" : (!isScreenShare ? "remote-video-flipped" : "");

    return (
        <>
            <video
                ref={videoRef}
                autoPlay
                muted={isLocal} // Always mute local video to prevent feedback
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
  const userInfoRef = useRef(userInfo);

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);

  // --- Media States ---
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  
  const [remoteStreams, setRemoteStreams] = useState([]); 
  const [remoteMediaStatus, setRemoteMediaStatus] = useState({});
  
  // Start OFF by default
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const screenStreamRef = useRef(null);
  const [mainScreenUserId, setMainScreenUserId] = useState(null); 

  // Audio Analysis
  const [speakingUsers, setSpeakingUsers] = useState({}); // { userId: boolean }
  const audioContextRef = useRef(null);
  
  // Socket Ref
  const socketRef = useRef(null);

  /* =====================================
      INITIALIZATION & CLEANUP
  ===================================== */
  useEffect(() => {
    userInfoRef.current = userInfo; 

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

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("userLeft", {
          teamId: id,
          user: { ...userInfo, socketId: socketRef.current.id },
        });
        socketRef.current.disconnect();
      }
      
      Object.keys(peerConnections).forEach((key) => {
        if (peerConnections[key]) {
            peerConnections[key].close();
            delete peerConnections[key];
        }
      });

      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [id, navigate, userInfo]);

  /* =====================================
      GET USER MEDIA (Start OFF)
  ===================================== */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // DISABLE TRACKS IMMEDIATELY (Privacy Default)
        stream.getAudioTracks().forEach(track => track.enabled = false);
        stream.getVideoTracks().forEach(track => track.enabled = false);

        setLocalStream(stream);
        localStreamRef.current = stream;
        
        initAudioAnalyser(stream, "local");
      })
      .catch((err) => console.error("Media error:", err));
  }, []);

  /* =====================================
      SOCKET SETUP 
  ===================================== */
  useEffect(() => {
    const BACKEND_URL = process.env.NODE_ENV === "production" 
        ? "https://collaborate-arin.onrender.com" 
        : "http://localhost:3002";

    const newSocket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = newSocket;

    const onParticipantsUpdated = (updatedParticipants) => {
      setParticipants(updatedParticipants);
      const newStatus = {};
      updatedParticipants.forEach(p => {
        if (p._id !== userInfoRef.current?._id) {
            // Merge existing status with new participant list if needed
            newStatus[p._id] = { 
                cameraOn: p.cameraOn || false, 
                micOn: p.micOn || false 
            };
        }
      });
      setRemoteMediaStatus(prev => ({ ...prev, ...newStatus }));
    };

    const onUserDisconnected = ({ userId }) => {
      if (peerConnections[userId]) {
        peerConnections[userId].close();
        delete peerConnections[userId];
      }
      setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId));
    };

    newSocket.on("participantsUpdated", onParticipantsUpdated);
    newSocket.on("user-disconnected", onUserDisconnected);

    return () => {
      newSocket.off("participantsUpdated", onParticipantsUpdated);
      newSocket.off("user-disconnected", onUserDisconnected);
    };
  }, []);

  /* =====================================
      JOIN ROOM
  ===================================== */
  useEffect(() => {
    if (socketRef.current && localStream) {
      const socket = socketRef.current;
      const joinRoom = () => {
        socket.emit("joinTeamRoom", id);
        socket.emit("userJoined", {
          teamId: id,
          user: { 
            ...userInfoRef.current, 
            socketId: socket.id,
            cameraOn: false, // Default Off
            micOn: false 
          },
        });
      };
      if (socket.connected) joinRoom();
      else socket.on('connect', joinRoom);
      return () => socket.off('connect', joinRoom);
    }
  }, [id, localStream]);

  /* =====================================
      WEBRTC LOGIC
  ===================================== */
  useEffect(() => {
    if (!socketRef.current || !localStream) return;
    const socket = socketRef.current;
    const myUserId = userInfoRef.current._id;

    const createPeerConnection = (targetUserId, targetSocketId) => {
      if (peerConnections[targetUserId]) return peerConnections[targetUserId];

      const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add TURN servers here if needed for production
            {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject",
            },
            {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject",
            },
            {
                urls: "turn:openrelay.metered.ca:443?transport=tcp",
                username: "openrelayproject",
                credential: "openrelayproject",
            },
        ]
      });

      const currentVideoTrack = isSharingScreen 
        ? screenStreamRef.current?.getVideoTracks()[0] 
        : localStream.getVideoTracks()[0];
      const currentAudioTrack = localStream.getAudioTracks()[0];

      if (currentVideoTrack) pc.addTrack(currentVideoTrack, localStream);
      if (currentAudioTrack) pc.addTrack(currentAudioTrack, localStream);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            target: targetSocketId,
            candidate: e.candidate,
            senderUserId: myUserId,
            targetUserId: targetUserId,
          });
        }
      };

      pc.ontrack = (e) => {
        const remoteStream = e.streams[0];
        setRemoteStreams((prev) => {
            const exists = prev.find(s => s.userId === targetUserId);
            if (exists) return prev; // Avoid duplicates causing blinking
            return [...prev, { stream: remoteStream, userId: targetUserId }];
        });
        
        // Init audio analysis for speaking border
        if(e.track.kind === 'audio') {
            initAudioAnalyser(remoteStream, targetUserId);
        }
      };

      peerConnections[targetUserId] = pc;
      return pc;
    };

    const onOtherUsers = (users) => {
      users.forEach((user) => {
        const pc = createPeerConnection(user.userId, user.socketId);
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", {
              target: user.socketId,
              sdp: pc.localDescription,
              senderUserId: myUserId,
              targetUserId: user.userId,
            });
          });
      });
    };

    const onOffer = async (payload) => {
      const pc = createPeerConnection(payload.senderUserId, payload.senderSocketId || payload.from);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { 
        target: payload.senderSocketId || payload.from, 
        sdp: pc.localDescription, 
        senderUserId: myUserId, 
        targetUserId: payload.senderUserId 
      });
    };

    const onAnswer = async (payload) => {
      const pc = peerConnections[payload.senderUserId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    };

    const onIceCandidate = async (payload) => {
      const pc = peerConnections[payload.senderUserId];
      if (pc && payload.candidate) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    };

    const onToggleCamera = ({ userId, cameraOn }) => {
       setRemoteMediaStatus(prev => ({ ...prev, [userId]: { ...prev[userId], cameraOn: cameraOn } }));
    };

    const onToggleMic = ({ userId, micOn }) => {
        setRemoteMediaStatus(prev => ({ ...prev, [userId]: { ...prev[userId], micOn: micOn } }));
    };

    const onSharingScreen = ({ userId }) => {
        setRemoteMediaStatus(prev => ({ ...prev, [userId]: { ...prev[userId], isSharingScreen: true } }));
        if (!mainScreenUserId && !isSharingScreen) setMainScreenUserId(userId);
    };
  
    const onStopSharingScreen = ({ userId }) => {
        setRemoteMediaStatus(prev => ({ ...prev, [userId]: { ...prev[userId], isSharingScreen: false } }));
        if (mainScreenUserId === userId) setMainScreenUserId(null);
    };

    socket.on("other-users", onOtherUsers);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("toggle-camera", onToggleCamera);
    socket.on("toggle-mic", onToggleMic);
    socket.on("sharing-screen", onSharingScreen);
    socket.on("stop-sharing-screen", onStopSharingScreen);

    return () => {
      socket.off("other-users", onOtherUsers);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("toggle-camera", onToggleCamera);
      socket.off("toggle-mic", onToggleMic);
      socket.off("sharing-screen", onSharingScreen);
      socket.off("stop-sharing-screen", onStopSharingScreen);
    };
  }, [localStream, id, isSharingScreen]); 

  /* =====================================
      AUDIO ANALYSIS (Speaking Detection)
  ===================================== */
  const initAudioAnalyser = (stream, id) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const ctx = audioContextRef.current;
    
    // Check if stream has audio tracks
    if (stream.getAudioTracks().length === 0) return;

    try {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256; // Smaller FFT size is faster
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const data = new Uint8Array(analyser.frequencyBinCount);
        
        const checkVolume = () => {
            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const volume = sum / data.length;
            
            setSpeakingUsers(prev => {
                const isSpeaking = volume > 20; // Threshold
                if (prev[id] === isSpeaking) return prev; // No change, no state update
                return { ...prev, [id]: isSpeaking };
            });
            requestAnimationFrame(checkVolume);
        };
        checkVolume();
    } catch(e) {
        console.log("Audio detect error (likely muted source):", e);
    }
  };

  /* =====================================
      CONTROLS
  ===================================== */
  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    track.enabled = !track.enabled; 
    setIsCameraOn(track.enabled);
    if(socketRef.current) socketRef.current.emit("toggle-camera", { userId: userInfo._id, cameraOn: track.enabled });
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
    if(socketRef.current) socketRef.current.emit("toggle-mic", { userId: userInfo._id, micOn: track.enabled });
  };

  const replaceVideoTrack = (newTrack) => {
    Object.values(peerConnections).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(newTrack);
    });
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenVideoTrack = stream.getVideoTracks()[0];
      screenStreamRef.current = stream;
      setIsSharingScreen(true);
      setMainScreenUserId(userInfo._id); 
      
      replaceVideoTrack(screenVideoTrack);
      screenVideoTrack.onended = () => stopScreenShare();
      socketRef.current.emit("sharing-screen", { userId: userInfo._id });
    } catch (error) {
      console.error("Error starting screen share:", error);
      setIsSharingScreen(false);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsSharingScreen(false);
    setMainScreenUserId(null); 
    if (localStreamRef.current) {
      const cameraVideoTrack = localStreamRef.current.getVideoTracks()[0];
      replaceVideoTrack(cameraVideoTrack);
    }
    socketRef.current.emit("stop-sharing-screen", { userId: userInfo._id });
  };

  const leaveMeetingHandler = () => navigate(`/team/${id}`);

  /* =====================================
      RENDER HELPER
  ===================================== */
  // Renders a single participant tile
  const renderParticipant = (stream, userId, isLocal = false) => {
    // If local, use local state. If remote, use remoteMediaStatus
    const isCamOn = isLocal ? isCameraOn : (remoteMediaStatus[userId]?.cameraOn ?? false);
    const isMicActive = isLocal ? isMicOn : (remoteMediaStatus[userId]?.micOn ?? false);
    const isScreen = isLocal ? false : (remoteMediaStatus[userId]?.isSharingScreen ?? false);
    
    // Name resolution
    let displayName = "Guest";
    if (isLocal) displayName = userInfo.name + " (You)";
    else {
        const p = participants.find(p => p._id === userId);
        if (p) displayName = p.name;
    }

    const isSpeaking = speakingUsers[userId || "local"];

    return (
        <div 
            key={userId || "local"} 
            className={`video-participant-container ${isSpeaking ? "speaking" : ""} ${mainScreenUserId === userId ? "main-screen-share" : ""}`}
        >
            <VideoPlayer 
                stream={stream} 
                isLocal={isLocal} 
                isCameraOn={isCamOn} 
                isScreenShare={isScreen}
                name={displayName}
                isMicOn={isMicActive}
            />
        </div>
    );
  };

  /* =====================================
      MAIN RENDER
  ===================================== */
  return (
    <div className="meeting-screen-container">
      <div className="meeting-header">
        <h1>Meeting in progress...</h1>
        {meeting && <p>Room ID: {meeting.roomId}</p>}
      </div>

      <div className={`video-grid-container ${mainScreenUserId ? 'has-main-screen' : ''}`}>
        
        {/* --- 1. MAIN SCREEN AREA (If someone is pinned/sharing) --- */}
        {mainScreenUserId && (
          <>
            {/* If Local User is Sharing Screen */}
            {isSharingScreen && userInfo._id === mainScreenUserId && (
               <div className="video-participant-container main-screen-share">
                   <VideoPlayer stream={screenStreamRef.current} isLocal={true} isCameraOn={true} isScreenShare={true} name={userInfo.name} isMicOn={false} />
               </div>
            )}

            {/* If Local User Camera is Pinned */}
            {!isSharingScreen && userInfo._id === mainScreenUserId && renderParticipant(localStream, "local", true)}

            {/* If Remote User is Pinned/Sharing */}
            {remoteStreams.map(r => {
                if (r.userId === mainScreenUserId) {
                    return renderParticipant(r.stream, r.userId, false);
                }
                return null;
            })}
          </>
        )}

        {/* --- 2. SIDEBAR / GRID AREA --- */}
        {mainScreenUserId ? (
            // Sidebar Layout
            <div className="video-sidebar">
                {/* Local Camera (if not pinned) */}
                {userInfo._id !== mainScreenUserId && renderParticipant(localStream, "local", true)}
                
                {/* Remote Cameras (if not pinned) */}
                {remoteStreams.map(r => {
                    if (r.userId !== mainScreenUserId) {
                        return renderParticipant(r.stream, r.userId, false);
                    }
                    return null;
                })}
            </div>
        ) : (
            // Grid Layout
            <>
                {/* Local Camera */}
                {renderParticipant(localStream, "local", true)}
                
                {/* Local Screen Share (as separate box) */}
                {isSharingScreen && (
                    <div className="video-participant-container">
                        <VideoPlayer stream={screenStreamRef.current} isLocal={true} isCameraOn={true} isScreenShare={true} name={userInfo.name} isMicOn={false} />
                    </div>
                )}

                {/* Remote Participants */}
                {remoteStreams.map(r => renderParticipant(r.stream, r.userId, false))}
            </>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      <div className="meeting-controls">
        <button className={`btn ${isCameraOn ? '' : 'btn-danger'}`} onClick={toggleCamera}>
          {isCameraOn ? <><FaVideo/> &nbsp; Stop Video</> : <><FaVideoSlash/> &nbsp; Start Video</>}
        </button>
        <button className={`btn ${isMicOn ? '' : 'btn-danger'}`} onClick={toggleMic}>
          {isMicOn ? <><FaMicrophone/> &nbsp; Mute</> : <><FaMicrophoneSlash/> &nbsp; Unmute</>}
        </button>
        <button className="btn" onClick={isSharingScreen ? stopScreenShare : startScreenShare}>
          {isSharingScreen ? "Stop Sharing" : "Share Screen"}
        </button>
        <button className="btn btn-danger" onClick={leaveMeetingHandler}>
          Leave Meeting
        </button>
      </div>
    </div>
  );
};

export default MeetingScreen;