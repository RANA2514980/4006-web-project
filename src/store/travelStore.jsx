/**
 * Travel Store - Central store for managing travel-related data
 * Handles state management for stops, journeys, and journey requests
 */

import { createContext, useContext, useState, useCallback } from 'react';
import * as tflApi from '../services/tflApi';

// Create context
const TravelContext = createContext();

/**
 * TravelProvider component - wraps app with travel context
 */
export function TravelProvider({ children }) {
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [journeys, setJourneys] = useState([]);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyError, setJourneyError] = useState(null);

  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);

  /**
   * Search stops in real-time using TFL API
   */
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

  /**
   * Fetch journey between two stops
   */
  const getJourney = useCallback(async (fromStopId, toStopId) => {
    if (!fromStopId || !toStopId) {
      setJourneyError('From and To stops are required');
      return;
    }

    setJourneyLoading(true);
    setJourneyError(null);

    try {
      const data = await tflApi.fetchJourney(fromStopId, toStopId);
      
      // Handle both array (normal case) and {journeys, error} (fallback case)
      if (data.journeys) {
        // Fallback case: had error but got synthetic routes
        setJourneys(data.journeys);
        if (data.error) {
          setJourneyError(`Note: ${data.error}\n✓ Showing sustainable alternatives (cycle & walk)`);
        }
      } else {
        // Normal case: regular journey results
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

  /**
   * Clear current journey
   */
  const clearJourney = useCallback(() => {
    setJourneys([]);
    setSelectedFrom(null);
    setSelectedTo(null);
    setJourneyError(null);
  }, []);

  /**
   * Get departures for a specific stop
   */
  const getDepartures = useCallback(async (stopId) => {
    try {
      return await tflApi.fetchDepartures(stopId);
    } catch (error) {
      console.error('Failed to fetch departures:', error);
      throw error;
    }
  }, []);

  /**
   * Get stop details
   */
  const getStopDetails = useCallback(async (stopId) => {
    try {
      return await tflApi.fetchStopDetails(stopId);
    } catch (error) {
      console.error('Failed to fetch stop details:', error);
      throw error;
    }
  }, []);

  const value = {
    // Search actions
    searchStops,
    searchLoading,
    searchError,

    // Journey data and actions
    journeys,
    journeyLoading,
    journeyError,
    getJourney,
    clearJourney,
    selectedFrom,
    selectedTo,

    // Other actions
    getDepartures,
    getStopDetails,
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
}

/**
 * Custom hook to use travel context
 */
export function useTravel() {
  const context = useContext(TravelContext);

  if (!context) {
    throw new Error('useTravel must be used within TravelProvider');
  }

  return context;
}

export default TravelContext;
