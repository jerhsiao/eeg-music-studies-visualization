import React from 'react';
import { useData } from '../../utils/DataContext';
import { ACTION_TYPES } from '../../utils/appReducer';
import './StudyCard.css';

const StudyCard = ({ study }) => {
  const { expandedStudies, dispatch } = useData();
  const isExpanded = expandedStudies.has(study.id);
  
  const formatList = (items) => {
    if (!items) return null;
    
    const list = Array.isArray(items) ? items : [items];
    return list.join(', ');
  };
  
  const toggleExpanded = () => {
    dispatch({
      type: ACTION_TYPES.TOGGLE_EXPANDED_STUDY,
      payload: study.id
    });
  };
  
  const formatURL = (url) => {
    if (!url) return null;
    
    if (url.startsWith('10.')) {
      return `https://doi.org/${url}`;
    }
    
    return url;
  };
  
  const handleLinkClick = (e, url) => {
    e.preventDefault();
    
    if (!url) return;
    
    try {
      window.open(
        url, 
        '_blank', 
        'noopener,noreferrer'
      );
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };
  
  const getFeatureCategories = () => {
    if (!study.normalizedFeatures || !Array.isArray(study.normalizedFeatures)) {
      return [];
    }
    
    return study.normalizedFeatures;
  };
  
  return (
    <div className="study-card">
      <div className="study-header">
        <h3 className="study-title">
          {study['Study Name']} ({study.year})
        </h3>
        <p className="study-authors">Authors: {study.Authors}</p>
        
        <div className="study-links">
          {study['DOI/URL'] && (
            <a
              href={formatURL(study["DOI/URL"])}
              onClick={(e) => handleLinkClick(e, formatURL(study["DOI/URL"]))}
              className="study-link"
            >
              View Study
            </a>
          )}
          
          {study['Dataset'] && (
            <a
              href={formatURL(study["Dataset"])}
              onClick={(e) => handleLinkClick(e, formatURL(study["Dataset"]))}
              className="study-link dataset"
            >
              View Dataset
            </a>
          )}
        </div>
      </div>
      
      <div className="study-content">
        {study['Study Description'] && (
          <p className="study-description">{study['Study Description']}</p>
        )}
        
        {study['Stimulus Description'] && (
          <p className="stimulus-description">{study['Stimulus Description']}</p>
        )}
        
        {study['Findings'] && (
          <div className="findings">
            <strong>Findings:</strong> {study['Findings']}
          </div>
        )}
        
        {getFeatureCategories().length > 0 && (
          <div className="study-features-section">
            <div className="study-feature-tags">
              <span className="features-heading">Features Analyzed:</span>
              {getFeatureCategories().map(feature => (
                <span key={`${study.id}-${feature}`} className="study-feature-tag">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <button
          type="button"
          className="details-toggle"
          onClick={toggleExpanded}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
        
        {isExpanded && (
          <div className="study-details">
            {study['Publication'] && (
              <div className="detail-item">
                <span className="detail-label">Publication:</span> {study['Publication']}
              </div>
            )}
            
            {study['Paradigm Type'] && (
              <div className="detail-item">
                <span className="detail-label">Paradigm Type:</span> {formatList(study['Paradigm Type'])}
              </div>
            )}
            
            {(study['Stimulus Type'] || study['Composer'] || study['Passage Name'] || study['Passage Length']) && (
              <div className="detail-group">
                <h4>Stimulus Details</h4>
                
                {study['Stimulus Type'] && (
                  <div className="detail-item">
                    <span className="detail-label">Stimulus Type:</span> {study['Stimulus Type']}
                  </div>
                )}
                
                {study['Composer'] && (
                  <div className="detail-item">
                    <span className="detail-label">Composer:</span> {study['Composer']}
                  </div>
                )}
                
                {study['Passage Name'] && (
                  <div className="detail-item">
                    <span className="detail-label">Passage Name:</span> {study['Passage Name']}
                  </div>
                )}
                
                {study['Passage Length'] && (
                  <div className="detail-item">
                    <span className="detail-label">Passage Length:</span> {study['Passage Length']}
                  </div>
                )}
              </div>
            )}
            
            {study['Musical Features Analyzed'] && (
              <div className="detail-group">
                <h4>Musical Analysis</h4>
                <div className="detail-item">
                  <span className="detail-label">Features Analyzed:</span> 
                  {formatList(study['Musical Features Analyzed'])}
                </div>
              </div>
            )}
            
            {(study['Task Description'] || study['Number of Participants'] || 
              study['Demographics'] || study['Musical Training']) && (
              <div className="detail-group">
                <h4>Participant Information</h4>
                
                {study['Task Description'] && (
                  <div className="detail-item">
                    <span className="detail-label">Task:</span> {study['Task Description']}
                  </div>
                )}
                
                {study['Number of Participants'] && (
                  <div className="detail-item">
                    <span className="detail-label">N (Participants):</span> {study['Number of Participants']}
                  </div>
                )}
                
                {study['Demographics'] && (
                  <div className="detail-item">
                    <span className="detail-label">Demographics:</span> {study['Demographics']}
                  </div>
                )}
                
                {study['Musical Training'] && (
                  <div className="detail-item">
                    <span className="detail-label">Musical Training:</span> {study['Musical Training']}
                  </div>
                )}
              </div>
            )}
            
            {(study['EEG System Used'] || study['Channel Count'] || study['Sampling Rate'] || 
              study['Recording Environment'] || study['Data Format']) && (
              <div className="detail-group">
                <h4>EEG Methodology</h4>
                
                {study['EEG System Used'] && (
                  <div className="detail-item">
                    <span className="detail-label">EEG System:</span> {study['EEG System Used']}
                  </div>
                )}
                
                {study['Channel Count'] && (
                  <div className="detail-item">
                    <span className="detail-label">Channels:</span> {study['Channel Count']}
                  </div>
                )}
                
                {study['Sampling Rate'] && (
                  <div className="detail-item">
                    <span className="detail-label">Sampling Rate:</span> {study['Sampling Rate']}
                    {!isNaN(study['Sampling Rate']) && ' Hz'}
                  </div>
                )}
                
                {study['Recording Environment'] && (
                  <div className="detail-item">
                    <span className="detail-label">Recording Environment:</span> {study['Recording Environment']}
                  </div>
                )}
                
                {study['Data Format'] && (
                  <div className="detail-item">
                    <span className="detail-label">Data Format:</span> {study['Data Format']}
                  </div>
                )}
              </div>
            )}
            
            {(study['Preprocessing'] || study['EEG Analysis Techniques'] || 
              study['Statistical Tests'] || study['Event Markers']) && (
              <div className="detail-group">
                <h4>Analysis Methods</h4>
                
                {study['Preprocessing'] && (
                  <div className="detail-item">
                    <span className="detail-label">Preprocessing:</span> 
                    {formatList(study['Preprocessing'])}
                  </div>
                )}
                
                {study['EEG Analysis Techniques'] && (
                  <div className="detail-item">
                    <span className="detail-label">Analysis Techniques:</span> 
                    {formatList(study['EEG Analysis Techniques'])}
                  </div>
                )}
                
                {study['Statistical Tests'] && (
                  <div className="detail-item">
                    <span className="detail-label">Statistical Tests:</span> 
                    {formatList(study['Statistical Tests'])}
                  </div>
                )}
                
                {study['Event Markers'] && (
                  <div className="detail-item">
                    <span className="detail-label">Event Markers:</span> 
                    {formatList(study['Event Markers'])}
                  </div>
                )}
              </div>
            )}
            
            {study['License'] && (
              <div className="detail-item license">
                <span className="detail-label">License:</span> {study['License']}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyCard;