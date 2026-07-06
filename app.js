// app.js

console.log('APP.JS LOADED');
import { auth, db } from "./firebase.js";

// App State
let state = {
  expenses: [],
  categories: [],
  checklist: [],
  emis: [],
  trips: [],
  theme: 'light',
  activeTab: 'dashboard',
  activeTripId: ''
};

let paymentModes =
  JSON.parse(localStorage.getItem('paymentModes')) || [
    'Cash',
    'UPI',
    'Credit Card',
    'Debit Card'
  ];

let editingEmiId = null;
const CURRENT_DATE = new Date();

const CURRENT_DATE_STR =
  CURRENT_DATE.getFullYear() +
  '-' +
  String(CURRENT_DATE.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(CURRENT_DATE.getDate()).padStart(2, '0');

// Weekly budget limit
let weeklyBudget =
  Number(localStorage.getItem('weeklyBudget')) || 1500;

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}



// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired');
  loadState();
  initTheme();
  setupTabNavigation();
  setupEventListeners();
  initAuth();
  runEmiAutoGenerator();
  loadPaymentModes();
  renderPaymentModes();
  const monthSelect = document.getElementById("analytics-month-select");
const yearSelect = document.getElementById("analytics-year-select");

if (monthSelect) {
    monthSelect.addEventListener("change", renderAnalytics);
}

if (yearSelect) {
    yearSelect.addEventListener("change", renderAnalytics);
}

 
});

function renderPaymentModes() {

  const select =
    document.getElementById('expense-form-payment-mode');

  select.innerHTML = '';

  paymentModes.forEach(mode => {

    const option =
      document.createElement('option');

    option.value = mode;
    option.textContent = mode;

    select.appendChild(option);

  });

  const addOption =
    document.createElement('option');

  addOption.value = 'Others';
  addOption.textContent = '+ Add New Payment Mode';

  select.appendChild(addOption);

}

document.addEventListener('change', (e) => {

  if (
    e.target.id === 'expense-form-payment-mode' &&
    e.target.value === 'Others'
  ) {

    const newMode =
      prompt('Enter a new payment mode');

    if (!newMode) {

      renderPaymentModes();

      return;

    }

    paymentModes.push(newMode);

    localStorage.setItem(
      'paymentModes',
      JSON.stringify(paymentModes)
    );

    renderPaymentModes();

    document.getElementById(
      'expense-form-payment-mode'
    ).value = newMode;

  }

});


// Load state from localStorage or Firestore based on auth
async function loadState() {
  // If user is authenticated, load from Firestore
  const user = auth.currentUser;
  if (user) {
    try {
      const docRef = db.collection('users').doc(user.uid);
      const doc = await docRef.get();
     if (doc.exists) {
  const data = doc.data();

  const snapshot = await db
    .collection('users')
    .doc(user.uid)
    .collection('expenses')
    .get();

  state.expenses = snapshot.docs.map(doc => doc.data());

  state.categories = data.categories || [...window.SpendlyDefaults.defaultCategories];
  state.checklist = data.checklist || [];
  state.emis = data.emis || [];
  state.trips = data.trips || [];
  state.theme = data.theme || 'light';
} else {
        // Document does not exist, initialize for new user
        state.expenses = [];
        state.categories = [...window.SpendlyDefaults.defaultCategories];
        state.checklist = [];
        state.emis = [];
        state.trips = [];
        state.theme = 'light';
        await docRef.set({
  categories: state.categories,
  checklist: state.checklist,
  emis: state.emis,
  trips: state.trips,
  theme: state.theme
});
      }
      // Save locally as fallback
      localStorage.setItem('spendly_expenses', JSON.stringify(state.expenses));
localStorage.setItem('spendly_categories', JSON.stringify(state.categories));
localStorage.setItem('spendly_checklist', JSON.stringify(state.checklist));
localStorage.setItem('spendly_emis', JSON.stringify(state.emis));
localStorage.setItem('spendly_trips', JSON.stringify(state.trips));
localStorage.setItem('spendly_theme', state.theme);

renderApp();
return;
    } catch (e) {
      console.error('Error loading Firestore state:', e);
    }
  }
  
  // Fallback to localStorage / mockData
  const storedExpenses = localStorage.getItem('spendly_expenses');
  const storedCategories = localStorage.getItem('spendly_categories');
  const storedChecklist = localStorage.getItem('spendly_checklist');
  const storedEmis = localStorage.getItem('spendly_emis');
  const storedTrips = localStorage.getItem('spendly_trips');
  const storedTheme = localStorage.getItem('spendly_theme');

  state.expenses = storedExpenses ? JSON.parse(storedExpenses) : [...window.SpendlyDefaults.defaultExpenses];
  state.categories = storedCategories ? JSON.parse(storedCategories) : [...window.SpendlyDefaults.defaultCategories];
  state.checklist = storedChecklist ? JSON.parse(storedChecklist) : [...window.SpendlyDefaults.defaultChecklist];
  state.emis = storedEmis ? JSON.parse(storedEmis) : [...window.SpendlyDefaults.defaultEmis];
  state.trips = storedTrips ? JSON.parse(storedTrips) : [...window.SpendlyDefaults.defaultTrips];
  state.theme = storedTheme || 'light';
  
  // Save back initially to establish keys
  localStorage.setItem('spendly_expenses', JSON.stringify(state.expenses));
  localStorage.setItem('spendly_categories', JSON.stringify(state.categories));
  localStorage.setItem('spendly_checklist', JSON.stringify(state.checklist));
  localStorage.setItem('spendly_emis', JSON.stringify(state.emis));
  localStorage.setItem('spendly_trips', JSON.stringify(state.trips));
  localStorage.setItem('spendly_theme', state.theme);
}

// Save state to localStorage and Firestore when authenticated
function saveState() {
  // Persist to localStorage always
  localStorage.setItem('spendly_expenses', JSON.stringify(state.expenses));
  localStorage.setItem('spendly_categories', JSON.stringify(state.categories));
  localStorage.setItem('spendly_checklist', JSON.stringify(state.checklist));
  localStorage.setItem('spendly_emis', JSON.stringify(state.emis));
  localStorage.setItem('spendly_trips', JSON.stringify(state.trips));
  localStorage.setItem('spendly_theme', state.theme);

  // Also sync to Firestore if user is logged in
  const user = auth.currentUser;
  if (user) {
    db.collection('users').doc(user.uid).set({
      categories: state.categories,
      checklist: state.checklist,
      emis: state.emis,
      trips: state.trips,
      theme: state.theme
    })
    .catch(e => console.error(e));
  }
}
// Theme Handling
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerHTML = state.theme === 'dark' 
      ? '<i class="fa-solid fa-sun"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  initTheme();
  saveState();
  
  // Re-render charts to update grid and text colors
  renderCharts();
}

// Tab switcher
function setupTabNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      
      // Update UI menu
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Update Tab Panes
      const tabPanes = document.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      const targetPane = document.getElementById(`tab-${tabId}`);
      if (targetPane) {
        targetPane.classList.add('active');
      }

      state.activeTab = tabId;
      console.log("Expenses loaded:", state.expenses);
      renderApp();
    });
  });
}

