# EEG Music Studies Database: Data Entry Guidelines

This document provides standardized instructions for entering data into the EEG Music Studies Database to ensure consistency and optimal processing across all entries.

## General Guidelines

- Enter all data in the CSV database, which will be converted to JSON for the application
- Fill all fields when information is available
- Use "NA", "Not Specified", or "Not Reported" for unavailable information (these will be filtered out during processing)
- Empty fields are acceptable and will be handled gracefully
- For fields requiring multiple values, use comma, semicolon, or slash separation (e.g., "value1, value2; value3/value4")

## Field-Specific Guidelines

### Basic Information Fields

**Study Name:** Use the full, original title of the study without quotation marks
- Required field - entries without study names will be rejected

**Authors:** Full names, comma-separated for multiple authors
- Will be stored as single string, not processed as array

**Year:** Enter as a four-digit integer (1900-2030)
- Required field - entries outside this range will be rejected
- Examples: 2023, 1995, 2025

**DOI/URL:** Must start with valid prefix
- DOIs: "10.xxxx/xxxxx" format
- URLs: "http://" or "https://" prefix required
- Invalid formats will be filtered out during processing

**Dataset:** Same validation as DOI/URL, _plus_ the following special phrases are also accepted:
- “Available upon request”
- “Not publicly provided”
- “NA”

Must otherwise start with “http://”, “https://”, or “10.” to be accepted

### Study Design Fields

**Paradigm Type:** Will be processed as array field
- Common values: "Controlled", "Naturalistic"
- Multiple values supported: "Controlled, Naturalistic"

**Stimulus Type:** Will be processed as array field
- Standard categories include: "Complete Musical Piece", "Musical Excerpt", "Chords/Melody", "Synthesized Music/Tone", "Computer-Generated Music", "Synthetic Rhythms", "Music Videos", "Percussion", "Humming", "Spoken Text"

**Composer:** Stored as single string
- Full names, comma-separated for multiple composers

### Time and Measurement Information

**Passage Length:** Flexible parsing supports multiple formats
- Simple format: "30 seconds", "2 minutes", "1.5 minutes"
- Time format: "2:30", "1:23:45" (MM:SS or HH:MM:SS)
- Abbreviated: "2m30s", "90s", "2min"
- Ranges: "2-3 minutes", "30-60 seconds" (will average the range)
- Approximations: "~2 minutes", "≈30 seconds"
- Invalid entries will result in -1 for numeric processing

**Number of Participants:** Flexible extraction from text
- Simple integer: "24", "30"
- With context: "N=30", "20 participants", "32 (16M, 16F)"
- Ranges: "20-25 participants" (will use first number)
- Plus-minus: "25 ± 5" (will use base number)
- Written numbers: "twenty", "thirty" (limited support)
- Invalid entries result in -1 for processing

### EEG Technical Information

**EEG System Used:** Stored as provided
- Will be available for autocomplete filtering
- Format: "[Manufacturer] [Model]" recommended

**Channel Count:** Flexible parsing for numeric extraction
- Preferred format: "64 channels", "128 electrodes"
- Also accepts: "64", "256-channel system"
- Numeric value extracted for range categorization (1-32, 33-64, 65-128, 129-256, 256+)

**Sampling Rate:** Stored as provided
- Format: "[number] Hz" recommended for clarity

### Analysis Fields (Processed as Arrays)

**Musical Features Analyzed:** Automatically categorized into standardized features
- Will be split on commas, semicolons, and slashes
- Automatically mapped to categories:
  - **EEG Frequency Bands**: delta, theta, alpha, beta, gamma
  - **Cognitive/Emotional**: attention, emotion, valence, arousal
  - **Musical Elements**: tempo, harmony, melody
  - **Brain Activity**: coherence, power, erp, synchronization
  - **Advanced Analysis**: expectancy, imagery, envelope, spectral, localization

**Preprocessing:** Processed as array
- Include filter settings, artifact rejection methods, etc.
- Multiple methods supported with comma/semicolon separation

**EEG Analysis Techniques:** Processed as array
- Examples: "FFT", "Wavelet Transform", "ICA", "Event-Related Potentials"

**Statistical Tests:** Processed as array
- Examples: "ANOVA", "t-test", "Pearson correlation", "Repeated-measures ANOVA"

**Event Markers:** Processed as array
- List all event types marked in the EEG data

### Musical Training Standardization

