/**
 * Extracts variable names from nunjucks template content.
 * Matches patterns like {{ variableName }} and {{ object.property }}
 */
export function extractNunjucksVariables(templateContent: string): string[] {
  const variablePattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*(?:\|[^}]*)?\}\}/g;
  const variables = new Set<string>();

  let match;
  while ((match = variablePattern.exec(templateContent)) !== null) {
    const variable = match[1];
    // Extract the root variable name (before any dot notation)
    const rootVariable = variable.split('.')[0];
    variables.add(rootVariable);
  }

  return Array.from(variables).sort();
}