// Global Event Listeners
// Initialize Firebase Auth UI and listeners
function initAuth() {
  const loginPage = document.getElementById('login-page');
  const appContainer = document.querySelector('.app-container');

  // Observe auth state changes
  auth.onAuthStateChanged(async (user) => {
    const logoutBtn = document.getElementById('logout-btn');
    const avatar = document.getElementById('user-avatar');
    
    if (user) {
      // User signed in
      if (loginPage) loginPage.classList.add('hidden');
      if (appContainer) appContainer.classList.remove('hidden');
      if (logoutBtn) logoutBtn.classList.remove('hidden');
      
      // Update avatar
      const initials = (user.displayName || user.email || 'US')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      if (avatar) {
        avatar.innerHTML = `<span>${initials}</span>`;
        avatar.title = user.displayName || user.email || '';
      }
        
        // Update welcome message dynamically!
        const welcomeHeading = document.querySelector('.welcome-heading');
        if (welcomeHeading) {
          const displayName = user.displayName ? user.displayName.split(' ')[0] : 'there';
          welcomeHeading.textContent = `Hey there, ${displayName}`;
        }

      await loadState(); // load from Firestore within loadState
    } else {
      // Signed out
      if (loginPage) loginPage.classList.remove('hidden');
      if (appContainer) appContainer.classList.add('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (avatar) {
        avatar.innerHTML = `<span>G</span>`;
        avatar.title = 'Guest';
      }
      // Re-initialize local storage state
      await loadState();
    }
    renderApp();
  });

  // Attach login page event listeners (Google sign-in, Email sign-in, Register, Tabs)
  const googleLoginBtn = document.getElementById('google-login-btn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(e => {
        console.error('Google sign-in error:', e);
        alert('Google sign-in failed. Please try again.');
      });
    });
  }

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('email-login-form');
  const submitBtn = document.getElementById('login-submit-btn');
  const titleEl = document.getElementById('login-page-title');
  const subtitleEl = document.getElementById('login-page-subtitle');
  
  let authMode = 'login'; // 'login' or 'register'

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      authMode = 'login';
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      submitBtn.textContent = 'Sign In';
      titleEl.textContent = 'Welcome back';
      subtitleEl.textContent = 'Sign in to access your dashboard.';
    });

    tabRegister.addEventListener('click', () => {
      authMode = 'register';
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      submitBtn.textContent = 'Sign Up';
      titleEl.textContent = 'Create an account';
      subtitleEl.textContent = 'Start tracking your budgets and expenses.';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email-input').value.trim();
      const password = document.getElementById('login-password-input').value;

      if (!email || !password) {
        alert('Please fill out all fields.');
        return;
      }

      if (authMode === 'login') {
        auth.signInWithEmailAndPassword(email, password).catch(e => {
          console.error('Sign-in error:', e);
          alert(`Sign-in failed: ${e.message}`);
        });
      } else {
        auth.createUserWithEmailAndPassword(email, password).then((userCredential) => {
          const user = userCredential.user;
          user.updateProfile({
            displayName: email.split('@')[0]
          }).then(() => {
            renderApp();
          });
        }).catch(e => {
          console.error('Register error:', e);
          alert(`Registration failed: ${e.message}`);
        });
      }
    });
  }

  // Header logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut().catch(e => console.error('Logout error:', e));
    });
  }
}



async function saveExpenseToFirestore(expense) {
  const user = auth.currentUser;

  if (!user) {
    console.log('No logged-in user. Skipping Firestore save.');
    return;
  }

  try {
    await db.collection('users')
      .doc(user.uid)
      .collection('expenses')
      .doc(expense.id)
      .set(expense);

    console.log('Firestore write successful');
  } catch (e) {
    console.error('Firestore write failed:', e);
  }
}

function setupEventListeners() {
  // Theme Toggle
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Modal Backdrop
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeAllModals);
  }

  // Close buttons inside modals
  document.querySelectorAll('.modal-close-btn, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // EXPENSE MODAL
 const addExpenseBtn = document.getElementById('add-expense-btn');
if (addExpenseBtn) {
  addExpenseBtn.addEventListener('click', () => {
    openExpenseModal();
  });
}

// EXPORT EXCEL
const exportExcelBtn = document.getElementById('export-excel-btn');
if (exportExcelBtn) {
  exportExcelBtn.addEventListener('click', () => {
    console.log('Export clicked');
    exportExpensesToExcel();
  });
}

  const expenseForm = document.getElementById('expense-form');
  if (expenseForm) {
    expenseForm.addEventListener('submit', handleExpenseSubmit);
  }

  const expFormMode = document.getElementById('exp-form-mode');
  if (expFormMode) {
    expFormMode.addEventListener('change', () => {
      toggleBankField('exp-form-mode', 'exp-bank-group');
    });
  }

  const paymentModeSelect = document.getElementById('exp-form-mode');

let customPaymentModes =
  JSON.parse(localStorage.getItem('customPaymentModes')) || [];

function loadPaymentModes() {

  const select = document.getElementById('exp-form-mode');

  select.innerHTML = `
    <option value="Cash">Cash</option>
    <option value="UPI">UPI</option>
    <option value="Credit Card">Credit Card</option>
    <option value="Debit Card">Debit Card</option>
  `;

  customPaymentModes.forEach(mode => {

    const option = document.createElement('option');

    option.value = mode;
    option.textContent = mode;

    select.appendChild(option);

  });

  const addOption = document.createElement('option');

  addOption.value = 'Others';
  addOption.textContent = '+ Add New Payment Mode';

  select.appendChild(addOption);

}

  // CATEGORY MODAL
  const addCategoryBtn = document.getElementById('add-category-btn');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
      openModal('category-modal');
    });
  }

  const categoryForm = document.getElementById('category-form');
  if (categoryForm) {
    categoryForm.addEventListener('submit', handleCategorySubmit);
  }

  // CHECKLIST MODAL
  const addChecklistBtn = document.getElementById('add-checklist-btn');
  if (addChecklistBtn) {
    addChecklistBtn.addEventListener('click', () => {
      openChecklistModal();
    });
  }

  const checklistForm = document.getElementById('checklist-form');
  if (checklistForm) {
    checklistForm.addEventListener('submit', handleChecklistSubmit);
  }

  const chkFormMode = document.getElementById('chk-form-mode');
  if (chkFormMode) {
    chkFormMode.addEventListener('change', () => {
      toggleBankField('chk-form-mode', 'chk-bank-group');
    });
  }

  // EMI MODAL
  const addEmiBtn = document.getElementById('add-emi-btn');
  if (addEmiBtn) {
    addEmiBtn.addEventListener('click', () => {
      openEmiModal();
    });
  }

  const emiForm = document.getElementById('emi-form');
  if (emiForm) {
    emiForm.addEventListener('submit', handleEmiSubmit);
  }

  const emiFormMode = document.getElementById('emi-form-mode');
  if (emiFormMode) {
    emiFormMode.addEventListener('change', () => {
      toggleBankField('emi-form-mode', 'emi-bank-group');
    });
  }

  // TRIP MODAL
  const addTripBtn = document.getElementById('add-trip-btn');
  if (addTripBtn) {
    addTripBtn.addEventListener('click', () => {
      openModal('trip-modal');
    });
  }

  const tripForm = document.getElementById('trip-form');
  if (tripForm) {
    tripForm.addEventListener('submit', handleTripSubmit);
  }

  // SEARCH FILTER SUBMITS
  const searchSubmitBtn = document.getElementById('search-submit-btn');
  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', executeSearch);
  }

  const searchResetBtn = document.getElementById('search-reset-btn');
  if (searchResetBtn) {
    searchResetBtn.addEventListener('click', resetSearchFilters);
  }

  // EMI alert banner close
  const alertCloseBtn = document.querySelector('.alert-close-btn');
  if (alertCloseBtn) {
    alertCloseBtn.addEventListener('click', () => {
      const banner = document.getElementById('emi-alert-banner');
      if (banner) banner.classList.add('hidden');
    });
  }

  // Dashboard "View All" redirects to Search tab
  const viewAllBtn = document.getElementById('view-all-transactions-btn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      const searchNavBtn = document.querySelector('.nav-item[data-tab="search"]');
      if (searchNavBtn) searchNavBtn.click();
    });
  }

  const yearSelect = document.getElementById("analytics-year-select");
const monthSelect = document.getElementById("analytics-month-select");

if (yearSelect) {
    yearSelect.addEventListener("change", renderAnalytics);
}

if (monthSelect) {
    monthSelect.addEventListener("change", renderAnalytics);
}
}

// Modal open/close helpers
function openModal(modalId) {
  closeAllModals();
  document.getElementById('modal-backdrop').classList.remove('hidden');
  document.getElementById(modalId).classList.remove('hidden');
}

function closeAllModals() {
  document.getElementById('modal-backdrop').classList.add('hidden');
  document.querySelectorAll('.modal-window').forEach(modal => {
    modal.classList.add('hidden');
  });
  // Reset forms
  document.getElementById('expense-form').reset();
  document.getElementById('category-form').reset();
  document.getElementById('checklist-form').reset();
  document.getElementById('emi-form').reset();
  document.getElementById('trip-form').reset();
  document.getElementById('expense-edit-id').value = '';
}

// Show/Hide Bank field based on card modes
function toggleBankField(modeSelectId, bankGroupDivId) {
  const mode = document.getElementById(modeSelectId).value;
  const bankGroup = document.getElementById(bankGroupDivId);
  if (
    mode === 'Credit Card' ||
    mode === 'Debit Card' ||
    mode === 'UPI' ||
    mode == 'Others'
) {
    bankGroup.style.display = 'block';
    bankGroup.querySelector('input').setAttribute('required', 'true');
  } else {
    bankGroup.style.display = 'none';
    bankGroup.querySelector('input').removeAttribute('required');
  }
}

// Load dropdown options
function populateCategoryDropdowns() {
  const dropdownIds = ['exp-form-category', 'chk-form-category', 'emi-form-category', 'search-category'];
  
  dropdownIds.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    
    // Clear and add defaults
    select.innerHTML = id === 'search-category' ? '<option value="all">All Categories</option>' : '';
    
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  });
}

function populateTripDropdowns() {
  const select = document.getElementById('exp-form-trip');
  if (!select) return;
  
  select.innerHTML = '<option value="">None (Personal)</option>';
  
  state.trips.forEach(trip => {
    const opt = document.createElement('option');
    opt.value = trip.id;
    opt.textContent = trip.name;
    select.appendChild(opt);
  });
}

// Render dynamic components
function renderApp() {
  populateCategoryDropdowns();
  populateTripDropdowns();
  
  renderTripGist();

  if (state.activeTab === 'dashboard') {
    renderDashboard();
  } else if (state.activeTab === 'analytics') {
    renderAnalytics();
  } else if (state.activeTab === 'checklist') {
    renderChecklist();
  } else if (state.activeTab === 'emis') {
    renderEmis();
  } else if (state.activeTab === 'trips') {
    renderTripsModule();
  } else if (state.activeTab === 'categories') {
    renderCategoriesModule();
  }
}
loadChecklist();
renderChecklist();

document
  .getElementById('add-checklist-item-btn')
  ?.addEventListener('click', () => {
      document
        .getElementById('checklist-modal')
        .classList.remove('hidden');
  });

document
  .getElementById('save-checklist-btn')
  ?.addEventListener('click', addChecklistItem);

