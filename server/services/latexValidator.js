// FILE: server/services/latexValidator.js
/**
 * Lightweight LaTeX validation:
 * - Contains \documentclass{...}
 * - Contains \begin{document} and \end{document}
 * - Balanced braces
 * - Reject known unsafe commands (simple patterns)
 */

function validateTex(tex) {
  const errors = [];
  if (typeof tex !== 'string' || tex.trim().length === 0) {
    errors.push('Empty LaTeX document');
    return { valid: false, errors };
  }

  if (!/\\documentclass\s*\{[^}]+\}/i.test(tex)) {
    errors.push('Missing \\documentclass{...}');
  }

  if (!/\\begin\{document\}/i.test(tex)) {
    errors.push('Missing \\begin{document}');
  }
  if (!/\\end\{document\}/i.test(tex)) {
    errors.push('Missing \\end{document}');
  }

  // Balanced braces check (simple)
  let depth = 0;
  for (let i = 0; i < tex.length; i++) {
    const ch = tex[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth < 0) {
        errors.push('Unbalanced braces (too many })');
        break;
      }
    }
  }
  if (depth > 0) errors.push('Unbalanced braces (missing })');

  // Reject unsafe commands or suspicious constructs
  const unsafePatterns = [
    /\\write18\b/, // shell-escape
    /\\input\s*\{.*\|.*\}/, // suspicious pipe injection
    /\\immediate\\write\b/,
    /\\openout\b/,
    /\\read\b/
  ];
  unsafePatterns.forEach((rx) => {
    if (rx.test(tex)) errors.push(`Prohibited or suspicious LaTeX construct: ${rx}`);
  });

  const valid = errors.length === 0;
  return { valid, errors };
}

module.exports = { validateTex };
