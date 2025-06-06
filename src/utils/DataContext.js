import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { appReducer, initialState, ACTION_TYPES } from './appReducer';
import { applyFilters, sortFunctions, generateFilterOptions, DataTransforms } from './dataProcessing';

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
    data, 
    selectedYear, 
    startYear, 
    endYear, 
    searchQuery, 
    activeFilters, 
    sortOption,
    openDropdowns,
    expandedStudies,
    showDataStats
  } = state;

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: ACTION_TYPES.DATA_LOAD_START });
        
        const response = await fetch('/eeg-music-studies-database.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        
        const filterOptions = generateFilterOptions(jsonData.studies);
        
        const enhancedMetadata = {
          ...jsonData.metadata,
          filterOptions
        };
        
        dispatch({ 
          type: ACTION_TYPES.DATA_LOAD_SUCCESS, 
          payload: { studies: jsonData.studies, metadata: enhancedMetadata }
        });
        
      } catch (error) {
        console.error("Error loading data:", error);
        dispatch({ 
          type: ACTION_TYPES.DATA_LOAD_ERROR, 
          payload: error.message
        });
      }
    };
    
    loadData();
  }, []);
  
  const filteredStudies = useMemo(() => {
    if (!data.studies.length) return [];
    
    const filters = { searchQuery, activeFilters, startYear, endYear };
    let filtered = applyFilters(data.studies, filters);
    
    const sortFn = sortFunctions[sortOption] || sortFunctions['year-asc'];
    return filtered.sort(sortFn);
  }, [data.studies, searchQuery, activeFilters, startYear, endYear, sortOption]);
  
  const studyCountsByYear = useMemo(() => {
    const counts = {};
    data.studies.forEach(study => {
      counts[study.year] = (counts[study.year] || 0) + 1;
    });
    return counts;
  }, [data.studies]);

  const filteredStudyCountsByYear = useMemo(() => {
    const counts = {};
    const filters = { searchQuery, activeFilters, startYear: -Infinity, endYear: Infinity };
    const filtered = applyFilters(data.studies, filters);
    
    filtered.forEach(study => {
      counts[study.year] = (counts[study.year] || 0) + 1;
    });
    return counts;
  }, [data.studies, searchQuery, activeFilters]);
  
  const studiesOutsideCurrentRange = useMemo(() => {
    if (Object.keys(activeFilters).length === 0 && !searchQuery.trim()) {
      return null;
    }
    
    const filters = { searchQuery, activeFilters, startYear: -Infinity, endYear: Infinity };
    const matchingStudies = applyFilters(data.studies, filters);
    const outsideRange = matchingStudies.filter(study => 
      study.year < startYear || study.year > endYear
    );
    
    return outsideRange.length > 0 ? outsideRange : null;
  }, [data.studies, activeFilters, searchQuery, startYear, endYear]);
  
  const contextValue = {
    studies: data.studies,
    metadata: data.metadata,
    loading: data.loading,
    error: data.error,
    selectedYear,
    startYear,
    endYear,
    searchQuery,
    activeFilters,
    sortOption,
    openDropdowns,
    expandedStudies,
    showDataStats,
    
    filteredStudies,
    studyCountsByYear,
    filteredStudyCountsByYear,
    studiesOutsideCurrentRange,
    
    DataTransforms,
    
    data,
    dispatch
  };
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};