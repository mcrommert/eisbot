//IE 11 Polyfills
//startsWith polyfill
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

// Element.closest() polyfill
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el = this;

    do {
      if (Element.prototype.matches.call(el, s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

//find polyfill
if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    if (this === null) {
      throw new TypeError("Array.prototype.find called on null or undefined");
    }
    if (typeof predicate !== "function") {
      throw new TypeError("predicate must be a function");
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

//Promise polyfill
(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory()
    : typeof define === "function" && define.amd
    ? define(factory)
    : factory();
})(this, function () {
  "use strict";

  /**
   * @this {Promise}
   */
  function finallyConstructor(callback) {
    var constructor = this.constructor;
    return this.then(
      function (value) {
        // @ts-ignore
        return constructor.resolve(callback()).then(function () {
          return value;
        });
      },
      function (reason) {
        // @ts-ignore
        return constructor.resolve(callback()).then(function () {
          // @ts-ignore
          return constructor.reject(reason);
        });
      }
    );
  }

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function isArray(x) {
    return Boolean(x && typeof x.length !== "undefined");
  }

  function noop() {}

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  /**
   * @constructor
   * @param {Function} fn
   */
  function Promise(fn) {
    if (!(this instanceof Promise))
      throw new TypeError("Promises must be constructed via new");
    if (typeof fn !== "function") throw new TypeError("not a function");
    /** @type {!number} */
    this._state = 0;
    /** @type {!boolean} */
    this._handled = false;
    /** @type {Promise|undefined} */
    this._value = undefined;
    /** @type {!Array<!Function>} */
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self)
        throw new TypeError("A promise cannot be resolved with itself.");
      if (
        newValue &&
        (typeof newValue === "object" || typeof newValue === "function")
      ) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === "function") {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function () {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  /**
   * @constructor
   */
  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === "function" ? onFulfilled : null;
    this.onRejected = typeof onRejected === "function" ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(
        function (value) {
          if (done) return;
          done = true;
          resolve(self, value);
        },
        function (reason) {
          if (done) return;
          done = true;
          reject(self, reason);
        }
      );
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype["catch"] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    // @ts-ignore
    var prom = new this.constructor(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.prototype["finally"] = finallyConstructor;

  Promise.all = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!isArray(arr)) {
        return reject(new TypeError("Promise.all accepts an array"));
      }

      var args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && (typeof val === "object" || typeof val === "function")) {
            var then = val.then;
            if (typeof then === "function") {
              then.call(
                val,
                function (val) {
                  res(i, val);
                },
                reject
              );
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && typeof value === "object" && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!isArray(arr)) {
        return reject(new TypeError("Promise.race accepts an array"));
      }

      for (var i = 0, len = arr.length; i < len; i++) {
        Promise.resolve(arr[i]).then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn =
    // @ts-ignore
    (typeof setImmediate === "function" &&
      function (fn) {
        // @ts-ignore
        setImmediate(fn);
      }) ||
    function (fn) {
      setTimeoutFunc(fn, 0);
    };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== "undefined" && console) {
      console.warn("Possible Unhandled Promise Rejection:", err); // eslint-disable-line no-console
    }
  };

  /** @suppress {undefinedVars} */
  var globalNS = (function () {
    // the only reliable means to get the global object is
    // `Function('return this')()`
    // However, this causes CSP violations in Chrome apps.
    if (typeof self !== "undefined") {
      return self;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof global !== "undefined") {
      return global;
    }
    throw new Error("unable to locate global object");
  })();

  if (!("Promise" in globalNS)) {
    globalNS["Promise"] = Promise;
  } else if (!globalNS.Promise.prototype["finally"]) {
    globalNS.Promise.prototype["finally"] = finallyConstructor;
  }
});

//findIndex polyfill
Array.prototype.findIndex =
  Array.prototype.findIndex ||
  function (callback) {
    if (this === null) {
      throw new TypeError(
        "Array.prototype.findIndex called on null or undefined"
      );
    } else if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }
    var list = Object(this);
    // Makes sures is always has an positive integer as length.
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    for (var i = 0; i < length; i++) {
      if (callback.call(thisArg, list[i], i, list)) {
        return i;
      }
    }
    return -1;
  };

!(function () {
  "use strict";
  function o(o) {
    var t = ["MSIE ", "Trident/", "Edge/"];
    return new RegExp(t.join("|")).test(o);
  }
  function t() {
    function t(o, t) {
      (this.scrollLeft = o), (this.scrollTop = t);
    }
    function r(o) {
      return 0.5 * (1 - Math.cos(Math.PI * o));
    }
    function i(o) {
      if (
        null === o ||
        "object" != typeof o ||
        void 0 === o.behavior ||
        "auto" === o.behavior ||
        "instant" === o.behavior
      )
        return !0;
      if ("object" == typeof o && "smooth" === o.behavior) return !1;
      throw new TypeError(
        "behavior member of ScrollOptions " +
          o.behavior +
          " is not a valid value for enumeration ScrollBehavior."
      );
    }
    function s(o, t) {
      return "Y" === t
        ? o.clientHeight + h < o.scrollHeight
        : "X" === t
        ? o.clientWidth + h < o.scrollWidth
        : void 0;
    }
    function c(o, t) {
      var e = l.getComputedStyle(o, null)["overflow" + t];
      return "auto" === e || "scroll" === e;
    }
    function n(o) {
      var t = s(o, "Y") && c(o, "Y"),
        l = s(o, "X") && c(o, "X");
      return t || l;
    }
    function f(o) {
      var t;
      do {
        t = (o = o.parentNode) === e.body;
      } while (!1 === t && !1 === n(o));
      return (t = null), o;
    }
    function a(o) {
      var t,
        e,
        i,
        s = (y() - o.startTime) / v;
      (t = r((s = s > 1 ? 1 : s))),
        (e = o.startX + (o.x - o.startX) * t),
        (i = o.startY + (o.y - o.startY) * t),
        o.method.call(o.scrollable, e, i),
        (e === o.x && i === o.y) || l.requestAnimationFrame(a.bind(l, o));
    }
    function p(o, r, i) {
      var s,
        c,
        n,
        f,
        p = y();
      o === e.body
        ? ((s = l),
          (c = l.scrollX || l.pageXOffset),
          (n = l.scrollY || l.pageYOffset),
          (f = u.scroll))
        : ((s = o), (c = o.scrollLeft), (n = o.scrollTop), (f = t)),
        a({
          scrollable: s,
          method: f,
          startTime: p,
          startX: c,
          startY: n,
          x: r,
          y: i,
        });
    }
    if (
      !(
        "scrollBehavior" in e.documentElement.style &&
        !0 !== l.__forceSmoothScrollPolyfill__
      )
    ) {
      var d = l.HTMLElement || l.Element,
        v = 468,
        h = o(l.navigator.userAgent) ? 1 : 0,
        u = {
          scroll: l.scroll || l.scrollTo,
          scrollBy: l.scrollBy,
          elementScroll: d.prototype.scroll || t,
          scrollIntoView: d.prototype.scrollIntoView,
        },
        y =
          l.performance && l.performance.now
            ? l.performance.now.bind(l.performance)
            : Date.now;
      (l.scroll = l.scrollTo = function () {
        void 0 !== arguments[0] &&
          (!0 !== i(arguments[0])
            ? p.call(
                l,
                e.body,
                void 0 !== arguments[0].left
                  ? ~~arguments[0].left
                  : l.scrollX || l.pageXOffset,
                void 0 !== arguments[0].top
                  ? ~~arguments[0].top
                  : l.scrollY || l.pageYOffset
              )
            : u.scroll.call(
                l,
                void 0 !== arguments[0].left
                  ? arguments[0].left
                  : "object" != typeof arguments[0]
                  ? arguments[0]
                  : l.scrollX || l.pageXOffset,
                void 0 !== arguments[0].top
                  ? arguments[0].top
                  : void 0 !== arguments[1]
                  ? arguments[1]
                  : l.scrollY || l.pageYOffset
              ));
      }),
        (l.scrollBy = function () {
          void 0 !== arguments[0] &&
            (i(arguments[0])
              ? u.scrollBy.call(
                  l,
                  void 0 !== arguments[0].left
                    ? arguments[0].left
                    : "object" != typeof arguments[0]
                    ? arguments[0]
                    : 0,
                  void 0 !== arguments[0].top
                    ? arguments[0].top
                    : void 0 !== arguments[1]
                    ? arguments[1]
                    : 0
                )
              : p.call(
                  l,
                  e.body,
                  ~~arguments[0].left + (l.scrollX || l.pageXOffset),
                  ~~arguments[0].top + (l.scrollY || l.pageYOffset)
                ));
        }),
        (d.prototype.scroll = d.prototype.scrollTo = function () {
          if (void 0 !== arguments[0])
            if (!0 !== i(arguments[0])) {
              var o = arguments[0].left,
                t = arguments[0].top;
              p.call(
                this,
                this,
                void 0 === o ? this.scrollLeft : ~~o,
                void 0 === t ? this.scrollTop : ~~t
              );
            } else {
              if ("number" == typeof arguments[0] && void 0 === arguments[1])
                throw new SyntaxError("Value couldn't be converted");
              u.elementScroll.call(
                this,
                void 0 !== arguments[0].left
                  ? ~~arguments[0].left
                  : "object" != typeof arguments[0]
                  ? ~~arguments[0]
                  : this.scrollLeft,
                void 0 !== arguments[0].top
                  ? ~~arguments[0].top
                  : void 0 !== arguments[1]
                  ? ~~arguments[1]
                  : this.scrollTop
              );
            }
        }),
        (d.prototype.scrollBy = function () {
          void 0 !== arguments[0] &&
            (!0 !== i(arguments[0])
              ? this.scroll({
                  left: ~~arguments[0].left + this.scrollLeft,
                  top: ~~arguments[0].top + this.scrollTop,
                  behavior: arguments[0].behavior,
                })
              : u.elementScroll.call(
                  this,
                  void 0 !== arguments[0].left
                    ? ~~arguments[0].left + this.scrollLeft
                    : ~~arguments[0] + this.scrollLeft,
                  void 0 !== arguments[0].top
                    ? ~~arguments[0].top + this.scrollTop
                    : ~~arguments[1] + this.scrollTop
                ));
        }),
        (d.prototype.scrollIntoView = function () {
          if (!0 !== i(arguments[0])) {
            var o = f(this),
              t = o.getBoundingClientRect(),
              r = this.getBoundingClientRect();
            o !== e.body
              ? (p.call(
                  this,
                  o,
                  o.scrollLeft + r.left - t.left,
                  o.scrollTop + r.top - t.top
                ),
                "fixed" !== l.getComputedStyle(o).position &&
                  l.scrollBy({ left: t.left, top: t.top, behavior: "smooth" }))
              : l.scrollBy({ left: r.left, top: r.top, behavior: "smooth" });
          } else
            u.scrollIntoView.call(
              this,
              void 0 === arguments[0] || arguments[0]
            );
        });
    }
  }
  var l = window,
    e = document;
  "object" == typeof exports ? (module.exports = { polyfill: t }) : t();
})();
