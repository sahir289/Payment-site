import { Route, Routes } from 'react-router-dom'
import { Home, SuccessPage, Transactions } from './screens'
import './App.css'

function App() {

  return (
    <div className='app'>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/transaction/:token' element={<Transactions />} />
      </Routes>
    </div>
  )
}

export default App
