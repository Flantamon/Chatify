import React, { useEffect, useRef } from 'react';

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function VideoCall({ socket, roomId }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', { roomId, candidate: event.candidate });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStream.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        socket.emit('join-room', roomId);

        // If you are the caller, create an offer
        socket.on('ready', async () => {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit('offer', { roomId, offer });
        });
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    }

    start();

    socket.on('offer', async ({ offer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { roomId, answer });
    });
    socket.on('answer', async ({ answer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });
    
    socket.on('candidate', async ({ candidate }) => {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    });
    
    return () => {
      socket.off('ready');
      socket.off('offer');
      socket.off('answer');
      socket.off('candidate');
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, roomId]);

  return (
  <div className="video-call">
  <video
  ref={localVideoRef}
  autoPlay
  muted
  playsInline
  style={{ width: 200, border: '1px solid black' }}
  />
  <video
  ref={remoteVideoRef}
  autoPlay
  playsInline
  style={{ width: 200, border: '1px solid black' }}
  />
  </div>
  );
  }
