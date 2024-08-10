import { Route, Routes } from 'react-router-dom'
import './App.css'
import { Home, Transactions } from './screens'

function App() {

  return (
    <div className='app'>
      {/* <WebSockets/> */}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/transaction/:token' element={<Transactions />} />
      </Routes>
    </div>
  )
}

export default App
