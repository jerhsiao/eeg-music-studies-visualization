const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const inputPath = path.join(__dirname, '../../public/eeg-music-studies-database.csv');
const outputPath = path.join(__dirname, '../../public/eeg-music-studies-database.json');

// Standard categories for Musical Features Analyzed
const featureCategories = {
  // EEG Frequency Bands
  "delta": ["delta", "delta power", "delta band"],
  "theta": ["theta", "theta power", "theta band"],
  "alpha": ["alpha", "alpha power", "alpha band", "alpha rhythm", "alpha rhythms", "alpha-2", "alpha peak", "alpha blocking", "alpha-wave"],
  "beta": ["beta", "beta power", "beta band", "beta 1", "beta 2", "beta 3"],
  "gamma": ["gamma", "gamma band", "gamma-band", "30–50 hz"],
  
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

function normalizeFeatures(featuresText) {
  if (!featuresText) return [];
  
  const lowercaseText = featuresText.toLowerCase();
  const identifiedCategories = new Set();
  
  Object.entries(featureCategories).forEach(([category, keywords]) => {
    for (const keyword of keywords) {
      if (keyword.includes(' ') && lowercaseText.includes(keyword)) {
        identifiedCategories.add(category);
        break;
      }
      // For single words, regex with word boundaries
      else if (new RegExp(`\\b${keyword}\\b`, 'i').test(lowercaseText)) {
        identifiedCategories.add(category);
        break;
      }
    }
  });
  
  return Array.from(identifiedCategories);
}

function parsePassageLength(lengthStr) {
  if (!lengthStr || typeof lengthStr !== 'string') return -1;
  
  // Find average of passage length
  if (lengthStr.includes('-') || lengthStr.includes('–')) {
    const parts = lengthStr.replace('–', '-').split('-');
    const values = parts.map(p => parsePassageLength(p.trim())).filter(v => v !== -1);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : -1;
  }
  // Trim
  lengthStr = lengthStr.replace('~', '').trim();
  if (lengthStr.includes(' per ')) {
    lengthStr = lengthStr.split(' per ')[0].trim();
  }
  
  // Time
  const timeMatch = lengthStr.match(/(\d+):(\d+)/);
  if (timeMatch) return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
  
  const numMatch = lengthStr.match(/(\d+\.?\d*)/);
  if (!numMatch) return -1;
  
  const value = parseFloat(numMatch[1]);
  if (isNaN(value)) return -1;
  
  if (/min|minute/i.test(lengthStr)) return value * 60;
  return value; 
}

function extractChannelCount(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function convertCsvToJson() {
  try {
    const csvData = fs.readFileSync(inputPath, 'utf8');
    
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields;
        
        const processedData = results.data
          .filter(entry => entry && typeof entry === 'object')
          .map((entry, index) => {
            const cleanedEntry = { id: `study-${index}` };
            
            Object.entries(entry).forEach(([key, value]) => {
              const trimmed = typeof value === 'string' ? value.trim() : value;
              const lowerVal = typeof trimmed === 'string' ? trimmed.toLowerCase() : '';
              
              if (trimmed === '' || lowerVal === 'na' || lowerVal === 'not specified') return;
              
              switch(key) {
                case 'Year':
                  const year = parseInt(trimmed, 10);
                  if (!isNaN(year)) cleanedEntry[key] = year;
                  break;
                  
                case 'Paradigm Type':
                case 'Musical Features Analyzed':
                case 'Preprocessing':
                case 'EEG Analysis Techniques':
                case 'Statistical Tests':
                case 'Event Markers':
                  const items = trimmed.split(',').map(item => item.trim()).filter(Boolean);
                  cleanedEntry[key] = items;
                  
                  if (key === 'Musical Features Analyzed') {
                    cleanedEntry['normalizedFeatures'] = normalizeFeatures(trimmed);
                  }
                  break;
                  
                case 'DOI/URL':
                case 'Dataset': // Placeholder, not really sure how to check these
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
                  const pMatch = trimmed.match(/(\d+)/);
                  cleanedEntry['participantsValue'] = pMatch ? parseInt(pMatch[1], 10) : -1;
                  break;
                  
                default:
                  cleanedEntry[key] = trimmed;
              }
            });
            
            cleanedEntry.year = cleanedEntry.Year || 0;
            return cleanedEntry;
          })
          .filter(entry => entry.year > 0);
        
        // Calculate feature statistics
        const featureStats = {};
        processedData.forEach(study => {
          (study.normalizedFeatures || []).forEach(feature => {
            featureStats[feature] = (featureStats[feature] || 0) + 1;
          });
        });
        
        const sortedFeatures = Object.entries(featureStats)
          .sort((a, b) => b[1] - a[1])
          .map(([feature, count]) => ({ 
            name: feature, 
            count: count,
            percentage: Math.round((count / processedData.length) * 100)
          }));
        
        const jsonOutput = {
          metadata: {
            columns,
            count: processedData.length,
            yearRange: {
              min: Math.min(...processedData.map(s => s.year)),
              max: Math.max(...processedData.map(s => s.year))
            },
            featureCategories: sortedFeatures
          },
          studies: processedData
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
        console.log(`Processed ${processedData.length} studies with ${sortedFeatures.length} feature categories.`);
      },
      error: (error) => console.error("CSV parsing error:", error)
    });
  } catch (err) {
    console.error("File processing error:", err);
  }
}

convertCsvToJson();