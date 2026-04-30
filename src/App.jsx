import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LiveData from './pages/LiveData';
import PlanTravel from './pages/PlanTravel';
import Sustainability from './pages/Sustainability';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <div className="flex-grow-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live-data" element={<LiveData />} />
            <Route path="/plan-travel" element={<PlanTravel />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;