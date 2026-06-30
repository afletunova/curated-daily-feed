const today = new Date();
const dateStr = today.toISOString().split('T')[0];

const allInputs = $input.all();

let weatherData = null;
const weatherInput = allInputs[0]?.json;
if (weatherInput && weatherInput.current_weather) {
  weatherData = weatherInput.current_weather;
}

let firstPageOverview = "<p><em>Loading today's highlights...</em></p>";
const overviewInput = allInputs[0]?.json;
if (overviewInput && overviewInput.first_page_overview) {
  firstPageOverview = overviewInput.first_page_overview;
}

let featuredImage = null;
let aiDeepDiveImage = null;
let neuroDeepDiveImage = null;

const IMAGE_BLACKLIST = [
  'https://neurosciencenews.com/files/2020/07/Neuroscience-News_AZ_RevNewest-scaled-e1596228355273-1.jpg',
  'https://neurosciencenews.com/files/2020/07/Neuroscience-News_AZ_RevNewest-scaled-e1596228355273.jpg',
];

function filterImages(images) {
  if (!images || !Array.isArray(images)) return [];
  return images.filter((img) => !IMAGE_BLACKLIST.includes(img.url));
}

const aiImageInput = allInputs[0]?.json.data[0];
let aiImages = null;
if (aiImageInput && aiImageInput.images && Array.isArray(aiImageInput.images)) {
  aiImages = filterImages(aiImageInput.images);

  if (aiImages.length > 1) {
    aiDeepDiveImage = aiImages[1];
  } else if (aiImages.length > 0) {
    aiDeepDiveImage = aiImages[0];
  }
}

const neuroImageInput = allInputs[0]?.json.data[1];
let neuroImages = null;
if (neuroImageInput && neuroImageInput.images && Array.isArray(neuroImageInput.images)) {
  neuroImages = filterImages(neuroImageInput.images);

  if (neuroImages.length > 1) {
    neuroDeepDiveImage = neuroImages[1];
  } else if (neuroImages.length > 0) {
    neuroDeepDiveImage = neuroImages[0];
  }
}

const useFeaturedFromAI = Math.random() < 0.5;
if (useFeaturedFromAI && aiImages && aiImages.length > 0) {
  featuredImage = aiImages[0];
} else if (neuroImages && neuroImages.length > 0) {
  featuredImage = neuroImages[0];
} else if (aiImages && aiImages.length > 0) {
  featuredImage = aiImages[0];
}

let aiSummary = null;
const aiSummaryInput = allInputs[0]?.json;
if (aiSummaryInput && aiSummaryInput.output && aiSummaryInput.output[0][0]) {
  const content = aiSummaryInput.output[0][0][0].content;
  if (content && content[0] && content[0].text) {
    let text = content[0].text;
    if (text.startsWith('```html')) {
      text = text.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    aiSummary = text;
  }
}

let aiDeepDive = null;
const aiDeepDiveInput = allInputs[0]?.json;
if (aiDeepDiveInput && aiDeepDiveInput.output && aiDeepDiveInput.output[1][0]) {
  const content = aiDeepDiveInput.output[1][0][0].content;
  if (content && content[0] && content[0].text) {
    let text = content[0].text;
    if (text.startsWith('```html')) {
      text = text.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    aiDeepDive = text;
  }
}

let neuroSummary = null;
const neuroSummaryInput = allInputs[0]?.json;
if (neuroSummaryInput && neuroSummaryInput.output && neuroSummaryInput.output[0][1]) {
  const content = neuroSummaryInput.output[0][1][0].content;
  if (content && content[0] && content[0].text) {
    let text = content[0].text;
    if (text.startsWith('```html')) {
      text = text.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    neuroSummary = text;
  }
}

let neuroDeepDive = null;
const neuroDeepDiveInput = allInputs[0]?.json;
if (neuroDeepDiveInput && neuroDeepDiveInput.output && neuroDeepDiveInput.output[1][1]) {
  const content = neuroDeepDiveInput.output[1][1][0].content;
  if (content && content[0] && content[0].text) {
    let text = content[0].text;
    if (text.startsWith('```html')) {
      text = text.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    neuroDeepDive = text;
  }
}

let germanData = null;
const germanInput = allInputs[0]?.json;
if (germanInput && germanInput.output && germanInput.output[2][0]) {
  try {
    const germanText = germanInput.output[2][0].content[0].text;
    const jsonMatch = germanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      germanData = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('Failed to parse German data:', e);
  }
}

let sudokuData = null;
const sudokuInput = allInputs[0]?.json;
if (
  sudokuInput &&
  sudokuInput.newboard &&
  sudokuInput.newboard.grids &&
  sudokuInput.newboard.grids[0]
) {
  sudokuData = sudokuInput.newboard.grids[0];
}

const CHARS_PER_PAGE_WITH_MASTHEAD = 3250;
const CHARS_PER_PAGE_CLEAN = 5500;
const CHARS_PER_IMAGE = 700;

function splitContent(content, charLimit = CHARS_PER_PAGE_CLEAN) {
  if (!content || content.length <= charLimit) {
    return { page1: content, page2: '' };
  }

  const imageRegex = /<img[^>]*class="article-image"[^>]*>/gi;
  const images = content.match(imageRegex) || [];
  const imageCount = images.length;
  const adjustedLimit = charLimit - imageCount * CHARS_PER_IMAGE;
  const breakPoint = Math.max(adjustedLimit, 1000);

  let splitIndexP = content.indexOf('</p>', breakPoint);
  let splitIndexUL = content.indexOf('</ul>', breakPoint);

  let splitIndex = -1;
  if (splitIndexP !== -1 && splitIndexUL !== -1) {
    splitIndex = Math.min(splitIndexP, splitIndexUL);
  } else if (splitIndexP !== -1) {
    splitIndex = splitIndexP;
  } else if (splitIndexUL !== -1) {
    splitIndex = splitIndexUL;
  }

  if (splitIndex === -1 || splitIndex > breakPoint + 750) {
    let backwardP = content.lastIndexOf('</p>', breakPoint);
    let backwardUL = content.lastIndexOf('</ul>', breakPoint);

    if (backwardP !== -1 && backwardUL !== -1) {
      splitIndex = Math.max(backwardP, backwardUL);
    } else if (backwardP !== -1) {
      splitIndex = backwardP;
    } else if (backwardUL !== -1) {
      splitIndex = backwardUL;
    }
  }

  if (splitIndex === -1) {
    splitIndex = breakPoint;
  } else {
    const tagEnd = content.substring(splitIndex, splitIndex + 6);
    splitIndex += tagEnd.includes('</ul>') ? 5 : 4;
  }

  const beforeSplit = content.substring(0, splitIndex);
  const lastImgStart = beforeSplit.lastIndexOf('<img');
  if (lastImgStart !== -1) {
    const afterImg = content.substring(lastImgStart);
    const imgEnd = afterImg.indexOf('>');
    if (imgEnd !== -1 && imgEnd > splitIndex - lastImgStart) {
      const captionEnd = content.indexOf('</p>', lastImgStart + imgEnd);
      if (captionEnd !== -1 && captionEnd < splitIndex + 500) {
        splitIndex = captionEnd + 4;
      }
    }
  }

  return {
    page1: content.substring(0, splitIndex),
    page2: content.substring(splitIndex),
  };
}

function generateFallbackSudoku() {
  return {
    value: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    difficulty: 'Medium',
  };
}

function renderSudoku(puzzleData) {
  const grid = puzzleData.value || generateFallbackSudoku().value;
  const difficulty = puzzleData.difficulty || 'Medium';
  let html = `<div class="sudoku-section">
    <h2>Daily Sudoku Challenge</h2>
    <p style="text-align: center; margin-bottom: 10px;">Difficulty: ${difficulty}</p>
    <p style="text-align: center; margin-bottom: 20px; font-size: 14px;">Fill in the empty cells with numbers 1-9</p>
    <div class="sudoku-grid">`;
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const value = grid[i][j];
      const cellClass = value === 0 ? 'sudoku-cell empty' : 'sudoku-cell filled';
      html += `<div class="${cellClass}">${value === 0 ? '' : value}</div>`;
    }
  }
  html += '</div></div>';
  return html;
}

function renderSudokuSolution(puzzleData) {
  const solution = puzzleData?.solution;
  if (!solution) return '';

  let html = '<div style="margin-top: 30px; margin-bottom: 20px; text-align: center;">';
  html += '<p style="font-size: 6px; color: #aaa; margin-bottom: 5px;">Solution</p>';
  html += '<div class="sudoku-solution-grid">';
  for (let col = 0; col < 9; col++) {
    for (let row = 0; row < 9; row++) {
      html += `<div class="sudoku-solution-cell">${solution[row][col]}</div>`;
    }
  }
  html += '</div></div>';
  return html;
}

const fallbackGermanData = {
  words: [
    {
      word: 'die Erkenntnis',
      translation: 'the insight/realization',
      example:
        'Die neuesten Erkenntnisse zeigen interessante Muster. (The latest insights show interesting patterns.)',
    },
    {
      word: 'sich beschäftigen mit',
      translation: 'to deal with/engage with',
      example:
        'Wissenschaftler beschäftigen sich mit komplexen Fragen. (Scientists deal with complex questions.)',
    },
    {
      word: 'die Auswirkung',
      translation: 'the impact/effect',
      example:
        'Die Auswirkungen der Technologie sind weitreichend. (The impacts of technology are far-reaching.)',
    },
    {
      word: 'herausfordernd',
      translation: 'challenging',
      example:
        'Das Thema ist herausfordernd aber faszinierend. (The topic is challenging but fascinating.)',
    },
  ],
  exercise: {
    question:
      'Wähle die richtige Präposition: Forscher haben sich lange ___ diesem Problem beschäftigt.',
    options: ['a) mit', 'b) für', 'c) über'],
    answer: 'a) mit',
    translation: '(Researchers have dealt with this problem for a long time.)',
  },
  culturalFact: {
    title: 'German Compound Nouns',
    text: "German is famous for creating incredibly long compound words. 'Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz' (63 letters) was an actual law about beef labeling. In tech, Germans created 'Verschlimmbesserung' - making something worse while trying to improve it.",
    link: 'https://www.dw.com/en/10-german-words-that-are-impossible-to-translate/a-60550018',
  },
  journalPrompts: [
    "What aspect of today's news resonates most with you?",
    "How can you apply one insight from today's newspaper to your life?",
    "What question does today's news inspire you to explore further?",
  ],
};

function renderGermanSection(data) {
  const content = data || fallbackGermanData;
  let html = '<div class="german-section">';
  html += '<h2>Deutsche Ecke - German Corner</h2>';
  html += '<div class="german-words"><h3>Wörter des Tages (Words of the Day)</h3><ul>';
  content.words.forEach((item) => {
    html += `<li><strong>${item.word}</strong> - ${item.translation}<br><em>${item.example}</em></li>`;
  });
  html += '</ul></div>';
  html += `<div class="german-exercise">
    <h3>Übung (Exercise)</h3>
    <p>${content.exercise.question} <em>${content.exercise.translation}</em></p>
    <p>${content.exercise.options.join(' &nbsp;&nbsp; ')}</p>
    <p class="answer-hint"><strong>Answer:</strong> ${content.exercise.answer}</p>
  </div>`;
  html += `<div class="german-fact">
    <h3>Kultureller Fakt (Cultural Fact)</h3>
    <p><strong>${content.culturalFact.title}</strong></p>
    <p>${content.culturalFact.text}</p>
    <p><a href="${content.culturalFact.link}" target="_blank">Learn more →</a></p>
  </div>`;
  html += '</div>';
  return html;
}

function renderJournalPrompts(data) {
  const prompts = data?.journalPrompts || fallbackGermanData.journalPrompts;
  let html = '<div class="journal-prompts">';
  html += '<h2>Daily Reflection Prompts</h2><ul>';
  prompts.forEach((prompt) => {
    html += `<li>${prompt}</li>`;
  });
  html += '</ul></div>';
  return html;
}

let weather;
try {
  const currentWeather = weatherData;

  if (currentWeather && currentWeather.weathercode !== undefined) {
    let condition, icon;
    if (currentWeather.weathercode === 0) {
      condition = 'Clear';
      icon = '☼';
    } else if (currentWeather.weathercode <= 3) {
      condition =
        currentWeather.weathercode === 1
          ? 'Mostly Clear'
          : currentWeather.weathercode === 2
            ? 'Partly Cloudy'
            : 'Cloudy';
      icon = currentWeather.weathercode === 1 ? '◔' : currentWeather.weathercode === 2 ? '◐' : '●';
    } else if (currentWeather.weathercode <= 48) {
      condition = 'Foggy';
      icon = '≋';
    } else if (currentWeather.weathercode <= 67) {
      condition = 'Rainy';
      icon = '≡';
    } else if (currentWeather.weathercode <= 86) {
      condition = 'Snowy';
      icon = '❄';
    } else {
      condition = 'Stormy';
      icon = '⚡';
    }

    weather = {
      city: 'Berlin',
      temp: `${Math.round(currentWeather.temperature)}°C`,
      condition: condition,
      high: `${Math.round(currentWeather.temperature + 4)}°C`,
      low: `${Math.round(currentWeather.temperature - 6)}°C`,
      icon: icon,
    };
  } else {
    weather = {
      city: 'Berlin',
      temp: '28°C',
      condition: 'Sunny',
      high: '30°C',
      low: '20°C',
      icon: '☼',
    };
  }
} catch (e) {
  weather = {
    city: 'Berlin',
    temp: '28°C',
    condition: 'Sunny',
    high: '30°C',
    low: '20°C',
    icon: '☼',
  };
}

const sudokuHTML = renderSudoku(sudokuData || generateFallbackSudoku());
const germanHTML = renderGermanSection(germanData);
const journalHTML = renderJournalPrompts(germanData);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Almanack | ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</title>
    <style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Times New Roman', Times, serif;
        background: #e8e9ed;
        color: #1a1a1a;
        line-height: 1.6;
        padding: 20px;
    }

    .newspaper {
        max-width: 1200px;
        margin: 0 auto;
        background: transparent;
        padding: 0;
    }

    .masthead {
        text-align: center;
        border-bottom: 3px double #000;
        border-top: 1px solid #000;
        padding: 15px 0;
        margin-bottom: 20px;
        position: relative;
    }

    .newspaper-name {
        font-family: 'Times New Roman', Times, serif;
        font-size: 48px;
        font-weight: 900;
        letter-spacing: 2px;
        margin: 12px 0;
        text-transform: uppercase;
    }

    .tagline {
        font-size: 11px;
        font-style: italic;
        color: #666;
        letter-spacing: 1px;
    }

    .date-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        padding: 8px 0;
        border-bottom: 1px solid #ccc;
        margin-bottom: 18px;
    }

    .edition {
        font-weight: bold;
    }

    .weather-widget {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: 2px solid #384071;
        padding: 6px 10px;
        color: #384071;
        font-size: 9px;
        line-height: 1.3;
        min-width: 90px;
    }

    .weather-main {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-bottom: 3px;
    }

    .weather-icon {
        font-size: 16px;
    }

    .weather-temp {
        font-size: 14px;
        font-weight: 700;
        font-family: 'Times New Roman', Times, serif;
    }

    .weather-city {
        font-size: 8px;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
    }

    .weather-condition {
        font-size: 9px;
    }

    .weather-details {
        font-size: 8px;
        margin-top: 3px;
        border-top: 1px solid #384071;
        padding-top: 3px;
    }

    @page {
      size: A4;
      margin: 15mm;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      background: white;
      page-break-after: always;
      box-sizing: border-box;
      position: relative;
    }

    .page:last-child {
      page-break-after: auto;
    }

    @media screen {
      body {
        background: #e8e9ed;
        padding: 20px;
      }
      .page {
        margin: 0 auto 20px auto;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .page {
        margin: 0;
        box-shadow: none;
      }
    }

    .main-article {
        column-count: 2;
        column-gap: 30px;
        text-align: justify;
        margin-bottom: 30px;
        column-fill: balance;
    }

    .main-article h1 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 28px;
        font-weight: 700;
        line-height: 1.3;
        margin-bottom: 12px;
        column-span: all;
        color: #384071;
    }

    .main-article h2 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 18px;
        font-weight: 700;
        margin: 16px 0 10px 0;
        color: #384071;
    }

    .main-article h3 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 14px;
        font-weight: 700;
        margin: 12px 0 6px 0;
        break-after: avoid;
        color: #384071;
    }

    .main-article p {
        margin-bottom: 10px;
        font-size: 12px;
        line-height: 1.5;
        orphans: 3;
        widows: 3;
    }

    .main-article ul {
        margin: 12px 0 12px 20px;
        font-size: 12px;
    }

    .main-article li {
        margin-bottom: 8px;
    }

    .main-article a {
        color: #384071;
        text-decoration: none;
        border-bottom: 1px solid #5a6b94;
    }

    .main-article a:hover {
        background-color: #d5d7e0;
    }

    .featured-image {
        column-span: all;
        margin: 15px 0;
        text-align: center;
    }

    .featured-image img {
        max-width: 100%;
        height: auto;
    }

    .featured-image .caption {
        font-size: 10px;
        font-style: italic;
        color: #666;
        margin-top: 5px;
    }

    .article-image {
        margin: 10px 0;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .article-image img {
        width: 100%;
        height: auto;
        display: block;
    }

    .article-image .caption {
        font-size: 9px;
        font-style: italic;
        color: #666;
        margin-top: 5px;
        text-align: center;
    }

    .article-page {
        column-count: 2;
        column-gap: 30px;
        text-align: justify;
        margin-bottom: 30px;
        column-fill: balance;
    }

    .article-page h1 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 26px;
        font-weight: 700;
        line-height: 1.3;
        margin-bottom: 12px;
        column-span: all;
        color: #384071;
    }

    .article-page .article-lead {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.5;
        margin-bottom: 16px;
        column-span: all;
        color: #333;
    }

    .article-page h2 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 16px;
        font-weight: 700;
        margin: 16px 0 10px 0;
        break-after: avoid;
        page-break-after: avoid;
        color: #384071;
    }

    .article-page h3 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 13px;
        font-weight: 700;
        margin: 12px 0 6px 0;
        break-after: avoid;
        color: #384071;
    }

    .article-page p {
        margin-bottom: 10px;
        font-size: 12px;
        line-height: 1.5;
        orphans: 3;
        widows: 3;
    }

    .article-page ul {
        margin: 12px 0 12px 20px;
        font-size: 12px;
    }

    .article-page li {
        margin-bottom: 8px;
    }

    .article-page a {
        color: #384071;
        text-decoration: none;
        border-bottom: 1px solid #5a6b94;
    }

    .article-page a:hover {
        background-color: #d5d7e0;
    }

    .article-page .article-footer {
        column-span: all;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 2px solid #384071;
        font-size: 14px;
        color: #666;
    }

    .article-page .article-footer p {
        margin-bottom: 8px;
    }

    .sudoku-section {
        margin-bottom: 30px;
    }

    .sudoku-section h2 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid #384071;
        color: #384071;
    }

    .sudoku-grid {
        display: grid;
        grid-template-columns: repeat(9, 32px);
        grid-template-rows: repeat(9, 32px);
        gap: 0;
        margin: 15px 0;
        width: fit-content;
        border: 2px solid #000;
    }

    .sudoku-cell {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Times New Roman', Times, serif;
        border: 1px solid #ddd;
        background: white;
    }

    .sudoku-cell.filled {
        color: #000;
    }

    .sudoku-cell:nth-child(3n) {
        border-right: 2px solid #000;
    }

    .sudoku-cell:nth-child(n+19):nth-child(-n+27),
    .sudoku-cell:nth-child(n+46):nth-child(-n+54) {
        border-bottom: 2px solid #000;
    }

    .sudoku-solution-grid {
        display: grid;
        grid-template-columns: repeat(9, 7px);
        grid-template-rows: repeat(9, 7px);
        gap: 0;
        margin: 0 auto;
        width: fit-content;
        border: 0.5px solid #ddd;
    }

    .sudoku-solution-cell {
        width: 7px;
        height: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4px;
        font-weight: 400;
        font-family: 'Times New Roman', Times, serif;
        border: 0.25px solid #eee;
        background: #fafafa;
        color: #bbb;
    }

    .sudoku-solution-cell:nth-child(3n) {
        border-right: 0.5px solid #ddd;
    }

    .sudoku-solution-cell:nth-child(n+19):nth-child(-n+27),
    .sudoku-solution-cell:nth-child(n+46):nth-child(-n+54) {
        border-bottom: 0.5px solid #ddd;
    }

    .german-section {
        margin-bottom: 30px;
    }

    .german-section h2 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid #384071;
        color: #384071;
    }

    .german-section h3 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 16px;
        font-weight: 700;
        margin: 20px 0 10px 0;
        color: #384071;
    }

    .german-words ul {
        list-style: none;
        padding: 0;
        margin: 15px 0;
    }

    .german-words li {
        margin: 10px 0;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
        font-size: 13px;
        line-height: 1.5;
    }

    .german-words li:last-child {
        border-bottom: none;
    }

    .german-exercise {
        margin: 20px 0;
        padding: 15px 0;
        border-top: 1px solid #ddd;
        border-bottom: 1px solid #ddd;
        page-break-inside: avoid;
        break-inside: avoid;
    }

    .german-exercise p {
        font-size: 13px;
        margin: 8px 0;
    }

    .answer-hint {
        font-size: 11px;
        font-style: italic;
        color: #999;
        margin-top: 10px;
    }

    .german-fact {
        margin: 20px 0;
        padding: 12px 0;
        border-left: 3px solid #384071;
        padding-left: 12px;
    }

    .german-fact p {
        font-size: 13px;
        margin: 6px 0;
    }

    .german-fact a {
        color: #384071;
        text-decoration: underline;
    }

    .journal-prompts {
        margin-bottom: 30px;
    }

    .journal-prompts h2 {
        font-family: 'Times New Roman', Times, serif;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid #384071;
        color: #384071;
    }

    .journal-prompts ul {
        list-style: none;
        padding: 0;
        margin: 15px 0;
    }

    .journal-prompts li {
        margin: 10px 0;
        padding: 8px 0 8px 12px;
        border-left: 2px solid #384071;
        font-size: 13px;
        line-height: 1.6;
    }

    .footer {
        border-top: 2px solid #000;
        padding-top: 20px;
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #666;
    }

    .answer-section {
        margin-top: 30px;
        padding: 15px;
        background: #e8e9ed;
        border-top: 1px solid #ccc;
        font-size: 11px;
    }

    @media print {
        body {
            background: white;
        }
        .newspaper {
            box-shadow: none;
            margin: 0;
            padding: 40px;
        }
    }

    @media (max-width: 768px) {
        .newspaper {
            padding: 30px 20px;
        }

        .newspaper-name {
            font-size: 48px;
        }

        .main-article, .article-page {
            column-count: 1;
        }

        .main-article h1 {
            font-size: 32px;
        }

        .weather-widget {
            position: static;
            transform: none;
            margin: 0 auto 15px auto;
            text-align: center;
        }

        .sudoku-grid {
            grid-template-columns: repeat(9, 35px);
            grid-template-rows: repeat(9, 35px);
        }

        .sudoku-cell {
            width: 35px;
            height: 35px;
            font-size: 14px;
        }
    }
    </style>
