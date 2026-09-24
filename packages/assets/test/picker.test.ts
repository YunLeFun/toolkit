import { describe, expect, it, vi } from 'vitest'
import type { AssetPickerWindow } from '../src'
import { openAssetPicker } from '../src'

const requestId = 'picker-request-1234'
const selected = {
  assetId: 'ast_cover_1',
  requestId,
  sha256: 'a'.repeat(64),
  type: 'yunlefun.asset-picker.success',
  version: 1,
}

function fakeOpener() {
  const popup = { closed: false }
  let listener: ((event: { source: unknown, origin: string, data: unknown }) => void) | undefined
  const opener: AssetPickerWindow = {
    location: { origin: 'https://dao.yunle.fun' },
    crypto: { randomUUID: () => requestId },
    open: vi.fn(() => popup),
    addEventListener: (_type, next) => { listener = next },
    removeEventListener: (_type, current) => {
      if (listener === current)
        listener = undefined
    },
  }
  return { opener, popup, dispatch: (event: { source: unknown, origin: string, data: unknown }) => listener?.(event), listening: () => Boolean(listener) }
}

describe('asset Picker opener', () => {
  it('accepts only a matching popup, Drive origin, request ID and schema', async () => {
    const browser = fakeOpener()
    let finished = false
    const pending = openAssetPicker({ appId: 'everything-generator', driveOrigin: 'https://drive.yunle.fun', opener: browser.opener })
      .then((value) => {
        finished = true
        return value
      })
    const openedUrl = new URL(vi.mocked(browser.opener.open).mock.calls[0]![0])
    expect(openedUrl.origin).toBe('https://drive.yunle.fun')
    expect(openedUrl.pathname).toBe('/picker')
    expect(openedUrl.searchParams.get('origin')).toBe('https://dao.yunle.fun')
    expect(openedUrl.searchParams.get('appId')).toBe('everything-generator')
    expect(openedUrl.searchParams.getAll('mimeType')).toEqual(['image/jpeg', 'image/png', 'image/webp'])

    browser.dispatch({ source: {}, origin: 'https://drive.yunle.fun', data: selected })
    browser.dispatch({ source: browser.popup, origin: 'https://evil.example', data: selected })
    browser.dispatch({ source: browser.popup, origin: 'https://drive.yunle.fun', data: { ...selected, requestId: 'wrong' } })
    browser.dispatch({ source: browser.popup, origin: 'https://drive.yunle.fun', data: { ...selected, sha256: 'invalid' } })
    await Promise.resolve()
    expect(finished).toBe(false)

    browser.dispatch({ source: browser.popup, origin: 'https://drive.yunle.fun', data: selected })
    await expect(pending).resolves.toMatchObject(selected)
    expect(browser.listening()).toBe(false)
  })

  it('rejects a blocked popup and non-HTTPS Drive origin', () => {
    const browser = fakeOpener()
    browser.opener.open = () => null
    expect(() => openAssetPicker({ appId: 'everything-generator', driveOrigin: 'https://drive.yunle.fun', opener: browser.opener }))
      .toThrow(/阻止/)
    expect(() => openAssetPicker({ appId: 'everything-generator', driveOrigin: 'http://drive.yunle.fun', opener: browser.opener }))
      .toThrow(/HTTPS/)
  })
})
