interface Options<T> {
  el: string;
  data:T;
  methods?: {
    [key: string]: Function
  }
}
class MVVM<T> {
  $el: string;
  $data: T;
  $options: Options<T>
  $compile: Compile
  constructor(opts: Options<T>){
    this.$el = opts.el
    this.$data = opts.data
    this.$options = opts
    // 实现数据代理
    Object.keys(this.$data as Object).forEach((key) => {
      this.proxy(key as keyof T)
    })
    // 定义响应式
    observe(this.$data)
    // 视图绑定数据(创建命令实例)
    this.$compile = new Compile(opts.el, this)
  }
  /**
   * 实现数据代理 this.xxx -> this.data.xxx
   * @param key data 中的 key 值
   */
  proxy = (key: keyof T) => {
    Object.defineProperty(this, key, {
      configurable: false,
      enumerable: true,
      get: () => {
        return this.$data[key]
      },
      set: (newVal) => {
        this.$data[key] = newVal
      }
    })
  }
}