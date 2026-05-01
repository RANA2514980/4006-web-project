import { Link } from 'react-router-dom';
import { Collapse } from 'bootstrap';
import { FiMapPin } from 'react-icons/fi';

function Navbar() {
  const closeNavbar = () => {
    const navbar = document.getElementById('navbarNav');
    if (!navbar || !navbar.classList.contains('show')) return;
    const bsCollapse = Collapse.getOrCreateInstance(navbar);
    bsCollapse.hide();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand fw-bold d-flex align-items-center gap-2">
          <FiMapPin className="text-success" />
          St Mary's Urban Mobility Hub
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={closeNavbar}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/live-data" className="nav-link" onClick={closeNavbar}>
                Live Data
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/plan-travel" className="nav-link" onClick={closeNavbar}>
                Plan Travel
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/sustainability" className="nav-link" onClick={closeNavbar}>
                Sustainability
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link" onClick={closeNavbar}>
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
