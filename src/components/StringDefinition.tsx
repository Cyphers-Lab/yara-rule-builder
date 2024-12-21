import { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  Paper,
  Typography,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { YaraString } from '../types/yara';

interface StringDefinitionProps {
  string: YaraString;
  onChange: (updated: YaraString) => void;
  onDelete: () => void;
}

const StringDefinition = ({ string, onChange, onDelete }: StringDefinitionProps) => {
  const handleModifierChange = (modifier: keyof YaraString['modifiers']) => {
    onChange({
      ...string,
      modifiers: {
        ...string.modifiers,
        [modifier]: !string.modifiers[modifier],
      },
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Identifier"
            value={string.identifier}
            onChange={(e) => onChange({ ...string, identifier: e.target.value })}
            placeholder="string_identifier"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Select
              value={string.type}
              onChange={(e) => onChange({ ...string, type: e.target.value as 'text' | 'hex' })}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="hex">Hex</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Value"
            value={string.value}
            onChange={(e) => onChange({ ...string, value: e.target.value })}
            placeholder={string.type === 'hex' ? '48 45 4C 4C 4F' : 'String content'}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ mr: 2 }}>
              Modifiers:
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={string.modifiers.nocase || false}
                  onChange={() => handleModifierChange('nocase')}
                />
              }
              label="nocase"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={string.modifiers.wide || false}
                  onChange={() => handleModifierChange('wide')}
                />
              }
              label="wide"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={string.modifiers.ascii || false}
                  onChange={() => handleModifierChange('ascii')}
                />
              }
              label="ascii"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={string.modifiers.fullword || false}
                  onChange={() => handleModifierChange('fullword')}
                />
              }
              label="fullword"
            />
            <IconButton onClick={onDelete} color="error" sx={{ ml: 'auto' }}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StringDefinition;
