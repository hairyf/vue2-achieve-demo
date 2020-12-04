const observe = (value: any) => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return new Observer(value);
}
/**
 * 监视者, 数据劫持
 * 通知变化(Dep 队列)
 */
class Observer<T> {
  data: T
  constructor(data: T) {
    this.data = data;
    this.walk()
  }
  /** 逐步添加反应式 */
  walk = () => {
    Object.keys(this.data as Object).forEach((key) => {
      this.defineReactive(
        key,
        this.data,
        this.data[key as keyof T]
      )
    })
  }
  /**定义反应式
   * @param key key 值
   * @param data 当前数据
   * @param value 当前值
   */
  defineReactive = (key: string, data: any, value: any) => {
    const dep = new Dep()
    Object.defineProperty(data, key, {
      // 是否可枚举
      enumerable: true,
      // 是否可在 define
      configurable: false,
      get: () => {
        if (Dep.target) {
          dep.watcherEntanglement()
        }
        return value
      },
      set: (newVal) => {
        if (newVal === value) {
          return false;
        }
        value = newVal
        // 新的值如果是 object，再次进行劫持
        observe(value)
        // 通知订阅者
        dep.notify()
      }
    })
    observe(value)
  }
}

let uid = 0
class Dep {
  // 当前实例ID
  id: number
  // 监视者队列
  subscribers: Watcher[]
  // 当前指标
  static target = null as null | Watcher
  constructor() {
    this.id = uid++
    this.subscribers = []
  }
  /**储存当前监视者实例
   * @param watcher 监视者实例
   */
  addSubscriber = (watcher: Watcher) => {
    this.subscribers.push(watcher)
  }
  /**添加消息队列, 与 watcher 相对应关系
   * @param watcher 监视者实例
   */
  watcherEntanglement = () => {
    Dep.target?.depEntanglement(this)
  }
  /** 通知订阅者 */
  notify = () => {
    this.subscribers.forEach((subscriber) => {
      subscriber.update()
    })
  }
}
