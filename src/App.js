import React from 'react';
import Main from './components/Main/Main';
import { DataProvider } from './utils/DataContext';
import './styles/variables.css';
import './styles/layout.css';
import './styles/common.css';

function App() {
  return (
    <div className="App">
      <DataProvider>
        <Main />
      </DataProvider>
    </div>
  );
}

export default App;