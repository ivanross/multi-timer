export type Listener<Event> = (event: Event) => void

export type EventName<Events> = keyof Events

export type ListenerCache<Events> = {
  [Name in keyof Events]?: Listener<Events[Name]>[]
}

export default class EventSystem<Events extends Record<string, any>> {
  private listeners: ListenerCache<Events> = Object.create(null)

  subscribe<T extends EventName<Events>>(eventname: T, listener: Listener<Events[T]>) {
    if (!(eventname in this.listeners)) this.listeners[eventname] = []
    this.listeners[eventname]!.push(listener)
  }

  unsubscribe<T extends EventName<Events>>(eventname: T, listener: Listener<Events[T]>) {
    if (!(eventname in this.listeners)) return
    this.listeners[eventname] = this.listeners[eventname]!.filter(l => l !== listener)
  }

  dispatch<T extends EventName<Events>>(eventname: T, event: Events[T]) {
    if (!(eventname in this.listeners)) return
    this.listeners[eventname]!.forEach(listener => listener(event))
  }

  clone(): EventSystem<Events> {
    const evSys = new EventSystem<Events>()
    for (const event of Object.keys(this.listeners)) {
      evSys.listeners[event] = this.listeners[event]?.slice()
    }
    return evSys
  }
}
