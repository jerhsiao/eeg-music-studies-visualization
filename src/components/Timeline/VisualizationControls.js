import React, { useMemo } from 'react';
import { useData } from '../../utils/DataContext';

const visualizationMetrics = [
    { 
      key: 'Stimulus Type', 
      label: 'Stimulus Type',
      order: ['Complete Musical Piece', 'Musical Excerpt', 'Chords/Melody', 'Synthesized Music/Tone', 'Computer-Generated Music', 'Synthetic Rhythms', 'Music Videos', 'Percussion', 'Humming', 'Spoken Text']
    }, 
    { 
      key: 'Musical Training', 
      label: 'Musical Training',
      order: ['Extensive Training', 'Moderate Training', 'Minimal Training', 'Mixed Groups', 'No Formal Training', 'Not Reported', 'Not Applicable']
    },
    { 
      key: 'Participant Range', 
      label: 'Participant Count',
      order: ['1-10', '11-25', '26-50', '51-100', '100+']
    },
    { 
      key: 'Channel Count Range', 
      label: 'Channel Count',
      order: ['1-32', '33-64', '65-128', '129-256', '256+']
    },
    { 
      key: 'Paradigm Type', 
      label: 'Paradigm Type',
      order: ['Controlled', 'Naturalistic']
    },
    { 
      key: 'Top Features', 
      label: 'Analyzed Features',
      order: []
    }
  ];

