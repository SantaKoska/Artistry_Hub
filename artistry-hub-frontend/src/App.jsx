
import backgroundImage from './assets/Van-Gogh-Starry-Night.svg';

function App() {
  return (
    <div
      className="text-white flex justify-center items-center bg-cover bg-center h-screen"
      style={{
        backgroundImage: `url(${backgroundImage})`
      }}
    >
    </div>
  );
}

export default App;

