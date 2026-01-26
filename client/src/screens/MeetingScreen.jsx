import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";

import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";

/* ===============================
   GLOBALS
================================ */

let socket;

// userId => RTCPeerConnection
const peerConnections = {};

// STUN CONFIG (IMPORTANT)
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* ===============================
   COMPONENT
================================ */

const MeetingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.userLogin);

  /* ===============================
     STATE
  ================================ */

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const [remoteMediaStatus, setRemoteMediaStatus] = useState({});
  const [speakingUsers, setSpeakingUsers] = useState({});

  /* ===============================
     REFS
  ================================ */

  const localVideoRef = useRef();

  const audioContextRef = useRef(null);

  /* ===============================
     FETCH MEETING
  ================================ */

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const { data } = await axios.get(
          `/api/teams/${id}/meetings`,
          {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          }
        );

        setMeeting(data);
      } catch {
        navigate(`/team/${id}`);
      }
    };

    fetchMeeting();
  }, [id, navigate, userInfo]);

  /* ===============================
     GET MEDIA
  ================================ */

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        initAnalyser(stream, "local");
      } catch (err) {
        console.error("Media error:", err);
      }
    };

    getMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /* ===============================
     SOCKET SETUP
  ================================ */

  useEffect(() => {
    if (!localStream) return;

    socket = io(
      process.env.NODE_ENV === "production"
        ? ""
        : "http://localhost:3002"
    );

    socket.on("connect", () => {
      socket.emit("joinTeamRoom", id);

      socket.emit("userJoined", {
        teamId: id,
        user: { ...userInfo, socketId: socket.id },
      });
    });

    socket.on("participantsUpdated", (list) => {
      setParticipants(list);

      const status = {};

      list.forEach((p) => {
        if (p._id !== userInfo._id) {
          status[p._id] = {
            cameraOn: p.cameraOn,
            micOn: p.micOn,
          };
        }
      });

      setRemoteMediaStatus(status);
    });

    socket.on("meetingEnded", () => {
      navigate(`/team/${id}`);
    });

    socket.on("user-disconnected", ({ userId }) => {
      if (peerConnections[userId]) {
        peerConnections[userId].close();
        delete peerConnections[userId];
      }

      setRemoteStreams((prev) =>
        prev.filter((s) => s.userId !== userId)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [localStream]);

  /* ===============================
     WEBRTC
  ================================ */

  useEffect(() => {
    if (!localStream || !socket) return;

    const createPeer = (userId, socketId) => {
      if (peerConnections[userId]) return;

      const pc = new RTCPeerConnection(RTC_CONFIG);

      peerConnections[userId] = pc;

      /* Add tracks */

      localStream.getTracks().forEach((track) =>
        pc.addTrack(track, localStream)
      );

      /* ICE */

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            target: socketId,
            candidate: e.candidate,
            senderUserId: userInfo._id,
            targetUserId: userId,
          });
        }
      };

      /* Track */

      pc.ontrack = (e) => {
        setRemoteStreams((prev) => {
          if (prev.some((s) => s.userId === userId))
            return prev;

          return [
            ...prev,
            {
              userId,
              socketId,
              stream: e.streams[0],
            },
          ];
        });

        initAnalyser(e.streams[0], userId);
      };

      return pc;
    };

    /* OTHER USERS */

    socket.on("other-users", (users) => {
      users.forEach(({ userId, socketId }) => {
        const pc = createPeer(userId, socketId);

        pc.createOffer()
          .then((o) => pc.setLocalDescription(o))
          .then(() => {
            socket.emit("offer", {
              target: socketId,
              sdp: pc.localDescription,
              senderUserId: userInfo._id,
              targetUserId: userId,
            });
          });
      });
    });

    /* NEW USER */

    socket.on("user-connected", ({ userId, socketId }) => {
      const pc = createPeer(userId, socketId);

      pc.createOffer()
        .then((o) => pc.setLocalDescription(o))
        .then(() => {
          socket.emit("offer", {
            target: socketId,
            sdp: pc.localDescription,
            senderUserId: userInfo._id,
            targetUserId: userId,
          });
        });
    });

    /* OFFER */

    socket.on("offer", (payload) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      peerConnections[payload.senderUserId] = pc;

      localStream.getTracks().forEach((t) =>
        pc.addTrack(t, localStream)
      );

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            target: payload.socket,
            candidate: e.candidate,
            senderUserId: userInfo._id,
            targetUserId: payload.senderUserId,
          });
        }
      };

      pc.ontrack = (e) => {
        setRemoteStreams((prev) => {
          if (
            prev.some(
              (s) => s.userId === payload.senderUserId
            )
          )
            return prev;

          return [
            ...prev,
            {
              userId: payload.senderUserId,
              socketId: payload.socket,
              stream: e.streams[0],
            },
          ];
        });

        initAnalyser(
          e.streams[0],
          payload.senderUserId
        );
      };

      pc.setRemoteDescription(payload.sdp)
        .then(() => pc.createAnswer())
        .then((a) => pc.setLocalDescription(a))
        .then(() => {
          socket.emit("answer", {
            target: payload.socket,
            sdp: pc.localDescription,
            senderUserId: userInfo._id,
            targetUserId: payload.senderUserId,
          });
        });
    });

    /* ANSWER */

    socket.on("answer", (payload) => {
      peerConnections[
        payload.senderUserId
      ]?.setRemoteDescription(payload.sdp);
    });

    /* ICE FIX */

    socket.on("ice-candidate", (payload) => {
      const pc =
        peerConnections[payload.senderUserId] ||
        peerConnections[payload.targetUserId];

      if (pc && payload.candidate) {
        pc.addIceCandidate(
          new RTCIceCandidate(payload.candidate)
        ).catch(console.error);
      }
    });
  }, [localStream]);

  /* ===============================
     AUDIO ANALYSER
  ================================ */

  const initAnalyser = (stream, id) => {
    const ctx =
      audioContextRef.current ||
      new AudioContext();

    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();

    analyser.fftSize = 512;

    const source =
      ctx.createMediaStreamSource(stream);

    source.connect(analyser);

    detectSpeaking(analyser, id);
  };

  const detectSpeaking = (analyser, id) => {
    const data = new Uint8Array(
      analyser.frequencyBinCount
    );

    const check = () => {
      analyser.getByteFrequencyData(data);

      let sum = 0;

      data.forEach((v) => (sum += v));

      const volume = sum / data.length;

      setSpeakingUsers((p) => ({
        ...p,
        [id]: volume > 25,
      }));

      requestAnimationFrame(check);
    };

    check();
  };

  /* ===============================
     CONTROLS
  ================================ */

  const toggleCamera = () => {
    if (!localStream) return;

    const track = localStream.getVideoTracks()[0];

    track.enabled = !track.enabled;

    setIsCameraOn(track.enabled);

    socket.emit("toggle-camera", {
      userId: userInfo._id,
      cameraOn: track.enabled,
    });
  };

  const toggleMic = () => {
    if (!localStream) return;

    const track = localStream.getAudioTracks()[0];

    track.enabled = !track.enabled;

    setIsMicOn(track.enabled);

    socket.emit("toggle-mic", {
      userId: userInfo._id,
      micOn: track.enabled,
    });
  };

  /* ===============================
     UI
  ================================ */

  return (
    <div className="meeting-screen-container">
      {/* HEADER */}

      <div className="meeting-header">
        <h1>Meeting in progress...</h1>
        {meeting && <p>Room ID: {meeting.roomId}</p>}
      </div>

      {/* GRID */}

      <div className="video-grid-container">
        {/* LOCAL */}

        <div
          className={`video-participant-container ${
            speakingUsers.local ? "speaking" : ""
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
          />

          <div className="participant-name">
            {userInfo.name} (You)
          </div>
        </div>

        {/* REMOTE */}

        {remoteStreams.map((remote, i) => {
          const participant = participants.find(
            (p) => p._id === remote.userId
          );

          const remoteCameraOn =
            remoteMediaStatus[remote.userId]?.cameraOn;

          const remoteMicOn =
            remoteMediaStatus[remote.userId]?.micOn;

          return (
            <div
              key={i}
              className={`video-participant-container ${
                speakingUsers[remote.userId]
                  ? "speaking"
                  : ""
              }`}
            >
              <video
                autoPlay
                playsInline
                className={
                  !remoteCameraOn
                    ? "hidden-video"
                    : ""
                }
                ref={(ref) => {
                  if (ref) {
                    ref.srcObject = remote.stream;

                    ref.onloadedmetadata = () => {
                      ref.play().catch(() => {});
                    };
                  }
                }}
              />

              {!remoteCameraOn && (
                <div className="video-overlay-icon">
                  <FaVideoSlash size={60} />
                </div>
              )}

              <div className="participant-name">
                {participant
                  ? participant.name
                  : "Guest"}

                <span className="media-status-icons">
                  {remoteCameraOn ? (
                    <FaVideo />
                  ) : (
                    <FaVideoSlash />
                  )}

                  {remoteMicOn ? (
                    <FaMicrophone />
                  ) : (
                    <FaMicrophoneSlash />
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONTROLS */}

      <div className="meeting-controls">
        <button className="btn" onClick={toggleCamera}>
          {isCameraOn
            ? "Turn Camera Off"
            : "Turn Camera On"}
        </button>

        <button className="btn" onClick={toggleMic}>
          {isMicOn ? "Mute Mic" : "Unmute Mic"}
        </button>

        <button
          className="btn btn-danger"
          onClick={() =>
            navigate(`/team/${id}`)
          }
        >
          Leave Meeting
        </button>
      </div>
    </div>
  );
};

export default MeetingScreen;
