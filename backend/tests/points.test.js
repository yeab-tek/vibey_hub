const { calculateLevel } = require('../utils/points');

describe('calculateLevel', () => {
  test('0-49 points is New Contributor', () => {
    expect(calculateLevel(0)).toBe('New Contributor');
    expect(calculateLevel(49)).toBe('New Contributor');
  });

  test('50-149 points is Contributor', () => {
    expect(calculateLevel(50)).toBe('Contributor');
    expect(calculateLevel(149)).toBe('Contributor');
  });

  test('150-299 points is Core Contributor', () => {
    expect(calculateLevel(150)).toBe('Core Contributor');
    expect(calculateLevel(299)).toBe('Core Contributor');
  });

  test('300+ points is Top Contributor', () => {
    expect(calculateLevel(300)).toBe('Top Contributor');
    expect(calculateLevel(10000)).toBe('Top Contributor');
  });
});