**Musical Training:** Use standardized categories for optimal filtering. You can layer mixed groups with a training group like so: Mixed Groups, Moderate Training
- "Extensive Training (+10 years)"
- "Moderate Training (5-10 years)" 
- "Minimal Training (1-5 years)"
- "Mixed Groups"
- "No Formal Training"
- "Not Reported"
- "Not Applicable"

Non-standard entries will be preserved but may not filter optimally.

## Automatic Data Processing

The system automatically:

1. **Validates required fields**: Study Name and Year must be present and valid
2. **Extracts numeric values**: Participant counts, channel counts, and passage lengths
3. **Normalizes features**: Musical features mapped to standardized categories
4. **Cleans text**: Removes control characters, extra whitespace, and standardizes formatting
5. **Processes arrays**: Splits comma/semicolon/slash-separated values into searchable arrays
6. **Filters invalid data**: Removes "NA", "Not Specified", empty values, and invalid URLs
7. **Generates derived fields**: Participant ranges, channel count ranges, passage length in seconds

## Data Quality Notes

- Entries missing Study Name or valid Year will be rejected during processing
- Invalid URLs/DOIs will be filtered out but won't cause entry rejection
- Unparseable time/participant data will default to -1 (excluded from numeric filtering)
- The system is designed to handle inconsistent formatting gracefully
- Processing errors are logged but don't prevent valid data from being included

## Data Validation System

### Automated Validation with `dataValidation.js`

The database includes a comprehensive validation system (`src/testing/dataValidation.js`) that ensures data integrity before deployment. This Node.js script performs automated quality assurance on the entire dataset and provides statistics on the gathered data. 

#### Running the Validation Script

```bash
node src/testing/dataValidation.js [path/to/csv/file]
```

If no path is provided, it defaults to `public/eeg-music-studies-database.csv`.

#### Validation Process

The script performs the following checks:

1. **CSV Loading & Parsing**: Validates file existence and CSV structure integrity
2. **Data Normalization**: Processes all entries through the same normalization pipeline used by the web application
3. **Field Validation**: Checks all entries for:
   - Required fields (Study Name, Year)
   - Valid year ranges (1900-2030)
   - Proper URL/DOI formatting
   - Participant count extraction success
   - Channel count extraction success
   - Time parsing accuracy
   - Feature categorization success

#### Validation Report

The script generates a comprehensive report including:

- **Summary Statistics**: Total rows processed, success/failure counts, error/warning tallies
- **Processing Success Rates**: Percentage of successful extractions for participants, channels, time data, and features
- **Year Range**: Minimum and maximum years in the dataset
- **Error Details**: Specific issues that must be fixed (missing required fields, invalid years, malformed URLs)
- **Warning Details**: Issues that should be reviewed (extraction failures, unusual values)
- **Feature Analysis**: Top 10 most commonly analyzed features with occurrence counts

#### Example Output

```
EEG Music Studies CSV Validator

Target file: .../EEGMusicStudiesApp/eeg-music-app/public/eeg-music-studies-database.csv

Starting CSV Data Validation...

Loading CSV file:.../EEGMusicStudiesApp/eeg-music-app/public/eeg-music-studies-database.csv
Found 198 lines (including header)
Found 29 columns
Parsed 197 studies

Validating studies...

VALIDATION REPORT
==================================================

SUMMARY:
Total rows processed: 197
Successfully validated: 197
Errors: 0
Warnings: 2

PROCESSING STATISTICS:
Participant extraction: 194/197 (98%)
Channel extraction: 195/197 (99%)
Time extraction: 197/197 (100%)
Feature categorization: 197/197 (100%)
Year range: 1975 - 2025

WARNINGS (Review Recommended):
  Row 197: Could not extract channel count from: "NA, 10–20 system" (The power of music: impact on EEG signals)
  Row 198: Could not extract channel count from: "NA, 10–20 system" (The power of music: impact on EEG signals)

CONCLUSION:
All data passed validation! Ready for production use.
Found 2 warnings that should be reviewed.
```

#### Quality Assurance Workflow

1. **Before adding new data**: Run validation to establish baseline
2. **After data entry**: Re-run validation to identify any issues introduced
3. **Before deployment**: Ensure zero errors in validation report
4. **Regular maintenance**: Periodic validation runs to catch data drift

The validation system ensures that all data meets the processing requirements and helps maintain consistent data quality across the entire database.