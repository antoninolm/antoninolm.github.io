const API_KEY = '9ba30aeac9bb067c96e5cb812e316c25'; // ← replace with your free key from openweathermap.org/api
const BASE = 'https://api.openweathermap.org/data/2.5';

let currentData = null;
let forecastData = null;
let unit = 'C';

const searchInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const unitToggle = document.getElementById('unit-toggle');
const statusEl = document.getElementById('status');
const currentSection = document.getElementById('current-weather');
const forecastSection = document.getElementById('forecast');

function toF(c) { return Math.round(c * 9 / 5 + 32); }
function displayTemp(c) { return unit === 'C' ? `${Math.round(c)}°C` : `${toF(c)}°F`; }

function showStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = 'status' + (isError ? ' status--error' : '');
  currentSection.hidden = true;
  forecastSection.hidden = true;
}

function renderCurrent() {
  if (!currentData) return;
  const d = currentData;
  document.getElementById('city-name').textContent = `${d.name}, ${d.sys.country}`;
  document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`;
  document.getElementById('weather-icon').alt = d.weather[0].description;
  document.getElementById('temp').textContent = displayTemp(d.main.temp);
  document.getElementById('description').textContent = d.weather[0].description.toUpperCase();
  document.getElementById('feels-like').textContent = displayTemp(d.main.feels_like);
  document.getElementById('humidity').textContent = `${d.main.humidity}%`;
  document.getElementById('wind').textContent = `${Math.round(d.wind.speed)} m/s`;
  currentSection.hidden = false;
}

function renderForecast() {
  if (!forecastData) return;
  const list = forecastData.list;

  // Group by day, pick the entry closest to noon (12:00)
  const byDay = {};
  list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!byDay[date]) byDay[date] = [];
    byDay[date].push(item);
  });

  const days = Object.keys(byDay).slice(0, 5);
  const grid = document.getElementById('forecast-grid');
  grid.innerHTML = '';

  days.forEach(date => {
    const slots = byDay[date];
    const noon = slots.find(s => s.dt_txt.includes('12:00:00')) || slots[0];
    const temps = slots.map(s => s.main.temp);
    const high = Math.max(...temps);
    const low = Math.min(...temps);

    const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <p class="forecast-day">${label.toUpperCase()}</p>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${noon.weather[0].icon}@2x.png" alt="${noon.weather[0].description}">
      <p class="forecast-desc">${noon.weather[0].description.toUpperCase()}</p>
      <p class="forecast-temps"><span class="temp-high">${displayTemp(high)}</span> / <span class="temp-low">${displayTemp(low)}</span></p>
    `;
    grid.appendChild(card);
  });

  forecastSection.hidden = false;
}

async function fetchWeather(city) {
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    showStatus('⚠ Add your OpenWeatherMap API key to app.js to enable live data.', true);
    return;
  }

  showStatus('LOADING…');

  try {
    const [curRes, fcRes] = await Promise.all([
      fetch(`${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
    ]);

    if (!curRes.ok) {
      const err = await curRes.json();
      showStatus(`ERROR: ${err.message || 'City not found.'}`, true);
      return;
    }

    currentData = await curRes.json();
    forecastData = await fcRes.json();
    statusEl.textContent = '';
    renderCurrent();
    renderForecast();
  } catch (e) {
    showStatus('ERROR: Network request failed. Check your connection.', true);
  }
}

searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) fetchWeather(city);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const city = searchInput.value.trim();
    if (city) fetchWeather(city);
  }
});

unitToggle.addEventListener('click', () => {
  unit = unit === 'C' ? 'F' : 'C';
  unitToggle.textContent = unit === 'C' ? '°C / °F' : '°F / °C';
  renderCurrent();
  renderForecast();
});
