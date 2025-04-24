import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './EEGMusicStudiesApp.css';

const BasicEEGMusicApp = () => {
  // Basic state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load data - very simplified approach
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("Attempting to fetch CSV...");
        
        const response = await fetch('/eeg-music-studies-database.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log("CSV fetched successfully. First 100 chars:", text.substring(0, 100));
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("Parsing complete. Found rows:", results.data.length);
            console.log("Sample row:", results.data[0]);
            
            // Simple data cleaning
            const cleanedData = results.data
              .filter(entry => entry && typeof entry === 'object')
              .map((entry, index) => {
                // Basic cleaning according to MVP rules
                const cleaned = {};
                
                Object.entries(entry).forEach(([key, value]) => {
                  // Rule 1 & 2: Trim and check for empty/NA values
                  const trimmed = typeof value === 'string' ? value.trim() : value;
                  const lowerVal = typeof trimmed === 'string' ? trimmed.toLowerCase() : '';
                  
                  if (trimmed !== '' && trimmed !== null && trimmed !== undefined && 
                      lowerVal !== 'na' && lowerVal !== 'not specified') {
                    cleaned[key] = trimmed;
                  }
                });
                
                // Add ID and handle year specifically (Rule 3)
                return {
                  ...cleaned,
                  id: `study-${index}`,
                  year: cleaned.Year ? parseInt(cleaned.Year, 10) : null
                };
              });
            
            setData(cleanedData);
            setLoading(false);
          },
          error: (error) => {
            console.error("CSV parsing error:", error);
            setError(`Error parsing CSV: ${error.message}`);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("File loading error:", err);
        setError(`Error loading data: ${err.message}`);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Simple rendering for testing
  if (loading) {
    return <div className="loading">Loading data...</div>;
  }
  
  if (error) {
    return (
      <div className="error">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <p>Check console for more details.</p>
      </div>
    );
  }
  
  return (
    <div className="eeg-music-container">
      <header className="header">
        <h1>EEG Music Studies Database</h1>
      </header>
      
      <div className="status-info">
        <p>Successfully loaded {data.length} studies.</p>
        {data.length > 0 && (
          <div>
            <h3>Sample Study Data:</h3>
            <pre>{JSON.stringify(data[0], null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicEEGMusicApp;