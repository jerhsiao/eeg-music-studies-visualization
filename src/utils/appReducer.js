export const ACTION_TYPES = {
  DATA_LOAD_START: 'DATA_LOAD_START',
  DATA_LOAD_SUCCESS: 'DATA_LOAD_SUCCESS',
  DATA_LOAD_ERROR: 'DATA_LOAD_ERROR',
  
  SET_SELECTED_YEAR: 'SET_SELECTED_YEAR',
  SET_START_YEAR: 'SET_START_YEAR',
  SET_END_YEAR: 'SET_END_YEAR',
  
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_FILTER: 'SET_FILTER',
  TOGGLE_FILTER: 'TOGGLE_FILTER',
  REMOVE_FILTER: 'REMOVE_FILTER',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  SET_SORT_OPTION: 'SET_SORT_OPTION',
  
  TOGGLE_DROPDOWN: 'TOGGLE_DROPDOWN',
  CLOSE_ALL_DROPDOWNS: 'CLOSE_ALL_DROPDOWNS',
  TOGGLE_EXPANDED_STUDY: 'TOGGLE_EXPANDED_STUDY',
  TOGGLE_DATA_STATS: 'TOGGLE_DATA_STATS'
};

export const initialState = {
  data: {
    studies: [],
    metadata: {
      columns: [],
      count: 0,
      yearRange: { min: 1975, max: 2025 },
      featureCategories: []
    },
    loading: true,
    error: null
  },
  
  selectedYear: 2000,
  startYear: 1995, 
  endYear: 2005,   
  
  searchQuery: '',
  activeFilters: {},
  sortOption: 'year-asc',
  
  openDropdowns: {},
  expandedStudies: new Set(),
  showDataStats: false
};

const updateFilter = (activeFilters, category, value) => {
  const currentValues = activeFilters[category] || [];
  
  if (currentValues.includes(value)) {
    const newValues = currentValues.filter(v => v !== value);
    if (newValues.length === 0) {
      const { [category]: _, ...rest } = activeFilters;
      return rest;
    }
    return { ...activeFilters, [category]: newValues };
  }
  
  return { ...activeFilters, [category]: [...currentValues, value] };
};

const removeFilter = (activeFilters, category, value) => {
  const currentValues = activeFilters[category] || [];
  const newValues = currentValues.filter(v => v !== value);
  
  if (newValues.length === 0) {
    const { [category]: _, ...rest } = activeFilters;
    return rest;
  }
  
  return { ...activeFilters, [category]: newValues };
};

export const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.DATA_LOAD_START:
      return {
        ...state,
        data: { ...state.data, loading: true, error: null }
      };
      
    case ACTION_TYPES.DATA_LOAD_SUCCESS: {
      const { studies, metadata } = action.payload;
      
      return {
        ...state,
        data: { studies, metadata, loading: false, error: null },
        selectedYear: 2000,
        startYear: 1995,
        endYear: 2005
      };
    }
    
    case ACTION_TYPES.DATA_LOAD_ERROR:
      return {
        ...state,
        data: { ...state.data, loading: false, error: action.payload }
      };
    
    case ACTION_TYPES.SET_SELECTED_YEAR:
      return { 
        ...state, 
        selectedYear: action.payload,
        startYear: action.payload - 5,
        endYear: action.payload + 5 
      };
      
    case ACTION_TYPES.SET_START_YEAR:
      return { ...state, startYear: action.payload };
      
    case ACTION_TYPES.SET_END_YEAR:
      return { ...state, endYear: action.payload };
    
    case ACTION_TYPES.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };

    case ACTION_TYPES.SET_FILTER:
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          [action.payload.category]: action.payload.values
        }
      };
      
    case ACTION_TYPES.TOGGLE_FILTER:
      return {
        ...state,
        activeFilters: updateFilter(state.activeFilters, action.payload.category, action.payload.value)
      };
    
    case ACTION_TYPES.REMOVE_FILTER:
      return {
        ...state,
        activeFilters: removeFilter(state.activeFilters, action.payload.category, action.payload.value)
      };
    
    case ACTION_TYPES.CLEAR_FILTERS:
      return {
        ...state,
        activeFilters: {},
        searchQuery: ''
      };
      
    case ACTION_TYPES.SET_SORT_OPTION:
      return {
        ...state,
        sortOption: action.payload,
        openDropdowns: { ...state.openDropdowns, 'Sort By': false }
      };
    
    case ACTION_TYPES.TOGGLE_DROPDOWN:
      return {
        ...state,
        openDropdowns: {
          ...state.openDropdowns,
          [action.payload]: !state.openDropdowns[action.payload]
        }
      };
    
    case ACTION_TYPES.CLOSE_ALL_DROPDOWNS:
      return {
        ...state,
        openDropdowns: {}
      };
      
    case ACTION_TYPES.TOGGLE_EXPANDED_STUDY: {
      const newExpandedStudies = new Set(state.expandedStudies);
      
      if (newExpandedStudies.has(action.payload)) {
        newExpandedStudies.delete(action.payload);
      } else {
        newExpandedStudies.add(action.payload);
      }
      
      return { ...state, expandedStudies: newExpandedStudies };
    }
    
    case ACTION_TYPES.TOGGLE_DATA_STATS:
      return { ...state, showDataStats: !state.showDataStats };
      
    default:
      return state;
  }
};