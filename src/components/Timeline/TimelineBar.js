import React, { forwardRef, useMemo } from 'react';
import { useData } from '../../utils/DataContext';
import DataVisualizer from './DataVisualizer';

const TimelineBar = forwardRef(({
  visualizerMode,
  selectedYear,
  startYear,
  endYear,
  timelineStartYear,
  timelineEndYear,
  studyCountsByYear,
  filteredStudyCountsByYear,
  calculatePosition,
  onTimelineClick,
  selectedMetric,
  timeBreakdown
}, ref) => {
  const { activeFilters, searchQuery } = useData();

  const timelineHeight = visualizerMode ? 300 : 100;
  
  const maxCount = useMemo(() => {
    if (!visualizerMode) {
      let max = 1;
      for (let year = timelineStartYear; year <= timelineEndYear; year++) {
        max = Math.max(max, studyCountsByYear[year] || 0);
      }
      return max;
    }
    return 1; 
  }, [visualizerMode, studyCountsByYear, timelineStartYear, timelineEndYear]);

  const positionPercentage = calculatePosition(selectedYear);

  return (
    <div className={`timeline-container ${visualizerMode ? 'expanded' : ''}`} style={{ height: timelineHeight + 20 }}>
      <div
        className={`timeline-bar ${visualizerMode ? 'expanded' : ''}`}
        ref={ref}
        onClick={!visualizerMode ? onTimelineClick : undefined}
        style={{ 
          height: timelineHeight,
          cursor: visualizerMode ? 'default' : 'pointer'
        }}
      >
        {visualizerMode ? (
          <DataVisualizer
            selectedMetric={selectedMetric}
            timeBreakdown={timeBreakdown}
            timelineHeight={timelineHeight}
            startYear={startYear}
            endYear={endYear}
            calculatePosition={calculatePosition}
          />
        ) : (
          <>
            {Array.from({ length: Math.floor((timelineEndYear - timelineStartYear) / 5) + 1 }, (_, i) => timelineStartYear + (i * 5))
              .filter(year => year <= timelineEndYear)
              .map(year => (
                <div 
                  key={`tick-${year}`}
                  className="year-tick"
                  style={{ 
                    left: `${calculatePosition(year)}%`,
                  }}
                >
                  <div className="tick-mark"></div>
                  <span className="tick-label">{year}</span>
                </div>
              ))}
            
            {(timelineEndYear - timelineStartYear) <= 20 && Array.from({ length: timelineEndYear - timelineStartYear + 1 }, (_, i) => timelineStartYear + i)
              .filter(year => year % 5 !== 0)
              .map(year => (
                <div 
                  key={`minor-tick-${year}`}
                  className="minor-year-tick"
                  style={{ 
                    left: `${calculatePosition(year)}%`,
                  }}
                >
                  <div className="minor-tick-mark"></div>
                  <span className="minor-tick-label">{year}</span>
                </div>
              ))}
            
            <div
              className="year-window-highlight"
              style={{
                left: `${calculatePosition(startYear - 0.5)}%`,
                width: `${calculatePosition(endYear + 0.5) - calculatePosition(startYear - 0.5)}%`,
              }}
            ></div>
            
            {/* Study count bars */}
            {Object.entries(studyCountsByYear)
              .filter(([year]) => parseInt(year) >= timelineStartYear && parseInt(year) <= timelineEndYear)
              .map(([year, count]) => {
                const position = calculatePosition(parseInt(year));
                const chartHeight = timelineHeight - 20;
                const rawHeight = (count / maxCount) * chartHeight;
                const height = rawHeight < 4 ? 4 : rawHeight;
                
                return (
                  <div
                    key={`bar-${year}`}
                    className={`year-bar ${parseInt(year) === selectedYear ? 'selected' : ''}`}
                    style={{
                      left: `${position}%`,
                      height: `${height}px`,
                      width: '16px',
                      transform: 'translateX(-50%)'
                    }}
                    title={`${year}: ${count} ${count === 1 ? 'study' : 'studies'}`}
                  ></div>
                );
              })}
            
            {(Object.keys(activeFilters).length > 0 || searchQuery.trim() !== '') && (
              Object.entries(filteredStudyCountsByYear)
                .filter(([year]) => parseInt(year) >= timelineStartYear && parseInt(year) <= timelineEndYear)
                .map(([year, filteredCount]) => {
                  if (filteredCount <= 0) return null;
                  
                  const position = calculatePosition(parseInt(year));
                  const chartHeight = timelineHeight - 20;
                  const rawHeight = (filteredCount / maxCount) * chartHeight;
                  const height = rawHeight < 4 ? 4 : rawHeight;
                  
                  return (
                    <div
                      key={`filtered-bar-${year}`}
                      className={`year-bar-filtered ${parseInt(year) === selectedYear ? 'selected' : ''}`}
                      style={{
                        left: `${position}%`,
                        height: `${height}px`,
                        width: '16px',
                        transform: 'translateX(-50%)'
                      }}
                      title={`${year}: ${filteredCount} filtered ${filteredCount === 1 ? 'study' : 'studies'}`}
                    ></div>
                  );
                })
            )}

            <div 
              className="year-selector"
              style={{ 
                left: `${positionPercentage}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <span className="selector-handle"></span>
              <span className="selector-label">{selectedYear}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

TimelineBar.displayName = 'TimelineBar';

export default TimelineBar;