import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';
import './EEGMusicStudiesApp.css';

const EEGMusicStudiesApp = () => {
  // Define standard Musical Training categories
  const standardTrainingCategories = [
    'Extensive Training',   // (>10 years)
    'Moderate Training',    // (5-10 years)
    'Minimal Training',     // (<5 years)
    'Mixed Groups',
    'No Formal Training',
    'Not Reported',
    'Not Applicable'
  ];
  
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2010);
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2020);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'list'
  const [expandedStudies, setExpandedStudies] = useState(new Set());
  const [yearRange, setYearRange] = useState({ min: 1970, max: 2025 });
  const [csvColumns, setCsvColumns] = useState([]);
  const [sortOption, setSortOption] = useState('year-asc'); // Default sort option
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingLink, setPendingLink] = useState(null);
  
  // New states for improved filters
  const [eegSystemSearch, setEegSystemSearch] = useState('');
  const [showEEGDropdown, setShowEEGDropdown] = useState(false);
  const [channelCountSearch, setChannelCountSearch] = useState('');
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  
  // Dropdown state management
  const [openDropdowns, setOpenDropdowns] = useState({
    'Paradigm Type': false,
    'Stimulus Type': false,
    'Musical Training': false,
    'Sort By': false
  });
  
  const timelineRef = useRef(null);
  const eegDropdownRef = useRef(null);
  const channelDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  
  // Filter categories to display
  const filterCategories = [
    { key: 'Paradigm Type', label: 'Paradigm Type' },
    { key: 'Stimulus Type', label: 'Stimulus Type' },
    { key: 'Musical Training', label: 'Musical Training' }
  ];
  
  // Sort options
  const sortOptions = [
    { value: 'year-asc', label: 'Year (Low to High)' },
    { value: 'year-desc', label: 'Year (High to Low)' },
    { value: 'participants-asc', label: 'Participants (Low to High)' },
    { value: 'participants-desc', label: 'Participants (High to Low)' },
    { value: 'length-asc', label: 'Passage Length (Short to Long)' },
    { value: 'length-desc', label: 'Passage Length (Long to Short)' }
  ];
  
  // Toggle filter dropdowns
  const toggleDropdown = (category) => {
    setOpenDropdowns(prev => {
      const newState = { ...prev }
      
      // Toggle the clicked dropdown
      newState[category] = !prev[category];
      return newState;
    });
  };
  
  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        return; // Exit the function if text is being selected
      }
      let clickedInside = false;
      
      // Check if clicked inside EEG system dropdown
      if (eegDropdownRef.current && eegDropdownRef.current.contains(event.target)) {
        clickedInside = true;
      }
      
      // Check if clicked inside channel count dropdown
      if (channelDropdownRef.current && channelDropdownRef.current.contains(event.target)) {
        clickedInside = true;
      }
      
      // Check if clicked inside sort dropdown
      if (sortDropdownRef.current && sortDropdownRef.current.contains(event.target)) {
        clickedInside = true;
      }
      
      // Check if clicked inside any filter dropdown headers
      const dropdownHeaders = document.querySelectorAll('.filter-dropdown-header');
      dropdownHeaders.forEach(header => {
        if (header.contains(event.target)) {
          clickedInside = true;
        }
      });
      
      // Check if clicked inside any dropdown content (which should NOT close the dropdown)
      const dropdownContents = document.querySelectorAll('.filter-options-dropdown');
      dropdownContents.forEach(content => {
        if (content.contains(event.target)) {
          clickedInside = true;
        }
      });
      
      if (eegDropdownRef.current && eegDropdownRef.current.contains(event.target)) {
        clickedInside = true;
      }
      
      if (channelDropdownRef.current && channelDropdownRef.current.contains(event.target)) {
        clickedInside = true;
      }
      
      if (sortDropdownRef.current && sortDropdownRef.current.contains(event.target)) {
        clickedInside = true;
      }
      // If clicked outside, close all dropdowns
      if (!clickedInside) {
        setOpenDropdowns(prev => {
          const newState = {};
          Object.keys(prev).forEach(key => {
            newState[key] = false;
          });
          return newState;
        });
        setShowEEGDropdown(false);
        setShowChannelDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Function to parse passage length to seconds
  const parsePassageLength = (lengthStr) => {
    if (!lengthStr || typeof lengthStr !== 'string') return -1; // Invalid or missing value
    
    let seconds = 0;
    
    // Handle ranges by taking average
    if (lengthStr.includes('–') || lengthStr.includes('-')) {
      const parts = lengthStr.replace('–', '-').split('-');
      const values = parts.map(p => parsePassageLength(p.trim()));
      // Filter out -1 values before calculating average
      const validValues = values.filter(v => v !== -1);
      return validValues.length ? validValues.reduce((a, b) => a + b, 0) / validValues.length : -1;
    }
    
    // Handle approximations
    if (lengthStr.includes('~')) {
      lengthStr = lengthStr.replace('~', '').trim();
    }
    
    // Handle "per" phrases by focusing on the main time
    if (lengthStr.includes(' per ')) {
      lengthStr = lengthStr.split(' per ')[0].trim();
    }
    
    // Handle time formats with colons (e.g., "4:31")
    if (lengthStr.includes(':')) {
      const timeParts = lengthStr.match(/(\d+):(\d+)/);
      if (timeParts && timeParts.length >= 3) {
        return parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]);
      }
    }
    
    // Handle seconds
    if (lengthStr.includes('seconds') || lengthStr.includes('second') || lengthStr.includes(' s ') || lengthStr.includes(' s)') || lengthStr.endsWith(' s')) {
      const match = lengthStr.match(/(\d+\.?\d*)/);
      if (match && match.length >= 2) {
        seconds = parseFloat(match[1]);
      }
    } 
    // Handle minutes
    else if (lengthStr.includes('minutes') || lengthStr.includes('minute') || lengthStr.includes(' min') || lengthStr.endsWith('min')) {
      const match = lengthStr.match(/(\d+\.?\d*)/);
      if (match && match.length >= 2) {
        seconds = parseFloat(match[1]) * 60;
      }
    } 
    // If no unit specified but has a number, assume seconds
    else {
      const match = lengthStr.match(/(\d+\.?\d*)/);
      if (match && match.length >= 2) {
        seconds = parseFloat(match[1]);
      }
    }
    
    return !isNaN(seconds) && seconds > 0 ? seconds : -1;
  };
  
  const confirmLinkNavigation = () => {
    if (pendingLink) {
      try {
        // Use window.open with target="_blank" and additional options for security
        window.open(
          pendingLink, 
          '_blank', 
          'noopener,noreferrer'
        );
      } catch (error) {
        console.error('Failed to open URL:', error);
        // Optionally add error handling UI here
      }
      
      // Reset state
      setShowConfirmation(false);
      setPendingLink(null);
    }
  };
  
  const cancelLinkNavigation = () => {
    setShowConfirmation(false);
    setPendingLink(null);
  };
  
  // Helper function to extract channel count number
  const extractChannelCount = (channelCountString) => {
    if (!channelCountString) return null;
    
    // Extract the number at the beginning of the string
    const match = channelCountString.match(/^(\d+)/);
    return match ? match[1] + ' channels' : channelCountString;
  };
  
  // Parse and process data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch CSV file
        const response = await fetch('/eeg-music-studies-database.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        
        // Parse CSV
        Papa.parse(text, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: (results) => {
            // Store original column headers for CSV export
            setCsvColumns(results.meta.fields);
            
            // Process and clean data
            const processedData = results.data
              .filter(entry => entry && typeof entry === 'object')
              .map((entry, index) => {
                // Create cleaned entry
                const cleanedEntry = {};
                
                // Apply column-by-column parsing rules
                Object.entries(entry).forEach(([key, value]) => {
                  // Trim every cell
                  const trimmed = typeof value === 'string' ? value.trim() : value;
                  
                  // Handle empty/NA values
                  const lowerVal = typeof trimmed === 'string' ? trimmed.toLowerCase() : '';
                  if (trimmed === '' || lowerVal === 'na' || lowerVal === 'not specified') {
                    return; // Skip this field
                  }
                  
                  // Apply specific parsing rules based on column
                  switch(key) {
                    // Parse numeric fields
                    case 'Year':
                      const year = parseInt(trimmed, 10);
                      if (!isNaN(year)) {
                        cleanedEntry[key] = year;
                      }
                      break;
                      
                    // Handle comma-delimited lists
                    case 'Paradigm Type':
                    case 'Musical Features Analyzed':
                    case 'Preprocessing':
                    case 'EEG Analysis Techniques':
                    case 'Statistical Tests':
                    case 'Event Markers':
                      cleanedEntry[key] = trimmed
                        .split(',')
                        .map(item => item.trim())
                        .filter(item => item !== '');
                      break;
                      
                    // URL validation
                    case 'DOI/URL':
                    case 'Dataset':
                      if (trimmed.startsWith('http') || trimmed.startsWith('10.')) {
                        cleanedEntry[key] = trimmed;
                      }
                      break;
                      
                    // Handle Channel Count field
                    case 'Channel Count':
                      // Store the full text for display
                      cleanedEntry[key] = trimmed;
                      
                      // Extract standardized channel count (e.g., "19 channels")
                      cleanedEntry['standardizedChannelCount'] = extractChannelCount(trimmed);
                      
                      // Also extract the numeric value for filtering
                      const match = trimmed.match(/^(\d+)/);
                      if (match) {
                        cleanedEntry['channelCountValue'] = parseInt(match[1], 10);
                      }
                      break;
                      
                    // Parse passage length for sorting
                    case 'Passage Length':
                      cleanedEntry[key] = trimmed;
                      cleanedEntry['passageLengthSeconds'] = parsePassageLength(trimmed);
                      break;
                      
                    // Parse number of participants for sorting
                    case 'Number of Participants':
                      cleanedEntry[key] = trimmed;
                      // Extract numeric value if possible
                      let participantsValue = -1;
                      const pMatch = trimmed.match(/(\d+)/);
                      if (pMatch && pMatch.length > 1) {
                        participantsValue = parseInt(pMatch[1], 10);
                        if (isNaN(participantsValue)) participantsValue = -1;
                      } 
                      cleanedEntry['participantsValue'] = participantsValue;
                      break;
                      
                    // Default: just use the trimmed value
                    default:
                      cleanedEntry[key] = trimmed;
                  }
                });
                
                // Add a unique ID
                return {
                  ...cleanedEntry,
                  id: `study-${index}`,
                  // Make sure we have a year value for filtering
                  year: cleanedEntry.Year || 0
                };
              })
              .filter(entry => entry.year > 0); // Filter out entries without a valid year
            
            // Build filter options for each category
            const options = {};
            
            filterCategories.forEach(category => {
              const uniqueValues = new Set();
              
              processedData.forEach(study => {
                if (category.key === 'Musical Training') {
                  if (study[category.key]) {
                    // Check if the training description contains any of our standard categories
                    standardTrainingCategories.forEach(standardCategory => {
                      if (study[category.key].includes(standardCategory)) {
                        uniqueValues.add(standardCategory);
                      }
                    });
                  }
                } else {
                  // For other categories, handle as before
                  if (Array.isArray(study[category.key])) {
                    study[category.key].forEach(value => uniqueValues.add(value));
                  } else if (study[category.key]) {
                    uniqueValues.add(study[category.key].toString());
                  }
                }
              });
              
              options[category.key] = Array.from(uniqueValues).sort();
            });
            
            // Add EEG System options
            const eegSystems = new Set();
            processedData.forEach(study => {
              if (study['EEG System Used']) {
                eegSystems.add(study['EEG System Used']);
              }
            });
            options['EEG System Used'] = Array.from(eegSystems).sort();
            
            // Add Channel Count options
            const channelCounts = new Set();
            processedData.forEach(study => {
              if (study['standardizedChannelCount']) {
                channelCounts.add(study['standardizedChannelCount']);
              }
            });
            options['Channel Count'] = Array.from(channelCounts).sort((a, b) => {
              // Extract numeric values for sorting
              const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
              const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
              return numA - numB;
            });
            
            setFilterOptions(options);
            
            // Calculate year range and set default values
            if (processedData.length > 0) {
              const years = processedData.map(s => s.year);
              const minYear = Math.min(...years);
              const maxYear = Math.max(...years);
              
              setYearRange({ min: minYear, max: maxYear });
              setSelectedYear(Math.round((minYear + maxYear) / 2));
              setStartYear(minYear);
              setEndYear(maxYear);
            }
            
            setData(processedData);
            setLoading(false);
          },
          error: (error) => {
            console.error("CSV parsing error:", error);
            setError(`Error parsing CSV: ${error.message}`);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("File loading error:", err);
        setError(`Error loading data: ${err.message}`);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Filter and sort studies based on current criteria
  const filterStudies = () => {
    if (!data.length) return [];
    
    let filtered = [...data];
    
    // Apply year filters based on view mode
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
          if (key === 'id' || key === 'channelCountValue' || key === 'passageLengthSeconds' || key === 'participantsValue' || key === 'standardizedChannelCount') return false;
          
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
            
            // Check if any of the selected values are parts of the study's training value
            return selectedValues.some(selectedValue => 
              study[category].includes(selectedValue)
            );
          });
        }
        // Special case for Channel Count
        else if (category === 'Channel Count') {
          filtered = filtered.filter(study => {
            if (!study['standardizedChannelCount']) return false;
            
            // Check if the standardized channel count matches any selected value
            return selectedValues.includes(study['standardizedChannelCount']);
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
          
          // Put -1 values (unknown) at the end
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
          
          // Put -1 values (unknown) at the end
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
          
          // Put -1 values (unknown) at the end
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
  };
  
  // Get study count by year for timeline
  const getStudyCountsByYear = () => {
    const counts = {};
    data.forEach(study => {
      if (!counts[study.year]) {
        counts[study.year] = 0;
      }
      counts[study.year]++;
    });
    return counts;
  };
  
  // Toggle expanded state for a study
  const toggleExpandStudy = (studyId, e) => {
    setExpandedStudies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studyId)) newSet.delete(studyId);
      else newSet.add(studyId);
      return newSet;
    });
  };
  
  // Handle timeline click
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;

    const timeline = timelineRef.current;
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    const yearSpan = yearRange.max - yearRange.min;
    const newYear = Math.round(yearRange.min + (percentage * yearSpan));
    
    setSelectedYear(newYear);
  };
  
  const getFilteredStudyCountsByYear = () => {
    const counts = {};
    
    // Apply all active filters except year filters
    let filtered = [...data];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(study => {
        return Object.entries(study).some(([key, value]) => {
          if (key === 'id' || key === 'channelCountValue' || key === 'passageLengthSeconds' || key === 'participantsValue' || key === 'standardizedChannelCount') return false;
          
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
            
            // Check if any of the selected values are parts of the study's training value
            return selectedValues.some(selectedValue => 
              study[category].includes(selectedValue)
            );
          });
        }
        // Special case for Channel Count
        else if (category === 'Channel Count') {
          filtered = filtered.filter(study => {
            if (!study['standardizedChannelCount']) return false;
            
            // Check if the standardized channel count matches any selected value
            return selectedValues.includes(study['standardizedChannelCount']);
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
  };
  
  // Handle filter changes for checkbox filters
  const handleFilterChange = (category, value, e) => {
    if (e && e.target.tagName.toLowerCase() !== 'input') {
      e.preventDefault();
    }

    setActiveFilters(prev => {
      const currentValues = prev[category] || [];
      
      // Toggle the value
      if (currentValues.includes(value)) {
        const newValues = currentValues.filter(v => v !== value);
        
        // Remove the category if no values are selected
        if (newValues.length === 0) {
          const { [category]: _, ...rest } = prev;
          return rest;
        }
        
        return { ...prev, [category]: newValues };
      } else {
        return { ...prev, [category]: [...currentValues, value] };
      }
    });
  };
  
  // Select an EEG system from dropdown
  const selectEEGSystem = (system) => {
    setActiveFilters(prev => {
      const { ['EEG System Used']: _, ...rest } = prev;
      return { ...rest, ['EEG System Used']: [system] };
    });
    setEegSystemSearch('');
    setShowEEGDropdown(false);
  };
  
  // Select channel count from dropdown
  const selectChannelCount = (count) => {
    setActiveFilters(prev => {
      const { ['Channel Count']: _, ...rest } = prev;
      return { ...rest, ['Channel Count']: [count] };
    });
    setChannelCountSearch('');
    setShowChannelDropdown(false);
  };
  
  // Handle sort option change
  const handleSortChange = (sortValue) => {
    setSortOption(sortValue);
    setOpenDropdowns(prev => ({...prev, 'Sort By': false}));
  };
  
  // Filter EEG systems based on search term
  const filteredEEGSystems = eegSystemSearch
    ? (filterOptions['EEG System Used'] || [])
        .filter(system => system.toLowerCase().includes(eegSystemSearch.toLowerCase()))
    : filterOptions['EEG System Used'] || [];
    
  // Filter channel counts based on search term
  const filteredChannelCounts = channelCountSearch
    ? (filterOptions['Channel Count'] || [])
        .filter(count => count.toLowerCase().includes(channelCountSearch.toLowerCase()))
    : filterOptions['Channel Count'] || [];
  
  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    setEegSystemSearch('');
    setChannelCountSearch('');
  };
  
  // Export filtered data to CSV
  const exportToCSV = () => {
    const filteredStudies = filterStudies();
    
    // Format data back to original structure for export
    const exportData = filteredStudies.map(study => {
      const exportRow = {};
      
      // Prepare each column according to original format
      csvColumns.forEach(column => {
        if (study[column] !== undefined) {
          // Format arrays back to comma-separated strings
          if (Array.isArray(study[column])) {
            exportRow[column] = study[column].join(', ');
          } else {
            exportRow[column] = study[column];
          }
        } else {
          exportRow[column] = ''; // Empty value for missing fields
        }
      });
      
      return exportRow;
    });
    
    // Generate CSV
    const csv = Papa.unparse({
      fields: csvColumns,
      data: exportData
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create filename based on current filters
    let filename = 'eeg-music-studies';
    if (viewMode === 'timeline') {
      filename += `-year-${selectedYear}`;
    } else {
      filename += `-${startYear}-to-${endYear}`;
    }
    if (searchQuery) {
      filename += `-search-${searchQuery.replace(/\s+/g, '-')}`;
    }
    filename += '.csv';
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  };
  
  // Format URL for linking
  const formatURL = (url) => {
    if (!url) return null;
    
    if (url.startsWith('10.')) {
      return `https://doi.org/${url}`;
    }
    
    // Ensure URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  };
  
  // Function to find matching studies outside the current range
  const findMatchingStudiesOutsideRange = () => {
    if (filteredStudies.length > 0) return null; // Already have results in view
    
    // Apply all filters EXCEPT year filters to find matches
    let potentialMatches = [...data];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      potentialMatches = potentialMatches.filter(study => {
        return Object.entries(study).some(([key, value]) => {
          if (key === 'id' || key === 'channelCountValue' || key === 'passageLengthSeconds' || key === 'participantsValue' || key === 'standardizedChannelCount') return false;
          
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
      if (selectedValues.length > 0 && category !== 'year') {
        // Special case for Musical Training
        if (category === 'Musical Training') {
          potentialMatches = potentialMatches.filter(study => {
            if (!study[category]) return false;
            
            // Check if any of the selected values are parts of the study's training value
            return selectedValues.some(selectedValue => 
              study[category].includes(selectedValue)
            );
          });
        }
        // Special case for Channel Count
        else if (category === 'Channel Count') {
          potentialMatches = potentialMatches.filter(study => {
            if (!study['standardizedChannelCount']) return false;
            
            // Check if the standardized channel count matches any selected value
            return selectedValues.includes(study['standardizedChannelCount']);
          });
        }
        // Default case for other filters
        else {
          potentialMatches = potentialMatches.filter(study => {
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
    
    // If no potential matches at all, return null
    if (potentialMatches.length === 0) return null;
    
    // If we have matches outside the current year range, return them
    if (viewMode === 'timeline') {
      // Filter out studies that are in the current timeline window
      const outsideRangeMatches = potentialMatches.filter(study => 
        Math.abs(study.year - selectedYear) > 5
      );
      
      if (outsideRangeMatches.length > 0) {
        // Sort by year for consistent results
        outsideRangeMatches.sort((a, b) => a.year - b.year);
        return outsideRangeMatches;
      }
    } else {
      // List view - check for studies outside the start/end year range
      const outsideRangeMatches = potentialMatches.filter(study => 
        study.year < startYear || study.year > endYear
      );
      
      if (outsideRangeMatches.length > 0) {
        // Sort by year for consistent results
        outsideRangeMatches.sort((a, b) => a.year - b.year);
        return outsideRangeMatches;
      }
    }
    
    return null;
  };
  
  // Function to navigate to the year of the first matching study
  const navigateToMatchingStudy = (outsideMatches) => {
    if (!outsideMatches || outsideMatches.length === 0) return;
    
    // Get the year of the first matching study
    const targetYear = outsideMatches[0].year;
    
    if (viewMode === 'timeline') {
      // In timeline view, update the selected year
      setSelectedYear(targetYear);
    } else {
      // In list view, update the start/end years to include this study
      const buffer = 5; // Add some buffer years for context
      setStartYear(Math.max(yearRange.min, targetYear - buffer));
      setEndYear(Math.min(yearRange.max, targetYear + buffer));
    }
  };
  
  // Study Card Component
  const StudyCard = ({ study }) => {
    const isExpanded = expandedStudies.has(study.id);
    
    // Format lists for display
    const formatList = (items) => {
      if (!items) return null;
      
      const list = Array.isArray(items) ? items : [items];
      return list.join(', ');
    };
    
    return (
      <div className="study-card">
        {/* Primary Fields (Always Visible) */}
        <div className="study-header">
          <h3 className="study-title">
            {study['Study Name']} ({study.year})
          </h3>
          <p className="study-authors">Authors: {study.Authors}</p>
          
          {/* Links to study and dataset */}
          <div className="study-links">
            {study['DOI/URL'] && (
              <a
                href={formatURL(study["DOI/URL"])}
                onClick={e => {
                  e.preventDefault();
                  window.open(formatURL(study["DOI/URL"]), "_blank", "noopener,noreferrer");
                }}
                className="study-link"
              >
                View Study
              </a>
            )}
            
            {study['Dataset'] && (
              <a
                href={formatURL(study["Dataset"])}
                onClick={e => {
                  e.preventDefault();
                  window.open(formatURL(study["Dataset"]), "_blank", "noopener,noreferrer");
                }}
                className="study-link dataset"
              >
                View Dataset
              </a>
            )}
          </div>
        </div>
        
        <div className="study-content">
          {/* Study Description */}
          {study['Study Description'] && (
            <p className="study-description">{study['Study Description']}</p>
          )}
          
          {/* Stimulus Description */}
          {study['Stimulus Description'] && (
            <p className="stimulus-description">{study['Stimulus Description']}</p>
          )}
          
          {/* Findings */}
          {study['Findings Summarized'] && (
            <div className="findings">
              <strong>Findings:</strong> {study['Findings Summarized']}
            </div>
          )}
          
          {/* Expandable Details Button */}
          <button
            type="button"
            className="details-toggle"
            onClick={() => {
              toggleExpandStudy(study.id);
            }}
          >
            {expandedStudies.has(study.id) ? "Show Less" : "Show More"}
          </button>
          
          {/* Expandable Details */}
          {isExpanded && (
            <div className="study-details">
              {/* Publication Reference */}
              {study['Primary Study'] && (
                <div className="detail-item">
                  <span className="detail-label">Publication:</span> {study['Primary Study']}
                </div>
              )}
              
              {/* Paradigm Type */}
              {study['Paradigm Type'] && (
                <div className="detail-item">
                  <span className="detail-label">Paradigm Type:</span> {formatList(study['Paradigm Type'])}
                </div>
              )}
              
              {/* Stimulus Details */}
              {(study['Stimulus Type'] || study['Composer'] || study['Passage Name'] || study['Passage Length']) && (
                <div className="detail-group">
                  <h4>Stimulus Details</h4>
                  
                  {study['Stimulus Type'] && (
                    <div className="detail-item">
                      <span className="detail-label">Stimulus Type:</span> {study['Stimulus Type']}
                    </div>
                  )}
                  
                  {study['Composer'] && (
                    <div className="detail-item">
                      <span className="detail-label">Composer:</span> {study['Composer']}
                    </div>
                  )}
                  
                  {study['Passage Name'] && (
                    <div className="detail-item">
                      <span className="detail-label">Passage Name:</span> {study['Passage Name']}
                    </div>
                  )}
                  
                  {study['Passage Length'] && (
                    <div className="detail-item">
                      <span className="detail-label">Passage Length:</span> {study['Passage Length']}
                    </div>
                  )}
                </div>
              )}
              
              {/* Musical Analysis */}
              {study['Musical Features Analyzed'] && (
                <div className="detail-group">
                  <h4>Musical Analysis</h4>
                  <div className="detail-item">
                    <span className="detail-label">Features Analyzed:</span> 
                    {formatList(study['Musical Features Analyzed'])}
                  </div>
                </div>
              )}
              
              {/* Participant Information */}
              {(study['Task Description'] || study['Number of Participants'] || 
                study['Demographics'] || study['Musical Training']) && (
                <div className="detail-group">
                  <h4>Participant Information</h4>
                  
                  {study['Task Description'] && (
                    <div className="detail-item">
                      <span className="detail-label">Task:</span> {study['Task Description']}
                    </div>
                  )}
                  
                  {study['Number of Participants'] && (
                    <div className="detail-item">
                      <span className="detail-label">N (Participants):</span> {study['Number of Participants']}
                    </div>
                  )}
                  
                  {study['Demographics'] && (
                    <div className="detail-item">
                      <span className="detail-label">Demographics:</span> {study['Demographics']}
                    </div>
                  )}
                  
                  {study['Musical Training'] && (
                    <div className="detail-item">
                      <span className="detail-label">Musical Training:</span> {study['Musical Training']}
                    </div>
                  )}
                </div>
              )}
              
              {/* EEG Methodology */}
              {(study['EEG System Used'] || study['Channel Count'] || study['Sampling Rate'] || 
                study['Recording Environment'] || study['Data Format']) && (
                <div className="detail-group">
                  <h4>EEG Methodology</h4>
                  
                  {study['EEG System Used'] && (
                    <div className="detail-item">
                      <span className="detail-label">EEG System:</span> {study['EEG System Used']}
                    </div>
                  )}
                  
                  {study['Channel Count'] && (
                    <div className="detail-item">
                      <span className="detail-label">Channels:</span> {study['Channel Count']}
                    </div>
                  )}
                  
                  {study['Sampling Rate'] && (
                    <div className="detail-item">
                      <span className="detail-label">Sampling Rate:</span> {study['Sampling Rate']}
                      {!isNaN(study['Sampling Rate']) && ' Hz'}
                    </div>
                  )}
                  
                  {study['Recording Environment'] && (
                    <div className="detail-item">
                      <span className="detail-label">Recording Environment:</span> {study['Recording Environment']}
                    </div>
                  )}
                  
                  {study['Data Format'] && (
                    <div className="detail-item">
                      <span className="detail-label">Data Format:</span> {study['Data Format']}
                    </div>
                  )}
                </div>
              )}
              
              {/* Analysis Methods */}
              {(study['Preprocessing'] || study['EEG Analysis Techniques'] || 
                study['Statistical Tests'] || study['Event Markers']) && (
                <div className="detail-group">
                  <h4>Analysis Methods</h4>
                  
                  {study['Preprocessing'] && (
                    <div className="detail-item">
                      <span className="detail-label">Preprocessing:</span> 
                      {formatList(study['Preprocessing'])}
                    </div>
                  )}
                  
                  {study['EEG Analysis Techniques'] && (
                    <div className="detail-item">
                      <span className="detail-label">Analysis Techniques:</span> 
                      {formatList(study['EEG Analysis Techniques'])}
                    </div>
                  )}
                  
                  {study['Statistical Tests'] && (
                    <div className="detail-item">
                      <span className="detail-label">Statistical Tests:</span> 
                      {formatList(study['Statistical Tests'])}
                    </div>
                  )}
                  
                  {study['Event Markers'] && (
                    <div className="detail-item">
                      <span className="detail-label">Event Markers:</span> 
                      {formatList(study['Event Markers'])}
                    </div>
                  )}
                </div>
              )}
              
              {/* License Information */}
              {study['License'] && (
                <div className="detail-item license">
                  <span className="detail-label">License:</span> {study['License']}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Get filtered studies
  const filteredStudies = filterStudies();
  const studyCounts = getStudyCountsByYear();
  
  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading EEG Music Studies database...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  // Calculate the timeline position percentage
  const positionPercentage = yearRange.max === yearRange.min 
    ? 50 
    : ((selectedYear - yearRange.min) / (yearRange.max - yearRange.min)) * 100;
  
  return (
    <div className="eeg-music-container">
      
      {/* Header */}
      <header className="header">
        <h1>EEG Music Studies Database</h1>
      </header>
      
      {/* About Section */}
      <div className="about-section">
        <h2>About This Visualization</h2>
        <p>
          This interactive database visualizes EEG studies related to music perception and cognition, allowing researchers to explore methodologies, stimuli, and findings across different paradigms and years.
        </p>
        
        <div className="how-to-use">
          <h3>How to Use</h3>
          <div className="use-instructions">
            <div className="instruction-item">
              <span className="instruction-label">Timeline View:</span>
              <span>Select a year to view studies within a ±5 year window</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-label">List View:</span>
              <span>Set custom year range with start/end inputs</span>
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
              <span className="instruction-label">Filter:</span>
              <span>Narrow results by paradigm type and other attributes</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-label">Export:</span>
              <span>Save current results as CSV file</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls Panel */}
      <div className="controls-panel">
        <div className="controls-top">
          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              Timeline View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
          
          {/* Export Button */}
          <button className="export-btn" onClick={exportToCSV}>
            Export to CSV
          </button>
        </div>
        
        {/* Search Field */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search across all fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-btn" 
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Year Range Inputs for List View */}
        {viewMode === 'list' && (
          <div className="year-range-inputs">
            <div className="year-input-group">
              <label htmlFor="start-year">Start Year:</label>
              <input
                id="start-year"
                type="number"
                min={yearRange.min}
                max={endYear}
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
              />
            </div>
            <div className="year-input-group">
              <label htmlFor="end-year">End Year:</label>
              <input
                id="end-year"
                type="number"
                min={startYear}
                max={yearRange.max}
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value))}
              />
            </div>
          </div>
        )}
        
        {/* Filters Section with Horizontal Dropdowns and Direct Inputs */}
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
          
          <div className="filter-row">
            {/* Paradigm Type Dropdown */}
            <div className="filter-dropdown">
              <div 
                className="filter-dropdown-header" 
                onClick={() => toggleDropdown('Paradigm Type')}
              >
                <h4>Paradigm Type</h4>
                <span className="dropdown-arrow">{openDropdowns['Paradigm Type'] ? '▲' : '▼'}</span>
              </div>
              {openDropdowns['Paradigm Type'] && (
                <div className="filter-options-dropdown">
                  {filterOptions['Paradigm Type']?.map(value => (
                    <div 
                      key={`Paradigm Type-${value}`}
                      className={`filter-option ${(activeFilters['Paradigm Type'] || []).includes(value) ? 'active' : ''}`}
                      onClick={(e) => handleFilterChange('Paradigm Type', value, e)}
                    >
                      <label className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={(activeFilters['Paradigm Type'] || []).includes(value)}
                          onChange={(e) => handleFilterChange('Paradigm Type', value, e)}
                          onClick={(e) => e.stopPropagation()} // Prevent double-toggling
                        />
                        <span className="filter-label">{value}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {(activeFilters['Paradigm Type'] || []).length > 0 && (
                <div className="active-filter-count">
                  {(activeFilters['Paradigm Type'] || []).length} selected
                </div>
              )}
            </div>
            
            {/* Stimulus Type Dropdown */}
            <div className="filter-dropdown">
              <div 
                className="filter-dropdown-header" 
                onClick={() => toggleDropdown('Stimulus Type')}
              >
                <h4>Stimulus Type</h4>
                <span className="dropdown-arrow">{openDropdowns['Stimulus Type'] ? '▲' : '▼'}</span>
              </div>
              {openDropdowns['Stimulus Type'] && (
                <div className="filter-options-dropdown">
                  {filterOptions['Stimulus Type']?.map(value => (
                    <div 
                      key={`Stimulus Type-${value}`}
                      className={`filter-option ${(activeFilters['Stimulus Type'] || []).includes(value) ? 'active' : ''}`}
                      onClick={(e) => handleFilterChange('Stimulus Type', value, e)}
                    >
                      <label className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={(activeFilters['Stimulus Type'] || []).includes(value)}
                          onChange={(e) => handleFilterChange('Stimulus Type', value, e)}
                          onClick={(e) => e.stopPropagation()} // Prevent double-toggling
                        />
                        <span className="filter-label">{value}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {(activeFilters['Stimulus Type'] || []).length > 0 && (
                <div className="active-filter-count">
                  {(activeFilters['Stimulus Type'] || []).length} selected
                </div>
              )}
            </div>
            
            {/* Musical Training Dropdown */}
            <div className="filter-dropdown">
              <div 
                className="filter-dropdown-header" 
                onClick={() => toggleDropdown('Musical Training')}
              >
                <h4>Musical Training</h4>
                <span className="dropdown-arrow">{openDropdowns['Musical Training'] ? '▲' : '▼'}</span>
              </div>
              {openDropdowns['Musical Training'] && (
                <div className="filter-options-dropdown">
                  {standardTrainingCategories.map(value => (
                    <div 
                      key={`Musical Training-${value}`}
                      className={`filter-option ${(activeFilters['Musical Training'] || []).includes(value) ? 'active' : ''}`}
                      onClick={(e) => handleFilterChange('Musical Training', value, e)}
                    >
                      <label className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={(activeFilters['Musical Training'] || []).includes(value)}
                          onChange={(e) => handleFilterChange('Musical Training', value, e)}
                          onClick={(e) => e.stopPropagation()} // Prevent double-toggling
                        />
                        <span className="filter-label">{value}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {(activeFilters['Musical Training'] || []).length > 0 && (
                <div className="active-filter-count">
                  {(activeFilters['Musical Training'] || []).length} selected
                </div>
              )}
            </div>
            
            {/* EEG System Input with Autocomplete */}
            <div className="filter-search">
              <div className="autocomplete-container" ref={eegDropdownRef}>
                <input
                  type="text"
                  className="autocomplete-input"
                  placeholder="Search EEG systems..."
                  value={eegSystemSearch}
                  onChange={(e) => setEegSystemSearch(e.target.value)}
                  onFocus={() => setShowEEGDropdown(true)}
                />
                
                {showEEGDropdown && eegSystemSearch && (
                  <div className="autocomplete-dropdown">
                    {filteredEEGSystems.length > 0 ? (
                      filteredEEGSystems.map(system => (
                        <div 
                          key={system} 
                          className={`autocomplete-item ${(activeFilters['EEG System Used'] || []).includes(system) ? 'active' : ''}`}
                          onClick={() => selectEEGSystem(system)}
                        >
                          {system}
                        </div>
                      ))
                    ) : (
                      <div className="autocomplete-item no-results">
                        No matching systems found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {(activeFilters['EEG System Used'] || []).length > 0 && (
                <div className="active-filter-tags">
                  {(activeFilters['EEG System Used'] || []).map(system => (
                    <div key={system} className="active-filter-tag">
                      <span>{system}</span>
                      <button 
                        className="remove-filter-tag"
                        onClick={() => handleFilterChange('EEG System Used', system)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Channel Count Input with Autocomplete */}
            <div className="filter-search">
              <div className="autocomplete-container" ref={channelDropdownRef}>
                <input
                  type="text"
                  className="autocomplete-input"
                  placeholder="Search channel counts..."
                  value={channelCountSearch}
                  onChange={(e) => setChannelCountSearch(e.target.value)}
                  onFocus={() => setShowChannelDropdown(true)}
                />
                
                {showChannelDropdown && channelCountSearch && (
                  <div className="autocomplete-dropdown">
                    {filteredChannelCounts.length > 0 ? (
                      filteredChannelCounts.map(count => (
                        <div 
                          key={count} 
                          className={`autocomplete-item ${(activeFilters['Channel Count'] || []).includes(count) ? 'active' : ''}`}
                          onClick={() => selectChannelCount(count)}
                        >
                          {count}
                        </div>
                      ))
                    ) : (
                      <div className="autocomplete-item no-results">
                        No matching channel counts found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {(activeFilters['Channel Count'] || []).length > 0 && (
                <div className="active-filter-tags">
                  {(activeFilters['Channel Count'] || []).map(count => (
                    <div key={count} className="active-filter-tag">
                      <span>{count}</span>
                      <button 
                        className="remove-filter-tag"
                        onClick={() => handleFilterChange('Channel Count', count)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Active Filters Display */}
          {Object.keys(activeFilters).length > 0 && (
            <div className="active-filters-summary">
              {Object.entries(activeFilters).map(([category, values]) => (
                values.map(value => (
                  <div key={`${category}-${value}`} className="active-filter-tag">
                    <span>{value}</span>
                    <button 
                      className="remove-filter-tag"
                      onClick={() => handleFilterChange(category, value)}
                    >
                      ×
                    </button>
                  </div>
                ))
              ))}
            </div>
          )}
          
          {/* Sort By Dropdown - Moved below filters section as requested */}
          <div className="sort-container" ref={sortDropdownRef}>
            <div className="filter-dropdown sort-dropdown">
              <div 
                className="filter-dropdown-header" 
                onClick={() => toggleDropdown('Sort By')}
              >
                <h4>Sort By: {sortOptions.find(opt => opt.value === sortOption)?.label || 'Default'}</h4>
                <span className="dropdown-arrow">{openDropdowns['Sort By'] ? '▲' : '▼'}</span>
              </div>
              {openDropdowns['Sort By'] && (
                <div className="filter-options-dropdown">
                  {sortOptions.map(option => (
                    <div 
                      key={option.value} 
                      className={`sort-option ${sortOption === option.value ? 'active' : ''}`}
                      onClick={() => handleSortChange(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline component (conditional) */}
      {viewMode === 'timeline' && (
        <div className="timeline-section">
          <div className="current-year">
            <span>Selected Year: {selectedYear}</span>
            <span className="year-window">
              Showing studies from {selectedYear - 5} to {selectedYear + 5}
            </span>
          </div>
          
          <div 
            className="timeline-container"
          >
            <div
              className="timeline-bar" 
              ref={timelineRef}
              onClick={handleTimelineClick}
            >
              {/* Year ticks */}
              {Array.from({ length: yearRange.max - yearRange.min + 1 }, (_, i) => yearRange.min + i)
                .filter(year => year % 5 === 0) // Show every 5 years
                .map(year => (
                  <div 
                    key={`tick-${year}`}
                    className="year-tick"
                    style={{ 
                      left: `${((year - yearRange.min) / (yearRange.max - yearRange.min)) * 100}%`,
                    }}
                  >
                    <span className="tick-label">{year}</span>
                  </div>
                ))}
              
              {/* ±5 year window highlight */}
              <div
                className="year-window-highlight"
                style={{
                  left: `${((selectedYear - 5 - yearRange.min) / (yearRange.max - yearRange.min)) * 100}%`,
                  width: `${(10 / (yearRange.max - yearRange.min)) * 100}%`,
                }}
              ></div>
              
              {/* Study count bars */}
              {Object.entries(studyCounts).map(([year, count]) => {
                const position = ((parseInt(year) - yearRange.min) / (yearRange.max - yearRange.min)) * 100;
                const maxBarHeight = 50; // Maximum bar height in pixels
                const height = Math.min(maxBarHeight, 5 + (count * 5)); // Scale bar height
                
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
                Object.entries(getFilteredStudyCountsByYear()).map(([year, filteredCount]) => {
                  if (filteredCount <= 0) return null;
                  
                  const position = ((parseInt(year) - yearRange.min) / (yearRange.max - yearRange.min)) * 100;
                  const maxBarHeight = 50; // Maximum bar height in pixels
                  const height = Math.min(maxBarHeight, 5 + (filteredCount * 5)); // Scale bar height using same formula
                  
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
      )}
      
      {/* Results info bar */}
      <div className="results-info">
        <div className="results-count">
          Found {filteredStudies.length} {filteredStudies.length === 1 ? 'entry' : 'entries'}
          {searchQuery && ` matching "${searchQuery}"`}
          {Object.keys(activeFilters).length > 0 && ' with selected filters'}
        </div>
        
        <div className="results-range">
          {viewMode === 'timeline' 
            ? `Showing ${selectedYear - 5} to ${selectedYear + 5}` 
            : `Showing ${startYear} to ${endYear}`}
        </div>
      </div>
      
      {/* Study cards */}
      {filteredStudies.length > 0 ? (
        <div className="studies-grid">
          {filteredStudies.map(study => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <h3>No studies match your current criteria</h3>
          
          {/* Check if there are matching studies outside the current range */}
          {(() => {
            const outsideMatches = findMatchingStudiesOutsideRange();
            if (outsideMatches && outsideMatches.length > 0) {
              return (
                <div className="outside-range-notification">
                  <p>Identified {outsideMatches.length} matching {outsideMatches.length === 1 ? 'study' : 'studies'} in a different time frame.</p>
                  <button 
                    className="navigate-to-match-btn"
                    onClick={() => navigateToMatchingStudy(outsideMatches)}
                  >
                    View Matching {outsideMatches.length === 1 ? 'Study' : 'Studies'}
                  </button>
                </div>
              );
            }
            return null;
          })()}
          
          <p>Try adjusting your selected year, filters, or search term</p>
          {(Object.keys(activeFilters).length > 0 || searchQuery) && (
            <button className="reset-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EEGMusicStudiesApp;