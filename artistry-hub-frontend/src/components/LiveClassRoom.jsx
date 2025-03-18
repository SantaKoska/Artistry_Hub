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

  //   useEffect(() => {
  //     client.on("user-joined", (user) => {
  //       alert(`${user.uid} has joined`);
  //     });
  //   }, []);

  const remoteUsers = useRemoteUsers();

  // Updated useEffect for remote user audio
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.hasAudio && user.audioTrack) {
        // Play audio with specific configurations
        user.audioTrack.play({ volume: 100 }).catch((error) => {
          console.error("Error playing remote audio:", error);
        });
      }
    });

    return () => {
      remoteUsers.forEach((user) => {
        if (user.hasAudio && user.audioTrack) {
          user.audioTrack.stop();
        }
      });
    };
  }, [remoteUsers]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {isConnected && (
        <>
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`px-4 py-2 rounded-lg ${
                micOn ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {micOn ? "Mute" : "Unmute"}
            </button>
            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`px-4 py-2 rounded-lg ${
                cameraOn ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
            </button>
          </div>

          <div className="flex flex-1 gap-4">
            <div className="w-3/4 bg-gray-900 rounded-xl overflow-hidden relative h-[600px]">
              <LocalUser
                cameraOn={cameraOn}
                micOn={micOn}
                videoTrack={localCameraTrack}
                audioTrack={localMicrophoneTrack}
              >
                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
                  {isTestClass ? "You" : isArtist ? "Artist (You)" : "You"}
                </div>
              </LocalUser>
            </div>

            <div className="w-1/4 space-y-4 p-4 bg-white">
              {remoteUsers.map((user) => (
                <div
                  key={user.uid}
                  className="bg-gray-900 rounded-xl overflow-hidden relative h-[200px]"
                >
                  <RemoteUser user={user} playVideo={true}>
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
                      {isTestClass
                        ? "User"
                        : user.uid.toString().includes("artist")
                        ? "Artist"
                        : "Student"}
                    </div>
                  </RemoteUser>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LiveClassRoom;
