import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  TextField,
  IconButton,
} from '@mui/material';
import { Trash2 } from 'lucide-react';

const OPERATORS = ['AND', 'OR', 'NOT'];
const FIELDS = ['event_id', 'tag_option_ids', 'player_ids'];
const COMPARISONS = ['=', '!=', 'contains'];

const mockOptions = {
  events: [
    { id: 1, value: 'Football Match' },
    { id: 2, value: 'Basketball Game' },
    { id: 3, value: 'Tennis Tournament' }
  ],
  tagOptions: [
    { id: 1, value: 'Premium' },
    { id: 2, value: 'Free' },
    { id: 3, value: 'Live' }
  ],
  players: [
    { id: 8681, value: 'John Doe' },
    { id: 8682, value: 'Jane Smith' },
    { id: 8683, value: 'Mike Johnson' }
  ]
};

const getOptionsForField = (field) => {
  switch (field) {
    case 'event_id':
      return mockOptions.events;
    case 'tag_option_ids':
      return mockOptions.tagOptions;
    case 'player_ids':
      return mockOptions.players;
    default:
      return [];
  }
};

const parseRuleString = (ruleString) => {
  try {
    ruleString = ruleString.trim();
    if (ruleString.startsWith('(') && ruleString.endsWith(')')) {
      ruleString = ruleString.slice(1, -1).trim();
    }

    if (ruleString.toUpperCase().startsWith('NOT')) {
      const innerRule = parseRuleString(ruleString.slice(3).trim());
      if (!innerRule) return null;
      return {
        type: 'group',
        operator: 'NOT',
        rules: [innerRule],
      };
    }

    for (const op of ['AND', 'OR']) {
      if (ruleString.toUpperCase().includes(` ${op} `)) {
        const parts = ruleString.split(new RegExp(` ${op} `, 'i'));
        const rules = parts.map(part => parseRuleString(part)).filter(Boolean);
        if (rules.length > 0) {
          return {
            type: 'group',
            operator: op,
            rules,
          };
        }
      }
    }

    const conditionMatch = ruleString.match(/(\w+)\s*(=|!=|contains)\s*(\d+)/);
    if (conditionMatch) {
      const [, field, comparison, valueId] = conditionMatch;
      const options = getOptionsForField(field);
      const value = options.find(opt => opt.id === parseInt(valueId));
      if (value) {
        return {
          type: 'condition',
          field,
          comparison,
          value,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing rule string:', error);
    return null;
  }
};

const RuleBuilder = () => {
  const [rule, setRule] = useState({
    type: 'group',
    operator: 'AND',
    rules: [],
  });
  const [ruleInput, setRuleInput] = useState('');

  const addRule = useCallback((parent) => {
    if (parent.type === 'group') {
      parent.rules = [
        ...(parent.rules || []),
        {
          type: 'condition',
          field: 'event_id',
          comparison: '=',
        },
      ];
      setRule({ ...rule });
    }
  }, [rule]);

  const addGroup = useCallback((parent) => {
    if (parent.type === 'group') {
      parent.rules = [
        ...(parent.rules || []),
        {
          type: 'group',
          operator: 'AND',
          rules: [],
        },
      ];
      setRule({ ...rule });
    }
  }, [rule]);

  const removeRule = useCallback((parent, index) => {
    if (parent.type === 'group' && parent.rules) {
      parent.rules.splice(index, 1);
      setRule({ ...rule });
    }
  }, [rule]);

  const updateRule = useCallback((ruleToUpdate, field, value) => {
    Object.assign(ruleToUpdate, { [field]: value });
    setRule({ ...rule });
  }, [rule]);

  const generateRuleString = (currentRule) => {
    if (currentRule.type === 'condition') {
      if (!currentRule.field || !currentRule.comparison || !currentRule.value) return '';
      return `(${currentRule.field} ${currentRule.comparison} ${currentRule.value.id})`;
    }

    if (!currentRule.rules || currentRule.rules.length === 0) return '';

    const operator = currentRule.operator || 'AND';
    const childRules = currentRule.rules.map(generateRuleString).filter(Boolean);

    if (childRules.length === 0) return '';
    if (operator === 'NOT') return `(NOT ${childRules[0]})`;
    return `(${childRules.join(` ${operator} `)})`;
  };

  const handleImportRule = () => {
    const parsedRule = parseRuleString(ruleInput);
    if (parsedRule) {
      setRule(parsedRule);
    }
  };

  const RuleItem = ({ rule: currentRule, parent, index }) => {
    if (currentRule.type === 'condition') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Field</InputLabel>
            <Select
              value={currentRule.field || ''}
              label="Field"
              onChange={(e) => updateRule(currentRule, 'field', e.target.value)}
            >
              {FIELDS.map((field) => (
                <MenuItem key={field} value={field}>
                  {field}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Comparison</InputLabel>
            <Select
              value={currentRule.comparison || ''}
              label="Comparison"
              onChange={(e) => updateRule(currentRule, 'comparison', e.target.value)}
            >
              {COMPARISONS.map((comp) => (
                <MenuItem key={comp} value={comp}>
                  {comp}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Value</InputLabel>
            <Select
              value={currentRule.value?.id || ''}
              label="Value"
              onChange={(e) => {
                const options = getOptionsForField(currentRule.field || '');
                const selectedOption = options.find(opt => opt.id === e.target.value);
                updateRule(currentRule, 'value', selectedOption);
              }}
            >
              {currentRule.field && getOptionsForField(currentRule.field).map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton size="small" onClick={() => removeRule(parent, index)}>
            <Trash2 size={18} />
          </IconButton>
        </Box>
      );
    }

    return (
      <Card variant="outlined" sx={{ p: 2, my: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={currentRule.operator || 'AND'}
                label="Operator"
                onChange={(e) => updateRule(currentRule, 'operator', e.target.value)}
              >
                {OPERATORS.map((op) => (
                  <MenuItem key={op} value={op}>
                    {op}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              size="small"
              variant="outlined"
              onClick={() => addRule(currentRule)}
              sx={{ minWidth: 100 }}
            >
              Add Rule
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={() => addGroup(currentRule)}
              sx={{ minWidth: 140 }}
            >
              Add Nested Group
            </Button>
          </Box>

          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Trash2 size={18} />}
            onClick={() => removeRule(parent, index)}
            sx={{ visibility: parent === rule ? 'hidden' : 'visible' }}
          >
            Delete Group
          </Button>
        </Box>

        <Box sx={{ pl: 2 }}>
          {currentRule.rules?.map((r, i) => (
            <RuleItem key={i} rule={r} parent={currentRule} index={i} />
          ))}
        </Box>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h5" gutterBottom>
        Distribution Rule Builder
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Import Existing Rule:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            value={ruleInput}
            onChange={(e) => setRuleInput(e.target.value)}
            placeholder="Paste a rule string to edit it..."
          />
          <Button variant="contained" onClick={handleImportRule}>
            Import
          </Button>
        </Box>
      </Box>
      
      <RuleItem rule={rule} parent={rule} index={0} />
      
      <Paper sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle2" gutterBottom>
          Generated Rule:
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {generateRuleString(rule)}
        </Typography>
      </Paper>
    </Box>
  );
};

export default RuleBuilder;