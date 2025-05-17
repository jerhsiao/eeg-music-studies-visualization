import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { appReducer, initialState, ACTION_TYPES } from './appReducer';

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
    viewMode, 
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
  
  // Load data and build filter options
  useEffect(() => {
    const loadData = async () => {
      try {
        // Signal that data loading has started
        dispatch({ type: ACTION_TYPES.DATA_LOAD_START });
        
        const response = await fetch('/eeg-music-studies-database.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        
        // Build filter options from the data
        const filterOptions = {};
        
        // Define standard filter categories
        const filterCategories = [
          'Paradigm Type', 
          'Stimulus Type',
          'Musical Training',
          'EEG System Used'
        ];
        
        // Standard training categories
        const standardTrainingCategories = [
          'Extensive Training',
          'Moderate Training',
          'Minimal Training',
          'Mixed Groups',
          'No Formal Training',
          'Not Reported',
          'Not Applicable'
        ];
        
        // Build filter options for each category
        filterCategories.forEach(category => {
          const uniqueValues = new Set();
          
          jsonData.studies.forEach(study => {
            if (category === 'Musical Training') {
              if (study[category]) {
                // Check if training description contains any standard categories
                standardTrainingCategories.forEach(standardCategory => {
                  if (study[category].includes(standardCategory)) {
                    uniqueValues.add(standardCategory);
                  }
                });
              }
            } else {
              // For other categories
              if (Array.isArray(study[category])) {
                study[category].forEach(value => uniqueValues.add(value));
              } else if (study[category]) {
                uniqueValues.add(study[category].toString());
              }
            }
          });
          
          // Sort the values
          filterOptions[category] = Array.from(uniqueValues).sort();
        });
        
        // Process Channel Count separately
        const channelCounts = new Set();
        jsonData.studies.forEach(study => {
          if (study['Channel Count']) {
            // Format the channel count for display
            const match = study['Channel Count'].match(/^(\d+)/);
            if (match) {
              channelCounts.add(match[1] + ' channels');
            } else {
              channelCounts.add(study['Channel Count']);
            }
          }
        });
        
        // Sort channel counts numerically
        filterOptions['Channel Count'] = Array.from(channelCounts).sort((a, b) => {
          const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
          const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
          return numA - numB;
        });
        
        // Enhance metadata with the filter options
        const enhancedMetadata = {
          ...jsonData.metadata,
          filterOptions
        };
        
        dispatch({ 
          type: ACTION_TYPES.DATA_LOAD_SUCCESS, 
          payload: {
            studies: jsonData.studies,
            metadata: enhancedMetadata
          }
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
  
  // Memoized function to filter studies based on current criteria
  const filteredStudies = useMemo(() => {
    if (!data.studies.length) return [];
    
    let filtered = [...data.studies];
    
    if (viewMode === 'timeline') {
      // Timeline view: filter by ±5 years from selected year
      filtered = filtered.filter(study => 
        Math.abs(study.year - selectedYear) <= 5
      );
    } else {
      // List view: filter by start and end year range
      filtered = filtered.filter(study => 
        study.year >= startYear && study.year <= endYear
      );
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(study => {
        return Object.entries(study).some(([key, value]) => {
          if (key === 'id' || key === 'channelCountValue' || key === 'passageLengthSeconds' || 
              key === 'participantsValue' || key === 'normalizedFeatures') return false;
          
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          } else if (Array.isArray(value)) {
            return value.some(v => 
              typeof v === 'string' && v.toLowerCase().includes(query)
            );
          } else if (value !== null && value !== undefined) {
            return String(value).toLowerCase().includes(query);
          }
          return false;
        });
      });
    }
    
    // Apply category filters
    Object.entries(activeFilters).forEach(([category, selectedValues]) => {
      if (selectedValues.length > 0) {
        // Special case for Musical Training
        if (category === 'Musical Training') {
          filtered = filtered.filter(study => {
            if (!study[category]) return false;
            
            return selectedValues.some(selectedValue => 
              study[category].includes(selectedValue)
            );
          });
        }
        // Special case for Channel Count
        else if (category === 'Channel Count') {
          filtered = filtered.filter(study => {
            if (!study['Channel Count']) return false;
            
            // Extract the channel count number and format it
            const match = study['Channel Count'].match(/^(\d+)/);
            if (match) {
              const formattedCount = match[1] + ' channels';
              return selectedValues.includes(formattedCount);
            } else {
              return selectedValues.includes(study['Channel Count']);
            }
          });
        }
        // Special case for normalized features
        else if (category === 'normalizedFeatures') {
          filtered = filtered.filter(study => {
            if (!study[category] || !Array.isArray(study[category])) return false;
            
            return selectedValues.some(feature => study[category].includes(feature));
          });
        }
        // Default case for other filters
        else {
          filtered = filtered.filter(study => {
            if (!study[category]) return false;
            
            if (Array.isArray(study[category])) {
              return study[category].some(value => 
                selectedValues.includes(value.toString())
              );
            } else {
              return selectedValues.includes(study[category].toString());
            }
          });
        }
      }
    });
    
    // Apply sorting
    switch(sortOption) {
      case 'year-asc':
        filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      case 'year-desc':
        filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case 'participants-asc':
        filtered.sort((a, b) => {
          const aVal = a.participantsValue !== undefined ? a.participantsValue : -1;
          const bVal = b.participantsValue !== undefined ? b.participantsValue : -1;
          
          // Put -1 values (unknown) at the end
          if (aVal === -1 && bVal === -1) return 0;
          if (aVal === -1) return 1;
          if (bVal === -1) return -1;
          
          return aVal - bVal;
        });
        break;
      case 'participants-desc':
        filtered.sort((a, b) => {
          const aVal = a.participantsValue !== undefined ? a.participantsValue : -1;
          const bVal = b.participantsValue !== undefined ? b.participantsValue : -1;
          
          if (aVal === -1 && bVal === -1) return 0;
          if (aVal === -1) return 1;
          if (bVal === -1) return -1;
          
          return bVal - aVal;
        });
        break;
      case 'length-asc':
        filtered.sort((a, b) => {
          const aVal = a.passageLengthSeconds !== undefined ? a.passageLengthSeconds : -1;
          const bVal = b.passageLengthSeconds !== undefined ? b.passageLengthSeconds : -1;
          
          if (aVal === -1 && bVal === -1) return 0;
          if (aVal === -1) return 1;
          if (bVal === -1) return -1;
          
          return aVal - bVal;
        });
        break;
      case 'length-desc':
        filtered.sort((a, b) => {
          const aVal = a.passageLengthSeconds !== undefined ? a.passageLengthSeconds : -1;
          const bVal = b.passageLengthSeconds !== undefined ? b.passageLengthSeconds : -1;
          
          if (aVal === -1 && bVal === -1) return 0;
          if (aVal === -1) return 1;
          if (bVal === -1) return -1;
          
          return bVal - aVal;
        });
        break;
      default:
        // Default sorting based on view mode
        if (viewMode === 'timeline') {
          // For timeline view, put exact matches first then by proximity
          const exactMatches = filtered.filter(s => s.year === selectedYear);
          const others = filtered
            .filter(s => s.year !== selectedYear)
            .sort((a, b) => a.year - b.year);
          
          filtered = [...exactMatches, ...others];
        } else {
          // For list view, default to ascending year
          filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
        }
    }
    
    return filtered;
  }, [
    data.studies, 
    viewMode, 
    selectedYear, 
    startYear, 
    endYear, 
    searchQuery, 
    activeFilters, 
    sortOption
  ]);
  
  // Memoized function to get study counts by year for the timeline
  const studyCountsByYear = useMemo(() => {
    const counts = {};
    data.studies.forEach(study => {
      if (!counts[study.year]) {
        counts[study.year] = 0;
      }
      counts[study.year]++;
    });
    return counts;
  }, [data.studies]);
  
  // Memoized function to get filtered study counts by year
  const filteredStudyCountsByYear = useMemo(() => {
    const counts = {};
    
    // Apply all active filters except year filters
    let filtered = [...data.studies];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(study => {
        return Object.entries(study).some(([key, value]) => {
          if (key === 'id' || key === 'channelCountValue' || key === 'passageLengthSeconds' || 
              key === 'participantsValue' || key === 'normalizedFeatures') return false;
          
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          } else if (Array.isArray(value)) {
            return value.some(v => 
              typeof v === 'string' && v.toLowerCase().includes(query)
            );
          } else if (value !== null && value !== undefined) {
            return String(value).toLowerCase().includes(query);
          }
          return false;
        });
      });
    }
    
    // Apply category filters
    Object.entries(activeFilters).forEach(([category, selectedValues]) => {
      if (selectedValues.length > 0) {
        // Special case for Musical Training
        if (category === 'Musical Training') {
          filtered = filtered.filter(study => {
            if (!study[category]) return false;
            
            return selectedValues.some(selectedValue => 
              study[category].includes(selectedValue)
            );
          });
        }
        // Special case for Channel Count
        else if (category === 'Channel Count') {
          filtered = filtered.filter(study => {
            if (!study['Channel Count']) return false;
            
            // Extract the channel count number and format it
            const match = study['Channel Count'].match(/^(\d+)/);
            if (match) {
              const formattedCount = match[1] + ' channels';
              return selectedValues.includes(formattedCount);
            } else {
              return selectedValues.includes(study['Channel Count']);
            }
          });
        }
        // Special case for normalized features
        else if (category === 'normalizedFeatures') {
          filtered = filtered.filter(study => {
            if (!study[category] || !Array.isArray(study[category])) return false;
            
            return selectedValues.some(feature => study[category].includes(feature));
          });
        }
        // Default case for other filters
        else {
          filtered = filtered.filter(study => {
            if (!study[category]) return false;
            
            if (Array.isArray(study[category])) {
              return study[category].some(value => 
                selectedValues.includes(value.toString())
              );
            } else {
              return selectedValues.includes(study[category].toString());
            }
          });
        }
      }
    });
    
    // Count filtered studies by year
    filtered.forEach(study => {
      if (!counts[study.year]) {
        counts[study.year] = 0;
      }
      counts[study.year]++;
    });
    
    return counts;
  }, [data.studies, searchQuery, activeFilters]);
  
  // Check for studies matching current filters but outside current year range
  const studiesOutsideCurrentRange = useMemo(() => {
    // If no active filters or search, there's no need to find matches outside range
    if (Object.keys(activeFilters).length === 0 && !searchQuery.trim()) {
      return null;
    }
    
    // Start with all studies
    let matchingStudies = [...data.studies];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      matchingStudies = matchingStudies.filter(study => {
        return Object.entries(study).some(([key, value]) => {
          if (key === 'id' || key === 'channelCountValue' || key === 'passageLengthSeconds' || 
              key === 'participantsValue' || key === 'normalizedFeatures') return false;
          
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          } else if (Array.isArray(value)) {
            return value.some(v => 
              typeof v === 'string' && v.toLowerCase().includes(query)
            );
          } else if (value !== null && value !== undefined) {
            return String(value).toLowerCase().includes(query);
          }
          return false;
        });
      });
    }
    
    // Apply category filters
    Object.entries(activeFilters).forEach(([category, selectedValues]) => {
      if (selectedValues.length > 0) {
        // Special case for Musical Training
        if (category === 'Musical Training') {
          matchingStudies = matchingStudies.filter(study => {
            if (!study[category]) return false;
            return selectedValues.some(selectedValue => 
              study[category].includes(selectedValue)
            );
          });
        }
        // Special case for Channel Count
        else if (category === 'Channel Count') {
          matchingStudies = matchingStudies.filter(study => {
            if (!study['Channel Count']) return false;
            
            // Extract the channel count number and format it
            const match = study['Channel Count'].match(/^(\d+)/);
            if (match) {
              const formattedCount = match[1] + ' channels';
              return selectedValues.includes(formattedCount);
            } else {
              return selectedValues.includes(study['Channel Count']);
            }
          });
        }
        // Special case for normalized features
        else if (category === 'normalizedFeatures') {
          matchingStudies = matchingStudies.filter(study => {
            if (!study[category] || !Array.isArray(study[category])) return false;
            return selectedValues.some(feature => study[category].includes(feature));
          });
        }
        // Default case for other filters
        else {
          matchingStudies = matchingStudies.filter(study => {
            if (!study[category]) return false;
            
            if (Array.isArray(study[category])) {
              return study[category].some(value => 
                selectedValues.includes(value.toString())
              );
            } else {
              return selectedValues.includes(study[category].toString());
            }
          });
        }
      }
    });
    
    // Now exclude studies within the current range
    if (viewMode === 'timeline') {
      matchingStudies = matchingStudies.filter(study => 
        Math.abs(study.year - selectedYear) > 5
      );
    } else {
      matchingStudies = matchingStudies.filter(study => 
        study.year < startYear || study.year > endYear
      );
    }
    
    return matchingStudies.length > 0 ? matchingStudies : null;
  }, [data.studies, activeFilters, searchQuery, viewMode, selectedYear, startYear, endYear]);
  
  const contextValue = {
    studies: data.studies,
    metadata: data.metadata,
    loading: data.loading,
    error: data.error,
    viewMode,
    selectedYear,
    startYear,
    endYear,
    searchQuery,
    activeFilters,
    sortOption,
    openDropdowns,
    expandedStudies,
    showDataStats,
    
    // Computed values
    filteredStudies,
    studyCountsByYear,
    filteredStudyCountsByYear,
    studiesOutsideCurrentRange,
    
    dispatch
  };
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};