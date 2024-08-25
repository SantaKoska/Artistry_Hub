import Login from './login';
import Register from './Register';
import { Route } from 'react-router-dom'; 

//bg image 
import backgroundImage from './assets/Van-Gogh-Starry-Night.svg';
import { Routes } from 'react-router-dom';

function App() {
  return (
    //background image 
    <div
      className="text-white flex justify-center items-center bg-cover bg-center h-screen"
      style={{
        backgroundImage: `url(${backgroundImage})`
      }}
    >
      {/* Routes */}
      <Routes>
        <Route path='login' element={ <Login/>}/>
        <Route path='register' element={ <Register/>}/>
      </Routes>
    </div>
  );
}

export default App;

