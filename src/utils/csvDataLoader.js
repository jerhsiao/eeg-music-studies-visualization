import Papa from 'papaparse';
import { normalizeStudyData, generateFilterOptions } from './dataProcessing';

class CSVDataLoader {
  constructor() {
    this.cache = new Map();
    this.isLoading = false;
  }

  async loadStudies(forceReload = false) {
    const cacheKey = 'eeg-studies';
    
    if (this.cache.has(cacheKey) && !forceReload) {
      return this.cache.get(cacheKey);
    }

    if (this.isLoading) {
      return this.loadingPromise;
    }

    this.isLoading = true;
    this.loadingPromise = this._fetchAndProcessCSV();
    
    try {
      const result = await this.loadingPromise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  async _fetchAndProcessCSV() {
    try {
      console.log('Fetching CSV file...');
      const response = await fetch('/eeg-music-studies-database.csv');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log('CSV file loaded, size:', csvText.length);
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('CSV file is empty or could not be read');
      }
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false, 
          delimitersToGuess: [',', '\t', '|', ';'],
          complete: (results) => {
            try {
              console.log('CSV parsing complete');
              console.log('Headers found:', results.meta.fields);
              console.log('Total rows:', results.data.length);
              console.log('Sample row:', results.data[0]);
              
              if (!results.data || results.data.length === 0) {
                throw new Error('No data found in CSV file');
              }
              
              const processedData = this._finalizeProcessing(results.data, results.meta.fields);
              console.log('Processing complete');
              resolve(processedData);
            } catch (error) {
              console.error('Processing error:', error);
              reject(error);
            }
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            reject(new Error(`CSV parsing failed: ${error.message || error}`));
          }
        });
      });
    } catch (error) {
      console.error('Fetch error:', error);
      throw new Error(`Failed to load CSV file: ${error.message}`);
    }
  }

  _finalizeProcessing(rawData, columns) {
    console.log('Starting data processing...');
    
    if (!rawData || !Array.isArray(rawData)) {
      throw new Error('Invalid raw data provided to processing');
    }

    const studies = [];
    const processingErrors = [];
    
    rawData.forEach((row, index) => {
      try {
        const processedStudy = normalizeStudyData(row, index);
        if (processedStudy) {
          studies.push(processedStudy);
        }
      } catch (error) {
        processingErrors.push({ index, error: error.message });
      }
    });
    
    if (processingErrors.length > 0) {
      console.warn(`Processing errors for ${processingErrors.length} rows:`, processingErrors);
    }
    
    if (studies.length === 0) {
      throw new Error('No valid studies could be processed from the CSV data');
    }
    
    console.log(`Successfully processed ${studies.length} valid studies from ${rawData.length} rows`);

    const featureStats = {};
    studies.forEach(study => {
      if (study.normalizedFeatures && Array.isArray(study.normalizedFeatures)) {
        study.normalizedFeatures.forEach(feature => {
          featureStats[feature] = (featureStats[feature] || 0) + 1;
        });
      }
    });

    const sortedFeatures = Object.entries(featureStats)
      .sort((a, b) => b[1] - a[1])
      .map(([feature, count]) => ({ 
        name: feature, 
        count: count,
        percentage: Math.round((count / studies.length) * 100)
      }));

    let filterOptions = {};
    try {
      filterOptions = generateFilterOptions(studies);
      console.log('Generated filter options:', filterOptions);
    } catch (error) {
      console.error('Error generating filter options:', error);
      filterOptions = {};
    }

    const years = studies.map(s => s.year).filter(y => y > 0);
    const yearRange = years.length > 0 ? {
      min: Math.min(...years),
      max: Math.max(...years)
    } : { min: 1975, max: 2025 };

    const metadata = {
      columns: columns || [],
      count: studies.length,
      yearRange,
      featureCategories: sortedFeatures,
      filterOptions
    };

    return {
      studies,
      metadata,
      timestamp: Date.now()
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

export const csvLoader = new CSVDataLoader();