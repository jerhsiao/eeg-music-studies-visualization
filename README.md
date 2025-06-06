# EEG Music Studies Database Visualization

To use the app: https://eeg-music-studies-visualization.vercel.app/

## Introduction

This project provides an interactive visualization interface for exploring a comprehensive database of electroencephalogram (EEG) studies related to music perception and cognition. It enables researchers, students, and music cognition enthusiasts to discover methodological approaches, experimental paradigms, and findings across different research studies spanning multiple decades.

When browsing the visualization, you'll notice multiple study cards belonging to the same parent research but focusing on different experimental conditions. This choice emphasizes the unique characteristics of each experimental condition rather than merely the publication-level details.

The visualization makes it easy to explore relationships between experimental designs, musical stimuli, participant profiles, and EEG methodologies through a user-friendly interface with powerful filtering, search, and data visualization capabilities.

## Background

The intersection of neuroscience and music has grown significantly as a research field in recent decades. EEG studies provide valuable insights into how the brain processes and responds to musical stimuli, but the diversity of methodological approaches makes it challenging to compare and synthesize findings across studies.

This tool addresses this challenge by:

1. Aggregating data from **197 experimental conditions** across **44 unique studies** in a standardized format
2. Providing intuitive visualization of temporal trends in research methods and topics
3. Enabling detailed filtering and searching across multiple dimensions of study design
4. Facilitating comparison of methodological approaches across similar studies
5. Offering interactive data visualization for exploring patterns and distributions

## Features

### Interactive Timeline & Navigation
- **Full Timeline View**: Complete 1975-2025 visualization with clickable year selection and automatic 10-year viewing windows centered on selected years
- **Visual Study Distribution**: Bar heights indicate study counts per year, with light blue showing all studies and dark blue highlighting filtered results
- **Smart Range Controls**: Independent year range filtering for study cards while maintaining full timeline scale
- **Expandable Study Cards**: Comprehensive study information with collapsible detailed methodology sections

### Advanced Multi-Dimensional Filtering
- **Categorical Filters**: Dropdown selections for Paradigm Type (Controlled/Naturalistic), Stimulus Type (11+ categories from controlled tones to complete musical pieces), and standardized Musical Training levels (Extensive, Moderate, Minimal, Mixed Groups, etc.)
- **Searchable Technical Specs**: Autocomplete fields for EEG Systems (35+ documented systems) and Channel Counts with intelligent grouping of variant descriptions
- **Participant Demographics**: Filter by count ranges (1-10, 11-25, 26-50, 51-100, 100+) and training backgrounds
- **Intelligent Feature Analysis**: Organized into 5 research-relevant categories:
  - **EEG Frequency Bands**: Delta, theta, alpha, beta, gamma analysis
  - **Cognitive & Emotional**: Attention, emotion, valence, arousal measures  
  - **Musical Elements**: Tempo, harmony, melody processing
  - **Brain Activity**: Coherence, power, ERPs, synchronization studies
  - **Advanced Analysis**: Expectancy, imagery, spectral analysis, localization
- **Real-time Filter Management**: Active filter tags with individual removal, complete reset options, and live result counts

### Comprehensive Search & Discovery
- **Cross-Field Text Search**: Simultaneous searching across all 29 metadata fields with instant highlighting of matching studies on timeline
- **Visual Filter Feedback**: Timeline bars dynamically update to show filtered vs. total study distributions
- **Smart Sorting**: Multiple sort options including chronological, participant count, and passage length with intelligent handling of missing data

### Interactive Data Visualizer
- **Dual Visualization Modes**: Toggle between timeline navigation and comprehensive chart analysis with smooth transitions
- **Multi-Metric Analysis**: Bar chart distributions for 6+ key metrics including stimulus types, training levels, participant ranges, channel configurations, paradigm types, and top analyzed features
- **Time Series Capability**: Optional year-by-year breakdown showing how metric distributions evolved over decades of research
- **Interactive Chart Elements**: Hover details, color-coded categories, comprehensive legends with study counts, and responsive design for different screen sizes

### Export & Research Tools
- **Smart CSV Export**: Filtered datasets with automatically generated descriptive filenames including date ranges, search terms, and filter criteria
- **Complete Metadata Preservation**: All 29 standardized fields exported for further statistical analysis or meta-studies
- **Research-Ready Format**: Standardized data structure compatible with common analysis tools and statistical software

