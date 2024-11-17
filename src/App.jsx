import { Route, Routes } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/errorBoundary';
import React, { Suspense } from 'react';

// const Home = React.lazy(() => import('./screens/Home'));
const Transactions = React.lazy(() => import('./screens/transactions/Transactions'));
// const Test = React.lazy(() => import('./components/testingComp/Test'));
// const WebSockets = React.lazy(() => import('./components/webSockets/WebSockets'));
console.log("payment");

function App() {
  return (
    <div className='app'>
      {/* <Suspense fallback={<div>Loading WebSockets...</div>}>
        <WebSockets />
      </Suspense> */}

      <Routes>
        {/* <Route 
          path='/' 
          element={
            <Suspense fallback={<div>Loading Home...</div>}>
              <Home />
            </Suspense>
          } 
        />
        <Route 
          path='/test' 
          element={
            <Suspense fallback={<div>Loading Test...</div>}>
              <Test />
            </Suspense>
          } 
        /> */}
        <Route 
          path='/transaction/:token' 
          element={
            <ErrorBoundary>
              <Suspense fallback={<div>Loading Transaction...</div>}>
                <Transactions />
              </Suspense>
            </ErrorBoundary>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
