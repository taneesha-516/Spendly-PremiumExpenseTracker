// chartHelper.js

let weeklySpendingChartInstance = null;
let categoryDonutChartInstance = null;
let monthlyCategoryBarChartInstance = null;
let monthlyTrendLineChartInstance = null;

const chartColors = {
  light: {
    grid: '#e2e8f0',
    text: '#64748b',
    border: '#1d4ed8',
    fillStart: 'rgba(29, 78, 216, 0.15)',
    fillEnd: 'rgba(29, 78, 216, 0.0)'
  },
  dark: {
    grid: '#1e293b',
    text: '#94a3b8',
    border: '#3b82f6',
    fillStart: 'rgba(59, 130, 246, 0.25)',
    fillEnd: 'rgba(59, 130, 246, 0.0)'
  }
};

/**
 * Helper to get gradient background for area fill
 */
function getLineGradient(ctx, isDark) {
  const chartHeight = ctx.canvas.clientHeight || 200;
  const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
  const colors = isDark ? chartColors.dark : chartColors.light;
  gradient.addColorStop(0, colors.fillStart);
  gradient.addColorStop(1, colors.fillEnd);
  return gradient;
}

/**
 * Initialize or update the Weekly Spline Line Chart
 */
function updateWeeklySpendingChart(canvasId, dailyValues, isDark) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = isDark ? chartColors.dark : chartColors.light;

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  if (weeklySpendingChartInstance) {
    weeklySpendingChartInstance.data.datasets[0].data = dailyValues;
    weeklySpendingChartInstance.data.datasets[0].borderColor = colors.border;
    weeklySpendingChartInstance.data.datasets[0].backgroundColor = getLineGradient(ctx, isDark);
    weeklySpendingChartInstance.options.scales.x.grid.color = colors.grid;
    weeklySpendingChartInstance.options.scales.y.grid.color = colors.grid;
    weeklySpendingChartInstance.options.scales.x.ticks.color = colors.text;
    weeklySpendingChartInstance.options.scales.y.ticks.color = colors.text;
    weeklySpendingChartInstance.update();
    return;
  }

  weeklySpendingChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Spending',
        data: dailyValues,
        borderColor: colors.border,
        borderWidth: 3,
        backgroundColor: getLineGradient(ctx, isDark),
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: colors.border,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          titleFont: { family: 'Outfit', size: 12 },
          bodyFont: { family: 'Outfit', size: 12 },
          padding: 10,
          callbacks: {
            label: function(context) {
              return ' ₹' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            color: colors.grid
          },
          ticks: {
            font: { family: 'Outfit', size: 11 },
            color: colors.text
          }
        },
        y: {
          grid: {
            color: colors.grid,
            drawBorder: false,
            borderDash: [5, 5]
          },
          ticks: {
            font: { family: 'Outfit', size: 11 },
            color: colors.text,
            callback: function(value) {
              return '₹' + value;
            }
          },
          min: 0
        }
      }
    }
  });
}

/**
 * Initialize or update the Category Donut Chart
 */
function updateCategoryDonutChart(canvasId, categoryNames, categoryValues, categoryColors, isDark) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (categoryDonutChartInstance) {
    categoryDonutChartInstance.data.labels = categoryNames;
    categoryDonutChartInstance.data.datasets[0].data = categoryValues;
    categoryDonutChartInstance.data.datasets[0].backgroundColor = categoryColors;
    categoryDonutChartInstance.update();
    return;
  }

  categoryDonutChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categoryNames,
      datasets: [{
        data: categoryValues,
        backgroundColor: categoryColors,
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#121824' : '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          titleFont: { family: 'Outfit', size: 12 },
          bodyFont: { family: 'Outfit', size: 12 },
          padding: 10,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return ` ${label}: ₹${value.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

/**
 * Initialize or update the monthly analytics bar chart (Category-wise)
 */
function updateMonthlyCategoryBarChart(canvasId, categoryNames, categoryValues, categoryColors, isDark) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = isDark ? chartColors.dark : chartColors.light;

  if (monthlyCategoryBarChartInstance) {
    monthlyCategoryBarChartInstance.data.labels = categoryNames;
    monthlyCategoryBarChartInstance.data.datasets[0].data = categoryValues;
    monthlyCategoryBarChartInstance.data.datasets[0].backgroundColor = categoryColors;
    monthlyCategoryBarChartInstance.options.scales.x.grid.color = colors.grid;
    monthlyCategoryBarChartInstance.options.scales.y.grid.color = colors.grid;
    monthlyCategoryBarChartInstance.options.scales.x.ticks.color = colors.text;
    monthlyCategoryBarChartInstance.options.scales.y.ticks.color = colors.text;
    monthlyCategoryBarChartInstance.update();
    return;
  }

  monthlyCategoryBarChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categoryNames,
      datasets: [{
        data: categoryValues,
        backgroundColor: categoryColors,
        borderRadius: 6,
        maxBarThickness: 35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          titleFont: { family: 'Outfit', size: 12 },
          bodyFont: { family: 'Outfit', size: 12 },
          padding: 10
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Outfit', size: 11 },
            color: colors.text
          }
        },
        y: {
          grid: {
            color: colors.grid,
            drawBorder: false,
            borderDash: [5, 5]
          },
          ticks: {
            font: { family: 'Outfit', size: 11 },
            color: colors.text,
            callback: function(value) { return '₹' + value; }
          }
        }
      }
    }
  });
}

/**
 * Initialize or update the weekly trend line chart in Analytics
 */
function updateMonthlyTrendLineChart(canvasId, weeklyValues, isDark) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = isDark ? chartColors.dark : chartColors.light;

  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

  if (monthlyTrendLineChartInstance) {
    monthlyTrendLineChartInstance.data.datasets[0].data = weeklyValues;
    monthlyTrendLineChartInstance.data.datasets[0].borderColor = colors.border;
    monthlyTrendLineChartInstance.data.datasets[0].backgroundColor = getLineGradient(ctx, isDark);
    monthlyTrendLineChartInstance.options.scales.x.grid.color = colors.grid;
    monthlyTrendLineChartInstance.options.scales.y.grid.color = colors.grid;
    monthlyTrendLineChartInstance.options.scales.x.ticks.color = colors.text;
    monthlyTrendLineChartInstance.options.scales.y.ticks.color = colors.text;
    monthlyTrendLineChartInstance.update();
    return;
  }

  monthlyTrendLineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Weekly Spending',
        data: weeklyValues,
        borderColor: colors.border,
        borderWidth: 3,
        backgroundColor: getLineGradient(ctx, isDark),
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: colors.border,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          titleFont: { family: 'Outfit', size: 12 },
          bodyFont: { family: 'Outfit', size: 12 },
          padding: 10
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Outfit', size: 11 },
            color: colors.text
          }
        },
        y: {
          grid: {
            color: colors.grid,
            drawBorder: false,
            borderDash: [5, 5]
          },
          ticks: {
            font: { family: 'Outfit', size: 11 },
            color: colors.text,
            callback: function(value) { return '₹' + value; }
          }
        }
      }
    }
  });
}

// Export functions to global scope
window.SpendlyCharts = {
  updateWeeklySpendingChart,
  updateCategoryDonutChart,
  updateMonthlyCategoryBarChart,
  updateMonthlyTrendLineChart
};
