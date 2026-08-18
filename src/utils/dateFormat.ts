export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getAge(dateOfBirth: string, dateOfDeath?: string): number {
  const birth = new Date(dateOfBirth + 'T00:00:00');
  const end = dateOfDeath ? new Date(dateOfDeath + 'T00:00:00') : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getYear(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.split('-')[0];
}
