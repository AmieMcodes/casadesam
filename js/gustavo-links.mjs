// Treat model output as text; only canonical Casa de SAM HTTPS URLs become links.
export function renderLinkedAnswer(target, text) {
  const doc = target.ownerDocument;
  target.textContent = '';
  let cursor = 0;
  for (const match of text.matchAll(/https:\/\/casadesam\.org\/[^\s<>"']*/g)) {
    const url = match[0].replace(/[.,!?;:)\]}]+$/, '');
    if (!url) continue;
    target.append(doc.createTextNode(text.slice(cursor, match.index)));
    const link = doc.createElement('a');
    link.href = url;
    link.textContent = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    target.append(link);
    cursor = match.index + url.length;
  }
  target.append(doc.createTextNode(text.slice(cursor)));
}
