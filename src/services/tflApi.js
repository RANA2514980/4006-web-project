
const TFL_API_BASE = 'https://api.tfl.gov.uk';

const CARBON_EMISSIONS = {
  tube: 25, 
  bus: 75,
  train: 30,
  tram: 20,
  cycle: 0,
  walk: 0,
  overground: 28,
  dlr: 24,
};


/**
 * Search for stops by query string in real-time
 * Uses TFL API search endpoint for immediate suggestions
 */
export async function searchStopsForQuery(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const response = await fetch(
      `${TFL_API_BASE}/StopPoint/Search?query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      console.log(`Search for "${query}" returned ${data.matches.length} results`);
      
      return data.matches.map(stop => ({
        id: stop.id,
        name: stop.name,
        lat: stop.lat,
        lon: stop.lon,
        modes: stop.modes || [],
        commonName: stop.commonName,
        stopCode: stop.stopLetter || stop.naptanCode, // Backup identifiers
      }));
    }

    console.warn(`No matches found for search: "${query}"`);
    return [];
  } catch (error) {
    console.error('Error searching stops:', error);
    return [];
  }
}

export async function fetchAllStops() {
  try {
    const modes = ['bus','tube','tram', 'rail', 'overground', 'dlr'];
    let allStops = [];

    for (const mode of modes) {
      try {
        const response = await fetch(
          `${TFL_API_BASE}/StopPoint/Search?query=london&modes=${mode}&limit=200`
        );
        const data = await response.json();

        if (data.matches) {
          const stops = data.matches.map(stop => ({
            id: stop.id,
            name: stop.name,
            lat: stop.lat,
            lon: stop.lon,
            modes: stop.modes || [mode],
            commonName: stop.commonName,
          }));
          allStops = [...allStops, ...stops];
        }
      } catch (error) {
        console.warn(`Error fetching ${mode} stops:`, error);
      }
    }

    const uniqueStops = Array.from(
      new Map(allStops.map(stop => [stop.id, stop])).values()
    );

    return uniqueStops.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching stops:', error);
    throw error;
  }
}


export async function fetchJourney(fromId, toId) {
  try {
    console.log('Fetching journey from', fromId, 'to', toId);
    
    // Validate that we have proper stop IDs
    if (!fromId || !toId || String(fromId).trim() === String(toId).trim()) {
      throw new Error('Invalid stops: From and To must be different valid stops');
    }

    // Get full stop details to ensure we have correct IDs
    console.log('Validating stops...');
    const [fromStop, toStop] = await Promise.all([
      fetchStopDetails(fromId).catch(e => {
        console.warn('Could not fetch from stop details:', e);
        return null;
      }),
      fetchStopDetails(toId).catch(e => {
        console.warn('Could not fetch to stop details:', e);
        return null;
      })
    ]);

    if (!fromStop || !toStop) {
      throw new Error('One or both stops could not be validated. Try searching again.');
    }

    console.log('Stop details found:', { 
      fromStop: { name: fromStop.name, id: fromStop.id, modes: fromStop.modes },
      toStop: { name: toStop.name, id: toStop.id, modes: toStop.modes }
    });

    // Check if stops support journey planning (typically require specific modes)
    const supportedModes = ['tube', 'dlr', 'tram', 'overground', 'rail', 'bus'];
    const fromHasJourneySupport = fromStop.modes && fromStop.modes.some(m => supportedModes.includes(m));
    const toHasJourneySupport = toStop.modes && toStop.modes.some(m => supportedModes.includes(m));

    if (!fromHasJourneySupport || !toHasJourneySupport) {
      console.warn('Stops may not support journey planning:', {
        fromModes: fromStop.modes,
        toModes: toStop.modes
      });
    }

    // Try with primary ID
    let validatedFromId = fromStop.id;
    let validatedToId = toStop.id;

    console.log('Using stop IDs:', { validatedFromId, validatedToId });

    // Ensure IDs are strings and properly encoded
    const encodedFromId = encodeURIComponent(String(validatedFromId).trim());
    const encodedToId = encodeURIComponent(String(validatedToId).trim());

    console.log('Encoded IDs:', { encodedFromId, encodedToId });

    // Build journey URL
    const journeyUrl = `${TFL_API_BASE}/Journey/JourneyResults/${encodedFromId}/to/${encodedToId}?alternatives=true&accessibilityPreference=noRequirements&walkingSpeed=average&cycleSpeed=average`;
    console.log('Journey URL:', journeyUrl);

    const response = await fetch(journeyUrl);

    console.log('Journey API Response Status:', response.status);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {
        // Response is not JSON
      }
      
      console.error('Journey API Error:', {
        status: response.status,
        fromStop: { name: fromStop.name, modes: fromStop.modes },
        toStop: { name: toStop.name, modes: toStop.modes },
        validatedFromId,
        validatedToId,
        errorData
      });

      // Handle specific error codes
      if (response.status === 300 || response.status === 400) {
        const hint = `✓ Good news: Cycle & walk routes are always available!\n\n` +
          `🚏 For public transit, try major stations with good connections:\n` +
          `• King's Cross • Paddington • Victoria • Liverpool Street\n` +
          `• Waterloo • Euston • Baker Street • Oxford Circus`;
        throw new Error(hint);
      } else if (response.status === 404) {
        throw new Error(`One or both stops not found. Please try searching for different stations.`);
      } else if (response.status === 500 || response.status === 503) {
        throw new Error(`TFL API is temporarily unavailable. Try again in a moment.`);
      } else {
        throw new Error(`API error: ${response.status}. ${errorData.message || ''}`);
      }
    }

    const data = await response.json();
    const journeys = [];

    if (data.journeys && data.journeys.length > 0) {
      console.log(`Found ${data.journeys.length} journey options`);
      data.journeys.forEach((journey) => {
        const processedJourney = processJourneyData(journey);
        journeys.push(processedJourney);
      });
    } else {
      console.warn('No journeys found in API response (this is OK - synthetic routes will show)');
      // Return empty array so synthetic routes still appear
    }

    // Add synthetic cycle and walk routes
    const cycleAndWalkRoutes = await getSyntheticCycleAndWalkRoutes(validatedFromId, validatedToId);
    journeys.push(...cycleAndWalkRoutes);

    return journeys;
  } catch (error) {
    console.error('Error fetching journey:', error.message);
    
    // Always try to return synthetic routes (cycle & walk) even if transit planning fails
    try {
      console.log('Falling back to synthetic routes (cycle & walk)...');
      const cycleAndWalkRoutes = await getSyntheticCycleAndWalkRoutes(fromId, toId);
      
      if (cycleAndWalkRoutes && cycleAndWalkRoutes.length > 0) {
        console.log('Returning synthetic routes as fallback');
        // Return synthetic routes but also pass the error message for display
        return {
          journeys: cycleAndWalkRoutes,
          error: error.message
        };
      }
    } catch (syntheticError) {
      console.error('Failed to generate synthetic routes:', syntheticError);
    }
    
    // If everything fails, throw the original error
    throw error;
  }
}

