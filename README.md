# EEG Music Studies Database Visualization

To use the app: https://eeg-music-studies-visualization.vercel.app/

## Introduction

This project provides an interactive visualization interface for exploring a comprehensive database of electroencephalogram (EEG) studies related to music perception and cognition. It enables researchers, students, and music cognition enthusiasts to discover methodological approaches, experimental paradigms, and findings across different research studies spanning multiple decades.

The visualization makes it easy to explore relationships between experimental designs, musical stimuli, participant profiles, and EEG methodologies through a user-friendly interface with powerful filtering and search capabilities.

## Background

The intersection of neuroscience and music has grown significantly as a research field in recent decades. EEG studies provide valuable insights into how the brain processes and responds to musical stimuli, but the diversity of methodological approaches makes it challenging to compare and synthesize findings across studies.

This tool addresses this challenge by:

1. Aggregating data from 36 EEG-music studies in a standardized format
2. Providing intuitive visualization of temporal trends in research methods and topics
3. Enabling detailed filtering and searching across multiple dimensions of study design
4. Facilitating comparison of methodological approaches across similar studies

## Features

- **Timeline View**: Visualize studies across a selected time period with interactive year selection
- **List View**: Browse studies with a customizable year range
- **Advanced Filtering**: Filter studies by multiple criteria including:
  - Paradigm Type
  - Stimulus Type
  - Musical Training
  - EEG System
  - Channel Count
- **Standardized Channel Count Filtering**: Find all studies using a specific channel count regardless of variant descriptions
- **Intelligent Search**: Full-text search across all study fields
- **Visual Timeline Filtering**: See filtered studies highlighted directly on the timeline
- **Smart Navigation**: When search matches exist outside current timeline view, easily navigate to them
- **Detailed Study Cards**: View comprehensive information about each study with expandable details
- **CSV Export**: Export filtered data for further analysis

## Installation and Setup

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

### Installation for Local Use

1. Clone the repository:
   ```
   git clone https://github.com/jerhsiao/eeg-music-studies-visualization.git
   cd eeg-music-studies-visualization
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Place the EEG music studies database CSV file (`eeg-music-studies-database.csv`) in the `public` folder.

4. Start the development server:
   ```
   npm start
   ```

5. The application will be available at http://localhost:3000

## How to Use

### Timeline View
1. **Navigate the Timeline**: Click anywhere on the timeline to select a specific year
2. **View Study Distribution**: Height of bars indicates number of studies per year
3. **Examine Year Range**: Studies within ±5 years of the selected year are displayed
4. **Filter Studies**: Use the filter panel to refine results by various criteria
5. **See Filtered Results**: Darker bars indicate studies that match your current filters

### List View
1. **Set Custom Range**: Specify start and end years to view studies within that time period
2. **Apply Filters**: Use the filter options to narrow down results
3. **Sort Results**: Change the sort order using the "Sort By" dropdown
4. **Explore Studies**: Browse through study cards showing key information

### Filtering and Searching
1. **Text Search**: Use the search bar to find studies containing specific text
2. **Filter Dropdowns**: Select from standardized categories for Paradigm Type, Stimulus Type, etc.
3. **Musical Training**: Filter by standardized training categories
4. **Channel Count**: Filter by standardized channel counts (automatically groups similar entries)
5. **EEG System**: Search and select specific EEG systems

### Study Details
1. **Basic Information**: View study title, authors, year, and links
2. **Key Findings**: See summarized findings for each study
3. **Expand Details**: Click "Show More" to view comprehensive study information including:
   - Paradigm and stimulus details
   - Participant information
   - EEG methodology
   - Analysis techniques
   - Additional metadata

### Data Export
1. Click the "Export to CSV" button to download the currently filtered dataset
2. The exported file includes all metadata for further analysis

## Metadata Schema

The database follows a standardized schema with 29 columns:

| Field | Description | Example |
|-------|-------------|---------|
| Study Name | Title of the study | "Emotional Processing of Musical Sounds" |
| Authors | Study authors | "Smith, J., Jones, A." |
| Year | Publication year | 2018 |
| DOI/URL | Digital Object Identifier or web link | "10.1000/xyz123" |
| Dataset | Link to public dataset if available | "https://openneuro.org/datasets/xyz" |
| Study Description | Brief description of study purpose | "Investigation of neural responses to consonant vs. dissonant chords" |
| Paradigm Type | Experimental paradigm | "Oddball", "Passive Listening" |
| Stimulus Type | Category of musical stimulus | "Classical Music", "Isolated Chords" |
| Stimulus Description | Detailed description of stimuli | "Piano recordings of major and minor triads" |
| Composer | Composer of musical stimuli | "Bach", "Mozart" |
| Passage Name | Name of musical piece used | "Prelude in C Major" |
| Passage Length | Duration of stimuli | "45 seconds", "4:31" |
| Musical Features Analyzed | Features examined | "Harmony", "Rhythm", "Timbre" |
| Task Description | What participants were asked to do | "Press button when target tone heard" |
| Number of Participants | Sample size | "32 participants" |
| Demographics | Age range, gender, etc. | "18-25 years, 14 female, 16 male" |
| Musical Training | Musical experience of participants | "Extensive Training (>10 years)" |
| EEG System Used | Recording equipment | "BioSemi ActiveTwo" |
| Channel Count | Number of EEG channels | "64 channels, 10-10 system" |
| Sampling Rate | Recording sample rate | "512 Hz" |
| Recording Environment | Where EEG was recorded | "Sound-attenuated chamber" |
| Data Format | File format of recordings | ".bdf", ".edf" |
| Preprocessing | Signal processing steps | "ICA, Band-pass filter 0.1-30Hz" |
| EEG Analysis Techniques | Analysis methods | "ERP", "Time-frequency analysis" |
| Statistical Tests | Statistical approaches | "ANOVA", "Cluster-based permutation" |
| Event Markers | How events were marked | "MIDI triggers", "Manual annotation" |
| Findings Summarized | Key results | "N400 component larger for unexpected chords" |
| License | Data usage license | "CC-BY-4.0" |
| Publication | Citation for published paper | "Journal of Neuroscience, 40(2), 123-145" |

## Technical Implementation

### Technologies Used
- React (JavaScript library for building user interfaces)
- PapaParse (CSV parsing library)
- Lodash (JavaScript utility library)
- CSS3 (Styling with flexbox and grid for responsive layout)

### Data Processing
- CSV data is loaded asynchronously and parsed on application initialization
- Data cleaning and normalization is applied (handling empty values, standardizing formats)
- Derived fields are created for filtering efficiency (e.g., standardized channel counts)

### State Management
- React useState hooks manage application state
- Multiple state elements track:
  - Raw and processed data
  - UI view modes and states
  - Filter selections and search queries
  - Sorting preferences

### Performance Considerations
- Efficient filtering algorithms minimize re-renders
- Timeline visualization uses calculated positioning for accuracy
- Optimized search implementation preserves responsiveness with large datasets

## Contributing

Contributions to improve the visualization or extend the database are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- This visualization tool was created to support research in the field of music cognition and neuroscience
- The database compilation represents studies from multiple research institutions globally
- Special thanks to all researchers who have contributed to advancing our understanding of music processing in the brain

## Contact

For questions, suggestions, or collaboration opportunities, please contact jeremyjxhsiao@gmail.com.