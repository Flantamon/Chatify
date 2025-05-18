import React, { useEffect, useRef, useState, useCallback } from 'react';

const VideoCall = ({ socket, onEndCall }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  const initMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    setLocalStream(stream);
    return stream;
  }, []);

  const createPeer = useCallback(
    (stream) => {
      const pc = new RTCPeerConnection(config);

      // Добавляем треки локального потока
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', event.candidate);
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        console.log('ontrack event streams:', remoteStream);
      
        if (remoteVideoRef.current && remoteStream.id !== localStream?.id) {
          remoteVideoRef.current.srcObject = remoteStream;
        } else {
          console.log('Received local stream in ontrack, ignoring');
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [socket]
  );

  const startCall = useCallback(async () => {
    const stream = await initMedia();
    console.log('1');
    const pc = createPeer(stream);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', offer);
  }, [initMedia, createPeer, socket]);

  const joinCall = useCallback(() => {
    setIsJoining(true);
  }, []);

  const endCall = useCallback(() => {
    console.log('Call ended');
  
    // Остановка всех треков
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  
    // Закрытие peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  
    // Очистка видеопотоков
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  
    // Можно отправить "call-ended" сообщение через socket, если нужно
    // socket.emit('call-ended');
  
    setLocalStream(null);
    setIsJoining(false);
    onEndCall();
  }, [localStream]);

  useEffect(() => {
    if (!isJoining) return;
    console.log('3');
    socket.on('offer', async (offer) => {
      console.log('Received offer:', offer);
      try {
        const stream = await initMedia();
        console.log('2');
        const pc = createPeer(stream);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer', answer);
      } catch (e) {
        console.error('Error handling offer:', e);
      }
    });

    return () => {
      socket.off('offer');
    };
  }, [isJoining, socket, initMedia, createPeer]);

  useEffect(() => {
    socket.on('answer', async (answer) => {
      console.log('Received answer:', answer);
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) {
        console.error('Failed to set remote description for answer:', e);
      }
    });

    socket.on('candidate', async (candidate) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    });

    return () => {
      socket.off('answer');
      socket.off('candidate');
    };
  }, [socket]);

  return (
    <div>
      <h2>Video Chat</h2>
      <button onClick={startCall}>Начать вызов</button>
      <button onClick={joinCall}>Присоединиться</button>
      <button onClick={endCall}>Завершить звонок</button>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '45%', backgroundColor: '#000' }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '45%', backgroundColor: '#000' }}
        />
      </div>
    </div>
  );
};

export default VideoCall;