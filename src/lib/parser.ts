export type ASTNode =
  | { type: 'statement'; text: string }
  | { type: 'if'; condition: string; trueBlock: ASTNode[]; falseBlock: ASTNode[] }
  | { type: 'loop'; condition: string; body: ASTNode[] };

export function parseToAST(code: string): ASTNode[] {
  // Remove comments and preprocessor directives
  code = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/^#.*$/gm, '');
  code = code.replace(/^using\s+namespace\s+.*$/gm, '');

  let i = 0;
  const tokens: { type: string; value?: string }[] = [];

  while (i < code.length) {
    if (/\s/.test(code[i])) {
      i++;
      continue;
    }

    if (code.startsWith('if', i) && !/\w/.test(code[i + 2] || '')) {
      tokens.push({ type: 'if' });
      i += 2;
      continue;
    }
    if (code.startsWith('else', i) && !/\w/.test(code[i + 4] || '')) {
      tokens.push({ type: 'else' });
      i += 4;
      continue;
    }
    if (code.startsWith('for', i) && !/\w/.test(code[i + 3] || '')) {
      tokens.push({ type: 'for' });
      i += 3;
      continue;
    }
    if (code.startsWith('while', i) && !/\w/.test(code[i + 5] || '')) {
      tokens.push({ type: 'while' });
      i += 5;
      continue;
    }

    if (code[i] === '{') {
      tokens.push({ type: '{' });
      i++;
      continue;
    }
    if (code[i] === '}') {
      tokens.push({ type: '}' });
      i++;
      continue;
    }

    if (code[i] === '(') {
      let depth = 1;
      let start = i;
      i++;
      while (i < code.length && depth > 0) {
        if (code[i] === '(') depth++;
        if (code[i] === ')') depth--;
        i++;
      }
      tokens.push({ type: 'condition', value: code.substring(start + 1, i - 1) });
      continue;
    }

    let start = i;
    while (i < code.length && code[i] !== ';' && code[i] !== '{' && code[i] !== '}') {
      i++;
    }
    if (code[i] === ';') i++;
    let val = code.substring(start, i).trim();
    if (val) {
      if (val.endsWith(';')) val = val.slice(0, -1).trim();
      if (val) tokens.push({ type: 'statement', value: val });
    }
  }

  let tokenIndex = 0;

  function parseStatements(single = false): ASTNode[] {
    const block: ASTNode[] = [];
    while (tokenIndex < tokens.length) {
      const token = tokens[tokenIndex];
      if (token.type === '}') {
        break;
      }
      if (token.type === '{') {
        tokenIndex++;
        block.push(...parseStatements(false));
        if (tokenIndex < tokens.length && tokens[tokenIndex].type === '}') tokenIndex++;
        if (single) break;
        continue;
      }
      if (token.type === 'statement') {
        block.push({ type: 'statement', text: token.value! });
        tokenIndex++;
        if (single) break;
        continue;
      }
      if (token.type === 'if') {
        tokenIndex++;
        let condition = '';
        if (tokenIndex < tokens.length && tokens[tokenIndex].type === 'condition') {
          condition = tokens[tokenIndex].value!;
          tokenIndex++;
        }
        const trueBlock = parseStatements(true);
        let falseBlock: ASTNode[] = [];
        if (tokenIndex < tokens.length && tokens[tokenIndex].type === 'else') {
          tokenIndex++;
          falseBlock = parseStatements(true);
        }
        block.push({ type: 'if', condition, trueBlock, falseBlock });
        if (single) break;
        continue;
      }
      if (token.type === 'for' || token.type === 'while') {
        const loopType = token.type;
        tokenIndex++;
        let condition = '';
        if (tokenIndex < tokens.length && tokens[tokenIndex].type === 'condition') {
          condition = tokens[tokenIndex].value!;
          if (loopType === 'for') condition = `for (${condition})`;
          else condition = `while (${condition})`;
          tokenIndex++;
        }
        const body = parseStatements(true);
        block.push({ type: 'loop', condition, body });
        if (single) break;
        continue;
      }
      tokenIndex++;
      if (single) break;
    }
    return block;
  }

  return parseStatements(false);
}
