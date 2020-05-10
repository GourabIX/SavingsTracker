/*
Savings Tracker -  A simple app to track and manage your earnings and expenses.
Developed, created and maintained by Gourab Sarkar (https://gourabix.wordpress.com).
License: GNU GPL v3.
(C) Gourab Sarkar 2020
*/

// ---------------------------------------------------------------------------------------

var budgetController = (function () {
  var Earning = function (earningId, description, amount) {
    this.id = earningId;
    this.description = description;
    this.amount = amount;
  };

  var Expense = function (expenseId, description, amount) {
    this.id = expenseId;
    this.description = description;
    this.amount = amount;
    this.percentage = -1;
  };

  Expense.prototype.calceExpPercentage = function (totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.amount / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getExpPercentage = function () {
    return this.percentage;
  };

  var budgetData = {
    dataItems: {
      exp: [],
      inc: [],
    },
    totals: {
      exp: 0,
      inc: 0,
    },
    budget: 0,
    percentage: -1,
  };

  var calculateTotals = function (type) {
    var sum = 0;
    budgetData.dataItems[type].forEach(function (current) {
      sum += current.amount;
    });
    budgetData.totals[type] = sum;
  };

  var calculateBudget = function () {
    budgetData.budget = budgetData.totals.inc - budgetData.totals.exp;
  };

  var calculatePercentage = function () {
    if (budgetData.totals.inc > 0) {
      budgetData.percentage = Math.round(
        (budgetData.totals.exp / budgetData.totals.inc) * 100
      );
    } else {
      budgetData.percentage = -1;
    }
  };

  return {
    addNewItem: function (type, desc, val) {
      var id, item;

      // Generate ID for new item
      if (budgetData.dataItems[type].length > 0) {
        id =
          budgetData.dataItems[type][budgetData.dataItems[type].length - 1].id +
          1;
      } else {
        id = 0;
      }

      // Create new income or expense object based on type
      if (type === "inc") item = new Earning(id, desc, val);
      else if (type === "exp") item = new Expense(id, desc, val);

      // Push the new item into the appropriate DS
      budgetData.dataItems[type].push(item);

      return item;
    },

    deleteExistingItem: function (type, id) {
      var allItemIds;

      // Get all Item IDs
      allItemIds = budgetData.dataItems[type].map(function (currentItem) {
        return currentItem.id;
      });

      // Find index of id to be deleted
      indexToDelete = allItemIds.indexOf(id);

      // Delete the index
      if (indexToDelete !== -1) {
        budgetData.dataItems[type].splice(indexToDelete, 1);
      }
    },

    computeBudgetData: function () {
      calculateTotals("inc");
      calculateTotals("exp");
      calculateBudget();
      calculatePercentage();
    },

    computeAllPercentages: function () {
      budgetData.dataItems.exp.forEach(function (currentExpense) {
        currentExpense.calceExpPercentage(budgetData.totals.inc);
      });
    },

    getExpensePercentages: function () {
      var allExpensePercentages = budgetData.dataItems.exp.map(function (
        currentExpense
      ) {
        return currentExpense.getExpPercentage();
      });
      return allExpensePercentages;
    },

    getBudgetData: function () {
      return {
        budget: budgetData.budget,
        totalIncome: budgetData.totals.inc,
        totalExpenditure: budgetData.totals.exp,
        percentage: budgetData.percentage,
      };
    },

    testing: function () {
      console.log(budgetData);
    },
  };
})();

var uiController = (function () {
  var DOMstrings = {
    userInputBtn: ".expenseSubmitter",
    amountType: ".amountType",
    description: ".expenseDesc",
    amount: ".expenseAmount",
    incomeContainer: ".incomeList",
    expensesContainer: ".expensesList",
    budgetLabel: ".budgetAmount",
    earningsLabel: ".earningsTotal",
    expensesLabel: ".expensesTotal",
    expensePercentageLabel: ".expensePercentage",
    itemContainer: ".statement",
    expenseItemPercentage: ".percentage",
    monthLabel: ".month",
    yearLabel: ".year",
    redFocusToggle: "red-focus",
    redExpenseSubmitterToggle: "redExpenseSubmitter",
  };

  var formatNumber = function (type, num) {
    /*
      Rules to format numbers:
      + or - before numbers
      Exactly 2 decimal precision
      comma separating the thousands
    */

    var intPart, decPart, numSplit;

    num = Math.abs(num);
    num = num.toFixed(2);
    numSplit = num.split(".");
    intPart = numSplit[0];
    decPart = numSplit[1];

    if (intPart.length > 3) {
      intPart =
        intPart.substr(0, intPart.length - 3) +
        "," +
        intPart.substr(intPart.length - 3, 3);
    }

    return (type === "inc" ? "+ " : "- ") + intPart + "." + decPart;
  };

  var nodeListForEach = function (nodeList, callbackFn) {
    for (let i = 0; i < nodeList.length; i++) {
      callbackFn(nodeList[i], i);
    }
  };

  return {
    getDOMStrings: function () {
      return DOMstrings;
    },

    getUserInput: function () {
      return {
        type: document.querySelector(DOMstrings.amountType).value,
        description: document.querySelector(DOMstrings.description).value,
        amount: parseFloat(document.querySelector(DOMstrings.amount).value),
      };
    },

    addListItem: function (item, type) {
      var html, newHtml, DOMelement;

      // Create HTML string with placeholder data
      if (type === "inc") {
        DOMelement = DOMstrings.incomeContainer;
        html =
          '<tr class="item clearfix" id="inc-%id%"><td class="itemDesc">%description%</td><td><span class="amount">%value%</span><span class="amountRemover"><button type="button" class="btn shadow-none amountRemoverBtn"><ion-icon name="close-circle-outline"></ion-icon></button></span></td></tr>';
      } else if (type === "exp") {
        DOMelement = DOMstrings.expensesContainer;
        html =
          '<tr class="item clearfix" id="exp-%id%"><td class="itemDesc">%description%</td><td><span class="amount">%value%</span><span class="percentage shadow-sm rounded">21%</span><span class="amountRemover"><button type="button" class="btn shadow-none amountRemoverBtn"><ion-icon name="close-circle-outline"></ion-icon></button></span></td></tr>';
      }

      // Replace placeholder text with actual data
      newHtml = html.replace("%id%", item.id);
      newHtml = newHtml.replace("%description%", item.description);
      newHtml = newHtml.replace("%value%", formatNumber(type, item.amount));

      // Inject the HTML into the DOM
      document
        .querySelector(DOMelement)
        .insertAdjacentHTML("beforeend", newHtml);
    },

    deleteListItem: function (selectorId) {
      var element;

      element = document.getElementById(selectorId);
      element.parentNode.removeChild(element);
    },

    clearFields: function () {
      var fieldsToClear, fieldsArray;

      fieldsToClear = document.querySelectorAll(
        DOMstrings.description + ", " + DOMstrings.amount
      );

      // Convert fieldsToClear to an array
      fieldsArray = Array.prototype.slice.call(fieldsToClear);

      fieldsArray.forEach(function (current, index, array) {
        current.value = "";
      });

      fieldsArray[0].focus();
    },

    updateBudgetSummary: function (budgetData) {
      var budgetSummaryType;

      budgetData.budget > 0
        ? (budgetSummaryType = "inc")
        : (budgetSummaryType = "exp");

      document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(
        budgetSummaryType,
        budgetData.budget
      );

      document.querySelector(
        DOMstrings.earningsLabel
      ).textContent = formatNumber("inc", budgetData.totalIncome);

      document.querySelector(
        DOMstrings.expensesLabel
      ).textContent = formatNumber("exp", budgetData.totalExpenditure);

      if (budgetData.percentage >= 0) {
        document.querySelector(DOMstrings.expensePercentageLabel).textContent =
          budgetData.percentage + "%";
      } else {
        document.querySelector(DOMstrings.expensePercentageLabel).textContent =
          "---";
      }
    },

    updateExpenseItemPercentages: function (percentages) {
      var fields;

      fields = document.querySelectorAll(DOMstrings.expenseItemPercentage);

      nodeListForEach(fields, function (currentField, index) {
        if (percentages[index] >= 0) {
          currentField.textContent = percentages[index] + "%";
        } else {
          currentField.textContent = "---";
        }
      });
    },

    displayDate: function () {
      var now, currentMonth, currentYear, allMonths;

      allMonths = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      now = new Date();
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();

      document.querySelector(DOMstrings.monthLabel).textContent =
        allMonths[currentMonth];
      document.querySelector(DOMstrings.yearLabel).textContent = currentYear;
    },

    changedAmountType: function () {
      var fields = document.querySelectorAll(
        DOMstrings.amountType +
          "," +
          DOMstrings.description +
          "," +
          DOMstrings.amount
      );

      nodeListForEach(fields, function (current) {
        current.classList.toggle(DOMstrings.redFocusToggle);
      });

      document
        .querySelector(DOMstrings.userInputBtn)
        .classList.toggle(DOMstrings.redExpenseSubmitterToggle);
    },

    focusOnInputDescription: function () {
      document.querySelector(DOMstrings.description).focus();
    },
  };
})();

var appController = (function (budgetCtrl, uiCtrl) {
  // Setup Event Listeners for the application
  var setupEventListeners = function () {
    var DOMelements = uiCtrl.getDOMStrings();

    document
      .querySelector(DOMelements.userInputBtn)
      .addEventListener("click", ctrlAddItem);

    document.addEventListener("keypress", function (event) {
      if (event.keyCode === 13 || event.which === 13) ctrlAddItem();
    });

    document
      .querySelector(DOMelements.itemContainer)
      .addEventListener("click", ctrlDeleteItem);

    document
      .querySelector(DOMelements.amountType)
      .addEventListener("change", uiCtrl.changedAmountType);
  };

  // Get and update the budget data
  var updateBudget = function () {
    budgetCtrl.computeBudgetData();
    var currentBudgetData = budgetCtrl.getBudgetData();
    uiCtrl.updateBudgetSummary(currentBudgetData);
  };

  // Get and update Expense item percentages
  var updateExpensePercentages = function () {
    budgetCtrl.computeAllPercentages();
    var expensePercentages = budgetCtrl.getExpensePercentages();
    uiCtrl.updateExpenseItemPercentages(expensePercentages);
  };

  // Setup what to do when adding a new item
  var ctrlAddItem = function () {
    var userInput, newItem;

    // Get the User Input
    userInput = uiCtrl.getUserInput();

    if (
      userInput.description &&
      !isNaN(userInput.amount) &&
      userInput.amount > 0
    ) {
      // Add the new Item to the appropriate DS
      newItem = budgetCtrl.addNewItem(
        userInput.type,
        userInput.description,
        userInput.amount
      );

      // Update the DOM
      uiCtrl.addListItem(newItem, userInput.type);

      // Clear the DOM form
      uiCtrl.clearFields();

      // Update the budget
      updateBudget();

      // Calculate and update percentages
      updateExpensePercentages();
    }
  };

  var ctrlDeleteItem = function (event) {
    var itemId, splitId, itemType, id;

    // Get the Full Item ID from the DOM
    itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;

    // Extract the item type and ID from the Full Id
    if (itemId) {
      splitId = itemId.split("-");
      itemType = splitId[0];
      id = parseInt(splitId[1]);
    }

    // Delete Item from the BudgetController DS
    budgetCtrl.deleteExistingItem(itemType, id);

    // Remove Item from the UI
    uiCtrl.deleteListItem(itemId);

    // Update and display budget
    updateBudget();

    // Calculate and update percentages
    updateExpensePercentages();
  };

  // Setup application startup handler method
  return {
    init: function () {
      uiCtrl.displayDate();
      uiCtrl.updateBudgetSummary({
        budget: 0,
        totalIncome: 0,
        totalExpenditure: 0,
        percentage: -1,
      });
      setupEventListeners();
      uiCtrl.focusOnInputDescription();
    },
  };
})(budgetController, uiController);

appController.init();
