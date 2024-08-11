import { Route, Routes } from 'react-router-dom'
import './App.css'
import { Home, Transactions } from './screens'
import Test from './components/testingComp/Test'

function App() {

  return (
    <div className='app'>
      {/* <WebSockets/> */}
      <Routes>
        {/* <Route path='/' element={<Home />} /> */}
        {/* <Route path='/test' element={<Test />} /> */}

        <Route path='/transaction/:token' element={<Transactions />} />
      </Routes>
    </div>
  )
}

export default App
