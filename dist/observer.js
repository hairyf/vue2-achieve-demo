"use strict";
const observe = (value, $vm) => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    return new Observer(value, $vm);
};
/**
 * 监视者, 数据劫持
 * 通知变化(Dep 队列)
 */
class Observer {
    constructor(data, $vm) {
        /** 逐步添加反应式 */
        this.walk = () => {
            Object.keys(this.data).forEach((key) => {
                this.defineReactive(key, this.data, this.data[key]);
            });
        };
        /**定义反应式
         * @param key key 值
         * @param data 当前数据
         * @param value 当前值
         */
        this.defineReactive = (key, data, value) => {
            const dep = new Dep();
            Object.defineProperty(data, key, {
                // 是否可枚举
                enumerable: true,
                // 是否可在 define
                configurable: false,
                get: () => {
                    if (Dep.target) {
                        dep.watcherEntanglement();
                    }
                    return value;
                },
                set: (newVal) => {
                    var _a, _b;
                    if (newVal === value) {
                        return false;
                    }
                    (_b = (_a = this.$vm.$options).beforeUpdate) === null || _b === void 0 ? void 0 : _b.call(_a);
                    value = newVal;
                    // 新的值如果是 object，再次进行劫持
                    observe(value, this.$vm);
                    // 通知订阅者
                    dep.notify();
                }
            });
            observe(value, this.$vm);
        };
        this.data = data;
        this.$vm = $vm;
        this.walk();
    }
}
let uid = 0;
class Dep {
    constructor() {
        /**储存当前监视者实例
         * @param watcher 监视者实例
         */
        this.addSubscriber = (watcher) => {
            this.subscribers.push(watcher);
        };
        /**添加消息队列, 与 watcher 相对应关系
         * @param watcher 监视者实例
         */
        this.watcherEntanglement = () => {
            var _a;
            (_a = Dep.target) === null || _a === void 0 ? void 0 : _a.depEntanglement(this);
        };
        /** 通知订阅者 */
        this.notify = () => {
            this.subscribers.forEach((subscriber) => {
                subscriber.update();
            });
        };
        this.id = uid++;
        this.subscribers = [];
    }
}
// 当前指标
Dep.target = null;
