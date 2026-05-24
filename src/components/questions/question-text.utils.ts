export function splitQuestionText(text: string): { title: string; statement: string } {
  if (!text.trim()) {
    return { title: '', statement: '' };
  }

  const parts = text.split('\n\n');

  if (parts.length > 1) {
    return {
      title: parts[0]?.trim() ?? '',
      statement: parts.slice(1).join('\n\n').trim(),
    };
  }

  const single = text.trim();
  return { title: single, statement: single };
}

export function joinQuestionText(title: string, statement: string): string {
  const normalizedTitle = title.trim();
  const normalizedStatement = statement.trim();

  if (!normalizedTitle && !normalizedStatement) return '';
  if (!normalizedTitle) return normalizedStatement;
  if (!normalizedStatement) return normalizedTitle;
  if (normalizedTitle === normalizedStatement) return normalizedStatement;

  return `${normalizedTitle}\n\n${normalizedStatement}`;
}
