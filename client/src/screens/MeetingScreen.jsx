import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

// Global object to track connections outside React renders
const peerConnections = {}; 

const MeetingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.userLogin);
  const userInfoRef = useRef(userInfo);

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);

  // Media States
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  
  const [remoteStreams, setRemoteStreams] = useState([]); // [{ stream, userId, socketId }]
  const [remoteMediaStatus, setRemoteMediaStatus] = useState({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const screenStreamRef = useRef(null);

  // Audio Analysis
  const [speakingUsers, setSpeakingUsers] = useState({});
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const localSourceRef = useRef(null);

  // Refs
  const socketRef = useRef(null);
  const localVideoRef = useRef();

  /* =====================================
     1. INITIALIZATION & CLEANUP
  ===================================== */
  useEffect(() => {
    userInfoRef.current = userInfo; 

    // Fetch Meeting Details
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

    // Cleanup Function
    return () => {
      console.log("Cleaning up MeetingScreen...");
      
      // 1. Notify server
      if (socketRef.current) {
        socketRef.current.emit("userLeft", {
          teamId: id,
          user: { ...userInfo, socketId: socketRef.current.id },
        });
        socketRef.current.disconnect();
      }

      // 2. Close WebRTC Connections
      Object.keys(peerConnections).forEach((key) => {
        if (peerConnections[key]) {
            peerConnections[key].close();
            delete peerConnections[key];
        }
      });

      // 3. Stop Local Media
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      // 4. Close Audio Context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [id, navigate, userInfo]);

  /* =====================================
     2. GET USER MEDIA
  ===================================== */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        initLocalAudioAnalyser(stream);
      })
      .catch((err) => console.error("Media error:", err));
  }, []);

  /* =====================================
     3. SOCKET SETUP (Render Link Added)
  ===================================== */
  useEffect(() => {
    console.log("Initializing socket connection...");

    const BACKEND_URL = process.env.NODE_ENV === "production" 
        ? "https://collaborate-arin.onrender.com" 
        : "http://localhost:3002";

    const newSocket = io(BACKEND_URL, {
        transports: ['websocket'], // Required for Render to avoid polling errors
    });

    socketRef.current = newSocket;

    const onParticipantsUpdated = (updatedParticipants) => {
      setParticipants(updatedParticipants);
      const newStatus = {};
      updatedParticipants.forEach(p => {
        if (p._id !== userInfoRef.current?._id) {
            newStatus[p._id] = { cameraOn: p.cameraOn, micOn: p.micOn };
        }
      });
      setRemoteMediaStatus(newStatus);
    };

    const onUserDisconnected = ({ userId }) => {
      if (peerConnections[userId]) {
        peerConnections[userId].close();
        delete peerConnections[userId];
      }
      setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId));
      setSpeakingUsers((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    };

    newSocket.on("participantsUpdated", onParticipantsUpdated);
    newSocket.on("user-disconnected", onUserDisconnected);

    return () => {
      newSocket.off("participantsUpdated", onParticipantsUpdated);
      newSocket.off("user-disconnected", onUserDisconnected);
    };
  }, []);

  /* =====================================
     4. JOIN ROOM (Once Stream Ready)
  ===================================== */
  useEffect(() => {
    if (socketRef.current && localStream) {
      const socket = socketRef.current;
      
      const joinRoom = () => {
        console.log("Socket Connected, Joining Room:", id);
        socket.emit("joinTeamRoom", id);
        socket.emit("userJoined", {
          teamId: id,
          user: { ...userInfoRef.current, socketId: socket.id },
        });
      };

      if (socket.connected) joinRoom();
      else socket.on('connect', joinRoom);

      return () => socket.off('connect', joinRoom);
    }
  }, [id, localStream]);

  /* =====================================
     5. WEBRTC LOGIC (Fixed with TURN)
  ===================================== */
  useEffect(() => {
    if (!socketRef.current || !localStream) return;

    const socket = socketRef.current;
    const myUserId = userInfoRef.current._id;

    // --- HELPER: Create Peer Connection ---
    const createPeerConnection = (targetUserId, targetSocketId) => {
      console.log(`Creating PeerConnection for ${targetUserId}`);
      
      const pc = new RTCPeerConnection({
        iceServers: [
            // Google STUN (Standard)
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            
            // OpenRelay FREE TURN (Crucial for Vercel/Render)
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

      // Add local tracks
      // Ensure we add the current active video track (camera or screen share)
      const currentVideoTrack = isSharingScreen 
        ? screenStreamRef.current?.getVideoTracks()[0] 
        : localStream.getVideoTracks()[0];
      const currentAudioTrack = localStream.getAudioTracks()[0];

      if (currentVideoTrack) {
        pc.addTrack(currentVideoTrack, localStream);
      }
      if (currentAudioTrack) {
        pc.addTrack(currentAudioTrack, localStream);
      }

      // Handle ICE Candidates
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

      // Handle Remote Stream
      pc.ontrack = (e) => {
        console.log(`Received track from ${targetUserId}`);
        setRemoteStreams((prev) => {
          // Check if a stream from this user already exists, if so, update it
          const existingStreamIndex = prev.findIndex(s => s.userId === targetUserId);
          const newStreamInfo = { 
            stream: e.streams[0], 
            userId: targetUserId, 
            socketId: targetSocketId,
            isScreenShare: e.track.kind === 'video' && e.streams[0].getVideoTracks()[0] !== localStream.getVideoTracks()[0] // Heuristic to detect screen share
          };

          if (existingStreamIndex > -1) {
            const updatedStreams = [...prev];
            updatedStreams[existingStreamIndex] = newStreamInfo;
            return updatedStreams;
          } else {
            return [...prev, newStreamInfo];
          }
        });
        // Re-init audio analyser if it's an audio track
        if (e.track.kind === 'audio') {
          initRemoteAnalyser(e.streams[0], targetUserId);
        }
      };

      peerConnections[targetUserId] = pc;
      return pc;
    };

    // --- HANDLERS ---

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
      const senderSocketId = payload.senderSocketId || payload.from || payload.socket;
      let pc = peerConnections[payload.senderUserId];
      
      if (!pc) {
        pc = createPeerConnection(payload.senderUserId, senderSocketId);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", {
        target: senderSocketId,
        sdp: pc.localDescription,
        senderUserId: myUserId,
        targetUserId: payload.senderUserId,
      });
    };

    const onAnswer = async (payload) => {
      const pc = peerConnections[payload.senderUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      }
    };

    const onIceCandidate = async (payload) => {
      const pc = peerConnections[payload.senderUserId];
      if (pc && payload.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      }
    };

    const onSharingScreen = ({ userId }) => {
      setRemoteMediaStatus(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isSharingScreen: true }
      }));
    };

    const onStopSharingScreen = ({ userId }) => {
      setRemoteMediaStatus(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isSharingScreen: false }
      }));
    };

    socket.on("other-users", onOtherUsers);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("sharing-screen", onSharingScreen);
    socket.on("stop-sharing-screen", onStopSharingScreen);

    return () => {
      socket.off("other-users", onOtherUsers);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("sharing-screen", onSharingScreen);
      socket.off("stop-sharing-screen", onStopSharingScreen);
    };
  }, [localStream, id, isSharingScreen]); // Depend on localStream (state), not Ref

  /* =====================================
     6. AUDIO ANALYSER HELPERs
  ===================================== */
  const initLocalAudioAnalyser = (stream) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const ctx = audioContextRef.current;
    
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    
    analyserRef.current = analyser;
    localSourceRef.current = source;
    detectSpeaking(analyser, "local");
  };

  const initRemoteAnalyser = (stream, userId) => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const ctx = audioContextRef.current;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    detectSpeaking(analyser, userId);
  };

  const detectSpeaking = (analyser, id) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const check = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const volume = sum / data.length;
      
      setSpeakingUsers((prev) => ({
        ...prev,
        [id]: volume > 25,
      }));
      requestAnimationFrame(check);
    };
    check();
  };

  /* =====================================
     7. UI CONTROLS
  ===================================== */
  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
    if(socketRef.current) {
        socketRef.current.emit("toggle-camera", { userId: userInfo._id, cameraOn: track.enabled });
    }
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
    if(socketRef.current) {
        socketRef.current.emit("toggle-mic", { userId: userInfo._id, micOn: track.enabled });
    }
  };

  const leaveMeetingHandler = () => {
    navigate(`/team/${id}`);
  };

  // Helper to replace video track across all peer connections
  const replaceVideoTrack = (newTrack) => {
    Object.values(peerConnections).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(newTrack);
      }
    });
  };

  const startScreenShare = async () => {
    try {
      // Get screen share stream
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }); // Audio might cause issues, starting with video only
      const screenVideoTrack = stream.getVideoTracks()[0];

      // Store screen stream
      screenStreamRef.current = stream;
      setIsSharingScreen(true);

      // Update local video display to screen share
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStreamRef.current;
      }
      
      // Replace video track in all peer connections
      replaceVideoTrack(screenVideoTrack);

      // Listen for screen share end event
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      // Signal screen share to other participants
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

    // Replace screen share track with local camera track
    if (localStreamRef.current) {
      const cameraVideoTrack = localStreamRef.current.getVideoTracks()[0];
      replaceVideoTrack(cameraVideoTrack);

      // Update local video display to camera
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    
    // Signal end of screen share to other participants
    socketRef.current.emit("stop-sharing-screen", { userId: userInfo._id });
  };

  /* =====================================
     8. RENDER
  ===================================== */
  return (
    <div className="meeting-screen-container">
      <div className="meeting-header">
        <h1>Meeting in progress...</h1>
        {meeting && <p>Room ID: {meeting.roomId}</p>}
      </div>

      <div className="video-grid-container">
        {/* LOCAL VIDEO */}
        <div className={`video-participant-container ${speakingUsers.local ? "speaking" : ""}`}>
          <video ref={localVideoRef} autoPlay muted playsInline className={!isSharingScreen ? "local-video-flipped" : ""} />
          {!isCameraOn && (
            <div className="video-overlay-icon"><FaVideoSlash size={60} /></div>
          )}
          <div className="participant-name">
            {userInfo.name} (You)
          </div>
        </div>

        {/* REMOTE VIDEOS */}
        {remoteStreams.map((remote) => {
          const participant = participants.find((p) => p._id === remote.userId);
          const remoteCameraOn = remoteMediaStatus[remote.userId]?.cameraOn ?? true;
          const remoteMicOn = remoteMediaStatus[remote.userId]?.micOn ?? true;
          const remoteIsSharingScreen = remoteMediaStatus[remote.userId]?.isSharingScreen ?? false;
          
          // Determine which stream to display
          const displayStream = remoteIsSharingScreen 
            ? remoteStreams.find(s => s.userId === remote.userId && s.isScreenShare)?.stream 
            : remoteStreams.find(s => s.userId === remote.userId && !s.isScreenShare)?.stream;

          return (
            <div
              key={remote.userId}
              className={`video-participant-container ${speakingUsers[remote.userId] ? "speaking" : ""}`}
            >
              <video
                autoPlay
                playsInline
                className={!remoteCameraOn && !remoteIsSharingScreen ? 'hidden-video' : ''} // Hide if camera is off AND not screen sharing
                ref={(ref) => {
                  // Ensure we only update srcObject if it's actually a new stream
                  if (ref && ref.srcObject !== displayStream) ref.srcObject = displayStream;
                }}
              />
              {!remoteCameraOn && !remoteIsSharingScreen && (
                 <div className="video-overlay-icon"><FaVideoSlash size={60} /></div>
              )}
              <div className="participant-name">
                {participant ? participant.name : "Guest"}
                {remoteIsSharingScreen && " (Screen Sharing)"}
                <span className="media-status-icons">
                  {!remoteCameraOn && !remoteIsSharingScreen && <FaVideoSlash size={12}/>}
                  {!remoteMicOn && <FaMicrophoneSlash size={12}/>}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="meeting-controls">
        <button className="btn" onClick={toggleCamera}>
          {isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
        </button>
        <button className="btn" onClick={toggleMic}>
          {isMicOn ? "Mute Mic" : "Unmute Mic"}
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