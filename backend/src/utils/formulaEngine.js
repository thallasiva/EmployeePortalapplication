const FUNCTIONS = new Set(['ABS', 'MAX', 'MIN', 'ROUND', 'IF']);

function tokenize(expression) {
  const source = String(expression || '').toUpperCase();
  if (source.length > 512) throw new Error('Formula cannot exceed 512 characters');
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const rest = source.slice(index);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      index += whitespace[0].length;
      continue;
    }
    if (tokens.length >= 256) throw new Error('Formula is too complex');
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    const identifier = rest.match(/^[A-Z_][A-Z0-9_]*/);
    if (identifier) {
      tokens.push({ type: 'identifier', value: identifier[0] });
      index += identifier[0].length;
      continue;
    }
    const operator = rest.match(/^(?:<=|>=|<>|!=|==|[()+\-*/%,<>=])/);
    if (!operator) throw new Error(`Unsupported formula token near "${rest.slice(0, 12)}"`);
    tokens.push({ type: 'operator', value: operator[0] });
    index += operator[0].length;
  }
  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

function parse(expression) {
  const tokens = tokenize(expression);
  let position = 0;
  const peek = () => tokens[position];
  const take = (value) => {
    if (peek().value !== value) return false;
    position += 1;
    return true;
  };
  const expect = (value) => {
    if (!take(value)) throw new Error(`Expected "${value}" in formula`);
  };

  function parsePrimary() {
    const token = peek();
    if (token.type === 'number') {
      position += 1;
      return { type: 'number', value: token.value };
    }
    if (take('(')) {
      const node = parseOr();
      expect(')');
      return node;
    }
    if (token.type !== 'identifier') throw new Error('Expected a number, variable, or function in formula');
    position += 1;
    const name = token.value;
    if (take('(')) {
      if (!FUNCTIONS.has(name)) throw new Error(`Unsupported formula function "${name}"`);
      const args = [];
      if (!take(')')) {
        do {
          args.push(parseOr());
        } while (take(','));
        expect(')');
      }
      const expected = name === 'IF' ? 3 : name === 'ABS' ? 1 : null;
      if ((expected != null && args.length !== expected) ||
          (['MIN', 'MAX', 'ROUND'].includes(name) && args.length < 1) ||
          (name === 'ROUND' && args.length > 2)) {
        throw new Error(`Invalid argument count for ${name}`);
      }
      return { type: 'function', name, args };
    }
    if (name === 'AND' || name === 'OR') throw new Error(`${name} must be called as a function`);
    return { type: 'variable', name };
  }

  function parseUnary() {
    if (take('+')) return { type: 'unary', operator: '+', value: parseUnary() };
    if (take('-')) return { type: 'unary', operator: '-', value: parseUnary() };
    return parsePrimary();
  }

  function parseMultiply() {
    let node = parseUnary();
    while (['*', '/', '%'].includes(peek().value)) {
      const operator = tokens[position++].value;
      node = { type: 'binary', operator, left: node, right: parseUnary() };
    }
    return node;
  }

  function parseAdd() {
    let node = parseMultiply();
    while (['+', '-'].includes(peek().value)) {
      const operator = tokens[position++].value;
      node = { type: 'binary', operator, left: node, right: parseMultiply() };
    }
    return node;
  }

  function parseCompare() {
    let node = parseAdd();
    while (['<', '<=', '>', '>=', '=', '==', '!=', '<>'].includes(peek().value)) {
      const operator = tokens[position++].value;
      node = { type: 'binary', operator, left: node, right: parseAdd() };
    }
    return node;
  }

  function parseAnd() {
    let node = parseCompare();
    while (take('AND')) node = { type: 'logical', operator: 'AND', left: node, right: parseCompare() };
    return node;
  }

  function parseOr() {
    let node = parseAnd();
    while (take('OR')) node = { type: 'logical', operator: 'OR', left: node, right: parseAnd() };
    return node;
  }

  const ast = parseOr();
  if (peek().type !== 'eof') throw new Error(`Unexpected token "${peek().value}" in formula`);
  return ast;
}

function variablesIn(ast, variables = new Set()) {
  if (ast.type === 'variable') variables.add(ast.name);
  if (ast.left) variablesIn(ast.left, variables);
  if (ast.right) variablesIn(ast.right, variables);
  if (ast.value) variablesIn(ast.value, variables);
  for (const arg of ast.args || []) variablesIn(arg, variables);
  return variables;
}

function truthy(value) {
  return value !== 0 && value !== false && value != null;
}

function run(ast, context) {
  if (ast.type === 'number') return ast.value;
  if (ast.type === 'variable') {
    if (!Object.prototype.hasOwnProperty.call(context, ast.name)) {
      throw new Error(`Unknown formula variable "${ast.name}"`);
    }
    const value = Number(context[ast.name]);
    if (!Number.isFinite(value)) throw new Error(`Formula variable "${ast.name}" is not numeric`);
    return value;
  }
  if (ast.type === 'unary') {
    const value = run(ast.value, context);
    return ast.operator === '-' ? -value : value;
  }
  if (ast.type === 'logical') {
    const left = run(ast.left, context);
    if (ast.operator === 'AND') return truthy(left) && truthy(run(ast.right, context)) ? 1 : 0;
    return truthy(left) || truthy(run(ast.right, context)) ? 1 : 0;
  }
  if (ast.type === 'binary') {
    const left = run(ast.left, context);
    const right = run(ast.right, context);
    switch (ast.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/':
        if (right === 0) throw new Error('Division by zero in salary formula');
        return left / right;
      case '%':
        if (right === 0) throw new Error('Division by zero in salary formula');
        return left % right;
      case '<': return left < right ? 1 : 0;
      case '<=': return left <= right ? 1 : 0;
      case '>': return left > right ? 1 : 0;
      case '>=': return left >= right ? 1 : 0;
      case '=':
      case '==': return left === right ? 1 : 0;
      case '!=':
      case '<>': return left !== right ? 1 : 0;
      default: throw new Error(`Unsupported formula operator "${ast.operator}"`);
    }
  }
  if (ast.type === 'function') {
    const first = run(ast.args[0], context);
    if (ast.name === 'IF') return truthy(first) ? run(ast.args[1], context) : run(ast.args[2], context);
    const args = ast.args.map((arg) => run(arg, context));
    if (ast.name === 'ABS') return Math.abs(first);
    if (ast.name === 'MIN') return Math.min(...args);
    if (ast.name === 'MAX') return Math.max(...args);
    if (ast.name === 'ROUND') {
      const precision = args.length > 1 ? args[1] : 2;
      if (!Number.isInteger(precision) || Math.abs(precision) > 10) {
        throw new Error('ROUND precision must be an integer between -10 and 10');
      }
      const factor = 10 ** precision;
      return Math.round(first * factor) / factor;
    }
  }
  throw new Error('Invalid salary formula');
}

