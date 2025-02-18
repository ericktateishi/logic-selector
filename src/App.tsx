import React from 'react';
import RuleBuilder from './components/RuleBuilder';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-gray-50">
        <RuleBuilder />
      </div>
    </ThemeProvider>
  );
}

export default App;