import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { appReducer, initialState, ACTION_TYPES } from './appReducer';
import { applyFilters, sortFunctions } from './dataProcessing';
import { csvLoader } from './csvDataLoader';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  const {
    data: { 
      studies = [], 
      metadata = {}, 
      loading = true, 
      error = null 
    } = {},
    selectedYear = 2000,
    startYear = 1995, 
    endYear = 2005, 
    searchQuery = '', 
    activeFilters = {}, 
    sortOption = 'year-asc',
    openDropdowns = {},
    expandedStudies = new Set(),
    showDataStats = false
  } = state;

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting data load...');
        dispatch({ type: ACTION_TYPES.DATA_LOAD_START });
        
        const result = await csvLoader.loadStudies();
        console.log('Data loaded successfully:', result);
        
        if (!result || !result.studies || !Array.isArray(result.studies)) {
          throw new Error('Invalid data structure returned from CSV loader');
        }
        
        dispatch({ 
          type: ACTION_TYPES.DATA_LOAD_SUCCESS, 
          payload: result
        });
        
      } catch (error) {
        console.error("Error loading CSV data:", error);
        dispatch({ 
          type: ACTION_TYPES.DATA_LOAD_ERROR, 
          payload: error.message || 'Unknown error occurred while loading data'
        });
      }
    };
    
    loadData();
  }, []);
  
  const expandedStudiesSet = useMemo(() => {
    if (expandedStudies instanceof Set) {
      return expandedStudies;
    }
    return new Set(expandedStudies);
  }, [expandedStudies]);
  
  const filteredStudies = useMemo(() => {
    if (!studies || !Array.isArray(studies) || studies.length === 0) {
      return [];
    }
    
    try {
      const filters = { 
        searchQuery: searchQuery || '', 
        activeFilters: activeFilters || {}, 
        startYear: startYear || 1975, 
        endYear: endYear || 2025 
      };
      
      let filtered = applyFilters(studies, filters);
      
      const sortFn = sortFunctions[sortOption] || sortFunctions['year-asc'];
      return filtered.sort(sortFn);
    } catch (error) {
      console.error('Error filtering studies:', error);
      return studies; 
    }
  }, [studies, searchQuery, activeFilters, startYear, endYear, sortOption]);
  
  const studyCountsByYear = useMemo(() => {
    if (!studies || !Array.isArray(studies)) return {};
    
    const counts = {};
    studies.forEach(study => {
      if (study && typeof study.year === 'number') {
        counts[study.year] = (counts[study.year] || 0) + 1;
      }
    });
    return counts;
  }, [studies]);

  const filteredStudyCountsByYear = useMemo(() => {
    if (!studies || !Array.isArray(studies)) return {};
    
    try {
      const counts = {};
      const filters = { 
        searchQuery: searchQuery || '', 
        activeFilters: activeFilters || {}, 
        startYear: -Infinity, 
        endYear: Infinity 
      };
      
      const filtered = applyFilters(studies, filters);
      
      filtered.forEach(study => {
        if (study && typeof study.year === 'number') {
          counts[study.year] = (counts[study.year] || 0) + 1;
        }
      });
      return counts;
    } catch (error) {
      console.error('Error calculating filtered counts by year:', error);
      return studyCountsByYear;
    }
  }, [studies, searchQuery, activeFilters, studyCountsByYear]);
  
  const studiesOutsideCurrentRange = useMemo(() => {
    if (!studies || !Array.isArray(studies)) return null;
    if (Object.keys(activeFilters || {}).length === 0 && !(searchQuery || '').trim()) {
      return null;
    }
    
    try {
      const filters = { 
        searchQuery: searchQuery || '', 
        activeFilters: activeFilters || {}, 
        startYear: -Infinity, 
        endYear: Infinity 
      };
      
      const matchingStudies = applyFilters(studies, filters);
      const outsideRange = matchingStudies.filter(study => 
        study && (study.year < startYear || study.year > endYear)
      );
      
      return outsideRange.length > 0 ? outsideRange : null;
    } catch (error) {
      console.error('Error calculating studies outside range:', error);
      return null;
    }
  }, [studies, activeFilters, searchQuery, startYear, endYear]);
  
  const contextValue = {
    studies: studies || [],
    metadata: metadata || {},
    loading: loading,
    error: error,
    
    selectedYear: selectedYear,
    startYear: startYear,
    endYear: endYear,
    searchQuery: searchQuery,
    activeFilters: activeFilters || {},
    sortOption: sortOption,
    openDropdowns: openDropdowns || {},
    expandedStudies: expandedStudiesSet, 
    showDataStats: showDataStats,
    
    filteredStudies: filteredStudies || [],
    studyCountsByYear: studyCountsByYear || {},
    filteredStudyCountsByYear: filteredStudyCountsByYear || {},
    studiesOutsideCurrentRange: studiesOutsideCurrentRange,
    
    reloadData: () => {
      try {
        return csvLoader.loadStudies(true);
      } catch (error) {
        console.error('Error reloading data:', error);
      }
    },
    dispatch
  };
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};