import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiActivity,
  FiRefreshCw,
  FiMapPin,
  FiNavigation,
  FiSearch,
} from 'react-icons/fi';
import { FaBicycle } from 'react-icons/fa';

const TFL_API_BASE = 'https://api.tfl.gov.uk';

const SERVICE_MODES = [
  'tube',
  'dlr',
  'overground',
  'tram',
  'bus',
].join(',');

const STOP_TYPES = [
  'NaptanMetroStation',
  'NaptanRailStation',
  'NaptanPublicBusCoachTram',
].join(',');

const BAD_STATUS_LABELS = new Set([
  'Closed',
  'No Service',
  'Suspended',
  'Part Suspended',
  'Planned Closure',
  'Part Closure',
  'Severe Delays',
  'Reduced Service',
  'Minor Delays',
  'Part Closed',
  'Exit Only',
  'No Step Free Access',
  'Change of frequency',
  'Diverted',
  'Not Running',
  'Issues Reported',
  'Service Closed',
]);

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function getAdditionalValue(additionalProperties, key) {
  const found = additionalProperties?.find((prop) => prop.key === key);
  if (!found) return null;
  return found.value;
}

function LiveData() {
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState([]);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(null);

  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');

  const [bikeQuery, setBikeQuery] = useState('');
  const [bikeLoading, setBikeLoading] = useState(false);
  const [bikeError, setBikeError] = useState(null);
  const [bikeStations, setBikeStations] = useState([]);

  const fetchServiceStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const response = await fetch(
        `${TFL_API_BASE}/Line/Mode/${SERVICE_MODES}/Status`
      );
      const data = await response.json();

      const formatted = data
        .map((line) => {
          const status = line.lineStatuses?.[0];
          return {
            id: line.id,
            name: line.name,
            status: status?.statusSeverityDescription || 'Unknown',
            severity: status?.statusSeverity || 0,
            reason: status?.reason || '',
          };
        })
        .sort((a, b) => a.severity - b.severity);

      setServiceStatus(formatted);
      setStatusUpdatedAt(new Date());
    } catch (error) {
      setStatusError('Unable to load service updates right now.');
      console.error('Live status error:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchNearbyStops = async (lat, lon) => {
    setNearbyLoading(true);
    setNearbyError(null);
    try {
      const response = await fetch(
        `${TFL_API_BASE}/StopPoint?stopTypes=${STOP_TYPES}&lat=${lat}&lon=${lon}&radius=1200&useStopPointHierarchy=true`
      );
      const data = await response.json();
      const formatted = (data.stopPoints || [])
        .map((stop) => ({
          id: stop.id,
          name: stop.commonName || stop.name,
          distance: stop.distance || 0,
          modes: stop.modes || [],
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);

      setNearbyStops(formatted);
    } catch (error) {
      setNearbyError('Unable to load nearby stops.');
      console.error('Nearby stops error:', error);
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setNearbyError('Geolocation is not supported in this browser.');
      return;
    }

    setNearbyError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatInput(latitude.toFixed(6));
        setLonInput(longitude.toFixed(6));
        fetchNearbyStops(latitude, longitude);
      },
      () => {
        setNearbyError('Location access denied. Enter coordinates manually.');
      }
    );
  };

  const handleNearbySearch = () => {
    if (!latInput || !lonInput) {
      setNearbyError('Enter both latitude and longitude.');
      return;
    }

    fetchNearbyStops(Number(latInput), Number(lonInput));
  };

  const handleBikeSearch = async () => {
    if (!bikeQuery.trim()) {
      setBikeStations([]);
      return;
    }

    setBikeLoading(true);
    setBikeError(null);
    try {
      const response = await fetch(
        `${TFL_API_BASE}/BikePoint/Search?query=${encodeURIComponent(bikeQuery)}`
      );
      const data = await response.json();

      const stations = await Promise.all(
        (data || []).slice(0, 6).map(async (station) => {
          const detailResponse = await fetch(
            `${TFL_API_BASE}/BikePoint/${station.id}`
          );
          const detail = await detailResponse.json();
          const bikes = getAdditionalValue(detail.additionalProperties, 'NbBikes');
          const emptyDocks = getAdditionalValue(detail.additionalProperties, 'NbEmptyDocks');
          const docks = getAdditionalValue(detail.additionalProperties, 'NbDocks');
          return {
            id: detail.id,
            name: detail.commonName || detail.name,
            bikes: bikes ? Number(bikes) : null,
            emptyDocks: emptyDocks ? Number(emptyDocks) : null,
            docks: docks ? Number(docks) : null,
          };
        })
      );

      setBikeStations(stations);
    } catch (error) {
      setBikeError('Unable to load bike hire data.');
      console.error('Bike hire error:', error);
    } finally {
      setBikeLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceStatus();
  }, []);

  const badServices = serviceStatus.filter((line) =>
    BAD_STATUS_LABELS.has(line.status)
  );
  const goodServiceCount = Math.max(serviceStatus.length - badServices.length, 0);

  return (
    <div className="bg-light" style={{ minHeight: '100vh' }}>
      <section
        className="py-5"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(255,255,255,0.2), transparent 55%), linear-gradient(135deg, #00685f 0%, #008378 100%)',
        }}
      >
        <div className="container text-white">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
            <div>
              <h1 className="fw-bold" style={{ fontSize: '2.4rem' }}>Live Data</h1>
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Real-time updates for services, nearby stops, and bike hire.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchServiceStatus}
              className="btn btn-light fw-semibold"
            >
              <FiRefreshCw className="me-2" /> Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <FiActivity className="text-success" />
                    <h2 className="h5 fw-bold mb-0">Service Updates</h2>
                  </div>
                  <div className="text-muted small">
                    {statusUpdatedAt
                      ? `Last updated ${statusUpdatedAt.toLocaleTimeString()}`
                      : 'Live status feed'}
                  </div>
                </div>
                {statusLoading && (
                  <span className="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true" />
                )}
              </div>
              <div className="card-body p-0">
                {statusError && (
                  <div className="alert alert-warning m-4" role="alert">
                    {statusError}
                  </div>
                )}
                {!statusError && (
                  <div className="list-group list-group-flush">
                    {!statusLoading && serviceStatus.length > 0 && (
                      <div className="px-4 py-3 bg-light border-bottom">
                        <div className="small text-muted">
                          {badServices.length > 0
                            ? `${badServices.length} service issue${badServices.length === 1 ? '' : 's'} reported. ${goodServiceCount} running normally.`
                            : `All ${goodServiceCount} services are running normally.`}
                        </div>
                      </div>
                    )}
                    {badServices.map((line) => (
                      <div key={line.id} className="list-group-item px-4 py-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-semibold text-dark">{line.name}</div>
                            {line.reason && (
                              <div className="text-muted small mt-1">{line.reason}</div>
                            )}
                          </div>
                          <span
                            className={`badge ${line.severity > 9 ? 'bg-danger' : 'bg-warning text-dark'}`}
                          >
                            {line.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!statusLoading && serviceStatus.length === 0 && (
                      <div className="p-4 text-muted">No service updates available.</div>
                    )}
                    {!statusLoading && serviceStatus.length > 0 && badServices.length === 0 && (
                      <div className="p-4 text-success fw-semibold">
                        No disruptions right now. All services are running normally.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-0 py-4 px-4">
                <div className="d-flex align-items-center gap-2">
                  <FiMapPin className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Nearby Stops</h2>
                </div>
                <div className="text-muted small">Find stations and stops within 1.2 km.</div>
              </div>
              <div className="card-body px-4">
                <div className="row g-2 align-items-end">
                  <div className="col-12">
                    <button type="button" onClick={handleUseMyLocation} className="btn btn-outline-success w-100">
                      <FiNavigation className="me-2" /> Use My Location
                    </button>
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-uppercase fw-bold">Latitude</label>
                    <input
                      type="text"
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                      className="form-control"
                      placeholder="51.5074"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-uppercase fw-bold">Longitude</label>
                    <input
                      type="text"
                      value={lonInput}
                      onChange={(e) => setLonInput(e.target.value)}
                      className="form-control"
                      placeholder="-0.1278"
                    />
                  </div>
                  <div className="col-12">
                    <button type="button" onClick={handleNearbySearch} className="btn btn-success w-100">
                      Find Stops
                    </button>
                  </div>
                </div>

                {nearbyError && (
                  <div className="alert alert-warning mt-3 mb-0" role="alert">
                    {nearbyError}
                  </div>
                )}
                {nearbyLoading && (
                  <div className="d-flex justify-content-center py-3">
                    <span className="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true" />
                  </div>
                )}
                {!nearbyLoading && nearbyStops.length > 0 && (
                  <div className="list-group list-group-flush mt-3">
                    {nearbyStops.map((stop) => (
                      <div key={stop.id} className="list-group-item px-0">
                        <div className="fw-semibold text-dark">{stop.name}</div>
                        <div className="text-muted small d-flex justify-content-between">
                          <span className="text-capitalize">{stop.modes.join(', ')}</span>
                          <span>{formatDistance(stop.distance)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 py-4 px-4">
                <div className="d-flex align-items-center gap-2">
                  <FaBicycle className="text-success" />
                  <h2 className="h5 fw-bold mb-0">Bike Hire Availability</h2>
                </div>
                <div className="text-muted small">Search for Santander docking stations.</div>
              </div>
              <div className="card-body px-4">
                <div className="input-group">
                  <input
                    type="text"
                    value={bikeQuery}
                    onChange={(e) => setBikeQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBikeSearch()}
                    className="form-control"
                    placeholder="Search station name"
                  />
                  <button type="button" onClick={handleBikeSearch} className="btn btn-success">
                    <FiSearch />
                  </button>
                </div>

                {bikeError && (
                  <div className="alert alert-warning mt-3 mb-0" role="alert">
                    {bikeError}
                  </div>
                )}
                {bikeLoading && (
                  <div className="d-flex justify-content-center py-3">
                    <span className="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true" />
                  </div>
                )}
                {!bikeLoading && bikeStations.length > 0 && (
                  <div className="list-group list-group-flush mt-3">
                    {bikeStations.map((station) => (
                      <div key={station.id} className="list-group-item px-0">
                        <div className="fw-semibold text-dark">{station.name}</div>
                        <div className="text-muted small d-flex justify-content-between">
                          <span>Bikes: {station.bikes ?? 'N/A'}</span>
                          <span>Spaces: {station.emptyDocks ?? 'N/A'}</span>
                        </div>
                        {station.docks !== null && (
                          <div className="text-muted small">Total docks: {station.docks}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!bikeLoading && bikeStations.length === 0 && bikeQuery.trim() && (
                  <div className="text-muted small mt-3">No stations found for that search.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-5">
        <div className="alert alert-secondary d-flex align-items-start gap-3" role="alert">
          <FiAlertCircle className="mt-1" />
          <div>
            <div className="fw-semibold">Travel Tip</div>
            <div className="small">
              Live data can change quickly. Refresh before you travel and compare
              the greenest options in Plan Travel.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LiveData;
