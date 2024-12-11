import { useCallback, useEffect } from 'react';
// @ts-ignore
import JSMpeg from '@cycjimmy/jsmpeg-player';

export interface StreamConfig {
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

export default function VideoView() {
  // WebSocket 연결 테스트
  const testWebSocket = useCallback((config: StreamConfig) => {
    const ws = new WebSocket(`ws://localhost:${config.port}`);

    ws.onopen = () => {
      console.log(`WebSocket connection established for ${config.name}`);
      ws.close();
    };

    ws.onerror = (error) => {
      console.error(`WebSocket connection failed for ${config.name}:`, error);
    };
  }, []);

  // 비디오 플레이어 생성
  const createVideoPlayer = useCallback((config: StreamConfig) => {
    const videoWrapper = document.getElementById(`videoWrapper-${config.id}`);
    if (!videoWrapper) {
      console.error(`Video wrapper not found for ${config.name}`);
      return null;
    }

    const videoUrl = `ws://localhost:${config.port}`;
    const wsUrl = new URL(videoUrl);
    if (wsUrl.protocol !== 'ws:' && wsUrl.protocol !== 'wss:') {
      console.error(`Invalid WebSocket URL for ${config.name}`);
      return null;
    }

    return new JSMpeg.VideoElement(videoWrapper, videoUrl, {
      autoplay: true,
      loop: true,
      decodeFirstFrame: true,
      videoBufferSize: 1024 * 1024, // 버퍼 크기 증가
      audioBufferSize: 128 * 1024, // 오디오 버퍼 크기 설정
      disableGl: true, // WebGL 비활성화
      progressive: true, // 프로그레시브 로딩 활성화
      chunkSize: 1024 * 64, // 청크 크기 설정
      // maxAudioLag: 0.5,            // 오디오 지연 제한
      protocols: ['mpeg'], // 프로토콜 명시적 지정
      onSourceEstablished: () => {
        console.log(`Stream ${config.name} connected`);
      },
      onSourceCompleted: () => {
        console.log(`Stream ${config.name} ended`);
        // 재연결 로직
        setTimeout(() => {
          console.log(`Attempting to reconnect ${config.name}...`);
          const newPlayer = createVideoPlayer(config);
          if (newPlayer) {
            console.log(`Reconnected ${config.name}`);
          }
        }, 5000);
      },
      onError: (error: Error) => {
        console.error(`Error in stream ${config.name}:`, error);
        // 에러 발생 시 재연결 시도
        setTimeout(() => {
          console.log(`Attempting to reconnect after error ${config.name}...`);
          const newPlayer = createVideoPlayer(config);
          if (newPlayer) {
            console.log(`Reconnected ${config.name} after error`);
          }
        }, 5000);
      },
    });
  }, []);

  useEffect(() => {
    const players: any[] = [];

    // 각 스트림에 대해 WebSocket 테스트 및 플레이어 생성
    STREAM_CONFIGS.forEach((config) => {
      testWebSocket(config);
      const player = createVideoPlayer(config);
      if (player) {
        players.push(player);
      }
    });

    // cleanup 개선
    return () => {
      players.forEach((player) => {
        if (player) {
          try {
            // 플레이어가 존재하는지 추가 확인
            if (player.player && typeof player.player.destroy === 'function') {
              player.player.destroy();
            }
            // VideoElement 자체 destroy 메서드 호출
            if (typeof player.destroy === 'function') {
              player.destroy();
            }
          } catch (error) {
            console.error(`Error destroying player:`, error);
          }
        }
      });
    };
  }, [createVideoPlayer, testWebSocket]);

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
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              color: 'white',
              zIndex: 2,
            }}
          >
            {config.name}
          </div>
        </div>
      ))}
    </div>
  );
}
