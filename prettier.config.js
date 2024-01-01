/** @type {import("prettier").Config} */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  printWidth: 140, // Specify the line length that the printer will wrap on
  useTabs: false, // Indent lines with tabs instead of spaces
  jsxSingleQuote: false, // Use single quotes in JSX
  bracketSpacing: true, // Print spaces between brackets in objects
  jsxBracketSameLine: false, // Put > on the last line instead of a new line in JSX
  arrowParens: 'always', // Include parentheses around a sole arrow function parameter
  endOfLine: 'lf', // Specify the end of line sequence (lf, crlf, cr)
  proseWrap: 'preserve', // Wrap prose as-is (do not reformat),
  singleAttributePerLine: true,
};

export default config;