## Installation and Setup for Running Locally

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

### Installation

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

### Quick Start
**Timeline Navigation**: Click any year on the timeline (1975-2025) to select it and automatically view a 10-year window of studies centered on that year. The blue highlighted region shows your current viewing range, while the circle indicator marks your selected year.

**Data Visualizer**: Click the "Data Visualizer" button to switch from timeline to interactive charts. Choose metrics from the dropdown (Stimulus Type, Musical Training, etc.), toggle "Time Breakdown" for year-by-year analysis, and hover over bars for detailed information.

**Filtering & Search**: Use the comprehensive filter panel to narrow results by any combination of study characteristics. The search bar works across all fields simultaneously. Filter results appear as dark blue bars on the timeline and update study cards in real-time.

**Study Exploration**: Browse study cards below the timeline, click "Show More" for detailed methodology, and use the "Export to CSV" button to download your filtered dataset with smart filename generation.

### Advanced Features
**Custom Year Ranges**: Use Start/End Year controls for precise temporal filtering independent of timeline visualization. The selected year automatically moves to the center of your custom range.

**Filter Management**: Active filters appear as removable tags. Use "Clear All Filters" for quick reset, or remove individual filters by clicking the × on each tag.

**Sorting & Organization**: Change result order using the Sort dropdown, with options for chronological, participant count, and passage length sorting that intelligently handles missing data.

## Database Statistics

- **Total Entries**: 197 experimental conditions
- **Unique Studies**: 44 research publications
- **Time Span**: 1975-2025 (50 years of research)
- **Metadata Fields**: 29 standardized columns
- **Feature Categories**: 15+ standardized analysis categories
- **EEG Systems**: 35+ unique recording systems documented
- **Stimulus Types**: 11 major categories from controlled tones to naturalistic music

## Metadata Schema

The database follows a comprehensive 29-field schema designed for optimal searchability and comparison:

| Field | Description | Example |
|-------|-------------|---------|
| Study Name | Title of the study | "Effect of Music and Biofeedback on Alpha Brainwave Rhythms and Attentiveness" |
| Authors | Study authors | "Michael Wagner" |
| Year | Publication year | 1975 |
| DOI/URL | Digital Object Identifier or web link | "https://doi.org/10.2307/3345198" |
| Dataset | Link to public dataset if available | "NA" |
| Study Description | Brief description of study purpose | "This study investigates alpha rhythm production in musicians vs. nonmusicians during passive listening to two musical excerpts (slow and brisk tempo) and silence." |
| Paradigm Type | Experimental paradigm | "Controlled" |
| Stimulus Type | Category of musical stimulus | "Musical Excerpt" |
| Stimulus Description | Detailed description of stimuli | "Slow tempo, orchestral" |
| Composer | Composer of musical stimuli | "Camille Saint-Saëns" |
| Passage Name | Name of musical piece used | "Saint-Saëns: Symphony No. 3 in C Minor, Op. 78 (2nd Movement)" |
| Passage Length | Duration of stimuli | "2 minutes" |
| Musical Features Analyzed | Features examined | "Tempo, Pulse, Cortical Activation (Alpha Rhythms), Attentiveness" |
| Task Description | What participants were asked to do | "EEG-monitored passive listening with and without alpha biofeedback; subjects rated attentiveness after each excerpt" |
| Number of Participants | Sample size | "60" |
| Demographics | Age range, gender, etc. | "Undergraduate students from Florida State University; musicians and nonmusicians" |
| Musical Training | Musical experience of participants | "Mixed Groups" |
| EEG System Used | Recording equipment | "Aquarius Electronics 'Alphaphone Brainwave Analyzer'" |
| Channel Count | Number of EEG channels | "19 channels, 10–20 system" |
| Findings | Key results | "Musicians produced significantly more alpha than nonmusicians; no significant difference between musical stimuli or feedback condition; attentiveness ratings were higher for music than silence, but alpha rhythm did not correlate with attentiveness reports" |
| Sampling Rate | Recording sample rate | "Not Reported" |
| Recording Environment | Where EEG was recorded | "Sound-treated room at FSU School of Music" |
| Data Format | File format of recordings | "Not Reported" |
| Preprocessing | Signal processing steps | "Manual alpha duration timing using EEG-linked timer; no digital preprocessing reported" |
| License | Data usage license | "Copyright by the Journal of Research in Music Education (MENC), 1975" |
| EEG Analysis Techniques | Analysis methods | "Manual timing of alpha rhythm duration using EEG-linked digital timer" |
| Statistical Tests | Statistical approaches | "Repeated-measures ANOVA" |
| Event Markers | How events were marked | "Math problems used to block alpha before each aural condition" |
| Publication | Citation for published paper | "Journal of Research in Music Education 23(1) 3-13" |

