import React from 'react';
import Main from './components/Main/Main';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { DataProvider } from './utils/DataContext';
import './styles/styles.css';


function App() {
  return (
    <div className="App">
      <DataProvider>
        <ErrorBoundary>
          <Main />
        </ErrorBoundary>
      </DataProvider>
    </div>
  );
}

export default App;