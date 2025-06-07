import { useData } from '../../utils/DataContext';

const VisualizationControls = ({
  selectedMetric,
  setSelectedMetric,
  timeBreakdown,
  setTimeBreakdown
}) => {
  const { studies, searchQuery, activeFilters, startYear, endYear } = useData();

  const visualizationMetrics = [
    { key: 'Stimulus Type', label: 'Stimulus Type' },
    { key: 'Musical Training', label: 'Musical Training' },
    { key: 'Participant Range', label: 'Participant Count' },
    { key: 'Channel Count Range', label: 'Channel Count' },
    { key: 'Paradigm Type', label: 'Paradigm Type' },
    { key: 'Top Features', label: 'Analyzed Features' }
  ];

  const getParticipantRange = (val) => {
    if (val == null) return null;
    if (val <= 10) return '1-10';
    if (val <= 25) return '11-25';
    if (val <= 50) return '26-50';
    if (val <= 100) return '51-100';
    return '100+';
  };

  const getChannelCountRange = (val) => {
    if (val == null) return null;
    const c = typeof val === 'number' ? val : parseInt(val, 10);
    if (isNaN(c)) return null;
    if (c <= 32) return '1-32';
    if (c <= 64) return '33-64';
    if (c <= 128) return '65-128';
    if (c <= 256) return '129-256';
    return '256+';
  };

  const getCurrentMetricData = () => {
    let filtered = studies.slice().filter(s => s.year >= startYear && s.year <= endYear);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(study =>
        Object.entries(study).some(([k, v]) => {
          if (['id', 'channelCountValue', 'passageLengthSeconds', 'participantsValue', 'normalizedFeatures'].includes(k)) return false;
          if (typeof v === 'string') return v.toLowerCase().includes(q);
          if (Array.isArray(v)) return v.some(x => typeof x === 'string' && x.toLowerCase().includes(q));
          return v != null && String(v).toLowerCase().includes(q);
        })
      );
    }

    Object.entries(activeFilters).forEach(([cat, vals]) => {
      if (vals.length && cat !== 'normalizedFeatures') {
        filtered = filtered.filter(study => {
          const v = study[cat];
          if (Array.isArray(v)) return v.some(x => vals.includes(x.toString()));
          return vals.includes(v?.toString());
        });
      }
    });

    const counts = {};
    let categories = [];
    const totalStudies = filtered.length;

    const categoryOrders = {
      'Stimulus Type': ['Complete Musical Piece','Musical Excerpt','Chords/Melody','Synthesized Music/Tone','Computer-Generated Music','Synthetic Rhythms','Music Videos','Percussion','Humming','Spoken Text'],
      'Musical Training': ['Extensive Training','Moderate Training','Minimal Training','Mixed Groups','No Formal Training','Not Reported','Not Applicable'],
      'Participant Range': ['1-10','11-25','26-50','51-100','100+'],
      'Channel Count Range': ['1-32','33-64','65-128','129-256','256+'],
      'Paradigm Type': ['Controlled','Naturalistic']
    };

    if (selectedMetric === 'Top Features') {
      const featCounts = {};
      filtered.forEach(s => {
        if (Array.isArray(s.normalizedFeatures)) s.normalizedFeatures.forEach(f => { featCounts[f] = (featCounts[f] || 0) + 1; });
      });
      categories = Object.entries(featCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f]) => f);
      categories.forEach(c => counts[c] = featCounts[c] || 0);
    } else {
      filtered.forEach(s => {
        let vals = [];
        if (selectedMetric === 'Participant Range') {
          const r = getParticipantRange(s.participantsValue);
          if (r) vals.push(r);
        } else if (selectedMetric === 'Channel Count Range') {
          const r = getChannelCountRange(s.channelCountValue);
          if (r) vals.push(r);
        } else {
          const v = s[selectedMetric];
          if (Array.isArray(v)) vals = v;
          else if (v != null) vals.push(v);
        }
        vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      });
      categories = categoryOrders[selectedMetric] || Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      categories.forEach(cat => { counts[cat] = counts[cat] || 0; });
    }

    return { categories, counts, totalStudies };
  };

  const { categories, counts, totalStudies } = getCurrentMetricData();

  return (
    <div className="visualization-controls">
      <h4>Data Visualization Controls</h4>
      <div className="metric-selection">
        <label htmlFor="metric-select">Metric to Visualize:</label>
        <select id="metric-select" value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}>
          {visualizationMetrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <label>
          <input type="checkbox" checked={timeBreakdown} onChange={e => setTimeBreakdown(e.target.checked)} /> Show Time Breakdown
        </label>
      </div>

      <div className="visualization-info">
        <strong>Showing:</strong> {selectedMetric}{timeBreakdown ? ' over time' : ' distribution'} ({categories.length} categories, {totalStudies} total studies)
      </div>

      {categories.length > 0 && (
        <div className="visualization-legend">
          <h5>Categories:</h5>
          <div className="legend-items">
            {categories.map((cat, i) => {
              const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#f97316'];
              return (
                <div key={cat} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span>{cat} ({counts[cat]})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizationControls;
