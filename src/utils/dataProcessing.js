import { logger } from './Logger.js';

const featureCategories = {
  // EEG Frequency Bands
  "delta": ["delta", "delta power", "delta band", "δ", "δ-wave"],
  "theta": ["theta", "theta power", "theta band", "θ", "θ-wave"],
  "alpha": ["alpha", "alpha power", "alpha band", "alpha rhythm", "alpha rhythms", "alpha-2", "alpha peak", "alpha blocking", "alpha-wave", "α", "α-wave", "α-rhythm"],
  "beta": ["beta", "beta power", "beta band", "beta 1", "beta 2", "beta 3", "β", "β-power", "β-wave"],
  "gamma": ["gamma", "gamma band", "gamma-band", "30–50 hz", "γ", "γ-wave"],
  
  // Cognitive/Emotional Metrics
  "attention": ["attention", "attentiveness", "temporal attention"],
  "emotion": ["emotion", "emotional", "emotional arousal", "emotional valence", "affect", "affective", "pleasantness", "happiness", "sadness", "fear", "anger", "tenderness"],
  "valence": ["valence", "pleasantness", "happiness", "sadness"],
  "arousal": ["arousal", "energy", "activation"],
  
  // Musical Elements
  "tempo": ["tempo", "beat", "pulse", "rhythm", "bpm"],
  "harmony": ["harmony", "harmonic", "chord", "chords", "diatonic", "nondiatonic", "cadence", "tonality"],
  "melody": ["melody", "melodic", "contour", "interval", "pitch", "scale"],
  
  // Brain Activity Metrics
  "coherence": ["coherence", "phase synchrony", "connectivity", "coupling", "inter-subject correlation", "isc", "src"],
  "power": ["power", "amplitude", "activation", "band power", "cortical activation", "activity"],
  "erp": ["erp", "event-related", "n100", "p200", "p300", "n400", "p3a", "p3b", "n5", "mmn", "eran", "cps"],
  "synchronization": ["inter-subject correlation", "isc", "src", "neural synchrony", "entrainment", "frequency tagging"],
  "expectancy": ["expectancy", "expectation", "surprise", "prediction", "violation"],
  "imagery": ["imagery", "imagination", "mental"],
  
  // Signal Processing
  "envelope": ["envelope", "acoustic envelope", "amplitude envelope", "rms", "spectral flux"],
  "spectral": ["spectral", "spectrum", "frequency", "spectrogram", "spectral flux", "zero-crossing"],
  "localization": ["hemispheric", "lateralization", "frontal", "central", "parietal", "temporal", "occipital"]
};

export const standardTrainingCategories = [
  'Extensive Training',
  'Moderate Training',
  'Minimal Training',
  'Mixed Groups',
  'No Formal Training',
  'Not Reported',
  'Not Applicable'
];

export function normalizeFeatures(featuresText) {
  if (!featuresText) return [];
  
  const cleanText = featuresText
    .toLowerCase()
    .replace(/[()]/g, ' ') 
    .replace(/[+&]/g, ' ')
    .replace(/[;/]/g, ',') 
    .replace(/[-–—]/g, ' ') 
    .replace(/\s+/g, ' ') 
    .trim();
  
  const identifiedCategories = new Set();
  
  Object.entries(featureCategories).forEach(([category, keywords]) => {
    for (const keyword of keywords) {
      if (keyword.includes(' ')) {
        if (cleanText.includes(keyword)) {
          identifiedCategories.add(category);
          break;
        }
      } else {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(cleanText)) {
          identifiedCategories.add(category);
          break;
        }
      }
    }
  });
  
  return Array.from(identifiedCategories);
}

