import {
  normalizeFeatures,
  parsePassageLength,
  parseParticipantCount,
  extractChannelCount,
  normalizeStudyData,
  applyFilters,
  DataTransforms
} from '../utils/dataProcessing';

describe('Data Processing Unit Tests', () => {
  describe('normalizeFeatures', () => {
    it('should categorize EEG frequency bands', () => {
      expect(normalizeFeatures('alpha power analysis')).toContain('alpha');
      expect(normalizeFeatures('beta oscillations')).toContain('beta');
      expect(normalizeFeatures('gamma band activity')).toContain('gamma');
      expect(normalizeFeatures('delta waves')).toContain('delta');
      expect(normalizeFeatures('theta rhythm')).toContain('theta');
    });

    it('should categorize musical elements', () => {
      expect(normalizeFeatures('harmonic structure')).toContain('harmony');
      expect(normalizeFeatures('melodic contour')).toContain('melody');
      expect(normalizeFeatures('tempo perception')).toContain('tempo');
    });

    it('should categorize cognitive measures', () => {
      expect(normalizeFeatures('attention and focus')).toContain('attention');
      expect(normalizeFeatures('emotional response')).toContain('emotion');
      expect(normalizeFeatures('arousal levels')).toContain('arousal');
    });

    it('should handle multiple features without duplicates', () => {
      const result = normalizeFeatures('alpha power, alpha rhythm, beta waves');
      expect(result).toContain('alpha');
      expect(result).toContain('beta');
      expect(result.filter(f => f === 'alpha')).toHaveLength(1);
    });

    it('should handle empty/invalid input', () => {
      expect(normalizeFeatures('')).toEqual([]);
      expect(normalizeFeatures(null)).toEqual([]);
      expect(normalizeFeatures(undefined)).toEqual([]);
      expect(normalizeFeatures('random unrecognized text')).toEqual([]);
    });
  });

  describe('parsePassageLength', () => {
    it('should parse standard time formats', () => {
      expect(parsePassageLength('30 seconds')).toBe(30);
      expect(parsePassageLength('2 minutes')).toBe(120);
      expect(parsePassageLength('2 minutes 30 seconds')).toBe(150);
      expect(parsePassageLength('2:30')).toBe(150);
      expect(parsePassageLength('1.5 minutes')).toBe(90);
    });

    it('should parse abbreviated formats', () => {
      expect(parsePassageLength('2m30s')).toBe(150);
      expect(parsePassageLength('90s')).toBe(90);
      expect(parsePassageLength('2min')).toBe(120);
    });

    it('should handle ranges by averaging', () => {
      expect(parsePassageLength('2-3 minutes')).toBe(150);
      expect(parsePassageLength('30-60 seconds')).toBe(45);
    });

    it('should return -1 for invalid input', () => {
      expect(parsePassageLength('invalid')).toBe(-1);
      expect(parsePassageLength('')).toBe(-1);
      expect(parsePassageLength(null)).toBe(-1);
      expect(parsePassageLength(undefined)).toBe(-1);
    });
  });

  describe('parseParticipantCount', () => {
    it('should extract numbers from various formats', () => {
      expect(parseParticipantCount('25')).toBe(25);
      expect(parseParticipantCount('N=30')).toBe(30);
      expect(parseParticipantCount('20 participants')).toBe(20);
      expect(parseParticipantCount('32 (16M, 16F)')).toBe(32);
    });

    it('should handle written numbers', () => {
      expect(parseParticipantCount('twenty')).toBe(20);
      expect(parseParticipantCount('thirty subjects')).toBe(30);
      expect(parseParticipantCount('ten participants')).toBe(10);
    });

    it('should handle ranges and plus-minus', () => {
      expect(parseParticipantCount('20-25 participants')).toBe(20);
      expect(parseParticipantCount('25 ± 5')).toBe(25);
    });

    it('should return -1 for invalid input', () => {
      expect(parseParticipantCount('many')).toBe(-1);
      expect(parseParticipantCount('several')).toBe(-1);
      expect(parseParticipantCount('')).toBe(-1);
      expect(parseParticipantCount(null)).toBe(-1);
    });
  });

  describe('extractChannelCount', () => {
    it('should extract channel numbers', () => {
      expect(extractChannelCount('64 channels')).toBe(64);
      expect(extractChannelCount('128 channels')).toBe(128);
      expect(extractChannelCount('32 electrodes')).toBe(32);
      expect(extractChannelCount('256-channel system')).toBe(256);
    });

    it('should return null for invalid input', () => {
      expect(extractChannelCount('many channels')).toBeNull();
      expect(extractChannelCount('high-density')).toBeNull();
      expect(extractChannelCount('')).toBeNull();
      expect(extractChannelCount(null)).toBeNull();
    });
  });

  describe('normalizeStudyData', () => {
    it('should normalize a complete valid entry', () => {
      const entry = {
        'Study Name': 'EEG Music Study',
        'Authors': 'Smith, J., Johnson, A.',
        'Year': '2020',
        'Paradigm Type': 'Controlled',
        'Number of Participants': '30',
        'Channel Count': '64 channels',
        'Passage Length': '2 minutes',
        'Musical Features Analyzed': 'alpha power, beta coherence'
      };

      const result = normalizeStudyData(entry, 0);
      expect(result).not.toBeNull();
      expect(result['Study Name']).toBe('EEG Music Study');
      expect(result.year).toBe(2020);
      expect(result.participantsValue).toBe(30);
      expect(result.channelCountValue).toBe(64);
      expect(result.passageLengthSeconds).toBe(120);
      expect(result.normalizedFeatures).toContain('alpha');
      expect(result.normalizedFeatures).toContain('beta');
    });

    it('should handle array fields correctly', () => {
      const entry = {
        'Study Name': 'Array Test',
        'Year': '2020',
        'Paradigm Type': 'Controlled',
        'Authors': 'Smith, J., Johnson, A.',
        'Musical Features Analyzed': 'alpha, beta, gamma'
      };

      const result = normalizeStudyData(entry, 0);
      expect(result).not.toBeNull();
      
      expect(Array.isArray(result['Paradigm Type'])).toBe(true);
      expect(result['Paradigm Type']).toContain('Controlled');
      
      expect(typeof result['Authors']).toBe('string');
      expect(result['Authors']).toBe('Smith, J., Johnson, A.');
      
      expect(Array.isArray(result['Musical Features Analyzed'])).toBe(true);
      expect(result.normalizedFeatures).toContain('alpha');
      expect(result.normalizedFeatures).toContain('beta');
    });

    it('should clean whitespace and control characters', () => {
      const entry = {
        'Study Name': '  Test\r\nStudy\t  ',
        'Year': '2020',
        'Authors': '\tAuthor\r\nName  '
      };

      const result = normalizeStudyData(entry, 0);
      expect(result).not.toBeNull();
      expect(result['Study Name']).toBe('Test Study');
      expect(result['Authors']).toBe('Author Name');
    });

    it('should filter out NA and Not Specified values', () => {
      const entry = {
        'Study Name': 'Test Study',
        'Year': '2020',
        'Dataset': 'NA',
        'License': 'Not Specified',
        'Composer': 'not reported'
      };

      const result = normalizeStudyData(entry, 0);
      expect(result).not.toBeNull();
      expect(result['Dataset']).toBeUndefined();
      expect(result['License']).toBeUndefined();
      expect(result['Composer']).toBeUndefined();
    });

    it('should reject entries missing required fields', () => {
      const invalidEntries = [
        { 'Year': '2020' }, // Missing Study Name
        { 'Study Name': 'Test' }, // Missing Year
        { 'Study Name': '', 'Year': '2020' }, // Empty Study Name
        { 'Study Name': 'Test', 'Year': '1800' }, // Invalid year
      ];

      const originalWarn = console.warn;
      console.warn = jest.fn();

      invalidEntries.forEach(entry => {
        expect(normalizeStudyData(entry, 0)).toBeNull();
      });

      console.warn = originalWarn;
    });

    it('should validate URL formats', () => {
      const validUrls = [
        { 'Study Name': 'Test', 'Year': '2020', 'DOI/URL': '10.1234/test' },
        { 'Study Name': 'Test', 'Year': '2020', 'DOI/URL': 'https://example.com' }
      ];

      validUrls.forEach(entry => {
        const result = normalizeStudyData(entry, 0);
        expect(result).not.toBeNull();
        expect(result['DOI/URL']).toBe(entry['DOI/URL']);
      });

      const invalidUrl = {
        'Study Name': 'Test',
        'Year': '2020',
        'DOI/URL': 'invalid-url'
      };

      const result = normalizeStudyData(invalidUrl, 0);
      expect(result).not.toBeNull();
      expect(result['DOI/URL']).toBeUndefined();
    });
  });


  describe('DataTransforms', () => {
    it('should map participant counts to ranges', () => {
      expect(DataTransforms.getParticipantRange(5)).toBe('1-10');
      expect(DataTransforms.getParticipantRange(15)).toBe('11-25');
      expect(DataTransforms.getParticipantRange(35)).toBe('26-50');
      expect(DataTransforms.getParticipantRange(75)).toBe('51-100');
      expect(DataTransforms.getParticipantRange(150)).toBe('100+');
      expect(DataTransforms.getParticipantRange(0)).toBeNull();
      expect(DataTransforms.getParticipantRange(-1)).toBeNull();
    });

    it('should map channel counts to ranges', () => {
      expect(DataTransforms.getChannelCountRange('32 channels')).toBe('1-32');
      expect(DataTransforms.getChannelCountRange('64 channels')).toBe('33-64');
      expect(DataTransforms.getChannelCountRange('128 channels')).toBe('65-128');
      expect(DataTransforms.getChannelCountRange('256 channels')).toBe('129-256');
      expect(DataTransforms.getChannelCountRange('512 channels')).toBe('256+');
      expect(DataTransforms.getChannelCountRange('invalid')).toBeNull();
    });

    it('should format channel counts consistently', () => {
      expect(DataTransforms.formatChannelCount('64 channels')).toBe('64 channels');
      expect(DataTransforms.formatChannelCount('128')).toBe('128 channels');
      expect(DataTransforms.formatChannelCount('invalid')).toBe('invalid');
    });
  });

  // ============================================
  // FILTERING TESTS
  // ============================================
  describe('applyFilters', () => {
    const testStudies = [
      {
        id: 'study-1',
        year: 2020,
        'Study Name': 'Alpha Study',
        'Musical Training': 'Extensive Training',
        participantsValue: 25,
        normalizedFeatures: ['alpha', 'power']
      },
      {
        id: 'study-2',
        year: 2021,
        'Study Name': 'Beta Research',
        'Musical Training': 'Mixed Groups',
        participantsValue: 50,
        normalizedFeatures: ['beta', 'coherence']
      }
    ];

    it('should filter by year range', () => {
      const filters = {
        startYear: 2020,
        endYear: 2020,
        searchQuery: '',
        activeFilters: {}
      };

      const result = applyFilters(testStudies, filters);
      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(2020);
    });

    it('should filter by search query', () => {
      const filters = {
        startYear: 2020,
        endYear: 2021,
        searchQuery: 'alpha',
        activeFilters: {}
      };

      const result = applyFilters(testStudies, filters);
      expect(result).toHaveLength(1);
      expect(result[0]['Study Name']).toBe('Alpha Study');
    });

    it('should filter by normalized features', () => {
      const filters = {
        startYear: 2020,
        endYear: 2021,
        searchQuery: '',
        activeFilters: {
          'normalizedFeatures': ['alpha']
        }
      };

      const result = applyFilters(testStudies, filters);
      expect(result).toHaveLength(1);
      expect(result[0].normalizedFeatures).toContain('alpha');
    });

    it('should handle invalid filters gracefully', () => {
      const originalWarn = console.warn;
      const originalLog = console.log;
      const originalError = console.error;
      
      console.warn = jest.fn();
      console.log = jest.fn();
      console.error = jest.fn();
      
      const nullResult = applyFilters(testStudies, null);
      expect(nullResult).toEqual(testStudies);

      const undefinedResult = applyFilters(testStudies, undefined);
      expect(undefinedResult).toEqual(testStudies);
      
      console.warn = originalWarn;
      console.log = originalLog;
      console.error = originalError;
      const emptyResult = applyFilters(testStudies, {});
      expect(Array.isArray(emptyResult)).toBe(true);
      expect(emptyResult.length).toBe(testStudies.length);
      
      const malformedResult = applyFilters(testStudies, { 
        activeFilters: null,
        searchQuery: undefined 
      });
      expect(Array.isArray(malformedResult)).toBe(true);
    });

    it('should filter by participant range correctly', () => {
      const studiesWithParticipants = [
        { ...testStudies[0], participantsValue: 15 }, // Should map to '11-25'
        { ...testStudies[1], participantsValue: 75 }  // Should map to '51-100'
      ];


      const filters = {
        startYear: 2020,
        endYear: 2021,
        searchQuery: '',
        activeFilters: {
          'Participant Range': ['11-25']
        }
      };

      const result = applyFilters(studiesWithParticipants, filters);
      expect(result).toHaveLength(1);
      expect(result[0].participantsValue).toBe(15);
    });

    it('should handle array-based filters correctly', () => {
      const studiesWithArrays = [
        { 
          ...testStudies[0], 
          'Paradigm Type': ['Controlled'],
          'Stimulus Type': 'Musical Excerpt'
        },
        { 
          ...testStudies[1], 
          'Paradigm Type': ['Naturalistic'],
          'Stimulus Type': 'Synthesized Music'
        }
      ];

      const filters = {
        startYear: 2020,
        endYear: 2021,
        searchQuery: '',
        activeFilters: {
          'Paradigm Type': ['Controlled']
        }
      };

      const result = applyFilters(studiesWithArrays, filters);
      expect(result).toHaveLength(1);
      expect(result[0]['Paradigm Type']).toContain('Controlled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme numeric values', () => {
      expect(parsePassageLength('999 minutes')).toBe(59940);
      expect(parseParticipantCount('1000')).toBe(1000);
      expect(extractChannelCount('1024 channels')).toBe(1024);
    });

    it('should handle zero values appropriately', () => {
      expect(parsePassageLength('0 seconds')).toBe(0);
      expect(parseParticipantCount('0')).toBe(0);
      expect(extractChannelCount('0 channels')).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(parsePassageLength('1.5 minutes')).toBe(90);
      expect(parsePassageLength('30.5 seconds')).toBe(30.5);
      expect(parseParticipantCount('25.5')).toBe(26); 
    });

    it('should handle mixed case input', () => {
      expect(normalizeFeatures('ALPHA POWER')).toContain('alpha');
      expect(normalizeFeatures('Beta Oscillations')).toContain('beta');
      expect(parsePassageLength('2 MINUTES')).toBe(120);
    });

    it('should handle special characters and formatting', () => {
      expect(normalizeFeatures('alpha-wave analysis')).toContain('alpha');
      expect(normalizeFeatures('beta/gamma coupling')).toContain('beta');
      expect(normalizeFeatures('alpha & beta power')).toContain('alpha');
    });
  });
});