const infixToFunction = {
    "+": (x, y) => x + y,
    "-": (x, y) => x - y,
    "*": (x, y) => x * y,
    "/": (x, y) => y !== 0 ? x / y : "Error: Division by zero",
  };
  
  const infixEval = (str, regex) => str.replace(regex, (_match, arg1, operator, arg2) => {
    const result = infixToFunction[operator](parseFloat(arg1), parseFloat(arg2));
    return isNaN(result) ? "Error: Invalid operation" : result;
  });
  
  const highPrecedence = str => {
    const regex = /([\d.]+)([*\/])([\d.]+)/;
    const str2 = infixEval(str, regex);
    return str === str2 ? str : highPrecedence(str2);
  };
  
  const isEven = num => num % 2 === 0;
  const sum = nums => nums.reduce((acc, el) => acc + el, 0);
  const average = nums => nums.length > 0 ? sum(nums) / nums.length : 0;
  
  const median = nums => {
    const sorted = nums.slice().sort((a, b) => a - b);
    const length = sorted.length;
    const middle = Math.floor(length / 2);
    return length % 2 === 0
      ? average([sorted[middle - 1], sorted[middle]])
      : sorted[middle];
  };
  
  const spreadsheetFunctions = {
    "": arg => arg,
    sum,
    average,
    median,
    even: nums => nums.filter(isEven),
    someeven: nums => nums.some(isEven),
    everyeven: nums => nums.every(isEven),
    firsttwo: nums => nums.slice(0, 2),
    lasttwo: nums => nums.slice(-2),
    has2: nums => nums.includes(2),
    increment: nums => nums.map(num => num + 1),
    random: ([x, y]) => Math.floor(Math.random() * (y - x + 1) + x),
    range: nums => range(...nums),
    nodupes: nums => [...new Set(nums)],
    min: nums => Math.min(...nums),
    max: nums => Math.max(...nums),
    count: nums => nums.length,
    product: nums => nums.reduce((acc, el) => acc * el, 1),
    stddev: nums => Math.sqrt(nums.reduce((acc, el) => acc + Math.pow(el - average(nums), 2), 0) / nums.length),
    variance: nums => stddev(nums) ** 2,
    today: () => new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
    dateDiff: (date1, date2) => Math.abs((new Date(date2) - new Date(date1)) / (1000 * 60 * 60 * 24)),
    concat: texts => texts.join(''),
    substring: (text, start, length) => text.substring(start, start + length),
    length: text => text.length,
    replace: (text, find, replace) => text.replace(new RegExp(find, 'g'), replace),
    if: (condition, valueIfTrue, valueIfFalse) => condition ? valueIfTrue : valueIfFalse,
    and: conditions => conditions.every(Boolean),
    or: conditions => conditions.some(Boolean),
    not: condition => !condition
  };
  
  const applyFunction = str => {
    const noHigh = highPrecedence(str);
    const infix = /([\d.]+)([+-])([\d.]+)/;
    const str2 = infixEval(noHigh, infix);
    const functionCall = /([a-z0-9]*)\(([0-9., ]*)\)/i;
    
    const toNumberList = args => args.split(",").map(parseFloat);
    const apply = (fn, args) => {
      const func = spreadsheetFunctions[fn.toLowerCase()];
      return func ? func(toNumberList(args)) : "Error: Function not found";
    };
    
    return str2.replace(functionCall, (match, fn, args) => apply(fn, args));
  };
  
  const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const charRange = (start, end) => range(start.charCodeAt(0), end.charCodeAt(0)).map(code => String.fromCharCode(code));
  
  const evalFormula = (x, cells) => {
    const idToText = id => cells.find(cell => cell.id === id)?.value || "Error: Cell not found";
    const rangeRegex = /([A-J])([1-9][0-9]?):([A-J])([1-9][0-9]?)/gi;
    const cellRegex = /[A-J][1-9][0-9]?/gi;
  
    const rangeFromString = (num1, num2) => range(parseInt(num1), parseInt(num2));
    const addCharacters = (char1, char2) => num => charRange(char1, char2).map(character => idToText(character + num));
    
    let rangeExpanded = x.replace(rangeRegex, (_match, char1, num1, char2, num2) => 
      rangeFromString(num1, num2).map(addCharacters(char1, char2))
    );
    
    let cellExpanded = rangeExpanded.replace(cellRegex, match => idToText(match.toUpperCase()));
    let functionExpanded = applyFunction(cellExpanded);
    
    return functionExpanded === x ? functionExpanded : evalFormula(functionExpanded, cells);
  };
  
  const saveSpreadsheet = () => {
    const cells = Array.from(document.getElementById('container').children);
    const data = cells.map(cell => ({ id: cell.id, value: cell.value }));
    localStorage.setItem('spreadsheetData', JSON.stringify(data));
  };
  
  const loadSpreadsheet = () => {
    const savedData = localStorage.getItem('spreadsheetData');
    if (savedData) {
      const data = JSON.parse(savedData);
      data.forEach(({ id, value }) => {
        const cell = document.getElementById(id);
        if (cell) cell.value = value;
      });
    }
  };
  
  const update = event => {
    const element = event.target;
    const value = element.value.replace(/\s/g, "");
  
    if (value.startsWith('=')) {
      try {
        element.value = evalFormula(value.slice(1), Array.from(document.getElementById("container").children));
      } catch (error) {
        element.value = "Error: Invalid formula";
      }
    }
  
    saveSpreadsheet(); // Save data whenever an input is updated
  };
  
  window.onload = () => {
    const container = document.getElementById("container");
  
    const createLabel = (name) => {
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = name;
      container.appendChild(label);
    };
  
    const letters = charRange("A", "J");
    letters.forEach(createLabel);
    range(1, 99).forEach(number => {
      createLabel(number);
      letters.forEach(letter => {
        const input = document.createElement("input");
        input.type = "text";
        input.id = letter + number;
        input.ariaLabel = letter + number;
        input.onchange = update;
        container.appendChild(input);
      });
    });
  
    loadSpreadsheet(); // Load saved data when the page loads
  };
  