declare var __DEV__: boolean

interface ObjectConstructor {
  keys<O>(o: O): (keyof O)[]
  entries<O>(o: O): [keyof O, O[keyof O]][]
}
