const API_KEY = 'V4AncrBaRBEqyt0OBIyZWJ9d7rlrGmsyY6CYssWH'; // ← get your free key at api-ninjas.com

// Grab the elements we need from the page
const mealInput   = document.getElementById('meal-input');
const calcBtn     = document.getElementById('calc-btn');
const clearBtn    = document.getElementById('clear-btn');
const statusEl    = document.getElementById('status');
const resultsEl   = document.getElementById('results');
const itemListEl  = document.getElementById('item-list');
const totalCalEl  = document.getElementById('total-calories');

// Show a status message and hide the results panel
function showStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.className   = 'status' + (isError ? ' status--error' : '');
  resultsEl.hidden     = true;
}

function calcCalories(item) {
  const p = parseFloat(item.protein_g) || 0;
  const c = parseFloat(item.carbohydrates_total_g) || 0;
  const f = parseFloat(item.fat_total_g) || 0;
  console.log('macros:', { protein: p, carbs: c, fat: f });
  return (p * 4) + (c * 4) + (f * 9);
}

// Build one result row for a single food item
function buildItemRow(item) {
  const li = document.createElement('li');
  li.className = 'item-row';
  li.innerHTML = `
    <div class="item-row__header">
      <span class="item-name">${item.name.toUpperCase()}</span>
      <span class="item-calories">${Math.round(calcCalories(item))} kcal</span>
    </div>
    <div class="item-row__meta">
      <span>PROTEIN: ${item.protein_g}g</span>
      <span>CARBS: ${item.carbohydrates_total_g}g</span>
      <span>FAT: ${item.fat_total_g}g</span>
    </div>
  `;
  return li;
}

// Main function — fetches nutrition data and renders results
async function calculateCalories() {
  const meal = mealInput.value.trim();
  if (!meal) return;

  if (API_KEY === 'YOUR_API_KEY_HERE') {
    showStatus('⚠ Add your API Ninjas key to app.js to enable calorie lookup.', true);
    return;
  }

  showStatus('CALCULATING…', false);

  try {
    // The API Ninjas Nutrition endpoint requires the key in a request header
    const response = await fetch(
      'https://api.api-ninjas.com/v1/nutrition?query=' + encodeURIComponent(meal),
      { headers: { 'X-Api-Key': API_KEY } }
    );

    if (!response.ok) {
      showStatus('ERROR: Could not reach the API. Check your key and try again.', true);
      return;
    }

    const items = await response.json();

    if (items.length === 0) {
      showStatus('No nutrition data found for that input. Try a more specific description.', true);
      return;
    }

    // Clear previous results
    itemListEl.innerHTML = '';

    // Add a row for each food item
    let totalCalories = 0;
    items.forEach(function(item) {
      itemListEl.appendChild(buildItemRow(item));
      totalCalories += calcCalories(item);
    });

    totalCalEl.textContent = Math.round(totalCalories) + ' kcal';

    statusEl.textContent = '';
    resultsEl.hidden = false;

  } catch (error) {
    showStatus('ERROR: Network request failed. Check your connection.', true);
  }
}

// Button click
calcBtn.addEventListener('click', calculateCalories);

// Enter key in the input field
mealInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') calculateCalories();
});

// Clear button — reset everything
clearBtn.addEventListener('click', function() {
  mealInput.value    = '';
  statusEl.textContent = '';
  statusEl.className   = 'status';
  resultsEl.hidden     = true;
  mealInput.focus();
});
