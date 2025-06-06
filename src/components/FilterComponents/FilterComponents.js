import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useData } from '../../utils/DataContext';
import { ACTION_TYPES } from '../../utils/appReducer';
import './FilterComponents.css';

export const StandardFilter = ({ category, options }) => {
  const { activeFilters, openDropdowns, dispatch } = useData();
  
  const toggleDropdown = useCallback(() => {
    dispatch({
      type: ACTION_TYPES.TOGGLE_DROPDOWN,
      payload: category.key
    });
  }, [category.key, dispatch]);
  
  const handleFilterChange = useCallback((value, e) => {
    if (e && e.target.tagName.toLowerCase() !== 'input') {
      e.preventDefault();
    }

    dispatch({
      type: ACTION_TYPES.TOGGLE_FILTER,
      payload: { 
        category: category.key, 
        value 
      }
    });
  }, [category.key, dispatch]);
  
  return (
    <div className="filter-dropdown">
      <div 
        className="filter-dropdown-header" 
        onClick={toggleDropdown}
      >
        <h4>{category.label}</h4>
        <span className="dropdown-arrow">
          {openDropdowns[category.key] ? '▲' : '▼'}
        </span>
      </div>
      
      {openDropdowns[category.key] && (
        <div className="filter-options-dropdown">
          {options.map(value => (
            <div 
              key={`${category.key}-${value}`}
              className={`filter-option ${(activeFilters[category.key] || []).includes(value) ? 'active' : ''}`}
              onClick={(e) => handleFilterChange(value, e)}
            >
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={(activeFilters[category.key] || []).includes(value)}
                  onChange={(e) => handleFilterChange(value, e)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="filter-label">{value}</span>
              </label>
            </div>
          ))}
        </div>
      )}
      
      {(activeFilters[category.key] || []).length > 0 && (
        <div className="active-filter-count">
          {(activeFilters[category.key] || []).length} selected
        </div>
      )}
    </div>
  );
};

export const SearchableFilter = ({ category, options, placeholder }) => {
  const { activeFilters, dispatch } = useData();
  const [searchValue, setSearchValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const filteredOptions = searchValue
    ? options.filter(option => 
        option.toLowerCase().includes(searchValue.toLowerCase())
      )
    : options;
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);
  
  const selectOption = useCallback((option) => {
    dispatch({
      type: ACTION_TYPES.SET_FILTER,
      payload: {
        category: category.key,
        values: [option]
      }
    });
    
    setSearchValue('');
    setShowDropdown(false);
  }, [category.key, dispatch]);
  
  const removeOption = useCallback((option) => {
    dispatch({
      type: ACTION_TYPES.REMOVE_FILTER,
      payload: {
        category: category.key,
        value: option
      }
    });
  }, [category.key, dispatch]);
  
  return (
    <div className="filter-search">
      <div className="autocomplete-container" ref={dropdownRef}>
        <input
          type="text"
          className="autocomplete-input"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setShowDropdown(true)}
        />
        
        {showDropdown && searchValue && (
          <div className="autocomplete-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div 
                  key={option} 
                  className={`autocomplete-item ${(activeFilters[category.key] || []).includes(option) ? 'active' : ''}`}
                  onClick={() => selectOption(option)}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="autocomplete-item no-results">
                No matching {category.label.toLowerCase()} found
              </div>
            )}
          </div>
        )}
      </div>
      
      {(activeFilters[category.key] || []).length > 0 && (
        <div className="active-filter-tags">
          {(activeFilters[category.key] || []).map(option => (
            <div key={option} className="active-filter-tag">
              <span>{option}</span>
              <button 
                className="remove-filter-tag"
                onClick={() => removeOption(option)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MusicalFeaturesFilter = () => {
  const { metadata, activeFilters, openDropdowns, dispatch } = useData();
  
  const featureCategories = metadata?.featureCategories || [];
  
  const toggleDropdown = useCallback(() => {
    dispatch({
      type: ACTION_TYPES.TOGGLE_DROPDOWN,
      payload: 'Features Analyzed'
    });
  }, [dispatch]);
  
  const handleFeatureFilterChange = useCallback((feature, e) => {
    if (e && e.target.tagName.toLowerCase() !== 'input') {
      e.preventDefault();
    }

    dispatch({
      type: ACTION_TYPES.TOGGLE_FILTER,
      payload: {
        category: 'normalizedFeatures',
        value: feature
      }
    });
  }, [dispatch]);
  
  const featureGroups = {
    "EEG Frequency Bands": ["delta", "theta", "alpha", "beta", "gamma"],
    "Cognitive & Emotional": ["attention", "emotion", "valence", "arousal"],
    "Musical Elements": ["tempo", "harmony", "melody"],
    "Brain Activity": ["coherence", "power", "erp", "synchronization"],
    "Advanced Analysis": ["expectancy", "imagery", "envelope", "spectral", "localization"]
  };
  
  return (
    <div className="filter-dropdown features-filter">
      <div 
        className="filter-dropdown-header" 
        onClick={toggleDropdown}
      >
        <h4>Features Analyzed</h4>
        <span className="dropdown-arrow">{openDropdowns['Features Analyzed'] ? '▲' : '▼'}</span>
      </div>
      
      {openDropdowns['Features Analyzed'] && (
        <div className="filter-options-dropdown features-dropdown">
          {Object.entries(featureGroups).map(([groupName, features]) => (
            <div key={groupName} className="feature-group">
              <div className="feature-group-header">{groupName}</div>
              <div className="feature-filter-grid">
                {features.map(feature => {
                  const featureData = featureCategories.find(f => f.name === feature);
                  if (!featureData) return null;
                  
                  return (
                    <div 
                      key={`feature-${feature}`}
                      className={`filter-option ${(activeFilters['normalizedFeatures'] || []).includes(feature) ? 'active' : ''}`}
                      onClick={(e) => handleFeatureFilterChange(feature, e)}
                    >
                      <label className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={(activeFilters['normalizedFeatures'] || []).includes(feature)}
                          onChange={(e) => handleFeatureFilterChange(feature, e)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="filter-label">
                          {feature.charAt(0).toUpperCase() + feature.slice(1)}
                          <span className="feature-count">({featureData.count})</span>
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {(activeFilters['normalizedFeatures'] || []).length > 0 && (
        <div className="active-filter-count">
          {(activeFilters['normalizedFeatures'] || []).length} selected
        </div>
      )}
    </div>
  );
};

export const SortOptionsFilter = ({ sortOptions, currentSort }) => {
  const { openDropdowns, dispatch } = useData();
  const sortDropdownRef = useRef(null);
  
  const toggleDropdown = useCallback(() => {
    dispatch({
      type: ACTION_TYPES.TOGGLE_DROPDOWN,
      payload: 'Sort By'
    });
  }, [dispatch]);
  
  const handleSortChange = useCallback((sortValue) => {
    dispatch({
      type: ACTION_TYPES.SET_SORT_OPTION,
      payload: sortValue
    });
  }, [dispatch]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        dispatch({
          type: ACTION_TYPES.TOGGLE_DROPDOWN,
          payload: 'Sort By'
        });
      }
    };
    
    if (openDropdowns['Sort By']) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdowns, dispatch]);
  
  return (
    <div className="sort-dropdown" ref={sortDropdownRef}>
      <div 
        className="filter-dropdown-header" 
        onClick={toggleDropdown}
      >
        <h4>Sort By: {sortOptions.find(opt => opt.value === currentSort)?.label || 'Default'}</h4>
        <span className="dropdown-arrow">{openDropdowns['Sort By'] ? '▲' : '▼'}</span>
      </div>
      
      {openDropdowns['Sort By'] && (
        <div className="filter-options-dropdown">
          {sortOptions.map(option => (
            <div 
              key={option.value} 
              className={`sort-option ${currentSort === option.value ? 'active' : ''}`}
              onClick={() => handleSortChange(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const YearRangeFilter = () => {
  const { startYear, endYear, metadata, dispatch } = useData();
  const [tempStartYear, setTempStartYear] = useState(startYear);
  const [tempEndYear, setTempEndYear] = useState(endYear);
  
  useEffect(() => {
    setTempStartYear(startYear);
    setTempEndYear(endYear);
  }, [startYear, endYear]);
  
  const handleStartYearChange = useCallback((e) => {
    const newStartYear = parseInt(e.target.value, 10);
    if (!isNaN(newStartYear)) {
      setTempStartYear(newStartYear);
    }
  }, []);
  
  const handleEndYearChange = useCallback((e) => {
    const newEndYear = parseInt(e.target.value, 10);
    if (!isNaN(newEndYear)) {
      setTempEndYear(newEndYear);
    }
  }, []);
  
  const applyYearRange = useCallback(() => {
    const middleYear = Math.round((tempStartYear + tempEndYear) / 2);
    
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_YEAR,
      payload: middleYear
    });
    
    dispatch({
      type: ACTION_TYPES.SET_START_YEAR,
      payload: tempStartYear
    });
    dispatch({
      type: ACTION_TYPES.SET_END_YEAR,
      payload: tempEndYear
    });
  }, [tempStartYear, tempEndYear, dispatch]);
  
  const minYear = metadata?.yearRange?.min || 1975;
  const maxYear = metadata?.yearRange?.max || 2025;
  
  return (
    <div className="year-range-inputs">
      <div className="year-input-group">
        <label htmlFor="start-year">Start Year:</label>
        <input
          id="start-year"
          type="number"
          min={minYear}
          max={maxYear}
          value={tempStartYear}
          onChange={handleStartYearChange}
        />
      </div>
      
      <div className="year-input-group">
        <label htmlFor="end-year">End Year:</label>
        <input
          id="end-year"
          type="number"
          min={minYear}
          max={maxYear}
          value={tempEndYear}
          onChange={handleEndYearChange}
        />
      </div>
      
      <div className="year-input-group">
        <button 
          className="apply-year-range-btn"
          onClick={applyYearRange}
        >
          Apply Year Range
        </button>
      </div>
    </div>
  );
};

export const FilterContainer = () => {
  const { 
    activeFilters,
    searchQuery,
    sortOption,
    metadata,
    dispatch 
  } = useData();
  
  const topRowFilters = [
    { key: 'Paradigm Type', label: 'Paradigm Type' },
    { key: 'Stimulus Type', label: 'Stimulus Type' },
    { key: 'Musical Training', label: 'Musical Training' },
    { key: 'Participant Range', label: 'Participant Count' }
  ];
  
  const standardTrainingCategories = [
    'Extensive Training',
    'Moderate Training',
    'Minimal Training',
    'Mixed Groups',
    'No Formal Training',
    'Not Reported',
    'Not Applicable'
  ];

  const participantRangeCategories = [
    '1-10',
    '11-25', 
    '26-50',
    '51-100',
    '100+'
  ];
  
  const sortOptions = [
    { value: 'year-asc', label: 'Year (Low to High)' },
    { value: 'year-desc', label: 'Year (High to Low)' },
    { value: 'participants-asc', label: 'Participants (Low to High)' },
    { value: 'participants-desc', label: 'Participants (High to Low)' },
    { value: 'length-asc', label: 'Passage Length (Short to Long)' },
    { value: 'length-desc', label: 'Passage Length (Long to Short)' }
  ];
  
  const clearFilters = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_FILTERS });
  }, [dispatch]);
  
  const handleSearchChange = useCallback((e) => {
    dispatch({
      type: ACTION_TYPES.SET_SEARCH_QUERY,
      payload: e.target.value
    });
  }, [dispatch]);
  
  const clearSearch = useCallback(() => {
    dispatch({
      type: ACTION_TYPES.SET_SEARCH_QUERY,
      payload: ''
    });
  }, [dispatch]);
  
  return (
    <div className="filters-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search across all fields..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        {searchQuery && (
          <button 
            className="clear-btn" 
            onClick={clearSearch}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters</h3>
          {Object.keys(activeFilters).length > 0 && (
            <button 
              className="clear-filters-btn" 
              onClick={clearFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>
        

        <YearRangeFilter />
        
        <div className="filter-row-top">
          {topRowFilters.map(category => {
            let options;
            if (category.key === 'Musical Training') {
              options = standardTrainingCategories;
            } else if (category.key === 'Participant Range') {
              options = participantRangeCategories;
            } else {
              options = metadata?.filterOptions?.[category.key] || [];
            }
            
            return (
              <StandardFilter 
                key={category.key}
                category={category}
                options={options}
              />
            );
          })}
          
          <MusicalFeaturesFilter />
        </div>
        
        <div className="filter-row-bottom">
          <SearchableFilter 
            category={{ key: 'EEG System Used', label: 'EEG System' }}
            options={metadata?.filterOptions?.['EEG System Used'] || []}
            placeholder="Search EEG systems..."
          />
          
          <SearchableFilter 
            category={{ key: 'Channel Count', label: 'Channel Count' }}
            options={metadata?.filterOptions?.['Channel Count'] || []}
            placeholder="Search channel counts..."
          />
        </div>
        
        <div className="sort-container">
          <SortOptionsFilter 
            sortOptions={sortOptions}
            currentSort={sortOption}
          />
        </div>
        
        {Object.keys(activeFilters).length > 0 && (
          <div className="active-filters-summary">
            {Object.entries(activeFilters).map(([category, values]) => (
              values.map(value => (
                <div key={`${category}-${value}`} className="active-filter-tag">
                  <span>{value}</span>
                  <button 
                    className="remove-filter-tag"
                    onClick={() => {
                      dispatch({
                        type: ACTION_TYPES.REMOVE_FILTER,
                        payload: { category, value }
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterContainer;