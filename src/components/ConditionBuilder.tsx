import {
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Grid,
  InputLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { YaraCondition } from '../types/yara';

interface ConditionBuilderProps {
  condition: YaraCondition;
  isFirst: boolean;
  onChange: (updated: YaraCondition) => void;
  onDelete: () => void;
}

const ConditionBuilder = ({
  condition,
  isFirst,
  onChange,
  onDelete,
}: ConditionBuilderProps) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        {!isFirst && (
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Operator</InputLabel>
              <Select
                value={condition.operator || 'and'}
                label="Operator"
                onChange={(e) =>
                  onChange({ ...condition, operator: e.target.value as 'and' | 'or' | 'not' })
                }
              >
                <MenuItem value="and">AND</MenuItem>
                <MenuItem value="or">OR</MenuItem>
                <MenuItem value="not">NOT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={isFirst ? 5 : 4}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={condition.type}
              label="Type"
              onChange={(e) =>
                onChange({
                  ...condition,
                  type: e.target.value as 'string' | 'filesize' | 'custom',
                })
              }
            >
              <MenuItem value="string">String Match</MenuItem>
              <MenuItem value="filesize">File Size</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={isFirst ? 6 : 4}>
          <TextField
            fullWidth
            label="Value"
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder={
              condition.type === 'string'
                ? '$string_id'
                : condition.type === 'filesize'
                ? '> 1MB'
                : 'Custom condition'
            }
          />
        </Grid>
        <Grid item xs={12} sm={1}>
          <IconButton onClick={onDelete} color="error">
            <DeleteIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ConditionBuilder;
