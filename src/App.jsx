import { Route, Routes } from 'react-router-dom'
import './App.css'
import { Home, Transactions } from './screens'
import Test from './components/testingComp/Test'
import ErrorBoundary from './components/errorBoundary'
import WebSockets from './components/webSockets/WebSockets'

function App() {

  return (
    <div className='app'>
      {/* <WebSockets/> */}
      <Routes>
        {/* <Route path='/' element={<Home />} /> */}
        {/* <Route path='/test' element={<Test />} /> */}

        <Route path='/transaction/:token' element={<ErrorBoundary><Transactions /> </ErrorBoundary>} />

      </Routes>
    </div>
  )
}

export default App
