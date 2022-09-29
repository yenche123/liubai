


const getType = (x: any): string => Object.prototype.toString.call(x).slice(8, -1).toLowerCase()

const isObject = <T extends object>(x: any): x is T => getType(x) === 'object'

const isString = (x: any): x is string => getType(x) === 'string'

const isNumber = (x: any): x is number => getType(x) === 'number'

const isPromise = <T extends Promise<any> = Promise<any>>(x: any): x is T => getType(x) === 'promise'

type AnyFn = (...args: any[]) => any
const isFunction = <T extends AnyFn = AnyFn>(x: any): x is T => typeof x === 'function'

const isArray = <T extends any[]= any[]>(x: any): x is T => Array.isArray(x)

const isDate = (x: any): x is Date => getType(x) === 'date'

const isRegExp = (x: any): x is RegExp => getType(x) === 'regexp'

export default {
  getType,
  isObject,
  isString,
  isNumber,
  isPromise,
  isFunction,
  isArray,
  isDate,
  isRegExp
}

