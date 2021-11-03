# multi-timer

example:

```js
import { multiTimer } from 'multi-timer'

const timer = multiTimer()
  .pushStep({ duration: 1000, name: 'first' })
  .pushStep({ duration: 2000, name: 'second' })

timer.on('tick', ev => {
  console.log(ev.elapsed, ev.totalElapsed)
})

timer.on('stepchange', ev => {
  console.log(ev.step)
})
```
