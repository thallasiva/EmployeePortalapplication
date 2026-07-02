const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const helperFile = path.join(srcDir, "utils", "classStyles.js");

function walk(dir, files = [])
{
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }))
  {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory())
    {
      walk(fullPath, files);
    }
    else if (/\.(js|jsx)(\.(bak|clean))?$/.test(entry.name))
    {
      files.push(fullPath);
    }
  }
  return files;
}

function helperImportPath(file)
{
  let relative = path.relative(path.dirname(file), helperFile).replace(/\\/g, "/");
  relative = relative.replace(/\.js$/, "");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function hasHelperImport(programPath)
{
  return programPath.node.body.some((node) =>
    t.isImportDeclaration(node) &&
    node.specifiers.some((specifier) =>
      t.isImportSpecifier(specifier) &&
      ["cssClass", "joinClasses"].includes(specifier.imported.name)
    )
  );
}

function addHelperImport(programPath, file)
{
  if (hasHelperImport(programPath)) return;

  const declaration = t.importDeclaration(
    [
      t.importSpecifier(t.identifier("cssClass"), t.identifier("cssClass")),
      t.importSpecifier(t.identifier("joinClasses"), t.identifier("joinClasses")),
    ],
    t.stringLiteral(helperImportPath(file))
  );

  const lastImportIndex = programPath.node.body.findLastIndex((node) => t.isImportDeclaration(node));
  programPath.node.body.splice(lastImportIndex + 1, 0, declaration);
}

function classExpression(existingClassName, styleExpression)
{
  const cssCall = t.callExpression(t.identifier("cssClass"), [styleExpression]);

  if (!existingClassName)
  {
    return cssCall;
  }

  if (t.isStringLiteral(existingClassName.value))
  {
    return t.callExpression(t.identifier("joinClasses"), [
      t.stringLiteral(existingClassName.value.value),
      cssCall,
    ]);
  }

  if (t.isJSXExpressionContainer(existingClassName.value))
  {
    const current = existingClassName.value.expression;
    if (t.isJSXEmptyExpression(current)) return cssCall;

    return t.callExpression(t.identifier("joinClasses"), [current, cssCall]);
  }

  return cssCall;
}

function migrateFile(file)
{
  if (file === helperFile) return false;

  const original = fs.readFileSync(file, "utf8");
  if (!original.includes("style=")) return false;

  let ast;
  try
  {
    ast = parser.parse(original, {
      sourceType: "module",
      plugins: ["jsx", "classProperties", "optionalChaining", "nullishCoalescingOperator"],
    });
  }
  catch (error)
  {
    console.warn(`Skipped parse failure: ${path.relative(root, file)}\n${error.message}`);
    return false;
  }

  let changed = false;
  let programPathRef;

  traverse(ast, {
    Program(programPath)
    {
      programPathRef = programPath;
    },
    JSXOpeningElement(elementPath)
    {
      const attributes = elementPath.node.attributes;
      const styleIndex = attributes.findIndex((attribute) =>
        t.isJSXAttribute(attribute) &&
        t.isJSXIdentifier(attribute.name, { name: "style" })
      );

      if (styleIndex < 0) return;

      const styleAttribute = attributes[styleIndex];
      if (!t.isJSXExpressionContainer(styleAttribute.value)) return;

      const styleExpression = styleAttribute.value.expression;
      if (t.isJSXEmptyExpression(styleExpression)) return;

      let classAttribute = attributes.find((attribute) =>
        t.isJSXAttribute(attribute) &&
        t.isJSXIdentifier(attribute.name, { name: "className" })
      );

      const expression = classExpression(classAttribute, styleExpression);
      if (classAttribute)
      {
        classAttribute.value = t.jsxExpressionContainer(expression);
      }
      else
      {
        classAttribute = t.jsxAttribute(
          t.jsxIdentifier("className"),
          t.jsxExpressionContainer(expression)
        );
        attributes.push(classAttribute);
      }

      attributes.splice(styleIndex, 1);
      changed = true;
    },
  });

  if (!changed) return false;

  addHelperImport(programPathRef, file);

  const output = generate(ast, {
    retainLines: true,
    jsescOption: { minimal: true },
  }, original).code;

  fs.writeFileSync(file, `${output}\n`, "utf8");
  return true;
}

const changedFiles = walk(srcDir).filter(migrateFile);

console.log(`Migrated ${changedFiles.length} files`);
changedFiles.forEach((file) => console.log(path.relative(root, file)));
