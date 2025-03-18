import React, { useEffect, useState } from "react";
import AgoraRTC, {
  AgoraRTCProvider,
  LocalUser,
  RemoteUser,
  useJoin,
  useIsConnected,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

function LiveClassRoom({ classId, isArtist }) {
  return (
    <div className="w-full h-screen flex flex-col gap-2">
      <h1 className="w-full h-auto bg-gradient-to-r from-yellow-400 to-orange-500 p-4 text-xl font-bold flex justify-center shadow-lg text-black">
        Live Class Session
      </h1>
      <div className="flex flex-1 w-full p-2">
        <AgoraRTCProvider client={client}>
          <div className="w-full h-[80vh]">
            <LiveClassVideo classId={classId} isArtist={isArtist} />
          </div>
        </AgoraRTCProvider>
      </div>
    </div>
  );
}

function LiveClassVideo({ classId, isArtist }) {
  const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;
  const isConnected = useIsConnected();
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const remoteUsers = useRemoteUsers();

  const handleEndCall = async () => {
    if (localMicrophoneTrack) {
      await localMicrophoneTrack.close();
    }
    if (localCameraTrack) {
      await localCameraTrack.close();
    }
    await client.leave();
    window.history.back();
  };

  // For test class, generate a random user ID instead of using artist/student roles
  const isTestClass = classId === "test-123";
  const userId = isTestClass
    ? `test-user-${Math.random().toString(36).substr(2, 9)}`
    : isArtist
    ? "artist"
    : `student-${Date.now()}`;

  useJoin(
    {
      appid: AGORA_APP_ID,
      channel: `live-class-${classId}`,
      token: null,
      uid: userId,
    },
    true
  );
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Updated useEffect for remote user tracks
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.hasAudio && user.audioTrack) {
        user.audioTrack.play();
      }
      if (user.hasVideo && user.videoTrack) {
        // Ensure video track is properly initialized
        user.videoTrack.play(`video-${user.uid}`, { fit: "cover" });
      }
    });

    return () => {
      remoteUsers.forEach((user) => {
        if (user.hasAudio && user.audioTrack) {
          user.audioTrack.stop();
        }
        if (user.hasVideo && user.videoTrack) {
          user.videoTrack.stop();
        }
      });
    };
  }, [remoteUsers]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {isConnected && (
        <>
          <div className="flex-1 relative">
            <div className="w-full h-[80vh] relative">
              <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden">
                {isArtist ? (
                  <LocalUser
                    cameraOn={cameraOn}
                    micOn={micOn}
                    videoTrack={localCameraTrack}
                    audioTrack={localMicrophoneTrack}
                    className="w-full h-full"
                  >
                    <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-lg text-white font-semibold">
                      Artist (You)
                    </div>
                  </LocalUser>
                ) : (
                  remoteUsers.map(
                    (user) =>
                      user.uid.toString() === "artist" && (
                        <RemoteUser
                          key={user.uid}
                          user={user}
                          playVideo={true}
                          className="w-full h-full object-cover"
                        >
                          <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-lg text-white font-semibold">
                            Artist
                          </div>
                        </RemoteUser>
                      )
                  )
                )}
              </div>

              {!isArtist && (
                <div className="absolute bottom-4 right-4 w-[280px] h-[210px] bg-gray-900 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                  <LocalUser
                    cameraOn={cameraOn}
                    micOn={micOn}
                    videoTrack={localCameraTrack}
                    audioTrack={localMicrophoneTrack}
                    className="w-full h-full"
                  >
                    <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-lg text-white">
                      You
                    </div>
                  </LocalUser>
                </div>
              )}

              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 bg-black/60 px-6 py-3 rounded-full">
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`px-4 py-2 rounded-full transition-all ${
                    micOn
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  } text-white font-medium`}
                >
                  {micOn ? "Mute" : "Unmute"}
                </button>
                <button
                  onClick={() => setCameraOn(!cameraOn)}
                  className={`px-4 py-2 rounded-full transition-all ${
                    cameraOn
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  } text-white font-medium`}
                >
                  {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                </button>
                <button
                  onClick={handleEndCall}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition-all"
                >
                  End Call
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LiveClassRoom;
