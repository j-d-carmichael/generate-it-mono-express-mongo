type BraceIndices = [number, number] | null;

export const jsonExtractor = (str: string, getOnly1st = false): any[] | any => {
  let currIndex = 0;
  const objs: object[] = [];

  while (currIndex < str.length) {
    // Added length check for safety
    const openClose: BraceIndices = _getOpenCloseBraceIndex(str, currIndex, '{', '}');

    if (openClose) {
      const objStr = str.substring(openClose[0], openClose[1] + 1);

      try {
        const parsed = JSON.parse(objStr);
        if (parsed) {
          objs.push(parsed);
        }
        currIndex = openClose[1] + 1; // Move past the closing brace
      } catch (err) {
        currIndex++;
      }
    } else {
      currIndex++;
    }
  }

  if (getOnly1st) {
    if (objs.length) {
      return objs[0];
    } else {
      return undefined;
    }
  }

  return objs;
};

const _getOpenCloseBraceIndex = (
  str: string,
  indexStart: number,
  openBrace: string,
  closeBrace: string,
): BraceIndices => {
  // Fix: Check if substring exists first
  const substringIndex = str.substring(indexStart).indexOf(openBrace);

  if (substringIndex === -1) {
    return null;
  }

  const openIndex = substringIndex + indexStart;

  let openCount = 1;
  let closeCount = 0;
  let currIndex = openIndex + 1;

  while (currIndex < str.length) {
    // Added length check for safety
    if (str[currIndex] === openBrace) {
      openCount++;
    } else if (str[currIndex] === closeBrace) {
      closeCount++;
      if (openCount === closeCount) {
        return [openIndex, currIndex];
      }
    }
    currIndex++;
  }

  return null;
};
