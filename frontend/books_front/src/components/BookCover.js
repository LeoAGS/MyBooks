const placeholderPalettes = [
  ['#173f37', '#315f72'],
  ['#6e4d6f', '#315f72'],
  ['#8e5430', '#b9852c'],
  ['#834159', '#a7563b'],
  ['#2a6f6f', '#39634c'],
  ['#485870', '#5c5084'],
  ['#5a6430', '#b9852c'],
  ['#743018', '#a7563b'],
  ['#254c6b', '#2a6f6f'],
  ['#5f3f6f', '#834159'],
  ['#3f5f4a', '#2f5f52'],
  ['#6f4e37', '#8e5430'],
];

function BookCover({ author, className = '', title, url }) {
  const initials = getInitials(title);
  const coverStyle = url ? { backgroundImage: `url(${url})` } : getPlaceholderStyle(title, author);

  return (
    <div className={`book-cover ${url ? 'has-image' : ''} ${className}`} style={coverStyle} aria-hidden="true">
      {!url && (
        <span>
          <strong>{initials}</strong>
          <small>{author || 'MyBooks'}</small>
        </span>
      )}
    </div>
  );
}

function getPlaceholderStyle(title, author) {
  const [start, end] = placeholderPalettes[getStableIndex(`${title || ''}|${author || ''}`, placeholderPalettes.length)];
  return {
    '--cover-start': start,
    '--cover-end': end,
  };
}

function getStableIndex(value, length) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash % length;
}

function getInitials(title) {
  const words = String(title || '')
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return 'MB';
  }

  return words.map((word) => word[0]).join('').toUpperCase();
}

export default BookCover;
