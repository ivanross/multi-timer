import { multiTimer } from '../dist'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe(multiTimer, () => {
  it('should call listener on start', async () => {
    const timer = multiTimer().pushStep({ duration: 400 })

    const fn = jest.fn()
    timer.on('start', fn)
    expect(fn).toBeCalledTimes(0)
    timer.start()

    expect(fn).toBeCalledTimes(1)
  })

  it('should call listener on end', async () => {
    const timer = multiTimer().pushStep({ duration: 400 })

    const fn = jest.fn()
    timer.on('end', fn)
    expect(fn).toBeCalledTimes(0)
    timer.start()

    await sleep(210)
    expect(fn).toBeCalledTimes(0)
    await sleep(210)
    expect(fn).toBeCalledTimes(1)
  })

  it('should call listener on step change', async () => {
    const timer = multiTimer()
      .pushStep({ duration: 400 })
      .pushStep({ duration: 400 })

    const fnStepChange = jest.fn()
    timer.on('stepchange', fnStepChange)

    const fnEnd = jest.fn()
    timer.on('end', fnEnd)

    timer.start()
    expect(fnStepChange).toBeCalledTimes(0)
    expect(fnEnd).toBeCalledTimes(0)

    await sleep(410)
    expect(fnStepChange).toBeCalledTimes(1)
    expect(fnEnd).toBeCalledTimes(0)

    await sleep(410)
    expect(fnStepChange).toBeCalledTimes(1)
    expect(fnEnd).toBeCalledTimes(1)
  })

  it('should call listener on pause', async () => {
    const timer = multiTimer().pushStep({ duration: 400 })

    const fn = jest.fn()
    timer.on('pause', fn)

    timer.start()
    expect(fn).toBeCalledTimes(0)

    await sleep(100)
    expect(fn).toBeCalledTimes(0)
    timer.pause()
    expect(fn).toBeCalledTimes(1)

    await sleep(100)
    expect(fn).toBeCalledTimes(1)
    timer.start()
    expect(fn).toBeCalledTimes(1)

    await sleep(100)
    expect(fn).toBeCalledTimes(1)
    timer.pause()
    expect(fn).toBeCalledTimes(2)
  })

  it('should always increment totalElapsed value', async () => {
    const timer = multiTimer()
      .tickDuration(10)
      .pushStep({ duration: 500 })
      .pushStep({ duration: 500 })
      .pushStep({ duration: 500 })

    let prevTotalElapsed = 0

    timer.on('tick', e => {
      const totalElapsed = e.totalElapsed
      const delta = totalElapsed - prevTotalElapsed
      prevTotalElapsed = totalElapsed
      expect(delta).toBeGreaterThanOrEqual(0)
    })

    timer.start()
    await sleep(2000)
  })
})
