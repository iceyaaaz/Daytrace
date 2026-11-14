import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './styles/v1.css';
import './styles/v2.css';
import './themes/theme.css';
import './styles/x1.css';

createRoot(document.getElementById('root')).render(<App />);
