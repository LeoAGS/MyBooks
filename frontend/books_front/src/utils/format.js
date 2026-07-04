export function formatDate(value) {
  if (!value) {
    return '';
  }

  return value.split('-').reverse().join('/');
}
