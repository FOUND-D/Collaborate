import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'; // Import icons

const peerConnections = {}; // Map userId to RTCPeerConnection instance

let socket;

const MeetingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.userLogin);

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);

  const [localStream, setLocalStream] = useState(null);
  // remoteStreams will now store { stream, userId, socketId }
  const [remoteStreams, setRemoteStreams] = useState([]);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // State to store remote users' media status
  const [remoteMediaStatus, setRemoteMediaStatus] = useState({});

  /* 🔊 Speaking Detection */
  const [speakingUsers, setSpeakingUsers] = useState({});

  const localVideoRef = useRef();

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const localSourceRef = useRef(null);

  /* =====================================
     FETCH + SOCKET SETUP
  ===================================== */

  useEffect(() => {
    console.log("MeetingScreen mounted");

    const fetchMeeting = async () => {
      try {
        const { data } = await axios.get(`/api/teams/${id}/meetings`, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        console.log("Fetched meeting data:", data);
        setMeeting(data);
      } catch {
        navigate(`/team/${id}`);
      }
    };

    fetchMeeting();

    console.log("Connecting to socket server...");
    socket = io(
      process.env.NODE_ENV === "production" ? "" : "http://localhost:3002"
    );

    socket.on('connect', () => {
        console.log("Socket connected, id:", socket.id);
        console.log("Getting user media...");
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            console.log("Got user media stream");
            setLocalStream(stream);

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }

            initLocalAudioAnalyser(stream);

            console.log("Emitting joinTeamRoom for team:", id);
            socket.emit("joinTeamRoom", id);

            console.log("Emitting userJoined with userId:", userInfo._id, "and socketId:", socket.id);
            socket.emit("userJoined", {
              teamId: id,
              user: { ...userInfo, socketId: socket.id },
            });
          })
          .catch((err) => {
            console.error("Media error:", err);
          });
    });


    socket.on("participantsUpdated", (updatedParticipants) => {
        console.log("Participants updated:", updatedParticipants);
        setParticipants(updatedParticipants);
        // Also update remoteMediaStatus from participants if available
        const newRemoteMediaStatus = {};
        updatedParticipants.forEach(p => {
            if (p._id !== userInfo._id) { // Don't include local user
                newRemoteMediaStatus[p._id] = { cameraOn: p.cameraOn, micOn: p.micOn };
            }
        });
        setRemoteMediaStatus(newRemoteMediaStatus);
    });

    socket.on("meetingEnded", () => {
      console.log("Meeting ended event received");
      navigate(`/team/${id}`);
    });

    socket.on("user-disconnected", ({ socketId, userId }) => { // Now receives userId
        console.log("User disconnected. socketId:", socketId, "userId:", userId);
      if (peerConnections[userId]) { // Use userId to close PC
        peerConnections[userId].close();
        delete peerConnections[userId];

        setRemoteStreams((prev) =>
          prev.filter((s) => s.userId !== userId) // Filter by userId
        );
      }

      setSpeakingUsers((prev) => {
        const copy = { ...prev };
        delete copy[userId]; // Use userId
        return copy;
      });
      setRemoteMediaStatus(prev => { // Clean up remoteMediaStatus
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });

    return () => {
      console.log("Cleaning up MeetingScreen");
      socket.emit("userLeft", {
        teamId: id,
        user: { ...userInfo, socketId: socket.id },
      });

      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }

      // Close all peer connections by userId
      Object.values(peerConnections).forEach((pc) => pc.close());

      socket.disconnect();

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [id, navigate, userInfo]);

  // Listener for remote media status changes
  useEffect(() => {
    if (!socket) return;

    socket.on('camera-toggled', ({ userId, cameraOn }) => {
        console.log(`Camera toggled for userId ${userId}: ${cameraOn}`);
        setRemoteMediaStatus(prev => ({
            ...prev,
            [userId]: { ...prev[userId], cameraOn }
        }));
    });

    socket.on('mic-toggled', ({ userId, micOn }) => {
        console.log(`Mic toggled for userId ${userId}: ${micOn}`);
        setRemoteMediaStatus(prev => ({
            ...prev,
            [userId]: { ...prev[userId], micOn }
        }));
    });

    // Cleanup listeners
    return () => {
        socket.off('camera-toggled');
        socket.off('mic-toggled');
    };
  }, [socket]);


  /* =====================================
     WEBRTC CONNECTION
  ===================================== */

  useEffect(() => {
    if (!localStream) {
        console.log("localStream not ready yet for WebRTC setup");
        return;
    };
    console.log("localStream is ready, setting up WebRTC listeners");

    const connectToNewUser = ({ socketId, userId }) => { // Accept socketId and userId
      console.log(`Connecting to new user: socketId=${socketId}, userId=${userId}`);
      
      if (peerConnections[userId]) {
        console.log(`Peer connection for userId ${userId} already exists. Skipping.`);
        return;
      }

      const pc = new RTCPeerConnection();
      peerConnections[userId] = pc; // Use userId as key

      console.log(`Adding local stream tracks to peer connection for userId ${userId}`);
      localStream.getTracks().forEach((track) =>
        pc.addTrack(track, localStream)
      );

      pc.onicecandidate = (e) => {
        if (e.candidate) {
            console.log(`Sending ICE candidate to socketId ${socketId} for userId ${userId}`);
          socket.emit("ice-candidate", {
            target: socketId,
            candidate: e.candidate,
            senderUserId: userInfo._id, // Include sender userId
            targetUserId: userId, // Include target userId
          });
        }
      };

      pc.ontrack = (e) => {
        console.log(`Received remote track from userId ${userId}`);
        setRemoteStreams((prev) => {
            // Avoid adding duplicate streams by userId
            if(prev.some(s => s.userId === userId)) {
                return prev;
            }
            return [...prev, { stream: e.streams[0], userId, socketId }]; // Store userId
        });

        initRemoteAnalyser(e.streams[0], userId); // Use userId for analyser
      };

      console.log(`Creating offer for userId ${userId}`);
      pc.createOffer()
        .then((o) => pc.setLocalDescription(o))
        .then(() => {
            console.log(`Sending offer to socketId ${socketId} for userId ${userId}`);
          socket.emit("offer", {
            target: socketId,
            sdp: pc.localDescription,
            senderUserId: userInfo._id, // Include sender userId
            targetUserId: userId, // Include target userId
          });
        });
    };

    socket.on("other-users", (otherUsers) => { // otherUsers is now [{ socketId, userId }, ...]
        console.log("Received other-users event:", otherUsers);
        otherUsers.forEach(connectToNewUser);
    });

    socket.on("user-connected", ({ socketId, userId }) => { // Now receives socketId and userId
        console.log("Received user-connected event: socketId:", socketId, "userId:", userId);
        connectToNewUser({ socketId, userId });
    });

    socket.on("offer", (payload) => { // payload now includes senderUserId, targetUserId
        console.log(`Received offer from: socketId=${payload.socket}, senderUserId=${payload.senderUserId}`);
        const pc = new RTCPeerConnection();
      peerConnections[payload.senderUserId] = pc; // Use senderUserId as key

      console.log(`Adding local stream tracks to peer connection for offer from userId ${payload.senderUserId}`);
      localStream.getTracks().forEach((track) =>
        pc.addTrack(track, localStream)
      );

      pc.onicecandidate = (e) => {
        if (e.candidate) {
            console.log(`Sending ICE candidate to socketId ${payload.socket} for userId ${payload.senderUserId}`);
          socket.emit("ice-candidate", {
            target: payload.socket,
            candidate: e.candidate,
            senderUserId: userInfo._id,
            targetUserId: payload.senderUserId,
          });
        }
      };

      pc.ontrack = (e) => {
        console.log(`Received remote track from userId ${payload.senderUserId}`);
        setRemoteStreams((prev) => {
            if(prev.some(s => s.userId === payload.senderUserId)) {
                return prev;
            }
            return [...prev, { stream: e.streams[0], userId: payload.senderUserId, socketId: payload.socket }]; // Store userId
        });

        initRemoteAnalyser(e.streams[0], payload.senderUserId); // Use userId for analyser
      };

      console.log(`Setting remote description for offer from userId ${payload.senderUserId}`);
      pc.setRemoteDescription(payload.sdp)
        .then(() => {
            console.log(`Creating answer for userId ${payload.senderUserId}`);
            return pc.createAnswer();
        })
        .then((a) => pc.setLocalDescription(a))
        .then(() => {
            console.log(`Sending answer to socketId ${payload.socket} for userId ${payload.senderUserId}`);
          socket.emit("answer", {
            target: payload.socket,
            sdp: pc.localDescription,
            senderUserId: userInfo._id,
            targetUserId: payload.senderUserId,
          });
        });
    });

    socket.on("answer", (payload) => { // payload now includes senderUserId
        console.log(`Received answer from: socketId=${payload.socket}, senderUserId=${payload.senderUserId}`);
        peerConnections[payload.senderUserId]?.setRemoteDescription(payload.sdp); // Use senderUserId
    });

    socket.on("ice-candidate", (payload) => { // payload now includes senderUserId, targetUserId
        console.log(`Received ICE candidate from: socketId=${payload.socket}, senderUserId=${payload.senderUserId}, targetUserId=${payload.targetUserId}`);
        // The ICE candidate is for the user who sent the offer, so use targetUserId to find the PC
        // Or, if it's an answerer sending ICE, then senderUserId is the answerer, and targetUserId is the offerer.
        // It's usually `payload.senderUserId` that we're talking to for the connection.
        peerConnections[payload.senderUserId]?.addIceCandidate(
        new RTCIceCandidate(payload.candidate)
      );
    });
  }, [localStream]);

  /* =====================================
     LOCAL AUDIO ANALYSER
  ===================================== */

  const initLocalAudioAnalyser = (stream) => {
    const audioCtx = new AudioContext();

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;

    const source = audioCtx.createMediaStreamSource(stream);

    source.connect(analyser);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    localSourceRef.current = source;

    detectSpeaking(analyser, "local");
  };

  /* =====================================
     REMOTE AUDIO ANALYSER
  ===================================== */

  const initRemoteAnalyser = (stream, userId) => { // Use userId
    const audioCtx = audioContextRef.current || new AudioContext();

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;

    const source = audioCtx.createMediaStreamSource(stream);

    source.connect(analyser);

    detectSpeaking(analyser, userId); // Use userId
  };

  /* =====================================
     SPEECH DETECTION
  ===================================== */

  const detectSpeaking = (analyser, id) => {
    const data = new Uint8Array(analyser.frequencyBinCount);

    const check = () => {
      analyser.getByteFrequencyData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }

      const volume = sum / data.length;

      setSpeakingUsers((prev) => ({
        ...prev,
        [id]: volume > 25, // Sensitivity
      }));

      requestAnimationFrame(check);
    };

    check();
  };

  /* =====================================
     CONTROLS
  ===================================== */

  const toggleCamera = () => {
    if (!localStream) return;

    const track = localStream.getVideoTracks()[0];
    track.enabled = !track.enabled;

    setIsCameraOn(track.enabled);
    socket.emit("toggle-camera", { userId: userInfo._id, cameraOn: track.enabled });
  };

  const toggleMic = () => {
    if (!localStream) return;

    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;

    setIsMicOn(track.enabled);
    socket.emit("toggle-mic", { userId: userInfo._id, micOn: track.enabled });
  };

  const leaveMeetingHandler = () => {
    navigate(`/team/${id}`);
  };

  /* =====================================
     UI
  ===================================== */

  return (
    <div className="meeting-screen-container">
      <div className="meeting-header">
        <h1>Meeting in progress...</h1>
        {meeting && <p>Room ID: {meeting.roomId}</p>}
      </div>

      <div className="video-grid-container">
        {/* LOCAL VIDEO */}

        <div
          className={`video-participant-container ${
            speakingUsers.local ? "speaking" : ""
          }`}
        >
          <video ref={localVideoRef} autoPlay muted />

          <div className="participant-name">
            {userInfo.name} (You)
          </div>
        </div>

        {/* REMOTE VIDEOS */}

        {remoteStreams.map((remote, index) => {
          // Use remote.userId to find the participant
          const participant = participants.find(
            (p) => p._id === remote.userId
          );
          const remoteCameraOn = remoteMediaStatus[remote.userId]?.cameraOn;
          const remoteMicOn = remoteMediaStatus[remote.userId]?.micOn;

          return (
            <div
              key={index}
              className={`video-participant-container ${
                speakingUsers[remote.userId] ? "speaking" : ""
              }`}
            >
              <video
                autoPlay
                className={!remoteCameraOn ? 'hidden-video' : ''} // Add class to hide video
                ref={(ref) => {
                  if (ref) ref.srcObject = remote.stream;
                }}
              />

              {!remoteCameraOn && (
                  <div className="video-overlay-icon">
                      <FaVideoSlash size={60} />
                  </div>
              )}

              <div className="participant-name">
                {participant ? participant.name : "Guest"}
                <span className="media-status-icons">
                    {remoteCameraOn ? <FaVideo /> : <FaVideoSlash />}
                    {remoteMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
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
