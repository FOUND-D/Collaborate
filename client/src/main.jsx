import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux' // Import Provider
import store from './store' // Import the Redux store
import 'bootstrap/dist/css/bootstrap.min.css' // Import Bootstrap CSS
import './index.css'
import './miscellaneous.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <StrictMode>
      <App />
    </StrictMode>
  </Provider>,
)
