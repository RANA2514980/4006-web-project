import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBarChart2,
  FiTarget,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import { FaLeaf } from 'react-icons/fa';

const EMISSIONS = {
  tube: 25,
  bus: 75,
  rail: 30,
  tram: 20,
  overground: 28,
  dlr: 24,
  cycle: 0,
  walk: 0,
};

const MODE_LABELS = {
  tube: 'Tube',
  bus: 'Bus',
  rail: 'Rail',
  tram: 'Tram',
  overground: 'Overground',
  dlr: 'DLR',
  cycle: 'Cycle',
  walk: 'Walk',
};

const STORAGE_KEYS = {
  goal: 'smuh_weekly_goal_km',
  logged: 'smuh_weekly_logged_km',
};

function Sustainability() {
  const [distanceKm, setDistanceKm] = useState('');
  const [mode, setMode] = useState('tube');
  const [weeklyGoal, setWeeklyGoal] = useState(20);
  const [weeklyLogged, setWeeklyLogged] = useState(0);
  const [logEntry, setLogEntry] = useState('');

  useEffect(() => {
    const storedGoal = Number(localStorage.getItem(STORAGE_KEYS.goal));
    const storedLogged = Number(localStorage.getItem(STORAGE_KEYS.logged));
    if (storedGoal) setWeeklyGoal(storedGoal);
    if (storedLogged) setWeeklyLogged(storedLogged);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.goal, String(weeklyGoal));
  }, [weeklyGoal]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.logged, String(weeklyLogged));
  }, [weeklyLogged]);

  const emissionEstimate = useMemo(() => {
    const numericDistance = Number(distanceKm);
    if (!numericDistance || numericDistance <= 0) return null;
    const rate = EMISSIONS[mode] ?? EMISSIONS.tube;
    return Math.round(numericDistance * rate);
  }, [distanceKm, mode]);

  const progress = Math.min((weeklyLogged / weeklyGoal) * 100, 100);

  const handleLogDistance = () => {
    const numericValue = Number(logEntry);
    if (!numericValue || numericValue <= 0) return;
    setWeeklyLogged((prev) => Number((prev + numericValue).toFixed(1)));
    setLogEntry('');
  };

  const handleResetWeek = () => {
    setWeeklyLogged(0);
  };

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
                Sustainability Hub
              </p>
              <h1 className="fw-bold" style={{ fontSize: '2.8rem' }}>
                Track lower carbon journeys.
              </h1>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem' }}>
                Compare emissions by mode and set weekly cycling goals to keep
                travel choices aligned with city climate ambitions.
              </p>
              <div className="d-flex gap-3 mt-4 flex-wrap">
                <Link to="/plan-travel" className="btn btn-light fw-semibold px-4" style={{ borderRadius: '12px' }}>
                  Compare routes
                </Link>
                <Link to="/dashboard" className="btn btn-outline-light fw-semibold px-4" style={{ borderRadius: '12px' }}>
                  Open dashboard
                </Link>
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
                  <FiBarChart2 className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Carbon Comparison</h2>
                </div>
                <p className="text-muted small">
                  Emissions are shown in grams of CO2 per km. Use this as a simple
                  benchmark for greener travel decisions.
                </p>
                <div className="row g-3 mt-2">
                  {Object.keys(MODE_LABELS).map((key) => (
                    <div key={key} className="col-6">
                      <div className="p-3 rounded-3" style={{ background: '#eff4ff' }}>
                        <div className="text-uppercase small fw-bold text-muted">{MODE_LABELS[key]}</div>
                        <div className="fw-bold" style={{ color: '#00685f' }}>
                          {EMISSIONS[key]} g/km
                        </div>
                      </div>
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
                  <FaLeaf className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Emission Estimator</h2>
                </div>
                <p className="text-muted small">
                  Estimate the carbon impact of a journey based on distance and mode.
                </p>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-uppercase fw-bold">Distance (km)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      className="form-control"
                      placeholder="e.g. 8.2"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-uppercase fw-bold">Mode</label>
                    <select value={mode} onChange={(e) => setMode(e.target.value)} className="form-select">
                      {Object.keys(MODE_LABELS).map((key) => (
                        <option key={key} value={key}>{MODE_LABELS[key]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-3" style={{ background: '#eff4ff' }}>
                  {emissionEstimate !== null ? (
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="fw-semibold text-dark">Estimated emissions</div>
                      <div className="fw-bold" style={{ color: '#00685f' }}>
                        {emissionEstimate} g CO2
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted small">Enter a distance to estimate emissions.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-5">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FiTarget className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Weekly Cycling Goal</h2>
                </div>
                <p className="text-muted small mb-0">
                  Set a weekly distance target and log your cycling progress.
                </p>
              </div>
              <div className="d-flex gap-2">
                <button type="button" onClick={handleResetWeek} className="btn btn-outline-success">
                  <FiRefreshCw className="me-2" /> Reset Week
                </button>
              </div>
            </div>

            <div className="row g-3 mt-3">
              <div className="col-12 col-md-4">
                <label className="form-label small text-uppercase fw-bold">Weekly goal (km)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small text-uppercase fw-bold">Log distance (km)</label>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={logEntry}
                    onChange={(e) => setLogEntry(e.target.value)}
                    className="form-control"
                    placeholder="e.g. 4.5"
                  />
                  <button type="button" onClick={handleLogDistance} className="btn btn-success">
                    <FiPlus />
                  </button>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small text-uppercase fw-bold">Progress</label>
                <div className="p-3 rounded-3" style={{ background: '#eff4ff' }}>
                  <div className="fw-semibold text-dark">{weeklyLogged} km logged</div>
                  <div className="text-muted small">Goal: {weeklyGoal} km</div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #00685f, #008378)',
                    borderRadius: '999px',
                  }}
                  aria-valuenow={progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
              <div className="text-muted small mt-2">{Math.round(progress)}% of weekly target</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Sustainability;
