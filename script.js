// State and constants
const STORAGE_KEY = 'notes_for_vanya_v1';

const ruMonthsGenitive = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря'
];
const ruWeekdays = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];

// Elements
const dateInput = document.getElementById('dateInput');
const addressInput = document.getElementById('addressInput');
const descInput = document.getElementById('descInput');
const costInput = document.getElementById('costInput');
const addBtn = document.getElementById('addBtn');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const reportBtn = document.getElementById('reportBtn');
const clearBtn = document.getElementById('clearBtn');
const notesList = document.getElementById('notesList');
const reportOutput = document.getElementById('reportOutput');
const copyBtn = document.getElementById('copyBtn');
const hint = document.getElementById('hint');

// Util: zero-pad
function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }

// Try to interpret a user-provided date string and normalize to "D month (weekday)"
function normalizeDate(input) {
  if (!input) return '';
  const raw = input.trim().toLowerCase().replace(/\s+/g, ' ');

  // If already has weekday in parentheses, keep as is (normalize spacing)
  if (/\(.*\)$/.test(raw)) {
    // Capitalize month if needed
    return raw.replace(/\s+/g, ' ').replace(/^\d+\s+([а-яё]+)/i, (m, mon) => {
      return m; // leave as is
    });
  }

  // Pattern 1: D.M or DD.MM (assume current year)
  const dm = raw.match(/^\s*(\d{1,2})[\.\/-](\d{1,2})\s*$/);
  if (dm) {
    const d = parseInt(dm[1], 10);
    const m = parseInt(dm[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const today = new Date();
      const year = today.getFullYear();
      // JS months are 0-based
      const dt = new Date(year, m - 1, d);
      const weekday = ruWeekdays[dt.getDay()];
      const monthName = ruMonthsGenitive[m - 1];
      return `${d} ${monthName} (${weekday})`;
    }
  }

  // Pattern 2: "D month" (e.g., "3 октября")
  const monthIndex = ruMonthsGenitive.findIndex(mon => raw.includes(mon));
  if (monthIndex !== -1) {
    const dayMatch = raw.match(/\b(\d{1,2})\b/);
    if (dayMatch) {
      const d = parseInt(dayMatch[1], 10);
      // Guess weekday using current year
      const today = new Date();
      const dt = new Date(today.getFullYear(), monthIndex, d);
      const weekday = ruWeekdays[dt.getDay()];
      return `${d} ${ruMonthsGenitive[monthIndex]} (${weekday})`;
    }
  }

  // Fallback: return as is
  return input;
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

let editingIndex = null;

function renderNotes() {
  const notes = loadNotes();
  notesList.innerHTML = '';
  if (notes.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Нет заметок';
    notesList.appendChild(li);
    return;
  }
  notes.forEach((n, idx) => {
    const li = document.createElement('li');
    li.className = 'note';
    const left = document.createElement('div');
    const right = document.createElement('div');

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = n.date;
    const line = document.createElement('div');
    line.className = 'line';
    line.textContent = `${n.address}. ${n.desc}. ${n.cost} руб.`;
    left.appendChild(meta);
    left.appendChild(line);

    const edit = document.createElement('button');
    edit.className = 'remove';
    edit.title = 'Редактировать заметку';
    edit.textContent = '✎';
    edit.addEventListener('click', () => startEdit(idx));

    const remove = document.createElement('button');
    remove.className = 'remove';
    remove.title = 'Удалить заметку';
    remove.textContent = '✕';
    remove.addEventListener('click', () => {
      const next = loadNotes().filter((_, i) => i !== idx);
      saveNotes(next);
      renderNotes();
    });
    right.appendChild(edit);
    right.appendChild(remove);

    li.appendChild(left);
    li.appendChild(right);
    notesList.appendChild(li);
  });
}

function addNote() {
  const date = normalizeDate(dateInput.value);
  const address = addressInput.value.trim();
  const desc = descInput.value.trim();
  const cost = (costInput.value || '').toString().trim();

  if (!date || !address || !desc || !cost) {
    showHint('Заполните все поля.');
    return;
  }

  const notes = loadNotes();
  notes.push({ date, address, desc, cost });
  saveNotes(notes);
  renderNotes();
  clearForm();
  showHint('Заметка добавлена.', 1500);
}

function startEdit(idx) {
  const notes = loadNotes();
  const n = notes[idx];
  if (!n) return;
  editingIndex = idx;
  dateInput.value = n.date;
  addressInput.value = n.address;
  descInput.value = n.desc;
  costInput.value = n.cost;
  // toggle buttons
  addBtn.classList.add('hidden');
  saveEditBtn.classList.remove('hidden');
  cancelEditBtn.classList.remove('hidden');
  showHint('Редактирование: внесите правки и нажмите "Сохранить изменения".');
}

function saveEdit() {
  if (editingIndex === null) return;
  const date = normalizeDate(dateInput.value);
  const address = addressInput.value.trim();
  const desc = descInput.value.trim();
  const cost = (costInput.value || '').toString().trim();
  if (!date || !address || !desc || !cost) {
    showHint('Заполните все поля.');
    return;
  }
  const notes = loadNotes();
  if (!notes[editingIndex]) return cancelEdit();
  notes[editingIndex] = { date, address, desc, cost };
  saveNotes(notes);
  renderNotes();
  cancelEdit();
  showHint('Изменения сохранены.', 1500);
}

function cancelEdit() {
  editingIndex = null;
  clearForm();
  // keep current date field value as is
  addBtn.classList.remove('hidden');
  saveEditBtn.classList.add('hidden');
  cancelEditBtn.classList.add('hidden');
}

function clearForm() {
  addressInput.value = '';
  descInput.value = '';
  costInput.value = '';
  // keep date to add multiple for same date
}

function showHint(text, ttlMs = 2500) {
  hint.textContent = text;
  if (ttlMs > 0) {
    setTimeout(() => { if (hint.textContent === text) hint.textContent = ''; }, ttlMs);
  }
}

function generateReport() {
  const notes = loadNotes();
  if (notes.length === 0) {
    reportOutput.value = '';
    showHint('Нет данных для отчёта.');
    return;
  }

  // Group by date
  const byDate = new Map();
  for (const n of notes) {
    if (!byDate.has(n.date)) byDate.set(n.date, []);
    byDate.get(n.date).push(n);
  }

  // Sort dates by inferred calendar order if possible
  const parseComparable = (dstr) => {
    // Try to parse "D month (weekday)"
    const m = dstr.match(/^(\d{1,2})\s+([а-яё]+)/i);
    if (m) {
      const d = parseInt(m[1], 10);
      const monIdx = ruMonthsGenitive.findIndex(x => x === m[2].toLowerCase());
      if (monIdx !== -1) {
        const y = new Date().getFullYear();
        return new Date(y, monIdx, d).getTime();
      }
    }
    return Number.MAX_SAFE_INTEGER; // unknown format, push to end
  };

  const dates = Array.from(byDate.keys()).sort((a,b) => parseComparable(a) - parseComparable(b));
  let total = 0;
  const chunks = [];

  for (const d of dates) {
    chunks.push(d);
    const items = byDate.get(d);
    for (const it of items) {
      const line = `${it.address}. ${it.desc}. ${it.cost} руб.`;
      chunks.push(line);
      const num = parseInt((it.cost || '').toString().replace(/\D+/g, ''), 10);
      if (!Number.isNaN(num)) total += num;
    }
    chunks.push(''); // empty line between dates
  }
  chunks.push(`Всего: ${total} руб.`);

  reportOutput.value = chunks.join('\n');
}

function copyReport() {
  if (!reportOutput.value) {
    showHint('Отчёт пуст.');
    return;
  }
  reportOutput.select();
  document.execCommand('copy');
  showHint('Скопировано.', 1500);
}

function clearAll() {
  if (!confirm('Очистить все заметки?')) return;
  saveNotes([]);
  renderNotes();
  reportOutput.value = '';
}

// Wire events
addBtn.addEventListener('click', addNote);
saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', cancelEdit);
reportBtn.addEventListener('click', generateReport);
clearBtn.addEventListener('click', clearAll);
copyBtn.addEventListener('click', copyReport);

// Enter to add from any field
[dateInput, addressInput, descInput, costInput].forEach(el => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addNote();
  });
});

// Initial render
renderNotes();


