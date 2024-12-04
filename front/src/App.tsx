import { useEffect, useState } from 'react';
// @ts-ignore
import JSMpeg from '@cycjimmy/jsmpeg-player';
import './App.css';

interface StreamConfig {
  id: string;
  name: string;
  port: number;
}

const STREAM_CONFIGS: StreamConfig[] = [
  {
    id: 'stream1',
    name: 'CCTV1',
    port: 9991,
  },
  {
    id: 'stream2',
    name: 'CCTV2',
    port: 9992,
  },
  {
    id: 'stream3',
    name: 'CCTV3',
    port: 9993,
  },
  {
    id: 'stream4',
    name: 'CCTV4',
    port: 9994,
  },
  {
    id: 'stream5',
    name: 'CCTV5',
    port: 9995,
  },
  {
    id: 'stream6',
    name: 'CCTV6',
    port: 9996,
  },
  {
    id: 'stream7',
    name: 'CCTV7',
    port: 9997,
  },
  {
    id: 'stream8',
    name: 'CCTV8',
    port: 9998,
  },
  {
    id: 'stream9',
    name: 'CCTV9',
    port: 9999,
  },
];

function App() {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    // 기존 플레이어 정리
    return () => {
      players.forEach((player) => {
        if (player && typeof player.destroy === 'function') {
          player.destroy();
        }
      });
    };
  }, [players]);

  useEffect(() => {
    const newPlayers = STREAM_CONFIGS.map((config) => {
      const videoWrapper = document.getElementById(`videoWrapper-${config.id}`);
      if (!videoWrapper) return null;

      const videoUrl = `ws://localhost:${config.port}`;

      return new JSMpeg.VideoElement(videoWrapper, videoUrl, {
        autoplay: true,
        loop: true,
        decodeFirstFrame: true,
        onSourceEstablished: () => {
          console.log(`Stream ${config.name} connected`);
        },
        onSourceCompleted: () => {
          console.log(`Stream ${config.name} ended`);
        },
        onError: (error: Error) => {
          console.error(`Error in stream ${config.name}:`, error);
        },
      });
    });

    setPlayers(newPlayers);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: '2px',
        backgroundColor: '#333',
      }}
    >
      {STREAM_CONFIGS.map((config) => (
        <div
          key={config.id}
          style={{
            position: 'relative',
            backgroundColor: '#000',
            overflow: 'hidden',
          }}
        >
          <div
            id={`videoWrapper-${config.id}`}
            style={{
              position: 'absolute',
              width: '640px',
              height: '360px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              zIndex: 1,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default App;
