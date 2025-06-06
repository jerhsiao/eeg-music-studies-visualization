import React, { useRef, useState } from 'react';
import { useData } from '../../utils/DataContext';
import { ACTION_TYPES } from '../../utils/appReducer';
import TimelineBar from './TimelineBar';
import DataVisualizer from './DataVisualizer';
import VisualizationControls from './VisualizationControls';
import './Timeline.css';

const Timeline = () => {
  const { 
    metadata, 
    selectedYear, 
    startYear,
    endYear,
    studyCountsByYear,
    filteredStudyCountsByYear,
    dispatch 
  } = useData();
  
  const timelineRef = useRef(null);
  const [visualizerMode, setVisualizerMode] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('Stimulus Type');
  const [timeBreakdown, setTimeBreakdown] = useState(false);

  const timelineStartYear = 1975;
  const timelineEndYear = 2025;

  const calculatePosition = (year) => {
    const margin = 5;
    const usableWidth = 100 - (2 * margin);
    const position = ((year - timelineStartYear) / (timelineEndYear - timelineStartYear)) * usableWidth;
    return margin + position;
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || visualizerMode) return;

    const timeline = timelineRef.current;
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    const yearSpan = timelineEndYear - timelineStartYear;
    const newYear = Math.round(timelineStartYear + (percentage * yearSpan));
    
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_YEAR,
      payload: newYear
    });
  };

  if (!metadata || !metadata.yearRange) return null;

  return (
    <div className="timeline-section">
      <div className="current-year">
        <span>Selected Year: {selectedYear}</span>
        <span className="year-window">
          Viewing {startYear} to {endYear}
        </span>
      </div>
      
      <TimelineBar
        ref={timelineRef}
        visualizerMode={visualizerMode}
        selectedYear={selectedYear}
        startYear={startYear}
        endYear={endYear}
        timelineStartYear={timelineStartYear}
        timelineEndYear={timelineEndYear}
        studyCountsByYear={studyCountsByYear}
        filteredStudyCountsByYear={filteredStudyCountsByYear}
        calculatePosition={calculatePosition}
        onTimelineClick={handleTimelineClick}
        selectedMetric={selectedMetric}
        timeBreakdown={timeBreakdown}
      />
        
      <button 
        className={`data-visualizer-btn ${visualizerMode ? 'active' : ''}`}
        onClick={() => setVisualizerMode(!visualizerMode)}
      >
        {visualizerMode ? 'Hide Visualizer' : 'Data Visualizer'}
      </button>
      
      {visualizerMode && (
        <VisualizationControls
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
          timeBreakdown={timeBreakdown}
          setTimeBreakdown={setTimeBreakdown}
        />
      )}
    </div>
  );
};

export default Timeline;