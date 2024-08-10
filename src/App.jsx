import { Route, Routes } from 'react-router-dom'
import { Home, SuccessPage, Transactions } from './screens'
import './App.css'
import WebSockets from './components/webSockets/WebSockets'

function App() {

  return (
    <div className='app'>
      {/* <WebSockets/> */}
      <Routes>
        {/* <Route path='/' element={<Home />} /> */}
        <Route path='/transaction/:token' element={<Transactions />} />
      </Routes>
    </div>
  )
}

export default App