function validateFormula(expression, allowedVariables) {
  if (!String(expression || '').trim()) throw new Error('Formula cannot be empty');
  const ast = parse(expression);
  if (allowedVariables) {
    const allowed = new Set([...allowedVariables].map((variable) => String(variable).toUpperCase()));
    for (const variable of variablesIn(ast)) {
      if (!allowed.has(variable)) throw new Error(`Unknown salary component or variable "${variable}"`);
    }
  }
  return true;
}

function evaluate(expression, context = {}) {
  const normalized = Object.fromEntries(
    Object.entries(context).map(([key, value]) => [String(key).toUpperCase(), Number(value)])
  );
  const result = run(parse(expression), normalized);
  if (!Number.isFinite(result)) throw new Error('Salary formula did not produce a finite result');
  return Math.round(result * 100) / 100;
}

function computeStructure(lines, ctcAnnual, overrides = {}) {
  const ctc = Number(ctcAnnual);
  if (!Number.isFinite(ctc) || ctc < 0) throw new Error('Annual CTC must be a non-negative number');
  const ctcMonthly = Math.round(ctc / 12);
  const variableAnnual = Number(overrides.variable_annual) || 0;
  const fixedCtcAnnual = ctc - variableAnnual;
  const fixedCtcMonthly = Math.round(fixedCtcAnnual / 12);
  const ctx = {
    CTC_ANNUAL: fixedCtcAnnual,
    CTC_MONTHLY: fixedCtcMonthly,
    CTC_ANNUAL_TOTAL: ctc,
    CTC_MONTHLY_TOTAL: ctcMonthly,
  };
  const results = [];
  const sorted = [...lines].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
  for (const line of sorted) {
    if (!line.is_active) continue;
    const code = line.component_code;
    const type = line.effective_calc_type || line.calc_type;
    let monthly = 0;
    let annual = 0;
    if (type === 'Fixed') {
      const fixed = Number(overrides[code] ?? line.fixed_amount ?? 0);
      if (line.frequency === 'Annual' || line.frequency === 'One-Time') {
        annual = fixed;
        monthly = Math.round(annual / 12);
      } else {
        monthly = fixed;
        annual = monthly * 12;
      }
    } else if (type === 'Percentage') {
      const pct = Number(overrides[`${code}_PCT`] ?? line.effective_pct ?? line.percentage_value ?? 0) / 100;
      const base = line.effective_pct_of || line.percentage_of || 'BASIC';
      const baseValue = Number(ctx[base.toUpperCase()] || 0);
      if (line.frequency === 'Annual') {
        annual = Math.round(baseValue * pct);
        monthly = Math.round(annual / 12);
      } else {
        monthly = Math.round(baseValue * pct);
        annual = monthly * 12;
      }
    } else if (type === 'Formula') {
      if ((line.effective_formula || '').toUpperCase().includes('GROSS')) {
        results.push({ ...line, _deferred: true });
        continue;
      }
      const value = evaluate(line.effective_formula || '', ctx);
      if (line.frequency === 'Annual') {
        annual = Math.round(value);
        monthly = Math.round(annual / 12);
      } else {
        monthly = Math.round(value);
        annual = monthly * 12;
      }
    } else {
      throw new Error(`Unsupported calculation type "${type}"`);
    }
    ctx[code] = monthly;
    ctx[`${code}_ANNUAL`] = annual;
    results.push({ ...line, monthly_amount: monthly, annual_amount: annual, _deferred: false });
  }
  const grossMonthly = results
    .filter((result) => result.category === 'Earning' && !result._deferred)
    .reduce((sum, result) => sum + (result.monthly_amount || 0), 0);
  const employerContributions = results
    .filter((result) => result.category === 'Employer Contribution' && !result._deferred)
    .reduce((sum, result) => sum + (result.monthly_amount || 0), 0);
  ctx.GROSS = Math.max(0, fixedCtcMonthly - employerContributions);
  ctx.GROSS_STD = grossMonthly;
  for (let index = 0; index < results.length; index += 1) {
    const line = results[index];
    if (!line._deferred) continue;
    const value = evaluate(line.effective_formula || '', ctx);
    const annual = line.frequency === 'Annual' ? Math.round(value) : Math.round(value * 12);
    const monthly = line.frequency === 'Annual' ? Math.round(annual / 12) : Math.round(value);
    ctx[line.component_code] = monthly;
    ctx[`${line.component_code}_ANNUAL`] = annual;
    results[index] = { ...line, monthly_amount: monthly, annual_amount: annual, _deferred: false };
  }
  return { components: results, ctx };
}

module.exports = { evaluate, validateFormula, computeStructure };
