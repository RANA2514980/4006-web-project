import { useEffect, useMemo, useState } from 'react';
import {
  FiHeart,
  FiBell,
  FiClock,
  FiCheckCircle,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';

const STORAGE_KEYS = {
  favorites: 'smuh_favorite_journeys',
  modes: 'smuh_preferred_modes',
  alerts: 'smuh_alerts',
  travelTimes: 'smuh_travel_times',
};

const AVAILABLE_MODES = ['tube', 'bus', 'rail', 'overground', 'dlr', 'tram', 'cycle', 'walk'];

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function Dashboard() {
  const [favorites, setFavorites] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [preferredModes, setPreferredModes] = useState([]);
  const [travelTimes, setTravelTimes] = useState([]);

  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [alertInput, setAlertInput] = useState('');
  const [timeRoute, setTimeRoute] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');

  useEffect(() => {
    setFavorites(readStorage(STORAGE_KEYS.favorites, []));
    setAlerts(readStorage(STORAGE_KEYS.alerts, []));
    setPreferredModes(readStorage(STORAGE_KEYS.modes, ['tube', 'bus']));
    setTravelTimes(readStorage(STORAGE_KEYS.travelTimes, [
      { id: 'work', route: 'Home to Campus', minutes: 35 },
      { id: 'gym', route: 'Campus to Gym', minutes: 20 },
    ]));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.modes, JSON.stringify(preferredModes));
  }, [preferredModes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.travelTimes, JSON.stringify(travelTimes));
  }, [travelTimes]);

  const handleAddFavorite = () => {
    if (!fromInput.trim() || !toInput.trim()) return;
    const newItem = {
      id: `${fromInput}-${toInput}-${Date.now()}`,
      from: fromInput,
      to: toInput,
    };
    setFavorites((prev) => [newItem, ...prev]);
    setFromInput('');
    setToInput('');
  };

  const handleAddAlert = () => {
    if (!alertInput.trim()) return;
    setAlerts((prev) => [{ id: `${alertInput}-${Date.now()}`, label: alertInput }, ...prev]);
    setAlertInput('');
  };

  const handleAddTime = () => {
    if (!timeRoute.trim() || !Number(timeMinutes)) return;
    setTravelTimes((prev) => [
      { id: `${timeRoute}-${Date.now()}`, route: timeRoute, minutes: Number(timeMinutes) },
      ...prev,
    ]);
    setTimeRoute('');
    setTimeMinutes('');
  };

  const toggleMode = (mode) => {
    setPreferredModes((prev) =>
      prev.includes(mode) ? prev.filter((item) => item !== mode) : [...prev, mode]
    );
  };

  const totalFavorites = favorites.length;
  const totalAlerts = alerts.length;

  const summary = useMemo(() => (
    {
      favorites: totalFavorites,
      alerts: totalAlerts,
      modes: preferredModes.length,
    }
  ), [totalFavorites, totalAlerts, preferredModes.length]);

  return (
    <div className="bg-light" style={{ minHeight: '100vh' }}>
      <section
        className="py-5"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(255,255,255,0.25), transparent 60%), linear-gradient(135deg, #00685f 0%, #008378 100%)',
        }}
      >
        <div className="container text-white">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-7">
              <p className="text-uppercase fw-semibold" style={{ letterSpacing: '2px', color: 'rgba(255,255,255,0.8)' }}>
                Personal Dashboard
              </p>
              <h1 className="fw-bold" style={{ fontSize: '2.8rem' }}>
                Your saved journeys and alerts.
              </h1>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem' }}>
                Store favorite routes, track your usual travel times, and keep
                notifications ready for the lines you depend on most.
              </p>
            </div>
            <div className="col-12 col-lg-5">
              <div className="bg-white text-dark p-4 rounded-4 shadow" style={{ border: '1px solid #e8ecf1' }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiCheckCircle className="text-success" />
                  <h2 className="h6 fw-bold mb-0">Overview</h2>
                </div>
                <div className="row g-3">
                  <div className="col-4">
                    <div className="text-muted small">Favorites</div>
                    <div className="fw-bold" style={{ color: '#00685f' }}>{summary.favorites}</div>
                  </div>
                  <div className="col-4">
                    <div className="text-muted small">Alerts</div>
                    <div className="fw-bold" style={{ color: '#00685f' }}>{summary.alerts}</div>
                  </div>
                  <div className="col-4">
                    <div className="text-muted small">Modes</div>
                    <div className="fw-bold" style={{ color: '#00685f' }}>{summary.modes}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiHeart className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Favorite Journeys</h2>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="text"
                      value={fromInput}
                      onChange={(e) => setFromInput(e.target.value)}
                      className="form-control"
                      placeholder="From"
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="text"
                      value={toInput}
                      onChange={(e) => setToInput(e.target.value)}
                      className="form-control"
                      placeholder="To"
                    />
                  </div>
                  <div className="col-12">
                    <button type="button" onClick={handleAddFavorite} className="btn btn-success w-100">
                      <FiPlus className="me-2" /> Save Journey
                    </button>
                  </div>
                </div>

                <div className="list-group list-group-flush mt-3">
                  {favorites.map((item) => (
                    <div key={item.id} className="list-group-item px-0 d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{item.from}</div>
                        <div className="text-muted small">to {item.to}</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setFavorites((prev) => prev.filter((entry) => entry.id !== item.id))}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  {favorites.length === 0 && (
                    <div className="text-muted small">No saved journeys yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiBell className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Travel Alerts</h2>
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    value={alertInput}
                    onChange={(e) => setAlertInput(e.target.value)}
                    className="form-control"
                    placeholder="e.g. Central Line disruptions"
                  />
                  <button type="button" onClick={handleAddAlert} className="btn btn-success">
                    <FiPlus />
                  </button>
                </div>

                <div className="list-group list-group-flush mt-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <div className="text-muted">{alert.label}</div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setAlerts((prev) => prev.filter((entry) => entry.id !== alert.id))}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-muted small">No alerts saved.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-5">
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiClock className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Typical Travel Times</h2>
                </div>
                <div className="row g-2">
                  <div className="col-7">
                    <input
                      type="text"
                      value={timeRoute}
                      onChange={(e) => setTimeRoute(e.target.value)}
                      className="form-control"
                      placeholder="Route name"
                    />
                  </div>
                  <div className="col-5">
                    <input
                      type="number"
                      min="1"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                      className="form-control"
                      placeholder="Minutes"
                    />
                  </div>
                  <div className="col-12">
                    <button type="button" onClick={handleAddTime} className="btn btn-success w-100">
                      <FiPlus className="me-2" /> Save Travel Time
                    </button>
                  </div>
                </div>

                <div className="list-group list-group-flush mt-3">
                  {travelTimes.map((entry) => (
                    <div key={entry.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">{entry.route}</div>
                        <div className="text-muted small">Typical: {entry.minutes} min</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setTravelTimes((prev) => prev.filter((item) => item.id !== entry.id))}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiCheckCircle className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Preferred Modes</h2>
                </div>
                <p className="text-muted small">Choose your default travel modes.</p>
                <div className="d-flex flex-wrap gap-2">
                  {AVAILABLE_MODES.map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => toggleMode(mode)}
                      className={`btn btn-sm ${preferredModes.includes(mode) ? 'btn-success' : 'btn-outline-success'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-3" style={{ background: '#eff4ff' }}>
                  <div className="text-muted small">Active modes</div>
                  <div className="fw-semibold">
                    {preferredModes.length > 0 ? preferredModes.join(', ') : 'None selected'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
