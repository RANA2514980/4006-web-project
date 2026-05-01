import { createContext, useContext, useState, useCallback } from 'react';
import * as tflApi from '../services/tflApi';

const TravelContext = createContext();

export function TravelProvider({ children }) {
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [journeys, setJourneys] = useState([]);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyError, setJourneyError] = useState(null);

  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);

  const searchStops = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      return [];
    }

    setSearchError(null);

    try {
      const results = await tflApi.searchStopsForQuery(query);
      return results;
    } catch (error) {
      setSearchError(error.message);
      console.error('Failed to search stops:', error);
      return [];
    }
  }, []);

  const getJourney = useCallback(async (fromStopId, toStopId) => {
    if (!fromStopId || !toStopId) {
      setJourneyError('From and To stops are required');
      return;
    }

    setJourneyLoading(true);
    setJourneyError(null);

    try {
      const data = await tflApi.fetchJourney(fromStopId, toStopId);
      
      if (data.journeys) {
        setJourneys(data.journeys);
        if (data.error) {
          setJourneyError(`Note: ${data.error}\n✓ Showing sustainable alternatives (cycle & walk)`);
        }
      } else {
        setJourneys(data);
      }
      
      setSelectedFrom(fromStopId);
      setSelectedTo(toStopId);
    } catch (error) {
      setJourneyError(error.message);
      console.error('Failed to fetch journey:', error);
    } finally {
      setJourneyLoading(false);
    }
  }, []);

  const clearJourney = useCallback(() => {
    setJourneys([]);
    setSelectedFrom(null);
    setSelectedTo(null);
    setJourneyError(null);
  }, []);

  const getDepartures = useCallback(async (stopId) => {
    try {
      return await tflApi.fetchDepartures(stopId);
    } catch (error) {
      console.error('Failed to fetch departures:', error);
      throw error;
    }
  }, []);

  const getStopDetails = useCallback(async (stopId) => {
    try {
      return await tflApi.fetchStopDetails(stopId);
    } catch (error) {
      console.error('Failed to fetch stop details:', error);
      throw error;
    }
  }, []);

  const value = {
    searchStops,
    searchLoading,
    searchError,

    journeys,
    journeyLoading,
    journeyError,
    getJourney,
    clearJourney,
    selectedFrom,
    selectedTo,

    getDepartures,
    getStopDetails,
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  const context = useContext(TravelContext);

  if (!context) {
    throw new Error('useTravel must be used within TravelProvider');
  }

  return context;
}

export default TravelContext;
