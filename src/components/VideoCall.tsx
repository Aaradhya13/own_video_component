import React from 'react';
import { Mic, MicOff, Monitor, Video, VideoOff } from 'lucide-react';

interface PeerConnection {
  peer: any;
  stream: MediaStream;
  email: string;
}

interface VideoCallProps {
  stream: MediaStream | null;
  email: string;
  peers: Map<string, PeerConnection>;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
}

const VideoCall = ({
  stream,
  email,
  peers,
  onToggleMute,
  onToggleVideo,
  onShareScreen,
  isMuted,
  isVideoOff
}: VideoCallProps) => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Local video */}
        {stream && (
          <div className="relative aspect-video">
            <video
              className="w-full h-full object-cover rounded-lg"
              autoPlay
              playsInline
              muted
              ref={video => {
                if (video) video.srcObject = stream;
              }}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You ({email})
            </div>
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <button
                onClick={onToggleMute}
                className={`p-2 rounded-full ${
                  isMuted ? 'bg-red-500' : 'bg-gray-800'
                } text-white hover:opacity-90 transition-opacity`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                onClick={onToggleVideo}
                className={`p-2 rounded-full ${
                  isVideoOff ? 'bg-red-500' : 'bg-gray-800'
                } text-white hover:opacity-90 transition-opacity`}
                title={isVideoOff ? "Turn on video" : "Turn off video"}
              >
                {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
              </button>
              <button
                onClick={onShareScreen}
                className="p-2 rounded-full bg-gray-800 text-white hover:opacity-90 transition-opacity"
                title="Share screen"
              >
                <Monitor size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Remote videos */}
        {Array.from(peers.entries()).map(([peerId, { stream: peerStream, email: peerEmail }]) => (
          <div key={peerId} className="relative aspect-video">
            <video
              className="w-full h-full object-cover rounded-lg"
              autoPlay
              playsInline
              ref={video => {
                if (video) video.srcObject = peerStream;
              }}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {peerEmail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoCall;