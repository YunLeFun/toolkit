export function createAsyncLock<T>(fn: () => Promise<T>) {
  const state = {
    isLocked: false,
  }

  return () => {
    if (state.isLocked) {
      // eslint-disable-next-line no-console
      console.log('isLocked')
      return
    }

    state.isLocked = true

    return fn()
      .finally(() => {
        state.isLocked = false
      })
  }
}
