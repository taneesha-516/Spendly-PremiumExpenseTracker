// mockData.js

const defaultCategories = [
  { id: 'cat-food', name: 'Food & Dining', color: '#1d4ed8', icon: 'fa-utensils' },
  { id: 'cat-transport', name: 'Transport', color: '#3b82f6', icon: 'fa-car' },
  { id: 'cat-shopping', name: 'Shopping', color: '#0f766e', icon: 'fa-shopping-bag' },
  { id: 'cat-utilities', name: 'Utilities', color: '#10b981', icon: 'fa-bolt' },
  { id: 'cat-entertainment', name: 'Entertainment', color: '#d97706', icon: 'fa-tv' },
  { id: 'cat-fuel', name: 'Fuel', color: '#ef4444', icon: 'fa-gas-pump' },
  { id: 'cat-lifestyle', name: 'Lifestyle', color: '#8b5cf6', icon: 'fa-heart' },
  { id: 'cat-misc', name: 'Miscellaneous', color: '#6b7280', icon: 'fa-ellipsis-h' }
];

// Generate dates relative to current local time (June 11, 2026)
const getRelativeDateString = (daysOffset) => {
  const d = new Date('2026-06-11T12:00:00');
  d.setDate(d.getDate() - daysOffset);
  return d.toISOString().split('T')[0];
};

const defaultExpenses = [
  {
    id: 'exp-1',
    title: 'Whole Foods Market',
    amount: 64.20,
    category: 'Food & Dining',
    paymentMode: 'Debit Card',
    bankName: 'Chase',
    date: getRelativeDateString(4), // June 7
    notes: 'Weekly grocery run'
  },
  {
    id: 'exp-2',
    title: 'Uber',
    amount: 23.50,
    category: 'Transport',
    paymentMode: 'Credit Card',
    bankName: 'Capital One',
    date: getRelativeDateString(5), // June 6
    notes: 'Ride back from office'
  },
  {
    id: 'exp-3',
    title: 'Apple Store',
    amount: 129.00,
    category: 'Shopping',
    paymentMode: 'Credit Card',
    bankName: 'Apple Card',
    date: getRelativeDateString(5), // June 6
    notes: 'Smart battery pack replacement'
  },
  {
    id: 'exp-4',
    title: 'Netflix',
    amount: 15.99,
    category: 'Entertainment',
    paymentMode: 'Credit Card',
    bankName: 'Chase',
    date: getRelativeDateString(6), // June 5
    notes: 'Monthly standard subscription'
  },
  {
    id: 'exp-5',
    title: 'City Power & Light',
    amount: 88.40,
    category: 'Utilities',
    paymentMode: 'Cheque',
    bankName: 'Chase',
    date: getRelativeDateString(7), // June 4
    notes: 'Electricity bill for May'
  },
  {
    id: 'exp-6',
    title: 'Blue Bottle Coffee',
    amount: 9.75,
    category: 'Food & Dining',
    paymentMode: 'Cash',
    bankName: '',
    date: getRelativeDateString(7), // June 4
    notes: 'Latte and croissant'
  },
  // Additional items to make the charts look interesting and populate historical data
  {
    id: 'exp-7',
    title: 'Shell Fuel Station',
    amount: 45.00,
    category: 'Fuel',
    paymentMode: 'Credit Card',
    bankName: 'Chase',
    date: getRelativeDateString(3), // June 8
    notes: 'Refueled car'
  },
  {
    id: 'exp-8',
    title: 'Zara Checkout',
    amount: 112.00,
    category: 'Lifestyle',
    paymentMode: 'Debit Card',
    bankName: 'Chase',
    date: getRelativeDateString(2), // June 9
    notes: 'New jacket'
  },
  {
    id: 'exp-9',
    title: 'Local Pharmacy',
    amount: 32.50,
    category: 'Miscellaneous',
    paymentMode: 'Cash',
    bankName: '',
    date: getRelativeDateString(1), // June 10
    notes: 'Supplements'
  },
  {
    id: 'exp-10',
    title: 'Sweetgreen Salad',
    amount: 18.50,
    category: 'Food & Dining',
    paymentMode: 'Credit Card',
    bankName: 'Chase',
    date: getRelativeDateString(0), // June 11 (Today)
    notes: 'Lunch with colleagues'
  }
];

const defaultChecklist = [
  {
    id: 'chk-1',
    title: 'Rent Payment',
    amount: 1200.00,
    category: 'Utilities',
    paymentMode: 'Cheque',
    bankName: 'Chase',
    dueDate: '2026-07-01',
    notes: 'Monthly apartment rent payment',
    isPaid: false
  },
  {
    id: 'chk-2',
    title: 'Internet Service Bill',
    amount: 65.00,
    category: 'Utilities',
    paymentMode: 'Credit Card',
    bankName: 'Capital One',
    dueDate: '2026-06-20',
    notes: 'Comcast Xfinity monthly subscription',
    isPaid: false
  },
  {
    id: 'chk-3',
    title: 'Car Insurance Premium',
    amount: 150.00,
    category: 'Transport',
    paymentMode: 'Debit Card',
    bankName: 'Chase',
    dueDate: '2026-06-25',
    notes: 'GEICO monthly premium auto-pay',
    isPaid: false
  }
];

const defaultEmis = [
  {
    id: 'emi-1',
    title: 'MacBook Pro EMI',
    monthlyAmount: 99.00,
    category: 'Shopping',
    paymentMode: 'Credit Card',
    bankName: 'Apple Card',
    startMonth: '2026-01', // YYYY-MM
    durationMonths: 12,
    notes: '0% APR promo interest-free EMI',
    autoGenerate: true
  },
  {
    id: 'emi-2',
    title: 'Car Loan EMI',
    monthlyAmount: 250.00,
    category: 'Transport',
    paymentMode: 'Debit Card',
    bankName: 'Chase',
    startMonth: '2025-06',
    durationMonths: 36,
    notes: 'Chase auto loan auto-debit',
    autoGenerate: true
  }
];

const defaultTrips = [
  {
    id: 'trip-1',
    name: 'Weekend in Seattle',
    budget: 800,
    expenses: [
      {
        id: 'trip-exp-1',
        title: 'Flight Ticket',
        amount: 280.00,
        category: 'Transport',
        paymentMode: 'Credit Card',
        bankName: 'Capital One',
        date: '2026-05-15',
        notes: 'Seattle roundtrip flight'
      },
      {
        id: 'trip-exp-2',
        title: 'Airbnb Seattle',
        amount: 320.00,
        category: 'Lifestyle',
        paymentMode: 'Credit Card',
        bankName: 'Chase',
        date: '2026-05-16',
        notes: '2 nights stay downtown'
      },
      {
        id: 'trip-exp-3',
        title: 'Pike Place Seafood Lunch',
        amount: 45.00,
        category: 'Food & Dining',
        paymentMode: 'Cash',
        bankName: '',
        date: '2026-05-17',
        notes: 'Seafood and chowder'
      }
    ]
  }
];

window.SpendlyDefaults = {
  defaultCategories,
  defaultExpenses,
  defaultChecklist,
  defaultEmis,
  defaultTrips
};
