type WatcherCallback = (value: any, oldVal: any) => void
class Watcher {
  $vm: MVVM<any>
  exp: string
  value: any
  depIds = {} as Record<string, any>
  callback: WatcherCallback
  constructor(vm: MVVM<any>, exp: string, callback: WatcherCallback) {
    this.$vm = vm;
    this.exp = exp
    this.callback = callback
    this.value = this.getValue()
  }
  /** 添加中间层, 与 dep 相对应关系
   * @param dep dep实例
   */
  depEntanglement = (dep: Dep) => {
    // getter里面会触发dep.depend()，继而触发这里的addDep
    // 2. 假如相应属性的dep.id已经在当前watcher的depIds里，说明不是一个新的属性，仅仅是改变了其值而已
    // 则不需要将当前watcher添加到该属性的dep里
    // 3. 假如相应属性是新的属性，则将当前watcher添加到新属性的dep里
    if (!this.depIds.hasOwnProperty(dep.id)) {
      dep.addSubscriber(this)
      this.depIds[dep.id] = dep;
    }
  }
  /** 进行更新数据, 进而更新视图 */
  update = () => {
    const newValue = this.getValue()
    const oldValue = this.value
    if (newValue !== oldValue) {
      this.value = newValue
      this.callback.call(this.$vm, newValue, oldValue)
    }
  }
  /** 解析表达式, 获取当前表达式的值 */
  getValue = () => {
    Dep.target = this;
    // 递归取出对象值, 在取值时, Dep与Watcher则会绑定对应关系
    const exp = this.exp.split('.');
    const value = exp.reduce((previous, key) => {
      return previous[key]
    }, this.$vm.$data)
    Dep.target = null;
    return value
  }
}