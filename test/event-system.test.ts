import EventSystem from '../src/event-system'
import { bind } from '../src/utils'

describe(EventSystem, () => {
  it('should not invoke subscribed listener before dispatch', () => {
    const fn = jest.fn()
    const eventSystem = new EventSystem()

    eventSystem.subscribe('test', fn)
    expect(fn).toBeCalledTimes(0)
  })

  it('should invoke subscribed listener for each dispatch', () => {
    interface Events {
      test: string
    }

    const fn = jest.fn()
    const eventSystem = new EventSystem<Events>()

    eventSystem.subscribe('test', fn)

    eventSystem.dispatch('test', 'test string')
    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith('test string')

    eventSystem.dispatch('test', 'second call')
    expect(fn).toBeCalledTimes(2)
    expect(fn).toBeCalledWith('second call')
  })

  it('should invoke subscribed listener only for its dispatch', () => {
    interface Events {
      a: string
      b: number
    }

    const fnA = jest.fn()
    const fnB = jest.fn()
    const eventSystem = new EventSystem<Events>()

    eventSystem.subscribe('a', fnA)
    eventSystem.subscribe('b', fnB)

    eventSystem.dispatch('a', 'test string')
    expect(fnA).toBeCalledTimes(1)
    expect(fnA).toBeCalledWith('test string')
    expect(fnB).toBeCalledTimes(0)

    eventSystem.dispatch('a', 'second call')
    expect(fnA).toBeCalledTimes(2)
    expect(fnA).toBeCalledWith('second call')
    expect(fnB).toBeCalledTimes(0)

    eventSystem.dispatch('b', 100)
    expect(fnA).toBeCalledTimes(2)
    expect(fnB).toBeCalledTimes(1)
    expect(fnB).toBeCalledWith(100)
  })

  it('should invoke every listener to an event', () => {
    interface Events {
      a: string
    }

    const fnA = jest.fn()
    const fnB = jest.fn()
    const eventSystem = new EventSystem<Events>()

    eventSystem.subscribe('a', fnA)
    eventSystem.subscribe('a', fnB)

    eventSystem.dispatch('a', 'test string')
    expect(fnA).toBeCalledTimes(1)
    expect(fnA).toBeCalledWith('test string')
    expect(fnB).toBeCalledTimes(1)
    expect(fnB).toBeCalledWith('test string')

    eventSystem.dispatch('a', 'second call')
    expect(fnA).toBeCalledTimes(2)
    expect(fnA).toBeCalledWith('test string')
    expect(fnB).toBeCalledTimes(2)
    expect(fnB).toBeCalledWith('test string')
  })

  it('should stop invoking listener after unsubscribe', () => {
    interface Events {
      a: string
    }

    const fn = jest.fn()
    const eventSystem = new EventSystem<Events>()

    eventSystem.subscribe('a', fn)
    eventSystem.dispatch('a', 'test string')

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith('test string')

    eventSystem.unsubscribe('a', fn)
    eventSystem.dispatch('a', 'second call')

    expect(fn).toBeCalledTimes(1)
  })

  it('should work when binded', () => {
    interface Events {
      a: string
    }

    class MyClass {
      ev = new EventSystem<Events>()
      on = bind(this.ev.subscribe, this.ev)
      off = bind(this.ev.unsubscribe, this.ev)
    }

    const fn = jest.fn()
    const eventSystem = new MyClass()

    eventSystem.on('a', fn)
    eventSystem.ev.dispatch('a', 'test string')

    expect(fn).toBeCalledTimes(1)
    expect(fn).toBeCalledWith('test string')

    eventSystem.off('a', fn)
    eventSystem.ev.dispatch('a', 'second call')

    expect(fn).toBeCalledTimes(1)
  })

  it('should clone correctly', () => {
    const fn = jest.fn()

    const sys = new EventSystem<{ test: string }>()
    sys.subscribe('test', fn)

    const sysClone = sys.clone()

    sys.dispatch('test', 'test string')
    sysClone.dispatch('test', 'test from clone')

    expect(fn).toBeCalledTimes(2)

    fn.mockClear()
    expect(fn).toBeCalledTimes(0)

    sys.unsubscribe('test', fn)
    sys.dispatch('test', 'dispatch after unsubscribe')
    expect(fn).toBeCalledTimes(0)

    sysClone.dispatch('test', 'dispatch after unsubscribe from clone')
    expect(fn).toBeCalledTimes(1)
  })
})
