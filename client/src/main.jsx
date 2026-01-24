import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react' // 1. Import Gate
import { persistStore } from 'redux-persist' // 2. Import Persistor function
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './miscellaneous.css'
import App from './App.jsx'

// 3. Create the persistor
let persistor = persistStore(store);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    {/* 4. Wrap App in PersistGate. 
        The 'loading' prop is what shows while Redux is waking up. 
        You can replace <div>Loading...</div> with a spinner component. */}
    <PersistGate loading={<div className="text-center mt-5">Loading UniSync...</div>} persistor={persistor}>
      <StrictMode>
        <App />
      </StrictMode>
    </PersistGate>
  </Provider>,
)
