export const DataTransforms = {
  getParticipantRange: (participantValue) => {
    if (participantValue <= 0) return null;
    if (participantValue <= 10) return '1-10';
    if (participantValue <= 25) return '11-25';
    if (participantValue <= 50) return '26-50';
    if (participantValue <= 100) return '51-100';
    return '100+';
  },

  getChannelCountRange: (channelStr) => {
    if (!channelStr) return null;
    const match = channelStr.match(/^(\d+)/);
    if (!match) return null;
    
    const count = parseInt(match[1], 10);
    if (count <= 32) return '1-32';
    if (count <= 64) return '33-64';
    if (count <= 128) return '65-128';
    if (count <= 256) return '129-256';
    return '256+';
  },

  formatChannelCount: (channelStr) => {
    const match = channelStr?.match(/^(\d+)/);
    return match ? `${match[1]} channels` : channelStr;
  }
};

export const applyFilters = (studies, filters) => {
  const { searchQuery, activeFilters, startYear, endYear } = filters;
  
  let filtered = studies.filter(study => 
    study.year >= startYear && study.year <= endYear
  );

  if (searchQuery?.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(study => {
      return Object.entries(study).some(([key, value]) => {
        if (['id', 'channelCountValue', 'passageLengthSeconds', 'participantsValue', 'normalizedFeatures'].includes(key)) {
          return false;
        }
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        } else if (Array.isArray(value)) {
          return value.some(v => typeof v === 'string' && v.toLowerCase().includes(query));
        } else if (value != null) {
          return String(value).toLowerCase().includes(query);
        }
        return false;
      });
    });
  }

  Object.entries(activeFilters).forEach(([category, selectedValues]) => {
    if (selectedValues.length === 0) return;

    filtered = filtered.filter(study => {
      switch (category) {
        case 'Musical Training':
          return study[category] && selectedValues.some(val => study[category].includes(val));
          
        case 'Channel Count': {
          const formattedCount = DataTransforms.formatChannelCount(study['Channel Count']);
          return selectedValues.includes(formattedCount) || selectedValues.includes(study['Channel Count']);
        }
        
        case 'Participant Range': {
          const range = DataTransforms.getParticipantRange(study.participantsValue);
          return range && selectedValues.includes(range);
        }
        
        case 'normalizedFeatures':
          return study[category]?.some?.(feature => selectedValues.includes(feature));
          
        default: {
          const studyValue = study[category];
          if (!studyValue) return false;
          
          if (Array.isArray(studyValue)) {
            return studyValue.some(value => selectedValues.includes(String(value)));
          }
          return selectedValues.includes(String(studyValue));
        }
      }
    });
  });

  return filtered;
};

export const sortFunctions = {
  'year-asc': (a, b) => (a.year || 0) - (b.year || 0),
  'year-desc': (a, b) => (b.year || 0) - (a.year || 0),
  'participants-asc': (a, b) => {
    const aVal = a.participantsValue ?? -1;
    const bVal = b.participantsValue ?? -1;
    if (aVal === -1 && bVal === -1) return 0;
    if (aVal === -1) return 1;
    if (bVal === -1) return -1;
    return aVal - bVal;
  },
  'participants-desc': (a, b) => {
    const aVal = a.participantsValue ?? -1;
    const bVal = b.participantsValue ?? -1;
    if (aVal === -1 && bVal === -1) return 0;
    if (aVal === -1) return 1;
    if (bVal === -1) return -1;
    return bVal - aVal;
  },
  'length-asc': (a, b) => {
    const aVal = a.passageLengthSeconds ?? -1;
    const bVal = b.passageLengthSeconds ?? -1;
    if (aVal === -1 && bVal === -1) return 0;
    if (aVal === -1) return 1;
    if (bVal === -1) return -1;
    return aVal - bVal;
  },
  'length-desc': (a, b) => {
    const aVal = a.passageLengthSeconds ?? -1;
    const bVal = b.passageLengthSeconds ?? -1;
    if (aVal === -1 && bVal === -1) return 0;
    if (aVal === -1) return 1;
    if (bVal === -1) return -1;
    return bVal - aVal;
  }
};

export const generateFilterOptions = (studies) => {
  const filterOptions = {};
  const filterCategories = ['Paradigm Type', 'Stimulus Type', 'Musical Training', 'EEG System Used'];
  const standardTrainingCategories = [
    'Extensive Training', 'Moderate Training', 'Minimal Training', 
    'Mixed Groups', 'No Formal Training', 'Not Reported', 'Not Applicable'
  ];
  
  filterCategories.forEach(category => {
    const uniqueValues = new Set();
    
    studies.forEach(study => {
      if (category === 'Musical Training') {
        standardTrainingCategories.forEach(standardCategory => {
          if (study[category]?.includes(standardCategory)) {
            uniqueValues.add(standardCategory);
          }
        });
      } else {
        const value = study[category];
        if (Array.isArray(value)) {
          value.forEach(v => uniqueValues.add(v));
        } else if (value) {
          uniqueValues.add(String(value));
        }
      }
    });
    
    filterOptions[category] = Array.from(uniqueValues).sort();
  });
  
  const channelCounts = new Set();
  studies.forEach(study => {
    const channelCount = study['Channel Count'];
    if (channelCount) {
      channelCounts.add(DataTransforms.formatChannelCount(channelCount) || channelCount);
    }
  });
  
  filterOptions['Channel Count'] = Array.from(channelCounts).sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
    const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
    return numA - numB;
  });
  
  return filterOptions;
};