### Standardized Feature Categories

Musical features are automatically categorized into standardized groups:

- **EEG Frequency Bands**: Delta, theta, alpha, beta, gamma
- **Cognitive & Emotional Metrics**: Attention, emotion, valence, arousal
- **Musical Elements**: Tempo, harmony, melody
- **Brain Activity Measures**: Coherence, power, ERPs, synchronization
- **Advanced Analysis**: Expectancy, imagery, spectral analysis, localization

## Code Structure

The application is organized into modular React components:

- **Main**: Top-level component handling overall layout, data loading, and coordination of subcomponents.
- **StudyCard**: Displays an individual study’s details, with expandable sections for more information.
- **TimelineContainer**: Orchestrates the timeline view and embedded data visualizer. It now replaces the old single `Timeline` component.
  - **TimelineBar**: Renders the year-by-year bars that show how many studies fall into each year.
  - **DataVisualizer**: Displays a metric-based breakdown (e.g., “Musical Training,” “Stimulus Type,” etc.) as stacked bars or grouped charts.
  - **VisualizationControls**: Provides UI controls (metric selector, time-breakdown toggle, etc.) for driving `DataVisualizer`.
- **FilterComponents**: Comprehensive filtering UI, including:
  - **StandardFilter** (dropdown selections)
  - **SearchableFilter** (autocomplete inputs)
  - **MusicalFeaturesFilter** (multi-select feature categories)
  - **SortOptionsFilter** (sorting choices: year, participants, passage length, etc.)
  - **YearRangeFilter** (start/end year sliders or inputs)

### State Management

- **React Context API** (DataContext.js) for global state management
- **Reducer Pattern** (appReducer.js) for predictable state changes
- **Centralized Data Processing** with efficient filtering algorithms
- **Real-time Updates** for responsive user interactions

## Technical Implementation

### Technologies Used
- **React** (JavaScript library for building user interfaces)
- **PapaParse** (CSV parsing library)
- **Lodash** (JavaScript utility library for data operations)
- **CSS3** (Modern styling with flexbox, grid, and animations)

### Data Processing
- **Asynchronous Loading**: Fetch JSON on mount, with “loading” and “error” states surfaced in `Main`.
- **Automated Categorization**:  
  - “Top Features,” “Participant Range,” and “Channel Count Range” are derived fields.  
  - Helper functions (`getParticipantRange`, `getChannelCountRange`) bucket raw values into categories.
- **Standardized Formatting**: All filterable fields use consistent string formats or normalized arrays to speed up lookups.
- **Derived Fields**:  
  - Quantities like `participantsValue` and `normalizedFeatures` get pre-computed so that filtering in `useMemo` runs fast.

### Performance Optimizations
- **Memoized Calculations** (`useMemo` everywhere)  
  - `currentMetricData` (counts + categories for a chosen metric)  
  - `timeSeriesData` (per-year breakdown when “time-breakdown” mode is on)  
  - `visualizationMetrics` itself is defined once (either module-scope or wrapped in a `useMemo` with `[]`) to ensure stable references.
- **Efficient Filtering**:  
  - All filters (search text, dropdowns, year range) apply in a single pass through `data.studies` inside each memo.  
  - We avoid deep clones—just a filtered array is created, then counts are tallied.
  

## Contributing

Contributions to improve the visualization or extend the database are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution
- Additional EEG studies and experimental conditions
- Enhanced data visualization features
- Improved filtering capabilities
- Mobile responsiveness improvements
- Accessibility enhancements

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- This visualization tool was created to support research in the field of music cognition and neuroscience
- The database compilation represents studies from multiple research institutions globally
- Special thanks to all researchers who have contributed to advancing our understanding of music processing in the brain

## Contact

For questions, suggestions, or collaboration opportunities, please contact jeremyjxhsiao@gmail.com.