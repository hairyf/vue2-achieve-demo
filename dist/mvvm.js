"use strict";
class MVVM {
    constructor(opts) {
        var _a, _b, _c, _d;
        /**
         * 实现数据代理 this.xxx -> this.data.xxx
         * @param key data 中的 key 值
         */
        this.proxy = (key) => {
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: true,
                get: () => {
                    return this.$data[key];
                },
                set: (newVal) => {
                    this.$data[key] = newVal;
                }
            });
        };
        this.$el = opts.el;
        this.$data = opts.data;
        this.$options = opts;
        (_b = (_a = this.$options).beforeCreate) === null || _b === void 0 ? void 0 : _b.call(_a);
        // 实现数据代理
        Object.keys(this.$data).forEach((key) => {
            this.proxy(key);
        });
        (_d = (_c = this.$options).created) === null || _d === void 0 ? void 0 : _d.call(_c);
        // 定义响应式
        observe(this.$data, this);
        // 视图绑定数据(创建命令实例)
        this.$compile = new Compile(opts.el, this);
    }
}
