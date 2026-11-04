import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import order matters: when two rules tie, the later file wins.
import './styles/reset.css'; // GIVEN: design tokens + reset (do not edit)
import './styles/base.css'; //  Member 1
import './styles/nav.css'; //   Member 2
import './styles/form.css'; //  Member 3

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
