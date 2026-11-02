import Dashboard from './pages/Dashboard';
import { Toaster } from 'sonner';
import './App.css';
import './index.css';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Dashboard />
    </>
  );
}

export default App;