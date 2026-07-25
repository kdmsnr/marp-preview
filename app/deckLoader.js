const fs = require('fs').promises;
const path = require('path');

const INCLUDE_DIRECTIVE_RE =
  /^[ \t]*<!--\s*@include\s*:\s*([^\r\n]*?)\s*-->[ \t]*$/gm;
const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown']);

function unwrapQuotedPath(value) {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if (
    trimmed.length >= 2 &&
    ((first === '"' && last === '"') || (first === "'" && last === "'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function resolveIncludePath(entryDirectory, requestedPath) {
  const includePath = unwrapQuotedPath(requestedPath);

  if (!includePath) {
    throw new Error('Include directive requires a Markdown file name.');
  }

  if (path.isAbsolute(includePath) || path.dirname(includePath) !== '.') {
    throw new Error(
      `Included Markdown files must be in the same directory: ${includePath}`,
    );
  }

  if (!MARKDOWN_EXTENSIONS.has(path.extname(includePath).toLowerCase())) {
    throw new Error(
      `Included files must use the .md or .markdown extension: ${includePath}`,
    );
  }

  return path.join(entryDirectory, includePath);
}

function attachDependencies(error, dependencies) {
  error.dependencies = Array.from(dependencies);
  return error;
}

async function expandFile(filePath, context, stack) {
  const resolvedPath = path.resolve(filePath);
  context.dependencies.add(resolvedPath);

  if (stack.includes(resolvedPath)) {
    const cycle = [...stack, resolvedPath]
      .map((item) => path.basename(item))
      .join(' -> ');
    throw new Error(`Circular include detected: ${cycle}`);
  }

  const markdown = await fs.readFile(resolvedPath, 'utf-8');
  const nextStack = [...stack, resolvedPath];
  const directivePattern = new RegExp(
    INCLUDE_DIRECTIVE_RE.source,
    INCLUDE_DIRECTIVE_RE.flags,
  );
  let expanded = '';
  let previousIndex = 0;
  let match;

  while ((match = directivePattern.exec(markdown)) !== null) {
    expanded += markdown.slice(previousIndex, match.index);

    const includedPath = resolveIncludePath(context.entryDirectory, match[1]);
    expanded += await expandFile(includedPath, context, nextStack);
    previousIndex = match.index + match[0].length;
  }

  return expanded + markdown.slice(previousIndex);
}

async function loadDeck(entryPath) {
  const resolvedEntryPath = path.resolve(entryPath);
  const context = {
    dependencies: new Set(),
    entryDirectory: path.dirname(resolvedEntryPath),
  };

  try {
    const markdown = await expandFile(resolvedEntryPath, context, []);
    return {
      markdown,
      dependencies: Array.from(context.dependencies),
    };
  } catch (error) {
    throw attachDependencies(error, context.dependencies);
  }
}

module.exports = {
  loadDeck,
  resolveIncludePath,
};
