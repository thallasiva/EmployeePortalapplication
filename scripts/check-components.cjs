const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(filename);
    return /\.[jt]sx?$/.test(entry.name) ? [filename] : [];
  });
}

let violations = 0;
const files = sourceFiles(path.join(__dirname, "..", "src"));
for (const filename of files) {
  const ast = parser.parse(fs.readFileSync(filename, "utf8"), {
    sourceType: "module",
    plugins: ["jsx"],
  });
  const components = [];
  traverse(ast, {
    Function(componentPath) {
      const name = componentPath.node.id?.name ||
        (componentPath.parent.type === "VariableDeclarator"
          ? componentPath.parent.id.name : null);
      if (!name || !/^[A-Z]/.test(name)) return;
      let rendersJSX = false;
      componentPath.traverse({
        JSXElement() { rendersJSX = true; },
        JSXFragment() { rendersJSX = true; },
      });
      if (rendersJSX) components.push(name);
    },
    Class(componentPath) {
      if (componentPath.node.superClass && /^[A-Z]/.test(componentPath.node.id?.name || "")) {
        components.push(componentPath.node.id.name);
      }
    },
  });
  if (components.length > 1) {
    console.error(`${path.relative(process.cwd(), filename)}: ${components.join(", ")}`);
    violations += 1;
  }
}
if (violations) process.exitCode = 1;
else console.log(`Checked ${files.length} source files: each file contains at most one component.`);