// Get monday & sunday dates for current week relative to June 11, 2026
function getWeekRange() {
  // June 11, 2026 is Thursday. Monday is June 8, Sunday is June 14.
  const monday = new Date(CURRENT_DATE);
  monday.setDate(CURRENT_DATE.getDate() - (CURRENT_DATE.getDay() === 0 ? 6 : CURRENT_DATE.getDay() - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}
  
// RENDER: DASHBOARD
function renderDashboard() {

  
const weekRange = getWeekRange();
  
  // Filter expenses for this week
const weekExpenses = state.expenses.filter(exp => {

  const category = state.categories.find(
    c => c.name === exp.category
  );

  const d = new Date(exp.date + 'T12:00:00');

  return (
    d >= weekRange.start &&
    d <= weekRange.end &&
    !category?.excludeFromAnalytics
  );

});

  console.log("Dashboard function running");
  // Calculate metrics
  const totalSpentWeek = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const currentDate = new Date();

const monthExpenses = state.expenses.filter(exp => {
  const d = new Date(exp.date + 'T12:00:00');
  return (
    d.getMonth() === currentDate.getMonth() &&
    d.getFullYear() === currentDate.getFullYear()
  );
});

const totalSpentMonth = monthExpenses.reduce(
  (sum, exp) => sum + exp.amount,
  0
);
console.log("Monthly Expenses:", monthExpenses);
console.log("Total This Month:", totalSpentMonth);


console.log({
    weeklyBudget,
    totalSpentWeek,
    budgetLeft: weeklyBudget - totalSpentWeek
});

const budgetLeft = Math.max(0, weeklyBudget - totalSpentWeek);



  // Update UI values
  document.getElementById('metric-total-week').textContent =
  formatCurrency(Math.round(totalSpentWeek));

document.getElementById('metric-daily-average').textContent =
  formatCurrency(Math.round(totalSpentMonth));

document.getElementById('metric-budget-left').textContent =
  formatCurrency(Math.round(budgetLeft));

document.getElementById('weekly-spending-total').textContent =
  formatCurrency(Math.round(totalSpentWeek));

document.getElementById('donut-total-value').textContent =
  formatCurrency(Math.round(totalSpentWeek));

  const budgetInput = document.getElementById("weekly-budget-input");

if (budgetInput) {
    budgetInput.value = weeklyBudget;

    budgetInput.oninput = function () {
        weeklyBudget = Number(this.value) || 0;

        localStorage.setItem(
            "weeklyBudget",
            weeklyBudget
        );

        const budgetLeft = Math.max(
            0,
            weeklyBudget - totalSpentWeek
        );

        document.getElementById(
            "metric-budget-left"
        ).textContent = formatCurrency(budgetLeft);
    };
}
  // Populate recent transactions table (limit 6)
  const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent6 = sortedExpenses.slice(0, 6);
  
  const tbody = document.getElementById('recent-transactions-tbody');
  tbody.innerHTML = '';

  if (recent6.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transactions logged yet. Click "+ Add Expense" to start!</td></tr>`;
  } else {
    recent6.forEach(exp => {
      const tr = document.createElement('tr');
      
      const catObj = state.categories.find(c => c.name === exp.category) || { color: '#6b7280', icon: 'fa-tags' };
      const formattedDate = formatTransactionDate(exp.date);
      
      tr.innerHTML = `
        <td>
          <div class="transaction-merchant-cell">
            <div class="merchant-icon" style="background-color: ${catObj.color}15; color: ${catObj.color}; border-radius: 12px; width: 42px; height: 42px; font-size: 1.1rem; display: flex; align-items: center; justify-content: center;">
              <i class="fa-solid ${catObj.icon}"></i>
            </div>
            <div>
  <div class="merchant-name" style="font-size: 0.95rem; font-weight: 600;">
    ${escapeHTML(exp.title)}
  </div>

  ${exp.notes ?
    `<div class="merchant-subtext"
      style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem; font-style: italic;">
      Note: ${escapeHTML(exp.notes)}
    </div>`
    : ''
  }


</div>
          </div>
        </td>
        <td>
          <span class="badge" style="background-color: ${catObj.color}15; color: ${catObj.color}; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">${exp.category}</span>
        </td>
        <td style="font-size: 0.9rem;">
          ${exp.paymentMode} ${exp.bankName ? `<span style="color: var(--text-secondary); font-size: 0.8rem;">(${escapeHTML(exp.bankName)})</span>` : ''}
        </td>
        <td style="font-size: 0.9rem; color: var(--text-secondary);">${formattedDate}</td>
        <td class="text-right">
          <div class="transaction-amount-cell text-danger" style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary) !important; margin-bottom: 0.2rem;">-₹${exp.amount.toFixed(2)}</div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderCharts();
}

// Render line and donut charts based on active state
function renderCharts() {
  const isDark = state.theme === 'dark';
  const weekRange = getWeekRange();

  // Weekly spending spline chart data calculation
  // Monday = Index 0, Sunday = Index 6
  const dailyValues = [0, 0, 0, 0, 0, 0, 0];
  
state.expenses.forEach(exp => {

  const category = state.categories.find(
    c => c.name === exp.category
  );

  if (category?.excludeFromAnalytics) return;

  const d = new Date(exp.date + 'T12:00:00');

  if (d >= weekRange.start && d <= weekRange.end) {

    let dayIndex = d.getDay() - 1;

    if (dayIndex === -1) dayIndex = 6;

    dailyValues[dayIndex] += exp.amount;

  }

});

  window.SpendlyCharts.updateWeeklySpendingChart('weeklySpendingChart', dailyValues, isDark);

  // Donut category breakdown calculations
  const categorySums = {};
  state.categories.forEach(cat => {
    categorySums[cat.name] = 0;
  });

  // Calculate sums for current week
  let weekTotal = 0;
state.expenses.forEach(exp => {

  const category = state.categories.find(
    c => c.name === exp.category
  );

  if (category?.excludeFromAnalytics) return;

  const d = new Date(exp.date + 'T12:00:00');

  if (d >= weekRange.start && d <= weekRange.end) {

    if (categorySums[exp.category] !== undefined) {

      categorySums[exp.category] += exp.amount;
      weekTotal += exp.amount;

    }

  }

});

  // Build values for donut chart
  const donutNames = [];
  const donutValues = [];
  const donutColors = [];
  const legendsList = [];

  state.categories.forEach(cat => {
    if (cat.excludeFromAnalytics) return; 
    const amt = categorySums[cat.name];
    if (amt > 0) {
      donutNames.push(cat.name);
      donutValues.push(amt);
      donutColors.push(cat.color);
    }
    
    // Track for legend list rendering
    legendsList.push({
      name: cat.name,
      amount: amt,
      color: cat.color
    });
  });

  // If no weekly expense logged, draw an empty ring or placeholder donut
  if (donutValues.length === 0) {
    donutNames.push('No Expenses');
    donutValues.push(1);
    donutColors.push(isDark ? '#1e293b' : '#f1f5f9');
  }

  window.SpendlyCharts.updateCategoryDonutChart('categoryDonutChart', donutNames, donutValues, donutColors, isDark);

  // Render Custom HTML Legend List
  const legendContainer = document.getElementById('donut-legend-container');
  legendContainer.innerHTML = '';
  
  // Sort legend items by amount descending
  legendsList.sort((a, b) => b.amount - a.amount);
  
  legendsList.forEach(item => {
    if (item.amount === 0) return; // Hide empty categories in legend
    const pct = weekTotal > 0 ? Math.round((item.amount / weekTotal) * 100) : 0;
    
    const legendRow = document.createElement('div');
    legendRow.className = 'legend-item';
    legendRow.innerHTML = `
      <div class="legend-left">
        <span class="legend-color-dot" style="background-color: ${item.color}"></span>
        <span class="legend-label">${item.name}</span>
      </div>
      <div class="legend-right">
        <span class="legend-percent">${pct}%</span>
        <span>${formatCurrency(item.amount)}</span>
      </div>
    `;
    legendContainer.appendChild(legendRow);
  });
}


function populateAnalyticsFilters() {
    const yearSelect = document.getElementById("analytics-year-select");
    const monthSelect = document.getElementById("analytics-month-select");

    if (!yearSelect || !monthSelect) return;

    // Get all years from expenses
    const years = [...new Set(
        state.expenses.map(exp => new Date(exp.date).getFullYear())
    )].sort((a, b) => b - a);

    // If there are no expenses, use current year
    if (years.length === 0) {
        years.push(new Date().getFullYear());
    }

    // Populate year dropdown only once
    if (yearSelect.options.length === 0) {
        years.forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        if (years.includes(new Date().getFullYear())) {
            yearSelect.value = new Date().getFullYear();
        } else {
            yearSelect.value = years[0];
        }
    }

    // Populate month dropdown only once
    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    if (monthSelect.options.length === 0) {
        months.forEach((month, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = month;
            monthSelect.appendChild(option);
        });

        monthSelect.value = new Date().getMonth();
    }
}

// RENDER: ANALYTICS
function renderAnalytics() {
    populateAnalyticsFilters();

    const yearSelect = document.getElementById("analytics-year-select");
    const monthSelect = document.getElementById("analytics-month-select");

    if (!yearSelect || !monthSelect) return;

    const selectedYear = Number(yearSelect.value);
    const selectedMonth = Number(monthSelect.value);
    console.log("renderAnalytics fired");
    console.log("Year dropdown value:", yearSelect.value);
console.log("Month dropdown value:", monthSelect.value);
console.log("Available years:", [...yearSelect.options].map(o => o.value));
    const isDark = state.theme === "dark";

    // Filter expenses for selected year and month
    const monthExpenses = state.expenses.filter(exp => {
        const date = new Date(exp.date);

        return (
            date.getFullYear() === selectedYear &&
            date.getMonth() === selectedMonth
        );
    });

    console.log("Selected Year:", selectedYear);
    console.log("Selected Month:", selectedMonth);
    console.log("Filtered Expenses:", monthExpenses);

    // ==========================
    // Category totals
    // ==========================
    const catSums = {};

    state.categories.forEach(category => {
        catSums[category.name] = 0;
    });

    monthExpenses.forEach(exp => {
        if (catSums.hasOwnProperty(exp.category)) {
            catSums[exp.category] += Number(exp.amount);
        }
    });

    const barNames = [];
    const barValues = [];
    const barColors = [];

    state.categories.forEach(category => {
        barNames.push(category.name);
        barValues.push(catSums[category.name]);
        barColors.push(category.color);
    });

    console.log("Bar Values:", barValues);

    window.SpendlyCharts.updateMonthlyCategoryBarChart(
        "monthlyCategoryBarChart",
        barNames,
        barValues,
        barColors,
        isDark
    );

    // ==========================
    // Weekly totals
    // ==========================
    const weeklyValues = [0, 0, 0, 0, 0];

    monthExpenses.forEach(exp => {
        const day = Number(exp.date.split("-")[2]);

        if (day <= 7) {
            weeklyValues[0] += Number(exp.amount);
        } else if (day <= 14) {
            weeklyValues[1] += Number(exp.amount);
        } else if (day <= 21) {
            weeklyValues[2] += Number(exp.amount);
        } else if (day <= 28) {
            weeklyValues[3] += Number(exp.amount);
        } else {
            weeklyValues[4] += Number(exp.amount);
        }
    });

    console.log("Weekly Values:", weeklyValues);

    window.SpendlyCharts.updateMonthlyTrendLineChart(
        "monthlyTrendLineChart",
        weeklyValues,
        isDark
    );
}

// RENDER: CHECKLIST
function renderChecklist() {
  const unpaidUl = document.getElementById('checklist-unpaid-ul');

unpaidUl.innerHTML = '';
  if (state.checklist.length === 0) {
  unpaidUl.innerHTML = `
    <div class="p-4 text-center text-muted">
      No reminders added yet.
    </div>
  `;
} else {

  state.checklist.forEach(item => {

    const li = document.createElement('li');
    li.className = 'checklist-item';

    li.innerHTML = `
      <div class="checklist-checkbox-wrapper">
        <input
          type="checkbox"
          class="checklist-chk-box"
          data-id="${item.id}"
          ${item.isPaid ? 'checked' : ''}
        >
      </div>

      <div class="checklist-details">

        <div class="checklist-title-row">

          <span
            class="checklist-title"
            style="
              text-decoration:${item.isPaid ? 'line-through' : 'none'};
              opacity:${item.isPaid ? '0.6' : '1'};
            "
          >
            ${escapeHTML(item.title)}
          </span>

        </div>

        ${
          item.notes
            ? `<div class="checklist-notes">${escapeHTML(item.notes)}</div>`
            : ''
        }

      </div>

      <div class="checklist-actions">
        <button
          class="checklist-btn-delete"
          data-id="${item.id}"
        >
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;

    unpaidUl.appendChild(li);
  });
}

  // Setup click handles inside list
  document.querySelectorAll('.checklist-chk-box').forEach(box => {
    box.addEventListener('change', (e) => {
      const itemId = e.target.getAttribute('data-id');
      handlePayChecklistItem(itemId);
    });
  });

  document.querySelectorAll('.checklist-btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = btn.getAttribute('data-id');
      deleteChecklistItem(itemId);
    });
  });
}

// Checklist Actions
function handlePayChecklistItem(itemId) {

  const item = state.checklist.find(c => c.id === itemId);

  if (!item) return;

  item.isPaid = !item.isPaid;

  saveState();
  renderChecklist();
}

function deleteChecklistItem(itemId) {
  state.checklist = state.checklist.filter(c => c.id !== itemId);
  saveState();
  renderChecklist();
}



// RENDER: EMIs
function renderEmis() {
  const tbody = document.getElementById('emis-tbody');
  tbody.innerHTML = '';

  if (state.emis.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted p-4">No EMI plans tracked yet. Track an EMI above!</td></tr>`;
    return;
  }

  state.emis.forEach(emi => {
    const tr = document.createElement('tr');
    
    // Determine status & installments generated
    const start = new Date(emi.startMonth + '-01T12:00:00');
    // Calculate total months active
    const elapsedMonths = getMonthsBetween(start, CURRENT_DATE) + 1;
    const paidInstallments = Math.min(emi.durationMonths, Math.max(0, elapsedMonths));
    const totalPayment = emi.monthlyAmount * emi.durationMonths;
    const interestPaid = totalPayment - emi.principalAmount;
    const status = paidInstallments >= emi.durationMonths ? 'Completed' : 'Active';
    const statusClass = status === 'Completed' ? 'text-success' : 'text-warning';
    

    tr.innerHTML = `
      <td><strong>${escapeHTML(emi.title)}</strong><div class="merchant-subtext">${escapeHTML(emi.notes || '')}</div></td>
      <td>${formatCurrency(emi.monthlyAmount)}</td>
      <td>
  ${formatCurrency(emi.principalAmount || 0)}
</td>

<td>
  ${formatCurrency(totalPayment)}
</td>

<td>
  ${formatCurrency(interestPaid)}
</td>
      <td>${emi.category}</td>
      <td>${emi.paymentMode}</td>
      <td>${escapeHTML(emi.bankName || '-')}</td>
      <td>${emi.startMonth}</td>
      <td>${paidInstallments} / ${emi.durationMonths} Months</td>
      <td>${emi.autoGenerate ? '<span class="text-success"><i class="fa-solid fa-check"></i> Auto</span>' : '<span class="text-muted">Manual</span>'}</td>
      <td class="${statusClass} font-weight-600">${status}</td>
<td class="text-center">
  <button class="btn btn-primary btn-sm btn-edit-emi me-2"
          data-id="${emi.id}"
          title="Edit EMI">
    <i class="fa-solid fa-pen"></i>
  </button>

  <button class="btn btn-secondary btn-sm btn-delete-emi"
          data-id="${emi.id}"
          title="Stop tracking EMI">
    <i class="fa-regular fa-trash-can"></i>
  </button>
</td>
    `;
    tbody.appendChild(tr);
  });

  // Attach delete triggers
  document.querySelectorAll('.btn-delete-emi').forEach(btn => {
    btn.addEventListener('click', () => {
      const emiId = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to stop tracking this EMI plan? (Historical generated payments will be preserved)')) {
        state.emis = state.emis.filter(e => e.id !== emiId);
        saveState();
        renderEmis();
      }
    });
  });
  document.querySelectorAll('.btn-edit-emi').forEach(btn => {
  btn.addEventListener('click', () => {
    const emiId = btn.getAttribute('data-id');
    editEmi(emiId);
  });
});
}
  


// RENDER: TRIPS
function renderTripsModule() {
  const cardsContainer = document.getElementById('trips-cards-container');
  cardsContainer.innerHTML = '';

  if (state.trips.length === 0) {
    cardsContainer.innerHTML = `<div class="p-4 text-center text-muted">No trip groups configured. Create one above!</div>`;
    document.getElementById('trip-detail-content').innerHTML = `
      <div class="text-center text-muted p-5">
        <i class="fa-solid fa-plane-departure fa-3x mb-3"></i>
        <p>Create a trip to track specific project expenses.</p>
      </div>
    `;
    return;
  }

  // Draw Trip Cards
  state.trips.forEach(trip => {
    const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const progressPercent = Math.min(100, (totalSpent / trip.budget) * 100);
    const isOverBudget = totalSpent > trip.budget;
    const progressClass = isOverBudget ? 'overbudget' : '';
    
    const card = document.createElement('div');
    card.className = `trip-card ${state.activeTripId === trip.id ? 'active' : ''}`;
    card.setAttribute('data-id', trip.id);
    card.innerHTML = `
      <div class="trip-card-header">
        <span class="trip-card-title">${escapeHTML(trip.name)}</span>
        <span class="trip-card-value">${formatCurrency(Math.round(totalSpent))} / ${formatCurrency(Number(trip.budget))}</span>
      </div>
      <div class="trip-progress-bar-bg">
        <div class="trip-progress-bar-fill ${progressClass}" style="width: ${progressPercent}%"></div>
      </div>
      <div class="trip-card-meta">
        <span>${trip.expenses.length} Transactions</span>
        <span class="${isOverBudget ? 'text-danger font-weight-600' : 'text-muted'}">
          ${isOverBudget ? 'Over Budget!' : formatCurrency(Math.round(trip.budget - totalSpent))} left
        </span>
      </div>
    `;
    cardsContainer.appendChild(card);
  });

  // Attach click listener to active card
  document.querySelectorAll('.trip-card').forEach(card => {
    card.addEventListener('click', () => {
      state.activeTripId = card.getAttribute('data-id');
      renderTripsModule();
    });
  });

  // Render detail panel for selected trip
  const detailPanel = document.getElementById('trip-detail-content');
  const activeTrip = state.trips.find(t => t.id === state.activeTripId);

  if (!activeTrip) {
    // Select first one by default if not set
    if (state.trips.length > 0) {
      state.activeTripId = state.trips[0].id;
      renderTripsModule();
    }
    return;
  }

  // Calculate stats
  const spent = activeTrip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = activeTrip.budget - spent;
  const statusText =
remaining >= 0
  ? formatCurrency(remaining)
  : formatCurrency(Math.abs(remaining));
  const statusColor = remaining >= 0 ? 'text-success' : 'text-danger';

  detailPanel.innerHTML = `
    <div class="trip-detail-header">
      <div>
        <h3 class="trip-detail-title">${escapeHTML(activeTrip.name)}</h3>
        <p class="text-muted">Budgets & Expenses Group</p>
      </div>
      <div class="trip-detail-actions">
        <button id="btn-add-trip-expense" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-plus"></i> Add Trip Expense
        </button>
        <button id="btn-delete-trip" class="btn btn-secondary btn-sm text-danger">
          <i class="fa-regular fa-trash-can"></i> Delete Trip
        </button>
      </div>
    </div>

    <div class="trip-stats-grid">
      <div class="trip-stat-card">
        <div class="trip-stat-label">Budget Allocated</div>
        <div class="trip-stat-val">${formatCurrency(activeTrip.budget)}</div>
      </div>
      <div class="trip-stat-card">
        <div class="trip-stat-label">Total Spent</div>
        <div class="trip-stat-val text-danger">${formatCurrency(spent)}</div>
      </div>
      <div class="trip-stat-card">
        <div class="trip-stat-label">Wallet Balance</div>
        <div class="trip-stat-val ${statusColor}">${statusText}</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h4 class="panel-title">Trip Ledger</h4>
      </div>
      <div class="panel-body">
        <div class="table-responsive">
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Expense / Merchant</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th>Date</th>
                <th class="text-right">Amount</th>
                <th style="width:50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${activeTrip.expenses.length === 0 ? `<tr><td colspan="6" class="text-center text-muted p-4">No expenses associated with this trip yet. Click Add Trip Expense!</td></tr>` : ''}
              ${activeTrip.expenses.map(exp => {
                const catObj = state.categories.find(c => c.name === exp.category) || { color: '#6b7280' };
                return `
                  <tr>
                    <td><strong>${escapeHTML(exp.title)}</strong>${exp.notes ? `<div class="merchant-subtext">${escapeHTML(exp.notes)}</div>` : ''}</td>
                    <td><span class="badge" style="background-color: ${catObj.color}15; color: ${catObj.color}">${exp.category}</span></td>
                    <td>${exp.paymentMode} ${exp.bankName ? `(${escapeHTML(exp.bankName)})` : ''}</td>
                    <td>${exp.date}</td>
                    <td class="text-right text-danger font-weight-600">-₹${exp.amount.toFixed(2)}</td>
                    <td>
                      <button class="btn-delete-trip-expense cat-btn-delete" data-exp-id="${exp.id}" title="Remove expense">
                        &times;
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Attach trip sub-actions
  document.getElementById('btn-add-trip-expense').addEventListener('click', () => {
    openExpenseModal();
    // Preselect trip
    document.getElementById('exp-form-trip').value = state.activeTripId;
  });

  document.getElementById('btn-delete-trip').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this trip and all its associated expenses?')) {
      const tripToDelete = state.trips.find(t => t.id === state.activeTripId);
      if (tripToDelete) {
        const tripExpenseIds = tripToDelete.expenses.map(exp => exp.id);
        const baseExpenseIds = tripExpenseIds.map(id => id.replace(/^trip-/, ''));
        state.expenses = state.expenses.filter(exp => !tripExpenseIds.includes(exp.id) && !baseExpenseIds.includes(exp.id));
      }
      state.trips = state.trips.filter(t => t.id !== state.activeTripId);
      state.activeTripId = '';
      saveState();
      renderApp();
    }
  });

  document.querySelectorAll('.btn-delete-trip-expense').forEach(btn => {
    btn.addEventListener('click', () => {
      const expId = btn.getAttribute('data-exp-id');
      const tripExpId = expId.startsWith('trip-') ? expId : 'trip-' + expId;
      const baseExpId = expId.replace(/^trip-/, '');
      if (confirm('Are you sure you want to remove this expense from the trip ledger?')) {
        activeTrip.expenses = activeTrip.expenses.filter(e => e.id !== expId && e.id !== tripExpId);
        state.expenses = state.expenses.filter(e => e.id !== baseExpId && e.id !== expId);
        saveState();
        renderApp();
      }
    });
  });
}

// RENDER: SIDEBAR TRIP GIST
function renderTripGist() {
  const countBadge = document.getElementById('gist-trip-count');
  const container = document.getElementById('gist-trip-list');
  
  if (!countBadge || !container) return;
  
  countBadge.textContent = state.trips.length;
  container.innerHTML = '';

  if (state.trips.length === 0) {
    container.innerHTML = `<div class="gist-empty">No active trips</div>`;
    return;
  }

  state.trips.forEach(trip => {
    const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pct = Math.min(100, Math.round((totalSpent / trip.budget) * 100));
    
    const div = document.createElement('div');
    div.className = 'gist-item';
    div.innerHTML = `
      <div class="gist-trip-name" title="${escapeHTML(trip.name)}">${escapeHTML(trip.name)}</div>
      <div class="gist-trip-progress">
        <span>Spent: $${Math.round(totalSpent)}</span>
        <span>${pct}%</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// RENDER: CATEGORIES
function renderCategoriesModule() {
  const container = document.getElementById('categories-list-grid');
  container.innerHTML = '';

  state.categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-pill-card';
    card.innerHTML = `
      <div class="category-card-left">
        <div class="category-icon-box" style="background-color: ${cat.color};">
          <i class="fa-solid ${cat.icon}"></i>
        </div>
        <span class="category-card-name">${cat.name}</span>
      </div>
      <div class="category-card-right">
        <!-- Prevent deleting default core categories -->
        ${['Food & Dining', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Fuel', 'Lifestyle', 'Miscellaneous'].includes(cat.name) 
          ? '' 
          : `<button class="cat-btn-delete btn-delete-cat" data-id="${cat.id}"><i class="fa-regular fa-trash-can"></i></button>`
        }
      </div>
    `;
    container.appendChild(card);
  });

  // Attach delete buttons for categories
  document.querySelectorAll('.btn-delete-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.getAttribute('data-id');
      const category = state.categories.find(c => c.id === catId);
      if (category && confirm(`Are you sure you want to delete category "${category.name}"? Existing transactions in this category will keep their label but won't be filterable.`)) {
        state.categories = state.categories.filter(c => c.id !== catId);
        saveState();
        renderApp();
      }
    });
  });
}

// FORM ACTIONS: Add Expense
function openExpenseModal(editId = '') {
  openModal('expense-modal');
  toggleBankField('exp-form-mode', 'exp-bank-group');
  
  const title = document.getElementById('expense-modal-title');
  const form = document.getElementById('expense-form');
  
  if (editId) {
    title.textContent = 'Edit Expense';
    const exp = state.expenses.find(e => e.id === editId);
    if (exp) {
      document.getElementById('expense-edit-id').value = exp.id;
      document.getElementById('exp-form-title').value = exp.title;
      document.getElementById('exp-form-amount').value = exp.amount;
      document.getElementById('exp-form-category').value = exp.category;
      document.getElementById('exp-form-date').value = exp.date;
      document.getElementById('exp-form-mode').value = exp.paymentMode;
      document.getElementById('exp-form-bank').value = exp.bankName || '';
      document.getElementById('exp-form-notes').value = exp.notes || '';
      
      toggleBankField('exp-form-mode', 'exp-bank-group');
    }
  } else {
    title.textContent = 'Add Expense';
    form.reset();
    document.getElementById('exp-form-date').value = CURRENT_DATE_STR; // Default today
  }
}

console.log("Submit triggered");


async function handleExpenseSubmit(e) {
  e.preventDefault();
  
  const editId = document.getElementById('expense-edit-id').value;
  const title = document.getElementById('exp-form-title').value.trim();
  const amount = parseFloat(document.getElementById('exp-form-amount').value);
  const category = document.getElementById('exp-form-category').value;
  const date = document.getElementById('exp-form-date').value;
  const paymentMode = document.getElementById('exp-form-mode').value;
  const bankName = document.getElementById('exp-form-bank').value.trim();
  const tripId = document.getElementById('exp-form-trip').value;
  const notes = document.getElementById('exp-form-notes').value.trim();

  if (!title || isNaN(amount) || amount <= 0 || !date) {
    alert('Please fill out all required fields correctly.');
    return;
  }

  const finalBankName = (paymentMode === 'Credit Card' || paymentMode === 'Debit Card'|| paymentMode=='UPI' || paymentMode=='Others') ? bankName : '';



  const expenseData = {
    title,
    amount,
    category,
    date,
    paymentMode,
    bankName: finalBankName,
    notes
  };



  if (editId) {
    // EDIT MODE
    const index = state.expenses.findIndex(x => x.id === editId);
    if (index !== -1) {
      state.expenses[index] = { ...state.expenses[index], ...expenseData};
      await saveExpenseToFirestore(state.expenses[index]);
    }
    
  } else {
    // NEW MODE
    const newExp = {
      id: 'exp-' + Date.now(),
      ...expenseData
    };
    console.log("New expense:", newExp);
    console.log(newExp);
    state.expenses.push(newExp);
    console.log('Saving expense:', newExp);
    await saveExpenseToFirestore(newExp);

    // If associated with a trip, mirror expense inside trip list
    if (tripId) {
      const trip = state.trips.find(t => t.id === tripId);
      if (trip) {
        trip.expenses.push({
          id: 'trip-' + newExp.id,
          ...expenseData
        });
      }
    }
  }

  saveState();
  closeAllModals();
  renderApp();
}

// FORM ACTIONS: Add Category
function handleCategorySubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('cat-form-name').value.trim();
  const color = document.getElementById('cat-form-color').value;
  const icon = document.getElementById('cat-form-icon').value;

  if (!name) {
    alert('Please provide a category name.');
    return;
  }

  // Check duplicate category names
  if (state.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('A category with this name already exists.');
    return;
  }

  const newCat = {
  id: 'cat-' + Date.now(),
  name,
  color,
  icon,
  excludeFromAnalytics: document.getElementById('cat-form-exclude').checked
};

  state.categories.push(newCat);
  saveState();
  closeAllModals();
  renderApp();
}