const DataVisualizer = ({
  selectedMetric,
  timeBreakdown,
  timelineHeight,
  startYear,
  endYear,
  calculatePosition
}) => {
  const { data, searchQuery, activeFilters } = useData();

  const getParticipantRange = (participantValue) => {
    if (participantValue <= 0) return null;
    if (participantValue <= 10) return '1-10';
    if (participantValue <= 25) return '11-25';
    if (participantValue <= 50) return '26-50';
    if (participantValue <= 100) return '51-100';
    return '100+';
  };

  const getChannelCountRange = (channelStr) => {
    if (!channelStr) return null;
    const match = channelStr.match(/^(\d+)/);
    if (!match) return null;
    
    const count = parseInt(match[1], 10);
    if (count <= 32) return '1-32';
    if (count <= 64) return '33-64';
    if (count <= 128) return '65-128';
    if (count <= 256) return '129-256';
    return '256+';
  };

  const currentMetricData = useMemo(() => {
    const metric = visualizationMetrics.find(m => m.key === selectedMetric);
    if (!metric) return { data: {}, maxCount: 0, categories: [] };

    const counts = {};
    let categories = [];

    let filteredStudies = [...data.studies];
    
    filteredStudies = filteredStudies.filter(study => 
      study.year >= startYear && study.year <= endYear
    );

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredStudies = filteredStudies.filter(study => {
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

    Object.entries(activeFilters).forEach(([category, selectedValues]) => {
      if (selectedValues.length > 0 && category !== metric.key && category !== 'normalizedFeatures') {
        if (category === 'Musical Training') {
          filteredStudies = filteredStudies.filter(study => {
            if (!study[category]) return false;
            return selectedValues.some(selectedValue => 
              study[category].includes(selectedValue)
            );
          });
        }
        else if (category === 'Channel Count') {
          filteredStudies = filteredStudies.filter(study => {
            if (!study['Channel Count']) return false;
            const match = study['Channel Count'].match(/^(\d+)/);
            if (match) {
              const formattedCount = match[1] + ' channels';
              return selectedValues.includes(formattedCount);
            } else {
              return selectedValues.includes(study['Channel Count']);
            }
          });
        }
        else if (category === 'Participant Range') {
          filteredStudies = filteredStudies.filter(study => {
            const participantValue = study.participantsValue;
            if (participantValue <= 0) return false;
            const range = getParticipantRange(participantValue);
            return range && selectedValues.includes(range);
          });
        }
        else {
          filteredStudies = filteredStudies.filter(study => {
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

    if (metric.key === 'Musical Training') {
      categories = metric.order;
      categories.forEach(cat => counts[cat] = 0);
      
      filteredStudies.forEach(study => {
        const training = study['Musical Training'];
        if (training) {
          categories.forEach(cat => {
            if (training.includes(cat)) {
              counts[cat]++;
            }
          });
        }
      });
    }
    else if (metric.key === 'Participant Range') {
      categories = metric.order;
      categories.forEach(cat => counts[cat] = 0);
      
      filteredStudies.forEach(study => {
        const range = getParticipantRange(study.participantsValue);
        if (range && counts[range] !== undefined) {
          counts[range]++;
        }
      });
    }
    else if (metric.key === 'Channel Count Range') {
      categories = metric.order;
      categories.forEach(cat => counts[cat] = 0);
      
      filteredStudies.forEach(study => {
        const range = getChannelCountRange(study['Channel Count']);
        if (range && counts[range] !== undefined) {
          counts[range]++;
        }
      });
    }
    else if (metric.key === 'Top Features') {
      const featureCounts = {};
      filteredStudies.forEach(study => {
        if (study.normalizedFeatures && Array.isArray(study.normalizedFeatures)) {
          study.normalizedFeatures.forEach(feature => {
            featureCounts[feature] = (featureCounts[feature] || 0) + 1;
          });
        }
      });
      
      categories = Object.entries(featureCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([feature]) => feature);
      
      categories.forEach(cat => counts[cat] = featureCounts[cat] || 0);
    }
    else {
      const fieldKey = metric.key === 'Paradigm Type' ? 'Paradigm Type' : 'Stimulus Type';
      
      filteredStudies.forEach(study => {
        const value = study[fieldKey];
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => {
              counts[v] = (counts[v] || 0) + 1;
            });
          } else {
            counts[value] = (counts[value] || 0) + 1;
          }
        }
      });

      if (metric.order.length > 0) {
        categories = metric.order.filter(cat => counts[cat] > 0);
      } else {
        categories = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      }
    }

    const maxCount = Math.max(...Object.values(counts), 1);

    return { data: counts, maxCount, categories };
  }, [selectedMetric, data.studies, startYear, endYear, searchQuery, activeFilters]);

  const timeSeriesData = useMemo(() => {
    if (!timeBreakdown) return null;

    const metric = visualizationMetrics.find(m => m.key === selectedMetric);
    if (!metric) return null;

    const yearData = {};

    for (let year = startYear; year <= endYear; year++) {
      yearData[year] = {};
      currentMetricData.categories.forEach(cat => {
        yearData[year][cat] = 0;
      });
    }

    let filteredStudies = [...data.studies];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredStudies = filteredStudies.filter(study => {
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

    Object.entries(activeFilters).forEach(([category, selectedValues]) => {
      if (selectedValues.length > 0 && category !== metric.key && category !== 'normalizedFeatures') {
        if (category === 'Musical Training') {
          filteredStudies = filteredStudies.filter(study => {
            if (!study[category]) return false;
            return selectedValues.some(selectedValue => 
              study[category].includes(selectedValue)
            );
          });
        } else if (category === 'Channel Count') {
          filteredStudies = filteredStudies.filter(study => {
            if (!study['Channel Count']) return false;
            const match = study['Channel Count'].match(/^(\d+)/);
            if (match) {
              const formattedCount = match[1] + ' channels';
              return selectedValues.includes(formattedCount);
            } else {
              return selectedValues.includes(study['Channel Count']);
            }
          });
        } else if (category === 'Participant Range') {
          filteredStudies = filteredStudies.filter(study => {
            const participantValue = study.participantsValue;
            if (participantValue <= 0) return false;
            const range = getParticipantRange(participantValue);
            return range && selectedValues.includes(range);
          });
        } else {
          filteredStudies = filteredStudies.filter(study => {
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

    filteredStudies.forEach(study => {
      const year = study.year;
      if (year >= startYear && year <= endYear && yearData[year]) {
        
        if (metric.key === 'Musical Training') {
          const training = study['Musical Training'];
          if (training) {
            currentMetricData.categories.forEach(cat => {
              if (training.includes(cat)) {
                yearData[year][cat]++;
              }
            });
          }
        }
        else if (metric.key === 'Participant Range') {
          const range = getParticipantRange(study.participantsValue);
          if (range && yearData[year][range] !== undefined) {
            yearData[year][range]++;
          }
        }
        else if (metric.key === 'Channel Count Range') {
          const range = getChannelCountRange(study['Channel Count']);
          if (range && yearData[year][range] !== undefined) {
            yearData[year][range]++;
          }
        }
        else if (metric.key === 'Top Features') {
          if (study.normalizedFeatures && Array.isArray(study.normalizedFeatures)) {
            study.normalizedFeatures.forEach(feature => {
              if (yearData[year][feature] !== undefined) {
                yearData[year][feature]++;
              }
            });
          }
        }
        else {
          const fieldKey = metric.key === 'Paradigm Type' ? 'Paradigm Type' : 'Stimulus Type';
          const value = study[fieldKey];
          if (value) {
            if (Array.isArray(value)) {
              value.forEach(v => {
                if (yearData[year][v] !== undefined) {
                  yearData[year][v]++;
                }
              });
            } else {
              if (yearData[year][value] !== undefined) {
                yearData[year][value]++;
              }
            }
          }
        }
      }
    });

    return yearData;
  }, [timeBreakdown, selectedMetric, currentMetricData.categories, data.studies, startYear, endYear, searchQuery, activeFilters]);

  const generateGridLines = () => {
    const lines = [];
    const chartHeight = timelineHeight - 50;
    const gridCount = 5;
    
    for (let i = 1; i < gridCount; i++) {
      const y = (i / gridCount) * chartHeight;
      const value = Math.round(((gridCount - i) / gridCount) * currentMetricData.maxCount);
      lines.push(
        <g key={`grid-${i}`}>
          <line 
            x1="0" 
            y1={y} 
            x2="100%" 
            y2={y} 
            stroke="rgba(107, 114, 128, 0.3)" 
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <text 
            x="5" 
            y={y - 5} 
            fontSize="10" 
            fill="#6b7280"
            fontFamily="system-ui"
          >
            {value}
          </text>
        </g>
      );
    }
    
    return lines;
  };

  return (
    <div className="data-visualizer-content">
      <svg 
        className="timeline-grid" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        {generateGridLines()}
      </svg>

      <div className="chart-baseline"></div>
      
      {!timeBreakdown ? (
        <div style={{ 
          position: 'absolute', 
          bottom: '50px', 
          left: '50px', 
          right: '80px', 
          height: timelineHeight - 50
        }}>
          {currentMetricData.categories.map((category, index) => {
            const count = currentMetricData.data[category] || 0;
            const chartHeight = timelineHeight - 50;
            const rawHeight = (count / currentMetricData.maxCount) * chartHeight;
            const barHeight = rawHeight < 4 ? 4 : rawHeight;
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
            const color = colors[index % colors.length];
            
            const totalCategories = currentMetricData.categories.length;
            const gapSize = 6; 
            const totalGapWidth = (totalCategories - 1) * gapSize;
            const barWidth = `calc((100% - ${totalGapWidth}px) / ${totalCategories})`;
            const leftPosition = `calc(${(100 / totalCategories) * index}% + ${index * gapSize}px)`;
            
            return (
              <div key={category}>
                <div style={{
                  position: 'absolute',
                  left: leftPosition,
                  width: barWidth,
                  bottom: `${barHeight + 8}px`,
                  color: '#4b5563',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {count}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: leftPosition,
                    bottom: '0px',
                    width: barWidth,
                    height: `${barHeight}px`,
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                  }}
                  title={`${category}: ${count} studies`}
                />

                <div style={{ 
                  position: 'absolute',
                  left: leftPosition,
                  bottom: '-35px',
                  width: barWidth,
                  fontSize: '11px', 
                  textAlign: 'center',
                  color: '#374151',
                  fontWeight: '500',
                  lineHeight: '1.2',
                  wordWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                  {category}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {Array.from({ length: Math.floor((endYear - startYear) / 5) + 1 }, (_, i) => startYear + (i * 5))
            .filter(year => year <= endYear)
            .map(year => (
              <div 
                key={`time-tick-${year}`}
                className="year-tick"
                style={{ 
                  left: `${calculatePosition(year)}%`,
                }}
              >
                <div className="tick-mark"></div>
                <span className="tick-label">{year}</span>
              </div>
            ))}
          
          <div style={{ 
            position: 'absolute', 
            bottom: '50px', 
            left: '20px', 
            right: '20px', 
            height: timelineHeight - 50
          }}>
            {timeSeriesData && Object.entries(timeSeriesData)
              .filter(([year]) => parseInt(year) >= startYear && parseInt(year) <= endYear)
              .map(([year, yearData]) => {
                const position = calculatePosition(parseInt(year));
                const totalCount = Object.values(yearData).reduce((sum, count) => sum + count, 0);
                
                if (totalCount === 0) return null;
                
                const chartHeight = timelineHeight - 50;
                const rawHeight = (totalCount / currentMetricData.maxCount) * chartHeight;
                const barHeight = rawHeight < 4 ? 4 : rawHeight;
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
                
                return (
                  <div key={year}>
                    <div style={{
                      position: 'absolute',
                      left: `${position}%`,
                      bottom: `${barHeight + 8}px`,
                      transform: 'translateX(-50%)',
                      color: '#4b5563',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {totalCount}
                    </div>
                    
                    <div
                      style={{
                        position: 'absolute',
                        left: `${position}%`,
                        bottom: '0px',
                        transform: 'translateX(-50%)',
                        width: '20px',
                        height: `${barHeight}px`
                      }}
                      title={`${year}: ${totalCount} total studies`}
                    >
                      {currentMetricData.categories.map((category, index) => {
                        const count = yearData[category] || 0;
                        if (count === 0) return null;
                        
                        const segmentHeight = (count / totalCount) * barHeight;
                        const color = colors[index % colors.length];
                        const bottomPosition = currentMetricData.categories
                          .slice(0, index)
                          .reduce((sum, cat) => sum + ((yearData[cat] || 0) / totalCount) * barHeight, 0);
                        
                        return (
                          <div
                            key={category}
                            style={{
                              position: 'absolute',
                              bottom: `${bottomPosition}px`,
                              width: '100%',
                              height: `${segmentHeight}px`,
                              backgroundColor: color,
                              opacity: 0.85,
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              cursor: 'pointer'
                            }}
                            title={`${category}: ${count} studies in ${year}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};

export default DataVisualizer;