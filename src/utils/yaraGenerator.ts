import { YaraRule, YaraString, YaraCondition } from '../types/yara';

const formatString = (str: YaraString): string => {
  const modifiers = Object.entries(str.modifiers)
    .filter(([_, value]) => value)
    .map(([key]) => key)
    .join(' ');

  return `${str.identifier} = ${str.type === 'hex' ? '{' : '"'}${str.value}${
    str.type === 'hex' ? '}' : '"'
  }${modifiers ? ' ' + modifiers : ''}`;
};

const formatCondition = (condition: YaraCondition, index: number): string => {
  const operator = index === 0 ? '' : condition.operator + ' ';
  
  switch (condition.type) {
    case 'string':
      return `${operator}${condition.value}`;
    case 'filesize':
      return `${operator}filesize ${condition.value}`;
    case 'custom':
      return `${operator}${condition.value}`;
    default:
      return '';
  }
};

export const generateYaraRule = (rule: YaraRule): string => {
  const metaSection = Object.entries(rule.meta)
    .filter(([_, value]) => value)
    .map(([key, value]) => `    ${key} = "${value}"`)
    .join('\n');

  const stringsSection = rule.strings
    .map(str => `    $${formatString(str)}`)
    .join('\n');

  const conditionsSection = rule.conditions
    .map((condition, index) => formatCondition(condition, index))
    .join(' ');

  return `rule ${rule.name}${rule.tags.length ? ' : ' + rule.tags.join(' ') : ''} {
  meta:
${metaSection}

  strings:
${stringsSection}

  condition:
    ${conditionsSection}
}`;
};

export const validateYaraRule = (rule: YaraRule): string[] => {
  const errors: string[] = [];

  if (!rule.name) {
    errors.push('Rule name is required');
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(rule.name)) {
    errors.push('Rule name must start with a letter or underscore and contain only alphanumeric characters and underscores');
  }

  if (rule.strings.length === 0 && !rule.conditions.some(c => c.type === 'filesize' || c.type === 'custom')) {
    errors.push('At least one string or condition is required');
  }

  rule.strings.forEach((str, index) => {
    if (!str.identifier) {
      errors.push(`String #${index + 1} must have an identifier`);
    }
    if (!str.value) {
      errors.push(`String #${index + 1} must have a value`);
    }
  });

  if (rule.conditions.length === 0) {
    errors.push('At least one condition is required');
  }

  return errors;
};
