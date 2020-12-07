"use strict";
class Compile {
    constructor(el, $vm) {
        var _a, _b, _c, _d;
        /** 将原生节点拷贝到 fragment 上 */
        this.node2Fragment = (el) => {
            const fragment = document.createDocumentFragment();
            let child;
            while (child = el.firstChild) {
                fragment.appendChild(child);
            }
            return fragment;
        };
        /** 编译元素命令 */
        this.compileElement = (el) => {
            const childNodes = el.childNodes;
            Array.from(childNodes).forEach(node => {
                const text = node.textContent || '';
                const reg = /\{\{(.*)\}\}/;
                // 如该节点为元素节点
                if (this.isElementNode(node)) {
                    this.compileAttribute(node);
                }
                // 如该子节点为文本节点
                if (this.isTextNode(node) && reg.test(text)) {
                    this.compileTextExp(node, RegExp.$1);
                }
                // 如该子节点拥有子节点, 那么再次编译命令
                if (node.childNodes && node.childNodes.length) {
                    this.compileElement(node);
                }
            });
        };
        /** 编译属性节点命令 */
        this.compileAttribute = (node) => {
            const nodeAttrs = node.attributes;
            Array.from(nodeAttrs).forEach(attr => {
                var _a, _b;
                const attrName = attr.name;
                // 如果不是 v- 开头, 则跳出函数
                if (!this.isDirective(attrName)) {
                    return false;
                }
                const exp = attr.value;
                const dir = attrName.substring(2);
                // 如该指令是事件指令
                if (this.isEventDirective(dir)) {
                    (_a = compileUtils['eventHandler']) === null || _a === void 0 ? void 0 : _a.call(compileUtils, node, this.$vm, exp, dir);
                    return false;
                }
                // 如该指令是普通指令
                (_b = compileUtils[dir]) === null || _b === void 0 ? void 0 : _b.call(compileUtils, node, this.$vm, exp);
            });
        };
        /** 编译文本节点表达式 */
        this.compileTextExp = (node, exp) => {
            compileUtils.text(node, this.$vm, exp);
        };
        /** 是否是 v- 指令 */
        this.isDirective = (attr) => {
            return attr.indexOf('v-') === 0;
        };
        /** 是否是事件指令 */
        this.isEventDirective = (dir) => {
            return dir.indexOf('on') === 0;
        };
        /** 是否是元素节点 */
        this.isElementNode = (node) => {
            return node.nodeType === 1;
        };
        /** 是否是文本节点 */
        this.isTextNode = (node) => {
            return node.nodeType === 3;
        };
        this.$vm = $vm;
        this.$el = document.querySelector(el) || document.body;
        (_b = (_a = $vm.$options).beforeMount) === null || _b === void 0 ? void 0 : _b.call(_a);
        this.$fragment = this.node2Fragment(this.$el);
        this.compileElement(this.$fragment);
        this.$el.appendChild(this.$fragment);
        (_d = (_c = $vm.$options).mounted) === null || _d === void 0 ? void 0 : _d.call(_c);
    }
}
// 递归取出对象值, 在取值时, Dep 与 Watcher 则会绑定对应关系
const _getVMVal = ($vm, exp) => {
    const $data = $vm.$data;
    const expKeys = exp.split('.');
    const value = expKeys.reduce((previous, key) => {
        return previous[key];
    }, $data);
    return value;
};
// 递归获取当前设置值的目标对象, 在设置值
const _setVMVal = ($vm, exp, value) => {
    const $data = $vm.$data;
    const expKeys = exp.split('.');
    expKeys.reduce((previous, key, index) => {
        if (index === expKeys.length - 1) {
            previous[key] = value;
        }
        else {
            return previous[key];
        }
    }, $data);
};
/** 命令集合 */
const compileUtils = {
    /** 建立文本节点的双向绑定数据
    * @param node 当前节点
    * @param $vm 当前实例
    * @param exp 表达式内容
    */
    text(node, $vm, exp) {
        this.bind(node, $vm, exp, 'text');
    },
    /** 建立文本节点(html)的双向绑定数据
     * @param node 当前节点
     * @param $vm 当前实例
     * @param exp 表达式内容
     */
    html(node, $vm, exp) {
        this.bind(node, $vm, exp, 'html');
    },
    /** v-model 命令绑定, 建立双向绑定
     * @param node 当前节点
     * @param $vm 当前实例
     * @param exp 表达式内容
     */
    model(node, $vm, exp) {
        this.bind(node, $vm, exp, 'model');
        let oldValue = _getVMVal($vm, exp);
        node.addEventListener('input', function () {
            const newValue = this.value;
            if (oldValue === newValue) {
                return false;
            }
            _setVMVal($vm, exp, newValue);
            oldValue = newValue;
        });
    },
    /** 属性命令数据绑定元素
     * @param node 当前节点
     * @param $vm 当前实例
     * @param exp 表达式内容
     * @param dir 表达式
     */
    bind(node, $vm, exp, dir = '') {
        const expFuncKey = dir + 'Updater';
        const updaterFunc = updaterNode[expFuncKey];
        updaterFunc && updaterFunc(node, _getVMVal($vm, exp));
        new Watcher($vm, exp, function (value, oldValue) {
            var _a, _b;
            updaterFunc && updaterFunc(node, value, oldValue);
            (_b = (_a = $vm.$options).updated) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
    },
    /** 属性节点指令事件处理
     * @param node 当前节点
     * @param $vm 当前实例
     * @param exp 表达式内容
     * @param dir 表达式
     */
    eventHandler(node, $vm, exp, dir = '') {
        var _a;
        const eventType = dir.split(':')[1];
        const callback = (_a = $vm.$options.methods) === null || _a === void 0 ? void 0 : _a[exp];
        if (eventType && callback) {
            node.addEventListener(eventType, callback.bind($vm), false);
        }
    }
};
/** 节点数据更新 */
const updaterNode = {
    textUpdater: (node, value) => {
        node.textContent = value !== null && value !== void 0 ? value : '';
    },
    htmlUpdater: (node, value) => {
        node.innerHTML = value !== null && value !== void 0 ? value : '';
    },
    classUpdater: (node, value, oldValue) => {
        node.classList.remove(oldValue !== null && oldValue !== void 0 ? oldValue : '__none__');
        node.classList.add(value !== null && value !== void 0 ? value : '');
    },
    modelUpdater: (node, value) => {
        node.value = value !== null && value !== void 0 ? value : '';
    },
};