/**
 * Process individual journey data from TFL API
 * Extract modes, times, distances, and calculate costs and emissions
 */
function processJourneyData(journey) {
  const legs = journey.legs || [];
  const modes = new Set();
  let totalTime = 0;
  let totalDistance = 0;
  let totalCost = 0;
  let totalCarbon = 0;

  legs.forEach(leg => {
    // Extract mode
    if (leg.mode && leg.mode.id) {
      modes.add(leg.mode.id);
    }

    // Calculate time (convert from TFL format if needed)
    if (leg.duration) {
      totalTime += leg.duration;
    }

    // Calculate distance
    if (leg.distance) {
      totalDistance += leg.distance / 1000; // Convert to km
    }

    // Calculate cost (simplified - TFL might provide actual fare)
    const legCost = calculateLegCost(leg);
    totalCost += legCost;

    // Calculate carbon emissions
    const mode = leg.mode?.id || 'bus';
    const legDistance = (leg.distance || 0) / 1000;
    const carbonFactor = CARBON_EMISSIONS[mode] || 50;
    totalCarbon += legDistance * carbonFactor;
  });

  return {
    id: `journey-${Date.now()}-${Math.random()}`,
    modes: Array.from(modes),
    legs: legs.map(leg => ({
      mode: leg.mode?.id || 'unknown',
      departureTime: leg.departureTime,
      arrivalTime: leg.arrivalTime,
      duration: leg.duration,
      distance: (leg.distance || 0) / 1000, // km
      route: leg.route?.name || leg.description || 'N/A',
      instruction: leg.instruction?.summary || '',
    })),
    totalTime, // minutes
    totalDistance, // km
    totalCost, // GBP (simplified)
    carbonEmission: Math.round(totalCarbon), // grams CO2
    departureTime: legs[0]?.departureTime || new Date(),
    arrivalTime: legs[legs.length - 1]?.arrivalTime || new Date(),
  };
}

/**
 * Calculate estimated cost for a leg (simplified)
 * TFL has complex fare structure - this is a rough estimate
 */
