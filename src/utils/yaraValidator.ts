import { YaraRule, YaraString, YaraCondition } from '../types/yara';

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}

export const validateRuleInRealTime = (rule: YaraRule): ValidationResult => {
  const errors: ValidationError[] = [];

  // Rule name validation
  if (!rule.name) {
    errors.push({
      field: 'name',
      message: 'Rule name is required'
    });
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(rule.name)) {
    errors.push({
      field: 'name',
      message: 'Rule name must start with a letter or underscore and contain only alphanumeric characters'
    });
  }

  // Strings validation
  rule.strings.forEach((str, index) => {
    if (!str.identifier) {
      errors.push({
        field: `strings[${index}].identifier`,
        message: `String #${index + 1} must have an identifier`
      });
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str.identifier)) {
      errors.push({
        field: `strings[${index}].identifier`,
        message: `String identifier must be alphanumeric and start with a letter or underscore`
      });
    }

    if (!str.value) {
      errors.push({
        field: `strings[${index}].value`,
        message: `String #${index + 1} must have a value`
      });
    } else {
      if (str.type === 'hex') {
        if (!/^([0-9A-Fa-f]{2}\s*)+$/.test(str.value)) {
          errors.push({
            field: `strings[${index}].value`,
            message: `Invalid hex string format`
          });
        }
      }
    }
  });

  // Conditions validation
  if (rule.conditions.length === 0) {
    errors.push({
      field: 'conditions',
      message: 'At least one condition is required'
    });
  }

  rule.conditions.forEach((condition, index) => {
    if (!condition.value) {
      errors.push({
        field: `conditions[${index}].value`,
        message: `Condition #${index + 1} must have a value`
      });
    }

    if (condition.type === 'string') {
      const stringIdentifiers = rule.strings.map(s => '$' + s.identifier);
      if (!stringIdentifiers.includes(condition.value)) {
        errors.push({
          field: `conditions[${index}].value`,
          message: `String ${condition.value} is not defined`
        });
      }
    } else if (condition.type === 'filesize') {
      if (!/^[<>]=?\s*\d+(\s*[KMG]B)?$/.test(condition.value)) {
        errors.push({
          field: `conditions[${index}].value`,
          message: `Invalid filesize format. Example: "> 1MB" or "< 500KB"`
        });
      }
    } else if (condition.type === 'custom') {
      if (!condition.value.trim()) {
        errors.push({
          field: `conditions[${index}].value`,
          message: `Custom condition cannot be empty`
        });
      }
    }
  });

  // Meta validation
  if (rule.meta.version && !/^\d+\.\d+(\.\d+)?$/.test(rule.meta.version)) {
    errors.push({
      field: 'meta.version',
      message: 'Version must be in format x.y or x.y.z'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const testRule = (rule: YaraRule, sampleData: string): boolean => {
  try {
    const evaluateCondition = (condition: YaraCondition): boolean => {
      switch (condition.type) {
        case 'string': {
          const relatedString = rule.strings.find(s => '$' + s.identifier === condition.value);
          if (!relatedString) return false;

          if (relatedString.type === 'text') {
            const searchValue = relatedString.modifiers.nocase 
              ? relatedString.value.toLowerCase()
              : relatedString.value;
            const searchData = relatedString.modifiers.nocase 
              ? sampleData.toLowerCase()
              : sampleData;
            
            if (relatedString.modifiers.wide) {
              // Simulate wide strings by adding null bytes between characters
              const wideValue = searchValue.split('').join('\0') + '\0';
              return searchData.includes(wideValue);
            }
            
            if (relatedString.modifiers.fullword) {
              const regex = new RegExp(`\\b${searchValue}\\b`, relatedString.modifiers.nocase ? 'i' : '');
              return regex.test(searchData);
            }
            
            return searchData.includes(searchValue);
          } else { // hex string
            // Convert hex string to bytes
            const hexBytes = relatedString.value
              .replace(/\s+/g, '')
              .match(/.{2}/g)
              ?.map(byte => parseInt(byte, 16));
            
            if (!hexBytes) return false;
            
            // Convert sample data to bytes for comparison
            const dataBytes = new TextEncoder().encode(sampleData);
            
            // Search for hex pattern in data
            outer: for (let i = 0; i <= dataBytes.length - hexBytes.length; i++) {
              for (let j = 0; j < hexBytes.length; j++) {
                if (dataBytes[i + j] !== hexBytes[j]) continue outer;
              }
              return true;
            }
            return false;
          }
        }
        case 'filesize': {
          const size = new TextEncoder().encode(sampleData).length;
          const match = condition.value.match(/([<>]=?)\s*(\d+)\s*([KMG]B)?/);
          if (!match) return false;
          
          const [_, op, value, unit] = match;
          let bytes = parseInt(value);
          if (unit) {
            const multiplier = { KB: 1024, MB: 1024*1024, GB: 1024*1024*1024 }[unit];
            bytes *= multiplier!;
          }
          
          switch (op) {
            case '>': return size > bytes;
            case '>=': return size >= bytes;
            case '<': return size < bytes;
            case '<=': return size <= bytes;
            default: return size === bytes;
          }
        }
        case 'custom':
          // For custom conditions, we can only do basic evaluation
          try {
            // Safely evaluate basic arithmetic and boolean expressions
            const safeEval = new Function('size', `
              const filesize = size;
              return ${condition.value};
            `);
            return safeEval(new TextEncoder().encode(sampleData).length);
          } catch {
            return false;
          }
      }
      return false;
    };

    // Evaluate all conditions with their operators
    let result = true;
    let lastOperator: 'and' | 'or' | 'not' | undefined;

    for (const condition of rule.conditions) {
      const currentResult = evaluateCondition(condition);
      
      if (condition.operator === 'not' || lastOperator === 'not') {
        result = result && !currentResult;
      } else if (lastOperator === 'or') {
        result = result || currentResult;
      } else { // 'and' or undefined (first condition)
        result = result && currentResult;
      }
      
      lastOperator = condition.operator;
    }

    return result;
  } catch (error) {
    console.error('Error testing rule:', error);
    return false;
  }
};
