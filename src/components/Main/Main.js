import React, { useCallback } from 'react';
import { useData } from '../../utils/DataContext';
import { ACTION_TYPES } from '../../utils/appReducer';
import StudyCard from '../StudyCard/StudyCard';
import Timeline from '../Timeline/TimelineContainer';
import FilterContainer from '../FilterComponents/FilterComponents';
import Papa from 'papaparse';
import './Main.css';

const Main = () => {
  const { 
    loading, 
    error, 
    startYear,
    endYear,
    searchQuery,
    activeFilters,
    metadata,
    filteredStudies,
    studiesOutsideCurrentRange,
    dispatch
  } = useData();
  
  const findMatchingStudiesOutsideRange = useCallback(() => {
    if (filteredStudies.length > 0) return null;
    return studiesOutsideCurrentRange;
  }, [filteredStudies, studiesOutsideCurrentRange]);
  
  const navigateToMatchingStudy = useCallback((outsideMatches) => {
    if (!outsideMatches || outsideMatches.length === 0) return;
    
    const targetYear = outsideMatches[0].year;
    const buffer = 5;
    const minYear = metadata?.yearRange?.min || 1970;
    const maxYear = metadata?.yearRange?.max || 2025;
    
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_YEAR,
      payload: targetYear
    });
    
    dispatch({
      type: ACTION_TYPES.SET_START_YEAR,
      payload: Math.max(minYear, targetYear - buffer)
    });
    
    dispatch({
      type: ACTION_TYPES.SET_END_YEAR,
      payload: Math.min(maxYear, targetYear + buffer)
    });
  }, [metadata, dispatch]);
  
  const exportToCSV = useCallback(() => {
    if (!filteredStudies.length || !metadata) return;

    const exportData = filteredStudies.map(study => {
      const exportRow = {};
      metadata.columns.forEach(column => {
        if (study[column] !== undefined) {
          if (Array.isArray(study[column])) {
            exportRow[column] = study[column].join(', ');
          } else {
            exportRow[column] = study[column];
          }
        } else {
          exportRow[column] = '';
        }
      });
      
      return exportRow;
    });
    
    const csv = Papa.unparse({
      fields: metadata.columns,
      data: exportData
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    let filename = 'eeg-music-studies';
    filename += `-${startYear}-to-${endYear}`;
    if (searchQuery) {
      filename += `-search-${searchQuery.replace(/\s+/g, '-')}`;
    }
    filename += '.csv';
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredStudies, metadata, startYear, endYear, searchQuery]);
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading EEG Music Studies database...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  const outsideRangeMatches = findMatchingStudiesOutsideRange();
  
  return (
    <div className="eeg-music-container">
      <header className="header">
        <h1>EEG Music Studies Database</h1>
      </header>
      
      <div className="about-section">
        <h2>About This Visualization</h2>
        <p>
          This interactive database visualizes EEG studies related to music perception and cognition, 
          allowing researchers to explore methodologies, stimuli, and findings across different 
          paradigms and years. 
        </p>
        <p> 
          Each card represents a <b>unique experimental condition</b>, not necessarily a unique published study. 
          Many studies in this database tested multiple stimuli or conditions and are intentionally 
          displayed as <b>separate entries</b> to enable more precise filtering and comparison.
        </p>
        
        <div className="how-to-use">
          <h3>How to Use</h3>
          <div className="use-instructions">
            <div className="instruction-item">
              <span className="instruction-label">Timeline View:</span>
              <span>Timeline shows all years (1970-2025). Darker bars show studies in your selected range.</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-label">Year Range:</span>
              <span>Use Start/End Year controls to filter which studies appear in the cards below</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-label">Data Visualizer:</span>
              <span>View studies broken down by different metrics with interactive bars</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-label">Sorting:</span>
              <span>Order results by year, participants, or passage length</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-label">Search:</span>
              <span>Find studies across all data fields</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-label">Export:</span>
              <span>Save current results as CSV file</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="controls-panel">
        <div className="controls-top">
          <button className="export-btn" onClick={exportToCSV}>
            Export to CSV
          </button>
        </div>
        
        <FilterContainer />
      </div>
      
      <Timeline />
      
      <div className="results-info">
        <div className="results-count">
          Found {filteredStudies.length} {filteredStudies.length === 1 ? 'entry ' : 'entries '} 
          from {startYear} to {endYear}
          {searchQuery && ` matching "${searchQuery}"`}
          {Object.keys(activeFilters).length > 0 && ' with selected filters'}
        </div>
        
        <div className="results-range">
          Year Range: {startYear}-{endYear}
        </div>
      </div>
      
      {filteredStudies.length > 0 ? (
        <div className="studies-grid">
          {filteredStudies.map(study => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <h3>No studies match your current criteria in the {startYear}-{endYear} range</h3>
          
          {outsideRangeMatches && outsideRangeMatches.length > 0 && (
            <div className="outside-range-notification">
              <p>Found {outsideRangeMatches.length} matching {outsideRangeMatches.length === 1 ? 'study' : 'studies'} outside the {startYear}-{endYear} range.</p>
              <button 
                className="navigate-to-match-btn"
                onClick={() => navigateToMatchingStudy(outsideRangeMatches)}
              >
                View Matching {outsideRangeMatches.length === 1 ? 'Study' : 'Studies'}
              </button>
            </div>
          )}
          
          <p>Try adjusting your year range, filters, or search term</p>
          {(Object.keys(activeFilters).length > 0 || searchQuery) && (
            <button 
              className="reset-btn" 
              onClick={() => dispatch({ type: ACTION_TYPES.CLEAR_FILTERS })}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Main;