</head>
<body>
    <div class="newspaper">
    <div class="page">
        <div class="masthead">
            <div class="weather-widget">
                <div class="weather-main">
                    <span class="weather-icon">${weather.icon}</span>
                    <span class="weather-temp">${weather.temp}</span>
                </div>
                <div class="weather-city">${weather.city}</div>
                <div class="weather-condition">${weather.condition}</div>
                <div class="weather-details">${weather.high} / ${weather.low}</div>
            </div>
            <div class="tagline">Est. 2026</div>
            <h1 class="newspaper-name">The Almanack</h1>
            <div class="tagline">AI, Neuroscience & German Culture Daily</div>
        </div>

        <div class="date-bar">
            <span class="edition">Daily Edition</span>
            <span>${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>Vol. 1</span>
        </div>

        ${
          featuredImage
            ? `
        <div class="featured-image">
            <img src="${featuredImage.url}" alt="${featuredImage.alt}" />
            ${featuredImage.caption && featuredImage.caption !== featuredImage.alt ? `<p class="caption">${featuredImage.caption}</p>` : ''}
        </div>
        `
            : ''
        }

        <div class="main-article">

            ${(() => {
              const imageAdjustment = featuredImage ? 1000 : 0;
              const split = splitContent(
                firstPageOverview,
                CHARS_PER_PAGE_WITH_MASTHEAD - imageAdjustment
              );
              return split.page1;
            })()}
        </div>

        </div>

        ${(() => {
          const split = splitContent(firstPageOverview, CHARS_PER_PAGE_WITH_MASTHEAD);
          return split.page2
            ? `
            <div class="page">

                <div class="main-article">
                    ${split.page2}
                </div>
            </div>
            `
            : '';
        })()}

        <div class="page">
        ${
          aiSummary
            ? `<div class="article-page">
            ${(() => {
              const split = splitContent(aiSummary);
              return split.page1;
            })()}
        </div>`
            : '<div class="main-article"><h1>AI Highlights</h1><p><em>Highlights article coming soon...</em></p></div>'
        }
        </div>

        ${
          aiSummary
            ? (() => {
                const split = splitContent(aiSummary);
                return split.page2
                  ? `
          <div class="page">

              <div class="article-page">
                  ${split.page2}
              </div>
          </div>
          `
                  : '';
              })()
            : ''
        }

        <div class="page">
        ${
          aiDeepDive
            ? `<div class="article-page">
            ${(() => {
              const imageAdjustment = aiDeepDiveImage ? CHARS_PER_IMAGE : 0;
              const split = splitContent(aiDeepDive, CHARS_PER_PAGE_CLEAN - imageAdjustment);
              const content = split.page1;
              if (aiDeepDiveImage && content) {
                let insertPos = content.indexOf('</p>');
                if (insertPos !== -1) {
                  insertPos += 4;
                } else {
                  insertPos = 0;
                }
                const imageHtml = `
            <div class="article-image">
                <img src="${aiDeepDiveImage.url}" alt="${aiDeepDiveImage.alt}" />
                ${aiDeepDiveImage.caption && aiDeepDiveImage.caption !== aiDeepDiveImage.alt ? `<p class="caption">${aiDeepDiveImage.caption}</p>` : ''}
            </div>
            `;
                return content.substring(0, insertPos) + imageHtml + content.substring(insertPos);
              }
              return content;
            })()}
        </div>`
            : '<div class="main-article"><h1>AI Deep-Dive</h1><p><em>Deep-dive article coming soon...</em></p></div>'
        }
        </div>

        ${
          aiDeepDive
            ? (() => {
                const split = splitContent(aiDeepDive);
                return split.page2
                  ? `
            <div class="page">

                <div class="article-page">
                    ${split.page2}
                </div>
            </div>
            `
                  : '';
              })()
            : ''
        }

        <div class="page">
        ${
          neuroSummary
            ? `<div class="article-page">
            ${(() => {
              const split = splitContent(neuroSummary);
              return split.page1;
            })()}
        </div>`
            : '<div class="main-article"><h1>Neuroscience Highlights</h1><p><em>Highlights article coming soon...</em></p></div>'
        }
        </div>

        ${
          neuroSummary
            ? (() => {
                const split = splitContent(neuroSummary);
                return split.page2
                  ? `
          <div class="page">

              <div class="article-page">
                  ${split.page2}
              </div>
          </div>
          `
                  : '';
              })()
            : ''
        }

        <div class="page">
        ${
          neuroDeepDive
            ? `<div class="article-page">
            ${(() => {
              const imageAdjustment = neuroDeepDiveImage ? CHARS_PER_IMAGE : 0;
              const split = splitContent(neuroDeepDive, CHARS_PER_PAGE_CLEAN - imageAdjustment);
              const content = split.page1;
              if (neuroDeepDiveImage && content) {
                let insertPos = content.indexOf('</p>');
                if (insertPos !== -1) {
                  insertPos += 4;
                } else {
                  insertPos = 0;
                }
                const imageHtml = `
            <div class="article-image">
                <img src="${neuroDeepDiveImage.url}" alt="${neuroDeepDiveImage.alt}" />
                ${neuroDeepDiveImage.caption && neuroDeepDiveImage.caption !== neuroDeepDiveImage.alt ? `<p class="caption">${neuroDeepDiveImage.caption}</p>` : ''}
            </div>
            `;
                return content.substring(0, insertPos) + imageHtml + content.substring(insertPos);
              }
              return content;
            })()}
        </div>`
            : '<div class="main-article"><h1>Neuroscience Deep-Dive</h1><p><em>Deep-dive article coming soon...</em></p></div>'
        }
        </div>

        ${
          neuroDeepDive
            ? (() => {
                const split = splitContent(neuroDeepDive);
                return split.page2
                  ? `
            <div class="page">

                <div class="article-page">
                    ${split.page2}
                </div>
            </div>
            `
                  : '';
              })()
            : ''
        }

        <div class="page">
        ${germanHTML}
        </div>

        <div class="page">
        ${sudokuHTML}
        ${journalHTML}
        ${renderSudokuSolution(sudokuData || generateFallbackSudoku())}
        <div class="footer">
            <p>Generated by n8n AI News Digest | Powered by OpenAI & Sudoku API</p>
            <p>For the latest in AI safety, neuroscience, and German culture</p>
        </div>
        </div> 
    </div>
</body>
</html>`;

return {
  json: {
    html: html,
    filename: `ai-chronicle-${dateStr}.html`,
    date: dateStr,
  },
};
