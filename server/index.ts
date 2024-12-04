import { Request, Response } from 'express';

const express = require('express');
const Stream = require('node-rtsp-stream');
const cors = require('cors');

const app = express();
const port = 8080;

// CORS 설정 최적화
app.use(
  cors({
    origin: '*', // 실제 운영 환경에서는 특정 도메인으로 제한하는 것이 좋습니다
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

const STREAM_CONFIGS = [
  {
    id: 'stream1',
    name: 'cctv1',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv001.stream',
    wsPort: 9991,
  },
  {
    id: 'stream2',
    name: 'cctv2',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv002.stream',
    wsPort: 9992,
  },
  {
    id: 'stream3',
    name: 'cctv3',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv003.stream',
    wsPort: 9993,
  },
  {
    id: 'stream4',
    name: 'cctv4',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv004.stream',
    wsPort: 9994,
  },
  {
    id: 'stream5',
    name: 'cctv5',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv005.stream',
    wsPort: 9995,
  },
  {
    id: 'stream6',
    name: 'cctv6',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv006.stream',
    wsPort: 9996,
  },
  {
    id: 'stream7',
    name: 'cctv7',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv007.stream',
    wsPort: 9997,
  },
  {
    id: 'stream8',
    name: 'cctv8',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv008.stream',
    wsPort: 9998,
  },
  {
    id: 'stream9',
    name: 'cctv9',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv009.stream',
    wsPort: 9999,
  },
];

const DEFAULT_FFMPEG_OPTIONS = {
  '-r': 30,
  '-codec:v': 'mpeg1video',
  '-b:v': '800k',
  '-bf': 0, // B-frames 비활성화로 지연 감소
  '-q:v': 5, // 화질 설정 (1-31, 낮을수록 좋은 품질)
  '-tune': 'zerolatency', // 지연 최소화
};

// 스트림 관리를 위한 Map
const streamInstances = new Map();

// 단일 스트림 시작 함수
function startSingleStream(config: (typeof STREAM_CONFIGS)[0]) {
  try {
    const streamInstance = new Stream({
      name: config.name,
      streamUrl: config.streamUrl,
      wsPort: config.wsPort,
      ffmpegOptions: DEFAULT_FFMPEG_OPTIONS,
    });

    console.log('Stream started successfully !');

    if (streamInstance.wsServer) {
      streamInstance.wsServer.on('connection', (socket: any) => {
        console.log(`New WebSocket connection established for ${config.name}`);

        socket.on('close', () => {
          console.log(`WebSocket connection closed for ${config.name}`);
        });

        socket.on('error', (error: Error) => {
          console.error(`WebSocket error for ${config.name}:`, error);
          setTimeout(() => reconnectStream(config), 5000);
        });
      });
    }

    streamInstances.set(config.id, streamInstance);
  } catch (error) {
    console.error(`Failed to start stream ${config.name}:`, error);
    setTimeout(() => startSingleStream(config), 5000);
  }
}

// 모든 스트림 시작
function startAllStreams() {
  STREAM_CONFIGS.forEach((config) => startSingleStream(config));
}

// 스트림 재연결 함수
function reconnectStream(config: (typeof STREAM_CONFIGS)[0]) {
  const existingStream = streamInstances.get(config.id);
  if (existingStream) {
    try {
      existingStream.stop();
      streamInstances.delete(config.id);
    } catch (error) {
      console.error(`Error stopping stream ${config.name}:`, error);
    }
  }

  startSingleStream(config);
}

// 스트림 상태 확인 엔드포인트
app.get('/stream-status', (req: Request, res: Response) => {
  const status = Array.from(streamInstances.entries()).map(([id, instance]) => ({
    id,
    isActive: !!instance,
    wsPort: STREAM_CONFIGS.find((config) => config.id === id)?.wsPort,
  }));
  res.json(status);
});

// 기본 라우트
app.get('/', (req: any, res: any) => {
  res.send('Hello World!');
});

// 특정 스트림 재시작 엔드포인트
app.post('/restart-stream/:streamId', (req: Request, res: Response) => {
  const streamId = req.params.streamId;
  const config = STREAM_CONFIGS.find((config) => config.id === streamId);

  if (!config) {
    return res.status(404).json({ error: 'Stream not found' });
  }

  reconnectStream(config);
  res.json({ message: `Restarting stream ${streamId}` });
});

// 초기 스트림 시작
startAllStreams();

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// 프로세스 종료 처리
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  streamInstances.forEach((stream, id) => {
    try {
      stream.stop();
    } catch (error) {
      console.error('Error stopping stream during shutdown:', error);
    }
  });
  process.exit(0);
}
