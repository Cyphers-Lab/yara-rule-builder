import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { YaraRule } from '../types/yara';
import { testRule } from '../utils/yaraValidator';

interface TestingInterfaceProps {
  rule: YaraRule;
}

const TestingInterface: React.FC<TestingInterfaceProps> = ({ rule }) => {
  const [sampleData, setSampleData] = useState('');
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleTest = () => {
    const result = testRule(rule, sampleData);
    setTestResult(result);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Test Your Rule
      </Typography>
      
      <TextField
        fullWidth
        label="Sample Data"
        multiline
        rows={4}
        value={sampleData}
        onChange={(e) => setSampleData(e.target.value)}
        placeholder="Enter sample data to test against your rule..."
        sx={{ mb: 2 }}
      />
      
      <Button
        variant="contained"
        onClick={handleTest}
        disabled={!sampleData.trim() || rule.strings.length === 0}
        sx={{ mb: 2 }}
      >
        Test Rule
      </Button>

      {testResult !== null && (
        <Alert severity={testResult ? "success" : "warning"} sx={{ mt: 2 }}>
          {testResult 
            ? "Rule matched the sample data successfully!"
            : "Rule did not match the sample data."
          }
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Tips:
          <ul>
            <li>Enter text that you expect your rule to match or not match</li>
            <li>Test both positive and negative cases</li>
            <li>For hex strings, enter the data in hexadecimal format</li>
          </ul>
        </Typography>
      </Box>
    </Paper>
  );
};

export default TestingInterface;
