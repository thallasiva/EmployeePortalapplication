export function evaluateArithmeticFormula(formula, context) {
  if (typeof formula !== "string") {
    throw new TypeError("Formula must be a string");
  }

  const tokens =
    formula.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d*)?|\.\d+|[()+\-*/]/g) ||
    [];
  if (tokens.join("") !== formula.replace(/\s/g, "")) {
    throw new Error("Invalid formula");
  }

  let position = 0;
  const parsePrimary = () => {
    const token = tokens[position++];
    if (token === "+" || token === "-") {
      const value = parsePrimary();
      return token === "-" ? -value : value;
    }
    if (token === "(") {
      const value = parseExpression();
      if (tokens[position++] !== ")") {
        throw new Error("Invalid formula");
      }
      return value;
    }
    if (token && /^(?:\d|\.\d)/.test(token)) {
      return Number(token);
    }
    if (
      token &&
      Object.prototype.hasOwnProperty.call(context, token) &&
      Number.isFinite(Number(context[token]))
    ) {
      return Number(context[token]);
    }
    throw new Error("Invalid formula");
  };
  const parseTerm = () => {
    let value = parsePrimary();
    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const right = parsePrimary();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };
  const parseExpression = () => {
    let value = parseTerm();
    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  const value = parseExpression();
  if (position !== tokens.length || !Number.isFinite(value)) {
    throw new Error("Invalid formula");
  }
  return value;
}
