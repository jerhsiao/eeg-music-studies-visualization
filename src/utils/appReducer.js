/**
 * Main application reducer that manages state for the EEG Music Studies app
 */

// Define action types as constants to avoid typos
export const ACTION_TYPES = {
  // Data loading actions
  DATA_LOAD_START: 'DATA_LOAD_START',
  DATA_LOAD_SUCCESS: 'DATA_LOAD_SUCCESS',
  DATA_LOAD_ERROR: 'DATA_LOAD_ERROR',
  
  // View mode actions
  SET_VIEW_MODE: 'SET_VIEW_MODE',
  
  // Year selection actions
  SET_SELECTED_YEAR: 'SET_SELECTED_YEAR',
  SET_YEAR_RANGE: 'SET_YEAR_RANGE',
  SET_START_YEAR: 'SET_START_YEAR', 
  SET_END_YEAR: 'SET_END_YEAR',
  
  // Search and filter actions
  SET_FILTER: 'SET_FILTER',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  TOGGLE_FILTER: 'TOGGLE_FILTER',
  ADD_FILTER: 'ADD_FILTER',
  REMOVE_FILTER: 'REMOVE_FILTER',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  SET_SORT_OPTION: 'SET_SORT_OPTION',
  
  // UI state actions
  TOGGLE_DROPDOWN: 'TOGGLE_DROPDOWN',
  CLOSE_ALL_DROPDOWNS: 'CLOSE_ALL_DROPDOWNS',
  TOGGLE_EXPANDED_STUDY: 'TOGGLE_EXPANDED_STUDY',
  TOGGLE_DATA_STATS: 'TOGGLE_DATA_STATS'
};

// Initial state for the reducer
export const initialState = {
  // Data state
  data: {
    studies: [],
    metadata: {
      columns: [],
      count: 0,
      yearRange: { min: 1970, max: 2025 },
      featureCategories: []
    },
    loading: true,
    error: null
  },
  
  // View state
  viewMode: 'timeline', // 'timeline' or 'list'
  
  // Timeline/year selection state
  selectedYear: 2010,
  startYear: 2000,
  endYear: 2020,
  
  // Search and filter state
  searchQuery: '',
  activeFilters: {},
  sortOption: 'year-asc',
  
  // UI state
  openDropdowns: {
    'Paradigm Type': false,
    'Stimulus Type': false,
    'Musical Training': false,
    'Musical Features': false,
    'Sort By': false
  },
  expandedStudies: new Set(),
  showDataStats: false,
  
  // Autocomplete filter state
  eegSystemSearch: '',
  showEEGDropdown: false,
  channelCountSearch: '',
  showChannelDropdown: false
};

