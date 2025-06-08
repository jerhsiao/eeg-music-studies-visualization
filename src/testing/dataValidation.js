#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function isValidStudy(study) {
  return study && 
         typeof study === 'object' && 
         study['Study Name'] && 
         study.year && 
         study.year > 1900 && 
         study.year < 2030;
}

function isValidYear(year) {
  const numYear = parseInt(year, 10);
  return !isNaN(numYear) && numYear >= 1900 && numYear <= 2030;
}

function parseParticipantCount(participantStr) {
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

function extractChannelCount(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parsePassageLength(lengthStr) {
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
    .replace(/,/g, '.') 
    .trim();
  
  const minutesSecondsMatch = cleanStr.match(/(\d+(?:\.\d+)?)\s*(?:min|minute)s?\s*(?:and\s+)?(\d+(?:\.\d+)?)\s*(?:sec|second)s?/i);
  if (minutesSecondsMatch) {
    const minutes = parseFloat(minutesSecondsMatch[1]);
    const seconds = parseFloat(minutesSecondsMatch[2]);
    return minutes * 60 + seconds;
  }
  
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

function normalizeFeatures(featuresText) {
  if (!featuresText) return [];
  
  const featureCategories = {
    "delta": ["delta", "delta power", "delta band", "δ", "δ-wave"],
    "theta": ["theta", "theta power", "theta band", "θ", "θ-wave"],
    "alpha": ["alpha", "alpha power", "alpha band", "alpha rhythm", "alpha rhythms", "alpha-2", "alpha peak", "alpha blocking", "alpha-wave", "α", "α-wave", "α-rhythm"],
    "beta": ["beta", "beta power", "beta band", "beta 1", "beta 2", "beta 3", "β", "β-power", "β-wave"],
    "gamma": ["gamma", "gamma band", "gamma-band", "30–50 hz", "γ", "γ-wave"],
    "attention": ["attention", "attentiveness", "temporal attention"],
    "emotion": ["emotion", "emotional", "emotional arousal", "emotional valence", "affect", "affective", "pleasantness", "happiness", "sadness", "fear", "anger", "tenderness"],
    "valence": ["valence", "pleasantness", "happiness", "sadness"],
    "arousal": ["arousal", "energy", "activation"],
    "tempo": ["tempo", "beat", "pulse", "rhythm", "bpm"],
    "harmony": ["harmony", "harmonic", "chord", "chords", "diatonic", "nondiatonic", "cadence", "tonality"],
    "melody": ["melody", "melodic", "contour", "interval", "pitch", "scale"],
    "coherence": ["coherence", "phase synchrony", "connectivity", "coupling", "inter-subject correlation", "isc", "src"],
    "power": ["power", "amplitude", "activation", "band power", "cortical activation", "activity"],
    "erp": ["erp", "event-related", "n100", "p200", "p300", "n400", "p3a", "p3b", "n5", "mmn", "eran", "cps"],
    "synchronization": ["inter-subject correlation", "isc", "src", "neural synchrony", "entrainment", "frequency tagging"],
    "expectancy": ["expectancy", "expectation", "surprise", "prediction", "violation"],
    "imagery": ["imagery", "imagination", "mental"],
    "envelope": ["envelope", "acoustic envelope", "amplitude envelope", "rms", "spectral flux"],
    "spectral": ["spectral", "spectrum", "frequency", "spectrogram", "spectral flux", "zero-crossing"],
    "localization": ["hemispheric", "lateralization", "frontal", "central", "parietal", "temporal", "occipital"]
  };
  
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

class CSVValidator {
  constructor(csvPath) {
    this.csvPath = csvPath;
    this.errors = [];
    this.warnings = [];
    this.studies = [];
  }

  async validate() {
    console.log('Starting CSV Data Validation...\n');
    
    try {
      await this.loadData();
      this.validateStudies();
      this.generateReport();
    } catch (error) {
      console.error('Validation failed:', error.message);
      process.exit(1);
    }
  }

  async loadData() {
    console.log(`Loading CSV file: ${this.csvPath}`);
    
    if (!fs.existsSync(this.csvPath)) {
      throw new Error(`File not found: ${this.csvPath}`);
    }

    const csvContent = fs.readFileSync(this.csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`Found ${lines.length} lines (including header)`);
    
    if (lines.length < 2) {
      throw new Error('CSV file appears empty or has no data rows');
    }

    const header = this.parseCSVLine(lines[0]);
    console.log(`Found ${header.length} columns`);
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const row = {};
        
        header.forEach((col, index) => {
          if (index < values.length) {
            const value = values[index];
            if (value && value !== 'NA' && value !== 'Not Specified' && value !== 'Not Reported') {
              row[col] = value;
            }
          }
        });
        
        if (Object.keys(row).length > 0) {
          this.studies.push({ ...row, _rowNumber: i + 1 });
        }
      } catch (error) {
        this.warnings.push({
          type: 'PARSE_ERROR',
          row: i + 1,
          message: `Could not parse row: ${error.message}`
        });
      }
    }
    
    console.log(`Parsed ${this.studies.length} studies\n`);
  }

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  }

  validateStudies() {
    console.log('Validating studies...\n');
    
    let validStudies = 0;
    let participantExtractions = 0;
    let channelExtractions = 0;
    let timeExtractions = 0;
    let featureCategorizations = 0;
    
    this.studies.forEach(study => {
      const rowNum = study._rowNumber;

      if (!study['Study Name'] || !study['Study Name'].trim()) {
        this.errors.push({
          type: 'MISSING_STUDY_NAME',
          row: rowNum,
          message: 'Missing Study Name'
        });
        return;
      }
      
      if (!study['Year'] || !isValidYear(study['Year'])) {
        this.errors.push({
          type: 'INVALID_YEAR',
          row: rowNum,
          studyName: study['Study Name'],
          message: `Invalid or missing year: ${study['Year']}`
        });
        return;
      }
      
      validStudies++;
      
      if (study['Number of Participants']) {
        const participantCount = parseParticipantCount(study['Number of Participants']);
        if (participantCount > 0) {
          participantExtractions++;
          if (participantCount < 1 || participantCount > 1000) {
            this.warnings.push({
              type: 'UNUSUAL_PARTICIPANT_COUNT',
              row: rowNum,
              studyName: study['Study Name'],
              message: `Unusual participant count: ${participantCount}`
            });
          }
        } else {
          this.warnings.push({
            type: 'PARTICIPANT_EXTRACTION_FAILED',
            row: rowNum,
            studyName: study['Study Name'],
            message: `Could not extract participant count from: "${study['Number of Participants']}"`
          });
        }
      }
      
      if (study['Channel Count']) {
        const channelCount = extractChannelCount(study['Channel Count']);
        if (channelCount > 0) {
          channelExtractions++;
          if (channelCount < 1 || channelCount > 1024) {
            this.warnings.push({
              type: 'UNUSUAL_CHANNEL_COUNT',
              row: rowNum,
              studyName: study['Study Name'],
              message: `Unusual channel count: ${channelCount}`
            });
          }
        } else {
          this.warnings.push({
            type: 'CHANNEL_EXTRACTION_FAILED',
            row: rowNum,
            studyName: study['Study Name'],
            message: `Could not extract channel count from: "${study['Channel Count']}"`
          });
        }
      }
      
      if (study['Passage Length']) {
        const timeLength = parsePassageLength(study['Passage Length']);
        if (timeLength > 0) {
          timeExtractions++;
          if (timeLength > 3600) {
            this.warnings.push({
              type: 'UNUSUAL_TIME_LENGTH',
              row: rowNum,
              studyName: study['Study Name'],
              message: `Very long passage: ${Math.round(timeLength/60)} minutes`
            });
          }
        } else {
          this.warnings.push({
            type: 'TIME_EXTRACTION_FAILED',
            row: rowNum,
            studyName: study['Study Name'],
            message: `Could not extract time from: "${study['Passage Length']}"`
          });
        }
      }
      
      if (study['Musical Features Analyzed']) {
        const features = normalizeFeatures(study['Musical Features Analyzed']);
        if (features.length > 0) {
          featureCategorizations++;
        } else {
          this.warnings.push({
            type: 'FEATURE_CATEGORIZATION_FAILED',
            row: rowNum,
            studyName: study['Study Name'],
            message: `No features categorized from: "${study['Musical Features Analyzed']}"`
          });
        }
      }
      
      if (study['DOI/URL']) {
        const url = study['DOI/URL'];
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('10.')) {
          this.errors.push({
            type: 'INVALID_URL',
            row: rowNum,
            studyName: study['Study Name'],
            message: `Invalid DOI/URL format: ${url}`
          });
        }
      }
      
      if (study['Dataset']) {
        const url = study['Dataset'];
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('10.') && !url.startsWith('Available upon request') && !url.startsWith('Not publicly provided') && !url.startsWith('NA')) {
          this.errors.push({
            type: 'INVALID_DATASET_URL',
            row: rowNum,
            studyName: study['Study Name'],
            message: `Invalid dataset URL format: ${url}`
          });
        }
      }
    });
    
    this.stats = {
      totalStudies: this.studies.length,
      validStudies,
      participantExtractions,
      channelExtractions,
      timeExtractions,
      featureCategorizations
    };
  }

  generateReport() {
    console.log('VALIDATION REPORT');
    console.log('='.repeat(50));
    
    console.log('\nSUMMARY:');
    console.log(`Total rows processed: ${this.stats.totalStudies}`);
    console.log(`Successfully validated: ${this.stats.validStudies}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    console.log('\nPROCESSING STATISTICS:');
    const participantRate = this.stats.validStudies > 0 ? Math.round((this.stats.participantExtractions / this.stats.validStudies) * 100) : 0;
    const channelRate = this.stats.validStudies > 0 ? Math.round((this.stats.channelExtractions / this.stats.validStudies) * 100) : 0;
    const timeRate = this.stats.validStudies > 0 ? Math.round((this.stats.timeExtractions / this.stats.validStudies) * 100) : 0;
    const featureRate = this.stats.validStudies > 0 ? Math.round((this.stats.featureCategorizations / this.stats.validStudies) * 100) : 0;
    
    console.log(`Participant extraction: ${this.stats.participantExtractions}/${this.stats.validStudies} (${participantRate}%)`);
    console.log(`Channel extraction: ${this.stats.channelExtractions}/${this.stats.validStudies} (${channelRate}%)`);
    console.log(`Time extraction: ${this.stats.timeExtractions}/${this.stats.validStudies} (${timeRate}%)`);
    console.log(`Feature categorization: ${this.stats.featureCategorizations}/${this.stats.validStudies} (${featureRate}%)`);
    
    const years = this.studies
      .map(s => parseInt(s.Year))
      .filter(y => !isNaN(y))
      .sort((a, b) => a - b);
    
    if (years.length > 0) {
      console.log(`Year range: ${years[0]} - ${years[years.length - 1]}`);
    }
    
    if (this.errors.length > 0) {
      console.log('\nERRORS (Must Fix):');
      this.errors.slice(0, 10).forEach(error => {
        console.log(`  Row ${error.row}: ${error.message}${error.studyName ? ` (${error.studyName})` : ''}`);
      });
      
      if (this.errors.length > 10) {
        console.log(`  ... and ${this.errors.length - 10} more errors`);
      }
    }
    
    if (this.warnings.length > 0) {
      console.log('\nWARNINGS (Review Recommended):');
      this.warnings.slice(0, 10).forEach(warning => {
        console.log(`  Row ${warning.row}: ${warning.message}${warning.studyName ? ` (${warning.studyName})` : ''}`);
      });
      
      if (this.warnings.length > 10) {
        console.log(`  ... and ${this.warnings.length - 10} more warnings`);
      }
    }
    
    console.log('\nCONCLUSION:');
    if (this.errors.length === 0) {
      console.log('All data passed validation! Ready for production use.');
    } else {
      console.log(`Found ${this.errors.length} errors that must be fixed before production use.`);
    }
    
    if (this.warnings.length > 0) {
      console.log(`Found ${this.warnings.length} warnings that should be reviewed.`);
    }
  }
}

async function main() {
  const csvPath = process.argv[2] || path.join(__dirname, '../../public/eeg-music-studies-database.csv');
  
  console.log('EEG Music Studies CSV Validator\n');
  console.log(`Target file: ${path.resolve(csvPath)}\n`);
  
  const validator = new CSVValidator(csvPath);
  await validator.validate();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Validation script failed:', error.message);
    process.exit(1);
  });
}

module.exports = CSVValidator;