function calculateLegCost(leg) {
  const mode = leg.mode?.id || 'bus';

  // Very simplified fare estimates (GBP)
  const fareLookup = {
    bus: 1.75,
    tube: 1.75,
    train: 2.0,
    tram: 1.75,
    overground: 2.0,
    dlr: 1.75,
    cycle: 0,
    walk: 0,
  };

  const basefare = fareLookup[mode] || 2.0;
  const distance = (leg.distance || 0) / 1000; // km

  // Simple cost based on distance
  if (mode === 'bus' || mode === 'tram' || mode === 'dlr') {
    return basefare;
  }

  // For longer distances, add distance-based cost
  return basefare + (distance * 0.5);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Create synthetic routes for cycle and walk options
 * Calculates realistic times based on distance and typical speeds in London
 */
async function getSyntheticCycleAndWalkRoutes(fromId, toId) {
  try {
    // Fetch stop details to get coordinates
    const fromStop = await fetchStopDetails(fromId);
    const toStop = await fetchStopDetails(toId);

    if (!fromStop || !toStop) {
      // Fallback to placeholder values if API fails
      return getPlaceholderRoutes();
    }

    const distance = calculateDistance(
      fromStop.lat,
      fromStop.lon,
      toStop.lat,
      toStop.lon
    );

    const routes = [];
    const now = new Date();

    // Walk route - average 5 km/h in urban area
    const walkTimeMinutes = Math.ceil((distance / 5) * 60);
    routes.push({
      id: `walk-${fromId}-${toId}`,
      modes: ['walk'],
      legs: [
        {
          mode: 'walk',
          departureTime: now,
          arrivalTime: new Date(now.getTime() + walkTimeMinutes * 60 * 1000),
          duration: walkTimeMinutes,
          distance: parseFloat(distance.toFixed(2)),
          route: 'Walking route',
          instruction: `Walk ${distance.toFixed(2)} km to destination`,
        },
      ],
      totalTime: walkTimeMinutes,
      totalDistance: parseFloat(distance.toFixed(2)),
      totalCost: 0,
      carbonEmission: 0,
      departureTime: now,
      arrivalTime: new Date(now.getTime() + walkTimeMinutes * 60 * 1000),
    });

    // Cycle route - average 20 km/h in urban area
    const cycleTimeMinutes = Math.ceil((distance / 20) * 60);
    routes.push({
      id: `cycle-${fromId}-${toId}`,
      modes: ['cycle'],
      legs: [
        {
          mode: 'cycle',
          departureTime: now,
          arrivalTime: new Date(now.getTime() + cycleTimeMinutes * 60 * 1000),
          duration: cycleTimeMinutes,
          distance: parseFloat(distance.toFixed(2)),
          route: 'Cycling route',
          instruction: `Cycle ${distance.toFixed(2)} km to destination`,
        },
      ],
      totalTime: cycleTimeMinutes,
      totalDistance: parseFloat(distance.toFixed(2)),
      totalCost: 0,
      carbonEmission: 0,
      departureTime: now,
      arrivalTime: new Date(now.getTime() + cycleTimeMinutes * 60 * 1000),
    });

    return routes;
  } catch (error) {
    console.warn('Error calculating synthetic routes, using placeholder:', error);
    return getPlaceholderRoutes();
  }
}

/**
 * Placeholder routes for when distance calculation fails
 */
function getPlaceholderRoutes() {
  const now = new Date();
  return [
    {
      id: `walk-placeholder`,
      modes: ['walk'],
      legs: [
        {
          mode: 'walk',
          departureTime: now,
          arrivalTime: new Date(now.getTime() + 60 * 60 * 1000),
          duration: 60,
          distance: 5,
          route: 'Walking route',
          instruction: 'Walk to destination',
        },
      ],
      totalTime: 60,
      totalDistance: 5,
      totalCost: 0,
      carbonEmission: 0,
      departureTime: now,
      arrivalTime: new Date(now.getTime() + 60 * 60 * 1000),
    },
    {
      id: `cycle-placeholder`,
      modes: ['cycle'],
      legs: [
        {
          mode: 'cycle',
          departureTime: now,
          arrivalTime: new Date(now.getTime() + 30 * 60 * 1000),
          duration: 30,
          distance: 5,
          route: 'Cycling route',
          instruction: 'Cycle to destination',
        },
      ],
      totalTime: 30,
      totalDistance: 5,
      totalCost: 0,
      carbonEmission: 0,
      departureTime: now,
      arrivalTime: new Date(now.getTime() + 30 * 60 * 1000),
    },
  ];
}

/**
 * Get real-time departures for a specific stop
 */
export async function fetchDepartures(stopId) {
  try {
    const response = await fetch(
      `${TFL_API_BASE}/StopPoint/${stopId}/Arrivals?limit=20`
    );
    const data = await response.json();

    return data.map(arrival => ({
      lineId: arrival.lineId,
      lineName: arrival.lineName,
      destinationName: arrival.destinationName,
      expectedArrival: arrival.expectedArrival,
      timeToStation: arrival.timeToStation,
    }));
  } catch (error) {
    console.error('Error fetching departures:', error);
    throw error;
  }
}

/**
 * Get stop details by ID
 */
export async function fetchStopDetails(stopId) {
  try {
    const response = await fetch(`${TFL_API_BASE}/StopPoint/${stopId}`);
    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      commonName: data.commonName,
      lat: data.lat,
      lon: data.lon,
      modes: data.modes,
      place: data.place,
    };
  } catch (error) {
    console.error('Error fetching stop details:', error);
    throw error;
  }
}

export default {
  fetchAllStops,
  searchStopsForQuery,
  fetchJourney,
  fetchDepartures,
  fetchStopDetails,
};