export function parsePassageLength(lengthStr) {
  if (!lengthStr || typeof lengthStr !== 'string') return -1;
  
  if (lengthStr.includes('-') || lengthStr.includes('–') || lengthStr.includes('—') || lengthStr.includes(' to ')) {
    const rangeSeparators = /[-–—]|(?:\s+to\s+)/;
    const parts = lengthStr.split(rangeSeparators);
    if (parts.length === 2) {
      const values = parts.map(p => parsePassageLength(p.trim())).filter(v => v !== -1);
      if (values.length === 2) {
        return (values[0] + values[1]) / 2;
      }
    }
  }
  
  let cleanStr = lengthStr
    .replace(/[~≈]/g, '') 
    .replace(/\(.*?\)/g, '') 
    .replace(/total|each|per trial|averaged?/gi, '') 
    .replace(/,/g, '.') // European decimal notation
    .trim();
  
  // "X minutes Y seconds" format
  const minutesSecondsMatch = cleanStr.match(/(\d+(?:\.\d+)?)\s*(?:min|minute)s?\s*(?:and\s+)?(\d+(?:\.\d+)?)\s*(?:sec|second)s?/i);
  if (minutesSecondsMatch) {
    const minutes = parseFloat(minutesSecondsMatch[1]);
    const seconds = parseFloat(minutesSecondsMatch[2]);
    return minutes * 60 + seconds;
  }
  
  // "MM:SS" format
  const timeMatch = cleanStr.match(/(\d+):(\d+)(?::(\d+))?/);
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1], 10);
    const seconds = parseInt(timeMatch[2], 10);
    if (timeMatch[3]) {
      const hours = minutes;
      const mins = seconds;
      const secs = parseInt(timeMatch[3], 10);
      return hours * 3600 + mins * 60 + secs;
    }
    return minutes * 60 + seconds;
  }
  
  // Handle abbreviated formats like "2m30s"
  const abbreviatedMatch = cleanStr.match(/(\d+(?:\.\d+)?)m(?:in)?(?:\s*(\d+(?:\.\d+)?)s(?:ec)?)?/i);
  if (abbreviatedMatch) {
    const minutes = parseFloat(abbreviatedMatch[1]);
    const seconds = abbreviatedMatch[2] ? parseFloat(abbreviatedMatch[2]) : 0;
    return minutes * 60 + seconds;
  }
  
  const numMatch = cleanStr.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return -1;
  
  const value = parseFloat(numMatch[1]);
  if (isNaN(value)) return -1;
  
  if (/min|minute/i.test(cleanStr)) {
    return value * 60;
  } else if (/sec|second/i.test(cleanStr)) {
    return value;
  } else if (/hour|hr/i.test(cleanStr)) {
    return value * 3600;
  }
  
  return value > 10 ? value : value * 60;
}

export function extractChannelCount(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function parseParticipantCount(participantStr) {
  if (!participantStr || typeof participantStr !== 'string') return -1;
  
  const writtenNumbers = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50
  };
  
  const lowerStr = participantStr.toLowerCase();
  for (const [word, num] of Object.entries(writtenNumbers)) {
    if (lowerStr.includes(word)) {
      return num;
    }
  }
  
  const rangeMatch = participantStr.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[1], 10);
  }
  
  const plusMinusMatch = participantStr.match(/(\d+(?:\.\d+)?)\s*[±]\s*(\d+(?:\.\d+)?)/);
  if (plusMinusMatch) {
    return parseInt(plusMinusMatch[1], 10);
  }

  const numMatch = participantStr.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return -1;
  
  const value = parseFloat(numMatch[1]);
  return isNaN(value) ? -1 : Math.round(value);
}

function parseArrayField(value) {
  if (!value || typeof value !== 'string') return [];
  if (value.toLowerCase() === 'na' || value.toLowerCase() === 'not specified') return [];
  
  return value.split(/[,;/]/)
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.toLowerCase() !== 'na');
}

