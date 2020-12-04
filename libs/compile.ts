class Compile {
  $vm: MVVM<any>
  $el: Element
  $fragment: DocumentFragment
  constructor(el: string, vm: MVVM<any>) {
    this.$vm = vm
    this.$el = document.querySelector(el) || document.body
    this.$fragment = this.node2Fragment(this.$el)
    this.compileElement(this.$fragment)
    this.$el.appendChild(this.$fragment)
  }
  /** 将原生节点拷贝到 fragment 上 */
  node2Fragment = (el: Element) => {
    const fragment = document.createDocumentFragment();
    let child;
    while (child = el.firstChild) {
      fragment.appendChild(child)
    }
    return fragment
  }
  /** 编译元素命令 */
  compileElement = (el: Element | ChildNode | DocumentFragment) => {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      const text = node.textContent || ''
      const reg = /\{\{(.*)\}\}/;
      // 如该节点为元素节点
      if (this.isElementNode(node)) {
        this.compileAttribute(node as Element)
      }
      // 如该子节点为文本节点
      if (this.isTextNode(node) && reg.test(text)) {
        this.compileTextExp((node as Element), RegExp.$1)
      }
      // 如该子节点拥有子节点, 那么再次编译命令
      if (node.childNodes && node.childNodes.length) {
        this.compileElement(node)
      }
    })
  }
  /** 编译属性节点命令 */
  compileAttribute = (node: Element) => {
    const nodeAttrs = node.attributes
    Array.from(nodeAttrs).forEach(attr => {
      const attrName = attr.name
      // 如果不是 v- 开头, 则跳出函数
      if (!this.isDirective(attrName)) {
        return false;
      }
      const exp = attr.value
      const dir = attrName.substring(2) as keyof typeof compileUtils
      // 如该指令是事件指令
      if (this.isEventDirective(dir)) {
        return false;
      }
      // 如该指令是普通指令
      compileUtils[dir]?.(node, this.$vm, exp)
    })
  }
  /** 编译文本节点表达式 */
  compileTextExp = (node: Element, exp: string) => {
    compileUtils.text(node, this.$vm, exp)
  }
  /** 是否是 v- 指令 */
  isDirective = (attr: string) => {
    return attr.indexOf('v-') === 0
  }
  /** 是否是事件指令 */
  isEventDirective = (dir: string) => {
    return dir.indexOf('on') === 0
  }
  /** 是否是元素节点 */
  isElementNode = (node: ChildNode) => {
    return node.nodeType === 1
  }
  /** 是否是文本节点 */
  isTextNode = (node: ChildNode) => {
    return node.nodeType === 3
  }
}

// 递归取出对象值, 在取值时, Dep 与 Watcher 则会绑定对应关系
const _getVMVal = ($vm: MVVM<any>, exp: string) => {
  const $data = $vm.$data
  const expKeys = exp.split('.')
  const value = expKeys.reduce((previous, key) => {
    return previous[key]
  }, $data)
  return value
}
// 递归获取当前设置值的目标对象, 在设置值
const _setVMVal = ($vm: MVVM<any>, exp: string, value: any) => {
  const $data = $vm.$data
  const expKeys = exp.split('.')
  expKeys.reduce((previous, key, index) => {
    if (index === expKeys.length - 1) {
      previous[key] = value
    } else {
      return previous[key]
    }
  }, $data)
}

/** 命令集合 */
const compileUtils = {
  /** 建立文本节点的双向绑定数据
  * @param node 当前节点
  * @param $vm 当前实例
  * @param exp 表达式内容
  */
  text(node: Element, $vm: MVVM<any>, exp: string) {
    this.bind(node, $vm, exp, 'text');
  },
  /** 建立文本节点(html)的双向绑定数据
   * @param node 当前节点
   * @param $vm 当前实例
   * @param exp 表达式内容
   */
  html(node: Element, $vm: MVVM<any>, exp: string) {
    this.bind(node, $vm, exp, 'html');
  },
  /** v-model 命令绑定, 建立双向绑定
   * @param node 当前节点
   * @param $vm 当前实例
   * @param exp 表达式内容
   */
  model(node: Element, $vm: MVVM<any>, exp: string) {
    this.bind(node, $vm, exp, 'model');
    let oldValue = _getVMVal($vm, exp);
    (node as HTMLInputElement).addEventListener('input', function () {
      const newValue = this.value;
      if (oldValue === newValue) {
        return false;
      }
      _setVMVal($vm, exp, newValue)
      oldValue = newValue
    })
  },
  /** 属性命令数据绑定元素
   * @param node 当前节点
   * @param $vm 当前实例
   * @param exp 表达式内容
   * @param dir 表达式
   */
  bind(node: Element, $vm: MVVM<any>, exp: string, dir = '') {
    const expFuncKey = dir + 'Updater' as keyof typeof updaterNode
    const updaterFunc = updaterNode[expFuncKey]
    updaterFunc && updaterFunc(node, _getVMVal($vm, exp))
    new Watcher($vm, exp, function (value, oldValue) {
      updaterFunc && updaterFunc(node, value, oldValue);
    })
  },
  /** 属性节点指令事件处理
   * @param node 当前节点
   * @param $vm 当前实例
   * @param exp 表达式内容
   * @param dir 表达式
   */
  eventHandler(node: Element, $vm: MVVM<any>, exp: string, dir = '') {
    const eventType = dir.split(':')[1]
    const callback = $vm.$options.methods?.[exp]
    if (eventType && callback) {
      node.addEventListener(eventType, callback.bind($vm), false)
    }
  }
}

/** 节点数据更新 */
const updaterNode = {
  textUpdater: (node: Element, value?: string) => {
    node.textContent = value ?? ''
  },
  htmlUpdater: (node: Element, value?: string) => {
    node.innerHTML = value ?? ''
  },
  classUpdater: (node: Element, value?: string, oldValue?: string) => {
    node.classList.remove(oldValue ?? '__none__')
    node.classList.add(value ?? '')
  },
  modelUpdater: (node: Element, value?: string) => {
    (node as HTMLInputElement).value = value ?? ''
  },
}