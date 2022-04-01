import './fixes';
import { jest } from '@jest/globals'

import { RequestCookieStore } from '@worker-tools/request-cookie-store';
import { EncryptedCookieStore } from '../index.js'

test('exists', () => {
  expect(EncryptedCookieStore).toBeDefined()
})
