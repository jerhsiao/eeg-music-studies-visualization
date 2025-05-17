import React, { useRef } from 'react';
import { useData } from '../../utils/DataContext';
import { ACTION_TYPES } from '../../utils/appReducer';
import './Timeline.css';

const Timeline = () => {
  const { 
    metadata, 
    selectedYear, 
    studyCountsByYear,
    filteredStudyCountsByYear,
    activeFilters,
    searchQuery,
    dispatch 
  } = useData();
  
  const timelineRef = useRef(null);

  // Position Percentage
  const calculatePosition = (year) => {
    if (!metadata || !metadata.yearRange) return 0;
    
    const { min, max } = metadata.yearRange;
    return ((year - min) / (max - min)) * 100;
  };
  
  // Timeline click to select year
  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !metadata || !metadata.yearRange) return;

    const timeline = timelineRef.current;
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    const { min, max } = metadata.yearRange;
    const yearSpan = max - min;
    const newYear = Math.round(min + (percentage * yearSpan));
    
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_YEAR,
      payload: newYear
    });
  };
  
  // If no data
  if (!metadata || !metadata.yearRange) return null;
  
  const { min: minYear, max: maxYear } = metadata.yearRange;
  
  const positionPercentage = calculatePosition(selectedYear);
  
  return (
    <div className="timeline-section">
      <div className="current-year">
        <span>Selected Year: {selectedYear}</span>
        <span className="year-window">
          Showing studies from {selectedYear - 5} to {selectedYear + 5}
        </span>
      </div>
      
      <div className="timeline-container">
        <div
          className="timeline-bar" 
          ref={timelineRef}
          onClick={handleTimelineClick}
        >
          {/* Year ticks */}
          {Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)
            .filter(year => year % 5 === 0) // Show every 5 years
            .map(year => (
              <div 
                key={`tick-${year}`}
                className="year-tick"
                style={{ 
                  left: `${calculatePosition(year)}%`,
                }}
              >
                <span className="tick-label">{year}</span>
              </div>
            ))}
          
          {/* ±5 year window highlight */}
          <div
            className="year-window-highlight"
            style={{
              left: `${calculatePosition(selectedYear - 5)}%`,
              width: `${calculatePosition(selectedYear + 5) - calculatePosition(selectedYear - 5)}%`,
            }}
          ></div>
          
          {/* Study count bars */}
          {Object.entries(studyCountsByYear).map(([year, count]) => {
            const position = calculatePosition(parseInt(year));
            const maxBarHeight = 50; 
            const height = Math.min(maxBarHeight, 5 + (count * 5)); // Scale
            
            return (
              <div
                key={`bar-${year}`}
                className={`year-bar ${parseInt(year) === selectedYear ? 'selected' : ''}`}
                style={{
                  left: `${position}%`,
                  height: `${height}px`,
                }}
                title={`${year}: ${count} ${count === 1 ? 'study' : 'studies'}`}
              ></div>
            );
          })}
          
          {/* Filtered study bars - Only show when filters are active */}
          {(Object.keys(activeFilters).length > 0 || searchQuery.trim() !== '') && (
            Object.entries(filteredStudyCountsByYear).map(([year, filteredCount]) => {
              if (filteredCount <= 0) return null;
              
              const position = calculatePosition(parseInt(year));
              const maxBarHeight = 50;
              const height = Math.min(maxBarHeight, 5 + (filteredCount * 5)); 
              
              return (
                <div
                  key={`filtered-bar-${year}`}
                  className={`year-bar-filtered ${parseInt(year) === selectedYear ? 'selected' : ''}`}
                  style={{
                    left: `${position}%`,
                    height: `${height}px`,
                  }}
                  title={`${year}: ${filteredCount} filtered ${filteredCount === 1 ? 'study' : 'studies'}`}
                ></div>
              );
            })
          )}
          
          {/* Current selection indicator */}
          <div 
            className="year-selector"
            style={{ left: `${positionPercentage}%` }}
          >
            <span className="selector-handle"></span>
            <span className="selector-label">{selectedYear}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;