// Static data for the dashboard.

const TOPICS = [
  { id: 'world', label: 'World', count: 24 },
  { id: 'tech', label: 'Tech', count: 18 },
  { id: 'sports', label: 'Sports', count: 11 },
  { id: 'science', label: 'Science', count: 7 },
  { id: 'culture', label: 'Culture', count: 9 },
  { id: 'markets', label: 'Markets', count: 14 },
  { id: 'climate', label: 'Climate', count: 5 },
];

const QUICK_PROMPTS = [
  { title: 'Explain quantum computing',         tag: 'Learn',   est: '2 min' },
  { title: 'Draft a Python web scraper',        tag: 'Code',    est: '4 min' },
  { title: 'Summarise today\u2019s tech news',  tag: 'Brief',   est: '1 min' },
  { title: 'Plan a workout for the week',       tag: 'Plan',    est: '3 min' },
  { title: 'Compare Kafka vs. RabbitMQ',        tag: 'Compare', est: '5 min' },
  { title: 'Outline a product launch memo',     tag: 'Write',   est: '6 min' },
];

const STARTERS = [
  { hook: 'Continue', title: 'Microservice App Architecture Proposal', meta: 'Yesterday \u00b7 14 messages' },
  { hook: 'Continue', title: 'Go gRPC backend design',                meta: '2 days ago \u00b7 8 messages' },
  { hook: 'Resume',   title: 'Python Web Scraper Guide',              meta: '3 days ago \u00b7 21 messages' },
  { hook: 'Resume',   title: 'High-performance distributed system',   meta: '4 days ago \u00b7 6 messages' },
];

const HISTORY = [
  'Python Web Scraper Guide',
  'Generate image of japanese garden',
  'Shakira free concert in Brazil',
  'Microservice App Architecture',
  'Compelling technical critique',
  'Go gRPC Backend Design',
  'High-performance distributed system',
  'React core concepts deep-dive',
  'A friendly greeting',
  'Sample Java Maven app',
  'Refactor user-auth flow',
  'Slack bot for incident triage',
];

const PROJECTS = [
  { name: 'Q3 Strategy', count: 12 },
  { name: 'Onboarding Flow', count: 5 },
  { name: 'Engineering Notes', count: 27 },
];

const TOOLS = [
  { name: 'Versatile', sub: 'General reasoning' },
  { name: 'Chat',      sub: 'Conversational' },
  { name: 'Dev',       sub: 'Coding & shell' },
  { name: 'Research',  sub: 'Cited & deep' },
  { name: 'Vision',    sub: 'Image input' },
];

Object.assign(window, { TOPICS, QUICK_PROMPTS, STARTERS, HISTORY, PROJECTS, TOOLS });
