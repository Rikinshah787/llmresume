// FILE: server/services/groClient.js
const config = require('../config');
const fetch = global.fetch; // Node 18+ native fetch

if (!fetch) {
  throw new Error('Global fetch is required (Node 18+).');
}

function buildPrompts(message, currentTex) {
  const systemPrompt = `You are an AI resume editor. Modify the provided LaTeX (.tex) resume based on user instructions. Output only valid LaTeX with no commentary.`;
  const userPrompt = `User request:\n${message}\n\nCurrent resume (.tex):\n${currentTex}`;
  return { systemPrompt, userPrompt };
}

async function proposeUpdate(message, currentTex) {
  const { systemPrompt, userPrompt } = buildPrompts(message, currentTex);
  // If GRO_MOCK is enabled or no API key is provided, return a deterministic mock
  // proposedTex for development. This lets frontend/devs test accept/decline flows
  // without external credentials.
  if (config.gro.mock || !config.gro.key) {
    // Simple heuristic-based mock editor. Try to apply requested changes to the
    // existing LaTeX. This is intentionally lightweight and not a replacement for
    // a real LLM-driven edit.
    const mock = (msg, tex) => {
      let proposed = tex;
      const explanationParts = [];

      const lower = msg.toLowerCase();
      if (lower.includes('make') && lower.includes('name') && (lower.includes('big') || lower.includes('bigger') || lower.includes('huge') || lower.includes('larg'))) {
        // Replace common size commands: \LARGE -> \Huge (note: case-sensitive parts)
        proposed = proposed.replace(/\\LARGE/g, '\\Huge');
        explanationParts.push('Increased name size (\\LARGE -> \\Huge)');
      }

      if (lower.includes('reduce') && lower.includes('margin') || lower.includes('smaller margin') || lower.includes('narrow')) {
        proposed = proposed.replace(/margin\s*=\s*([0-9\.]+)in/, (m, p1) => `margin=0.5in`);
        explanationParts.push('Reduced page margin to 0.5in');
      }

      if (lower.includes('bold') && lower.includes('header') || lower.includes('bold name')) {
        // Ensure name is bolded by adding \textbf if not present
        proposed = proposed.replace(/(\\\w*\{)([^}]*John[^}]*)\}/, (m, p1, p2) => `${p1}\\textbf{${p2}}}`);
        explanationParts.push('Bolded header/name');
      }

      if (explanationParts.length === 0) {
        // Generic mock: append a comment and a small change in summary
        proposed = proposed.replace(/(\\noindent\\textbf\{Summary\}\\\\\s*)([\s\S]*?)(\\vspace\{6pt\})/, (m, p1, p2, p3) => {
          const addition = ` ${p2.trim()}\n\\newline Mock edit: ${msg}`;
          return `${p1}${addition}${p3}`;
        });
        explanationParts.push('Applied mock edit note to Summary section');
      }

      // Ensure we didn't accidentally remove document tags (very defensive)
      if (!/\\documentclass/.test(proposed)) {
        proposed = tex; // fallback to original
        explanationParts.push('Mock fallback: preserved original documentclass');
      }

      return { proposed, explanation: explanationParts.join('; ') };
    };

    const { proposed, explanation } = mock(message, currentTex || '');
    return { proposedTex: proposed, explanation };
  }

  const url = `${config.gro.base.replace(/\/$/, '')}/v1/generate-json`;

  const body = {
    model: config.gro.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_schema: {
      type: 'object',
      properties: {
        proposedTex: { type: 'string' },
        explanation: { type: 'string' }
      },
      required: ['proposedTex']
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.gro.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = `Gro API returned ${res.status} ${res.statusText} - ${text}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const json = await res.json().catch(() => null);
  if (!json) throw new Error('Gro API returned invalid JSON');

  let proposedTex = null;
  let explanation = '';

  if (typeof json.proposedTex === 'string') {
    proposedTex = json.proposedTex;
    explanation = json.explanation || '';
  } else if (json.output && typeof json.output.proposedTex === 'string') {
    proposedTex = json.output.proposedTex;
    explanation = json.output.explanation || '';
  } else if (json.content && typeof json.content.proposedTex === 'string') {
    proposedTex = json.content.proposedTex;
    explanation = json.content.explanation || '';
  } else {
    // fallback: scan for a LaTeX-like string
    const scan = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === 'string' && v.includes('\\documentclass')) return v;
        if (typeof v === 'object') {
          const found = scan(v);
          if (found) return found;
        }
      }
      return null;
    };
    const found = scan(json);
    if (found) {
      proposedTex = found;
      explanation = json.explanation || '';
    }
  }

  if (!proposedTex) {
    const txt = JSON.stringify(json).slice(0, 1000);
    const err = new Error(`Gro API response missing proposedTex. Response snapshot: ${txt}`);
    throw err;
  }

  return { proposedTex, explanation };
}

module.exports = { buildPrompts, proposeUpdate };
