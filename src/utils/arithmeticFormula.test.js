import { evaluateArithmeticFormula } from "./arithmeticFormula";

describe("evaluateArithmeticFormula", () => {
  it("evaluates arithmetic with precedence, parentheses, and formula fields", () => {
    expect(
      evaluateArithmeticFormula("(gross + basic * 2) / 4", {
        basic: 100,
        gross: 300,
      })
    ).toBe(125);
  });

  it("rejects unknown fields and executable expressions", () => {
    expect(() => evaluateArithmeticFormula("window.alert(1)", {})).toThrow();
    expect(() => evaluateArithmeticFormula("unknown + 1", {})).toThrow();
  });

  it("rejects malformed or non-finite arithmetic", () => {
    expect(() => evaluateArithmeticFormula("1 +", {})).toThrow();
    expect(() => evaluateArithmeticFormula("1 / 0", {})).toThrow();
  });
});
