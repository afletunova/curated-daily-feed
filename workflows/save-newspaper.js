const fs = require('fs');
const path = require('path');

const input = $input.all()[0]?.json;

if (!input || !input.html) {
  throw new Error('No HTML content received from previous node');
}

const { html, date } = input;

const DEBUG_MODE = $env.DEBUG_MODE === 'true';

if (DEBUG_MODE) {
  console.log('⚠️  DEBUG_MODE active - files will be saved to /debug/ subdirectory');
}

const OUTPUTS_DIR = '/data/outputs';
const NEWSPAPERS_DIR = DEBUG_MODE
  ? path.join(OUTPUTS_DIR, 'debug', 'newspapers')
  : path.join(OUTPUTS_DIR, 'newspapers');
const METADATA_DIR = DEBUG_MODE
  ? path.join(OUTPUTS_DIR, 'debug', 'metadata')
  : path.join(OUTPUTS_DIR, 'metadata');
const LOGS_DIR = DEBUG_MODE
  ? path.join(OUTPUTS_DIR, 'debug', 'logs')
  : path.join(OUTPUTS_DIR, 'logs');

const now = new Date();
const timestamp = now.toISOString();

const volumeNumber = 1;

const htmlFilename = DEBUG_MODE
  ? `DEBUG-newspaper-${date}-v${volumeNumber}.html`
  : `newspaper-${date}-v${volumeNumber}.html`;
const metadataFilename = DEBUG_MODE
  ? `DEBUG-metadata-${date}-v${volumeNumber}.json`
  : `metadata-${date}-v${volumeNumber}.json`;
const logFilename = DEBUG_MODE ? `DEBUG-execution-${date}.log` : `execution-${date}.log`;

const htmlPath = path.join(NEWSPAPERS_DIR, htmlFilename);
const metadataPath = path.join(METADATA_DIR, metadataFilename);
const logPath = path.join(LOGS_DIR, logFilename);

const articleCounts = {
  ai_summary: html.includes('AI Highlights') ? 1 : 0,
  ai_deepdive: html.includes('AI Deep-Dive') ? 1 : 0,
  neuro_summary: html.includes('Neuroscience Highlights') ? 1 : 0,
  neuro_deepdive: html.includes('Neuroscience Deep-Dive') ? 1 : 0,
  total_pages: (html.match(/<div class="page">/g) || []).length,
};

const metadata = {
  debug_mode: DEBUG_MODE,
  volume_number: volumeNumber,
  generation_date: date,
  generation_timestamp: timestamp,
  cooldown_expires_at: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), // +12 hours
  status: 'success',
  file_path: htmlPath,
  file_size_kb: Math.round(html.length / 1024),
  article_counts: articleCounts,
  metadata: {
    weather_included: html.includes('weather-widget'),
    sudoku_included: html.includes('sudoku-grid'),
    german_section_included: html.includes('Deutsche Ecke'),
    journal_prompts_included: html.includes('Daily Reflection Prompts'),
  },
  error_log: null,
  duration_seconds: 0,
};

const metadataJson = JSON.stringify(metadata, null, 2);
const logEntry = DEBUG_MODE
  ? `[${timestamp}] DEBUG - Volume ${volumeNumber} generated (${metadata.file_size_kb}KB) - NOT PRODUCTION\n`
  : `[${timestamp}] SUCCESS - Volume ${volumeNumber} generated (${metadata.file_size_kb}KB)\n`;

try {
  [NEWSPAPERS_DIR, METADATA_DIR, LOGS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  fs.writeFileSync(htmlPath, html, 'utf8');

  fs.writeFileSync(metadataPath, metadataJson, 'utf8');

  fs.appendFileSync(logPath, logEntry, 'utf8');

  if (DEBUG_MODE) {
    console.log('   Debug files saved:');
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   Metadata: ${metadataPath}`);
    console.log(`   Log: ${logPath}`);
  }

  return [
    {
      json: {
        success: true,
        debug_mode: DEBUG_MODE,
        volume_number: volumeNumber,
        files_created: {
          html: htmlPath,
          metadata: metadataPath,
          log: logPath,
        },
        file_size_kb: metadata.file_size_kb,
        article_counts: articleCounts,
        generation_timestamp: timestamp,
        metadata: metadata.metadata,
      },
    },
  ];
} catch (error) {
  return [
    {
      json: {
        success: false,
        debug_mode: DEBUG_MODE,
        error: error.message,
        volume_number: volumeNumber,
        generation_timestamp: timestamp,
      },
    },
  ];
}