// FORM ACTIONS: Add Checklist / Future Bill
function openChecklistModal() {
  openModal('checklist-modal');
  toggleBankField('chk-form-mode', 'chk-bank-group');
  document.getElementById('chk-form-due').value = CURRENT_DATE_STR;
}

function handleChecklistSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('chk-form-title').value.trim();
  const amount = parseFloat(document.getElementById('chk-form-amount').value);
  const category = document.getElementById('chk-form-category').value;
  const dueDate = document.getElementById('chk-form-due').value;
  const paymentMode = document.getElementById('chk-form-mode').value;
  const bankName = document.getElementById('chk-form-bank').value.trim();
  const notes = document.getElementById('chk-form-notes').value.trim();

  if (!title || isNaN(amount) || amount <= 0 || !dueDate) {
    alert('Please enter a valid title, positive amount and due date.');
    return;
  }

  const newChk = {
    id: 'chk-' + Date.now(),
    title,
    amount,
    category,
    dueDate,
    paymentMode,
    bankName: (paymentMode === 'Credit Card' || paymentMode === 'UPI' ) ? bankName : '',
    notes,
    isPaid: false
  };

  state.checklist.push(newChk);
  saveState();
  closeAllModals();
  renderApp();
}

// FORM ACTIONS: Track EMI
function openEmiModal() {
  editingEmiId = null;
  document.getElementById('emi-form').reset();

  openModal('emi-modal');
  toggleBankField('emi-form-mode', 'emi-bank-group');
  document.getElementById('emi-form-start').value = '2026-06';
}

function editEmi(id) {
  const emi = state.emis.find(e => e.id === id);
  if (!emi) return;

  editingEmiId = id;

  // Open modal first
  openModal('emi-modal');

  // Then fill the form
  document.getElementById('emi-form-title').value = emi.title;
  document.getElementById('emi-form-amount').value = emi.monthlyAmount;
  document.getElementById('emi-form-category').value = emi.category;
  document.getElementById('emi-form-start').value = emi.startMonth;
  document.getElementById('emi-form-duration').value = emi.durationMonths;
  document.getElementById('emi-form-mode').value = emi.paymentMode;
  document.getElementById('emi-form-bank').value = emi.bankName || '';
  document.getElementById('emi-form-auto').checked = emi.autoGenerate;
  document.getElementById('emi-form-notes').value = emi.notes || '';
  document.getElementById('emi-form-principal').value = emi.principalAmount || '';

  toggleBankField('emi-form-mode', 'emi-bank-group');
}
function handleEmiSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('emi-form-title').value.trim();
  const monthlyAmount = parseFloat(document.getElementById('emi-form-amount').value);
  const principalAmount = Number(document.getElementById('emi-form-principal').value);
  const category = document.getElementById('emi-form-category').value;
  const startMonth = document.getElementById('emi-form-start').value;
  const durationMonths = parseInt(document.getElementById('emi-form-duration').value);
  const paymentMode = document.getElementById('emi-form-mode').value;
  const bankName = document.getElementById('emi-form-bank').value.trim();
  const autoGenerate = document.getElementById('emi-form-auto').checked;
  const notes = document.getElementById('emi-form-notes').value.trim();

  if (!title || isNaN(monthlyAmount) || monthlyAmount <= 0 || !startMonth || isNaN(durationMonths) || durationMonths < 1) {
    alert('Please enter valid details for the EMI tracker.');
    return;
  }

  const newEmi = {
    id: 'emi-' + Date.now(),
    title,
    monthlyAmount,
    principalAmount,
    category,
    startMonth,
    durationMonths,
    paymentMode,
    bankName: (paymentMode === 'Credit Card' || paymentMode === 'Debit Card') ? bankName : '',
    notes,
    autoGenerate
  };

  if (editingEmiId) {
  const emi = state.emis.find(e => e.id === editingEmiId);

  emi.title = title;
  emi.monthlyAmount = monthlyAmount;
  emi.principalAmount = principalAmount;
  emi.category = category;
  emi.startMonth = startMonth;
  emi.durationMonths = durationMonths;
  emi.paymentMode = paymentMode;
  emi.bankName =
    (paymentMode === 'Credit Card' || paymentMode === 'Debit Card')
      ? bankName
      : '';
  emi.notes = notes;
  emi.autoGenerate = autoGenerate;

  editingEmiId = null;
} else {
  state.emis.push(newEmi);
}
  saveState();
  closeAllModals();
  
  // Immediately trigger generator to log past months for this new EMI
  runEmiAutoGenerator();
  renderApp();
}

// FORM ACTIONS: Create Trip Group
function handleTripSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('trip-form-name').value.trim();
  const budget = parseFloat(document.getElementById('trip-form-budget').value);

  if (!name || isNaN(budget) || budget <= 0) {
    alert('Please provide a trip name and positive budget limit.');
    return;
  }

  const newTrip = {
    id: 'trip-' + Date.now(),
    name,
    budget,
    expenses: []
  };

  state.trips.push(newTrip);
  state.activeTripId = newTrip.id;
  
  saveState();
  closeAllModals();
  renderApp();
}

