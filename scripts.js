document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const btnScreen1 = document.getElementById('btn-screen-1');
    const btnScreen2 = document.getElementById('btn-screen-2');
    const btnScreen3 = document.getElementById('btn-screen-3');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    const screens = document.querySelectorAll('.screen');

    const expenseTable = document.getElementById('expense-table').querySelector('tbody');
    const addExpenseForm = document.getElementById('add-expense-form');
    const yearlyExpenseSpan = document.getElementById('yearly-expense');
    const yearlyCreditSpan = document.getElementById('yearly-credit');
    const todayExpenseSpan = document.getElementById('today-expense');
    const todayCreditSpan = document.getElementById('today-credit');
    const thisMonthExpenseSpan = document.getElementById('month-expense');
    const thisMonthCreditSpan = document.getElementById('month-credit');
    const searchInput = document.getElementById('search-input');
    const expenseChartCtx = document.getElementById('expenseChart').getContext('2d');

    let expenses = [];
    let expenseChart;
    let currentDate = new Date();

    // Function to calculate yearly totals, today's total expense and credit, and this month's credit and expense
    function calculateTotals() {
        const today = new Date();
        const thisYear = today.getFullYear();
        const thisMonth = currentDate.getMonth() + 1;

        // Calculate yearly totals
        let yearlyTotalExpense = 0;
        let yearlyTotalCredit = 0;
        expenses.forEach(expense => {
            const expenseYear = new Date(expense.date).getFullYear();
            if (expenseYear === thisYear) {
                if (expense.type === 'expense') {
                    yearlyTotalExpense += expense.amount;
                } else {
                    yearlyTotalCredit += expense.amount;
                }
            }
        });

        // Calculate today's total expense and credit
        let todayTotalExpense = 0;
        let todayTotalCredit = 0;
        expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (
                expenseDate.getDate() === today.getDate() &&
                expenseDate.getMonth() === today.getMonth() &&
                expenseDate.getFullYear() === today.getFullYear()
            ) {
                if (expense.type === 'expense') {
                    todayTotalExpense += expense.amount;
                } else {
                    todayTotalCredit += expense.amount;
                }
            }
        });

        // Calculate this month's credit and expense
        let thisMonthExpense = 0;
        let thisMonthCredit = 0;
        expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (
                expenseDate.getMonth() + 1 === thisMonth &&
                expenseDate.getFullYear() === thisYear
            ) {
                if (expense.type === 'expense') {
                    thisMonthExpense += expense.amount;
                } else {
                    thisMonthCredit += expense.amount;
                }
            }
        });

        return {
            yearlyTotalExpense,
            yearlyTotalCredit,
            todayTotalExpense,
            todayTotalCredit,
            thisMonthExpense,
            thisMonthCredit
        };
    }

    // Function to update totals on the first screen
    function updateTotals() {
        const {
            yearlyTotalExpense,
            yearlyTotalCredit,
            todayTotalExpense,
            todayTotalCredit,
            thisMonthExpense,
            thisMonthCredit
        } = calculateTotals();

        yearlyExpenseSpan.textContent = yearlyTotalExpense;
        yearlyCreditSpan.textContent = yearlyTotalCredit;
        todayExpenseSpan.textContent = todayTotalExpense;
        todayCreditSpan.textContent = todayTotalCredit;
        thisMonthExpenseSpan.textContent = thisMonthExpense;
        thisMonthCreditSpan.textContent = thisMonthCredit;
    }

// Function to render expenses table with search functionality
function renderExpenses(filteredExpenses = expenses) {
    // Sort expenses by date in ascending order
    filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    expenseTable.innerHTML = ''; // Clear existing rows
    filteredExpenses.forEach((expense, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-type="date" data-index="${index}">${expense.date}</td>
            <td data-type="description" data-index="${index}">${expense.description}</td>
            <td data-type="amount" data-index="${index}">${expense.amount}</td>
            <td><button class="delete-button" data-index="${index}">🚫</button></td>
        `;
        row.classList.add(expense.type === 'expense' ? 'expense' : 'credit');
        expenseTable.appendChild(row);
    });
}

expenseTable.addEventListener('click', function(event) {
    const target = event.target;
    if (target.tagName === 'TD') {
        const dataType = target.dataset.type;
        switch (dataType) {
            case 'date':
                editDate(target);
                break;
            case 'amount':
                editAmount(target);
                break;
            default:
                editCell(target);
                break;
        }
    } else if (target.classList.contains('delete-button')) {
        deleteExpense(target.dataset.index);
    }
});
function editDate(cell) {
    const originalText = cell.innerText;
    const input = document.createElement('input');
    input.type = 'date';
    input.value = originalText;
    cell.innerText = '';
    cell.appendChild(input);

    input.focus();

    input.addEventListener('blur', function() {
        cell.innerText = input.value;
        updateExpense(cell.dataset.index, cell.dataset.type, input.value);
    });

    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            input.blur();
        }
    });
}
function editAmount(cell) {
    const originalText = cell.innerText;
    const input = document.createElement('input');
    input.type = 'number';
    input.value = originalText;
    cell.innerText = '';
    cell.appendChild(input);

    input.focus();

    input.addEventListener('blur', function() {
        cell.innerText = input.value;
        updateExpense(cell.dataset.index, cell.dataset.type, input.value);
    });

    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            input.blur();
        }
    });
}

function editCell(cell) {
    const originalText = cell.innerText;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    cell.innerText = '';
    cell.appendChild(input);

    input.focus();

    input.addEventListener('blur', function() {
        cell.innerText = input.value;
        updateExpense(cell.dataset.index, cell.dataset.type, input.value);
    });

    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            input.blur();
        }
    });
}

function updateExpense(index, key, value) {
    expenses[index][key] = key === 'amount' ? parseFloat(value) : value;
    localStorage.setItem('expenses', JSON.stringify(expenses));
    renderExpenses();
    updateChart();
}
function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    renderExpenses();
    updateChart();
}

function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Expense Report', 14, 22);

    doc.setFontSize(12);
    let yOffset = 30;
    let totalExpense = 0;
    let totalCredit = 0;

    const sortedExpenses = expenses.filter(expense => new Date(expense.date).getFullYear() === currentDate.getFullYear())
                                    .slice()
                                    .sort((a, b) => new Date(a.date) - new Date(b.date));
    let currentMonth = '';
    sortedExpenses.forEach(expense => {
        if (expense.type === 'expense') {
            totalExpense += expense.amount;
        } else {
            totalCredit += expense.amount;
        }
    });
     // Add a box for total credit and total expenditure
     doc.setDrawColor(0);
     doc.setFillColor(240, 240, 240);
     doc.rect(14, yOffset, 170, 20, 'F');
     doc.setTextColor(0);
     doc.setFont('helvetica', 'bold');
     doc.text(`For Year: ${currentDate.getFullYear()}`, 20, yOffset + 10);
     yOffset += 4;
     doc.text('Total Expense:', 20, yOffset + 10);
     doc.text(totalExpense.toFixed(2), 70, yOffset + 10);
     doc.text('Total Credit:', 100, yOffset + 10);
     doc.text(totalCredit.toFixed(2), 150, yOffset + 10);
     yOffset += 5;
    var thisMonthExpense = 0;
    var thisMonthCredit = 0;
    sortedExpenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const monthYear = expenseDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (currentMonth !== monthYear) {
            if(thisMonthExpense>0){
                yOffset -= 10;
                doc.text(`${currentMonth.split(" ")[0]} Total Expense:`, 20, yOffset + 10);
                doc.text(thisMonthExpense.toFixed(2), 80, yOffset + 10, { align: 'right' });
                thisMonthExpense = 0;
            }
            if(thisMonthCredit>0){
                if(thisMonthExpense!=0)yOffset -= 10;
                doc.text(`${currentMonth.split(" ")[0]} Total Credit:`, 100, yOffset + 10);
                doc.text(thisMonthCredit.toFixed(2), 170, yOffset + 10, { align: 'right' });
                thisMonthCredit = 0;
            }
            yOffset += 20;
                    
            currentMonth = monthYear;
            doc.setFontSize(14);
            doc.text(currentMonth, 14, yOffset);
            yOffset += 10;
            doc.setFontSize(12);
            doc.text(`Date`, 14, yOffset);
            doc.text(`Description`, 50, yOffset);
            doc.text(`Type`, 120, yOffset);
            doc.text(`Amount`, 150, yOffset);
            yOffset += 10;
        }

        doc.text(`${expense.date}`, 14, yOffset);
        doc.text(`${expense.description}`, 50, yOffset);
        doc.text(`${expense.type}`, 120, yOffset);
        doc.text(`${expense.amount.toFixed(2)}`, 190, yOffset,  { align: 'right' });
        yOffset += 10;
        if (expense.type === 'expense') {
            thisMonthExpense += expense.amount;
        } else {
            thisMonthCredit += expense.amount;
        }
    });
    // Display totals for the last month
    if (thisMonthExpense > 0) {
        yOffset -= 10;
        doc.text(`${currentMonth.split(" ")[0]} Total Expense:`, 20, yOffset + 10);
        doc.text(thisMonthExpense.toFixed(2), 80, yOffset + 10, { align: 'right' });
        thisMonthExpense = 0;
    }
    if (thisMonthCredit > 0) {
        if(thisMonthExpense!=0){
            yOffset -= 10;
        }
        doc.text(`${currentMonth.split(" ")[0]} Total Credit:`, 100, yOffset + 10);
        doc.text(thisMonthCredit.toFixed(2), 170, yOffset + 10, { align: 'right' });
        thisMonthCredit = 0;
    }
    yOffset += 10;

    doc.save('Expense_Report.pdf');
}

    // Function to add a new expense
    function addExpense(event) {
        event.preventDefault();
        const type = document.getElementById('type').value;
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;

        if (!description || isNaN(amount) || !date) {
            alert('Please fill in all fields.');
            return;
        }

        expenses.push({ type, description, amount, date });
        renderExpenses();
        updateTotals();
        updateChart();
        addExpenseForm.reset(); // Clear form after submission
        storeExpenses();
    }

    // Function to filter expenses based on search input
function filterExpenses() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredExpenses = expenses.filter(expense => {
        return Object.values(expense).some(value => {
            return value.toString().toLowerCase().includes(searchTerm);
        });
    });
    renderExpenses(filteredExpenses);
}

    // Function to store expenses in local storage
    function storeExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    // Function to load expenses from local storage (if available)
    function loadExpenses() {
        const storedExpenses = localStorage.getItem('expenses');
        if (storedExpenses) {
            expenses = JSON.parse(storedExpenses);
            renderExpenses();
            updateTotals();
            updateChart();
        }
    }

// Function to update the chart with the latest expense data
function updateChart() {
    if (expenseChart) {
        expenseChart.destroy();
    }

    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentDate.getMonth() && expenseDate.getFullYear() === currentDate.getFullYear();
    });

    // Aggregate expenses and credits separately by date
    const aggregatedExpenses = new Map();
    const aggregatedCredits = new Map();
    filteredExpenses.forEach(expense => {
        const expenseDate = expense.date;
        if (expense.type === 'expense') {
            const existingAmount = aggregatedExpenses.get(expenseDate) || 0;
            aggregatedExpenses.set(expenseDate, existingAmount + expense.amount); // Add positive amount for expense
        } else {
            const existingAmount = aggregatedCredits.get(expenseDate) || 0;
            aggregatedCredits.set(expenseDate, existingAmount + expense.amount); // Add positive amount for credit
        }
    });

    // Sort aggregated expenses and credits by date
    const sortedDates = Array.from(new Set([...aggregatedExpenses.keys(), ...aggregatedCredits.keys()])).sort((a, b) => new Date(a) - new Date(b));

    const labels = [];
    const cumulativeExpenses = [];
    const cumulativeCredits = [];
    let totalExpense = 0;
    let totalCredit = 0;

    sortedDates.forEach(date => {
        const dayOfMonth = new Date(date).getDate(); // Extract day of the month
        labels.push(dayOfMonth);
        totalExpense += aggregatedExpenses.get(date) || 0; // Add 0 if no expense on that date
        totalCredit += aggregatedCredits.get(date) || 0; // Add 0 if no credit on that date
        cumulativeExpenses.push(totalExpense);
        cumulativeCredits.push(totalCredit);
    });

    expenseChart = new Chart(expenseChartCtx, {
        type: 'line', // Use line chart with filled area
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Expense',
                data: cumulativeExpenses,
                backgroundColor: 'rgba(255, 99, 132, 0.5)', // Red area for cumulative expenses
                borderColor: 'rgba(255, 99, 132, 1)', // Red line for cumulative expenses
                borderWidth: 1,
                fill: 'origin' // Fill area below the line
            }, {
                label: 'Cumulative Credit',
                data: cumulativeCredits,
                backgroundColor: 'rgba(75, 192, 192, 0.5)', // Green area for cumulative credits
                borderColor: 'rgba(75, 192, 192, 1)', // Green line for cumulative credits
                borderWidth: 1,
                fill: 'origin' // Fill area below the line
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true // Start y-axis at 0
                }
            }
        }
    });
    // Update chart info (month and year)
    const monthYear = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(currentDate);
    document.getElementById('chart-info').textContent = monthYear;
}

// Function to go to the previous month
function goToPreviousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateChart();
    updateTotals(); // Update totals for the new month
}

// Function to go to the next month
function goToNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateChart();
    updateTotals(); // Update totals for the new month
}

    // Event listeners
    addExpenseForm.addEventListener('submit', addExpense);
    searchInput.addEventListener('keyup', filterExpenses);
    prevMonthBtn.addEventListener('click', goToPreviousMonth);
    nextMonthBtn.addEventListener('click', goToNextMonth);
    header.addEventListener('click', generatePDFReport);
    
    // Function to activate a screen
    function activateScreen(screenId) {
        screens.forEach(screen => screen.classList.remove('active'));
        const targetScreen = document.getElementById(`screen-${screenId.split('-')[2]}`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        } else {
            console.error(`Screen element with ID ${targetScreen} not found.`);
        }
    }

    // Event listeners for screen buttons
    btnScreen1.addEventListener('click', () => activateScreen(btnScreen1.id));
    btnScreen2.addEventListener('click', () => activateScreen(btnScreen2.id));
    btnScreen3.addEventListener('click', () => activateScreen(btnScreen3.id));

    // Set default date to current date
    document.getElementById('date').valueAsDate = new Date();

    // Load expenses from local storage on app launch
    loadExpenses();

    // Save expenses to local storage on window close/unload
    window.addEventListener('beforeunload', storeExpenses);

    // Activate first screen by default
    activateScreen(btnScreen1.id);
});
