const openaiOutput = $input.first().json;

let responseText = '';
if (openaiOutput.output && openaiOutput.output[0]) {
  const content = openaiOutput.output[0].content;
  if (content && content[0] && content[0].text) {
    responseText = content[0].text;
  }
}

let jsonText = responseText.trim();
if (jsonText.startsWith('```json')) {
  jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
} else if (jsonText.startsWith('```')) {
  jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
}

let selectedArticles;
try {
  selectedArticles = JSON.parse(jsonText);
} catch (e) {
  console.error('JSON parse error:', e.message);
  return [
    {
      json: {
        error: 'Failed to parse selector output',
        raw: responseText,
        message: e.message,
        validation: 'PARSE_ERROR',
      },
    },
  ];
}

const schema = {
  required: ['first_page_overview', 'ai_article', 'neuro_article'],
  properties: {
    first_page_overview: { type: 'string', minLength: 200 },
    ai_article: {
      type: 'object',
      required: ['title', 'link', 'reason'],
      properties: {
        title: { type: 'string', minLength: 5 },
        link: { type: 'string', format: 'uri' },
        reason: { type: 'string', minLength: 20 },
      },
    },
    neuro_article: {
      type: 'object',
      required: ['title', 'link', 'reason'],
      properties: {
        title: { type: 'string', minLength: 5 },
        link: { type: 'string', format: 'uri' },
        reason: { type: 'string', minLength: 20 },
      },
    },
  },
};

function validateSchema(data, schema) {
  const errors = [];

  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in data) {
        const value = data[key];

        if (propSchema.type === 'string' && typeof value !== 'string') {
          errors.push(`Field '${key}' must be a string`);
        }

        if (propSchema.type === 'string' && propSchema.minLength) {
          if (value.length < propSchema.minLength) {
            errors.push(`Field '${key}' too short (${value.length} < ${propSchema.minLength})`);
          }
        }

        if (propSchema.type === 'object' && propSchema.required) {
          for (const nestedField of propSchema.required) {
            if (!(nestedField in value)) {
              errors.push(`Missing ${key}.${nestedField}`);
            }
          }
        }

        if (propSchema.format === 'uri' && !value.match(/^https?:\/\/.+/)) {
          errors.push(`Invalid URL in ${key}: ${value}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

const validation = validateSchema(selectedArticles, schema);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  console.log('Using fallback data');

  const fs = require('fs');
  const fallbackPath = '/data/inputs/fallbacks/deep-dive-fallback.json';

  try {
    const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    console.log('Loaded fallback data successfully');

    selectedArticles = {
      ...fallbackData,
      _isFallback: true,
      _originalError: validation.errors,
    };
  } catch (fallbackError) {
    console.error('Failed to load fallback:', fallbackError.message);
    return [
      {
        json: {
          error: 'Validation failed and fallback unavailable',
          validation_errors: validation.errors,
          fallback_error: fallbackError.message,
        },
      },
    ];
  }
}

console.log('Schema validation passed');

const firstPageOverview = selectedArticles.first_page_overview || '';

return [
  {
    json: {
      article: selectedArticles.ai_article,
      category: 'AI Safety & Tech',
      topic: 'ai',
      first_page_overview: firstPageOverview,
    },
  },
  {
    json: {
      article: selectedArticles.neuro_article,
      category: 'Neuroscience',
      topic: 'neuro',
      first_page_overview: firstPageOverview,
    },
  },
];
