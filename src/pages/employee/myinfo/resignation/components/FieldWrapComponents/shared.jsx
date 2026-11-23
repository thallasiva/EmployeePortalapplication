const fieldStyle = hasErr => ({
  width: "100%",
  boxSizing: "border-box",
  height: 40,
  padding: "0 12px",
  border: `1.5px solid ${hasErr ? "#fca5a5" : "#e2e8f0"}`,
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
  background: hasErr ? "#fff5f5" : "#fff",
  color: "#1e293b",
  fontFamily: "inherit",
  transition: "border-color 0.15s"
});
const textareaStyle = hasErr => ({
  ...fieldStyle(hasErr),
  height: "auto",
  paddingTop: 10,
  paddingBottom: 10,
  resize: "vertical"
});
export { fieldStyle, textareaStyle };
