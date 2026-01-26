import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

const peerConnections = {}; // Global object to track connections outside renders

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

  // Audio Analysis Refs
  const [speakingUsers, setSpeakingUsers] = useState({});
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const localSourceRef = useRef(null);

  // Socket Ref
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
        // navigate(`/team/${id}`); // Uncomment if you want strict redirection
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
        peerConnections[key].close();
        delete peerConnections[key];
      });

      // 3. Stop Local Media
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
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
     3. SOCKET SETUP
  ===================================== */
  useEffect(() => {
    const newSocket = io(
      process.env.NODE_ENV === "production" ? "" : "http://localhost:3002"
    );
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
     5. WEBRTC LOGIC (The Core Fix)
  ===================================== */
  useEffect(() => {
    if (!socketRef.current || !localStream) return;

    const socket = socketRef.current;
    const myUserId = userInfoRef.current._id;

    // --- HELPER: Create Peer Connection ---
    const createPeerConnection = (targetUserId, targetSocketId) => {
      console.log(`Creating PeerConnection for ${targetUserId}`);
      
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

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

      // Handle Remote Stream (VIDEO VISIBILITY FIX)
      pc.ontrack = (e) => {
        console.log(`Received track from ${targetUserId}`);
        setRemoteStreams((prev) => {
          if (prev.some(s => s.userId === targetUserId)) return prev;
          return [...prev, { stream: e.streams[0], userId: targetUserId, socketId: targetSocketId }];
        });
        initRemoteAnalyser(e.streams[0], targetUserId);
      };

      peerConnections[targetUserId] = pc;
      return pc;
    };

    // --- HANDLERS ---

    const onOtherUsers = (users) => {
      // Users is array of { userId, socketId }
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

    // FIX: Added missing ICE handler
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

    socket.on("other-users", onOtherUsers);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);

    return () => {
      socket.off("other-users", onOtherUsers);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
    };
  }, [localStream, id]); // FIX: Dependency on localStream (state), not Ref

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
    socketRef.current.emit("toggle-camera", { userId: userInfo._id, cameraOn: track.enabled });
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
    socketRef.current.emit("toggle-mic", { userId: userInfo._id, micOn: track.enabled });
  };

  const leaveMeetingHandler = () => {
    navigate(`/team/${id}`);
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
          <video ref={localVideoRef} autoPlay muted playsInline />
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

          return (
            <div
              key={remote.userId}
              className={`video-participant-container ${speakingUsers[remote.userId] ? "speaking" : ""}`}
            >
              <video
                autoPlay
                playsInline
                className={!remoteCameraOn ? 'hidden-video' : ''}
                ref={(ref) => {
                  if (ref && ref.srcObject !== remote.stream) ref.srcObject = remote.stream;
                }}
              />
              {!remoteCameraOn && (
                 <div className="video-overlay-icon"><FaVideoSlash size={60} /></div>
              )}
              <div className="participant-name">
                {participant ? participant.name : "Guest"}
                <span className="media-status-icons">
                  {!remoteCameraOn && <FaVideoSlash size={12}/>}
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
        <button className="btn btn-danger" onClick={leaveMeetingHandler}>
          Leave Meeting
        </button>
      </div>
    </div>
  );
};

export default MeetingScreen;

/* KEEP YOUR CSS BELOW AS IS 
   (Copy the CSS from your previous message here)
*/