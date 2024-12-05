import { Request, Response } from 'express';
import { WebSocket } from 'ws';

const express = require('express');
const Stream = require('node-rtsp-stream');
const cors = require('cors');

const app = express();
const port = 8080;
const WS_PORT = 9999;

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
    channel: 'channel1',
  },
  {
    id: 'stream2',
    name: 'cctv2',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv002.stream',
    channel: 'channel2',
  },
  {
    id: 'stream3',
    name: 'cctv3',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv003.stream',
    channel: 'channel3',
  },
  {
    id: 'stream4',
    name: 'cctv4',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv004.stream',
    channel: 'channel4',
  },
  {
    id: 'stream5',
    name: 'cctv5',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv005.stream',
    channel: 'channel5',
  },
  {
    id: 'stream6',
    name: 'cctv6',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv006.stream',
    channel: 'channel6',
  },
  {
    id: 'stream7',
    name: 'cctv7',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv007.stream',
    channel: 'channel7',
  },
  {
    id: 'stream8',
    name: 'cctv8',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv008.stream',
    channel: 'channel8',
  },
  {
    id: 'stream9',
    name: 'cctv9',
    streamUrl: 'rtsp://210.99.70.120:1935/live/cctv009.stream',
    channel: 'channel9',
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

// WebSocket 서버 설정
const wss = new WebSocket.Server({ port: WS_PORT });
const streamInstances = new Map();
const channelCLients = new Map();

// WebSocket 연결 처리
wss.on('connection', (ws, req) => {
  const channel = new URL(req.url!, `ws://localhost:${WS_PORT}`).searchParams.get('channel');

  if (!channel) {
    ws.close();
    return;
  }

  if (!channelCLients.has(channel)) {
    channelCLients.set(channel, new Set());
  }
  channelCLients.get(channel).add(ws);

  console.log(`New Client connected to channel: ${channel}`);

  ws.on(`close`, () => {
    channelCLients.get(channel).delete(ws);
    console.log(`Client disconnected from channel: ${channel}`);
  });

  ws.on(`error`, (error) => {
    console.log(`WebSocket error on channel ${channel}:`, error);
  });
});

// 스트림 데이터 전송 함수
function broadcastStreamData(channel: string, data: Buffer) {
  const clients = channelCLients.get(channel);

  if (clients) {
    clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

// 단일 스트림 시작 함수
function startSingleStream(config: (typeof STREAM_CONFIGS)[0]) {
  try {
    const ffmpeg = require('child_process').spawn('ffmpeg', [
      '-i',
      config.streamUrl,
      '-f',
      'mpegts',
      '-b:v',
      '800k',
      '-r',
      '30',
      '-bf',
      '0',
      '-tune',
      'zerolatency',
      'pipe:1',
    ]);

    ffmpeg.stdout.on('data', (data: Buffer) => {
      broadcastStreamData(config.channel, data);
    });

    ffmpeg.stderr.on('data', (data: Buffer) => {
      console.log(`FFmpeg ${config.name} stderr: ${data}`);
    });

    streamInstances.set(config.id, ffmpeg);
    console.log(`Stream ${config.name} started successfully!`);
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
      existingStream.kill();
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
    wsPort: STREAM_CONFIGS.find((config) => config.id === id)?.channel,
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
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`WebSocket server is running on port ${WS_PORT}`);
});

// 프로세스 종료 처리
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Shutting down gracefully...');

  streamInstances.forEach((stream, id) => {
    try {
      stream.kill();
      streamInstances.delete(id);
    } catch (error) {
      console.error('Error stopping stream during shutdown:', error);
    }
  });

  // WebSocket 서버 종료
  wss.close(() => {
    console.log(`WebSocket Server Closed!`);
    process.exit(0);
  });

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}