// SEARCH & REPORTS SUBMODULE
function executeSearch() {
  if (state.expenses.length === 0) {
  alert('No expenses available to search.');
  return;
}
  const categoryFilter = document.getElementById('search-category').value;
  const modeFilter = document.getElementById('search-mode').value;
  const bankFilter = document.getElementById('search-bank').value.trim().toLowerCase();
  const startDate = document.getElementById('search-start-date').value;
  const endDate = document.getElementById('search-end-date').value;
  const startMonth =
document.getElementById(
'search-start-month'
)?.value || '';

const endMonth =
document.getElementById(
'search-end-month'
)?.value || '';
  // Perform filtering
  const filtered = state.expenses.filter(exp => {

  // Hide auto-generated EMI transactions
  if (exp.id && exp.id.startsWith('exp-emi-gen-')) {
    return false;
  }

  const category = state.categories.find(
    c => c.name === exp.category
  );

  const isExcluded = category?.excludeFromAnalytics;

  // Hide excluded categories unless explicitly selected
  if (
    isExcluded &&
    (categoryFilter === 'all' || categoryFilter !== exp.category)
  ) {
    return false;
  }

  // Category check
  if (categoryFilter !== 'all' && exp.category !== categoryFilter) {
    return false;
  }

  // Mode check
  if (modeFilter !== 'all' && exp.paymentMode !== modeFilter) {
    return false;
  }

  // Bank check
  if (
    bankFilter &&
    (!exp.bankName || !exp.bankName.toLowerCase().includes(bankFilter))
  ) {
    return false;
  }

  // Date range check
  if (startDate && exp.date < startDate) {
    return false;
  }

  if (endDate && exp.date > endDate) {
    return false;
  }

  return true;
});

  // Render Table results
  const tbody = document.getElementById('search-results-tbody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No expenses found matching the search criteria.</td></tr>`;
  } else {
    filtered.forEach(exp => {
      const tr = document.createElement('tr');
      const catObj = state.categories.find(c => c.name === exp.category) || { color: '#6b7280' };
      tr.innerHTML = `
        <td><strong>${escapeHTML(exp.title)}</strong></td>
        <td><span class="badge" style="background-color: ${catObj.color}15; color: ${catObj.color}">${exp.category}</span></td>
        <td>${exp.paymentMode}</td>
        <td>${escapeHTML(exp.bankName || '-')}</td>
        <td>${exp.date}</td>
        <td><span class="text-muted font-size-sm">${escapeHTML(exp.notes || '-')}</span></td>
        <td class="text-right text-danger font-weight-600">-${formatCurrency(exp.amount)}</td>
        <td class="text-center">
          <button class="cat-btn-delete search-edit-btn" data-id="${exp.id}" title="Edit Expense"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="cat-btn-delete search-delete-btn text-danger" data-id="${exp.id}" title="Delete Expense"><i class="fa-regular fa-trash-can"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach row controls
    document.querySelectorAll('.search-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openExpenseModal(btn.getAttribute('data-id'));
      });
    });
    
    document.querySelectorAll('.search-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this expense?')) {
          state.expenses = state.expenses.filter(e => e.id !== btn.getAttribute('data-id'));
          saveState();
          executeSearch(); // Refresh search view
          renderTripGist(); // Refresh trip gist just in case
        }
      });
    });
  }

  // Calculate search summary statistics
  const totalAmount = filtered.reduce((sum, exp) => sum + exp.amount, 0);
  const bankTotals = {};

filtered.forEach(exp => {

  if (!exp.bankName) return;

  bankTotals[exp.bankName] =
    (bankTotals[exp.bankName] || 0)
    + Number(exp.amount);

});
  const maxExpense =
filtered.length
? Math.max(
    ...filtered.map(
      e => Number(e.amount)
    )
  )
: 0;

  // Update Summary Widget Numbers
  document.getElementById('sum-total-amount').textContent = formatCurrency(totalAmount);
  document.getElementById('sum-total-count').textContent = filtered.length;
  document.getElementById('sum-max-expense').textContent = formatCurrency(maxExpense);

  // Formulate Report Subtitle Date range
  const dateStr = (startDate || endDate) 
    ? `From ${startDate || 'inception'} to ${endDate || 'current date'}`
    : 'Summary report for all time';
  document.getElementById('search-summary-range').textContent = dateStr;

  // Formulate dynamic summary text sentence
  let queryDetail = '';
  if (categoryFilter !== 'all') queryDetail += ` under the category <strong>${categoryFilter}</strong>`;
  if (modeFilter !== 'all') queryDetail += ` paid via <strong>${modeFilter}</strong>`;
  if (bankFilter) queryDetail += ` from <strong>${escapeHTML(bankFilter.toUpperCase())}</strong> bank`;

  const dateSpan = (startDate || endDate)
    ? ` between <strong>${startDate || 'start'}</strong> and <strong>${endDate || 'end'}</strong>`
    : ' across all logged months';

  const summaryWidget = document.getElementById('search-summary-widget');
  summaryWidget.classList.remove('hidden');

const narrative =
  document.getElementById(
    'search-summary-narrative'
  );

const bankSummary =
  Object.entries(bankTotals)
    .map(
      ([bank, total]) =>
        `<li>${bank}: ${formatCurrency(total)}</li>`
    )
    .join('');

narrative.innerHTML = `
  <p>
    Found a total of
    <strong>${filtered.length}</strong>
    matching transaction(s)
    ${queryDetail}
    ${dateSpan}.
  </p>

  <p>
    The total summed expenditure for this search represents
    <strong>${formatCurrency(totalAmount)}</strong>.
  </p>

  ${
    bankSummary
      ? `
        <h4>Bank-wise Spending</h4>
        <ul>
          ${bankSummary}
        </ul>
      `
      : ''
  }

  <p>
    The highest individual charge encountered is
    <strong>${formatCurrency(maxExpense)}</strong>.
  </p>
`;
}

function resetSearchFilters() {
  document.getElementById('search-category').value = 'all';
  document.getElementById('search-mode').value = 'all';
  document.getElementById('search-bank').value = '';
  document.getElementById('search-start-date').value = '';
  document.getElementById('search-end-date').value = '';
  const startMonthEl =
document.getElementById(
'search-start-month'
);

if(startMonthEl)
startMonthEl.value='';

const endMonthEl =
document.getElementById(
'search-end-month'
);

if(endMonthEl)
endMonthEl.value='';
  
  // Hide summary and reset grid
  document.getElementById('search-summary-widget').classList.add('hidden');
  const tbody = document.getElementById('search-results-tbody');
  tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Use the filter criteria above to search transactions.</td></tr>`;
}


// AUTOMATED EMI GENERATOR LOGIC
// Computes missing monthly entries from EMI plan configuration and appends them
function runEmiAutoGenerator() {
  let countGenerated = 0;
  
  state.emis.forEach(emi => {
    if (!emi.autoGenerate) return;

    const startYearMonth = emi.startMonth; // "YYYY-MM"
    const startYear = parseInt(startYearMonth.split('-')[0]);
    const startMonth = parseInt(startYearMonth.split('-')[1]);
    
    // Calculate months to check from Start Month to Current Month (June 2026)
    const currentYear = CURRENT_DATE.getFullYear();
    const currentMonth = CURRENT_DATE.getMonth() + 1; // 1-indexed

    const startVal = startYear * 12 + startMonth;
    const currentVal = currentYear * 12 + currentMonth;
    
    const elapsedMonths = currentVal - startVal + 1; // Inclusive of start month
    const totalInstallments = Math.min(emi.durationMonths, elapsedMonths);

    // Loop through each monthly installment index that should exist
    for (let i = 0; i < totalInstallments; i++) {
      const installmentNum = i + 1;
      const targetMonthVal = startVal + i;
      const targetYear = Math.floor((targetMonthVal - 1) / 12);
      const targetMonth = (targetMonthVal - 1) % 12 + 1;
      const targetMonthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
      
      // Look for a transaction that matches this EMI ID and installment month in the database
      // Using helper notes or structured description "MacBook Pro EMI (Month 3/12)"
      const expectedTitle = `${emi.title} (Month ${installmentNum}/${emi.durationMonths})`;
      const hasEmiExpense = state.expenses.some(exp => exp.title === expectedTitle);

      if (!hasEmiExpense) {
        // Generate the expense retroactively
        // Log it on the 1st of the target month
        const loggedDate = `${targetMonthStr}-01`;
        


        const newExpense = {
          id: `exp-emi-gen-${emi.id}-${installmentNum}`,
          title: expectedTitle,
          amount: emi.monthlyAmount,
          category: emi.category,
          paymentMode: emi.paymentMode,
          bankName: emi.bankName || '',
          date: loggedDate,
          notes: `Auto-generated EMI tracking payment. Start month: ${emi.startMonth}. ${emi.notes || ''}`
        };

        state.expenses.push(newExpense);
        countGenerated++;
      }
    }
  });

  if (countGenerated > 0) {
    saveState();
    
    // Show banner alert
    const banner = document.getElementById('emi-alert-banner');
    const alertText = document.getElementById('emi-alert-text');
    if (banner && alertText) {
      alertText.innerHTML = `<strong>Auto-generated ${countGenerated} EMI transaction(s)</strong> successfully for the active installments.`;
      banner.classList.remove('hidden');
    }
  }
}



// --- Utility Helpers ---

// Calculate difference in calendar months between two dates
function getMonthsBetween(startDate, endDate) {
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
}

// Format date into human readable, e.g. "Sun, Jun 7"
function formatTransactionDate(dateStr) {
  // dateStr is YYYY-MM-DD
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const d = new Date(dateStr + 'T12:00:00');
  const dayName = days[d.getDay()];
  const monthName = months[d.getMonth()];
  const dateNum = d.getDate();

  return `${dayName}, ${monthName} ${dateNum}`;
}

// Simple HTML escaping helper to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function exportExpensesToExcel() {
  console.log('Export function running');
  console.log('Expenses:', state.expenses);

  const expensesToExport = state.expenses.filter(
    exp => !exp.id?.startsWith('exp-emi-gen')
  );

  if (expensesToExport.length === 0) {
    alert('No transactions available to export.');
    return;
  }

  const data = expensesToExport.map(exp => ({
    Title: exp.title || '',
    Amount: exp.amount || 0,
    Category: exp.category || '',
    Date: exp.date || '',
    'Payment Mode': exp.paymentMode || '',
    Bank: exp.bankName || '',
    Notes: exp.notes || ''
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Transactions'
  );

  XLSX.writeFile(workbook, 'Transactions.xlsx');
}

document.getElementById('exp-form-mode')
.addEventListener('change', function () {

  if (this.value === 'add_ne') {

    const newMode = prompt(
      'Enter the new payment mode'
    );

    if (!newMode) {

      loadPaymentModes();

      return;

    }

    if (!customPaymentModes.includes(newMode)) {

      customPaymentModes.push(newMode);

      localStorage.setItem(
        'customPaymentModes',
        JSON.stringify(customPaymentModes)
      );

    }

    loadPaymentModes();

    this.value = newMode;
  }

});