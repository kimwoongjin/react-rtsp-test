import './App.css';
import VideoView from './components/VideoView';

function App() {
  // const [players, setPlayers] = useState<any[]>([]);

  // useEffect(() => {
  //   // 기존 플레이어 정리
  //   return () => {
  //     players.forEach((player) => {
  //       if (player && typeof player.destroy === 'function') {
  //         player.destroy();
  //       }
  //     });
  //   };
  // }, [players]);

  // useEffect(() => {
  //   const newPlayers = STREAM_CONFIGS.map((config) => {
  //     const videoWrapper = document.getElementById(`videoWrapper-${config.id}`);
  //     if (!videoWrapper) return null;

  //     const videoUrl = `ws://localhost:${config.port}`;

  //     return new JSMpeg.VideoElement(videoWrapper, videoUrl, {
  //       autoplay: true,
  //       loop: true,
  //       decodeFirstFrame: true,
  //       onSourceEstablished: () => {
  //         console.log(`Stream ${config.name} connected`);
  //       },
  //       onSourceCompleted: () => {
  //         console.log(`Stream ${config.name} ended`);
  //       },
  //       onError: (error: Error) => {
  //         console.error(`Error in stream ${config.name}:`, error);
  //       },
  //     });
  //   });

  //   setPlayers(newPlayers);
  // }, []);

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
      <VideoView />
      {/* {STREAM_CONFIGS.map((config) => (
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
      ))} */}
    </div>
  );
}

export default App;