function cleanString(str) {
  if (!str || typeof str !== 'string') return str;
  
  return str
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\p{Cc}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTrainingField(value) {
  const items = parseArrayField(value);
  const unique = new Set();

  items.forEach(item => {
    const matchedCategory = standardTrainingCategories.find(std =>
      item.toLowerCase().includes(std.toLowerCase()) ||
      std.toLowerCase().includes(item.toLowerCase())
    );
    if (matchedCategory) {
      unique.add(matchedCategory);
    } else if (item) {
      unique.add(item);
    }
  });

  return Array.from(unique);
}

export function normalizeStudyData(entry, index) {
  if (!entry || typeof entry !== 'object') {
    logger.warn(`Invalid entry at index ${index}`, { entry, index });
    return null;
  }

  const cleanedEntry = { id: `study-${index}` };
  
  Object.entries(entry).forEach(([key, value]) => {
    if (value == null || value === '') return;
    
    let trimmed = typeof value === 'string' ? cleanString(value) : value;
    const lowerVal = typeof trimmed === 'string' ? trimmed.toLowerCase() : '';
    
    if (trimmed === '' || lowerVal === 'na' || lowerVal === 'not specified' || lowerVal === 'not reported') return;
    
    switch(key) {
      case 'Year':
        const year = parseInt(trimmed, 10);
        if (!isNaN(year) && year > 1900 && year <= 2030) {
          cleanedEntry[key] = year;
        }
        break;
        
      case 'Paradigm Type':
      case 'Musical Features Analyzed':
      case 'Musical Training': 
      case 'Preprocessing':
      case 'EEG Analysis Techniques':
      case 'Statistical Tests':
      case 'Event Markers':
      case 'Stimulus Type':
        const items = parseArrayField(trimmed);
        if (items.length > 0) {
          if (key === 'Musical Training') {
            cleanedEntry[key] = normalizeTrainingField(trimmed);
          } else {
            cleanedEntry[key] = items;
          }
        }
        
        if (key === 'Musical Features Analyzed') {
          cleanedEntry['normalizedFeatures'] = normalizeFeatures(trimmed);
        }
        break;
        
      case 'DOI/URL':
      case 'Dataset': 
        if (trimmed.startsWith('http') || trimmed.startsWith('10.')) {
          cleanedEntry[key] = trimmed;
        }
        break;
        
      case 'Channel Count':
        cleanedEntry[key] = trimmed;
        cleanedEntry['channelCountValue'] = extractChannelCount(trimmed);
        break;
        
      case 'Passage Length':
        cleanedEntry[key] = trimmed;
        cleanedEntry['passageLengthSeconds'] = parsePassageLength(trimmed);
        break;
        
      case 'Number of Participants':
        cleanedEntry[key] = trimmed;
        cleanedEntry['participantsValue'] = parseParticipantCount(trimmed);
        break;
        
      default:
        cleanedEntry[key] = trimmed;
    }
  });
  
  cleanedEntry.year = cleanedEntry.Year || 0;
  
  if (!cleanedEntry['normalizedFeatures']) {
    cleanedEntry['normalizedFeatures'] = [];
  }
  
  if (cleanedEntry.year > 0 && cleanedEntry['Study Name']) {
    return cleanedEntry;
  }
  
  logger.warn(`Skipping invalid study at index ${index}`, { cleanedEntry, index });
  return null;
}

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
  try {
    if (!studies || !Array.isArray(studies)) {
      logger.warn('Invalid studies array provided to applyFilters');
      return [];
    }
    
    if (!filters) {
      logger.warn('applyFilters called with null/undefined filters');
      return studies;
    }
    
    const { searchQuery = '', activeFilters = {}, startYear = 1900, endYear = 2030 } = filters;
    
    let filtered = studies.filter(study => 
      study && study.year >= startYear && study.year <= endYear
    );

    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      const initialCount = filtered.length;
      
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
      
      logger.info('Search applied', { query, before: initialCount, after: filtered.length });
    }

    if (activeFilters && typeof activeFilters === 'object') {
      Object.entries(activeFilters).forEach(([category, selectedValues]) => {
        if (!Array.isArray(selectedValues) || selectedValues.length === 0) return;

        const beforeCount = filtered.length;
        
        filtered = filtered.filter(study => {
          if (!study) return false;
          
          switch (category) {
            case 'Musical Training':
            case 'Paradigm Type':
            case 'Stimulus Type':
              const studyValue = study[category];
              if (!studyValue) return false;
              
              if (Array.isArray(studyValue)) {
                return studyValue.some(val => selectedValues.includes(val));
              }
              return selectedValues.includes(String(studyValue));
              
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
        
        if (beforeCount !== filtered.length) {
          logger.info(`Filter applied: ${category}`, { before: beforeCount, after: filtered.length });
        }
      });
    }

    return filtered;
    
  } catch (error) {
    logger.error('Filter application failed', { error: error.message });
    return studies || [];
  }
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
  if (!studies || !Array.isArray(studies)) return {};
  
  const filterOptions = {};
  const filterCategories = ['Paradigm Type', 'Stimulus Type', 'Musical Training', 'EEG System Used'];
  
  filterCategories.forEach(category => {
    const uniqueValues = new Set();
    
    studies.forEach(study => {
      if (!study) return;
      
      if (category === 'Musical Training') {
        const trainingValue = study[category];
        if (trainingValue) {
          if (Array.isArray(trainingValue)) {
            trainingValue.forEach(val => {
              const matchedCategory = standardTrainingCategories.find(std => 
                val.toLowerCase().includes(std.toLowerCase()) || 
                std.toLowerCase().includes(val.toLowerCase())
              );
              if (matchedCategory) {
                uniqueValues.add(matchedCategory);
              } else {
                uniqueValues.add(val);
              }
            });
          } else {
            const matchedCategory = standardTrainingCategories.find(std => 
              trainingValue.toLowerCase().includes(std.toLowerCase()) || 
              std.toLowerCase().includes(trainingValue.toLowerCase())
            );
            if (matchedCategory) {
              uniqueValues.add(matchedCategory);
            } else {
              uniqueValues.add(String(trainingValue));
            }
          }
        }
      } else {
        const value = study[category];
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => uniqueValues.add(String(v)));
          } else {
            uniqueValues.add(String(value));
          }
        }
      }
    });
    
    filterOptions[category] = Array.from(uniqueValues).sort();
  });
  
  const channelCounts = new Set();
  studies.forEach(study => {
    if (!study) return;
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