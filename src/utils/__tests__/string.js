import { randomString } from '../string';

describe('randomString', () => {
    test('works!', async () => {
        expect(randomString(10)).not.toBe(randomString(10));
        expect(randomString(10).length).toBe(10);
    });
});
