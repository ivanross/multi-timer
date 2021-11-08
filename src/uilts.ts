export const bind = <T extends Function>(fn: T, self: object): T => fn.bind(self)


export function workerSetTimeout(cb: TimerHandler, ms?: number | undefined, ...args: any[]): number {
  // if workers are not available, no way to use this workaround
  if (!globalThis.Worker) return setTimeout(cb, ms, ...args)
  const blob = new Blob(['onmessage = (e) => setTimeout(() => postMessage(0), e.data.ms)'])
  const blobURL = window.URL.createObjectURL(blob)
  const worker = new Worker(blobURL)
  worker.postMessage({ ms })
  function onMessage() {
    typeof cb === 'string' ? eval(cb) : cb(...args)
    worker.removeEventListener('message', onMessage)
    worker.terminate()
  }
  worker.addEventListener('message', onMessage)
  return 0
}