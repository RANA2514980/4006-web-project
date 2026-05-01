import { useState, useEffect, useRef } from 'react';
import { useTravel } from '../store/travelStore';
import { 
  FiMapPin, 
  FiClock, 
  FiDollarSign, 
  FiFilter,
  FiX,
} from 'react-icons/fi';
import { FaLeaf } from 'react-icons/fa';

function PlanTravel() {
  const {
    searchStops,
    searchError,
    getJourney,
    journeys,
    journeyLoading,
    journeyError,
    clearJourney,
  } = useTravel();

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromSearching, setFromSearching] = useState(false);
  const [toSearching, setToSearching] = useState(false);

  const [selectedModes, setSelectedModes] = useState(new Set());
  const [sortBy, setSortBy] = useState('time');

  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);
  const fromTimeoutRef = useRef(null);
  const toTimeoutRef = useRef(null);

  const handleFromSearch = (value) => {
    setFromQuery(value);
    
    // Clear previous timeout
    if (fromTimeoutRef.current) {
      clearTimeout(fromTimeoutRef.current);
    }

    if (value.trim().length > 0) {
      // Debounce: wait 1000ms before searching
      fromTimeoutRef.current = setTimeout(async () => {
        setFromSearching(true);
        const results = await searchStops(value);
        setFromSuggestions(results);
        setShowFromSuggestions(true);
        setFromSearching(false);
      }, 1000);
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
      setFromSearching(false);
    }
  };

  const handleToSearch = (value) => {
    setToQuery(value);
    
    // Clear previous timeout
    if (toTimeoutRef.current) {
      clearTimeout(toTimeoutRef.current);
    }

    if (value.trim().length > 0) {
      // Debounce: wait 1000ms before searching
      toTimeoutRef.current = setTimeout(async () => {
        setToSearching(true);
        const results = await searchStops(value);
        setToSuggestions(results);
        setShowToSuggestions(true);
        setToSearching(false);
      }, 1000);
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
      setToSearching(false);
    }
  };

  const selectFromStation = (station) => {
    setSelectedFrom(station);
    setFromQuery(station.name);
    setShowFromSuggestions(false);
    clearJourney();
  };

  const selectToStation = (station) => {
    setSelectedTo(station);
    setToQuery(station.name);
    setShowToSuggestions(false);
    clearJourney();
  };

  const handleFromKeyDown = (e) => {
    if (e.key === 'Enter' && showFromSuggestions && fromSuggestions.length > 0) {
      e.preventDefault();
      selectFromStation(fromSuggestions[0]);
    }
  };

  const handleToKeyDown = (e) => {
    if (e.key === 'Enter' && showToSuggestions && toSuggestions.length > 0) {
      e.preventDefault();
      selectToStation(toSuggestions[0]);
    }
  };

  const handlePlanJourney = async () => {
    if (selectedFrom && selectedTo) {
      await getJourney(selectedFrom.id, selectedTo.id);
      setSelectedModes(new Set());
    }
  };

  const getFilteredJourneys = () => {
    if (selectedModes.size === 0) return journeys;
    return journeys.filter(journey =>
      journey.modes.some(mode => selectedModes.has(mode))
    );
  };

  const getSortedJourneys = () => {
    const filtered = getFilteredJourneys();
    const sorted = [...filtered];

    switch (sortBy) {
      case 'time':
        return sorted.sort((a, b) => a.totalTime - b.totalTime);
      case 'cost':
        return sorted.sort((a, b) => a.totalCost - b.totalCost);
      case 'carbon':
        return sorted.sort((a, b) => a.carbonEmission - b.carbonEmission);
      default:
        return sorted;
    }
  };

  const toggleModeFilter = (mode) => {
    const newModes = new Set(selectedModes);
    if (newModes.has(mode)) {
      newModes.delete(mode);
    } else {
      newModes.add(mode);
    }
    setSelectedModes(newModes);
  };

  const getAvailableModes = () => {
    const modes = new Set();
    journeys.forEach(journey => {
      journey.modes.forEach(mode => modes.add(mode));
    });
    return Array.from(modes).sort();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(event.target)
      ) {
        setShowFromSuggestions(false);
      }
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target)
      ) {
        setShowToSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fromTimeoutRef.current) clearTimeout(fromTimeoutRef.current);
      if (toTimeoutRef.current) clearTimeout(toTimeoutRef.current);
    };
  }, []);

  const sortedJourneys = getSortedJourneys();
  const availableModes = getAvailableModes();
  const hasSelections = Boolean(selectedFrom && selectedTo);
  const showResults = journeys.length > 0;
  const showEmptyResults = !journeyLoading && hasSelections && journeys.length === 0 && !journeyError;

  return (
    <div className="bg-light" style={{ minHeight: '100vh' }}>
      <section
        className="py-5"
        style={{
          background: 'radial-gradient(circle at top left, rgba(255,255,255,0.15), transparent 55%), linear-gradient(135deg, #00685f 0%, #008378 100%)',
        }}
      >
        <div className="container">
          <div className="text-center text-white mb-4">
            <h1 className="fw-bold" style={{ fontSize: '2.6rem' }}>Plan Your Journey</h1>
            <p className="mb-0" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Compare time, cost, and carbon across every mode
            </p>
          </div>

          <div className="bg-white rounded-4 shadow-lg p-4 p-lg-5" style={{ backdropFilter: 'blur(8px)' }}>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-5" ref={fromDropdownRef} style={{ position: 'relative' }}>
                <label className="text-uppercase fw-bold d-flex align-items-center gap-2 mb-2" style={{ color: '#00685f', fontSize: '12px', letterSpacing: '1px' }}>
                  <FiMapPin /> From
                </label>
                <div className="position-relative">
                  <input
                    type="text"
                    placeholder="Starting point..."
                    value={fromQuery}
                    onChange={(e) => handleFromSearch(e.target.value)}
                    onKeyDown={handleFromKeyDown}
                    onFocus={() => fromQuery && setShowFromSuggestions(true)}
                    className="form-control form-control-lg"
                    style={{ borderRadius: '12px', borderColor: '#e0e6ff' }}
                  />
                  {fromSearching && (
                    <div className="position-absolute top-50 end-0 translate-middle-y me-3 text-success">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {showFromSuggestions && (
                  <div className="position-absolute w-100 bg-white border rounded-3 mt-1 shadow" style={{ zIndex: 1000, maxHeight: '320px', overflowY: 'auto' }}>
                    {fromSuggestions.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {fromSuggestions.map((station) => (
                          <button
                            type="button"
                            key={station.id}
                            onClick={() => selectFromStation(station)}
                            className="list-group-item list-group-item-action d-flex gap-3 align-items-start"
                          >
                            <FiMapPin className="text-success" />
                            <div>
                              <div className="fw-semibold text-dark">{station.name}</div>
                              <div className="text-muted small text-capitalize">{station.modes.join(', ')}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-muted small">No matches yet. Try another name.</div>
                    )}
                  </div>
                )}
                {selectedFrom && (
                  <div className="mt-2 px-3 py-2 rounded-3" style={{ background: '#e8eef9', color: '#00685f', fontSize: '13px', fontWeight: 600 }}>
                    Selected: {selectedFrom.name}
                  </div>
                )}
              </div>

              <div className="col-12 col-lg-5" ref={toDropdownRef} style={{ position: 'relative' }}>
                <label className="text-uppercase fw-bold d-flex align-items-center gap-2 mb-2" style={{ color: '#00685f', fontSize: '12px', letterSpacing: '1px' }}>
                  <FiMapPin /> To
                </label>
                <div className="position-relative">
                  <input
                    type="text"
                    placeholder="Destination..."
                    value={toQuery}
                    onChange={(e) => handleToSearch(e.target.value)}
                    onKeyDown={handleToKeyDown}
                    onFocus={() => toQuery && setShowToSuggestions(true)}
                    className="form-control form-control-lg"
                    style={{ borderRadius: '12px', borderColor: '#e0e6ff' }}
                  />
                  {toSearching && (
                    <div className="position-absolute top-50 end-0 translate-middle-y me-3 text-success">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {showToSuggestions && (
                  <div className="position-absolute w-100 bg-white border rounded-3 mt-1 shadow" style={{ zIndex: 1000, maxHeight: '320px', overflowY: 'auto' }}>
                    {toSuggestions.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {toSuggestions.map((station) => (
                          <button
                            type="button"
                            key={station.id}
                            onClick={() => selectToStation(station)}
                            className="list-group-item list-group-item-action d-flex gap-3 align-items-start"
                          >
                            <FiMapPin className="text-success" />
                            <div>
                              <div className="fw-semibold text-dark">{station.name}</div>
                              <div className="text-muted small text-capitalize">{station.modes.join(', ')}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-muted small">No matches yet. Try another name.</div>
                    )}
                  </div>
                )}
                {selectedTo && (
                  <div className="mt-2 px-3 py-2 rounded-3" style={{ background: '#e8eef9', color: '#00685f', fontSize: '13px', fontWeight: 600 }}>
                    Selected: {selectedTo.name}
                  </div>
                )}
              </div>

              <div className="col-12 col-lg-2 d-grid">
                <button
                  type="button"
                  onClick={handlePlanJourney}
                  disabled={!hasSelections || journeyLoading}
                  className="btn btn-lg text-uppercase fw-bold"
                  style={{
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #00685f 0%, #005049 100%)',
                    color: 'white',
                    letterSpacing: '1px',
                    boxShadow: '0 10px 30px rgba(0, 104, 95, 0.25)',
                    opacity: !hasSelections || journeyLoading ? 0.6 : 1,
                  }}
                >
                  {journeyLoading ? 'Finding routes...' : 'Find Routes'}
                </button>
              </div>
            </div>

            {searchError && (
              <div className="alert alert-warning mt-4 mb-0" role="alert">
                {searchError}
              </div>
            )}
          </div>
        </div>
      </section>

      {journeyError && (
        <div className="container mt-4">
          <div className="alert alert-warning" role="alert" style={{ whiteSpace: 'pre-line' }}>
            <div className="fw-bold mb-1">Unable to find public transport routes</div>
            {journeyError}
            <div className="mt-2 small">
              Try major hubs or different stations. Cycle and walk options are always available.
            </div>
          </div>
        </div>
      )}

      {showResults && (
        <section className="container pb-5">
          <div className="row g-4">
            <div className="col-12 col-lg-3">
              <div className="card border-0 shadow-sm sticky-top" style={{ top: '110px' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <FiFilter className="text-success" />
                    <h3 className="h6 fw-bold mb-0">Filters</h3>
                  </div>

                  <div className="mb-4">
                    <div className="text-uppercase small fw-bold mb-2" style={{ color: '#00685f', letterSpacing: '1px' }}>
                      Transport Mode
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {availableModes.map((mode) => (
                        <label key={mode} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedModes.has(mode)}
                            onChange={() => toggleModeFilter(mode)}
                            className="form-check-input m-0"
                            style={{ accentColor: '#00685f' }}
                          />
                          <span className="fw-semibold text-capitalize">{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-uppercase small fw-bold mb-2" style={{ color: '#00685f', letterSpacing: '1px' }}>
                      Sort By
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {[
                        { value: 'time', icon: FiClock, label: 'Quickest' },
                        { value: 'cost', icon: FiDollarSign, label: 'Cheapest' },
                        { value: 'carbon', icon: FaLeaf, label: 'Greenest' },
                      ].map(({ value, icon: Icon, label }) => (
                        <label key={value} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="sort"
                            value={value}
                            checked={sortBy === value}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="form-check-input m-0"
                            style={{ accentColor: '#00685f' }}
                          />
                          <Icon size={16} className="text-success" />
                          <span className="fw-semibold">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedModes.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedModes(new Set())}
                      className="btn btn-outline-success w-100"
                    >
                      <FiX className="me-1" /> Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-9">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                  <h2 className="h5 fw-bold mb-0">
                    {selectedModes.size > 0
                      ? `${sortedJourneys.length} routes found`
                      : `${journeys.length} routes available`}
                  </h2>
                  <span className="text-muted small">Sorted by {sortBy}</span>
                </div>

                {sortedJourneys.length > 0 ? (
                  <div className="card-body p-0">
                    {sortedJourneys.map((journey) => (
                      <div key={journey.id} className="border-top p-4">
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {journey.modes.map((mode) => {
                            const modeColors = {
                              tube: '#0019a8',
                              bus: '#e21836',
                              train: '#000000',
                              tram: '#66cc00',
                              dlr: '#00bfb3',
                              overground: '#ee7f00',
                              walk: '#8b7355',
                              cycle: '#00a651',
                            };
                            return (
                              <span
                                key={mode}
                                className="badge text-uppercase"
                                style={{
                                  background: modeColors[mode] || '#00685f',
                                  color: 'white',
                                  fontSize: '11px',
                                  letterSpacing: '0.5px',
                                  padding: '8px 12px',
                                  borderRadius: '10px',
                                }}
                              >
                                {mode}
                              </span>
                            );
                          })}
                        </div>

                        <div className="row g-3">
                          {[
                            { icon: FiMapPin, label: 'Distance', value: `${journey.totalDistance.toFixed(2)} km` },
                            { icon: FiClock, label: 'Time', value: `${journey.totalTime} min` },
                            { icon: FiDollarSign, label: 'Cost', value: `£${journey.totalCost.toFixed(2)}` },
                            { icon: FaLeaf, label: 'Carbon', value: `${journey.carbonEmission} g` },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="col-6 col-lg-3">
                              <div className="d-flex gap-2 align-items-start">
                                <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#e8eef9', color: '#00685f' }}>
                                  <Icon />
                                </div>
                                <div>
                                  <div className="text-uppercase small fw-bold text-muted" style={{ letterSpacing: '1px' }}>{label}</div>
                                  <div className="fw-bold" style={{ color: '#1a2332' }}>{value}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-body text-center text-muted py-5">
                    No routes match your filters. Try adjusting them.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {showEmptyResults && (
        <div className="container pb-5">
          <div className="alert alert-info text-center">
            Ready to compare? Click "Find Routes" to see options.
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanTravel;
