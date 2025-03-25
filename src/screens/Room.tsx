import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import VideoCall from '../components/VideoCall';
import Chat from '../components/Chat';
import AttendeesList from '../components/AttendeesList';
import { Attendee, Message } from '../types';


const socket = io('http://localhost:8000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

interface PeerConnection {
  peer: SimplePeer.Instance;
  stream: MediaStream;
  email: string;
}

const RoomScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const { email, isHost, allowedAttendees } = location.state || {};
  
  
  useEffect(() => {
    if (!email || !roomId) {
      navigate('/');
    }
  }, [email, roomId, navigate]);
  
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [messages, setMessages] = useState<Message[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  const createPeer = (userToSignal: string, callerID: string, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("sending:signal", { userToSignal, callerID, signal });
    });

    peer.on("error", (err) => {
      console.error("Peer Error:", err);
    });

    return peer;
  };

  const addPeer = (incomingSignal: any, callerID: string, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("returning:signal", { signal, callerID });
    });

    peer.on("error", (err) => {
      console.error("Peer Error:", err);
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const handleToggleMute = (attendeeId: string) => {
    if (isHost) {
      socket.emit("host:toggle-mute", { attendeeId });
    }
  };

  const handleBlockAttendee = (attendeeId: string) => {
    if (isHost) {
      socket.emit("host:toggle-block", { attendeeId });
    }
  };

  const handleRemoveAttendee = (attendeeId: string) => {
    if (isHost) {
      socket.emit("host:remove-attendee", { attendeeId });
    }
  };

  const toggleMute = () => {
    if (myStream) {
      const audioTracks = myStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!audioTracks[0]?.enabled);
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      const videoTracks = myStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!videoTracks[0]?.enabled);
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const videoTrack = screenStream.getVideoTracks()[0];

      
      peersRef.current.forEach(({ peer }) => {
        const senders = peer._senders || [];
        const sender = senders.find((s: any) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      
      if (myStream) {
        const oldVideoTrack = myStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          myStream.removeTrack(oldVideoTrack);
          myStream.addTrack(videoTrack);
        }
        setMyStream(new MediaStream([videoTrack, ...myStream.getAudioTracks()]));
      }

      // Handle screen share stop
      videoTrack.onended = async () => {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];

        peersRef.current.forEach(({ peer }) => {
          const senders = peer._senders || [];
          const sender = senders.find((s: any) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        });

        if (myStream) {
          const oldVideoTrack = myStream.getVideoTracks()[0];
          if (oldVideoTrack) {
            oldVideoTrack.stop();
            myStream.removeTrack(oldVideoTrack);
            myStream.addTrack(newVideoTrack);
          }
          setMyStream(new MediaStream([newVideoTrack, ...myStream.getAudioTracks()]));
        }
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setMyStream(stream);

        
        setAttendees([{
          id: socket.id,
          email,
          isHost,
          isMuted: false,
          isBlocked: false
        }]);

        socket.emit("room:join", { 
          email,
          room: roomId,
          isHost,
          allowedAttendees
        });

        socket.on("room:error", (error) => {
          alert(error);
          navigate('/');
        });

        socket.on("all:users", (users: { id: string, email: string }[]) => {
          const peers = new Map();
          
          users.forEach(user => {
            const peer = createPeer(user.id, socket.id, stream);
            peers.set(user.id, { peer, stream, email: user.email });
          });
          
          setPeers(peers);
          peersRef.current = peers;

          // Add all users to attendees list
          setAttendees(prev => [
            ...prev,
            ...users.map(user => ({
              id: user.id,
              email: user.email,
              isHost: false,
              isMuted: false,
              isBlocked: false
            }))
          ]);
        });

        socket.on("user:joined", ({ email: joinedEmail, id, isHost: joinedIsHost }) => {
          setAttendees(prev => [...prev, {
            id,
            email: joinedEmail,
            isHost: joinedIsHost,
            isMuted: false,
            isBlocked: false
          }]);

          setMessages(prev => [...prev, {
            sender: 'System',
            message: `${joinedEmail} joined the room`
          }]);
        });

        socket.on("receiving:signal", ({ signal, callerID, email: callerEmail }) => {
          const peer = addPeer(signal, callerID, stream);
          
          peer.on('stream', (remoteStream: MediaStream) => {
            const peerObj = { peer, stream: remoteStream, email: callerEmail };
            peersRef.current.set(callerID, peerObj);
            setPeers(new Map(peersRef.current));
          });
        });

        socket.on("returning:signal", ({ signal, id }) => {
          const peerObj = peersRef.current.get(id);
          if (peerObj) {
            peerObj.peer.signal(signal);

            peerObj.peer.on('stream', (remoteStream: MediaStream) => {
              peerObj.stream = remoteStream;
              setPeers(new Map(peersRef.current));
            });
          }
        });

        socket.on("user:left", ({ id }) => {
          const leavingUser = attendees.find(a => a.id === id);
          if (peersRef.current.has(id)) {
            peersRef.current.get(id)?.peer.destroy();
            peersRef.current.delete(id);
            setPeers(new Map(peersRef.current));
          }

          setAttendees(prev => prev.filter(attendee => attendee.id !== id));
          if (leavingUser) {
            setMessages(prev => [...prev, {
              sender: 'System',
              message: `${leavingUser.email} left the room`
            }]);
          }
        });

        socket.on("chat:message", ({ sender, message, timestamp }) => {
          setMessages(prev => [...prev, { sender, message, timestamp }]);
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setMediaError("Failed to connect to the server. Please try again.");
        });

      } catch (error) {
        console.error('Failed to start call:', error);
        if (error instanceof Error) {
          setMediaError(error.message);
        }
      }
    };

    if (email && roomId) {
      startCall();
    }

    return () => {
      socket.off("room:error");
      socket.off("all:users");
      socket.off("user:joined");
      socket.off("receiving:signal");
      socket.off("returning:signal");
      socket.off("user:left");
      socket.off("chat:message");
      socket.off("connect_error");
      
      peersRef.current.forEach(({ peer }) => peer.destroy());
      peersRef.current.clear();
      
      myStream?.getTracks().forEach(track => track.stop());
    };
  }, [email, roomId, isHost, allowedAttendees, navigate]);

  if (!email || !roomId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AttendeesList
        attendees={attendees}
        isHost={isHost}
        onToggleMute={handleToggleMute}
        onBlockAttendee={handleBlockAttendee}
        onRemoveAttendee={handleRemoveAttendee}
      />
      
      <div className="flex-1 ml-64">
        {mediaError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{mediaError}</span>
          </div>
        )}
        
        <VideoCall
          stream={myStream}
          email={email}
          peers={peers}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onShareScreen={shareScreen}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
        />
      </div>

      <Chat
        messages={messages}
        email={email}
        roomId={roomId}
        socket={socket}
      />
    </div>
  );
};

export default RoomScreen;