// Main reducer function
export const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.DATA_LOAD_START:
      return {
        ...state,
        data: {
          ...state.data,
          loading: true,
          error: null
        }
      };
      
    case ACTION_TYPES.DATA_LOAD_SUCCESS: {
      const { studies, metadata } = action.payload;
      // Set default selected year to middle of data range
      const midYear = Math.round((metadata.yearRange.min + metadata.yearRange.max) / 2);
      
      return {
        ...state,
        data: {
          studies,
          metadata,
          loading: false,
          error: null
        },
        selectedYear: midYear,
        startYear: metadata.yearRange.min,
        endYear: metadata.yearRange.max
      };
    }
    
    case ACTION_TYPES.DATA_LOAD_ERROR:
      return {
        ...state,
        data: {
          ...state.data,
          loading: false,
          error: action.payload
        }
      };
    
    case ACTION_TYPES.SET_VIEW_MODE:
      return {
        ...state,
        viewMode: action.payload
      };
    
    case ACTION_TYPES.SET_SELECTED_YEAR:
      return {
        ...state,
        selectedYear: action.payload
      };
      
    case ACTION_TYPES.SET_YEAR_RANGE:
      return {
        ...state,
        startYear: action.payload.min,
        endYear: action.payload.max
      };
      
    case ACTION_TYPES.SET_START_YEAR:
      return {
        ...state,
        startYear: Math.min(action.payload, state.endYear)
      };
      
    case ACTION_TYPES.SET_END_YEAR:
      return {
        ...state,
        endYear: Math.max(action.payload, state.startYear)
      };
    
    // Search and filter cases
    case ACTION_TYPES.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload
      };

    case ACTION_TYPES.SET_FILTER: {
      const { category, values } = action.payload;
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          [category]: values
        }
      };
    }
      
    case ACTION_TYPES.TOGGLE_FILTER: {
      const { category, value } = action.payload;
      const currentValues = state.activeFilters[category] || [];
      
      // Check if the value is already selected
      if (currentValues.includes(value)) {
        // Remove the value
        const newValues = currentValues.filter(v => v !== value);
        
        // If no values left for this category, remove the category
        if (newValues.length === 0) {
          const { [category]: _, ...restFilters } = state.activeFilters;
          return {
            ...state,
            activeFilters: restFilters
          };
        }
        
        // Update with the new values
        return {
          ...state,
          activeFilters: {
            ...state.activeFilters,
            [category]: newValues
          }
        };
      } else {
        // Add the value
        return {
          ...state,
          activeFilters: {
            ...state.activeFilters,
            [category]: [...currentValues, value]
          }
        };
      }
    }
    
    case ACTION_TYPES.ADD_FILTER: {
      const { category, value } = action.payload;
      const currentValues = state.activeFilters[category] || [];
      
      // Only add if it doesn't already exist
      if (!currentValues.includes(value)) {
        return {
          ...state,
          activeFilters: {
            ...state.activeFilters,
            [category]: [...currentValues, value]
          }
        };
      }
      return state;
    }
    
    case ACTION_TYPES.REMOVE_FILTER: {
      const { category, value } = action.payload;
      const currentValues = state.activeFilters[category] || [];
      
      // If value doesn't exist, no change
      if (!currentValues.includes(value)) {
        return state;
      }
      
      // Remove the value
      const newValues = currentValues.filter(v => v !== value);
      
      // If no values left, remove the whole category
      if (newValues.length === 0) {
        const { [category]: _, ...restFilters } = state.activeFilters;
        return {
          ...state,
          activeFilters: restFilters
        };
      }
      
      // Update with the new values
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          [category]: newValues
        }
      };
    }
    
    case ACTION_TYPES.CLEAR_FILTERS:
      return {
        ...state,
        activeFilters: {},
        searchQuery: '',
        eegSystemSearch: '',
        channelCountSearch: ''
      };
      
    case ACTION_TYPES.SET_SORT_OPTION:
      return {
        ...state,
        sortOption: action.payload,
        openDropdowns: {
          ...state.openDropdowns,
          'Sort By': false
        }
      };
    
    // UI state cases
    case ACTION_TYPES.TOGGLE_DROPDOWN: {
      const category = action.payload;
      return {
        ...state,
        openDropdowns: {
          ...state.openDropdowns,
          [category]: !state.openDropdowns[category]
        }
      };
    }
    
    case ACTION_TYPES.CLOSE_ALL_DROPDOWNS:
      // Create a new object with all dropdowns set to false
      const closedDropdowns = Object.keys(state.openDropdowns).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      
      return {
        ...state,
        openDropdowns: closedDropdowns,
        showEEGDropdown: false,
        showChannelDropdown: false
      };
      
    case ACTION_TYPES.TOGGLE_EXPANDED_STUDY: {
      const studyId = action.payload;
      const newExpandedStudies = new Set(state.expandedStudies);
      
      if (newExpandedStudies.has(studyId)) {
        newExpandedStudies.delete(studyId);
      } else {
        newExpandedStudies.add(studyId);
      }
      
      return {
        ...state,
        expandedStudies: newExpandedStudies
      };
    }
    
    case ACTION_TYPES.TOGGLE_DATA_STATS:
      return {
        ...state,
        showDataStats: !state.showDataStats
      };
      
    // Default case
    default:
      return state;
  }
};