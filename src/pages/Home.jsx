import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiMapPin,
  FiActivity,
  FiTrendingUp,
  FiBarChart2,
} from 'react-icons/fi';

const MODE_INFO = [
  {
    id: 'bus',
    title: 'Bus',
    description: 'Flexible coverage across London with frequent local stops.',
    benefits: 'Low cost, wide coverage, accessible.',
    limitations: 'Subject to traffic and peak delays.',
  },
  {
    id: 'rail',
    title: 'Rail and Tube',
    description: 'Fast connections for longer or cross-city travel.',
    benefits: 'Quick and reliable on core corridors.',
    limitations: 'Crowding at peak times.',
  },
  {
    id: 'cycle',
    title: 'Cycling',
    description: 'Direct, low-carbon travel for medium-distance trips.',
    benefits: 'Zero emissions, flexible routes.',
    limitations: 'Weather dependent and requires safe storage.',
  },
  {
    id: 'walk',
    title: 'Walking',
    description: 'Best for short distances and healthy daily movement.',
    benefits: 'Free, reliable, and sustainable.',
    limitations: 'Longer travel time for distant trips.',
  },
];

const COST_RATES = {
  bus: { min: 0.35, max: 0.5 },
  rail: { min: 0.5, max: 1.1 },
  tube: { min: 0.55, max: 1.2 },
  cycle: { min: 0, max: 0.25 },
  walk: { min: 0, max: 0 },
};

function formatPounds(value) {
  return `£${value.toFixed(2)}`;
}

function Home() {
  const [distanceKm, setDistanceKm] = useState('');
  const [mode, setMode] = useState('bus');

  const estimate = useMemo(() => {
    const numericDistance = Number(distanceKm);
    if (!numericDistance || numericDistance <= 0) return null;

    const base = COST_RATES[mode] || COST_RATES.bus;
    const min = numericDistance * base.min;
    const max = numericDistance * base.max;
    return { min, max };
  }, [distanceKm, mode]);

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
                St Marys Urban Mobility Hub
              </p>
              <h1 className="fw-bold" style={{ fontSize: '3rem', lineHeight: 1.15 }}>
                Plan smarter journeys across London.
              </h1>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem' }}>
                Compare public transport, cycling, and walking options with clear
                travel guidance and live data built for everyday decisions.
              </p>
              <div className="d-flex flex-wrap gap-3 mt-4">
                <Link
                  to="/plan-travel"
                  className="btn btn-light fw-semibold px-4"
                  style={{ borderRadius: '12px' }}
                >
                  Plan a Journey <FiArrowRight className="ms-2" />
                </Link>
                <Link
                  to="/live-data"
                  className="btn btn-outline-light fw-semibold px-4"
                  style={{ borderRadius: '12px' }}
                >
                  View Live Data
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-4">
          <div>
            <h2 className="fw-bold" style={{ color: '#0b1c30' }}>Travel Modes</h2>
            <p className="text-muted mb-0">Compare benefits and limits before you choose.</p>
          </div>
          <Link to="/plan-travel" className="btn btn-outline-success">
            Compare routes
          </Link>
        </div>

        <div className="row g-4">
          {MODE_INFO.map((modeItem) => (
            <div key={modeItem.id} className="col-12 col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm rounded-4">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <FiMapPin className="text-success" />
                    <h3 className="h6 fw-bold mb-0">{modeItem.title}</h3>
                  </div>
                  <p className="text-muted small mb-3">{modeItem.description}</p>
                  <div className="small">
                    <div className="fw-semibold text-dark">Benefits</div>
                    <div className="text-muted mb-2">{modeItem.benefits}</div>
                    <div className="fw-semibold text-dark">Limitations</div>
                    <div className="text-muted">{modeItem.limitations}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-5">
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiTrendingUp className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Cost Estimator</h2>
                </div>
                <p className="text-muted small">
                  Enter a distance and mode to see a quick fare range estimate.
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
                      placeholder="e.g. 5.4"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small text-uppercase fw-bold">Mode</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="form-select"
                    >
                      <option value="bus">Bus</option>
                      <option value="rail">Rail</option>
                      <option value="tube">Tube</option>
                      <option value="cycle">Cycle Hire</option>
                      <option value="walk">Walking</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-3" style={{ background: '#eff4ff' }}>
                  {estimate ? (
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="fw-semibold text-dark">Estimated cost range</div>
                      <div className="fw-bold" style={{ color: '#00685f' }}>
                        {formatPounds(estimate.min)} - {formatPounds(estimate.max)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted small">Enter a distance to see an estimate.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiBarChart2 className="text-success" />
                  <h2 className="h5 fw-bold mb-0">How to Use the Hub</h2>
                </div>
                <div className="d-flex flex-column gap-3">
                  {[
                    'Check live service updates before you travel.',
                    'Compare routes by time, cost, and carbon impact.',
                    'Track sustainable travel habits in your dashboard.',
                    'Explore cycling and walking options for short trips.',
                  ].map((tip) => (
                    <div key={tip} className="d-flex gap-3">
                      <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#e5eeff', color: '#00685f' }}>
                        <FiActivity />
                      </div>
                      <div className="text-muted small" style={{ lineHeight: 1.5 }}>{tip}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link to="/dashboard" className="btn btn-outline-success">
                    Open Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
