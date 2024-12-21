import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { v4 as uuidv4 } from 'uuid';
import StringDefinition from '../components/StringDefinition';
import ConditionBuilder from '../components/ConditionBuilder';
import RulePreview from '../components/RulePreview';
import { YaraRule, YaraString, YaraCondition } from '../types/yara';
import { generateYaraRule } from '../utils/yaraGenerator';
import { validateRuleInRealTime } from '../utils/yaraValidator';
import TestingInterface from '../components/TestingInterface';

const BuilderPage = () => {
  const location = useLocation();
  const [rule, setRule] = useState<YaraRule>({
    name: '',
    tags: [],
    meta: {
      author: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      version: '1.0',
    },
    strings: [],
    conditions: [],
  });

  const [newTag, setNewTag] = useState('');
  const [validationResult, setValidationResult] = useState<{isValid: boolean; errors: Array<{field: string; message: string}>}>({
    isValid: true,
    errors: []
  });

  const parseImportedRule = (content: string) => {
    const strings: YaraString[] = [];
    const conditions: YaraCondition[] = [];
    let tags: string[] = [];

    // Extract strings section
    const stringsMatch = content.match(/strings:([\s\S]*?)condition:/);
    if (stringsMatch) {
      const stringsSection = stringsMatch[1].trim();
      const stringLines = stringsSection.split('\n');
      
      stringLines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//')) return;
        
        // Handle hex strings with spaces and text strings with quotes
        const stringMatch = trimmedLine.match(/\$(\w+)\s*=\s*(?:{([^}]+)}|"([^"]+)")(?:\s+([a-z\s]+))?/);
        if (stringMatch) {
          const [_, identifier, hexValue, textValue, modifiersStr] = stringMatch;
          const modifiers: Record<string, boolean> = {};
          
          if (modifiersStr) {
            const modifiersList = modifiersStr.trim().split(/\s+/);
            modifiersList.forEach(mod => {
              modifiers[mod] = true;
            });
          }

          strings.push({
            id: uuidv4(),
            identifier,
            value: hexValue || textValue,
            type: hexValue ? 'hex' : 'text',
            modifiers,
          });
        }
      });
    }

    // Extract condition section
    const conditionMatch = content.match(/condition:([\s\S]*?)(?=(?:^rule|\s*$))/m);
    if (conditionMatch) {
      const conditionText = conditionMatch[1].trim();
      
      // Handle more complex conditions
      const conditionParts = conditionText
        .replace(/\band\b/gi, '\nand\n')
        .replace(/\bor\b/gi, '\nor\n')
        .replace(/\bnot\b/gi, '\nnot\n')
        .split('\n')
        .map(part => part.trim())
        .filter(Boolean);
      
      let currentOperator: 'and' | 'or' | 'not' | undefined;
      
      conditionParts.forEach((part, index) => {
        const lowerPart = part.toLowerCase();
        
        if (lowerPart === 'and' || lowerPart === 'or' || lowerPart === 'not') {
          currentOperator = lowerPart as 'and' | 'or' | 'not';
        } else {
          let type: 'string' | 'filesize' | 'custom' = 'custom';
          let value = part;

          if (part.startsWith('$')) {
            type = 'string';
          } else if (part.includes('filesize')) {
            type = 'filesize';
            value = part.replace('filesize', '').trim();
          }

          conditions.push({
            id: uuidv4(),
            type,
            value,
            operator: index === 0 ? undefined : currentOperator
          });
        }
      });
    }

    // Extract tags
    const tagsMatch = content.match(/rule\s+\w+\s*:\s*([\w\s]+)\s*{/);
    if (tagsMatch && tagsMatch[1]) {
      tags = tagsMatch[1].trim().split(/\s+/);
    }

    return { strings, conditions, tags };
  };

  useEffect(() => {
    // Handle imported rule if available
    if (location.state?.importedRule) {
      const importedRule = location.state.importedRule;
      try {
        const ruleName = importedRule.name.replace(/\.ya?ra?$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
        const { strings, conditions, tags } = parseImportedRule(importedRule.content);
        
        // Initialize the new rule
        const newRule: YaraRule = {
          name: ruleName,
          tags: tags,
          meta: {
            author: '',
            description: `Imported from ${importedRule.path}`,
            date: new Date().toISOString().split('T')[0],
            version: '1.0',
          },
          strings: strings,
          conditions: conditions,
        };

        // Set the rule
        setRule(newRule);
      } catch (error) {
        console.error('Error parsing imported rule:', error);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const result = validateRuleInRealTime(rule);
    setValidationResult(result);
  }, [rule]);

  const handleAddString = () => {
    setRule({
      ...rule,
      strings: [
        ...rule.strings,
        {
          id: uuidv4(),
          identifier: `str${rule.strings.length + 1}`,
          value: '',
          type: 'text',
          modifiers: {},
        },
      ],
    });
  };

  const handleAddCondition = () => {
    setRule({
      ...rule,
      conditions: [
        ...rule.conditions,
        {
          id: uuidv4(),
          type: 'string',
          value: '',
        },
      ],
    });
  };

  const handleStringChange = (updated: YaraString) => {
    setRule({
      ...rule,
      strings: rule.strings.map((str) =>
        str.id === updated.id ? updated : str
      ),
    });
  };

  const handleConditionChange = (updated: YaraCondition) => {
    setRule({
      ...rule,
      conditions: rule.conditions.map((cond) =>
        cond.id === updated.id ? updated : cond
      ),
    });
  };

  const handleDeleteString = (id: string) => {
    setRule({
      ...rule,
      strings: rule.strings.filter((str) => str.id !== id),
    });
  };

  const handleDeleteCondition = (id: string) => {
    setRule({
      ...rule,
      conditions: rule.conditions.filter((cond) => cond.id !== id),
    });
  };

  const handleAddTag = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && newTag.trim()) {
      setRule({
        ...rule,
        tags: [...new Set([...rule.tags, newTag.trim()])],
      });
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setRule({
      ...rule,
      tags: rule.tags.filter((tag) => tag !== tagToDelete),
    });
  };

  const handleMetaChange = (key: string, value: string) => {
    setRule({
      ...rule,
      meta: {
        ...rule.meta,
        [key]: value,
      },
    });
  };

  const handleCopyRule = () => {
    if (validationResult.isValid) {
      navigator.clipboard.writeText(generateYaraRule(rule));
    }
  };

  const handleDownloadRule = () => {
    if (validationResult.isValid) {
      const blob = new Blob([generateYaraRule(rule)], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rule.name || 'rule'}.yar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h2" gutterBottom>
        YARA Rule Builder
      </Typography>

      {validationResult.errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">Please fix the following errors:</Typography>
          <ul style={{ margin: 0 }}>
            {validationResult.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <TextField
              fullWidth
              label="Rule Name"
              value={rule.name}
              onChange={(e) => setRule({ ...rule, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Add Tags"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleAddTag}
              margin="normal"
              helperText="Press Enter to add tags"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {rule.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                />
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Meta Information
            </Typography>
            <TextField
              fullWidth
              label="Author"
              value={rule.meta.author}
              onChange={(e) => handleMetaChange('author', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={rule.meta.description}
              onChange={(e) => handleMetaChange('description', e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Version"
              value={rule.meta.version}
              onChange={(e) => handleMetaChange('version', e.target.value)}
              margin="normal"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Strings</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddString}
                variant="contained"
                size="small"
              >
                Add String
              </Button>
            </Box>
            {rule.strings.map((str) => (
              <StringDefinition
                key={str.id}
                string={str}
                onChange={handleStringChange}
                onDelete={() => handleDeleteString(str.id)}
              />
            ))}
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Conditions</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddCondition}
                variant="contained"
                size="small"
              >
                Add Condition
              </Button>
            </Box>
            {rule.conditions.map((condition, index) => (
              <ConditionBuilder
                key={condition.id}
                condition={condition}
                isFirst={index === 0}
                onChange={handleConditionChange}
                onDelete={() => handleDeleteCondition(condition.id)}
              />
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TestingInterface rule={rule} />
          <Typography variant="h6" gutterBottom>
            Preview
          </Typography>
          <RulePreview
            ruleContent={generateYaraRule(rule)}
            onCopy={handleCopyRule}
            onDownload={handleDownloadRule}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BuilderPage;
