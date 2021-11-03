export const bind = <T extends Function>(fn: T, self: object): T => fn.bind(self)
