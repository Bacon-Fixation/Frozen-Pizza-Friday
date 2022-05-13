module.exports = (function (modules) {
  var installedModules = {};
  function __webpack_require__(moduleId) {
    if (installedModules[moduleId]) return installedModules[moduleId].exports;
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: !1,
      exports: {},
    });
    return (
      modules[moduleId].call(
        module.exports,
        module,
        module.exports,
        __webpack_require__
      ),
      (module.l = !0),
      module.exports
    );
  }
  return (
    (__webpack_require__.m = modules),
    (__webpack_require__.c = installedModules),
    (__webpack_require__.d = function (exports, name, getter) {
      __webpack_require__.o(exports, name) ||
        Object.defineProperty(exports, name, { enumerable: !0, get: getter });
    }),
    (__webpack_require__.r = function (exports) {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(exports, "__esModule", { value: !0 });
    }),
    (__webpack_require__.t = function (value, mode) {
      if ((1 & mode && (value = __webpack_require__(value)), 8 & mode))
        return value;
      if (4 & mode && "object" == typeof value && value && value.__esModule)
        return value;
      var ns = Object.create(null);
      if (
        (__webpack_require__.r(ns),
        Object.defineProperty(ns, "default", { enumerable: !0, value: value }),
        2 & mode && "string" != typeof value)
      )
        for (var key in value)
          __webpack_require__.d(
            ns,
            key,
            function (key) {
              return value[key];
            }.bind(null, key)
          );
      return ns;
    }),
    (__webpack_require__.n = function (module) {
      var getter =
        module && module.__esModule
          ? function () {
              return module.default;
            }
          : function () {
              return module;
            };
      return __webpack_require__.d(getter, "a", getter), getter;
    }),
    (__webpack_require__.o = function (object, property) {
      return Object.prototype.hasOwnProperty.call(object, property);
    }),
    (__webpack_require__.p = ""),
    __webpack_require__((__webpack_require__.s = 138))
  );
})([
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.requireNickname =
        exports.requireParameter =
        exports.getParameter =
        exports.IRCMessage =
          void 0);
    const missing_data_error_1 = __webpack_require__(40);
    (exports.IRCMessage = class {
      constructor(messageData) {
        (this.rawSource = messageData.rawSource),
          (this.ircPrefixRaw = messageData.ircPrefixRaw),
          (this.ircPrefix = messageData.ircPrefix),
          (this.ircCommand = messageData.ircCommand),
          (this.ircParameters = messageData.ircParameters),
          (this.ircTags = messageData.ircTags);
      }
    }),
      (exports.getParameter = function (message, idx) {
        return message.ircParameters[idx];
      }),
      (exports.requireParameter = function (message, idx) {
        if (message.ircParameters.length <= idx)
          throw new missing_data_error_1.MissingDataError(
            `Parameter at index ${idx} missing`
          );
        return message.ircParameters[idx];
      }),
      (exports.requireNickname = function (message) {
        if (null == message.ircPrefix || null == message.ircPrefix.nickname)
          throw new missing_data_error_1.MissingDataError(
            "Missing prefix or missing nickname in prefix"
          );
        return message.ircPrefix.nickname;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ClientError =
        exports.ProtocolError =
        exports.ConnectionError =
        exports.MessageError =
          void 0);
    const base_error_1 = __webpack_require__(25);
    class MessageError extends base_error_1.BaseError {}
    exports.MessageError = MessageError;
    class ConnectionError extends base_error_1.BaseError {}
    exports.ConnectionError = ConnectionError;
    exports.ProtocolError = class extends ConnectionError {};
    exports.ClientError = class extends ConnectionError {};
  },
  function (module, exports, __webpack_require__) {
    try {
      var util = __webpack_require__(4);
      if ("function" != typeof util.inherits) throw "";
      module.exports = util.inherits;
    } catch (e) {
      module.exports = __webpack_require__(156);
    }
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.awaitResponse =
        exports.ResponseAwaiter =
        exports.alwaysTrue =
        exports.alwaysFalse =
          void 0);
    const errors_1 = __webpack_require__(1),
      set_defaults_1 = __webpack_require__(26),
      timeout_error_1 = __webpack_require__(56);
    exports.alwaysFalse = () => !1;
    exports.alwaysTrue = () => !0;
    const configDefaults = {
      success: exports.alwaysFalse,
      failure: exports.alwaysFalse,
      timeout: 2e3,
      noResponseAction: "failure",
    };
    class ResponseAwaiter {
      constructor(conn, config) {
        (this.unsubscribers = []),
          (this.conn = conn),
          (this.config = set_defaults_1.setDefaults(config, configDefaults)),
          (this.promise = new Promise((resolve, reject) => {
            (this.resolvePromise = resolve), (this.rejectPromise = reject);
          })),
          this.subscribeTo("close", this.onConnectionClosed),
          this.joinPendingResponsesQueue();
      }
      movedToQueueHead() {
        if (this.conn.connected || this.conn.ready) this.beginTimeout();
        else {
          const listener = this.beginTimeout.bind(this);
          this.conn.once("connect", listener),
            this.unsubscribers.push(() =>
              this.conn.removeListener("connect", listener)
            );
        }
      }
      outpaced() {
        this.onNoResponse(
          "A response to a command issued later than this command was received"
        );
      }
      unsubscribe() {
        this.unsubscribers.forEach((fn) => fn());
      }
      resolve(msg) {
        this.unsubscribe(), this.resolvePromise(msg);
      }
      reject(cause) {
        this.unsubscribe();
        const errorWithCause = this.config.errorType(
          this.config.errorMessage,
          cause
        );
        process.nextTick(() => this.conn.emitError(errorWithCause, !0)),
          this.rejectPromise(errorWithCause);
      }
      onNoResponse(reason) {
        "failure" === this.config.noResponseAction
          ? this.reject(new timeout_error_1.TimeoutError(reason))
          : "success" === this.config.noResponseAction && this.resolve(void 0);
      }
      beginTimeout() {
        const registeredTimeout = setTimeout(() => {
          const reason = `Timed out after waiting for response for ${this.config.timeout} milliseconds`;
          this.onNoResponse(reason);
        }, this.config.timeout);
        this.unsubscribers.push(() => {
          clearTimeout(registeredTimeout);
        });
      }
      joinPendingResponsesQueue() {
        0 === this.conn.pendingResponses.push(this) - 1 &&
          this.movedToQueueHead(),
          this.unsubscribers.push(() => {
            const selfPosition = this.conn.pendingResponses.indexOf(this);
            if (selfPosition < 0) return;
            const removedAwaiters = this.conn.pendingResponses.splice(
              0,
              selfPosition + 1
            );
            removedAwaiters.pop(),
              removedAwaiters.forEach((awaiter) => awaiter.outpaced());
            const newQueueHead = this.conn.pendingResponses[0];
            null != newQueueHead && newQueueHead.movedToQueueHead();
          });
      }
      onConnectionClosed(cause) {
        null != cause
          ? this.reject(
              new errors_1.ConnectionError(
                "Connection closed due to error",
                cause
              )
            )
          : this.reject(
              new errors_1.ConnectionError("Connection closed with no error")
            );
      }
      onConnectionMessage(msg) {
        return this.config.failure(msg)
          ? (this.reject(
              new errors_1.MessageError(
                `Bad response message: ${msg.rawSource}`
              )
            ),
            !0)
          : !!this.config.success(msg) && (this.resolve(msg), !0);
      }
      subscribeTo(eventName, handler) {
        (handler = handler.bind(this)),
          this.conn.on(eventName, handler),
          this.unsubscribers.push(() =>
            this.conn.removeListener(eventName, handler)
          );
      }
    }
    (exports.ResponseAwaiter = ResponseAwaiter),
      (exports.awaitResponse = function (conn, config) {
        return new ResponseAwaiter(conn, config).promise;
      });
  },
  function (module, exports) {
    module.exports = require("util");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ChannelIRCMessage = exports.getIRCChannelName = void 0);
    const parse_error_1 = __webpack_require__(8),
      irc_message_1 = __webpack_require__(0);
    function getIRCChannelName(message, optional = !1) {
      const parameter = irc_message_1.requireParameter(message, 0);
      if (!optional || "*" !== parameter) {
        if (!parameter.startsWith("#") || parameter.length < 2)
          throw new parse_error_1.ParseError(
            `Received malformed IRC channel name "${parameter}"`
          );
        return parameter.slice(1);
      }
    }
    exports.getIRCChannelName = getIRCChannelName;
    class ChannelIRCMessage extends irc_message_1.IRCMessage {
      constructor(message) {
        super(message), (this.channelName = getIRCChannelName(this));
      }
    }
    exports.ChannelIRCMessage = ChannelIRCMessage;
  },
  function (module, exports) {
    module.exports = require("stream");
  },
  function (module, exports) {
    module.exports = require("buffer");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ParseError = void 0);
    const base_error_1 = __webpack_require__(25);
    class ParseError extends base_error_1.BaseError {}
    exports.ParseError = ParseError;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.tagParserFor =
        exports.convertToFlags =
        exports.convertToEmoteSets =
        exports.convertToEmotes =
        exports.convertToBadges =
        exports.convertToTimestamp =
        exports.convertToColor =
        exports.convertToBoolean =
        exports.convertToInt =
        exports.convertToString =
        exports.getData =
        exports.requireData =
          void 0);
    const badges_1 = __webpack_require__(85),
      color_1 = __webpack_require__(88),
      emote_sets_1 = __webpack_require__(89),
      emotes_1 = __webpack_require__(90),
      flags_1 = __webpack_require__(199),
      missing_tag_error_1 = __webpack_require__(93),
      parse_error_1 = __webpack_require__(8);
    function requireData(ircTags, key, converter, ...converterArgs) {
      const stringValue = ircTags[key];
      if (null == stringValue)
        throw new missing_tag_error_1.MissingTagError(key, stringValue);
      const value = converter(stringValue, ...converterArgs);
      if (null == value)
        throw new missing_tag_error_1.MissingTagError(key, stringValue);
      return value;
    }
    function getData(ircTags, key, converter, ...converterArgs) {
      const stringValue = ircTags[key];
      if (null != stringValue) return converter(stringValue, ...converterArgs);
    }
    function convertToString(value) {
      return value;
    }
    function convertToInt(value) {
      const parsedInt = parseInt(value);
      if (isNaN(parsedInt))
        throw new parse_error_1.ParseError(
          `Failed to parse integer from tag value "${value}"`
        );
      return parsedInt;
    }
    function convertToBoolean(value) {
      return Boolean(convertToInt(value));
    }
    function convertToColor(value) {
      if (!(value.length <= 0)) return color_1.parseColor(value);
    }
    function convertToTimestamp(value) {
      return new Date(convertToInt(value));
    }
    function convertToBadges(value) {
      return badges_1.parseBadges(value);
    }
    function convertToEmotes(value, messageText) {
      return emotes_1.parseEmotes(messageText, value);
    }
    function convertToEmoteSets(value) {
      return emote_sets_1.parseEmoteSets(value);
    }
    function convertToFlags(value, messageText) {
      return flags_1.parseFlags(messageText, value);
    }
    (exports.requireData = requireData),
      (exports.getData = getData),
      (exports.convertToString = convertToString),
      (exports.convertToInt = convertToInt),
      (exports.convertToBoolean = convertToBoolean),
      (exports.convertToColor = convertToColor),
      (exports.convertToTimestamp = convertToTimestamp),
      (exports.convertToBadges = convertToBadges),
      (exports.convertToEmotes = convertToEmotes),
      (exports.convertToEmoteSets = convertToEmoteSets),
      (exports.convertToFlags = convertToFlags),
      (exports.tagParserFor = function (ircTags) {
        return {
          getString: (key) => getData(ircTags, key, convertToString),
          requireString: (key) => requireData(ircTags, key, convertToString),
          getInt: (key) => getData(ircTags, key, convertToInt),
          requireInt: (key) => requireData(ircTags, key, convertToInt),
          getBoolean: (key) => getData(ircTags, key, convertToBoolean),
          requireBoolean: (key) => requireData(ircTags, key, convertToBoolean),
          getColor: (key) => getData(ircTags, key, convertToColor),
          requireColor: (key) => requireData(ircTags, key, convertToColor),
          getTimestamp: (key) => getData(ircTags, key, convertToTimestamp),
          requireTimestamp: (key) =>
            requireData(ircTags, key, convertToTimestamp),
          getBadges: (key) => getData(ircTags, key, convertToBadges),
          requireBadges: (key) => requireData(ircTags, key, convertToBadges),
          getEmotes: (key, messageText) =>
            getData(ircTags, key, convertToEmotes, messageText),
          requireEmotes: (key, messageText) =>
            requireData(ircTags, key, convertToEmotes, messageText),
          getEmoteSets: (key) => getData(ircTags, key, convertToEmoteSets),
          requireEmoteSets: (key) =>
            requireData(ircTags, key, convertToEmoteSets),
          getFlags: (key, messageText) =>
            getData(ircTags, key, convertToFlags, messageText),
        };
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.NoticeMessage = void 0);
    const channel_irc_message_1 = __webpack_require__(5),
      irc_message_1 = __webpack_require__(0),
      tag_values_1 = __webpack_require__(9);
    class NoticeMessage extends irc_message_1.IRCMessage {
      constructor(message) {
        super(message),
          (this.channelName = channel_irc_message_1.getIRCChannelName(
            this,
            !0
          ));
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.messageText = irc_message_1.requireParameter(this, 1)),
          (this.messageID = tagParser.getString("msg-id"));
      }
    }
    exports.NoticeMessage = NoticeMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const codes = {};
    function createErrorType(code, message, Base) {
      Base || (Base = Error);
      class NodeError extends Base {
        constructor(arg1, arg2, arg3) {
          super(
            (function (arg1, arg2, arg3) {
              return "string" == typeof message
                ? message
                : message(arg1, arg2, arg3);
            })(arg1, arg2, arg3)
          );
        }
      }
      (NodeError.prototype.name = Base.name),
        (NodeError.prototype.code = code),
        (codes[code] = NodeError);
    }
    function oneOf(expected, thing) {
      if (Array.isArray(expected)) {
        const len = expected.length;
        return (
          (expected = expected.map((i) => String(i))),
          len > 2
            ? `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` +
              expected[len - 1]
            : 2 === len
            ? `one of ${thing} ${expected[0]} or ${expected[1]}`
            : `of ${thing} ${expected[0]}`
        );
      }
      return `of ${thing} ${String(expected)}`;
    }
    createErrorType(
      "ERR_INVALID_OPT_VALUE",
      function (name, value) {
        return 'The value "' + value + '" is invalid for option "' + name + '"';
      },
      TypeError
    ),
      createErrorType(
        "ERR_INVALID_ARG_TYPE",
        function (name, expected, actual) {
          let determiner;
          var search, pos;
          let msg;
          if (
            ("string" == typeof expected &&
            ((search = "not "),
            expected.substr(!pos || pos < 0 ? 0 : +pos, search.length) ===
              search)
              ? ((determiner = "must not be"),
                (expected = expected.replace(/^not /, "")))
              : (determiner = "must be"),
            (function (str, search, this_len) {
              return (
                (void 0 === this_len || this_len > str.length) &&
                  (this_len = str.length),
                str.substring(this_len - search.length, this_len) === search
              );
            })(name, " argument"))
          )
            msg = `The ${name} ${determiner} ${oneOf(expected, "type")}`;
          else {
            msg = `The "${name}" ${
              (function (str, search, start) {
                return (
                  "number" != typeof start && (start = 0),
                  !(start + search.length > str.length) &&
                    -1 !== str.indexOf(search, start)
                );
              })(name, ".")
                ? "property"
                : "argument"
            } ${determiner} ${oneOf(expected, "type")}`;
          }
          return (msg += ". Received type " + typeof actual), msg;
        },
        TypeError
      ),
      createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"),
      createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function (name) {
        return "The " + name + " method is not implemented";
      }),
      createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close"),
      createErrorType("ERR_STREAM_DESTROYED", function (name) {
        return "Cannot call " + name + " after a stream was destroyed";
      }),
      createErrorType(
        "ERR_MULTIPLE_CALLBACK",
        "Callback called multiple times"
      ),
      createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"),
      createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end"),
      createErrorType(
        "ERR_STREAM_NULL_VALUES",
        "May not write null values to stream",
        TypeError
      ),
      createErrorType(
        "ERR_UNKNOWN_ENCODING",
        function (arg) {
          return "Unknown encoding: " + arg;
        },
        TypeError
      ),
      createErrorType(
        "ERR_STREAM_UNSHIFT_AFTER_END_EVENT",
        "stream.unshift() after end event"
      ),
      (module.exports.codes = codes);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const codes = {};
    function createErrorType(code, message, Base) {
      Base || (Base = Error);
      class NodeError extends Base {
        constructor(arg1, arg2, arg3) {
          super(
            (function (arg1, arg2, arg3) {
              return "string" == typeof message
                ? message
                : message(arg1, arg2, arg3);
            })(arg1, arg2, arg3)
          );
        }
      }
      (NodeError.prototype.name = Base.name),
        (NodeError.prototype.code = code),
        (codes[code] = NodeError);
    }
    function oneOf(expected, thing) {
      if (Array.isArray(expected)) {
        const len = expected.length;
        return (
          (expected = expected.map((i) => String(i))),
          len > 2
            ? `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` +
              expected[len - 1]
            : 2 === len
            ? `one of ${thing} ${expected[0]} or ${expected[1]}`
            : `of ${thing} ${expected[0]}`
        );
      }
      return `of ${thing} ${String(expected)}`;
    }
    createErrorType(
      "ERR_INVALID_OPT_VALUE",
      function (name, value) {
        return 'The value "' + value + '" is invalid for option "' + name + '"';
      },
      TypeError
    ),
      createErrorType(
        "ERR_INVALID_ARG_TYPE",
        function (name, expected, actual) {
          let determiner;
          var search, pos;
          let msg;
          if (
            ("string" == typeof expected &&
            ((search = "not "),
            expected.substr(!pos || pos < 0 ? 0 : +pos, search.length) ===
              search)
              ? ((determiner = "must not be"),
                (expected = expected.replace(/^not /, "")))
              : (determiner = "must be"),
            (function (str, search, this_len) {
              return (
                (void 0 === this_len || this_len > str.length) &&
                  (this_len = str.length),
                str.substring(this_len - search.length, this_len) === search
              );
            })(name, " argument"))
          )
            msg = `The ${name} ${determiner} ${oneOf(expected, "type")}`;
          else {
            msg = `The "${name}" ${
              (function (str, search, start) {
                return (
                  "number" != typeof start && (start = 0),
                  !(start + search.length > str.length) &&
                    -1 !== str.indexOf(search, start)
                );
              })(name, ".")
                ? "property"
                : "argument"
            } ${determiner} ${oneOf(expected, "type")}`;
          }
          return (msg += ". Received type " + typeof actual), msg;
        },
        TypeError
      ),
      createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"),
      createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function (name) {
        return "The " + name + " method is not implemented";
      }),
      createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close"),
      createErrorType("ERR_STREAM_DESTROYED", function (name) {
        return "Cannot call " + name + " after a stream was destroyed";
      }),
      createErrorType(
        "ERR_MULTIPLE_CALLBACK",
        "Callback called multiple times"
      ),
      createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"),
      createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end"),
      createErrorType(
        "ERR_STREAM_NULL_VALUES",
        "May not write null values to stream",
        TypeError
      ),
      createErrorType(
        "ERR_UNKNOWN_ENCODING",
        function (arg) {
          return "Unknown encoding: " + arg;
        },
        TypeError
      ),
      createErrorType(
        "ERR_STREAM_UNSHIFT_AFTER_END_EVENT",
        "stream.unshift() after end event"
      ),
      (module.exports.codes = codes);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.sendPrivmsg = void 0),
      (exports.sendPrivmsg = async function (conn, channelName, message) {
        conn.sendRaw(`PRIVMSG #${channelName} :${message}`);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const codes = {};
    function createErrorType(code, message, Base) {
      Base || (Base = Error);
      class NodeError extends Base {
        constructor(arg1, arg2, arg3) {
          super(
            (function (arg1, arg2, arg3) {
              return "string" == typeof message
                ? message
                : message(arg1, arg2, arg3);
            })(arg1, arg2, arg3)
          );
        }
      }
      (NodeError.prototype.name = Base.name),
        (NodeError.prototype.code = code),
        (codes[code] = NodeError);
    }
    function oneOf(expected, thing) {
      if (Array.isArray(expected)) {
        const len = expected.length;
        return (
          (expected = expected.map((i) => String(i))),
          len > 2
            ? `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` +
              expected[len - 1]
            : 2 === len
            ? `one of ${thing} ${expected[0]} or ${expected[1]}`
            : `of ${thing} ${expected[0]}`
        );
      }
      return `of ${thing} ${String(expected)}`;
    }
    createErrorType(
      "ERR_INVALID_OPT_VALUE",
      function (name, value) {
        return 'The value "' + value + '" is invalid for option "' + name + '"';
      },
      TypeError
    ),
      createErrorType(
        "ERR_INVALID_ARG_TYPE",
        function (name, expected, actual) {
          let determiner;
          var search, pos;
          let msg;
          if (
            ("string" == typeof expected &&
            ((search = "not "),
            expected.substr(!pos || pos < 0 ? 0 : +pos, search.length) ===
              search)
              ? ((determiner = "must not be"),
                (expected = expected.replace(/^not /, "")))
              : (determiner = "must be"),
            (function (str, search, this_len) {
              return (
                (void 0 === this_len || this_len > str.length) &&
                  (this_len = str.length),
                str.substring(this_len - search.length, this_len) === search
              );
            })(name, " argument"))
          )
            msg = `The ${name} ${determiner} ${oneOf(expected, "type")}`;
          else {
            msg = `The "${name}" ${
              (function (str, search, start) {
                return (
                  "number" != typeof start && (start = 0),
                  !(start + search.length > str.length) &&
                    -1 !== str.indexOf(search, start)
                );
              })(name, ".")
                ? "property"
                : "argument"
            } ${determiner} ${oneOf(expected, "type")}`;
          }
          return (msg += ". Received type " + typeof actual), msg;
        },
        TypeError
      ),
      createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"),
      createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function (name) {
        return "The " + name + " method is not implemented";
      }),
      createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close"),
      createErrorType("ERR_STREAM_DESTROYED", function (name) {
        return "Cannot call " + name + " after a stream was destroyed";
      }),
      createErrorType(
        "ERR_MULTIPLE_CALLBACK",
        "Callback called multiple times"
      ),
      createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"),
      createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end"),
      createErrorType(
        "ERR_STREAM_NULL_VALUES",
        "May not write null values to stream",
        TypeError
      ),
      createErrorType(
        "ERR_UNKNOWN_ENCODING",
        function (arg) {
          return "Unknown encoding: " + arg;
        },
        TypeError
      ),
      createErrorType(
        "ERR_STREAM_UNSHIFT_AFTER_END_EVENT",
        "stream.unshift() after end event"
      ),
      (module.exports.codes = codes);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var objectKeys =
      Object.keys ||
      function (obj) {
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
      };
    module.exports = Duplex;
    var Readable = __webpack_require__(61),
      Writable = __webpack_require__(65);
    __webpack_require__(2)(Duplex, Readable);
    for (
      var keys = objectKeys(Writable.prototype), v = 0;
      v < keys.length;
      v++
    ) {
      var method = keys[v];
      Duplex.prototype[method] ||
        (Duplex.prototype[method] = Writable.prototype[method]);
    }
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options),
        Writable.call(this, options),
        (this.allowHalfOpen = !0),
        options &&
          (!1 === options.readable && (this.readable = !1),
          !1 === options.writable && (this.writable = !1),
          !1 === options.allowHalfOpen &&
            ((this.allowHalfOpen = !1), this.once("end", onend)));
    }
    function onend() {
      this._writableState.ended || process.nextTick(onEndNT, this);
    }
    function onEndNT(self) {
      self.end();
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      enumerable: !1,
      get: function () {
        return this._writableState.highWaterMark;
      },
    }),
      Object.defineProperty(Duplex.prototype, "writableBuffer", {
        enumerable: !1,
        get: function () {
          return this._writableState && this._writableState.getBuffer();
        },
      }),
      Object.defineProperty(Duplex.prototype, "writableLength", {
        enumerable: !1,
        get: function () {
          return this._writableState.length;
        },
      }),
      Object.defineProperty(Duplex.prototype, "destroyed", {
        enumerable: !1,
        get: function () {
          return (
            void 0 !== this._readableState &&
            void 0 !== this._writableState &&
            this._readableState.destroyed &&
            this._writableState.destroyed
          );
        },
        set: function (value) {
          void 0 !== this._readableState &&
            void 0 !== this._writableState &&
            ((this._readableState.destroyed = value),
            (this._writableState.destroyed = value));
        },
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var Buffer = __webpack_require__(157).Buffer,
      isEncoding =
        Buffer.isEncoding ||
        function (encoding) {
          switch ((encoding = "" + encoding) && encoding.toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
            case "raw":
              return !0;
            default:
              return !1;
          }
        };
    function StringDecoder(encoding) {
      var nb;
      switch (
        ((this.encoding = (function (enc) {
          var nenc = (function (enc) {
            if (!enc) return "utf8";
            for (var retried; ; )
              switch (enc) {
                case "utf8":
                case "utf-8":
                  return "utf8";
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return "utf16le";
                case "latin1":
                case "binary":
                  return "latin1";
                case "base64":
                case "ascii":
                case "hex":
                  return enc;
                default:
                  if (retried) return;
                  (enc = ("" + enc).toLowerCase()), (retried = !0);
              }
          })(enc);
          if (
            "string" != typeof nenc &&
            (Buffer.isEncoding === isEncoding || !isEncoding(enc))
          )
            throw new Error("Unknown encoding: " + enc);
          return nenc || enc;
        })(encoding)),
        this.encoding)
      ) {
        case "utf16le":
          (this.text = utf16Text), (this.end = utf16End), (nb = 4);
          break;
        case "utf8":
          (this.fillLast = utf8FillLast), (nb = 4);
          break;
        case "base64":
          (this.text = base64Text), (this.end = base64End), (nb = 3);
          break;
        default:
          return (this.write = simpleWrite), void (this.end = simpleEnd);
      }
      (this.lastNeed = 0),
        (this.lastTotal = 0),
        (this.lastChar = Buffer.allocUnsafe(nb));
    }
    function utf8CheckByte(byte) {
      return byte <= 127
        ? 0
        : byte >> 5 == 6
        ? 2
        : byte >> 4 == 14
        ? 3
        : byte >> 3 == 30
        ? 4
        : byte >> 6 == 2
        ? -1
        : -2;
    }
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed,
        r = (function (self, buf, p) {
          if (128 != (192 & buf[0])) return (self.lastNeed = 0), "�";
          if (self.lastNeed > 1 && buf.length > 1) {
            if (128 != (192 & buf[1])) return (self.lastNeed = 1), "�";
            if (self.lastNeed > 2 && buf.length > 2 && 128 != (192 & buf[2]))
              return (self.lastNeed = 2), "�";
          }
        })(this, buf);
      return void 0 !== r
        ? r
        : this.lastNeed <= buf.length
        ? (buf.copy(this.lastChar, p, 0, this.lastNeed),
          this.lastChar.toString(this.encoding, 0, this.lastTotal))
        : (buf.copy(this.lastChar, p, 0, buf.length),
          void (this.lastNeed -= buf.length));
    }
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 == 0) {
        var r = buf.toString("utf16le", i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 55296 && c <= 56319)
            return (
              (this.lastNeed = 2),
              (this.lastTotal = 4),
              (this.lastChar[0] = buf[buf.length - 2]),
              (this.lastChar[1] = buf[buf.length - 1]),
              r.slice(0, -1)
            );
        }
        return r;
      }
      return (
        (this.lastNeed = 1),
        (this.lastTotal = 2),
        (this.lastChar[0] = buf[buf.length - 1]),
        buf.toString("utf16le", i, buf.length - 1)
      );
    }
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString("utf16le", 0, end);
      }
      return r;
    }
    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      return 0 === n
        ? buf.toString("base64", i)
        : ((this.lastNeed = 3 - n),
          (this.lastTotal = 3),
          1 === n
            ? (this.lastChar[0] = buf[buf.length - 1])
            : ((this.lastChar[0] = buf[buf.length - 2]),
              (this.lastChar[1] = buf[buf.length - 1])),
          buf.toString("base64", i, buf.length - n));
    }
    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      return this.lastNeed
        ? r + this.lastChar.toString("base64", 0, 3 - this.lastNeed)
        : r;
    }
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : "";
    }
    (exports.StringDecoder = StringDecoder),
      (StringDecoder.prototype.write = function (buf) {
        if (0 === buf.length) return "";
        var r, i;
        if (this.lastNeed) {
          if (void 0 === (r = this.fillLast(buf))) return "";
          (i = this.lastNeed), (this.lastNeed = 0);
        } else i = 0;
        return i < buf.length
          ? r
            ? r + this.text(buf, i)
            : this.text(buf, i)
          : r || "";
      }),
      (StringDecoder.prototype.end = function (buf) {
        var r = buf && buf.length ? this.write(buf) : "";
        return this.lastNeed ? r + "�" : r;
      }),
      (StringDecoder.prototype.text = function (buf, i) {
        var total = (function (self, buf, i) {
          var j = buf.length - 1;
          if (j < i) return 0;
          var nb = utf8CheckByte(buf[j]);
          if (nb >= 0) return nb > 0 && (self.lastNeed = nb - 1), nb;
          if (--j < i || -2 === nb) return 0;
          if ((nb = utf8CheckByte(buf[j])) >= 0)
            return nb > 0 && (self.lastNeed = nb - 2), nb;
          if (--j < i || -2 === nb) return 0;
          if ((nb = utf8CheckByte(buf[j])) >= 0)
            return (
              nb > 0 && (2 === nb ? (nb = 0) : (self.lastNeed = nb - 3)), nb
            );
          return 0;
        })(this, buf, i);
        if (!this.lastNeed) return buf.toString("utf8", i);
        this.lastTotal = total;
        var end = buf.length - (total - this.lastNeed);
        return buf.copy(this.lastChar, 0, end), buf.toString("utf8", i, end);
      }),
      (StringDecoder.prototype.fillLast = function (buf) {
        if (this.lastNeed <= buf.length)
          return (
            buf.copy(
              this.lastChar,
              this.lastTotal - this.lastNeed,
              0,
              this.lastNeed
            ),
            this.lastChar.toString(this.encoding, 0, this.lastTotal)
          );
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length),
          (this.lastNeed -= buf.length);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var objectKeys =
      Object.keys ||
      function (obj) {
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
      };
    module.exports = Duplex;
    var Readable = __webpack_require__(68),
      Writable = __webpack_require__(72);
    __webpack_require__(2)(Duplex, Readable);
    for (
      var keys = objectKeys(Writable.prototype), v = 0;
      v < keys.length;
      v++
    ) {
      var method = keys[v];
      Duplex.prototype[method] ||
        (Duplex.prototype[method] = Writable.prototype[method]);
    }
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options),
        Writable.call(this, options),
        (this.allowHalfOpen = !0),
        options &&
          (!1 === options.readable && (this.readable = !1),
          !1 === options.writable && (this.writable = !1),
          !1 === options.allowHalfOpen &&
            ((this.allowHalfOpen = !1), this.once("end", onend)));
    }
    function onend() {
      this._writableState.ended || process.nextTick(onEndNT, this);
    }
    function onEndNT(self) {
      self.end();
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      enumerable: !1,
      get: function () {
        return this._writableState.highWaterMark;
      },
    }),
      Object.defineProperty(Duplex.prototype, "writableBuffer", {
        enumerable: !1,
        get: function () {
          return this._writableState && this._writableState.getBuffer();
        },
      }),
      Object.defineProperty(Duplex.prototype, "writableLength", {
        enumerable: !1,
        get: function () {
          return this._writableState.length;
        },
      }),
      Object.defineProperty(Duplex.prototype, "destroyed", {
        enumerable: !1,
        get: function () {
          return (
            void 0 !== this._readableState &&
            void 0 !== this._writableState &&
            this._readableState.destroyed &&
            this._writableState.destroyed
          );
        },
        set: function (value) {
          void 0 !== this._readableState &&
            void 0 !== this._writableState &&
            ((this._readableState.destroyed = value),
            (this._writableState.destroyed = value));
        },
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    module.exports = {
      BINARY_TYPES: ["nodebuffer", "arraybuffer", "fragments"],
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      EMPTY_BUFFER: Buffer.alloc(0),
      NOOP: () => {},
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function applyReplacement(self, target, key, newFn) {
      const oldFn = Reflect.get(target, key);
      Object.defineProperty(target, key, {
        value: function (...args) {
          return newFn.call(self, oldFn.bind(this), ...args);
        },
        writable: !0,
        enumerable: !1,
        configurable: !0,
      });
    }
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.applyReplacements = exports.applyReplacement = void 0),
      (exports.applyReplacement = applyReplacement),
      (exports.applyReplacements = function (self, target, replacements) {
        for (const [key, newFn] of Object.entries(replacements))
          applyReplacement(self, target, key, newFn);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var objectKeys =
      Object.keys ||
      function (obj) {
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
      };
    module.exports = Duplex;
    var Readable = __webpack_require__(112),
      Writable = __webpack_require__(116);
    __webpack_require__(2)(Duplex, Readable);
    for (
      var keys = objectKeys(Writable.prototype), v = 0;
      v < keys.length;
      v++
    ) {
      var method = keys[v];
      Duplex.prototype[method] ||
        (Duplex.prototype[method] = Writable.prototype[method]);
    }
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options),
        Writable.call(this, options),
        (this.allowHalfOpen = !0),
        options &&
          (!1 === options.readable && (this.readable = !1),
          !1 === options.writable && (this.writable = !1),
          !1 === options.allowHalfOpen &&
            ((this.allowHalfOpen = !1), this.once("end", onend)));
    }
    function onend() {
      this._writableState.ended || process.nextTick(onEndNT, this);
    }
    function onEndNT(self) {
      self.end();
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      enumerable: !1,
      get: function () {
        return this._writableState.highWaterMark;
      },
    }),
      Object.defineProperty(Duplex.prototype, "writableBuffer", {
        enumerable: !1,
        get: function () {
          return this._writableState && this._writableState.getBuffer();
        },
      }),
      Object.defineProperty(Duplex.prototype, "writableLength", {
        enumerable: !1,
        get: function () {
          return this._writableState.length;
        },
      }),
      Object.defineProperty(Duplex.prototype, "destroyed", {
        enumerable: !1,
        get: function () {
          return (
            void 0 !== this._readableState &&
            void 0 !== this._writableState &&
            this._readableState.destroyed &&
            this._writableState.destroyed
          );
        },
        set: function (value) {
          void 0 !== this._readableState &&
            void 0 !== this._writableState &&
            ((this._readableState.destroyed = value),
            (this._writableState.destroyed = value));
        },
      });
  },
  function (module, exports) {
    module.exports = require("net");
  },
  function (module, exports) {
    module.exports = require("events");
  },
  function (module, exports) {
    module.exports = require("crypto");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.correctChannelName = exports.validateChannelName = void 0);
    const reason_for_value_1 = __webpack_require__(30),
      validation_error_1 = __webpack_require__(51),
      channelNameRegex = /^[a-z0-9_]{1,25}$/;
    (exports.validateChannelName = function (input) {
      if (null == input || !channelNameRegex.test(input))
        throw new validation_error_1.ValidationError(
          `Channel name ${reason_for_value_1.reasonForValue(
            input
          )} is invalid/malformed`
        );
    }),
      (exports.correctChannelName = function (input) {
        return input.replace(/^#/, "");
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.BaseError = void 0);
    const makeErrorCause = __webpack_require__(55);
    class BaseError extends makeErrorCause.BaseError {
      constructor(message, cause) {
        let newMessage;
        (newMessage =
          null != message &&
          null != cause &&
          null != cause.message &&
          cause.message.length > 0
            ? `${message}: ${cause.message}`
            : null != message
            ? message
            : null != cause && null != cause.message
            ? cause.message
            : ""),
          super(newMessage, cause);
      }
    }
    exports.BaseError = BaseError;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.setDefaults = void 0),
      (exports.setDefaults = function (input, defaults) {
        return Object.assign({}, defaults, input);
      });
  },
  function (module, exports) {
    module.exports = require("tls");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const zlib = __webpack_require__(184),
      bufferUtil = __webpack_require__(29),
      Limiter = __webpack_require__(185),
      { kStatusCode: kStatusCode, NOOP: NOOP } = __webpack_require__(18),
      TRAILER = Buffer.from([0, 0, 255, 255]),
      kPerMessageDeflate = Symbol("permessage-deflate"),
      kTotalLength = Symbol("total-length"),
      kCallback = Symbol("callback"),
      kBuffers = Symbol("buffers"),
      kError = Symbol("error");
    let zlibLimiter;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk), (this[kTotalLength] += chunk.length);
    }
    function inflateOnData(chunk) {
      (this[kTotalLength] += chunk.length),
        this[kPerMessageDeflate]._maxPayload < 1 ||
        this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload
          ? this[kBuffers].push(chunk)
          : ((this[kError] = new RangeError("Max payload size exceeded")),
            (this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"),
            (this[kError][kStatusCode] = 1009),
            this.removeListener("data", inflateOnData),
            this.reset());
    }
    function inflateOnError(err) {
      (this[kPerMessageDeflate]._inflate = null),
        (err[kStatusCode] = 1007),
        this[kCallback](err);
    }
    module.exports = class {
      constructor(options, isServer, maxPayload) {
        if (
          ((this._maxPayload = 0 | maxPayload),
          (this._options = options || {}),
          (this._threshold =
            void 0 !== this._options.threshold
              ? this._options.threshold
              : 1024),
          (this._isServer = !!isServer),
          (this._deflate = null),
          (this._inflate = null),
          (this.params = null),
          !zlibLimiter)
        ) {
          const concurrency =
            void 0 !== this._options.concurrencyLimit
              ? this._options.concurrencyLimit
              : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      static get extensionName() {
        return "permessage-deflate";
      }
      offer() {
        const params = {};
        return (
          this._options.serverNoContextTakeover &&
            (params.server_no_context_takeover = !0),
          this._options.clientNoContextTakeover &&
            (params.client_no_context_takeover = !0),
          this._options.serverMaxWindowBits &&
            (params.server_max_window_bits = this._options.serverMaxWindowBits),
          this._options.clientMaxWindowBits
            ? (params.client_max_window_bits =
                this._options.clientMaxWindowBits)
            : null == this._options.clientMaxWindowBits &&
              (params.client_max_window_bits = !0),
          params
        );
      }
      accept(configurations) {
        return (
          (configurations = this.normalizeParams(configurations)),
          (this.params = this._isServer
            ? this.acceptAsServer(configurations)
            : this.acceptAsClient(configurations)),
          this.params
        );
      }
      cleanup() {
        if (
          (this._inflate && (this._inflate.close(), (this._inflate = null)),
          this._deflate)
        ) {
          const callback = this._deflate[kCallback];
          this._deflate.close(),
            (this._deflate = null),
            callback &&
              callback(
                new Error(
                  "The deflate stream was closed while data was being processed"
                )
              );
        }
      }
      acceptAsServer(offers) {
        const opts = this._options,
          accepted = offers.find(
            (params) =>
              !(
                (!1 === opts.serverNoContextTakeover &&
                  params.server_no_context_takeover) ||
                (params.server_max_window_bits &&
                  (!1 === opts.serverMaxWindowBits ||
                    ("number" == typeof opts.serverMaxWindowBits &&
                      opts.serverMaxWindowBits >
                        params.server_max_window_bits))) ||
                ("number" == typeof opts.clientMaxWindowBits &&
                  !params.client_max_window_bits)
              )
          );
        if (!accepted)
          throw new Error("None of the extension offers can be accepted");
        return (
          opts.serverNoContextTakeover &&
            (accepted.server_no_context_takeover = !0),
          opts.clientNoContextTakeover &&
            (accepted.client_no_context_takeover = !0),
          "number" == typeof opts.serverMaxWindowBits &&
            (accepted.server_max_window_bits = opts.serverMaxWindowBits),
          "number" == typeof opts.clientMaxWindowBits
            ? (accepted.client_max_window_bits = opts.clientMaxWindowBits)
            : (!0 !== accepted.client_max_window_bits &&
                !1 !== opts.clientMaxWindowBits) ||
              delete accepted.client_max_window_bits,
          accepted
        );
      }
      acceptAsClient(response) {
        const params = response[0];
        if (
          !1 === this._options.clientNoContextTakeover &&
          params.client_no_context_takeover
        )
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        if (params.client_max_window_bits) {
          if (
            !1 === this._options.clientMaxWindowBits ||
            ("number" == typeof this._options.clientMaxWindowBits &&
              params.client_max_window_bits > this._options.clientMaxWindowBits)
          )
            throw new Error(
              'Unexpected or invalid parameter "client_max_window_bits"'
            );
        } else
          "number" == typeof this._options.clientMaxWindowBits &&
            (params.client_max_window_bits = this._options.clientMaxWindowBits);
        return params;
      }
      normalizeParams(configurations) {
        return (
          configurations.forEach((params) => {
            Object.keys(params).forEach((key) => {
              let value = params[key];
              if (value.length > 1)
                throw new Error(
                  `Parameter "${key}" must have only a single value`
                );
              if (((value = value[0]), "client_max_window_bits" === key)) {
                if (!0 !== value) {
                  const num = +value;
                  if (!Number.isInteger(num) || num < 8 || num > 15)
                    throw new TypeError(
                      `Invalid value for parameter "${key}": ${value}`
                    );
                  value = num;
                } else if (!this._isServer)
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
              } else if ("server_max_window_bits" === key) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15)
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                value = num;
              } else {
                if (
                  "client_no_context_takeover" !== key &&
                  "server_no_context_takeover" !== key
                )
                  throw new Error(`Unknown parameter "${key}"`);
                if (!0 !== value)
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
              }
              params[key] = value;
            });
          }),
          configurations
        );
      }
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done(), callback(err, result);
          });
        });
      }
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done(), callback(err, result);
          });
        });
      }
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`,
            windowBits =
              "number" != typeof this.params[key]
                ? zlib.Z_DEFAULT_WINDOWBITS
                : this.params[key];
          (this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits: windowBits,
          })),
            (this._inflate[kPerMessageDeflate] = this),
            (this._inflate[kTotalLength] = 0),
            (this._inflate[kBuffers] = []),
            this._inflate.on("error", inflateOnError),
            this._inflate.on("data", inflateOnData);
        }
        (this._inflate[kCallback] = callback),
          this._inflate.write(data),
          fin && this._inflate.write(TRAILER),
          this._inflate.flush(() => {
            const err = this._inflate[kError];
            if (err)
              return (
                this._inflate.close(),
                (this._inflate = null),
                void callback(err)
              );
            const data = bufferUtil.concat(
              this._inflate[kBuffers],
              this._inflate[kTotalLength]
            );
            this._inflate._readableState.endEmitted
              ? (this._inflate.close(), (this._inflate = null))
              : ((this._inflate[kTotalLength] = 0),
                (this._inflate[kBuffers] = []),
                fin &&
                  this.params[`${endpoint}_no_context_takeover`] &&
                  this._inflate.reset()),
              callback(null, data);
          });
      }
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`,
            windowBits =
              "number" != typeof this.params[key]
                ? zlib.Z_DEFAULT_WINDOWBITS
                : this.params[key];
          (this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits: windowBits,
          })),
            (this._deflate[kTotalLength] = 0),
            (this._deflate[kBuffers] = []),
            this._deflate.on("error", NOOP),
            this._deflate.on("data", deflateOnData);
        }
        (this._deflate[kCallback] = callback),
          this._deflate.write(data),
          this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
            if (!this._deflate) return;
            let data = bufferUtil.concat(
              this._deflate[kBuffers],
              this._deflate[kTotalLength]
            );
            fin && (data = data.slice(0, data.length - 4)),
              (this._deflate[kCallback] = null),
              (this._deflate[kTotalLength] = 0),
              (this._deflate[kBuffers] = []),
              fin &&
                this.params[`${endpoint}_no_context_takeover`] &&
                this._deflate.reset(),
              callback(null, data);
          });
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const { EMPTY_BUFFER: EMPTY_BUFFER } = __webpack_require__(18);
    function concat(list, totalLength) {
      if (0 === list.length) return EMPTY_BUFFER;
      if (1 === list.length) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset), (offset += buf.length);
      }
      return offset < totalLength ? target.slice(0, offset) : target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++)
        output[offset + i] = source[i] ^ mask[3 & i];
    }
    function _unmask(buffer, mask) {
      const length = buffer.length;
      for (let i = 0; i < length; i++) buffer[i] ^= mask[3 & i];
    }
    function toArrayBuffer(buf) {
      return buf.byteLength === buf.buffer.byteLength
        ? buf.buffer
        : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    function toBuffer(data) {
      if (((toBuffer.readOnly = !0), Buffer.isBuffer(data))) return data;
      let buf;
      return (
        data instanceof ArrayBuffer
          ? (buf = Buffer.from(data))
          : ArrayBuffer.isView(data)
          ? (buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength))
          : ((buf = Buffer.from(data)), (toBuffer.readOnly = !1)),
        buf
      );
    }
    try {
      const bufferUtil = __webpack_require__(
          !(function () {
            var e = new Error("Cannot find module 'bufferutil'");
            throw ((e.code = "MODULE_NOT_FOUND"), e);
          })()
        ),
        bu = bufferUtil.BufferUtil || bufferUtil;
      module.exports = {
        concat: concat,
        mask(source, mask, output, offset, length) {
          length < 48
            ? _mask(source, mask, output, offset, length)
            : bu.mask(source, mask, output, offset, length);
        },
        toArrayBuffer: toArrayBuffer,
        toBuffer: toBuffer,
        unmask(buffer, mask) {
          buffer.length < 32 ? _unmask(buffer, mask) : bu.unmask(buffer, mask);
        },
      };
    } catch (e) {
      module.exports = {
        concat: concat,
        mask: _mask,
        toArrayBuffer: toArrayBuffer,
        toBuffer: toBuffer,
        unmask: _unmask,
      };
    }
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.reasonForValue = void 0),
      (exports.reasonForValue = function (actualValue) {
        return void 0 === actualValue
          ? "undefined"
          : null === actualValue
          ? "null"
          : actualValue.length <= 0
          ? "empty string"
          : `"${actualValue}"`;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.canSpamFast = void 0);
    const userstate_tracker_1 = __webpack_require__(43);
    exports.canSpamFast = function (
      channelName,
      loggedInUsername,
      userStateInput
    ) {
      if (channelName === loggedInUsername)
        return { fastSpam: !0, certain: !0 };
      let userState;
      return (
        (userState =
          userStateInput instanceof userstate_tracker_1.UserStateTracker
            ? userStateInput.getChannelState(channelName)
            : userStateInput),
        null == userState
          ? { fastSpam: !1, certain: !1 }
          : {
              fastSpam:
                userState.isMod ||
                userState.badges.hasVIP ||
                userState.badges.hasModerator ||
                userState.badges.hasBroadcaster,
              certain: !0,
            }
      );
    };
  },
  function (module, exports, __webpack_require__) {
    module.exports = __webpack_require__(4).deprecate;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var ERR_STREAM_PREMATURE_CLOSE =
      __webpack_require__(11).codes.ERR_STREAM_PREMATURE_CLOSE;
    function noop() {}
    module.exports = function eos(stream, opts, callback) {
      if ("function" == typeof opts) return eos(stream, null, opts);
      opts || (opts = {}),
        (callback = (function (callback) {
          var called = !1;
          return function () {
            if (!called) {
              called = !0;
              for (
                var _len = arguments.length, args = new Array(_len), _key = 0;
                _key < _len;
                _key++
              )
                args[_key] = arguments[_key];
              callback.apply(this, args);
            }
          };
        })(callback || noop));
      var readable = opts.readable || (!1 !== opts.readable && stream.readable),
        writable = opts.writable || (!1 !== opts.writable && stream.writable),
        onlegacyfinish = function () {
          stream.writable || onfinish();
        },
        writableEnded = stream._writableState && stream._writableState.finished,
        onfinish = function () {
          (writable = !1),
            (writableEnded = !0),
            readable || callback.call(stream);
        },
        readableEnded =
          stream._readableState && stream._readableState.endEmitted,
        onend = function () {
          (readable = !1),
            (readableEnded = !0),
            writable || callback.call(stream);
        },
        onerror = function (err) {
          callback.call(stream, err);
        },
        onclose = function () {
          var err;
          return readable && !readableEnded
            ? ((stream._readableState && stream._readableState.ended) ||
                (err = new ERR_STREAM_PREMATURE_CLOSE()),
              callback.call(stream, err))
            : writable && !writableEnded
            ? ((stream._writableState && stream._writableState.ended) ||
                (err = new ERR_STREAM_PREMATURE_CLOSE()),
              callback.call(stream, err))
            : void 0;
        },
        onrequest = function () {
          stream.req.on("finish", onfinish);
        };
      return (
        !(function (stream) {
          return stream.setHeader && "function" == typeof stream.abort;
        })(stream)
          ? writable &&
            !stream._writableState &&
            (stream.on("end", onlegacyfinish),
            stream.on("close", onlegacyfinish))
          : (stream.on("complete", onfinish),
            stream.on("abort", onclose),
            stream.req ? onrequest() : stream.on("request", onrequest)),
        stream.on("end", onend),
        stream.on("finish", onfinish),
        !1 !== opts.error && stream.on("error", onerror),
        stream.on("close", onclose),
        function () {
          stream.removeListener("complete", onfinish),
            stream.removeListener("abort", onclose),
            stream.removeListener("request", onrequest),
            stream.req && stream.req.removeListener("finish", onfinish),
            stream.removeListener("end", onlegacyfinish),
            stream.removeListener("close", onlegacyfinish),
            stream.removeListener("finish", onfinish),
            stream.removeListener("end", onend),
            stream.removeListener("error", onerror),
            stream.removeListener("close", onclose);
        }
      );
    };
  },
  function (module, exports) {
    module.exports = require("tty");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var ERR_STREAM_PREMATURE_CLOSE =
      __webpack_require__(12).codes.ERR_STREAM_PREMATURE_CLOSE;
    function noop() {}
    module.exports = function eos(stream, opts, callback) {
      if ("function" == typeof opts) return eos(stream, null, opts);
      opts || (opts = {}),
        (callback = (function (callback) {
          var called = !1;
          return function () {
            if (!called) {
              called = !0;
              for (
                var _len = arguments.length, args = new Array(_len), _key = 0;
                _key < _len;
                _key++
              )
                args[_key] = arguments[_key];
              callback.apply(this, args);
            }
          };
        })(callback || noop));
      var readable = opts.readable || (!1 !== opts.readable && stream.readable),
        writable = opts.writable || (!1 !== opts.writable && stream.writable),
        onlegacyfinish = function () {
          stream.writable || onfinish();
        },
        writableEnded = stream._writableState && stream._writableState.finished,
        onfinish = function () {
          (writable = !1),
            (writableEnded = !0),
            readable || callback.call(stream);
        },
        readableEnded =
          stream._readableState && stream._readableState.endEmitted,
        onend = function () {
          (readable = !1),
            (readableEnded = !0),
            writable || callback.call(stream);
        },
        onerror = function (err) {
          callback.call(stream, err);
        },
        onclose = function () {
          var err;
          return readable && !readableEnded
            ? ((stream._readableState && stream._readableState.ended) ||
                (err = new ERR_STREAM_PREMATURE_CLOSE()),
              callback.call(stream, err))
            : writable && !writableEnded
            ? ((stream._writableState && stream._writableState.ended) ||
                (err = new ERR_STREAM_PREMATURE_CLOSE()),
              callback.call(stream, err))
            : void 0;
        },
        onrequest = function () {
          stream.req.on("finish", onfinish);
        };
      return (
        !(function (stream) {
          return stream.setHeader && "function" == typeof stream.abort;
        })(stream)
          ? writable &&
            !stream._writableState &&
            (stream.on("end", onlegacyfinish),
            stream.on("close", onlegacyfinish))
          : (stream.on("complete", onfinish),
            stream.on("abort", onclose),
            stream.req ? onrequest() : stream.on("request", onrequest)),
        stream.on("end", onend),
        stream.on("finish", onfinish),
        !1 !== opts.error && stream.on("error", onerror),
        stream.on("close", onclose),
        function () {
          stream.removeListener("complete", onfinish),
            stream.removeListener("abort", onclose),
            stream.removeListener("request", onrequest),
            stream.req && stream.req.removeListener("finish", onfinish),
            stream.removeListener("end", onlegacyfinish),
            stream.removeListener("close", onlegacyfinish),
            stream.removeListener("finish", onfinish),
            stream.removeListener("end", onend),
            stream.removeListener("error", onerror),
            stream.removeListener("close", onclose);
        }
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.BaseClient = void 0);
    const eventemitter3_1 = __webpack_require__(37),
      expanded_1 = __webpack_require__(81),
      interface_1 = __webpack_require__(83);
    class BaseClient extends eventemitter3_1.EventEmitter {
      constructor(partialConfig) {
        super(),
          (this.state = interface_1.ClientState.UNCONNECTED),
          (this.configuration = expanded_1.expandConfig(partialConfig));
      }
      get unconnected() {
        return this.state === interface_1.ClientState.UNCONNECTED;
      }
      get connecting() {
        return this.state === interface_1.ClientState.CONNECTING;
      }
      get connected() {
        return this.state === interface_1.ClientState.CONNECTED;
      }
      get ready() {
        return this.state === interface_1.ClientState.READY;
      }
      get closed() {
        return this.state === interface_1.ClientState.CLOSED;
      }
      emitError(error, emitEvenIfClosed = !1) {
        (this.closed && !emitEvenIfClosed) || this.emit("error", error);
      }
      emitMessage(message) {
        this.emit("message", message), this.emit(message.ircCommand, message);
      }
      emitConnecting() {
        this.advanceState(interface_1.ClientState.CONNECTING) &&
          this.emit("connecting");
      }
      emitConnected() {
        this.advanceState(interface_1.ClientState.CONNECTED) &&
          this.emit("connect");
      }
      emitReady() {
        this.advanceState(interface_1.ClientState.READY) && this.emit("ready");
      }
      emitClosed(error) {
        this.advanceState(interface_1.ClientState.CLOSED) &&
          this.emit("close", error);
      }
      advanceState(newState) {
        return !(newState <= this.state) && ((this.state = newState), !0);
      }
    }
    exports.BaseClient = BaseClient;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var has = Object.prototype.hasOwnProperty,
      prefix = "~";
    function Events() {}
    function EE(fn, context, once) {
      (this.fn = fn), (this.context = context), (this.once = once || !1);
    }
    function addListener(emitter, event, fn, context, once) {
      if ("function" != typeof fn)
        throw new TypeError("The listener must be a function");
      var listener = new EE(fn, context || emitter, once),
        evt = prefix ? prefix + event : event;
      return (
        emitter._events[evt]
          ? emitter._events[evt].fn
            ? (emitter._events[evt] = [emitter._events[evt], listener])
            : emitter._events[evt].push(listener)
          : ((emitter._events[evt] = listener), emitter._eventsCount++),
        emitter
      );
    }
    function clearEvent(emitter, evt) {
      0 == --emitter._eventsCount
        ? (emitter._events = new Events())
        : delete emitter._events[evt];
    }
    function EventEmitter() {
      (this._events = new Events()), (this._eventsCount = 0);
    }
    Object.create &&
      ((Events.prototype = Object.create(null)),
      new Events().__proto__ || (prefix = !1)),
      (EventEmitter.prototype.eventNames = function () {
        var events,
          name,
          names = [];
        if (0 === this._eventsCount) return names;
        for (name in (events = this._events))
          has.call(events, name) && names.push(prefix ? name.slice(1) : name);
        return Object.getOwnPropertySymbols
          ? names.concat(Object.getOwnPropertySymbols(events))
          : names;
      }),
      (EventEmitter.prototype.listeners = function (event) {
        var evt = prefix ? prefix + event : event,
          handlers = this._events[evt];
        if (!handlers) return [];
        if (handlers.fn) return [handlers.fn];
        for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++)
          ee[i] = handlers[i].fn;
        return ee;
      }),
      (EventEmitter.prototype.listenerCount = function (event) {
        var evt = prefix ? prefix + event : event,
          listeners = this._events[evt];
        return listeners ? (listeners.fn ? 1 : listeners.length) : 0;
      }),
      (EventEmitter.prototype.emit = function (event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return !1;
        var args,
          i,
          listeners = this._events[evt],
          len = arguments.length;
        if (listeners.fn) {
          switch (
            (listeners.once &&
              this.removeListener(event, listeners.fn, void 0, !0),
            len)
          ) {
            case 1:
              return listeners.fn.call(listeners.context), !0;
            case 2:
              return listeners.fn.call(listeners.context, a1), !0;
            case 3:
              return listeners.fn.call(listeners.context, a1, a2), !0;
            case 4:
              return listeners.fn.call(listeners.context, a1, a2, a3), !0;
            case 5:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4), !0;
            case 6:
              return (
                listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), !0
              );
          }
          for (i = 1, args = new Array(len - 1); i < len; i++)
            args[i - 1] = arguments[i];
          listeners.fn.apply(listeners.context, args);
        } else {
          var j,
            length = listeners.length;
          for (i = 0; i < length; i++)
            switch (
              (listeners[i].once &&
                this.removeListener(event, listeners[i].fn, void 0, !0),
              len)
            ) {
              case 1:
                listeners[i].fn.call(listeners[i].context);
                break;
              case 2:
                listeners[i].fn.call(listeners[i].context, a1);
                break;
              case 3:
                listeners[i].fn.call(listeners[i].context, a1, a2);
                break;
              case 4:
                listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                break;
              default:
                if (!args)
                  for (j = 1, args = new Array(len - 1); j < len; j++)
                    args[j - 1] = arguments[j];
                listeners[i].fn.apply(listeners[i].context, args);
            }
        }
        return !0;
      }),
      (EventEmitter.prototype.on = function (event, fn, context) {
        return addListener(this, event, fn, context, !1);
      }),
      (EventEmitter.prototype.once = function (event, fn, context) {
        return addListener(this, event, fn, context, !0);
      }),
      (EventEmitter.prototype.removeListener = function (
        event,
        fn,
        context,
        once
      ) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return this;
        if (!fn) return clearEvent(this, evt), this;
        var listeners = this._events[evt];
        if (listeners.fn)
          listeners.fn !== fn ||
            (once && !listeners.once) ||
            (context && listeners.context !== context) ||
            clearEvent(this, evt);
        else {
          for (
            var i = 0, events = [], length = listeners.length;
            i < length;
            i++
          )
            (listeners[i].fn !== fn ||
              (once && !listeners[i].once) ||
              (context && listeners[i].context !== context)) &&
              events.push(listeners[i]);
          events.length
            ? (this._events[evt] = 1 === events.length ? events[0] : events)
            : clearEvent(this, evt);
        }
        return this;
      }),
      (EventEmitter.prototype.removeAllListeners = function (event) {
        var evt;
        return (
          event
            ? ((evt = prefix ? prefix + event : event),
              this._events[evt] && clearEvent(this, evt))
            : ((this._events = new Events()), (this._eventsCount = 0)),
          this
        );
      }),
      (EventEmitter.prototype.off = EventEmitter.prototype.removeListener),
      (EventEmitter.prototype.addListener = EventEmitter.prototype.on),
      (EventEmitter.prefixed = prefix),
      (EventEmitter.EventEmitter = EventEmitter),
      (module.exports = EventEmitter);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var util = __webpack_require__(4),
      vmDebug = __webpack_require__(191),
      streamSpy = __webpack_require__(196);
    function time(label) {
      this.timeLabels[label] = process.hrtime();
    }
    function timeEnd(label, level) {
      level = level || "log";
      var diff = process.hrtime(this.timeLabels[label]),
        diffMs = (1e9 * diff[0] + diff[1]) / 1e6;
      return this[level](label + ":", diffMs + "ms"), diffMs;
    }
    function dir(obj, options, level) {
      !level && this[options] && ((level = options), (options = void 0)),
        (options = options || exports.inspectOptions),
        this[(level = level || "log")](util.inspect(obj, options));
    }
    function assert(expression) {
      if (!expression) {
        var level = "error",
          arr = Array.prototype.slice.call(arguments, 1);
        this[arr[arr.length - 1]] &&
          ((level = arr[arr.length - 1]), (arr = arr.slice(0, -1)));
        var assrt = __webpack_require__(197),
          err = new assrt.AssertionError({
            message: util.format.apply(this, arr),
            actual: !1,
            expected: !0,
            operator: "==",
            stackStartFunction: assert,
          });
        throw (this[level](err), err);
      }
    }
    ((exports = module.exports = debugLogger).debug = vmDebug),
      (exports.config = function (options) {
        var object, source;
        return (
          (options = options || {}).ensureNewline &&
            (function () {
              if (1 !== fd && 2 !== fd) return;
              streamSpy.enable(), (ensureNewlineEnabled = !0);
            })(),
          options.inspectOptions &&
            (exports.inspectOptions = options.inspectOptions),
          options.levels &&
            ((object = exports.levels),
            (source = options.levels),
            Object.keys(source).forEach(function (key) {
              var val = source[key];
              object[key] && isObject(val)
                ? Object.keys(val).forEach(function (idx) {
                    object[key][idx] = val[idx];
                  })
                : (object[key] = val);
            })),
          debugLogger
        );
      }),
      (exports.inspectOptions = {}),
      (exports.colors = {
        black: 0,
        red: 1,
        green: 2,
        yellow: 3,
        blue: 4,
        magenta: 5,
        cyan: 6,
        white: 7,
      }),
      (exports.colorReset = "[0m"),
      (exports.levels = {
        trace: {
          color: exports.colors.cyan,
          prefix: "",
          namespaceSuffix: ":trace",
          level: 0,
          fd: 1,
        },
        debug: {
          color: exports.colors.blue,
          prefix: "",
          namespaceSuffix: ":debug",
          level: 1,
          fd: 1,
        },
        log: {
          color: "",
          prefix: "  ",
          namespaceSuffix: ":log",
          level: 2,
          fd: 1,
        },
        info: {
          color: exports.colors.green,
          prefix: " ",
          namespaceSuffix: ":info",
          level: 3,
          fd: 1,
        },
        warn: {
          color: exports.colors.yellow,
          prefix: " ",
          namespaceSuffix: ":warn",
          level: 4,
        },
        error: {
          color: exports.colors.red,
          prefix: "",
          namespaceSuffix: ":error",
          level: 5,
        },
      }),
      (exports.styles = { underline: "[4m" });
    var ensureNewlineEnabled = !1,
      fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    function hasLogLevel(level) {
      return level
        ? isNaN(level)
          ? isString(level) && exports.levels[level]
            ? exports.levels[level].level || 0
            : null
          : level
        : null;
    }
    function isString(str) {
      return "string" == typeof str || str instanceof String;
    }
    function isObject(obj) {
      return "object" == typeof obj || obj instanceof Object;
    }
    function hasFormattingElements(str) {
      if (!str) return !1;
      var res = !1;
      return (
        ["%s", "%d", "%j", "%o"].forEach(function (elem) {
          str.indexOf(elem) >= 0 && (res = !0);
        }),
        res
      );
    }
    function getErrorMessage(e) {
      var errorStrings = ["" + e];
      if (void 0 === e) return errorStrings;
      if (null === e) return errorStrings;
      if (e instanceof Date) return errorStrings;
      if (e instanceof Error)
        return (
          (errorStrings[0] = e.toString()),
          e.stack &&
            ((errorStrings[1] = "Stack trace"), (errorStrings[2] = e.stack)),
          errorStrings
        );
      if (isObject(e)) {
        var inspection = util.inspect(e, exports.inspectOptions);
        if (inspection.length < 55)
          return (errorStrings[0] = inspection), errorStrings;
        void 0 !== e.toString && (errorStrings[0] = e.toString()),
          (errorStrings[1] = "Inspected object"),
          (errorStrings[2] = inspection);
      }
      return errorStrings;
    }
    function disableColors(loggerLevel, disable) {
      disable &&
        ((loggerLevel.color = ""),
        (loggerLevel.reset = ""),
        (loggerLevel.inspectionHighlight = ""));
    }
    var debugInstances = {};
    function getDebugInstance(namespace, color, fd) {
      return (
        debugInstances[namespace] ||
          ((debugInstances[namespace] = vmDebug(namespace)),
          1 === fd &&
            isNaN(parseInt(process.env.DEBUG_FD)) &&
            (debugInstances[namespace].log = console.log.bind(console)),
          isNaN(color) || (debugInstances[namespace].color = color)),
        debugInstances[namespace]
      );
    }
    function debugLogger(namespace) {
      var levels = exports.levels,
        debugLoggers = { default: getDebugInstance.bind(this, namespace, "") },
        logger = function () {
          debugLoggers.default().apply(this, arguments);
        };
      return (
        (logger.logLevel = (function (namespace) {
          if (!process.env.DEBUG_LEVEL) return 0;
          var debugLevel = process.env.DEBUG_LEVEL.toLowerCase();
          if (0 === debugLevel.indexOf("*:"))
            return hasLogLevel(debugLevel.slice(2)) || 0;
          var hasLevel = hasLogLevel(debugLevel);
          if (null !== hasLevel) return hasLevel;
          if (!namespace) return 0;
          var i,
            appNamespace = namespace.split(":")[0].toLowerCase(),
            debugLevelParts = debugLevel.split(",");
          for (i = 0; i < debugLevelParts.length; i++) {
            var parts = debugLevelParts[i].split(":");
            if (appNamespace === parts[0])
              return hasLogLevel(parts[parts.length - 1]) || 0;
          }
          return 0;
        })(namespace)),
        (logger.timeLabels = {}),
        (logger.time = time),
        (logger.timeEnd = timeEnd),
        (logger.dir = dir),
        (logger.assert = assert),
        Object.keys(levels).forEach(function (levelName) {
          var loggerNamespaceSuffix = levels[levelName].namespaceSuffix
            ? levels[levelName].namespaceSuffix
            : "default";
          debugLoggers[loggerNamespaceSuffix] ||
            (debugLoggers[loggerNamespaceSuffix] = getDebugInstance.bind(
              this,
              namespace + loggerNamespaceSuffix,
              levels[levelName].color,
              levels[levelName].fd
            ));
          var color,
            levelLogger = debugLoggers[loggerNamespaceSuffix],
            initialized = !1;
          function logFn() {
            if (!(logger.logLevel > logger[levelName].level)) {
              var levelLog = levelLogger();
              if (levelLog.enabled) {
                if (
                  (initialized ||
                    ((initialized = !0),
                    disableColors(logger[levelName], !levelLog.useColors)),
                  isString(arguments[0]) && hasFormattingElements(arguments[0]))
                )
                  return (
                    (arguments[0] =
                      logger[levelName].color +
                      levels[levelName].prefix +
                      logger[levelName].reset +
                      arguments[0]),
                    levelLog.apply(this, arguments)
                  );
                var i,
                  param,
                  selfArguments = arguments,
                  errorStrings = Object.keys(selfArguments).map(function (key) {
                    return getErrorMessage(selfArguments[key]);
                  }),
                  message = "",
                  inspections = "",
                  n = 1;
                for (i = 0; i < errorStrings.length; i++)
                  if (
                    ((param = errorStrings[i]),
                    (message += 0 === i ? param[0] : " " + param[0]),
                    param.length > 1)
                  ) {
                    var highlightStack =
                      param[1].indexOf("Stack") >= 0
                        ? logger[levelName].color
                        : "";
                    inspections +=
                      "\n" +
                      logger[levelName].inspectionHighlight +
                      "___" +
                      param[1] +
                      " #" +
                      n++ +
                      "___" +
                      logger[levelName].reset +
                      "\n" +
                      highlightStack +
                      param[2] +
                      logger[levelName].reset;
                  }
                levelLog(
                  logger[levelName].color +
                    levels[levelName].prefix +
                    logger[levelName].reset +
                    message +
                    inspections
                );
              }
            }
          }
          ((logger[levelName] = ensureNewlineEnabled
            ? function () {
                "\n" !== streamSpy.lastCharacter && vmDebug.log(""),
                  logFn.apply(logFn, arguments);
              }
            : logFn).level = levels[levelName].level),
            (logger[levelName].logger = function () {
              return levelLogger();
            }),
            (logger[levelName].enabled = function () {
              return (
                logger.logLevel <= logger[levelName].level &&
                levelLogger().enabled
              );
            }),
            (logger[levelName].color =
              ((color = levels[levelName].color),
              isNaN(color)
                ? exports.colors[color]
                  ? "[3" + exports.colors[color] + "m"
                  : color
                : "[3" + color + "m")),
            (logger[levelName].reset = exports.colorReset),
            (logger[levelName].inspectionHighlight = exports.styles.underline);
        }),
        logger
      );
    }
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.matchingNotice = void 0);
    const notice_1 = __webpack_require__(10);
    exports.matchingNotice = function (channelName, noticeIDs) {
      return (msg) =>
        msg instanceof notice_1.NoticeMessage &&
        msg.channelName === channelName &&
        noticeIDs.includes(msg.messageID);
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.MissingDataError = void 0);
    const parse_error_1 = __webpack_require__(8);
    class MissingDataError extends parse_error_1.ParseError {}
    exports.MissingDataError = MissingDataError;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ignoreErrors = void 0);
    exports.ignoreErrors = () => {};
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    exports.__esModule = !0;
    var Semaphore_1 = __webpack_require__(96);
    (exports.default = Semaphore_1.default),
      (function (m) {
        for (var p in m) exports.hasOwnProperty(p) || (exports[p] = m[p]);
      })(__webpack_require__(201));
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.UserStateTracker = void 0);
    const eventemitter3_1 = __webpack_require__(37);
    class UserStateTracker extends eventemitter3_1.EventEmitter {
      constructor(client) {
        super(), (this.channelStates = {}), (this.client = client);
      }
      getChannelState(channelName) {
        return this.channelStates[channelName];
      }
      getGlobalState() {
        return this.globalState;
      }
      applyToClient(client) {
        (client.userStateTracker = this),
          client.on("USERSTATE", this.onUserstateMessage.bind(this)),
          client.on(
            "GLOBALUSERSTATE",
            this.onGlobaluserstateMessage.bind(this)
          ),
          client.on("PRIVMSG", this.onPrivmsgMessage.bind(this));
      }
      onUserstateMessage(msg) {
        const newState = msg.extractUserState();
        (this.channelStates[msg.channelName] = newState),
          this.emit("newChannelState", msg.channelName, newState);
      }
      onGlobaluserstateMessage(msg) {
        (this.globalState = msg.extractGlobalUserState()),
          this.emit("newGlobalState", this.globalState);
      }
      onPrivmsgMessage(msg) {
        if (msg.senderUsername !== this.client.configuration.username) return;
        const channelState = this.channelStates[msg.channelName];
        if (null != channelState) {
          const newState = Object.assign(
            {},
            channelState,
            msg.extractUserState()
          );
          (this.channelStates[msg.channelName] = newState),
            this.emit("newChannelState", msg.channelName, newState);
        }
      }
    }
    exports.UserStateTracker = UserStateTracker;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.RoomstateMessage = exports.hasAllStateTags = void 0);
    const pickBy = __webpack_require__(202),
      channel_irc_message_1 = __webpack_require__(5),
      tag_values_1 = __webpack_require__(9);
    exports.hasAllStateTags = function (partialRoomState) {
      return (
        null != partialRoomState.emoteOnly &&
        null != partialRoomState.followersOnlyDuration &&
        null != partialRoomState.r9k &&
        null != partialRoomState.slowModeDuration &&
        null != partialRoomState.subscribersOnly
      );
    };
    class RoomstateMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(message) {
        super(message);
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.channelID = tagParser.requireString("room-id")),
          (this.emoteOnly = tagParser.getBoolean("emote-only")),
          (this.emoteOnlyRaw = tagParser.getString("emote-only")),
          (this.followersOnlyDuration = tagParser.getInt("followers-only")),
          (this.followersOnlyDurationRaw =
            tagParser.getString("followers-only")),
          (this.r9k = tagParser.getBoolean("r9k")),
          (this.r9kRaw = tagParser.getString("r9k")),
          (this.slowModeDuration = tagParser.getInt("slow")),
          (this.slowModeDurationRaw = tagParser.getString("slow")),
          (this.subscribersOnly = tagParser.getBoolean("subs-only")),
          (this.subscribersOnlyRaw = tagParser.getString("subs-only"));
      }
      extractRoomState() {
        const fullObj = {
          emoteOnly: this.emoteOnly,
          emoteOnlyRaw: this.emoteOnlyRaw,
          followersOnlyDuration: this.followersOnlyDuration,
          followersOnlyDurationRaw: this.followersOnlyDurationRaw,
          r9k: this.r9k,
          r9kRaw: this.r9kRaw,
          slowModeDuration: this.slowModeDuration,
          slowModeDurationRaw: this.slowModeDurationRaw,
          subscribersOnly: this.subscribersOnly,
          subscribersOnlyRaw: this.subscribersOnlyRaw,
        };
        return pickBy(fullObj, (v) => null != v);
      }
    }
    exports.RoomstateMessage = RoomstateMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.joinChannel =
        exports.joinNothingToDo =
        exports.awaitJoinResponse =
        exports.JoinError =
          void 0);
    const await_response_1 = __webpack_require__(3),
      errors_1 = __webpack_require__(1),
      join_1 = __webpack_require__(46),
      notice_1 = __webpack_require__(10);
    class JoinError extends errors_1.MessageError {
      constructor(failedChannelName, message, cause) {
        super(message, cause), (this.failedChannelName = failedChannelName);
      }
    }
    function awaitJoinResponse(conn, channelName) {
      return await_response_1.awaitResponse(conn, {
        success: (msg) =>
          msg instanceof join_1.JoinMessage &&
          msg.channelName === channelName &&
          msg.joinedUsername === conn.configuration.username,
        failure: (msg) =>
          msg instanceof notice_1.NoticeMessage &&
          msg.channelName === channelName &&
          "msg_channel_suspended" === msg.messageID,
        errorType: (m, e) => new JoinError(channelName, m, e),
        errorMessage: `Failed to join channel ${channelName}`,
      });
    }
    function joinNothingToDo(conn, channelName) {
      return (
        conn.wantedChannels.has(channelName) &&
        conn.joinedChannels.has(channelName)
      );
    }
    (exports.JoinError = JoinError),
      (exports.awaitJoinResponse = awaitJoinResponse),
      (exports.joinNothingToDo = joinNothingToDo),
      (exports.joinChannel = async function (conn, channelName) {
        if (joinNothingToDo(conn, channelName)) return;
        conn.wantedChannels.add(channelName),
          conn.sendRaw(`JOIN #${channelName}`);
        const response = await awaitJoinResponse(conn, channelName);
        return conn.joinedChannels.add(channelName), response;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.JoinMessage = void 0);
    const channel_irc_message_1 = __webpack_require__(5),
      irc_message_1 = __webpack_require__(0);
    class JoinMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(message) {
        super(message),
          (this.joinedUsername = irc_message_1.requireNickname(this));
      }
    }
    exports.JoinMessage = JoinMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.PartMessage = void 0);
    const channel_irc_message_1 = __webpack_require__(5),
      irc_message_1 = __webpack_require__(0);
    class PartMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(message) {
        super(message),
          (this.partedUsername = irc_message_1.requireNickname(this));
      }
    }
    exports.PartMessage = PartMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.sendPing = exports.PingTimeoutError = void 0);
    const randomstring = __webpack_require__(204),
      await_response_1 = __webpack_require__(3),
      errors_1 = __webpack_require__(1),
      pong_1 = __webpack_require__(49);
    class PingTimeoutError extends errors_1.ConnectionError {}
    (exports.PingTimeoutError = PingTimeoutError),
      (exports.sendPing = async function (
        conn,
        pingIdentifier = (function () {
          return `dank-twitch-irc:manual:${randomstring.generate({
            charset: "hex",
            length: 32,
            capitalization: "lowercase",
          })}`;
        })(),
        timeout = 2e3
      ) {
        return (
          conn.sendRaw(`PING :${pingIdentifier}`),
          await await_response_1.awaitResponse(conn, {
            success: (msg) =>
              msg instanceof pong_1.PongMessage &&
              msg.argument === pingIdentifier,
            timeout: timeout,
            errorType: (message, cause) => new PingTimeoutError(message, cause),
            errorMessage: "Server did not PONG back",
          })
        );
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.PongMessage = void 0);
    const irc_message_1 = __webpack_require__(0);
    class PongMessage extends irc_message_1.IRCMessage {
      constructor(message) {
        super(message), (this.argument = irc_message_1.getParameter(this, 1));
      }
    }
    exports.PongMessage = PongMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.UserstateMessage = void 0);
    const channel_irc_message_1 = __webpack_require__(5),
      tag_values_1 = __webpack_require__(9);
    class UserstateMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(message) {
        super(message);
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.badgeInfo = tagParser.requireBadges("badge-info")),
          (this.badgeInfoRaw = tagParser.requireString("badge-info")),
          (this.badges = tagParser.requireBadges("badges")),
          (this.badgesRaw = tagParser.requireString("badges")),
          (this.color = tagParser.getColor("color")),
          (this.colorRaw = tagParser.requireString("color")),
          (this.displayName = tagParser.requireString("display-name").trim()),
          (this.emoteSets = tagParser.requireEmoteSets("emote-sets")),
          (this.emoteSetsRaw = tagParser.requireString("emote-sets")),
          (this.isMod = tagParser.requireBoolean("mod")),
          (this.isModRaw = tagParser.requireString("mod"));
      }
      extractUserState() {
        return {
          badgeInfo: this.badgeInfo,
          badgeInfoRaw: this.badgeInfoRaw,
          badges: this.badges,
          badgesRaw: this.badgesRaw,
          color: this.color,
          colorRaw: this.colorRaw,
          displayName: this.displayName,
          emoteSets: this.emoteSets,
          emoteSetsRaw: this.emoteSetsRaw,
          isMod: this.isMod,
          isModRaw: this.isModRaw,
        };
      }
    }
    exports.UserstateMessage = UserstateMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ValidationError = void 0);
    const base_error_1 = __webpack_require__(25);
    class ValidationError extends base_error_1.BaseError {
      constructor(message) {
        super(message);
      }
    }
    exports.ValidationError = ValidationError;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.anyCauseInstanceof = exports.causeOf = void 0);
    const make_error_cause_1 = __webpack_require__(55);
    function causeOf(error) {
      if (error instanceof make_error_cause_1.BaseError) return error.cause;
    }
    (exports.causeOf = causeOf),
      (exports.anyCauseInstanceof = function (error, constructor) {
        let currentError = error;
        for (; null != currentError; ) {
          if (currentError instanceof constructor) return !0;
          currentError = causeOf(currentError);
        }
        return !1;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var ERR_STREAM_PREMATURE_CLOSE =
      __webpack_require__(14).codes.ERR_STREAM_PREMATURE_CLOSE;
    function noop() {}
    module.exports = function eos(stream, opts, callback) {
      if ("function" == typeof opts) return eos(stream, null, opts);
      opts || (opts = {}),
        (callback = (function (callback) {
          var called = !1;
          return function () {
            if (!called) {
              called = !0;
              for (
                var _len = arguments.length, args = new Array(_len), _key = 0;
                _key < _len;
                _key++
              )
                args[_key] = arguments[_key];
              callback.apply(this, args);
            }
          };
        })(callback || noop));
      var readable = opts.readable || (!1 !== opts.readable && stream.readable),
        writable = opts.writable || (!1 !== opts.writable && stream.writable),
        onlegacyfinish = function () {
          stream.writable || onfinish();
        },
        writableEnded = stream._writableState && stream._writableState.finished,
        onfinish = function () {
          (writable = !1),
            (writableEnded = !0),
            readable || callback.call(stream);
        },
        readableEnded =
          stream._readableState && stream._readableState.endEmitted,
        onend = function () {
          (readable = !1),
            (readableEnded = !0),
            writable || callback.call(stream);
        },
        onerror = function (err) {
          callback.call(stream, err);
        },
        onclose = function () {
          var err;
          return readable && !readableEnded
            ? ((stream._readableState && stream._readableState.ended) ||
                (err = new ERR_STREAM_PREMATURE_CLOSE()),
              callback.call(stream, err))
            : writable && !writableEnded
            ? ((stream._writableState && stream._writableState.ended) ||
                (err = new ERR_STREAM_PREMATURE_CLOSE()),
              callback.call(stream, err))
            : void 0;
        },
        onrequest = function () {
          stream.req.on("finish", onfinish);
        };
      return (
        !(function (stream) {
          return stream.setHeader && "function" == typeof stream.abort;
        })(stream)
          ? writable &&
            !stream._writableState &&
            (stream.on("end", onlegacyfinish),
            stream.on("close", onlegacyfinish))
          : (stream.on("complete", onfinish),
            stream.on("abort", onclose),
            stream.req ? onrequest() : stream.on("request", onrequest)),
        stream.on("end", onend),
        stream.on("finish", onfinish),
        !1 !== opts.error && stream.on("error", onerror),
        stream.on("close", onclose),
        function () {
          stream.removeListener("complete", onfinish),
            stream.removeListener("abort", onclose),
            stream.removeListener("request", onrequest),
            stream.req && stream.req.removeListener("finish", onfinish),
            stream.removeListener("end", onlegacyfinish),
            stream.removeListener("close", onlegacyfinish),
            stream.removeListener("finish", onfinish),
            stream.removeListener("end", onend),
            stream.removeListener("error", onerror),
            stream.removeListener("close", onclose);
        }
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.CapMessage = void 0);
    const irc_message_1 = __webpack_require__(0);
    class CapMessage extends irc_message_1.IRCMessage {
      constructor(message) {
        super(message),
          (this.subCommand = irc_message_1.requireParameter(this, 1)),
          (this.capabilities = irc_message_1
            .requireParameter(this, 2)
            .split(" "));
      }
    }
    exports.CapMessage = CapMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var extendStatics,
      __extends =
        (this && this.__extends) ||
        ((extendStatics = function (d, b) {
          return (extendStatics =
            Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array &&
              function (d, b) {
                d.__proto__ = b;
              }) ||
            function (d, b) {
              for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
            })(d, b);
        }),
        function (d, b) {
          function __() {
            this.constructor = d;
          }
          extendStatics(d, b),
            (d.prototype =
              null === b
                ? Object.create(b)
                : ((__.prototype = b.prototype), new __()));
        });
    Object.defineProperty(exports, "__esModule", { value: !0 });
    var makeError = __webpack_require__(150),
      util_1 = __webpack_require__(4);
    exports.SEPARATOR_TEXT =
      "\n\nThe following exception was the direct cause of the above exception:\n\n";
    var BaseError = (function (_super) {
      function BaseError(message, cause) {
        var _this = _super.call(this, message) || this;
        return (
          (_this.cause = cause),
          Object.defineProperty(_this, "cause", {
            writable: !1,
            enumerable: !1,
            configurable: !1,
          }),
          _this
        );
      }
      return (
        __extends(BaseError, _super),
        (BaseError.prototype[util_1.inspect.custom || "inspect"] = function () {
          return fullStack(this);
        }),
        BaseError
      );
    })(makeError.BaseError);
    function fullStack(error) {
      for (var chain = [], cause = error; cause; )
        chain.push(cause), (cause = cause.cause);
      return chain
        .map(function (err) {
          return util_1.inspect(err, { customInspect: !1 });
        })
        .join(exports.SEPARATOR_TEXT);
    }
    (exports.BaseError = BaseError), (exports.fullStack = fullStack);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.TimeoutError = void 0);
    const base_error_1 = __webpack_require__(25);
    class TimeoutError extends base_error_1.BaseError {
      constructor(message) {
        super(message);
      }
    }
    exports.TimeoutError = TimeoutError;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.DuplexTransport = void 0);
    exports.DuplexTransport = class {
      constructor(config) {
        this.stream = config.stream();
      }
      connect(connectionListener) {
        null != connectionListener && setImmediate(connectionListener);
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.makeTransport = void 0);
    const duplex_transport_1 = __webpack_require__(57),
      tcp_transport_1 = __webpack_require__(59),
      websocket_transport_1 = __webpack_require__(60);
    exports.makeTransport = function (config) {
      switch (config.type) {
        case "tcp":
          return new tcp_transport_1.TcpTransport(config);
        case "duplex":
          return new duplex_transport_1.DuplexTransport(config);
        case "websocket":
          return new websocket_transport_1.WebSocketTransport(config);
        default:
          throw new Error("Unknown transport type");
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.TcpTransport = void 0);
    const net_1 = __webpack_require__(21),
      tls_1 = __webpack_require__(27);
    exports.TcpTransport = class {
      constructor(config) {
        (this.config = config),
          config.secure
            ? ((this.backingSocket = new net_1.Socket()),
              this.backingSocket.setNoDelay(!0),
              (this.stream = new tls_1.TLSSocket(this.backingSocket)))
            : (this.stream = new net_1.Socket()),
          this.stream.setNoDelay(!0),
          this.stream.setDefaultEncoding("utf-8"),
          this.stream.setEncoding("utf-8"),
          this.stream.cork();
      }
      connect(connectionListener) {
        null != this.backingSocket &&
          this.backingSocket.connect(this.config.port, this.config.host),
          this.stream.connect(this.config.port, this.config.host, () => {
            this.stream.uncork(),
              null != connectionListener && connectionListener();
          });
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.WebSocketTransport = void 0);
    const duplexify = __webpack_require__(153),
      WebSocketDuplex = __webpack_require__(166),
      stream_1 = __webpack_require__(6);
    exports.WebSocketTransport = class {
      constructor(config) {
        (this.config = config),
          (this.readable = new stream_1.PassThrough({
            decodeStrings: !1,
            objectMode: !0,
          })),
          (this.writable = new stream_1.PassThrough({
            decodeStrings: !1,
            objectMode: !0,
          })),
          (this.stream = duplexify(this.writable, this.readable, {
            decodeStrings: !1,
            objectMode: !0,
          }));
      }
      connect(connectionListener) {
        (this.wsStream = new WebSocketDuplex({
          url: this.config.url,
          decodeStrings: !1,
          objectMode: !0,
        })),
          null != connectionListener &&
            this.wsStream.once("connect", connectionListener),
          this.wsStream.pipe(this.readable),
          this.writable.pipe(this.wsStream);
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var Duplex;
    (module.exports = Readable), (Readable.ReadableState = ReadableState);
    __webpack_require__(22).EventEmitter;
    var EElistenerCount = function (emitter, type) {
        return emitter.listeners(type).length;
      },
      Stream = __webpack_require__(62),
      Buffer = __webpack_require__(7).Buffer,
      OurUint8Array = global.Uint8Array || function () {};
    var debug,
      debugUtil = __webpack_require__(4);
    debug =
      debugUtil && debugUtil.debuglog
        ? debugUtil.debuglog("stream")
        : function () {};
    var StringDecoder,
      createReadableStreamAsyncIterator,
      from,
      BufferList = __webpack_require__(155),
      destroyImpl = __webpack_require__(63),
      getHighWaterMark = __webpack_require__(64).getHighWaterMark,
      _require$codes = __webpack_require__(11).codes,
      ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
      ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_STREAM_UNSHIFT_AFTER_END_EVENT =
        _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    __webpack_require__(2)(Readable, Stream);
    var errorOrDestroy = destroyImpl.errorOrDestroy,
      kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function ReadableState(options, stream, isDuplex) {
      (Duplex = Duplex || __webpack_require__(15)),
        (options = options || {}),
        "boolean" != typeof isDuplex && (isDuplex = stream instanceof Duplex),
        (this.objectMode = !!options.objectMode),
        isDuplex &&
          (this.objectMode = this.objectMode || !!options.readableObjectMode),
        (this.highWaterMark = getHighWaterMark(
          this,
          options,
          "readableHighWaterMark",
          isDuplex
        )),
        (this.buffer = new BufferList()),
        (this.length = 0),
        (this.pipes = null),
        (this.pipesCount = 0),
        (this.flowing = null),
        (this.ended = !1),
        (this.endEmitted = !1),
        (this.reading = !1),
        (this.sync = !0),
        (this.needReadable = !1),
        (this.emittedReadable = !1),
        (this.readableListening = !1),
        (this.resumeScheduled = !1),
        (this.paused = !0),
        (this.emitClose = !1 !== options.emitClose),
        (this.autoDestroy = !!options.autoDestroy),
        (this.destroyed = !1),
        (this.defaultEncoding = options.defaultEncoding || "utf8"),
        (this.awaitDrain = 0),
        (this.readingMore = !1),
        (this.decoder = null),
        (this.encoding = null),
        options.encoding &&
          (StringDecoder ||
            (StringDecoder = __webpack_require__(16).StringDecoder),
          (this.decoder = new StringDecoder(options.encoding)),
          (this.encoding = options.encoding));
    }
    function Readable(options) {
      if (
        ((Duplex = Duplex || __webpack_require__(15)),
        !(this instanceof Readable))
      )
        return new Readable(options);
      var isDuplex = this instanceof Duplex;
      (this._readableState = new ReadableState(options, this, isDuplex)),
        (this.readable = !0),
        options &&
          ("function" == typeof options.read && (this._read = options.read),
          "function" == typeof options.destroy &&
            (this._destroy = options.destroy)),
        Stream.call(this);
    }
    function readableAddChunk(
      stream,
      chunk,
      encoding,
      addToFront,
      skipChunkCheck
    ) {
      debug("readableAddChunk", chunk);
      var er,
        state = stream._readableState;
      if (null === chunk)
        (state.reading = !1),
          (function (stream, state) {
            if ((debug("onEofChunk"), state.ended)) return;
            if (state.decoder) {
              var chunk = state.decoder.end();
              chunk &&
                chunk.length &&
                (state.buffer.push(chunk),
                (state.length += state.objectMode ? 1 : chunk.length));
            }
            (state.ended = !0),
              state.sync
                ? emitReadable(stream)
                : ((state.needReadable = !1),
                  state.emittedReadable ||
                    ((state.emittedReadable = !0), emitReadable_(stream)));
          })(stream, state);
      else if (
        (skipChunkCheck ||
          (er = (function (state, chunk) {
            var er;
            (obj = chunk),
              Buffer.isBuffer(obj) ||
                obj instanceof OurUint8Array ||
                "string" == typeof chunk ||
                void 0 === chunk ||
                state.objectMode ||
                (er = new ERR_INVALID_ARG_TYPE(
                  "chunk",
                  ["string", "Buffer", "Uint8Array"],
                  chunk
                ));
            var obj;
            return er;
          })(state, chunk)),
        er)
      )
        errorOrDestroy(stream, er);
      else if (state.objectMode || (chunk && chunk.length > 0))
        if (
          ("string" == typeof chunk ||
            state.objectMode ||
            Object.getPrototypeOf(chunk) === Buffer.prototype ||
            (chunk = (function (chunk) {
              return Buffer.from(chunk);
            })(chunk)),
          addToFront)
        )
          state.endEmitted
            ? errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT())
            : addChunk(stream, state, chunk, !0);
        else if (state.ended)
          errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
        else {
          if (state.destroyed) return !1;
          (state.reading = !1),
            state.decoder && !encoding
              ? ((chunk = state.decoder.write(chunk)),
                state.objectMode || 0 !== chunk.length
                  ? addChunk(stream, state, chunk, !1)
                  : maybeReadMore(stream, state))
              : addChunk(stream, state, chunk, !1);
        }
      else addToFront || ((state.reading = !1), maybeReadMore(stream, state));
      return (
        !state.ended &&
        (state.length < state.highWaterMark || 0 === state.length)
      );
    }
    function addChunk(stream, state, chunk, addToFront) {
      state.flowing && 0 === state.length && !state.sync
        ? ((state.awaitDrain = 0), stream.emit("data", chunk))
        : ((state.length += state.objectMode ? 1 : chunk.length),
          addToFront ? state.buffer.unshift(chunk) : state.buffer.push(chunk),
          state.needReadable && emitReadable(stream)),
        maybeReadMore(stream, state);
    }
    Object.defineProperty(Readable.prototype, "destroyed", {
      enumerable: !1,
      get: function () {
        return void 0 !== this._readableState && this._readableState.destroyed;
      },
      set: function (value) {
        this._readableState && (this._readableState.destroyed = value);
      },
    }),
      (Readable.prototype.destroy = destroyImpl.destroy),
      (Readable.prototype._undestroy = destroyImpl.undestroy),
      (Readable.prototype._destroy = function (err, cb) {
        cb(err);
      }),
      (Readable.prototype.push = function (chunk, encoding) {
        var skipChunkCheck,
          state = this._readableState;
        return (
          state.objectMode
            ? (skipChunkCheck = !0)
            : "string" == typeof chunk &&
              ((encoding = encoding || state.defaultEncoding) !==
                state.encoding &&
                ((chunk = Buffer.from(chunk, encoding)), (encoding = "")),
              (skipChunkCheck = !0)),
          readableAddChunk(this, chunk, encoding, !1, skipChunkCheck)
        );
      }),
      (Readable.prototype.unshift = function (chunk) {
        return readableAddChunk(this, chunk, null, !0, !1);
      }),
      (Readable.prototype.isPaused = function () {
        return !1 === this._readableState.flowing;
      }),
      (Readable.prototype.setEncoding = function (enc) {
        StringDecoder ||
          (StringDecoder = __webpack_require__(16).StringDecoder);
        var decoder = new StringDecoder(enc);
        (this._readableState.decoder = decoder),
          (this._readableState.encoding = this._readableState.decoder.encoding);
        for (
          var p = this._readableState.buffer.head, content = "";
          null !== p;

        )
          (content += decoder.write(p.data)), (p = p.next);
        return (
          this._readableState.buffer.clear(),
          "" !== content && this._readableState.buffer.push(content),
          (this._readableState.length = content.length),
          this
        );
      });
    function howMuchToRead(n, state) {
      return n <= 0 || (0 === state.length && state.ended)
        ? 0
        : state.objectMode
        ? 1
        : n != n
        ? state.flowing && state.length
          ? state.buffer.head.data.length
          : state.length
        : (n > state.highWaterMark &&
            (state.highWaterMark = (function (n) {
              return (
                n >= 1073741824
                  ? (n = 1073741824)
                  : (n--,
                    (n |= n >>> 1),
                    (n |= n >>> 2),
                    (n |= n >>> 4),
                    (n |= n >>> 8),
                    (n |= n >>> 16),
                    n++),
                n
              );
            })(n)),
          n <= state.length
            ? n
            : state.ended
            ? state.length
            : ((state.needReadable = !0), 0));
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      debug("emitReadable", state.needReadable, state.emittedReadable),
        (state.needReadable = !1),
        state.emittedReadable ||
          (debug("emitReadable", state.flowing),
          (state.emittedReadable = !0),
          process.nextTick(emitReadable_, stream));
    }
    function emitReadable_(stream) {
      var state = stream._readableState;
      debug("emitReadable_", state.destroyed, state.length, state.ended),
        state.destroyed ||
          (!state.length && !state.ended) ||
          (stream.emit("readable"), (state.emittedReadable = !1)),
        (state.needReadable =
          !state.flowing &&
          !state.ended &&
          state.length <= state.highWaterMark),
        flow(stream);
    }
    function maybeReadMore(stream, state) {
      state.readingMore ||
        ((state.readingMore = !0),
        process.nextTick(maybeReadMore_, stream, state));
    }
    function maybeReadMore_(stream, state) {
      for (
        ;
        !state.reading &&
        !state.ended &&
        (state.length < state.highWaterMark ||
          (state.flowing && 0 === state.length));

      ) {
        var len = state.length;
        if (
          (debug("maybeReadMore read 0"), stream.read(0), len === state.length)
        )
          break;
      }
      state.readingMore = !1;
    }
    function updateReadableListening(self) {
      var state = self._readableState;
      (state.readableListening = self.listenerCount("readable") > 0),
        state.resumeScheduled && !state.paused
          ? (state.flowing = !0)
          : self.listenerCount("data") > 0 && self.resume();
    }
    function nReadingNextTick(self) {
      debug("readable nexttick read 0"), self.read(0);
    }
    function resume_(stream, state) {
      debug("resume", state.reading),
        state.reading || stream.read(0),
        (state.resumeScheduled = !1),
        stream.emit("resume"),
        flow(stream),
        state.flowing && !state.reading && stream.read(0);
    }
    function flow(stream) {
      var state = stream._readableState;
      for (
        debug("flow", state.flowing);
        state.flowing && null !== stream.read();

      );
    }
    function fromList(n, state) {
      return 0 === state.length
        ? null
        : (state.objectMode
            ? (ret = state.buffer.shift())
            : !n || n >= state.length
            ? ((ret = state.decoder
                ? state.buffer.join("")
                : 1 === state.buffer.length
                ? state.buffer.first()
                : state.buffer.concat(state.length)),
              state.buffer.clear())
            : (ret = state.buffer.consume(n, state.decoder)),
          ret);
      var ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      debug("endReadable", state.endEmitted),
        state.endEmitted ||
          ((state.ended = !0), process.nextTick(endReadableNT, state, stream));
    }
    function endReadableNT(state, stream) {
      if (
        (debug("endReadableNT", state.endEmitted, state.length),
        !state.endEmitted &&
          0 === state.length &&
          ((state.endEmitted = !0),
          (stream.readable = !1),
          stream.emit("end"),
          state.autoDestroy))
      ) {
        var wState = stream._writableState;
        (!wState || (wState.autoDestroy && wState.finished)) &&
          stream.destroy();
      }
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) if (xs[i] === x) return i;
      return -1;
    }
    (Readable.prototype.read = function (n) {
      debug("read", n), (n = parseInt(n, 10));
      var state = this._readableState,
        nOrig = n;
      if (
        (0 !== n && (state.emittedReadable = !1),
        0 === n &&
          state.needReadable &&
          ((0 !== state.highWaterMark
            ? state.length >= state.highWaterMark
            : state.length > 0) ||
            state.ended))
      )
        return (
          debug("read: emitReadable", state.length, state.ended),
          0 === state.length && state.ended
            ? endReadable(this)
            : emitReadable(this),
          null
        );
      if (0 === (n = howMuchToRead(n, state)) && state.ended)
        return 0 === state.length && endReadable(this), null;
      var ret,
        doRead = state.needReadable;
      return (
        debug("need readable", doRead),
        (0 === state.length || state.length - n < state.highWaterMark) &&
          debug("length less than watermark", (doRead = !0)),
        state.ended || state.reading
          ? debug("reading or ended", (doRead = !1))
          : doRead &&
            (debug("do read"),
            (state.reading = !0),
            (state.sync = !0),
            0 === state.length && (state.needReadable = !0),
            this._read(state.highWaterMark),
            (state.sync = !1),
            state.reading || (n = howMuchToRead(nOrig, state))),
        null === (ret = n > 0 ? fromList(n, state) : null)
          ? ((state.needReadable = state.length <= state.highWaterMark),
            (n = 0))
          : ((state.length -= n), (state.awaitDrain = 0)),
        0 === state.length &&
          (state.ended || (state.needReadable = !0),
          nOrig !== n && state.ended && endReadable(this)),
        null !== ret && this.emit("data", ret),
        ret
      );
    }),
      (Readable.prototype._read = function (n) {
        errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
      }),
      (Readable.prototype.pipe = function (dest, pipeOpts) {
        var src = this,
          state = this._readableState;
        switch (state.pipesCount) {
          case 0:
            state.pipes = dest;
            break;
          case 1:
            state.pipes = [state.pipes, dest];
            break;
          default:
            state.pipes.push(dest);
        }
        (state.pipesCount += 1),
          debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
        var endFn =
          (!pipeOpts || !1 !== pipeOpts.end) &&
          dest !== process.stdout &&
          dest !== process.stderr
            ? onend
            : unpipe;
        function onunpipe(readable, unpipeInfo) {
          debug("onunpipe"),
            readable === src &&
              unpipeInfo &&
              !1 === unpipeInfo.hasUnpiped &&
              ((unpipeInfo.hasUnpiped = !0),
              debug("cleanup"),
              dest.removeListener("close", onclose),
              dest.removeListener("finish", onfinish),
              dest.removeListener("drain", ondrain),
              dest.removeListener("error", onerror),
              dest.removeListener("unpipe", onunpipe),
              src.removeListener("end", onend),
              src.removeListener("end", unpipe),
              src.removeListener("data", ondata),
              (cleanedUp = !0),
              !state.awaitDrain ||
                (dest._writableState && !dest._writableState.needDrain) ||
                ondrain());
        }
        function onend() {
          debug("onend"), dest.end();
        }
        state.endEmitted ? process.nextTick(endFn) : src.once("end", endFn),
          dest.on("unpipe", onunpipe);
        var ondrain = (function (src) {
          return function () {
            var state = src._readableState;
            debug("pipeOnDrain", state.awaitDrain),
              state.awaitDrain && state.awaitDrain--,
              0 === state.awaitDrain &&
                EElistenerCount(src, "data") &&
                ((state.flowing = !0), flow(src));
          };
        })(src);
        dest.on("drain", ondrain);
        var cleanedUp = !1;
        function ondata(chunk) {
          debug("ondata");
          var ret = dest.write(chunk);
          debug("dest.write", ret),
            !1 === ret &&
              (((1 === state.pipesCount && state.pipes === dest) ||
                (state.pipesCount > 1 && -1 !== indexOf(state.pipes, dest))) &&
                !cleanedUp &&
                (debug("false write response, pause", state.awaitDrain),
                state.awaitDrain++),
              src.pause());
        }
        function onerror(er) {
          debug("onerror", er),
            unpipe(),
            dest.removeListener("error", onerror),
            0 === EElistenerCount(dest, "error") && errorOrDestroy(dest, er);
        }
        function onclose() {
          dest.removeListener("finish", onfinish), unpipe();
        }
        function onfinish() {
          debug("onfinish"), dest.removeListener("close", onclose), unpipe();
        }
        function unpipe() {
          debug("unpipe"), src.unpipe(dest);
        }
        return (
          src.on("data", ondata),
          (function (emitter, event, fn) {
            if ("function" == typeof emitter.prependListener)
              return emitter.prependListener(event, fn);
            emitter._events && emitter._events[event]
              ? Array.isArray(emitter._events[event])
                ? emitter._events[event].unshift(fn)
                : (emitter._events[event] = [fn, emitter._events[event]])
              : emitter.on(event, fn);
          })(dest, "error", onerror),
          dest.once("close", onclose),
          dest.once("finish", onfinish),
          dest.emit("pipe", src),
          state.flowing || (debug("pipe resume"), src.resume()),
          dest
        );
      }),
      (Readable.prototype.unpipe = function (dest) {
        var state = this._readableState,
          unpipeInfo = { hasUnpiped: !1 };
        if (0 === state.pipesCount) return this;
        if (1 === state.pipesCount)
          return (
            (dest && dest !== state.pipes) ||
              (dest || (dest = state.pipes),
              (state.pipes = null),
              (state.pipesCount = 0),
              (state.flowing = !1),
              dest && dest.emit("unpipe", this, unpipeInfo)),
            this
          );
        if (!dest) {
          var dests = state.pipes,
            len = state.pipesCount;
          (state.pipes = null), (state.pipesCount = 0), (state.flowing = !1);
          for (var i = 0; i < len; i++)
            dests[i].emit("unpipe", this, { hasUnpiped: !1 });
          return this;
        }
        var index = indexOf(state.pipes, dest);
        return (
          -1 === index ||
            (state.pipes.splice(index, 1),
            (state.pipesCount -= 1),
            1 === state.pipesCount && (state.pipes = state.pipes[0]),
            dest.emit("unpipe", this, unpipeInfo)),
          this
        );
      }),
      (Readable.prototype.on = function (ev, fn) {
        var res = Stream.prototype.on.call(this, ev, fn),
          state = this._readableState;
        return (
          "data" === ev
            ? ((state.readableListening = this.listenerCount("readable") > 0),
              !1 !== state.flowing && this.resume())
            : "readable" === ev &&
              (state.endEmitted ||
                state.readableListening ||
                ((state.readableListening = state.needReadable = !0),
                (state.flowing = !1),
                (state.emittedReadable = !1),
                debug("on readable", state.length, state.reading),
                state.length
                  ? emitReadable(this)
                  : state.reading || process.nextTick(nReadingNextTick, this))),
          res
        );
      }),
      (Readable.prototype.addListener = Readable.prototype.on),
      (Readable.prototype.removeListener = function (ev, fn) {
        var res = Stream.prototype.removeListener.call(this, ev, fn);
        return (
          "readable" === ev && process.nextTick(updateReadableListening, this),
          res
        );
      }),
      (Readable.prototype.removeAllListeners = function (ev) {
        var res = Stream.prototype.removeAllListeners.apply(this, arguments);
        return (
          ("readable" !== ev && void 0 !== ev) ||
            process.nextTick(updateReadableListening, this),
          res
        );
      }),
      (Readable.prototype.resume = function () {
        var state = this._readableState;
        return (
          state.flowing ||
            (debug("resume"),
            (state.flowing = !state.readableListening),
            (function (stream, state) {
              state.resumeScheduled ||
                ((state.resumeScheduled = !0),
                process.nextTick(resume_, stream, state));
            })(this, state)),
          (state.paused = !1),
          this
        );
      }),
      (Readable.prototype.pause = function () {
        return (
          debug("call pause flowing=%j", this._readableState.flowing),
          !1 !== this._readableState.flowing &&
            (debug("pause"),
            (this._readableState.flowing = !1),
            this.emit("pause")),
          (this._readableState.paused = !0),
          this
        );
      }),
      (Readable.prototype.wrap = function (stream) {
        var _this = this,
          state = this._readableState,
          paused = !1;
        for (var i in (stream.on("end", function () {
          if ((debug("wrapped end"), state.decoder && !state.ended)) {
            var chunk = state.decoder.end();
            chunk && chunk.length && _this.push(chunk);
          }
          _this.push(null);
        }),
        stream.on("data", function (chunk) {
          (debug("wrapped data"),
          state.decoder && (chunk = state.decoder.write(chunk)),
          state.objectMode && null == chunk) ||
            ((state.objectMode || (chunk && chunk.length)) &&
              (_this.push(chunk) || ((paused = !0), stream.pause())));
        }),
        stream))
          void 0 === this[i] &&
            "function" == typeof stream[i] &&
            (this[i] = (function (method) {
              return function () {
                return stream[method].apply(stream, arguments);
              };
            })(i));
        for (var n = 0; n < kProxyEvents.length; n++)
          stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
        return (
          (this._read = function (n) {
            debug("wrapped _read", n),
              paused && ((paused = !1), stream.resume());
          }),
          this
        );
      }),
      "function" == typeof Symbol &&
        (Readable.prototype[Symbol.asyncIterator] = function () {
          return (
            void 0 === createReadableStreamAsyncIterator &&
              (createReadableStreamAsyncIterator = __webpack_require__(158)),
            createReadableStreamAsyncIterator(this)
          );
        }),
      Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
        enumerable: !1,
        get: function () {
          return this._readableState.highWaterMark;
        },
      }),
      Object.defineProperty(Readable.prototype, "readableBuffer", {
        enumerable: !1,
        get: function () {
          return this._readableState && this._readableState.buffer;
        },
      }),
      Object.defineProperty(Readable.prototype, "readableFlowing", {
        enumerable: !1,
        get: function () {
          return this._readableState.flowing;
        },
        set: function (state) {
          this._readableState && (this._readableState.flowing = state);
        },
      }),
      (Readable._fromList = fromList),
      Object.defineProperty(Readable.prototype, "readableLength", {
        enumerable: !1,
        get: function () {
          return this._readableState.length;
        },
      }),
      "function" == typeof Symbol &&
        (Readable.from = function (iterable, opts) {
          return (
            void 0 === from && (from = __webpack_require__(159)),
            from(Readable, iterable, opts)
          );
        });
  },
  function (module, exports, __webpack_require__) {
    module.exports = __webpack_require__(6);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function emitErrorAndCloseNT(self, err) {
      emitErrorNT(self, err), emitCloseNT(self);
    }
    function emitCloseNT(self) {
      (self._writableState && !self._writableState.emitClose) ||
        (self._readableState && !self._readableState.emitClose) ||
        self.emit("close");
    }
    function emitErrorNT(self, err) {
      self.emit("error", err);
    }
    module.exports = {
      destroy: function (err, cb) {
        var _this = this,
          readableDestroyed =
            this._readableState && this._readableState.destroyed,
          writableDestroyed =
            this._writableState && this._writableState.destroyed;
        return readableDestroyed || writableDestroyed
          ? (cb
              ? cb(err)
              : err &&
                (this._writableState
                  ? this._writableState.errorEmitted ||
                    ((this._writableState.errorEmitted = !0),
                    process.nextTick(emitErrorNT, this, err))
                  : process.nextTick(emitErrorNT, this, err)),
            this)
          : (this._readableState && (this._readableState.destroyed = !0),
            this._writableState && (this._writableState.destroyed = !0),
            this._destroy(err || null, function (err) {
              !cb && err
                ? _this._writableState
                  ? _this._writableState.errorEmitted
                    ? process.nextTick(emitCloseNT, _this)
                    : ((_this._writableState.errorEmitted = !0),
                      process.nextTick(emitErrorAndCloseNT, _this, err))
                  : process.nextTick(emitErrorAndCloseNT, _this, err)
                : cb
                ? (process.nextTick(emitCloseNT, _this), cb(err))
                : process.nextTick(emitCloseNT, _this);
            }),
            this);
      },
      undestroy: function () {
        this._readableState &&
          ((this._readableState.destroyed = !1),
          (this._readableState.reading = !1),
          (this._readableState.ended = !1),
          (this._readableState.endEmitted = !1)),
          this._writableState &&
            ((this._writableState.destroyed = !1),
            (this._writableState.ended = !1),
            (this._writableState.ending = !1),
            (this._writableState.finalCalled = !1),
            (this._writableState.prefinished = !1),
            (this._writableState.finished = !1),
            (this._writableState.errorEmitted = !1));
      },
      errorOrDestroy: function (stream, err) {
        var rState = stream._readableState,
          wState = stream._writableState;
        (rState && rState.autoDestroy) || (wState && wState.autoDestroy)
          ? stream.destroy(err)
          : stream.emit("error", err);
      },
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var ERR_INVALID_OPT_VALUE =
      __webpack_require__(11).codes.ERR_INVALID_OPT_VALUE;
    module.exports = {
      getHighWaterMark: function (state, options, duplexKey, isDuplex) {
        var hwm = (function (options, isDuplex, duplexKey) {
          return null != options.highWaterMark
            ? options.highWaterMark
            : isDuplex
            ? options[duplexKey]
            : null;
        })(options, isDuplex, duplexKey);
        if (null != hwm) {
          if (!isFinite(hwm) || Math.floor(hwm) !== hwm || hwm < 0)
            throw new ERR_INVALID_OPT_VALUE(
              isDuplex ? duplexKey : "highWaterMark",
              hwm
            );
          return Math.floor(hwm);
        }
        return state.objectMode ? 16 : 16384;
      },
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function CorkedRequest(state) {
      var _this = this;
      (this.next = null),
        (this.entry = null),
        (this.finish = function () {
          !(function (corkReq, state, err) {
            var entry = corkReq.entry;
            corkReq.entry = null;
            for (; entry; ) {
              var cb = entry.callback;
              state.pendingcb--, cb(err), (entry = entry.next);
            }
            state.corkedRequestsFree.next = corkReq;
          })(_this, state);
        });
    }
    var Duplex;
    (module.exports = Writable), (Writable.WritableState = WritableState);
    var internalUtil = { deprecate: __webpack_require__(32) },
      Stream = __webpack_require__(62),
      Buffer = __webpack_require__(7).Buffer,
      OurUint8Array = global.Uint8Array || function () {};
    var realHasInstance,
      destroyImpl = __webpack_require__(63),
      getHighWaterMark = __webpack_require__(64).getHighWaterMark,
      _require$codes = __webpack_require__(11).codes,
      ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
      ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
      ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
      ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
      ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
      ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING,
      errorOrDestroy = destroyImpl.errorOrDestroy;
    function nop() {}
    function WritableState(options, stream, isDuplex) {
      (Duplex = Duplex || __webpack_require__(15)),
        (options = options || {}),
        "boolean" != typeof isDuplex && (isDuplex = stream instanceof Duplex),
        (this.objectMode = !!options.objectMode),
        isDuplex &&
          (this.objectMode = this.objectMode || !!options.writableObjectMode),
        (this.highWaterMark = getHighWaterMark(
          this,
          options,
          "writableHighWaterMark",
          isDuplex
        )),
        (this.finalCalled = !1),
        (this.needDrain = !1),
        (this.ending = !1),
        (this.ended = !1),
        (this.finished = !1),
        (this.destroyed = !1);
      var noDecode = !1 === options.decodeStrings;
      (this.decodeStrings = !noDecode),
        (this.defaultEncoding = options.defaultEncoding || "utf8"),
        (this.length = 0),
        (this.writing = !1),
        (this.corked = 0),
        (this.sync = !0),
        (this.bufferProcessing = !1),
        (this.onwrite = function (er) {
          !(function (stream, er) {
            var state = stream._writableState,
              sync = state.sync,
              cb = state.writecb;
            if ("function" != typeof cb) throw new ERR_MULTIPLE_CALLBACK();
            if (
              ((function (state) {
                (state.writing = !1),
                  (state.writecb = null),
                  (state.length -= state.writelen),
                  (state.writelen = 0);
              })(state),
              er)
            )
              !(function (stream, state, sync, er, cb) {
                --state.pendingcb,
                  sync
                    ? (process.nextTick(cb, er),
                      process.nextTick(finishMaybe, stream, state),
                      (stream._writableState.errorEmitted = !0),
                      errorOrDestroy(stream, er))
                    : (cb(er),
                      (stream._writableState.errorEmitted = !0),
                      errorOrDestroy(stream, er),
                      finishMaybe(stream, state));
              })(stream, state, sync, er, cb);
            else {
              var finished = needFinish(state) || stream.destroyed;
              finished ||
                state.corked ||
                state.bufferProcessing ||
                !state.bufferedRequest ||
                clearBuffer(stream, state),
                sync
                  ? process.nextTick(afterWrite, stream, state, finished, cb)
                  : afterWrite(stream, state, finished, cb);
            }
          })(stream, er);
        }),
        (this.writecb = null),
        (this.writelen = 0),
        (this.bufferedRequest = null),
        (this.lastBufferedRequest = null),
        (this.pendingcb = 0),
        (this.prefinished = !1),
        (this.errorEmitted = !1),
        (this.emitClose = !1 !== options.emitClose),
        (this.autoDestroy = !!options.autoDestroy),
        (this.bufferedRequestCount = 0),
        (this.corkedRequestsFree = new CorkedRequest(this));
    }
    function Writable(options) {
      var isDuplex =
        this instanceof (Duplex = Duplex || __webpack_require__(15));
      if (!isDuplex && !realHasInstance.call(Writable, this))
        return new Writable(options);
      (this._writableState = new WritableState(options, this, isDuplex)),
        (this.writable = !0),
        options &&
          ("function" == typeof options.write && (this._write = options.write),
          "function" == typeof options.writev &&
            (this._writev = options.writev),
          "function" == typeof options.destroy &&
            (this._destroy = options.destroy),
          "function" == typeof options.final && (this._final = options.final)),
        Stream.call(this);
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      (state.writelen = len),
        (state.writecb = cb),
        (state.writing = !0),
        (state.sync = !0),
        state.destroyed
          ? state.onwrite(new ERR_STREAM_DESTROYED("write"))
          : writev
          ? stream._writev(chunk, state.onwrite)
          : stream._write(chunk, encoding, state.onwrite),
        (state.sync = !1);
    }
    function afterWrite(stream, state, finished, cb) {
      finished ||
        (function (stream, state) {
          0 === state.length &&
            state.needDrain &&
            ((state.needDrain = !1), stream.emit("drain"));
        })(stream, state),
        state.pendingcb--,
        cb(),
        finishMaybe(stream, state);
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = !0;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state.bufferedRequestCount,
          buffer = new Array(l),
          holder = state.corkedRequestsFree;
        holder.entry = entry;
        for (var count = 0, allBuffers = !0; entry; )
          (buffer[count] = entry),
            entry.isBuf || (allBuffers = !1),
            (entry = entry.next),
            (count += 1);
        (buffer.allBuffers = allBuffers),
          doWrite(stream, state, !0, state.length, buffer, "", holder.finish),
          state.pendingcb++,
          (state.lastBufferedRequest = null),
          holder.next
            ? ((state.corkedRequestsFree = holder.next), (holder.next = null))
            : (state.corkedRequestsFree = new CorkedRequest(state)),
          (state.bufferedRequestCount = 0);
      } else {
        for (; entry; ) {
          var chunk = entry.chunk,
            encoding = entry.encoding,
            cb = entry.callback;
          if (
            (doWrite(
              stream,
              state,
              !1,
              state.objectMode ? 1 : chunk.length,
              chunk,
              encoding,
              cb
            ),
            (entry = entry.next),
            state.bufferedRequestCount--,
            state.writing)
          )
            break;
        }
        null === entry && (state.lastBufferedRequest = null);
      }
      (state.bufferedRequest = entry), (state.bufferProcessing = !1);
    }
    function needFinish(state) {
      return (
        state.ending &&
        0 === state.length &&
        null === state.bufferedRequest &&
        !state.finished &&
        !state.writing
      );
    }
    function callFinal(stream, state) {
      stream._final(function (err) {
        state.pendingcb--,
          err && errorOrDestroy(stream, err),
          (state.prefinished = !0),
          stream.emit("prefinish"),
          finishMaybe(stream, state);
      });
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (
        need &&
        ((function (stream, state) {
          state.prefinished ||
            state.finalCalled ||
            ("function" != typeof stream._final || state.destroyed
              ? ((state.prefinished = !0), stream.emit("prefinish"))
              : (state.pendingcb++,
                (state.finalCalled = !0),
                process.nextTick(callFinal, stream, state)));
        })(stream, state),
        0 === state.pendingcb &&
          ((state.finished = !0), stream.emit("finish"), state.autoDestroy))
      ) {
        var rState = stream._readableState;
        (!rState || (rState.autoDestroy && rState.endEmitted)) &&
          stream.destroy();
      }
      return need;
    }
    __webpack_require__(2)(Writable, Stream),
      (WritableState.prototype.getBuffer = function () {
        for (var current = this.bufferedRequest, out = []; current; )
          out.push(current), (current = current.next);
        return out;
      }),
      (function () {
        try {
          Object.defineProperty(WritableState.prototype, "buffer", {
            get: internalUtil.deprecate(
              function () {
                return this.getBuffer();
              },
              "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.",
              "DEP0003"
            ),
          });
        } catch (_) {}
      })(),
      "function" == typeof Symbol &&
      Symbol.hasInstance &&
      "function" == typeof Function.prototype[Symbol.hasInstance]
        ? ((realHasInstance = Function.prototype[Symbol.hasInstance]),
          Object.defineProperty(Writable, Symbol.hasInstance, {
            value: function (object) {
              return (
                !!realHasInstance.call(this, object) ||
                (this === Writable &&
                  object &&
                  object._writableState instanceof WritableState)
              );
            },
          }))
        : (realHasInstance = function (object) {
            return object instanceof this;
          }),
      (Writable.prototype.pipe = function () {
        errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
      }),
      (Writable.prototype.write = function (chunk, encoding, cb) {
        var obj,
          state = this._writableState,
          ret = !1,
          isBuf =
            !state.objectMode &&
            ((obj = chunk),
            Buffer.isBuffer(obj) || obj instanceof OurUint8Array);
        return (
          isBuf &&
            !Buffer.isBuffer(chunk) &&
            (chunk = (function (chunk) {
              return Buffer.from(chunk);
            })(chunk)),
          "function" == typeof encoding && ((cb = encoding), (encoding = null)),
          isBuf
            ? (encoding = "buffer")
            : encoding || (encoding = state.defaultEncoding),
          "function" != typeof cb && (cb = nop),
          state.ending
            ? (function (stream, cb) {
                var er = new ERR_STREAM_WRITE_AFTER_END();
                errorOrDestroy(stream, er), process.nextTick(cb, er);
              })(this, cb)
            : (isBuf ||
                (function (stream, state, chunk, cb) {
                  var er;
                  return (
                    null === chunk
                      ? (er = new ERR_STREAM_NULL_VALUES())
                      : "string" == typeof chunk ||
                        state.objectMode ||
                        (er = new ERR_INVALID_ARG_TYPE(
                          "chunk",
                          ["string", "Buffer"],
                          chunk
                        )),
                    !er ||
                      (errorOrDestroy(stream, er), process.nextTick(cb, er), !1)
                  );
                })(this, state, chunk, cb)) &&
              (state.pendingcb++,
              (ret = (function (stream, state, isBuf, chunk, encoding, cb) {
                if (!isBuf) {
                  var newChunk = (function (state, chunk, encoding) {
                    state.objectMode ||
                      !1 === state.decodeStrings ||
                      "string" != typeof chunk ||
                      (chunk = Buffer.from(chunk, encoding));
                    return chunk;
                  })(state, chunk, encoding);
                  chunk !== newChunk &&
                    ((isBuf = !0), (encoding = "buffer"), (chunk = newChunk));
                }
                var len = state.objectMode ? 1 : chunk.length;
                state.length += len;
                var ret = state.length < state.highWaterMark;
                ret || (state.needDrain = !0);
                if (state.writing || state.corked) {
                  var last = state.lastBufferedRequest;
                  (state.lastBufferedRequest = {
                    chunk: chunk,
                    encoding: encoding,
                    isBuf: isBuf,
                    callback: cb,
                    next: null,
                  }),
                    last
                      ? (last.next = state.lastBufferedRequest)
                      : (state.bufferedRequest = state.lastBufferedRequest),
                    (state.bufferedRequestCount += 1);
                } else doWrite(stream, state, !1, len, chunk, encoding, cb);
                return ret;
              })(this, state, isBuf, chunk, encoding, cb))),
          ret
        );
      }),
      (Writable.prototype.cork = function () {
        this._writableState.corked++;
      }),
      (Writable.prototype.uncork = function () {
        var state = this._writableState;
        state.corked &&
          (state.corked--,
          state.writing ||
            state.corked ||
            state.bufferProcessing ||
            !state.bufferedRequest ||
            clearBuffer(this, state));
      }),
      (Writable.prototype.setDefaultEncoding = function (encoding) {
        if (
          ("string" == typeof encoding && (encoding = encoding.toLowerCase()),
          !(
            [
              "hex",
              "utf8",
              "utf-8",
              "ascii",
              "binary",
              "base64",
              "ucs2",
              "ucs-2",
              "utf16le",
              "utf-16le",
              "raw",
            ].indexOf((encoding + "").toLowerCase()) > -1
          ))
        )
          throw new ERR_UNKNOWN_ENCODING(encoding);
        return (this._writableState.defaultEncoding = encoding), this;
      }),
      Object.defineProperty(Writable.prototype, "writableBuffer", {
        enumerable: !1,
        get: function () {
          return this._writableState && this._writableState.getBuffer();
        },
      }),
      Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
        enumerable: !1,
        get: function () {
          return this._writableState.highWaterMark;
        },
      }),
      (Writable.prototype._write = function (chunk, encoding, cb) {
        cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
      }),
      (Writable.prototype._writev = null),
      (Writable.prototype.end = function (chunk, encoding, cb) {
        var state = this._writableState;
        return (
          "function" == typeof chunk
            ? ((cb = chunk), (chunk = null), (encoding = null))
            : "function" == typeof encoding &&
              ((cb = encoding), (encoding = null)),
          null != chunk && this.write(chunk, encoding),
          state.corked && ((state.corked = 1), this.uncork()),
          state.ending ||
            (function (stream, state, cb) {
              (state.ending = !0),
                finishMaybe(stream, state),
                cb &&
                  (state.finished
                    ? process.nextTick(cb)
                    : stream.once("finish", cb));
              (state.ended = !0), (stream.writable = !1);
            })(this, state, cb),
          this
        );
      }),
      Object.defineProperty(Writable.prototype, "writableLength", {
        enumerable: !1,
        get: function () {
          return this._writableState.length;
        },
      }),
      Object.defineProperty(Writable.prototype, "destroyed", {
        enumerable: !1,
        get: function () {
          return (
            void 0 !== this._writableState && this._writableState.destroyed
          );
        },
        set: function (value) {
          this._writableState && (this._writableState.destroyed = value);
        },
      }),
      (Writable.prototype.destroy = destroyImpl.destroy),
      (Writable.prototype._undestroy = destroyImpl.undestroy),
      (Writable.prototype._destroy = function (err, cb) {
        cb(err);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    module.exports = Transform;
    var _require$codes = __webpack_require__(11).codes,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
      ERR_TRANSFORM_ALREADY_TRANSFORMING =
        _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
      ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0,
      Duplex = __webpack_require__(15);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = !1;
      var cb = ts.writecb;
      if (null === cb) return this.emit("error", new ERR_MULTIPLE_CALLBACK());
      (ts.writechunk = null),
        (ts.writecb = null),
        null != data && this.push(data),
        cb(er);
      var rs = this._readableState;
      (rs.reading = !1),
        (rs.needReadable || rs.length < rs.highWaterMark) &&
          this._read(rs.highWaterMark);
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options),
        (this._transformState = {
          afterTransform: afterTransform.bind(this),
          needTransform: !1,
          transforming: !1,
          writecb: null,
          writechunk: null,
          writeencoding: null,
        }),
        (this._readableState.needReadable = !0),
        (this._readableState.sync = !1),
        options &&
          ("function" == typeof options.transform &&
            (this._transform = options.transform),
          "function" == typeof options.flush && (this._flush = options.flush)),
        this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      "function" != typeof this._flush || this._readableState.destroyed
        ? done(this, null, null)
        : this._flush(function (er, data) {
            done(_this, er, data);
          });
    }
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      if ((null != data && stream.push(data), stream._writableState.length))
        throw new ERR_TRANSFORM_WITH_LENGTH_0();
      if (stream._transformState.transforming)
        throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
      return stream.push(null);
    }
    __webpack_require__(2)(Transform, Duplex),
      (Transform.prototype.push = function (chunk, encoding) {
        return (
          (this._transformState.needTransform = !1),
          Duplex.prototype.push.call(this, chunk, encoding)
        );
      }),
      (Transform.prototype._transform = function (chunk, encoding, cb) {
        cb(new ERR_METHOD_NOT_IMPLEMENTED("_transform()"));
      }),
      (Transform.prototype._write = function (chunk, encoding, cb) {
        var ts = this._transformState;
        if (
          ((ts.writecb = cb),
          (ts.writechunk = chunk),
          (ts.writeencoding = encoding),
          !ts.transforming)
        ) {
          var rs = this._readableState;
          (ts.needTransform ||
            rs.needReadable ||
            rs.length < rs.highWaterMark) &&
            this._read(rs.highWaterMark);
        }
      }),
      (Transform.prototype._read = function (n) {
        var ts = this._transformState;
        null === ts.writechunk || ts.transforming
          ? (ts.needTransform = !0)
          : ((ts.transforming = !0),
            this._transform(
              ts.writechunk,
              ts.writeencoding,
              ts.afterTransform
            ));
      }),
      (Transform.prototype._destroy = function (err, cb) {
        Duplex.prototype._destroy.call(this, err, function (err2) {
          cb(err2);
        });
      });
  },
  function (module, exports, __webpack_require__) {
    module.exports = function (env) {
      function createDebug(namespace) {
        let prevTime,
          namespacesCache,
          enabledCache,
          enableOverride = null;
        function debug(...args) {
          if (!debug.enabled) return;
          const self = debug,
            curr = Number(new Date()),
            ms = curr - (prevTime || curr);
          (self.diff = ms),
            (self.prev = prevTime),
            (self.curr = curr),
            (prevTime = curr),
            (args[0] = createDebug.coerce(args[0])),
            "string" != typeof args[0] && args.unshift("%O");
          let index = 0;
          (args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if ("%%" === match) return "%";
            index++;
            const formatter = createDebug.formatters[format];
            if ("function" == typeof formatter) {
              const val = args[index];
              (match = formatter.call(self, val)),
                args.splice(index, 1),
                index--;
            }
            return match;
          })),
            createDebug.formatArgs.call(self, args);
          (self.log || createDebug.log).apply(self, args);
        }
        return (
          (debug.namespace = namespace),
          (debug.useColors = createDebug.useColors()),
          (debug.color = createDebug.selectColor(namespace)),
          (debug.extend = extend),
          (debug.destroy = createDebug.destroy),
          Object.defineProperty(debug, "enabled", {
            enumerable: !0,
            configurable: !1,
            get: () =>
              null !== enableOverride
                ? enableOverride
                : (namespacesCache !== createDebug.namespaces &&
                    ((namespacesCache = createDebug.namespaces),
                    (enabledCache = createDebug.enabled(namespace))),
                  enabledCache),
            set: (v) => {
              enableOverride = v;
            },
          }),
          "function" == typeof createDebug.init && createDebug.init(debug),
          debug
        );
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(
          this.namespace + (void 0 === delimiter ? ":" : delimiter) + namespace
        );
        return (newDebug.log = this.log), newDebug;
      }
      function toNamespace(regexp) {
        return regexp
          .toString()
          .substring(2, regexp.toString().length - 2)
          .replace(/\.\*\?$/, "*");
      }
      return (
        (createDebug.debug = createDebug),
        (createDebug.default = createDebug),
        (createDebug.coerce = function (val) {
          if (val instanceof Error) return val.stack || val.message;
          return val;
        }),
        (createDebug.disable = function () {
          const namespaces = [
            ...createDebug.names.map(toNamespace),
            ...createDebug.skips
              .map(toNamespace)
              .map((namespace) => "-" + namespace),
          ].join(",");
          return createDebug.enable(""), namespaces;
        }),
        (createDebug.enable = function (namespaces) {
          let i;
          createDebug.save(namespaces),
            (createDebug.namespaces = namespaces),
            (createDebug.names = []),
            (createDebug.skips = []);
          const split = ("string" == typeof namespaces ? namespaces : "").split(
              /[\s,]+/
            ),
            len = split.length;
          for (i = 0; i < len; i++)
            split[i] &&
              ("-" === (namespaces = split[i].replace(/\*/g, ".*?"))[0]
                ? createDebug.skips.push(
                    new RegExp("^" + namespaces.slice(1) + "$")
                  )
                : createDebug.names.push(new RegExp("^" + namespaces + "$")));
        }),
        (createDebug.enabled = function (name) {
          if ("*" === name[name.length - 1]) return !0;
          let i, len;
          for (i = 0, len = createDebug.skips.length; i < len; i++)
            if (createDebug.skips[i].test(name)) return !1;
          for (i = 0, len = createDebug.names.length; i < len; i++)
            if (createDebug.names[i].test(name)) return !0;
          return !1;
        }),
        (createDebug.humanize = __webpack_require__(169)),
        (createDebug.destroy = function () {
          console.warn(
            "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
          );
        }),
        Object.keys(env).forEach((key) => {
          createDebug[key] = env[key];
        }),
        (createDebug.names = []),
        (createDebug.skips = []),
        (createDebug.formatters = {}),
        (createDebug.selectColor = function (namespace) {
          let hash = 0;
          for (let i = 0; i < namespace.length; i++)
            (hash = (hash << 5) - hash + namespace.charCodeAt(i)), (hash |= 0);
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }),
        createDebug.enable(createDebug.load()),
        createDebug
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var Duplex;
    (module.exports = Readable), (Readable.ReadableState = ReadableState);
    __webpack_require__(22).EventEmitter;
    var EElistenerCount = function (emitter, type) {
        return emitter.listeners(type).length;
      },
      Stream = __webpack_require__(69),
      Buffer = __webpack_require__(7).Buffer,
      OurUint8Array = global.Uint8Array || function () {};
    var debug,
      debugUtil = __webpack_require__(4);
    debug =
      debugUtil && debugUtil.debuglog
        ? debugUtil.debuglog("stream")
        : function () {};
    var StringDecoder,
      createReadableStreamAsyncIterator,
      from,
      BufferList = __webpack_require__(176),
      destroyImpl = __webpack_require__(70),
      getHighWaterMark = __webpack_require__(71).getHighWaterMark,
      _require$codes = __webpack_require__(12).codes,
      ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
      ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_STREAM_UNSHIFT_AFTER_END_EVENT =
        _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    __webpack_require__(2)(Readable, Stream);
    var errorOrDestroy = destroyImpl.errorOrDestroy,
      kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function ReadableState(options, stream, isDuplex) {
      (Duplex = Duplex || __webpack_require__(17)),
        (options = options || {}),
        "boolean" != typeof isDuplex && (isDuplex = stream instanceof Duplex),
        (this.objectMode = !!options.objectMode),
        isDuplex &&
          (this.objectMode = this.objectMode || !!options.readableObjectMode),
        (this.highWaterMark = getHighWaterMark(
          this,
          options,
          "readableHighWaterMark",
          isDuplex
        )),
        (this.buffer = new BufferList()),
        (this.length = 0),
        (this.pipes = null),
        (this.pipesCount = 0),
        (this.flowing = null),
        (this.ended = !1),
        (this.endEmitted = !1),
        (this.reading = !1),
        (this.sync = !0),
        (this.needReadable = !1),
        (this.emittedReadable = !1),
        (this.readableListening = !1),
        (this.resumeScheduled = !1),
        (this.paused = !0),
        (this.emitClose = !1 !== options.emitClose),
        (this.autoDestroy = !!options.autoDestroy),
        (this.destroyed = !1),
        (this.defaultEncoding = options.defaultEncoding || "utf8"),
        (this.awaitDrain = 0),
        (this.readingMore = !1),
        (this.decoder = null),
        (this.encoding = null),
        options.encoding &&
          (StringDecoder ||
            (StringDecoder = __webpack_require__(16).StringDecoder),
          (this.decoder = new StringDecoder(options.encoding)),
          (this.encoding = options.encoding));
    }
    function Readable(options) {
      if (
        ((Duplex = Duplex || __webpack_require__(17)),
        !(this instanceof Readable))
      )
        return new Readable(options);
      var isDuplex = this instanceof Duplex;
      (this._readableState = new ReadableState(options, this, isDuplex)),
        (this.readable = !0),
        options &&
          ("function" == typeof options.read && (this._read = options.read),
          "function" == typeof options.destroy &&
            (this._destroy = options.destroy)),
        Stream.call(this);
    }
    function readableAddChunk(
      stream,
      chunk,
      encoding,
      addToFront,
      skipChunkCheck
    ) {
      debug("readableAddChunk", chunk);
      var er,
        state = stream._readableState;
      if (null === chunk)
        (state.reading = !1),
          (function (stream, state) {
            if ((debug("onEofChunk"), state.ended)) return;
            if (state.decoder) {
              var chunk = state.decoder.end();
              chunk &&
                chunk.length &&
                (state.buffer.push(chunk),
                (state.length += state.objectMode ? 1 : chunk.length));
            }
            (state.ended = !0),
              state.sync
                ? emitReadable(stream)
                : ((state.needReadable = !1),
                  state.emittedReadable ||
                    ((state.emittedReadable = !0), emitReadable_(stream)));
          })(stream, state);
      else if (
        (skipChunkCheck ||
          (er = (function (state, chunk) {
            var er;
            (obj = chunk),
              Buffer.isBuffer(obj) ||
                obj instanceof OurUint8Array ||
                "string" == typeof chunk ||
                void 0 === chunk ||
                state.objectMode ||
                (er = new ERR_INVALID_ARG_TYPE(
                  "chunk",
                  ["string", "Buffer", "Uint8Array"],
                  chunk
                ));
            var obj;
            return er;
          })(state, chunk)),
        er)
      )
        errorOrDestroy(stream, er);
      else if (state.objectMode || (chunk && chunk.length > 0))
        if (
          ("string" == typeof chunk ||
            state.objectMode ||
            Object.getPrototypeOf(chunk) === Buffer.prototype ||
            (chunk = (function (chunk) {
              return Buffer.from(chunk);
            })(chunk)),
          addToFront)
        )
          state.endEmitted
            ? errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT())
            : addChunk(stream, state, chunk, !0);
        else if (state.ended)
          errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
        else {
          if (state.destroyed) return !1;
          (state.reading = !1),
            state.decoder && !encoding
              ? ((chunk = state.decoder.write(chunk)),
                state.objectMode || 0 !== chunk.length
                  ? addChunk(stream, state, chunk, !1)
                  : maybeReadMore(stream, state))
              : addChunk(stream, state, chunk, !1);
        }
      else addToFront || ((state.reading = !1), maybeReadMore(stream, state));
      return (
        !state.ended &&
        (state.length < state.highWaterMark || 0 === state.length)
      );
    }
    function addChunk(stream, state, chunk, addToFront) {
      state.flowing && 0 === state.length && !state.sync
        ? ((state.awaitDrain = 0), stream.emit("data", chunk))
        : ((state.length += state.objectMode ? 1 : chunk.length),
          addToFront ? state.buffer.unshift(chunk) : state.buffer.push(chunk),
          state.needReadable && emitReadable(stream)),
        maybeReadMore(stream, state);
    }
    Object.defineProperty(Readable.prototype, "destroyed", {
      enumerable: !1,
      get: function () {
        return void 0 !== this._readableState && this._readableState.destroyed;
      },
      set: function (value) {
        this._readableState && (this._readableState.destroyed = value);
      },
    }),
      (Readable.prototype.destroy = destroyImpl.destroy),
      (Readable.prototype._undestroy = destroyImpl.undestroy),
      (Readable.prototype._destroy = function (err, cb) {
        cb(err);
      }),
      (Readable.prototype.push = function (chunk, encoding) {
        var skipChunkCheck,
          state = this._readableState;
        return (
          state.objectMode
            ? (skipChunkCheck = !0)
            : "string" == typeof chunk &&
              ((encoding = encoding || state.defaultEncoding) !==
                state.encoding &&
                ((chunk = Buffer.from(chunk, encoding)), (encoding = "")),
              (skipChunkCheck = !0)),
          readableAddChunk(this, chunk, encoding, !1, skipChunkCheck)
        );
      }),
      (Readable.prototype.unshift = function (chunk) {
        return readableAddChunk(this, chunk, null, !0, !1);
      }),
      (Readable.prototype.isPaused = function () {
        return !1 === this._readableState.flowing;
      }),
      (Readable.prototype.setEncoding = function (enc) {
        StringDecoder ||
          (StringDecoder = __webpack_require__(16).StringDecoder);
        var decoder = new StringDecoder(enc);
        (this._readableState.decoder = decoder),
          (this._readableState.encoding = this._readableState.decoder.encoding);
        for (
          var p = this._readableState.buffer.head, content = "";
          null !== p;

        )
          (content += decoder.write(p.data)), (p = p.next);
        return (
          this._readableState.buffer.clear(),
          "" !== content && this._readableState.buffer.push(content),
          (this._readableState.length = content.length),
          this
        );
      });
    function howMuchToRead(n, state) {
      return n <= 0 || (0 === state.length && state.ended)
        ? 0
        : state.objectMode
        ? 1
        : n != n
        ? state.flowing && state.length
          ? state.buffer.head.data.length
          : state.length
        : (n > state.highWaterMark &&
            (state.highWaterMark = (function (n) {
              return (
                n >= 1073741824
                  ? (n = 1073741824)
                  : (n--,
                    (n |= n >>> 1),
                    (n |= n >>> 2),
                    (n |= n >>> 4),
                    (n |= n >>> 8),
                    (n |= n >>> 16),
                    n++),
                n
              );
            })(n)),
          n <= state.length
            ? n
            : state.ended
            ? state.length
            : ((state.needReadable = !0), 0));
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      debug("emitReadable", state.needReadable, state.emittedReadable),
        (state.needReadable = !1),
        state.emittedReadable ||
          (debug("emitReadable", state.flowing),
          (state.emittedReadable = !0),
          process.nextTick(emitReadable_, stream));
    }
    function emitReadable_(stream) {
      var state = stream._readableState;
      debug("emitReadable_", state.destroyed, state.length, state.ended),
        state.destroyed ||
          (!state.length && !state.ended) ||
          (stream.emit("readable"), (state.emittedReadable = !1)),
        (state.needReadable =
          !state.flowing &&
          !state.ended &&
          state.length <= state.highWaterMark),
        flow(stream);
    }
    function maybeReadMore(stream, state) {
      state.readingMore ||
        ((state.readingMore = !0),
        process.nextTick(maybeReadMore_, stream, state));
    }
    function maybeReadMore_(stream, state) {
      for (
        ;
        !state.reading &&
        !state.ended &&
        (state.length < state.highWaterMark ||
          (state.flowing && 0 === state.length));

      ) {
        var len = state.length;
        if (
          (debug("maybeReadMore read 0"), stream.read(0), len === state.length)
        )
          break;
      }
      state.readingMore = !1;
    }
    function updateReadableListening(self) {
      var state = self._readableState;
      (state.readableListening = self.listenerCount("readable") > 0),
        state.resumeScheduled && !state.paused
          ? (state.flowing = !0)
          : self.listenerCount("data") > 0 && self.resume();
    }
    function nReadingNextTick(self) {
      debug("readable nexttick read 0"), self.read(0);
    }
    function resume_(stream, state) {
      debug("resume", state.reading),
        state.reading || stream.read(0),
        (state.resumeScheduled = !1),
        stream.emit("resume"),
        flow(stream),
        state.flowing && !state.reading && stream.read(0);
    }
    function flow(stream) {
      var state = stream._readableState;
      for (
        debug("flow", state.flowing);
        state.flowing && null !== stream.read();

      );
    }
    function fromList(n, state) {
      return 0 === state.length
        ? null
        : (state.objectMode
            ? (ret = state.buffer.shift())
            : !n || n >= state.length
            ? ((ret = state.decoder
                ? state.buffer.join("")
                : 1 === state.buffer.length
                ? state.buffer.first()
                : state.buffer.concat(state.length)),
              state.buffer.clear())
            : (ret = state.buffer.consume(n, state.decoder)),
          ret);
      var ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      debug("endReadable", state.endEmitted),
        state.endEmitted ||
          ((state.ended = !0), process.nextTick(endReadableNT, state, stream));
    }
    function endReadableNT(state, stream) {
      if (
        (debug("endReadableNT", state.endEmitted, state.length),
        !state.endEmitted &&
          0 === state.length &&
          ((state.endEmitted = !0),
          (stream.readable = !1),
          stream.emit("end"),
          state.autoDestroy))
      ) {
        var wState = stream._writableState;
        (!wState || (wState.autoDestroy && wState.finished)) &&
          stream.destroy();
      }
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) if (xs[i] === x) return i;
      return -1;
    }
    (Readable.prototype.read = function (n) {
      debug("read", n), (n = parseInt(n, 10));
      var state = this._readableState,
        nOrig = n;
      if (
        (0 !== n && (state.emittedReadable = !1),
        0 === n &&
          state.needReadable &&
          ((0 !== state.highWaterMark
            ? state.length >= state.highWaterMark
            : state.length > 0) ||
            state.ended))
      )
        return (
          debug("read: emitReadable", state.length, state.ended),
          0 === state.length && state.ended
            ? endReadable(this)
            : emitReadable(this),
          null
        );
      if (0 === (n = howMuchToRead(n, state)) && state.ended)
        return 0 === state.length && endReadable(this), null;
      var ret,
        doRead = state.needReadable;
      return (
        debug("need readable", doRead),
        (0 === state.length || state.length - n < state.highWaterMark) &&
          debug("length less than watermark", (doRead = !0)),
        state.ended || state.reading
          ? debug("reading or ended", (doRead = !1))
          : doRead &&
            (debug("do read"),
            (state.reading = !0),
            (state.sync = !0),
            0 === state.length && (state.needReadable = !0),
            this._read(state.highWaterMark),
            (state.sync = !1),
            state.reading || (n = howMuchToRead(nOrig, state))),
        null === (ret = n > 0 ? fromList(n, state) : null)
          ? ((state.needReadable = state.length <= state.highWaterMark),
            (n = 0))
          : ((state.length -= n), (state.awaitDrain = 0)),
        0 === state.length &&
          (state.ended || (state.needReadable = !0),
          nOrig !== n && state.ended && endReadable(this)),
        null !== ret && this.emit("data", ret),
        ret
      );
    }),
      (Readable.prototype._read = function (n) {
        errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
      }),
      (Readable.prototype.pipe = function (dest, pipeOpts) {
        var src = this,
          state = this._readableState;
        switch (state.pipesCount) {
          case 0:
            state.pipes = dest;
            break;
          case 1:
            state.pipes = [state.pipes, dest];
            break;
          default:
            state.pipes.push(dest);
        }
        (state.pipesCount += 1),
          debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
        var endFn =
          (!pipeOpts || !1 !== pipeOpts.end) &&
          dest !== process.stdout &&
          dest !== process.stderr
            ? onend
            : unpipe;
        function onunpipe(readable, unpipeInfo) {
          debug("onunpipe"),
            readable === src &&
              unpipeInfo &&
              !1 === unpipeInfo.hasUnpiped &&
              ((unpipeInfo.hasUnpiped = !0),
              debug("cleanup"),
              dest.removeListener("close", onclose),
              dest.removeListener("finish", onfinish),
              dest.removeListener("drain", ondrain),
              dest.removeListener("error", onerror),
              dest.removeListener("unpipe", onunpipe),
              src.removeListener("end", onend),
              src.removeListener("end", unpipe),
              src.removeListener("data", ondata),
              (cleanedUp = !0),
              !state.awaitDrain ||
                (dest._writableState && !dest._writableState.needDrain) ||
                ondrain());
        }
        function onend() {
          debug("onend"), dest.end();
        }
        state.endEmitted ? process.nextTick(endFn) : src.once("end", endFn),
          dest.on("unpipe", onunpipe);
        var ondrain = (function (src) {
          return function () {
            var state = src._readableState;
            debug("pipeOnDrain", state.awaitDrain),
              state.awaitDrain && state.awaitDrain--,
              0 === state.awaitDrain &&
                EElistenerCount(src, "data") &&
                ((state.flowing = !0), flow(src));
          };
        })(src);
        dest.on("drain", ondrain);
        var cleanedUp = !1;
        function ondata(chunk) {
          debug("ondata");
          var ret = dest.write(chunk);
          debug("dest.write", ret),
            !1 === ret &&
              (((1 === state.pipesCount && state.pipes === dest) ||
                (state.pipesCount > 1 && -1 !== indexOf(state.pipes, dest))) &&
                !cleanedUp &&
                (debug("false write response, pause", state.awaitDrain),
                state.awaitDrain++),
              src.pause());
        }
        function onerror(er) {
          debug("onerror", er),
            unpipe(),
            dest.removeListener("error", onerror),
            0 === EElistenerCount(dest, "error") && errorOrDestroy(dest, er);
        }
        function onclose() {
          dest.removeListener("finish", onfinish), unpipe();
        }
        function onfinish() {
          debug("onfinish"), dest.removeListener("close", onclose), unpipe();
        }
        function unpipe() {
          debug("unpipe"), src.unpipe(dest);
        }
        return (
          src.on("data", ondata),
          (function (emitter, event, fn) {
            if ("function" == typeof emitter.prependListener)
              return emitter.prependListener(event, fn);
            emitter._events && emitter._events[event]
              ? Array.isArray(emitter._events[event])
                ? emitter._events[event].unshift(fn)
                : (emitter._events[event] = [fn, emitter._events[event]])
              : emitter.on(event, fn);
          })(dest, "error", onerror),
          dest.once("close", onclose),
          dest.once("finish", onfinish),
          dest.emit("pipe", src),
          state.flowing || (debug("pipe resume"), src.resume()),
          dest
        );
      }),
      (Readable.prototype.unpipe = function (dest) {
        var state = this._readableState,
          unpipeInfo = { hasUnpiped: !1 };
        if (0 === state.pipesCount) return this;
        if (1 === state.pipesCount)
          return (
            (dest && dest !== state.pipes) ||
              (dest || (dest = state.pipes),
              (state.pipes = null),
              (state.pipesCount = 0),
              (state.flowing = !1),
              dest && dest.emit("unpipe", this, unpipeInfo)),
            this
          );
        if (!dest) {
          var dests = state.pipes,
            len = state.pipesCount;
          (state.pipes = null), (state.pipesCount = 0), (state.flowing = !1);
          for (var i = 0; i < len; i++)
            dests[i].emit("unpipe", this, { hasUnpiped: !1 });
          return this;
        }
        var index = indexOf(state.pipes, dest);
        return (
          -1 === index ||
            (state.pipes.splice(index, 1),
            (state.pipesCount -= 1),
            1 === state.pipesCount && (state.pipes = state.pipes[0]),
            dest.emit("unpipe", this, unpipeInfo)),
          this
        );
      }),
      (Readable.prototype.on = function (ev, fn) {
        var res = Stream.prototype.on.call(this, ev, fn),
          state = this._readableState;
        return (
          "data" === ev
            ? ((state.readableListening = this.listenerCount("readable") > 0),
              !1 !== state.flowing && this.resume())
            : "readable" === ev &&
              (state.endEmitted ||
                state.readableListening ||
                ((state.readableListening = state.needReadable = !0),
                (state.flowing = !1),
                (state.emittedReadable = !1),
                debug("on readable", state.length, state.reading),
                state.length
                  ? emitReadable(this)
                  : state.reading || process.nextTick(nReadingNextTick, this))),
          res
        );
      }),
      (Readable.prototype.addListener = Readable.prototype.on),
      (Readable.prototype.removeListener = function (ev, fn) {
        var res = Stream.prototype.removeListener.call(this, ev, fn);
        return (
          "readable" === ev && process.nextTick(updateReadableListening, this),
          res
        );
      }),
      (Readable.prototype.removeAllListeners = function (ev) {
        var res = Stream.prototype.removeAllListeners.apply(this, arguments);
        return (
          ("readable" !== ev && void 0 !== ev) ||
            process.nextTick(updateReadableListening, this),
          res
        );
      }),
      (Readable.prototype.resume = function () {
        var state = this._readableState;
        return (
          state.flowing ||
            (debug("resume"),
            (state.flowing = !state.readableListening),
            (function (stream, state) {
              state.resumeScheduled ||
                ((state.resumeScheduled = !0),
                process.nextTick(resume_, stream, state));
            })(this, state)),
          (state.paused = !1),
          this
        );
      }),
      (Readable.prototype.pause = function () {
        return (
          debug("call pause flowing=%j", this._readableState.flowing),
          !1 !== this._readableState.flowing &&
            (debug("pause"),
            (this._readableState.flowing = !1),
            this.emit("pause")),
          (this._readableState.paused = !0),
          this
        );
      }),
      (Readable.prototype.wrap = function (stream) {
        var _this = this,
          state = this._readableState,
          paused = !1;
        for (var i in (stream.on("end", function () {
          if ((debug("wrapped end"), state.decoder && !state.ended)) {
            var chunk = state.decoder.end();
            chunk && chunk.length && _this.push(chunk);
          }
          _this.push(null);
        }),
        stream.on("data", function (chunk) {
          (debug("wrapped data"),
          state.decoder && (chunk = state.decoder.write(chunk)),
          state.objectMode && null == chunk) ||
            ((state.objectMode || (chunk && chunk.length)) &&
              (_this.push(chunk) || ((paused = !0), stream.pause())));
        }),
        stream))
          void 0 === this[i] &&
            "function" == typeof stream[i] &&
            (this[i] = (function (method) {
              return function () {
                return stream[method].apply(stream, arguments);
              };
            })(i));
        for (var n = 0; n < kProxyEvents.length; n++)
          stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
        return (
          (this._read = function (n) {
            debug("wrapped _read", n),
              paused && ((paused = !1), stream.resume());
          }),
          this
        );
      }),
      "function" == typeof Symbol &&
        (Readable.prototype[Symbol.asyncIterator] = function () {
          return (
            void 0 === createReadableStreamAsyncIterator &&
              (createReadableStreamAsyncIterator = __webpack_require__(177)),
            createReadableStreamAsyncIterator(this)
          );
        }),
      Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
        enumerable: !1,
        get: function () {
          return this._readableState.highWaterMark;
        },
      }),
      Object.defineProperty(Readable.prototype, "readableBuffer", {
        enumerable: !1,
        get: function () {
          return this._readableState && this._readableState.buffer;
        },
      }),
      Object.defineProperty(Readable.prototype, "readableFlowing", {
        enumerable: !1,
        get: function () {
          return this._readableState.flowing;
        },
        set: function (state) {
          this._readableState && (this._readableState.flowing = state);
        },
      }),
      (Readable._fromList = fromList),
      Object.defineProperty(Readable.prototype, "readableLength", {
        enumerable: !1,
        get: function () {
          return this._readableState.length;
        },
      }),
      "function" == typeof Symbol &&
        (Readable.from = function (iterable, opts) {
          return (
            void 0 === from && (from = __webpack_require__(178)),
            from(Readable, iterable, opts)
          );
        });
  },
  function (module, exports, __webpack_require__) {
    module.exports = __webpack_require__(6);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function emitErrorAndCloseNT(self, err) {
      emitErrorNT(self, err), emitCloseNT(self);
    }
    function emitCloseNT(self) {
      (self._writableState && !self._writableState.emitClose) ||
        (self._readableState && !self._readableState.emitClose) ||
        self.emit("close");
    }
    function emitErrorNT(self, err) {
      self.emit("error", err);
    }
    module.exports = {
      destroy: function (err, cb) {
        var _this = this,
          readableDestroyed =
            this._readableState && this._readableState.destroyed,
          writableDestroyed =
            this._writableState && this._writableState.destroyed;
        return readableDestroyed || writableDestroyed
          ? (cb
              ? cb(err)
              : err &&
                (this._writableState
                  ? this._writableState.errorEmitted ||
                    ((this._writableState.errorEmitted = !0),
                    process.nextTick(emitErrorNT, this, err))
                  : process.nextTick(emitErrorNT, this, err)),
            this)
          : (this._readableState && (this._readableState.destroyed = !0),
            this._writableState && (this._writableState.destroyed = !0),
            this._destroy(err || null, function (err) {
              !cb && err
                ? _this._writableState
                  ? _this._writableState.errorEmitted
                    ? process.nextTick(emitCloseNT, _this)
                    : ((_this._writableState.errorEmitted = !0),
                      process.nextTick(emitErrorAndCloseNT, _this, err))
                  : process.nextTick(emitErrorAndCloseNT, _this, err)
                : cb
                ? (process.nextTick(emitCloseNT, _this), cb(err))
                : process.nextTick(emitCloseNT, _this);
            }),
            this);
      },
      undestroy: function () {
        this._readableState &&
          ((this._readableState.destroyed = !1),
          (this._readableState.reading = !1),
          (this._readableState.ended = !1),
          (this._readableState.endEmitted = !1)),
          this._writableState &&
            ((this._writableState.destroyed = !1),
            (this._writableState.ended = !1),
            (this._writableState.ending = !1),
            (this._writableState.finalCalled = !1),
            (this._writableState.prefinished = !1),
            (this._writableState.finished = !1),
            (this._writableState.errorEmitted = !1));
      },
      errorOrDestroy: function (stream, err) {
        var rState = stream._readableState,
          wState = stream._writableState;
        (rState && rState.autoDestroy) || (wState && wState.autoDestroy)
          ? stream.destroy(err)
          : stream.emit("error", err);
      },
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var ERR_INVALID_OPT_VALUE =
      __webpack_require__(12).codes.ERR_INVALID_OPT_VALUE;
    module.exports = {
      getHighWaterMark: function (state, options, duplexKey, isDuplex) {
        var hwm = (function (options, isDuplex, duplexKey) {
          return null != options.highWaterMark
            ? options.highWaterMark
            : isDuplex
            ? options[duplexKey]
            : null;
        })(options, isDuplex, duplexKey);
        if (null != hwm) {
          if (!isFinite(hwm) || Math.floor(hwm) !== hwm || hwm < 0)
            throw new ERR_INVALID_OPT_VALUE(
              isDuplex ? duplexKey : "highWaterMark",
              hwm
            );
          return Math.floor(hwm);
        }
        return state.objectMode ? 16 : 16384;
      },
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function CorkedRequest(state) {
      var _this = this;
      (this.next = null),
        (this.entry = null),
        (this.finish = function () {
          !(function (corkReq, state, err) {
            var entry = corkReq.entry;
            corkReq.entry = null;
            for (; entry; ) {
              var cb = entry.callback;
              state.pendingcb--, cb(err), (entry = entry.next);
            }
            state.corkedRequestsFree.next = corkReq;
          })(_this, state);
        });
    }
    var Duplex;
    (module.exports = Writable), (Writable.WritableState = WritableState);
    var internalUtil = { deprecate: __webpack_require__(32) },
      Stream = __webpack_require__(69),
      Buffer = __webpack_require__(7).Buffer,
      OurUint8Array = global.Uint8Array || function () {};
    var realHasInstance,
      destroyImpl = __webpack_require__(70),
      getHighWaterMark = __webpack_require__(71).getHighWaterMark,
      _require$codes = __webpack_require__(12).codes,
      ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
      ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
      ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
      ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
      ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
      ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING,
      errorOrDestroy = destroyImpl.errorOrDestroy;
    function nop() {}
    function WritableState(options, stream, isDuplex) {
      (Duplex = Duplex || __webpack_require__(17)),
        (options = options || {}),
        "boolean" != typeof isDuplex && (isDuplex = stream instanceof Duplex),
        (this.objectMode = !!options.objectMode),
        isDuplex &&
          (this.objectMode = this.objectMode || !!options.writableObjectMode),
        (this.highWaterMark = getHighWaterMark(
          this,
          options,
          "writableHighWaterMark",
          isDuplex
        )),
        (this.finalCalled = !1),
        (this.needDrain = !1),
        (this.ending = !1),
        (this.ended = !1),
        (this.finished = !1),
        (this.destroyed = !1);
      var noDecode = !1 === options.decodeStrings;
      (this.decodeStrings = !noDecode),
        (this.defaultEncoding = options.defaultEncoding || "utf8"),
        (this.length = 0),
        (this.writing = !1),
        (this.corked = 0),
        (this.sync = !0),
        (this.bufferProcessing = !1),
        (this.onwrite = function (er) {
          !(function (stream, er) {
            var state = stream._writableState,
              sync = state.sync,
              cb = state.writecb;
            if ("function" != typeof cb) throw new ERR_MULTIPLE_CALLBACK();
            if (
              ((function (state) {
                (state.writing = !1),
                  (state.writecb = null),
                  (state.length -= state.writelen),
                  (state.writelen = 0);
              })(state),
              er)
            )
              !(function (stream, state, sync, er, cb) {
                --state.pendingcb,
                  sync
                    ? (process.nextTick(cb, er),
                      process.nextTick(finishMaybe, stream, state),
                      (stream._writableState.errorEmitted = !0),
                      errorOrDestroy(stream, er))
                    : (cb(er),
                      (stream._writableState.errorEmitted = !0),
                      errorOrDestroy(stream, er),
                      finishMaybe(stream, state));
              })(stream, state, sync, er, cb);
            else {
              var finished = needFinish(state) || stream.destroyed;
              finished ||
                state.corked ||
                state.bufferProcessing ||
                !state.bufferedRequest ||
                clearBuffer(stream, state),
                sync
                  ? process.nextTick(afterWrite, stream, state, finished, cb)
                  : afterWrite(stream, state, finished, cb);
            }
          })(stream, er);
        }),
        (this.writecb = null),
        (this.writelen = 0),
        (this.bufferedRequest = null),
        (this.lastBufferedRequest = null),
        (this.pendingcb = 0),
        (this.prefinished = !1),
        (this.errorEmitted = !1),
        (this.emitClose = !1 !== options.emitClose),
        (this.autoDestroy = !!options.autoDestroy),
        (this.bufferedRequestCount = 0),
        (this.corkedRequestsFree = new CorkedRequest(this));
    }
    function Writable(options) {
      var isDuplex =
        this instanceof (Duplex = Duplex || __webpack_require__(17));
      if (!isDuplex && !realHasInstance.call(Writable, this))
        return new Writable(options);
      (this._writableState = new WritableState(options, this, isDuplex)),
        (this.writable = !0),
        options &&
          ("function" == typeof options.write && (this._write = options.write),
          "function" == typeof options.writev &&
            (this._writev = options.writev),
          "function" == typeof options.destroy &&
            (this._destroy = options.destroy),
          "function" == typeof options.final && (this._final = options.final)),
        Stream.call(this);
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      (state.writelen = len),
        (state.writecb = cb),
        (state.writing = !0),
        (state.sync = !0),
        state.destroyed
          ? state.onwrite(new ERR_STREAM_DESTROYED("write"))
          : writev
          ? stream._writev(chunk, state.onwrite)
          : stream._write(chunk, encoding, state.onwrite),
        (state.sync = !1);
    }
    function afterWrite(stream, state, finished, cb) {
      finished ||
        (function (stream, state) {
          0 === state.length &&
            state.needDrain &&
            ((state.needDrain = !1), stream.emit("drain"));
        })(stream, state),
        state.pendingcb--,
        cb(),
        finishMaybe(stream, state);
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = !0;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state.bufferedRequestCount,
          buffer = new Array(l),
          holder = state.corkedRequestsFree;
        holder.entry = entry;
        for (var count = 0, allBuffers = !0; entry; )
          (buffer[count] = entry),
            entry.isBuf || (allBuffers = !1),
            (entry = entry.next),
            (count += 1);
        (buffer.allBuffers = allBuffers),
          doWrite(stream, state, !0, state.length, buffer, "", holder.finish),
          state.pendingcb++,
          (state.lastBufferedRequest = null),
          holder.next
            ? ((state.corkedRequestsFree = holder.next), (holder.next = null))
            : (state.corkedRequestsFree = new CorkedRequest(state)),
          (state.bufferedRequestCount = 0);
      } else {
        for (; entry; ) {
          var chunk = entry.chunk,
            encoding = entry.encoding,
            cb = entry.callback;
          if (
            (doWrite(
              stream,
              state,
              !1,
              state.objectMode ? 1 : chunk.length,
              chunk,
              encoding,
              cb
            ),
            (entry = entry.next),
            state.bufferedRequestCount--,
            state.writing)
          )
            break;
        }
        null === entry && (state.lastBufferedRequest = null);
      }
      (state.bufferedRequest = entry), (state.bufferProcessing = !1);
    }
    function needFinish(state) {
      return (
        state.ending &&
        0 === state.length &&
        null === state.bufferedRequest &&
        !state.finished &&
        !state.writing
      );
    }
    function callFinal(stream, state) {
      stream._final(function (err) {
        state.pendingcb--,
          err && errorOrDestroy(stream, err),
          (state.prefinished = !0),
          stream.emit("prefinish"),
          finishMaybe(stream, state);
      });
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (
        need &&
        ((function (stream, state) {
          state.prefinished ||
            state.finalCalled ||
            ("function" != typeof stream._final || state.destroyed
              ? ((state.prefinished = !0), stream.emit("prefinish"))
              : (state.pendingcb++,
                (state.finalCalled = !0),
                process.nextTick(callFinal, stream, state)));
        })(stream, state),
        0 === state.pendingcb &&
          ((state.finished = !0), stream.emit("finish"), state.autoDestroy))
      ) {
        var rState = stream._readableState;
        (!rState || (rState.autoDestroy && rState.endEmitted)) &&
          stream.destroy();
      }
      return need;
    }
    __webpack_require__(2)(Writable, Stream),
      (WritableState.prototype.getBuffer = function () {
        for (var current = this.bufferedRequest, out = []; current; )
          out.push(current), (current = current.next);
        return out;
      }),
      (function () {
        try {
          Object.defineProperty(WritableState.prototype, "buffer", {
            get: internalUtil.deprecate(
              function () {
                return this.getBuffer();
              },
              "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.",
              "DEP0003"
            ),
          });
        } catch (_) {}
      })(),
      "function" == typeof Symbol &&
      Symbol.hasInstance &&
      "function" == typeof Function.prototype[Symbol.hasInstance]
        ? ((realHasInstance = Function.prototype[Symbol.hasInstance]),
          Object.defineProperty(Writable, Symbol.hasInstance, {
            value: function (object) {
              return (
                !!realHasInstance.call(this, object) ||
                (this === Writable &&
                  object &&
                  object._writableState instanceof WritableState)
              );
            },
          }))
        : (realHasInstance = function (object) {
            return object instanceof this;
          }),
      (Writable.prototype.pipe = function () {
        errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
      }),
      (Writable.prototype.write = function (chunk, encoding, cb) {
        var obj,
          state = this._writableState,
          ret = !1,
          isBuf =
            !state.objectMode &&
            ((obj = chunk),
            Buffer.isBuffer(obj) || obj instanceof OurUint8Array);
        return (
          isBuf &&
            !Buffer.isBuffer(chunk) &&
            (chunk = (function (chunk) {
              return Buffer.from(chunk);
            })(chunk)),
          "function" == typeof encoding && ((cb = encoding), (encoding = null)),
          isBuf
            ? (encoding = "buffer")
            : encoding || (encoding = state.defaultEncoding),
          "function" != typeof cb && (cb = nop),
          state.ending
            ? (function (stream, cb) {
                var er = new ERR_STREAM_WRITE_AFTER_END();
                errorOrDestroy(stream, er), process.nextTick(cb, er);
              })(this, cb)
            : (isBuf ||
                (function (stream, state, chunk, cb) {
                  var er;
                  return (
                    null === chunk
                      ? (er = new ERR_STREAM_NULL_VALUES())
                      : "string" == typeof chunk ||
                        state.objectMode ||
                        (er = new ERR_INVALID_ARG_TYPE(
                          "chunk",
                          ["string", "Buffer"],
                          chunk
                        )),
                    !er ||
                      (errorOrDestroy(stream, er), process.nextTick(cb, er), !1)
                  );
                })(this, state, chunk, cb)) &&
              (state.pendingcb++,
              (ret = (function (stream, state, isBuf, chunk, encoding, cb) {
                if (!isBuf) {
                  var newChunk = (function (state, chunk, encoding) {
                    state.objectMode ||
                      !1 === state.decodeStrings ||
                      "string" != typeof chunk ||
                      (chunk = Buffer.from(chunk, encoding));
                    return chunk;
                  })(state, chunk, encoding);
                  chunk !== newChunk &&
                    ((isBuf = !0), (encoding = "buffer"), (chunk = newChunk));
                }
                var len = state.objectMode ? 1 : chunk.length;
                state.length += len;
                var ret = state.length < state.highWaterMark;
                ret || (state.needDrain = !0);
                if (state.writing || state.corked) {
                  var last = state.lastBufferedRequest;
                  (state.lastBufferedRequest = {
                    chunk: chunk,
                    encoding: encoding,
                    isBuf: isBuf,
                    callback: cb,
                    next: null,
                  }),
                    last
                      ? (last.next = state.lastBufferedRequest)
                      : (state.bufferedRequest = state.lastBufferedRequest),
                    (state.bufferedRequestCount += 1);
                } else doWrite(stream, state, !1, len, chunk, encoding, cb);
                return ret;
              })(this, state, isBuf, chunk, encoding, cb))),
          ret
        );
      }),
      (Writable.prototype.cork = function () {
        this._writableState.corked++;
      }),
      (Writable.prototype.uncork = function () {
        var state = this._writableState;
        state.corked &&
          (state.corked--,
          state.writing ||
            state.corked ||
            state.bufferProcessing ||
            !state.bufferedRequest ||
            clearBuffer(this, state));
      }),
      (Writable.prototype.setDefaultEncoding = function (encoding) {
        if (
          ("string" == typeof encoding && (encoding = encoding.toLowerCase()),
          !(
            [
              "hex",
              "utf8",
              "utf-8",
              "ascii",
              "binary",
              "base64",
              "ucs2",
              "ucs-2",
              "utf16le",
              "utf-16le",
              "raw",
            ].indexOf((encoding + "").toLowerCase()) > -1
          ))
        )
          throw new ERR_UNKNOWN_ENCODING(encoding);
        return (this._writableState.defaultEncoding = encoding), this;
      }),
      Object.defineProperty(Writable.prototype, "writableBuffer", {
        enumerable: !1,
        get: function () {
          return this._writableState && this._writableState.getBuffer();
        },
      }),
      Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
        enumerable: !1,
        get: function () {
          return this._writableState.highWaterMark;
        },
      }),
      (Writable.prototype._write = function (chunk, encoding, cb) {
        cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
      }),
      (Writable.prototype._writev = null),
      (Writable.prototype.end = function (chunk, encoding, cb) {
        var state = this._writableState;
        return (
          "function" == typeof chunk
            ? ((cb = chunk), (chunk = null), (encoding = null))
            : "function" == typeof encoding &&
              ((cb = encoding), (encoding = null)),
          null != chunk && this.write(chunk, encoding),
          state.corked && ((state.corked = 1), this.uncork()),
          state.ending ||
            (function (stream, state, cb) {
              (state.ending = !0),
                finishMaybe(stream, state),
                cb &&
                  (state.finished
                    ? process.nextTick(cb)
                    : stream.once("finish", cb));
              (state.ended = !0), (stream.writable = !1);
            })(this, state, cb),
          this
        );
      }),
      Object.defineProperty(Writable.prototype, "writableLength", {
        enumerable: !1,
        get: function () {
          return this._writableState.length;
        },
      }),
      Object.defineProperty(Writable.prototype, "destroyed", {
        enumerable: !1,
        get: function () {
          return (
            void 0 !== this._writableState && this._writableState.destroyed
          );
        },
        set: function (value) {
          this._writableState && (this._writableState.destroyed = value);
        },
      }),
      (Writable.prototype.destroy = destroyImpl.destroy),
      (Writable.prototype._undestroy = destroyImpl.undestroy),
      (Writable.prototype._destroy = function (err, cb) {
        cb(err);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    module.exports = Transform;
    var _require$codes = __webpack_require__(12).codes,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
      ERR_TRANSFORM_ALREADY_TRANSFORMING =
        _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
      ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0,
      Duplex = __webpack_require__(17);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = !1;
      var cb = ts.writecb;
      if (null === cb) return this.emit("error", new ERR_MULTIPLE_CALLBACK());
      (ts.writechunk = null),
        (ts.writecb = null),
        null != data && this.push(data),
        cb(er);
      var rs = this._readableState;
      (rs.reading = !1),
        (rs.needReadable || rs.length < rs.highWaterMark) &&
          this._read(rs.highWaterMark);
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options),
        (this._transformState = {
          afterTransform: afterTransform.bind(this),
          needTransform: !1,
          transforming: !1,
          writecb: null,
          writechunk: null,
          writeencoding: null,
        }),
        (this._readableState.needReadable = !0),
        (this._readableState.sync = !1),
        options &&
          ("function" == typeof options.transform &&
            (this._transform = options.transform),
          "function" == typeof options.flush && (this._flush = options.flush)),
        this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      "function" != typeof this._flush || this._readableState.destroyed
        ? done(this, null, null)
        : this._flush(function (er, data) {
            done(_this, er, data);
          });
    }
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      if ((null != data && stream.push(data), stream._writableState.length))
        throw new ERR_TRANSFORM_WITH_LENGTH_0();
      if (stream._transformState.transforming)
        throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
      return stream.push(null);
    }
    __webpack_require__(2)(Transform, Duplex),
      (Transform.prototype.push = function (chunk, encoding) {
        return (
          (this._transformState.needTransform = !1),
          Duplex.prototype.push.call(this, chunk, encoding)
        );
      }),
      (Transform.prototype._transform = function (chunk, encoding, cb) {
        cb(new ERR_METHOD_NOT_IMPLEMENTED("_transform()"));
      }),
      (Transform.prototype._write = function (chunk, encoding, cb) {
        var ts = this._transformState;
        if (
          ((ts.writecb = cb),
          (ts.writechunk = chunk),
          (ts.writeencoding = encoding),
          !ts.transforming)
        ) {
          var rs = this._readableState;
          (ts.needTransform ||
            rs.needReadable ||
            rs.length < rs.highWaterMark) &&
            this._read(rs.highWaterMark);
        }
      }),
      (Transform.prototype._read = function (n) {
        var ts = this._transformState;
        null === ts.writechunk || ts.transforming
          ? (ts.needTransform = !0)
          : ((ts.transforming = !0),
            this._transform(
              ts.writechunk,
              ts.writeencoding,
              ts.afterTransform
            ));
      }),
      (Transform.prototype._destroy = function (err, cb) {
        Duplex.prototype._destroy.call(this, err, function (err2) {
          cb(err2);
        });
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const EventEmitter = __webpack_require__(22),
      https = __webpack_require__(75),
      http = __webpack_require__(76),
      net = __webpack_require__(21),
      tls = __webpack_require__(27),
      { randomBytes: randomBytes, createHash: createHash } =
        __webpack_require__(23),
      { Readable: Readable } = __webpack_require__(6),
      { URL: URL } = __webpack_require__(183),
      PerMessageDeflate = __webpack_require__(28),
      Receiver = __webpack_require__(77),
      Sender = __webpack_require__(79),
      {
        BINARY_TYPES: BINARY_TYPES,
        EMPTY_BUFFER: EMPTY_BUFFER,
        GUID: GUID,
        kStatusCode: kStatusCode,
        kWebSocket: kWebSocket,
        NOOP: NOOP,
      } = __webpack_require__(18),
      {
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
      } = __webpack_require__(186),
      { format: format, parse: parse } = __webpack_require__(80),
      { toBuffer: toBuffer } = __webpack_require__(29),
      readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"],
      protocolVersions = [8, 13];
    class WebSocket extends EventEmitter {
      constructor(address, protocols, options) {
        super(),
          (this._binaryType = BINARY_TYPES[0]),
          (this._closeCode = 1006),
          (this._closeFrameReceived = !1),
          (this._closeFrameSent = !1),
          (this._closeMessage = ""),
          (this._closeTimer = null),
          (this._extensions = {}),
          (this._protocol = ""),
          (this._readyState = WebSocket.CONNECTING),
          (this._receiver = null),
          (this._sender = null),
          (this._socket = null),
          null !== address
            ? ((this._bufferedAmount = 0),
              (this._isServer = !1),
              (this._redirects = 0),
              Array.isArray(protocols)
                ? (protocols = protocols.join(", "))
                : "object" == typeof protocols &&
                  null !== protocols &&
                  ((options = protocols), (protocols = void 0)),
              initAsClient(this, address, protocols, options))
            : (this._isServer = !0);
      }
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        BINARY_TYPES.includes(type) &&
          ((this._binaryType = type),
          this._receiver && (this._receiver._binaryType = type));
      }
      get bufferedAmount() {
        return this._socket
          ? this._socket._writableState.length + this._sender._bufferedBytes
          : this._bufferedAmount;
      }
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      get onclose() {}
      set onclose(listener) {}
      get onerror() {}
      set onerror(listener) {}
      get onopen() {}
      set onopen(listener) {}
      get onmessage() {}
      set onmessage(listener) {}
      get protocol() {
        return this._protocol;
      }
      get readyState() {
        return this._readyState;
      }
      get url() {
        return this._url;
      }
      setSocket(socket, head, maxPayload) {
        const receiver = new Receiver(
          this.binaryType,
          this._extensions,
          this._isServer,
          maxPayload
        );
        (this._sender = new Sender(socket, this._extensions)),
          (this._receiver = receiver),
          (this._socket = socket),
          (receiver[kWebSocket] = this),
          (socket[kWebSocket] = this),
          receiver.on("conclude", receiverOnConclude),
          receiver.on("drain", receiverOnDrain),
          receiver.on("error", receiverOnError),
          receiver.on("message", receiverOnMessage),
          receiver.on("ping", receiverOnPing),
          receiver.on("pong", receiverOnPong),
          socket.setTimeout(0),
          socket.setNoDelay(),
          head.length > 0 && socket.unshift(head),
          socket.on("close", socketOnClose),
          socket.on("data", socketOnData),
          socket.on("end", socketOnEnd),
          socket.on("error", socketOnError),
          (this._readyState = WebSocket.OPEN),
          this.emit("open");
      }
      emitClose() {
        if (!this._socket)
          return (
            (this._readyState = WebSocket.CLOSED),
            void this.emit("close", this._closeCode, this._closeMessage)
          );
        this._extensions[PerMessageDeflate.extensionName] &&
          this._extensions[PerMessageDeflate.extensionName].cleanup(),
          this._receiver.removeAllListeners(),
          (this._readyState = WebSocket.CLOSED),
          this.emit("close", this._closeCode, this._closeMessage);
      }
      close(code, data) {
        if (this.readyState !== WebSocket.CLOSED) {
          if (this.readyState === WebSocket.CONNECTING) {
            const msg =
              "WebSocket was closed before the connection was established";
            return abortHandshake(this, this._req, msg);
          }
          this.readyState !== WebSocket.CLOSING
            ? ((this._readyState = WebSocket.CLOSING),
              this._sender.close(code, data, !this._isServer, (err) => {
                err ||
                  ((this._closeFrameSent = !0),
                  (this._closeFrameReceived ||
                    this._receiver._writableState.errorEmitted) &&
                    this._socket.end());
              }),
              (this._closeTimer = setTimeout(
                this._socket.destroy.bind(this._socket),
                3e4
              )))
            : this._closeFrameSent &&
              (this._closeFrameReceived ||
                this._receiver._writableState.errorEmitted) &&
              this._socket.end();
        }
      }
      ping(data, mask, cb) {
        if (this.readyState === WebSocket.CONNECTING)
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        "function" == typeof data
          ? ((cb = data), (data = mask = void 0))
          : "function" == typeof mask && ((cb = mask), (mask = void 0)),
          "number" == typeof data && (data = data.toString()),
          this.readyState === WebSocket.OPEN
            ? (void 0 === mask && (mask = !this._isServer),
              this._sender.ping(data || EMPTY_BUFFER, mask, cb))
            : sendAfterClose(this, data, cb);
      }
      pong(data, mask, cb) {
        if (this.readyState === WebSocket.CONNECTING)
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        "function" == typeof data
          ? ((cb = data), (data = mask = void 0))
          : "function" == typeof mask && ((cb = mask), (mask = void 0)),
          "number" == typeof data && (data = data.toString()),
          this.readyState === WebSocket.OPEN
            ? (void 0 === mask && (mask = !this._isServer),
              this._sender.pong(data || EMPTY_BUFFER, mask, cb))
            : sendAfterClose(this, data, cb);
      }
      send(data, options, cb) {
        if (this.readyState === WebSocket.CONNECTING)
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        if (
          ("function" == typeof options && ((cb = options), (options = {})),
          "number" == typeof data && (data = data.toString()),
          this.readyState !== WebSocket.OPEN)
        )
          return void sendAfterClose(this, data, cb);
        const opts = {
          binary: "string" != typeof data,
          mask: !this._isServer,
          compress: !0,
          fin: !0,
          ...options,
        };
        this._extensions[PerMessageDeflate.extensionName] ||
          (opts.compress = !1),
          this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      terminate() {
        if (this.readyState !== WebSocket.CLOSED) {
          if (this.readyState === WebSocket.CONNECTING) {
            const msg =
              "WebSocket was closed before the connection was established";
            return abortHandshake(this, this._req, msg);
          }
          this._socket &&
            ((this._readyState = WebSocket.CLOSING), this._socket.destroy());
        }
      }
    }
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        protocolVersion: protocolVersions[1],
        maxPayload: 104857600,
        perMessageDeflate: !0,
        followRedirects: !1,
        maxRedirects: 10,
        ...options,
        createConnection: void 0,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: void 0,
        host: void 0,
        path: void 0,
        port: void 0,
      };
      if (!protocolVersions.includes(opts.protocolVersion))
        throw new RangeError(
          `Unsupported protocol version: ${
            opts.protocolVersion
          } (supported versions: ${protocolVersions.join(", ")})`
        );
      let parsedUrl;
      address instanceof URL
        ? ((parsedUrl = address), (websocket._url = address.href))
        : ((parsedUrl = new URL(address)), (websocket._url = address));
      const isUnixSocket = "ws+unix:" === parsedUrl.protocol;
      if (!(parsedUrl.host || (isUnixSocket && parsedUrl.pathname))) {
        const err = new Error(`Invalid URL: ${websocket.url}`);
        if (0 === websocket._redirects) throw err;
        return void emitErrorAndClose(websocket, err);
      }
      const isSecure =
          "wss:" === parsedUrl.protocol || "https:" === parsedUrl.protocol,
        defaultPort = isSecure ? 443 : 80,
        key = randomBytes(16).toString("base64"),
        get = isSecure ? https.get : http.get;
      let perMessageDeflate;
      if (
        ((opts.createConnection = isSecure ? tlsConnect : netConnect),
        (opts.defaultPort = opts.defaultPort || defaultPort),
        (opts.port = parsedUrl.port || defaultPort),
        (opts.host = parsedUrl.hostname.startsWith("[")
          ? parsedUrl.hostname.slice(1, -1)
          : parsedUrl.hostname),
        (opts.headers = {
          "Sec-WebSocket-Version": opts.protocolVersion,
          "Sec-WebSocket-Key": key,
          Connection: "Upgrade",
          Upgrade: "websocket",
          ...opts.headers,
        }),
        (opts.path = parsedUrl.pathname + parsedUrl.search),
        (opts.timeout = opts.handshakeTimeout),
        opts.perMessageDeflate &&
          ((perMessageDeflate = new PerMessageDeflate(
            !0 !== opts.perMessageDeflate ? opts.perMessageDeflate : {},
            !1,
            opts.maxPayload
          )),
          (opts.headers["Sec-WebSocket-Extensions"] = format({
            [PerMessageDeflate.extensionName]: perMessageDeflate.offer(),
          }))),
        protocols && (opts.headers["Sec-WebSocket-Protocol"] = protocols),
        opts.origin &&
          (opts.protocolVersion < 13
            ? (opts.headers["Sec-WebSocket-Origin"] = opts.origin)
            : (opts.headers.Origin = opts.origin)),
        (parsedUrl.username || parsedUrl.password) &&
          (opts.auth = `${parsedUrl.username}:${parsedUrl.password}`),
        isUnixSocket)
      ) {
        const parts = opts.path.split(":");
        (opts.socketPath = parts[0]), (opts.path = parts[1]);
      }
      if (opts.followRedirects) {
        if (0 === websocket._redirects) {
          websocket._originalHost = parsedUrl.host;
          const headers = options && options.headers;
          if (((options = { ...options, headers: {} }), headers))
            for (const [key, value] of Object.entries(headers))
              options.headers[key.toLowerCase()] = value;
        } else
          parsedUrl.host !== websocket._originalHost &&
            (delete opts.headers.authorization,
            delete opts.headers.cookie,
            delete opts.headers.host,
            (opts.auth = void 0));
        opts.auth &&
          !options.headers.authorization &&
          (options.headers.authorization =
            "Basic " + Buffer.from(opts.auth).toString("base64"));
      }
      let req = (websocket._req = get(opts));
      opts.timeout &&
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        }),
        req.on("error", (err) => {
          null === req ||
            req.aborted ||
            ((req = websocket._req = null), emitErrorAndClose(websocket, err));
        }),
        req.on("response", (res) => {
          const location = res.headers.location,
            statusCode = res.statusCode;
          if (
            location &&
            opts.followRedirects &&
            statusCode >= 300 &&
            statusCode < 400
          ) {
            if (++websocket._redirects > opts.maxRedirects)
              return void abortHandshake(
                websocket,
                req,
                "Maximum redirects exceeded"
              );
            let addr;
            req.abort();
            try {
              addr = new URL(location, address);
            } catch (err) {
              return void emitErrorAndClose(websocket, err);
            }
            initAsClient(websocket, addr, protocols, options);
          } else
            websocket.emit("unexpected-response", req, res) ||
              abortHandshake(
                websocket,
                req,
                `Unexpected server response: ${res.statusCode}`
              );
        }),
        req.on("upgrade", (res, socket, head) => {
          if (
            (websocket.emit("upgrade", res),
            websocket.readyState !== WebSocket.CONNECTING)
          )
            return;
          req = websocket._req = null;
          const digest = createHash("sha1")
            .update(key + GUID)
            .digest("base64");
          if (res.headers["sec-websocket-accept"] !== digest)
            return void abortHandshake(
              websocket,
              socket,
              "Invalid Sec-WebSocket-Accept header"
            );
          const serverProt = res.headers["sec-websocket-protocol"],
            protList = (protocols || "").split(/, */);
          let protError;
          if (
            (!protocols && serverProt
              ? (protError = "Server sent a subprotocol but none was requested")
              : protocols && !serverProt
              ? (protError = "Server sent no subprotocol")
              : serverProt &&
                !protList.includes(serverProt) &&
                (protError = "Server sent an invalid subprotocol"),
            protError)
          )
            return void abortHandshake(websocket, socket, protError);
          serverProt && (websocket._protocol = serverProt);
          const secWebSocketExtensions =
            res.headers["sec-websocket-extensions"];
          if (void 0 !== secWebSocketExtensions) {
            if (!perMessageDeflate) {
              return void abortHandshake(
                websocket,
                socket,
                "Server sent a Sec-WebSocket-Extensions header but no extension was requested"
              );
            }
            let extensions;
            try {
              extensions = parse(secWebSocketExtensions);
            } catch (err) {
              return void abortHandshake(
                websocket,
                socket,
                "Invalid Sec-WebSocket-Extensions header"
              );
            }
            const extensionNames = Object.keys(extensions);
            if (extensionNames.length) {
              if (
                1 !== extensionNames.length ||
                extensionNames[0] !== PerMessageDeflate.extensionName
              ) {
                return void abortHandshake(
                  websocket,
                  socket,
                  "Server indicated an extension that was not requested"
                );
              }
              try {
                perMessageDeflate.accept(
                  extensions[PerMessageDeflate.extensionName]
                );
              } catch (err) {
                return void abortHandshake(
                  websocket,
                  socket,
                  "Invalid Sec-WebSocket-Extensions header"
                );
              }
              websocket._extensions[PerMessageDeflate.extensionName] =
                perMessageDeflate;
            }
          }
          websocket.setSocket(socket, head, opts.maxPayload);
        });
    }
    function emitErrorAndClose(websocket, err) {
      (websocket._readyState = WebSocket.CLOSING),
        websocket.emit("error", err),
        websocket.emitClose();
    }
    function netConnect(options) {
      return (options.path = options.socketPath), net.connect(options);
    }
    function tlsConnect(options) {
      return (
        (options.path = void 0),
        options.servername ||
          "" === options.servername ||
          (options.servername = net.isIP(options.host) ? "" : options.host),
        tls.connect(options)
      );
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake),
        stream.setHeader
          ? (stream.abort(),
            stream.socket &&
              !stream.socket.destroyed &&
              stream.socket.destroy(),
            stream.once("abort", websocket.emitClose.bind(websocket)),
            websocket.emit("error", err))
          : (stream.destroy(err),
            stream.once("error", websocket.emit.bind(websocket, "error")),
            stream.once("close", websocket.emitClose.bind(websocket)));
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = toBuffer(data).length;
        websocket._socket
          ? (websocket._sender._bufferedBytes += length)
          : (websocket._bufferedAmount += length);
      }
      if (cb) {
        cb(
          new Error(
            `WebSocket is not open: readyState ${websocket.readyState} (${
              readyStates[websocket.readyState]
            })`
          )
        );
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      (websocket._closeFrameReceived = !0),
        (websocket._closeMessage = reason),
        (websocket._closeCode = code),
        void 0 !== websocket._socket[kWebSocket] &&
          (websocket._socket.removeListener("data", socketOnData),
          process.nextTick(resume, websocket._socket),
          1005 === code ? websocket.close() : websocket.close(code, reason));
    }
    function receiverOnDrain() {
      this[kWebSocket]._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      void 0 !== websocket._socket[kWebSocket] &&
        (websocket._socket.removeListener("data", socketOnData),
        process.nextTick(resume, websocket._socket),
        websocket.close(err[kStatusCode])),
        websocket.emit("error", err);
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data) {
      this[kWebSocket].emit("message", data);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      websocket.pong(data, !websocket._isServer, NOOP),
        websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      let chunk;
      this.removeListener("close", socketOnClose),
        this.removeListener("data", socketOnData),
        this.removeListener("end", socketOnEnd),
        (websocket._readyState = WebSocket.CLOSING),
        this._readableState.endEmitted ||
          websocket._closeFrameReceived ||
          websocket._receiver._writableState.errorEmitted ||
          null === (chunk = websocket._socket.read()) ||
          websocket._receiver.write(chunk),
        websocket._receiver.end(),
        (this[kWebSocket] = void 0),
        clearTimeout(websocket._closeTimer),
        websocket._receiver._writableState.finished ||
        websocket._receiver._writableState.errorEmitted
          ? websocket.emitClose()
          : (websocket._receiver.on("error", receiverOnFinish),
            websocket._receiver.on("finish", receiverOnFinish));
    }
    function socketOnData(chunk) {
      this[kWebSocket]._receiver.write(chunk) || this.pause();
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      (websocket._readyState = WebSocket.CLOSING),
        websocket._receiver.end(),
        this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError),
        this.on("error", NOOP),
        websocket &&
          ((websocket._readyState = WebSocket.CLOSING), this.destroy());
    }
    Object.defineProperty(WebSocket, "CONNECTING", {
      enumerable: !0,
      value: readyStates.indexOf("CONNECTING"),
    }),
      Object.defineProperty(WebSocket.prototype, "CONNECTING", {
        enumerable: !0,
        value: readyStates.indexOf("CONNECTING"),
      }),
      Object.defineProperty(WebSocket, "OPEN", {
        enumerable: !0,
        value: readyStates.indexOf("OPEN"),
      }),
      Object.defineProperty(WebSocket.prototype, "OPEN", {
        enumerable: !0,
        value: readyStates.indexOf("OPEN"),
      }),
      Object.defineProperty(WebSocket, "CLOSING", {
        enumerable: !0,
        value: readyStates.indexOf("CLOSING"),
      }),
      Object.defineProperty(WebSocket.prototype, "CLOSING", {
        enumerable: !0,
        value: readyStates.indexOf("CLOSING"),
      }),
      Object.defineProperty(WebSocket, "CLOSED", {
        enumerable: !0,
        value: readyStates.indexOf("CLOSED"),
      }),
      Object.defineProperty(WebSocket.prototype, "CLOSED", {
        enumerable: !0,
        value: readyStates.indexOf("CLOSED"),
      }),
      [
        "binaryType",
        "bufferedAmount",
        "extensions",
        "protocol",
        "readyState",
        "url",
      ].forEach((property) => {
        Object.defineProperty(WebSocket.prototype, property, {
          enumerable: !0,
        });
      }),
      ["open", "error", "close", "message"].forEach((method) => {
        Object.defineProperty(WebSocket.prototype, `on${method}`, {
          enumerable: !0,
          get() {
            const listeners = this.listeners(method);
            for (let i = 0; i < listeners.length; i++)
              if (listeners[i]._listener) return listeners[i]._listener;
          },
          set(listener) {
            const listeners = this.listeners(method);
            for (let i = 0; i < listeners.length; i++)
              listeners[i]._listener &&
                this.removeListener(method, listeners[i]);
            this.addEventListener(method, listener);
          },
        });
      }),
      (WebSocket.prototype.addEventListener = addEventListener),
      (WebSocket.prototype.removeEventListener = removeEventListener),
      (module.exports = WebSocket);
  },
  function (module, exports) {
    module.exports = require("https");
  },
  function (module, exports) {
    module.exports = require("http");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const { Writable: Writable } = __webpack_require__(6),
      PerMessageDeflate = __webpack_require__(28),
      {
        BINARY_TYPES: BINARY_TYPES,
        EMPTY_BUFFER: EMPTY_BUFFER,
        kStatusCode: kStatusCode,
        kWebSocket: kWebSocket,
      } = __webpack_require__(18),
      {
        concat: concat,
        toArrayBuffer: toArrayBuffer,
        unmask: unmask,
      } = __webpack_require__(29),
      { isValidStatusCode: isValidStatusCode, isValidUTF8: isValidUTF8 } =
        __webpack_require__(78);
    function error(ErrorCtor, message, prefix, statusCode, errorCode) {
      const err = new ErrorCtor(
        prefix ? `Invalid WebSocket frame: ${message}` : message
      );
      return (
        Error.captureStackTrace(err, error),
        (err.code = errorCode),
        (err[kStatusCode] = statusCode),
        err
      );
    }
    module.exports = class extends Writable {
      constructor(binaryType, extensions, isServer, maxPayload) {
        super(),
          (this._binaryType = binaryType || BINARY_TYPES[0]),
          (this[kWebSocket] = void 0),
          (this._extensions = extensions || {}),
          (this._isServer = !!isServer),
          (this._maxPayload = 0 | maxPayload),
          (this._bufferedBytes = 0),
          (this._buffers = []),
          (this._compressed = !1),
          (this._payloadLength = 0),
          (this._mask = void 0),
          (this._fragmented = 0),
          (this._masked = !1),
          (this._fin = !1),
          (this._opcode = 0),
          (this._totalPayloadLength = 0),
          (this._messageLength = 0),
          (this._fragments = []),
          (this._state = 0),
          (this._loop = !1);
      }
      _write(chunk, encoding, cb) {
        if (8 === this._opcode && 0 == this._state) return cb();
        (this._bufferedBytes += chunk.length),
          this._buffers.push(chunk),
          this.startLoop(cb);
      }
      consume(n) {
        if (((this._bufferedBytes -= n), n === this._buffers[0].length))
          return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          return (this._buffers[0] = buf.slice(n)), buf.slice(0, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0],
            offset = dst.length - n;
          n >= buf.length
            ? dst.set(this._buffers.shift(), offset)
            : (dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset),
              (this._buffers[0] = buf.slice(n))),
            (n -= buf.length);
        } while (n > 0);
        return dst;
      }
      startLoop(cb) {
        let err;
        this._loop = !0;
        do {
          switch (this._state) {
            case 0:
              err = this.getInfo();
              break;
            case 1:
              err = this.getPayloadLength16();
              break;
            case 2:
              err = this.getPayloadLength64();
              break;
            case 3:
              this.getMask();
              break;
            case 4:
              err = this.getData(cb);
              break;
            default:
              return void (this._loop = !1);
          }
        } while (this._loop);
        cb(err);
      }
      getInfo() {
        if (this._bufferedBytes < 2) return void (this._loop = !1);
        const buf = this.consume(2);
        if (0 != (48 & buf[0]))
          return (
            (this._loop = !1),
            error(
              RangeError,
              "RSV2 and RSV3 must be clear",
              !0,
              1002,
              "WS_ERR_UNEXPECTED_RSV_2_3"
            )
          );
        const compressed = 64 == (64 & buf[0]);
        if (compressed && !this._extensions[PerMessageDeflate.extensionName])
          return (
            (this._loop = !1),
            error(
              RangeError,
              "RSV1 must be clear",
              !0,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            )
          );
        if (
          ((this._fin = 128 == (128 & buf[0])),
          (this._opcode = 15 & buf[0]),
          (this._payloadLength = 127 & buf[1]),
          0 === this._opcode)
        ) {
          if (compressed)
            return (
              (this._loop = !1),
              error(
                RangeError,
                "RSV1 must be clear",
                !0,
                1002,
                "WS_ERR_UNEXPECTED_RSV_1"
              )
            );
          if (!this._fragmented)
            return (
              (this._loop = !1),
              error(
                RangeError,
                "invalid opcode 0",
                !0,
                1002,
                "WS_ERR_INVALID_OPCODE"
              )
            );
          this._opcode = this._fragmented;
        } else if (1 === this._opcode || 2 === this._opcode) {
          if (this._fragmented)
            return (
              (this._loop = !1),
              error(
                RangeError,
                `invalid opcode ${this._opcode}`,
                !0,
                1002,
                "WS_ERR_INVALID_OPCODE"
              )
            );
          this._compressed = compressed;
        } else {
          if (!(this._opcode > 7 && this._opcode < 11))
            return (
              (this._loop = !1),
              error(
                RangeError,
                `invalid opcode ${this._opcode}`,
                !0,
                1002,
                "WS_ERR_INVALID_OPCODE"
              )
            );
          if (!this._fin)
            return (
              (this._loop = !1),
              error(
                RangeError,
                "FIN must be set",
                !0,
                1002,
                "WS_ERR_EXPECTED_FIN"
              )
            );
          if (compressed)
            return (
              (this._loop = !1),
              error(
                RangeError,
                "RSV1 must be clear",
                !0,
                1002,
                "WS_ERR_UNEXPECTED_RSV_1"
              )
            );
          if (this._payloadLength > 125)
            return (
              (this._loop = !1),
              error(
                RangeError,
                `invalid payload length ${this._payloadLength}`,
                !0,
                1002,
                "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
              )
            );
        }
        if (
          (this._fin || this._fragmented || (this._fragmented = this._opcode),
          (this._masked = 128 == (128 & buf[1])),
          this._isServer)
        ) {
          if (!this._masked)
            return (
              (this._loop = !1),
              error(
                RangeError,
                "MASK must be set",
                !0,
                1002,
                "WS_ERR_EXPECTED_MASK"
              )
            );
        } else if (this._masked)
          return (
            (this._loop = !1),
            error(
              RangeError,
              "MASK must be clear",
              !0,
              1002,
              "WS_ERR_UNEXPECTED_MASK"
            )
          );
        if (126 === this._payloadLength) this._state = 1;
        else {
          if (127 !== this._payloadLength) return this.haveLength();
          this._state = 2;
        }
      }
      getPayloadLength16() {
        if (!(this._bufferedBytes < 2))
          return (
            (this._payloadLength = this.consume(2).readUInt16BE(0)),
            this.haveLength()
          );
        this._loop = !1;
      }
      getPayloadLength64() {
        if (this._bufferedBytes < 8) return void (this._loop = !1);
        const buf = this.consume(8),
          num = buf.readUInt32BE(0);
        return num > Math.pow(2, 21) - 1
          ? ((this._loop = !1),
            error(
              RangeError,
              "Unsupported WebSocket frame: payload length > 2^53 - 1",
              !1,
              1009,
              "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
            ))
          : ((this._payloadLength =
              num * Math.pow(2, 32) + buf.readUInt32BE(4)),
            this.haveLength());
      }
      haveLength() {
        if (
          this._payloadLength &&
          this._opcode < 8 &&
          ((this._totalPayloadLength += this._payloadLength),
          this._totalPayloadLength > this._maxPayload && this._maxPayload > 0)
        )
          return (
            (this._loop = !1),
            error(
              RangeError,
              "Max payload size exceeded",
              !1,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            )
          );
        this._masked ? (this._state = 3) : (this._state = 4);
      }
      getMask() {
        this._bufferedBytes < 4
          ? (this._loop = !1)
          : ((this._mask = this.consume(4)), (this._state = 4));
      }
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength)
            return void (this._loop = !1);
          (data = this.consume(this._payloadLength)),
            this._masked && unmask(data, this._mask);
        }
        return this._opcode > 7
          ? this.controlMessage(data)
          : this._compressed
          ? ((this._state = 5), void this.decompress(data, cb))
          : (data.length &&
              ((this._messageLength = this._totalPayloadLength),
              this._fragments.push(data)),
            this.dataMessage());
      }
      decompress(data, cb) {
        this._extensions[PerMessageDeflate.extensionName].decompress(
          data,
          this._fin,
          (err, buf) => {
            if (err) return cb(err);
            if (buf.length) {
              if (
                ((this._messageLength += buf.length),
                this._messageLength > this._maxPayload && this._maxPayload > 0)
              )
                return cb(
                  error(
                    RangeError,
                    "Max payload size exceeded",
                    !1,
                    1009,
                    "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
                  )
                );
              this._fragments.push(buf);
            }
            const er = this.dataMessage();
            if (er) return cb(er);
            this.startLoop(cb);
          }
        );
      }
      dataMessage() {
        if (this._fin) {
          const messageLength = this._messageLength,
            fragments = this._fragments;
          if (
            ((this._totalPayloadLength = 0),
            (this._messageLength = 0),
            (this._fragmented = 0),
            (this._fragments = []),
            2 === this._opcode)
          ) {
            let data;
            (data =
              "nodebuffer" === this._binaryType
                ? concat(fragments, messageLength)
                : "arraybuffer" === this._binaryType
                ? toArrayBuffer(concat(fragments, messageLength))
                : fragments),
              this.emit("message", data);
          } else {
            const buf = concat(fragments, messageLength);
            if (!isValidUTF8(buf))
              return (
                (this._loop = !1),
                error(
                  Error,
                  "invalid UTF-8 sequence",
                  !0,
                  1007,
                  "WS_ERR_INVALID_UTF8"
                )
              );
            this.emit("message", buf.toString());
          }
        }
        this._state = 0;
      }
      controlMessage(data) {
        if (8 === this._opcode)
          if (((this._loop = !1), 0 === data.length))
            this.emit("conclude", 1005, ""), this.end();
          else {
            if (1 === data.length)
              return error(
                RangeError,
                "invalid payload length 1",
                !0,
                1002,
                "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
              );
            {
              const code = data.readUInt16BE(0);
              if (!isValidStatusCode(code))
                return error(
                  RangeError,
                  `invalid status code ${code}`,
                  !0,
                  1002,
                  "WS_ERR_INVALID_CLOSE_CODE"
                );
              const buf = data.slice(2);
              if (!isValidUTF8(buf))
                return error(
                  Error,
                  "invalid UTF-8 sequence",
                  !0,
                  1007,
                  "WS_ERR_INVALID_UTF8"
                );
              this.emit("conclude", code, buf.toString()), this.end();
            }
          }
        else
          9 === this._opcode
            ? this.emit("ping", data)
            : this.emit("pong", data);
        this._state = 0;
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function isValidStatusCode(code) {
      return (
        (code >= 1e3 &&
          code <= 1014 &&
          1004 !== code &&
          1005 !== code &&
          1006 !== code) ||
        (code >= 3e3 && code <= 4999)
      );
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      for (; i < len; )
        if (0 == (128 & buf[i])) i++;
        else if (192 == (224 & buf[i])) {
          if (
            i + 1 === len ||
            128 != (192 & buf[i + 1]) ||
            192 == (254 & buf[i])
          )
            return !1;
          i += 2;
        } else if (224 == (240 & buf[i])) {
          if (
            i + 2 >= len ||
            128 != (192 & buf[i + 1]) ||
            128 != (192 & buf[i + 2]) ||
            (224 === buf[i] && 128 == (224 & buf[i + 1])) ||
            (237 === buf[i] && 160 == (224 & buf[i + 1]))
          )
            return !1;
          i += 3;
        } else {
          if (240 != (248 & buf[i])) return !1;
          if (
            i + 3 >= len ||
            128 != (192 & buf[i + 1]) ||
            128 != (192 & buf[i + 2]) ||
            128 != (192 & buf[i + 3]) ||
            (240 === buf[i] && 128 == (240 & buf[i + 1])) ||
            (244 === buf[i] && buf[i + 1] > 143) ||
            buf[i] > 244
          )
            return !1;
          i += 4;
        }
      return !0;
    }
    try {
      let isValidUTF8 = __webpack_require__(
        !(function () {
          var e = new Error("Cannot find module 'utf-8-validate'");
          throw ((e.code = "MODULE_NOT_FOUND"), e);
        })()
      );
      "object" == typeof isValidUTF8 &&
        (isValidUTF8 = isValidUTF8.Validation.isValidUTF8),
        (module.exports = {
          isValidStatusCode: isValidStatusCode,
          isValidUTF8: (buf) =>
            buf.length < 150 ? _isValidUTF8(buf) : isValidUTF8(buf),
        });
    } catch (e) {
      module.exports = {
        isValidStatusCode: isValidStatusCode,
        isValidUTF8: _isValidUTF8,
      };
    }
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    __webpack_require__(21), __webpack_require__(27);
    const { randomFillSync: randomFillSync } = __webpack_require__(23),
      PerMessageDeflate = __webpack_require__(28),
      { EMPTY_BUFFER: EMPTY_BUFFER } = __webpack_require__(18),
      { isValidStatusCode: isValidStatusCode } = __webpack_require__(78),
      { mask: applyMask, toBuffer: toBuffer } = __webpack_require__(29),
      mask = Buffer.alloc(4);
    class Sender {
      constructor(socket, extensions) {
        (this._extensions = extensions || {}),
          (this._socket = socket),
          (this._firstFragment = !0),
          (this._compress = !1),
          (this._bufferedBytes = 0),
          (this._deflating = !1),
          (this._queue = []);
      }
      static frame(data, options) {
        const merge = options.mask && options.readOnly;
        let offset = options.mask ? 6 : 2,
          payloadLength = data.length;
        data.length >= 65536
          ? ((offset += 8), (payloadLength = 127))
          : data.length > 125 && ((offset += 2), (payloadLength = 126));
        const target = Buffer.allocUnsafe(
          merge ? data.length + offset : offset
        );
        return (
          (target[0] = options.fin ? 128 | options.opcode : options.opcode),
          options.rsv1 && (target[0] |= 64),
          (target[1] = payloadLength),
          126 === payloadLength
            ? target.writeUInt16BE(data.length, 2)
            : 127 === payloadLength &&
              (target.writeUInt32BE(0, 2),
              target.writeUInt32BE(data.length, 6)),
          options.mask
            ? (randomFillSync(mask, 0, 4),
              (target[1] |= 128),
              (target[offset - 4] = mask[0]),
              (target[offset - 3] = mask[1]),
              (target[offset - 2] = mask[2]),
              (target[offset - 1] = mask[3]),
              merge
                ? (applyMask(data, mask, target, offset, data.length), [target])
                : (applyMask(data, mask, data, 0, data.length), [target, data]))
            : [target, data]
        );
      }
      close(code, data, mask, cb) {
        let buf;
        if (void 0 === code) buf = EMPTY_BUFFER;
        else {
          if ("number" != typeof code || !isValidStatusCode(code))
            throw new TypeError(
              "First argument must be a valid error code number"
            );
          if (void 0 === data || "" === data)
            (buf = Buffer.allocUnsafe(2)), buf.writeUInt16BE(code, 0);
          else {
            const length = Buffer.byteLength(data);
            if (length > 123)
              throw new RangeError(
                "The message must not be greater than 123 bytes"
              );
            (buf = Buffer.allocUnsafe(2 + length)),
              buf.writeUInt16BE(code, 0),
              buf.write(data, 2);
          }
        }
        this._deflating
          ? this.enqueue([this.doClose, buf, mask, cb])
          : this.doClose(buf, mask, cb);
      }
      doClose(data, mask, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: !0,
            rsv1: !1,
            opcode: 8,
            mask: mask,
            readOnly: !1,
          }),
          cb
        );
      }
      ping(data, mask, cb) {
        const buf = toBuffer(data);
        if (buf.length > 125)
          throw new RangeError(
            "The data size must not be greater than 125 bytes"
          );
        this._deflating
          ? this.enqueue([this.doPing, buf, mask, toBuffer.readOnly, cb])
          : this.doPing(buf, mask, toBuffer.readOnly, cb);
      }
      doPing(data, mask, readOnly, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: !0,
            rsv1: !1,
            opcode: 9,
            mask: mask,
            readOnly: readOnly,
          }),
          cb
        );
      }
      pong(data, mask, cb) {
        const buf = toBuffer(data);
        if (buf.length > 125)
          throw new RangeError(
            "The data size must not be greater than 125 bytes"
          );
        this._deflating
          ? this.enqueue([this.doPong, buf, mask, toBuffer.readOnly, cb])
          : this.doPong(buf, mask, toBuffer.readOnly, cb);
      }
      doPong(data, mask, readOnly, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: !0,
            rsv1: !1,
            opcode: 10,
            mask: mask,
            readOnly: readOnly,
          }),
          cb
        );
      }
      send(data, options, cb) {
        const buf = toBuffer(data),
          perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1,
          rsv1 = options.compress;
        if (
          (this._firstFragment
            ? ((this._firstFragment = !1),
              rsv1 &&
                perMessageDeflate &&
                (rsv1 = buf.length >= perMessageDeflate._threshold),
              (this._compress = rsv1))
            : ((rsv1 = !1), (opcode = 0)),
          options.fin && (this._firstFragment = !0),
          perMessageDeflate)
        ) {
          const opts = {
            fin: options.fin,
            rsv1: rsv1,
            opcode: opcode,
            mask: options.mask,
            readOnly: toBuffer.readOnly,
          };
          this._deflating
            ? this.enqueue([this.dispatch, buf, this._compress, opts, cb])
            : this.dispatch(buf, this._compress, opts, cb);
        } else
          this.sendFrame(
            Sender.frame(buf, {
              fin: options.fin,
              rsv1: !1,
              opcode: opcode,
              mask: options.mask,
              readOnly: toBuffer.readOnly,
            }),
            cb
          );
      }
      dispatch(data, compress, options, cb) {
        if (!compress)
          return void this.sendFrame(Sender.frame(data, options), cb);
        const perMessageDeflate =
          this._extensions[PerMessageDeflate.extensionName];
        (this._bufferedBytes += data.length),
          (this._deflating = !0),
          perMessageDeflate.compress(data, options.fin, (_, buf) => {
            if (this._socket.destroyed) {
              const err = new Error(
                "The socket was closed while data was being compressed"
              );
              "function" == typeof cb && cb(err);
              for (let i = 0; i < this._queue.length; i++) {
                const callback = this._queue[i][4];
                "function" == typeof callback && callback(err);
              }
            } else
              (this._bufferedBytes -= data.length),
                (this._deflating = !1),
                (options.readOnly = !1),
                this.sendFrame(Sender.frame(buf, options), cb),
                this.dequeue();
          });
      }
      dequeue() {
        for (; !this._deflating && this._queue.length; ) {
          const params = this._queue.shift();
          (this._bufferedBytes -= params[1].length),
            Reflect.apply(params[0], this, params.slice(1));
        }
      }
      enqueue(params) {
        (this._bufferedBytes += params[1].length), this._queue.push(params);
      }
      sendFrame(list, cb) {
        2 === list.length
          ? (this._socket.cork(),
            this._socket.write(list[0]),
            this._socket.write(list[1], cb),
            this._socket.uncork())
          : this._socket.write(list[0], cb);
      }
    }
    module.exports = Sender;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const tokenChars = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
      0, 1, 0,
    ];
    function push(dest, name, elem) {
      void 0 === dest[name] ? (dest[name] = [elem]) : dest[name].push(elem);
    }
    module.exports = {
      format: function (extensions) {
        return Object.keys(extensions)
          .map((extension) => {
            let configurations = extensions[extension];
            return (
              Array.isArray(configurations) ||
                (configurations = [configurations]),
              configurations
                .map((params) =>
                  [extension]
                    .concat(
                      Object.keys(params).map((k) => {
                        let values = params[k];
                        return (
                          Array.isArray(values) || (values = [values]),
                          values
                            .map((v) => (!0 === v ? k : `${k}=${v}`))
                            .join("; ")
                        );
                      })
                    )
                    .join("; ")
                )
                .join(", ")
            );
          })
          .join(", ");
      },
      parse: function (header) {
        const offers = Object.create(null);
        if (void 0 === header || "" === header) return offers;
        let extensionName,
          paramName,
          params = Object.create(null),
          mustUnescape = !1,
          isEscaping = !1,
          inQuotes = !1,
          start = -1,
          end = -1,
          i = 0;
        for (; i < header.length; i++) {
          const code = header.charCodeAt(i);
          if (void 0 === extensionName)
            if (-1 === end && 1 === tokenChars[code])
              -1 === start && (start = i);
            else if (32 === code || 9 === code)
              -1 === end && -1 !== start && (end = i);
            else {
              if (59 !== code && 44 !== code)
                throw new SyntaxError(`Unexpected character at index ${i}`);
              {
                if (-1 === start)
                  throw new SyntaxError(`Unexpected character at index ${i}`);
                -1 === end && (end = i);
                const name = header.slice(start, end);
                44 === code
                  ? (push(offers, name, params), (params = Object.create(null)))
                  : (extensionName = name),
                  (start = end = -1);
              }
            }
          else if (void 0 === paramName)
            if (-1 === end && 1 === tokenChars[code])
              -1 === start && (start = i);
            else if (32 === code || 9 === code)
              -1 === end && -1 !== start && (end = i);
            else if (59 === code || 44 === code) {
              if (-1 === start)
                throw new SyntaxError(`Unexpected character at index ${i}`);
              -1 === end && (end = i),
                push(params, header.slice(start, end), !0),
                44 === code &&
                  (push(offers, extensionName, params),
                  (params = Object.create(null)),
                  (extensionName = void 0)),
                (start = end = -1);
            } else {
              if (61 !== code || -1 === start || -1 !== end)
                throw new SyntaxError(`Unexpected character at index ${i}`);
              (paramName = header.slice(start, i)), (start = end = -1);
            }
          else if (isEscaping) {
            if (1 !== tokenChars[code])
              throw new SyntaxError(`Unexpected character at index ${i}`);
            -1 === start ? (start = i) : mustUnescape || (mustUnescape = !0),
              (isEscaping = !1);
          } else if (inQuotes)
            if (1 === tokenChars[code]) -1 === start && (start = i);
            else if (34 === code && -1 !== start) (inQuotes = !1), (end = i);
            else {
              if (92 !== code)
                throw new SyntaxError(`Unexpected character at index ${i}`);
              isEscaping = !0;
            }
          else if (34 === code && 61 === header.charCodeAt(i - 1))
            inQuotes = !0;
          else if (-1 === end && 1 === tokenChars[code])
            -1 === start && (start = i);
          else if (-1 === start || (32 !== code && 9 !== code)) {
            if (59 !== code && 44 !== code)
              throw new SyntaxError(`Unexpected character at index ${i}`);
            {
              if (-1 === start)
                throw new SyntaxError(`Unexpected character at index ${i}`);
              -1 === end && (end = i);
              let value = header.slice(start, end);
              mustUnescape &&
                ((value = value.replace(/\\/g, "")), (mustUnescape = !1)),
                push(params, paramName, value),
                44 === code &&
                  (push(offers, extensionName, params),
                  (params = Object.create(null)),
                  (extensionName = void 0)),
                (paramName = void 0),
                (start = end = -1);
            }
          } else -1 === end && (end = i);
        }
        if (-1 === start || inQuotes)
          throw new SyntaxError("Unexpected end of input");
        -1 === end && (end = i);
        const token = header.slice(start, end);
        return (
          void 0 === extensionName
            ? push(offers, token, params)
            : (void 0 === paramName
                ? push(params, token, !0)
                : push(
                    params,
                    paramName,
                    mustUnescape ? token.replace(/\\/g, "") : token
                  ),
              push(offers, extensionName, params)),
          offers
        );
      },
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.expandConfig =
        exports.expandRateLimitsConfig =
        exports.expandTransportConfig =
          void 0);
    const set_defaults_1 = __webpack_require__(26),
      message_rate_limits_1 = __webpack_require__(82),
      defaults = {
        username: "justinfan12345",
        password: void 0,
        requestMembershipCapability: !1,
        maxChannelCountPerConnection: 90,
        connection: { type: "tcp", secure: !0 },
        connectionRateLimits: { parallelConnections: 1, releaseTime: 2e3 },
        installDefaultMixins: !0,
        ignoreUnhandledPromiseRejections: !1,
      };
    function expandTransportConfig(config) {
      if (null == config) return expandTransportConfig({ secure: !0 });
      switch (config.type) {
        case "tcp":
        case void 0: {
          let host, port;
          return (
            "host" in config && "port" in config
              ? ((host = config.host), (port = config.port))
              : ((host = "irc.chat.twitch.tv"),
                (port = config.secure ? 6697 : 6667)),
            {
              type: "tcp",
              secure: config.secure,
              host: host,
              port: port,
              preSetup: !1,
            }
          );
        }
        case "duplex":
          return set_defaults_1.setDefaults(config, { preSetup: !1 });
        case "websocket": {
          let url;
          return (
            (url =
              "url" in config
                ? config.url
                : (config.secure ? "wss" : "ws") + "://irc-ws.chat.twitch.tv"),
            { type: "websocket", url: url, preSetup: !1 }
          );
        }
        default:
          throw new Error("Unknown transport type");
      }
    }
    function expandRateLimitsConfig(config) {
      return null == config
        ? message_rate_limits_1.messageRateLimitPresets.default
        : "string" == typeof config
        ? message_rate_limits_1.messageRateLimitPresets[config]
        : config;
    }
    (exports.expandTransportConfig = expandTransportConfig),
      (exports.expandRateLimitsConfig = expandRateLimitsConfig),
      (exports.expandConfig = function (config) {
        const newConfig = set_defaults_1.setDefaults(config, defaults);
        return (
          (newConfig.username = newConfig.username.toLowerCase()),
          (newConfig.connection = expandTransportConfig(newConfig.connection)),
          (newConfig.rateLimits = expandRateLimitsConfig(newConfig.rateLimits)),
          newConfig
        );
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.messageRateLimitPresets = void 0),
      (exports.messageRateLimitPresets = {
        default: { highPrivmsgLimits: 100, lowPrivmsgLimits: 20 },
        knownBot: { highPrivmsgLimits: 100, lowPrivmsgLimits: 50 },
        verifiedBot: { highPrivmsgLimits: 7500, lowPrivmsgLimits: 7500 },
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ClientState = void 0),
      (function (ClientState) {
        (ClientState[(ClientState.UNCONNECTED = 0)] = "UNCONNECTED"),
          (ClientState[(ClientState.CONNECTING = 1)] = "CONNECTING"),
          (ClientState[(ClientState.CONNECTED = 2)] = "CONNECTED"),
          (ClientState[(ClientState.READY = 3)] = "READY"),
          (ClientState[(ClientState.CLOSED = 4)] = "CLOSED");
      })(exports.ClientState || (exports.ClientState = {}));
  },
  function (module, exports, __webpack_require__) {
    var prevTime;
    function createDebug(namespace) {
      function debug() {
        if (debug.enabled) {
          var self = debug,
            curr = +new Date(),
            ms = curr - (prevTime || curr);
          (self.diff = ms),
            (self.prev = prevTime),
            (self.curr = curr),
            (prevTime = curr);
          for (
            var args = new Array(arguments.length), i = 0;
            i < args.length;
            i++
          )
            args[i] = arguments[i];
          (args[0] = exports.coerce(args[0])),
            "string" != typeof args[0] && args.unshift("%O");
          var index = 0;
          (args[0] = args[0].replace(/%([a-zA-Z%])/g, function (match, format) {
            if ("%%" === match) return match;
            index++;
            var formatter = exports.formatters[format];
            if ("function" == typeof formatter) {
              var val = args[index];
              (match = formatter.call(self, val)),
                args.splice(index, 1),
                index--;
            }
            return match;
          })),
            exports.formatArgs.call(self, args);
          var logFn = debug.log || exports.log || console.log.bind(console);
          logFn.apply(self, args);
        }
      }
      return (
        (debug.namespace = namespace),
        (debug.enabled = exports.enabled(namespace)),
        (debug.useColors = exports.useColors()),
        (debug.color = (function (namespace) {
          var i,
            hash = 0;
          for (i in namespace)
            (hash = (hash << 5) - hash + namespace.charCodeAt(i)), (hash |= 0);
          return exports.colors[Math.abs(hash) % exports.colors.length];
        })(namespace)),
        "function" == typeof exports.init && exports.init(debug),
        debug
      );
    }
    ((exports =
      module.exports =
      createDebug.debug =
      createDebug.default =
        createDebug).coerce = function (val) {
      return val instanceof Error ? val.stack || val.message : val;
    }),
      (exports.disable = function () {
        exports.enable("");
      }),
      (exports.enable = function (namespaces) {
        exports.save(namespaces), (exports.names = []), (exports.skips = []);
        for (
          var split = ("string" == typeof namespaces ? namespaces : "").split(
              /[\s,]+/
            ),
            len = split.length,
            i = 0;
          i < len;
          i++
        )
          split[i] &&
            ("-" === (namespaces = split[i].replace(/\*/g, ".*?"))[0]
              ? exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$"))
              : exports.names.push(new RegExp("^" + namespaces + "$")));
      }),
      (exports.enabled = function (name) {
        var i, len;
        for (i = 0, len = exports.skips.length; i < len; i++)
          if (exports.skips[i].test(name)) return !1;
        for (i = 0, len = exports.names.length; i < len; i++)
          if (exports.names[i].test(name)) return !0;
        return !1;
      }),
      (exports.humanize = __webpack_require__(193)),
      (exports.names = []),
      (exports.skips = []),
      (exports.formatters = {});
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseBadges = exports.parseSingleBadge = void 0);
    const badge_1 = __webpack_require__(86),
      badges_1 = __webpack_require__(87),
      parse_error_1 = __webpack_require__(8);
    function parseSingleBadge(badgeSrc) {
      const [badgeName, badgeVersion] = badgeSrc.split("/", 2);
      if (null == badgeName || null == badgeVersion)
        throw new parse_error_1.ParseError(
          `Badge source "${badgeSrc}" did not contain '/' character`
        );
      if (badgeName.length <= 0)
        throw new parse_error_1.ParseError(
          `Empty badge name on badge "${badgeSrc}"`
        );
      if (badgeVersion.length <= 0)
        throw new parse_error_1.ParseError(
          `Empty badge version on badge "${badgeSrc}"`
        );
      return new badge_1.TwitchBadge(badgeName, badgeVersion);
    }
    (exports.parseSingleBadge = parseSingleBadge),
      (exports.parseBadges = function (badgesSrc) {
        if (badgesSrc.length <= 0) return new badges_1.TwitchBadgesList();
        const badges = new badges_1.TwitchBadgesList();
        for (const badgeSrc of badgesSrc.split(","))
          badges.push(parseSingleBadge(badgeSrc));
        return badges;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.TwitchBadge = void 0);
    exports.TwitchBadge = class {
      constructor(name, version) {
        (this.name = name), (this.version = version);
      }
      get isAdmin() {
        return "admin" === this.name;
      }
      get isBits() {
        return "bits" === this.name;
      }
      get isBroadcaster() {
        return "broadcaster" === this.name;
      }
      get isGlobalMod() {
        return "global_mod" === this.name;
      }
      get isModerator() {
        return "moderator" === this.name;
      }
      get isSubscriber() {
        return "subscriber" === this.name;
      }
      get isStaff() {
        return "staff" === this.name;
      }
      get isTurbo() {
        return "turbo" === this.name;
      }
      get isVIP() {
        return "vip" === this.name;
      }
      toString() {
        return `${this.name}/${this.version}`;
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.TwitchBadgesList = void 0);
    exports.TwitchBadgesList = class extends Array {
      get hasAdmin() {
        return null != this.find((e) => e.isAdmin);
      }
      get hasBits() {
        return null != this.find((e) => e.isBits);
      }
      get hasBroadcaster() {
        return null != this.find((e) => e.isBroadcaster);
      }
      get hasGlobalMod() {
        return null != this.find((e) => e.isGlobalMod);
      }
      get hasModerator() {
        return null != this.find((e) => e.isModerator);
      }
      get hasSubscriber() {
        return null != this.find((e) => e.isSubscriber);
      }
      get hasStaff() {
        return null != this.find((e) => e.isStaff);
      }
      get hasTurbo() {
        return null != this.find((e) => e.isTurbo);
      }
      get hasVIP() {
        return null != this.find((e) => e.isVIP);
      }
      toString() {
        return this.join(",");
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseColor = void 0);
    const parse_error_1 = __webpack_require__(8),
      rgbColorRegex = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;
    exports.parseColor = function (colorSrc) {
      const match = rgbColorRegex.exec(colorSrc);
      if (null == match)
        throw new parse_error_1.ParseError(
          `Malformed color value "${colorSrc}", must be in format #AABBCC`
        );
      return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      };
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseEmoteSets = void 0),
      (exports.parseEmoteSets = function (emoteSetsSrc) {
        return emoteSetsSrc.length <= 0
          ? []
          : emoteSetsSrc.split(",").filter((str) => str.length > 0);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseEmotes = void 0);
    const emote_1 = __webpack_require__(91),
      common_1 = __webpack_require__(92),
      parse_error_1 = __webpack_require__(8);
    exports.parseEmotes = function (messageText, emotesSrc) {
      const emotes = [];
      if (emotesSrc.length <= 0) return emotes;
      const messageCharacters = [...messageText];
      for (const emoteInstancesSrc of emotesSrc.split("/")) {
        const [emoteID, instancesSrc] = emoteInstancesSrc.split(":", 2);
        for (const instanceSrc of instancesSrc.split(",")) {
          let [startIndex, endIndex] = instanceSrc
            .split("-")
            .map(common_1.parseIntThrowing);
          if (null == endIndex)
            throw new parse_error_1.ParseError(
              `No - found in emote index range "${instanceSrc}"`
            );
          (endIndex += 1),
            startIndex < 0 && (startIndex = 0),
            endIndex > messageCharacters.length &&
              (endIndex = messageCharacters.length);
          const emoteText = messageCharacters
            .slice(startIndex, endIndex)
            .join("");
          emotes.push(
            new emote_1.TwitchEmote(emoteID, startIndex, endIndex, emoteText)
          );
        }
      }
      return emotes.sort((a, b) => a.startIndex - b.startIndex), emotes;
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.TwitchEmote = void 0);
    exports.TwitchEmote = class {
      constructor(id, startIndex, endIndex, text) {
        (this.id = id),
          (this.startIndex = startIndex),
          (this.endIndex = endIndex),
          (this.code = text);
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseIntThrowing = void 0);
    const parse_error_1 = __webpack_require__(8);
    exports.parseIntThrowing = function (str) {
      if (null == str)
        throw new parse_error_1.ParseError(
          "String source for integer is null/undefined"
        );
      const parsedInt = parseInt(str);
      if (isNaN(parsedInt))
        throw new parse_error_1.ParseError(
          `Invalid integer for string "${str}"`
        );
      return parsedInt;
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.MissingTagError = void 0);
    const reason_for_value_1 = __webpack_require__(30),
      missing_data_error_1 = __webpack_require__(40);
    class MissingTagError extends missing_data_error_1.MissingDataError {
      constructor(tagKey, actualValue, cause) {
        super(
          `Required tag value not present at key "${tagKey}" (is ${reason_for_value_1.reasonForValue(
            actualValue
          )})`,
          cause
        ),
          (this.tagKey = tagKey),
          (this.actualValue = actualValue);
      }
    }
    exports.MissingTagError = MissingTagError;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.IgnoreUnhandledPromiseRejectionsMixin = void 0);
    const apply_function_replacements_1 = __webpack_require__(19),
      ignore_errors_1 = __webpack_require__(41);
    exports.IgnoreUnhandledPromiseRejectionsMixin = class {
      applyToClient(client) {
        const genericReplacement = (originalFn, ...args) => {
          const originalPromise = originalFn(...args);
          return (
            originalPromise.catch(ignore_errors_1.ignoreErrors), originalPromise
          );
        };
        apply_function_replacements_1.applyReplacements(this, client, {
          join: genericReplacement,
          part: genericReplacement,
          privmsg: genericReplacement,
          say: genericReplacement,
          me: genericReplacement,
          whisper: genericReplacement,
          setColor: genericReplacement,
          ping: genericReplacement,
        });
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ConnectionRateLimiter = void 0);
    const semaphore_async_await_1 = __webpack_require__(42),
      apply_function_replacements_1 = __webpack_require__(19);
    exports.ConnectionRateLimiter = class {
      constructor(client) {
        (this.client = client),
          (this.semaphore = new semaphore_async_await_1.default(
            this.client.configuration.connectionRateLimits.parallelConnections
          ));
      }
      async acquire() {
        await this.semaphore.acquire();
      }
      releaseOnConnect(conn) {
        const unsubscribers = [],
          done = () => {
            unsubscribers.forEach((e) => e()),
              setTimeout(
                () => this.semaphore.release(),
                this.client.configuration.connectionRateLimits.releaseTime
              );
          };
        conn.on("connect", done),
          conn.on("close", done),
          unsubscribers.push(() => conn.removeListener("connect", done)),
          unsubscribers.push(() => conn.removeListener("close", done));
      }
      applyToClient(client) {
        client.connectionMixins.push(this);
      }
      applyToConnection(connection) {
        apply_function_replacements_1.applyReplacements(
          this,
          connection.transport,
          {
            connect(originalFn, connectionListener) {
              this.acquire().then(() => {
                originalFn(connectionListener),
                  this.releaseOnConnect(connection);
              });
            },
          }
        );
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator.throw(value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : new P(function (resolve) {
                    resolve(result.value);
                  }).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next()
            );
          });
        },
      __generator =
        (this && this.__generator) ||
        function (thisArg, body) {
          var f,
            y,
            t,
            _ = {
              label: 0,
              sent: function () {
                if (1 & t[0]) throw t[1];
                return t[1];
              },
              trys: [],
              ops: [],
            };
          return { next: verb(0), throw: verb(1), return: verb(2) };
          function verb(n) {
            return function (v) {
              return (function (op) {
                if (f) throw new TypeError("Generator is already executing.");
                for (; _; )
                  try {
                    if (
                      ((f = 1),
                      y &&
                        (t =
                          y[2 & op[0] ? "return" : op[0] ? "throw" : "next"]) &&
                        !(t = t.call(y, op[1])).done)
                    )
                      return t;
                    switch (((y = 0), t && (op = [0, t.value]), op[0])) {
                      case 0:
                      case 1:
                        t = op;
                        break;
                      case 4:
                        return _.label++, { value: op[1], done: !1 };
                      case 5:
                        _.label++, (y = op[1]), (op = [0]);
                        continue;
                      case 7:
                        (op = _.ops.pop()), _.trys.pop();
                        continue;
                      default:
                        if (
                          !((t = _.trys),
                          (t = t.length > 0 && t[t.length - 1]) ||
                            (6 !== op[0] && 2 !== op[0]))
                        ) {
                          _ = 0;
                          continue;
                        }
                        if (
                          3 === op[0] &&
                          (!t || (op[1] > t[0] && op[1] < t[3]))
                        ) {
                          _.label = op[1];
                          break;
                        }
                        if (6 === op[0] && _.label < t[1]) {
                          (_.label = t[1]), (t = op);
                          break;
                        }
                        if (t && _.label < t[2]) {
                          (_.label = t[2]), _.ops.push(op);
                          break;
                        }
                        t[2] && _.ops.pop(), _.trys.pop();
                        continue;
                    }
                    op = body.call(thisArg, _);
                  } catch (e) {
                    (op = [6, e]), (y = 0);
                  } finally {
                    f = t = 0;
                  }
                if (5 & op[0]) throw op[1];
                return { value: op[0] ? op[1] : void 0, done: !0 };
              })([n, v]);
            };
          }
        };
    exports.__esModule = !0;
    var Semaphore = (function () {
      function Semaphore(permits) {
        (this.promiseResolverQueue = []), (this.permits = permits);
      }
      return (
        (Semaphore.prototype.getPermits = function () {
          return this.permits;
        }),
        (Semaphore.prototype.wait = function () {
          return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
              return this.permits > 0
                ? ((this.permits -= 1), [2, Promise.resolve(!0)])
                : [
                    2,
                    new Promise(function (resolver) {
                      return _this.promiseResolverQueue.push(resolver);
                    }),
                  ];
            });
          });
        }),
        (Semaphore.prototype.acquire = function () {
          return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
              return [2, this.wait()];
            });
          });
        }),
        (Semaphore.prototype.waitFor = function (milliseconds) {
          return __awaiter(this, void 0, void 0, function () {
            var resolver,
              promise,
              _this = this;
            return __generator(this, function (_a) {
              return this.permits > 0
                ? ((this.permits -= 1), [2, Promise.resolve(!0)])
                : ((resolver = function (b) {}),
                  (promise = new Promise(function (r) {
                    resolver = r;
                  })),
                  this.promiseResolverQueue.push(resolver),
                  setTimeout(function () {
                    var index = _this.promiseResolverQueue.indexOf(resolver);
                    -1 !== index && _this.promiseResolverQueue.splice(index, 1),
                      resolver(!1);
                  }, milliseconds),
                  [2, promise]);
            });
          });
        }),
        (Semaphore.prototype.tryAcquire = function () {
          return this.permits > 0 && ((this.permits -= 1), !0);
        }),
        (Semaphore.prototype.drainPermits = function () {
          if (this.permits > 0) {
            var permitCount = this.permits;
            return (this.permits = 0), permitCount;
          }
          return 0;
        }),
        (Semaphore.prototype.signal = function () {
          if (
            ((this.permits += 1),
            this.permits > 1 && this.promiseResolverQueue.length > 0)
          )
            throw new Error(
              "this.permits should never be > 0 when there is someone waiting."
            );
          if (1 === this.permits && this.promiseResolverQueue.length > 0) {
            this.permits -= 1;
            var nextResolver = this.promiseResolverQueue.shift();
            nextResolver && nextResolver(!0);
          }
        }),
        (Semaphore.prototype.release = function () {
          this.signal();
        }),
        (Semaphore.prototype.execute = function (func) {
          return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [4, this.wait()];
                case 1:
                  _a.sent(), (_a.label = 2);
                case 2:
                  return _a.trys.push([2, , 4, 5]), [4, func()];
                case 3:
                  return [2, _a.sent()];
                case 4:
                  return this.signal(), [7];
                case 5:
                  return [2];
              }
            });
          });
        }),
        Semaphore
      );
    })();
    exports.default = Semaphore;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.PrivmsgMessageRateLimiter = void 0);
    const semaphore_async_await_1 = __webpack_require__(42),
      apply_function_replacements_1 = __webpack_require__(19),
      utils_1 = __webpack_require__(31);
    exports.PrivmsgMessageRateLimiter = class {
      constructor(client) {
        (this.client = client),
          (this.highPrivmsgSemaphore = new semaphore_async_await_1.default(
            this.client.configuration.rateLimits.highPrivmsgLimits
          )),
          (this.lowPrivmsgSemaphore = new semaphore_async_await_1.default(
            this.client.configuration.rateLimits.lowPrivmsgLimits
          ));
      }
      applyToClient(client) {
        const genericReplament = async (oldFn, channelName, message) => {
          const releaseFn = await this.acquire(channelName);
          try {
            return await oldFn(channelName, message);
          } finally {
            setTimeout(releaseFn, 35e3);
          }
        };
        apply_function_replacements_1.applyReplacements(this, client, {
          say: genericReplament,
          me: genericReplament,
          privmsg: genericReplament,
        });
      }
      async acquire(channelName) {
        const { fastSpam: fastSpam } = utils_1.canSpamFast(
            channelName,
            this.client.configuration.username,
            this.client.userStateTracker
          ),
          promises = [];
        promises.push(this.highPrivmsgSemaphore.acquire()),
          fastSpam || promises.push(this.lowPrivmsgSemaphore.acquire());
        return (
          await Promise.all(promises),
          () => {
            fastSpam || this.lowPrivmsgSemaphore.release(),
              this.highPrivmsgSemaphore.release();
          }
        );
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.RoomStateTracker = void 0);
    const debugLogger = __webpack_require__(38),
      eventemitter3_1 = __webpack_require__(37),
      roomstate_1 = __webpack_require__(44),
      log = debugLogger("dank-twitch-irc:roomstate-tracker");
    class RoomStateTracker extends eventemitter3_1.EventEmitter {
      constructor() {
        super(...arguments), (this.channelStates = {});
      }
      getChannelState(channelName) {
        return this.channelStates[channelName];
      }
      applyToClient(client) {
        (client.roomStateTracker = this),
          client.on("ROOMSTATE", this.onRoomstateMessage.bind(this));
      }
      onRoomstateMessage(msg) {
        const currentState = this.getChannelState(msg.channelName),
          extractedState = msg.extractRoomState();
        if (null == currentState) {
          if (!roomstate_1.hasAllStateTags(extractedState))
            return void log.warn(
              "Got incomplete ROOMSTATE before receiving complete roomstate:",
              msg.rawSource
            );
          (this.channelStates[msg.channelName] = extractedState),
            this.emit("newChannelState", msg.channelName, extractedState);
        } else {
          const newState = Object.assign({}, currentState, extractedState);
          (this.channelStates[msg.channelName] = newState),
            this.emit("newChannelState", msg.channelName, newState);
        }
      }
    }
    exports.RoomStateTracker = RoomStateTracker;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.joinAll = void 0);
    const constants_1 = __webpack_require__(100),
      split_into_chunks_1 = __webpack_require__(101),
      join_1 = __webpack_require__(45);
    exports.joinAll = async function (conn, channelNames) {
      channelNames.forEach((channelName) =>
        conn.wantedChannels.add(channelName)
      );
      const channelChunks = split_into_chunks_1.splitIntoChunks(
          channelNames.map((e) => `#${e}`),
          ",",
          constants_1.MAX_OUTGOING_COMMAND_LENGTH - "JOIN ".length
        ),
        resultsMap = {};
      for (const chunk of channelChunks) {
        conn.sendRaw(`JOIN ${chunk.join(",")}`);
        const chunkNames = chunk.map((s) => s.slice(1)),
          chunkPromises = [];
        for (const channelName of chunkNames)
          chunkPromises.push(
            join_1.awaitJoinResponse(conn, channelName).then(
              () => {
                conn.joinedChannels.add(channelName),
                  (resultsMap[channelName] = void 0);
              },
              (error) => {
                resultsMap[channelName] = error;
              }
            )
          );
        await Promise.all(chunkPromises);
      }
      return resultsMap;
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.MAX_OUTGOING_COMMAND_LENGTH = exports.MAX_OUTGOING_LINE_LENGTH =
        void 0),
      (exports.MAX_OUTGOING_LINE_LENGTH = 4096),
      (exports.MAX_OUTGOING_COMMAND_LENGTH =
        exports.MAX_OUTGOING_LINE_LENGTH - 2);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.splitIntoChunks = void 0),
      (exports.splitIntoChunks = function (bits, separator = " ", limit) {
        const chunks = [];
        let currentChunk = [],
          currentChunkJoinedLength = 0;
        const tryAppend = (bit, recursive = !1) => {
          let addedLength;
          if (
            ((addedLength =
              currentChunk.length <= 0
                ? bit.length
                : separator.length + bit.length),
            currentChunkJoinedLength + addedLength <= limit)
          )
            currentChunk.push(bit), (currentChunkJoinedLength += addedLength);
          else {
            if (
              (chunks.push(currentChunk),
              (currentChunk = []),
              (currentChunkJoinedLength = 0),
              recursive)
            )
              throw new Error(
                "Found a piece that can never fit the target length limit"
              );
            tryAppend(bit, !0);
          }
        };
        for (const bit of bits) tryAppend(bit);
        return currentChunk.length > 0 && chunks.push(currentChunk), chunks;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.partChannel =
        exports.partNothingToDo =
        exports.awaitPartResponse =
        exports.PartError =
          void 0);
    const await_response_1 = __webpack_require__(3),
      errors_1 = __webpack_require__(1),
      part_1 = __webpack_require__(47);
    class PartError extends errors_1.MessageError {
      constructor(failedChannelName, message, cause) {
        super(message, cause), (this.failedChannelName = failedChannelName);
      }
    }
    async function awaitPartResponse(conn, channelName) {
      return await_response_1.awaitResponse(conn, {
        success: (msg) =>
          msg instanceof part_1.PartMessage &&
          msg.channelName === channelName &&
          msg.partedUsername === conn.configuration.username,
        errorType: (m, e) => new PartError(channelName, m, e),
        errorMessage: `Failed to part channel ${channelName}`,
      });
    }
    function partNothingToDo(conn, channelName) {
      return (
        !conn.wantedChannels.has(channelName) &&
        !conn.joinedChannels.has(channelName)
      );
    }
    (exports.PartError = PartError),
      (exports.awaitPartResponse = awaitPartResponse),
      (exports.partNothingToDo = partNothingToDo),
      (exports.partChannel = async function (conn, channelName) {
        if (partNothingToDo(conn, channelName)) return;
        conn.sendRaw(`PART #${channelName}`),
          conn.wantedChannels.delete(channelName);
        const response = await awaitPartResponse(conn, channelName);
        return conn.joinedChannels.delete(channelName), response;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.me =
        exports.say =
        exports.SayError =
        exports.removeCommands =
          void 0);
    const await_response_1 = __webpack_require__(3),
      errors_1 = __webpack_require__(1),
      notice_1 = __webpack_require__(10),
      userstate_1 = __webpack_require__(50),
      privmsg_1 = __webpack_require__(13);
    function removeCommands(message) {
      return message.startsWith(".") || message.startsWith("/")
        ? `/ ${message}`
        : message;
    }
    exports.removeCommands = removeCommands;
    class SayError extends errors_1.MessageError {
      constructor(failedChannelName, failedMessage, action, message, cause) {
        super(message, cause),
          (this.failedChannelName = failedChannelName),
          (this.messageText = failedMessage),
          (this.action = action);
      }
    }
    exports.SayError = SayError;
    const badNoticeIDs = [
      "msg_banned",
      "msg_bad_characters",
      "msg_channel_blocked",
      "msg_channel_suspended",
      "msg_duplicate",
      "msg_emoteonly",
      "msg_facebook",
      "msg_followersonly",
      "msg_followersonly_followed",
      "msg_followersonly_zero",
      "msg_r9k",
      "msg_ratelimit",
      "msg_rejected",
      "msg_rejected_mandatory",
      "msg_room_not_found",
      "msg_slowmode",
      "msg_subsonly",
      "msg_suspended",
      "msg_timedout",
      "msg_verified_email",
    ];
    async function say(conn, channelName, messageText, action = !1) {
      let command, errorMessage, errorType;
      return (
        action
          ? ((command = `/me ${messageText}`),
            (errorMessage = `Failed to say [#${channelName}]: /me ${messageText}`),
            (errorType = (msg, cause) =>
              new SayError(channelName, messageText, !0, msg, cause)))
          : ((command = removeCommands(messageText)),
            (errorMessage = `Failed to say [#${channelName}]: ${messageText}`),
            (errorType = (msg, cause) =>
              new SayError(channelName, messageText, !1, msg, cause))),
        privmsg_1.sendPrivmsg(conn, channelName, command),
        await_response_1.awaitResponse(conn, {
          success: (msg) =>
            msg instanceof userstate_1.UserstateMessage &&
            msg.channelName === channelName,
          failure: (msg) =>
            msg instanceof notice_1.NoticeMessage &&
            msg.channelName === channelName &&
            badNoticeIDs.includes(msg.messageID),
          errorType: errorType,
          errorMessage: errorMessage,
        })
      );
    }
    (exports.say = say),
      (exports.me = async function (conn, channelName, message) {
        return say(conn, channelName, message, !0);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function toPaddedHex(i, shouldBeLength) {
      const s = i.toString(16);
      return "0".repeat(shouldBeLength - s.length) + s;
    }
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.colorToHexString = void 0),
      (exports.colorToHexString = function (color) {
        return (
          "#" +
          toPaddedHex(color.r, 2) +
          toPaddedHex(color.g, 2) +
          toPaddedHex(color.b, 2)
        );
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.timeout = exports.UserTimeoutError = void 0);
    const ms = __webpack_require__(210),
      await_response_1 = __webpack_require__(3),
      conditions_1 = __webpack_require__(39),
      errors_1 = __webpack_require__(1),
      channel_1 = __webpack_require__(24),
      privmsg_1 = __webpack_require__(13);
    class UserTimeoutError extends errors_1.MessageError {
      constructor(channelName, username, length, reason, message, cause) {
        super(message, cause),
          (this.channelName = channelName),
          (this.username = username),
          (this.length = length),
          (this.reason = reason);
      }
    }
    exports.UserTimeoutError = UserTimeoutError;
    const failureNoticeIDs = [
        "no_permission",
        "bad_timeout_admin",
        "bad_timeout_anon",
        "bad_timeout_broadcaster",
        "bad_timeout_duration",
        "bad_timeout_global_mod",
        "bad_timeout_mod",
        "bad_timeout_self",
        "bad_timeout_staff",
        "usage_timeout",
      ],
      successNoticeIDs = ["timeout_success", "already_banned"];
    exports.timeout = async function (
      conn,
      channelName,
      username,
      length,
      reason
    ) {
      let cmd;
      channel_1.validateChannelName(channelName),
        channel_1.validateChannelName(username),
        (cmd =
          null != reason
            ? `/timeout ${username} ${length} ${reason}`
            : `/timeout ${username} ${length}`),
        await privmsg_1.sendPrivmsg(conn, channelName, cmd),
        await await_response_1.awaitResponse(conn, {
          success: conditions_1.matchingNotice(channelName, successNoticeIDs),
          failure: conditions_1.matchingNotice(channelName, failureNoticeIDs),
          errorType: (msg, cause) =>
            new UserTimeoutError(
              channelName,
              username,
              length,
              reason,
              msg,
              cause
            ),
          errorMessage: `Failed to timeout ${username} for ${ms(
            1e3 * length
          )} in #${channelName}`,
        });
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ban = exports.UserBanError = void 0);
    const await_response_1 = __webpack_require__(3),
      conditions_1 = __webpack_require__(39),
      errors_1 = __webpack_require__(1),
      channel_1 = __webpack_require__(24),
      privmsg_1 = __webpack_require__(13);
    class UserBanError extends errors_1.MessageError {
      constructor(channelName, username, reason, message, cause) {
        super(message, cause),
          (this.channelName = channelName),
          (this.username = username),
          (this.reason = reason);
      }
    }
    exports.UserBanError = UserBanError;
    const failureNoticeIDs = [
        "no_permission",
        "bad_ban_admin",
        "bad_ban_anon",
        "bad_ban_broadcaster",
        "bad_ban_global_mod",
        "bad_ban_mod",
        "bad_ban_self",
        "bad_ban_staff",
        "usage_ban",
      ],
      successNoticeIDs = ["ban_success", "already_banned"];
    exports.ban = async function (conn, channelName, username, reason) {
      let cmd;
      channel_1.validateChannelName(channelName),
        channel_1.validateChannelName(username),
        (cmd =
          null != reason ? `/ban ${username} ${reason}` : `/ban ${username}`),
        await privmsg_1.sendPrivmsg(conn, channelName, cmd),
        await await_response_1.awaitResponse(conn, {
          success: conditions_1.matchingNotice(channelName, successNoticeIDs),
          failure: conditions_1.matchingNotice(channelName, failureNoticeIDs),
          errorType: (msg, cause) =>
            new UserBanError(channelName, username, reason, msg, cause),
          errorMessage: `Failed to ban ${username} in #${channelName}`,
        });
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.whisper = exports.WhisperError = void 0);
    const await_response_1 = __webpack_require__(3),
      errors_1 = __webpack_require__(1),
      notice_1 = __webpack_require__(10),
      channel_1 = __webpack_require__(24),
      privmsg_1 = __webpack_require__(13);
    class WhisperError extends errors_1.MessageError {
      constructor(targetUsername, failedMessage, message, cause) {
        super(message, cause),
          (this.targetUsername = targetUsername),
          (this.failedMessage = failedMessage);
      }
    }
    exports.WhisperError = WhisperError;
    const badNoticeIDs = [
      "whisper_banned",
      "whisper_banned_recipient",
      "whisper_invalid_args",
      "whisper_invalid_login",
      "whisper_invalid_self",
      "whisper_limit_per_min",
      "whisper_limit_per_sec",
      "whisper_restricted",
      "whisper_restricted_recipient",
    ];
    exports.whisper = async function (conn, username, message) {
      return (
        channel_1.validateChannelName(username),
        privmsg_1.sendPrivmsg(
          conn,
          conn.configuration.username,
          `/w ${username} ${message}`
        ),
        await_response_1.awaitResponse(conn, {
          failure: (msg) =>
            msg instanceof notice_1.NoticeMessage &&
            msg.channelName === conn.configuration.username &&
            badNoticeIDs.includes(msg.messageID),
          noResponseAction: "success",
          timeout: 1e3,
          errorType: (msg, cause) =>
            new WhisperError(username, message, msg, cause),
          errorMessage: `Failed to whisper [${username}]: ${message}`,
        })
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.findAndPushToEnd = void 0),
      (exports.findAndPushToEnd = function (arr, filter) {
        const result = (function (arr, filter) {
          for (const [index, value] of arr.entries())
            if (filter(value)) return { index: index, value: value };
        })(arr, filter);
        if (null == result) return;
        const { index: index, value: value } = result;
        return arr.splice(index, 1), arr.push(value), value;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.removeInPlace = void 0),
      (exports.removeInPlace = function (arr, element) {
        let index;
        for (; -1 !== (index = arr.indexOf(element)); ) arr.splice(index, 1);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.unionSets = void 0),
      (exports.unionSets = function (sets) {
        const newSet = new Set();
        for (const set of sets) for (const element of set) newSet.add(element);
        return newSet;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.SingleConnection = void 0);
    const debugLogger = __webpack_require__(38),
      split2 = __webpack_require__(211),
      handle_reconnect_message_1 = __webpack_require__(118),
      reply_to_ping_1 = __webpack_require__(119),
      send_pings_1 = __webpack_require__(120),
      twitch_message_1 = __webpack_require__(121),
      login_1 = __webpack_require__(133),
      request_capabilities_1 = __webpack_require__(135),
      any_cause_instanceof_1 = __webpack_require__(52),
      ignore_errors_1 = __webpack_require__(41),
      irc_command_1 = __webpack_require__(136),
      base_client_1 = __webpack_require__(36),
      errors_1 = __webpack_require__(1),
      make_transport_1 = __webpack_require__(58);
    let connectionIDCounter = 0;
    class SingleConnection extends base_client_1.BaseClient {
      constructor(configuration) {
        super(configuration),
          (this.connectionID = connectionIDCounter++),
          (this.wantedChannels = new Set()),
          (this.joinedChannels = new Set()),
          (this.pendingResponses = []),
          (this.log = debugLogger(
            `dank-twitch-irc:connection:${this.connectionID}`
          )),
          this.on("error", (e) => {
            any_cause_instanceof_1.anyCauseInstanceof(
              e,
              errors_1.ConnectionError
            ) &&
              process.nextTick(() => {
                this.emitClosed(e), this.transport.stream.destroy(e);
              });
          }),
          this.on("connect", this.onConnect.bind(this)),
          (this.transport = make_transport_1.makeTransport(
            this.configuration.connection
          )),
          this.transport.stream.on("close", () => {
            this.emitClosed();
          }),
          this.transport.stream.on("error", (e) => {
            const emittedError = new errors_1.ConnectionError(
              "Error occurred in transport layer",
              e
            );
            this.emitError(emittedError),
              this.emitClosed(emittedError),
              this.transport.stream.destroy(emittedError);
          }),
          this.transport.stream
            .pipe(split2())
            .on("data", this.handleLine.bind(this)),
          reply_to_ping_1.replyToServerPing(this),
          handle_reconnect_message_1.handleReconnectMessage(this),
          this.on("message", (msg) => {
            for (const awaiter of this.pendingResponses) {
              if (awaiter.onConnectionMessage(msg)) break;
            }
          });
      }
      connect() {
        if (!this.unconnected)
          throw new Error(
            "connect() may only be called on unconnected connections"
          );
        if ((this.emitConnecting(), this.configuration.connection.preSetup))
          this.once("connect", () => {
            process.nextTick(() => this.emitReady());
          });
        else {
          const promises = [
            request_capabilities_1.requestCapabilities(
              this,
              this.configuration.requestMembershipCapability
            ),
            login_1.sendLogin(
              this,
              this.configuration.username,
              this.configuration.password
            ),
          ];
          Promise.all(promises).then(
            () => this.emitReady(),
            ignore_errors_1.ignoreErrors
          );
        }
        this.transport.connect(() => this.emitConnected());
      }
      close() {
        this.transport.stream.destroy();
      }
      destroy(error) {
        this.transport.stream.destroy(error);
      }
      sendRaw(command) {
        irc_command_1.validateIRCCommand(command),
          this.emit("rawCommmand", command),
          this.log.trace(">", command),
          this.transport.stream.write(command + "\r\n");
      }
      onConnect() {
        send_pings_1.sendClientPings(this);
      }
      use(mixin) {
        mixin.applyToConnection(this);
      }
      handleLine(line) {
        if (line.length <= 0) return;
        let message;
        this.log.trace("<", line);
        try {
          message = twitch_message_1.parseTwitchMessage(line);
        } catch (e) {
          return void this.emitError(
            new errors_1.ProtocolError(
              `Error while parsing IRC message from line "${line}"`,
              e
            )
          );
        }
        this.emitMessage(message);
      }
    }
    exports.SingleConnection = SingleConnection;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var Duplex;
    (module.exports = Readable), (Readable.ReadableState = ReadableState);
    __webpack_require__(22).EventEmitter;
    var EElistenerCount = function (emitter, type) {
        return emitter.listeners(type).length;
      },
      Stream = __webpack_require__(113),
      Buffer = __webpack_require__(7).Buffer,
      OurUint8Array = global.Uint8Array || function () {};
    var debug,
      debugUtil = __webpack_require__(4);
    debug =
      debugUtil && debugUtil.debuglog
        ? debugUtil.debuglog("stream")
        : function () {};
    var StringDecoder,
      createReadableStreamAsyncIterator,
      from,
      BufferList = __webpack_require__(213),
      destroyImpl = __webpack_require__(114),
      getHighWaterMark = __webpack_require__(115).getHighWaterMark,
      _require$codes = __webpack_require__(14).codes,
      ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
      ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_STREAM_UNSHIFT_AFTER_END_EVENT =
        _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    __webpack_require__(2)(Readable, Stream);
    var errorOrDestroy = destroyImpl.errorOrDestroy,
      kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function ReadableState(options, stream, isDuplex) {
      (Duplex = Duplex || __webpack_require__(20)),
        (options = options || {}),
        "boolean" != typeof isDuplex && (isDuplex = stream instanceof Duplex),
        (this.objectMode = !!options.objectMode),
        isDuplex &&
          (this.objectMode = this.objectMode || !!options.readableObjectMode),
        (this.highWaterMark = getHighWaterMark(
          this,
          options,
          "readableHighWaterMark",
          isDuplex
        )),
        (this.buffer = new BufferList()),
        (this.length = 0),
        (this.pipes = null),
        (this.pipesCount = 0),
        (this.flowing = null),
        (this.ended = !1),
        (this.endEmitted = !1),
        (this.reading = !1),
        (this.sync = !0),
        (this.needReadable = !1),
        (this.emittedReadable = !1),
        (this.readableListening = !1),
        (this.resumeScheduled = !1),
        (this.paused = !0),
        (this.emitClose = !1 !== options.emitClose),
        (this.autoDestroy = !!options.autoDestroy),
        (this.destroyed = !1),
        (this.defaultEncoding = options.defaultEncoding || "utf8"),
        (this.awaitDrain = 0),
        (this.readingMore = !1),
        (this.decoder = null),
        (this.encoding = null),
        options.encoding &&
          (StringDecoder ||
            (StringDecoder = __webpack_require__(16).StringDecoder),
          (this.decoder = new StringDecoder(options.encoding)),
          (this.encoding = options.encoding));
    }
    function Readable(options) {
      if (
        ((Duplex = Duplex || __webpack_require__(20)),
        !(this instanceof Readable))
      )
        return new Readable(options);
      var isDuplex = this instanceof Duplex;
      (this._readableState = new ReadableState(options, this, isDuplex)),
        (this.readable = !0),
        options &&
          ("function" == typeof options.read && (this._read = options.read),
          "function" == typeof options.destroy &&
            (this._destroy = options.destroy)),
        Stream.call(this);
    }
    function readableAddChunk(
      stream,
      chunk,
      encoding,
      addToFront,
      skipChunkCheck
    ) {
      debug("readableAddChunk", chunk);
      var er,
        state = stream._readableState;
      if (null === chunk)
        (state.reading = !1),
          (function (stream, state) {
            if ((debug("onEofChunk"), state.ended)) return;
            if (state.decoder) {
              var chunk = state.decoder.end();
              chunk &&
                chunk.length &&
                (state.buffer.push(chunk),
                (state.length += state.objectMode ? 1 : chunk.length));
            }
            (state.ended = !0),
              state.sync
                ? emitReadable(stream)
                : ((state.needReadable = !1),
                  state.emittedReadable ||
                    ((state.emittedReadable = !0), emitReadable_(stream)));
          })(stream, state);
      else if (
        (skipChunkCheck ||
          (er = (function (state, chunk) {
            var er;
            (obj = chunk),
              Buffer.isBuffer(obj) ||
                obj instanceof OurUint8Array ||
                "string" == typeof chunk ||
                void 0 === chunk ||
                state.objectMode ||
                (er = new ERR_INVALID_ARG_TYPE(
                  "chunk",
                  ["string", "Buffer", "Uint8Array"],
                  chunk
                ));
            var obj;
            return er;
          })(state, chunk)),
        er)
      )
        errorOrDestroy(stream, er);
      else if (state.objectMode || (chunk && chunk.length > 0))
        if (
          ("string" == typeof chunk ||
            state.objectMode ||
            Object.getPrototypeOf(chunk) === Buffer.prototype ||
            (chunk = (function (chunk) {
              return Buffer.from(chunk);
            })(chunk)),
          addToFront)
        )
          state.endEmitted
            ? errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT())
            : addChunk(stream, state, chunk, !0);
        else if (state.ended)
          errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
        else {
          if (state.destroyed) return !1;
          (state.reading = !1),
            state.decoder && !encoding
              ? ((chunk = state.decoder.write(chunk)),
                state.objectMode || 0 !== chunk.length
                  ? addChunk(stream, state, chunk, !1)
                  : maybeReadMore(stream, state))
              : addChunk(stream, state, chunk, !1);
        }
      else addToFront || ((state.reading = !1), maybeReadMore(stream, state));
      return (
        !state.ended &&
        (state.length < state.highWaterMark || 0 === state.length)
      );
    }
    function addChunk(stream, state, chunk, addToFront) {
      state.flowing && 0 === state.length && !state.sync
        ? ((state.awaitDrain = 0), stream.emit("data", chunk))
        : ((state.length += state.objectMode ? 1 : chunk.length),
          addToFront ? state.buffer.unshift(chunk) : state.buffer.push(chunk),
          state.needReadable && emitReadable(stream)),
        maybeReadMore(stream, state);
    }
    Object.defineProperty(Readable.prototype, "destroyed", {
      enumerable: !1,
      get: function () {
        return void 0 !== this._readableState && this._readableState.destroyed;
      },
      set: function (value) {
        this._readableState && (this._readableState.destroyed = value);
      },
    }),
      (Readable.prototype.destroy = destroyImpl.destroy),
      (Readable.prototype._undestroy = destroyImpl.undestroy),
      (Readable.prototype._destroy = function (err, cb) {
        cb(err);
      }),
      (Readable.prototype.push = function (chunk, encoding) {
        var skipChunkCheck,
          state = this._readableState;
        return (
          state.objectMode
            ? (skipChunkCheck = !0)
            : "string" == typeof chunk &&
              ((encoding = encoding || state.defaultEncoding) !==
                state.encoding &&
                ((chunk = Buffer.from(chunk, encoding)), (encoding = "")),
              (skipChunkCheck = !0)),
          readableAddChunk(this, chunk, encoding, !1, skipChunkCheck)
        );
      }),
      (Readable.prototype.unshift = function (chunk) {
        return readableAddChunk(this, chunk, null, !0, !1);
      }),
      (Readable.prototype.isPaused = function () {
        return !1 === this._readableState.flowing;
      }),
      (Readable.prototype.setEncoding = function (enc) {
        StringDecoder ||
          (StringDecoder = __webpack_require__(16).StringDecoder);
        var decoder = new StringDecoder(enc);
        (this._readableState.decoder = decoder),
          (this._readableState.encoding = this._readableState.decoder.encoding);
        for (
          var p = this._readableState.buffer.head, content = "";
          null !== p;

        )
          (content += decoder.write(p.data)), (p = p.next);
        return (
          this._readableState.buffer.clear(),
          "" !== content && this._readableState.buffer.push(content),
          (this._readableState.length = content.length),
          this
        );
      });
    function howMuchToRead(n, state) {
      return n <= 0 || (0 === state.length && state.ended)
        ? 0
        : state.objectMode
        ? 1
        : n != n
        ? state.flowing && state.length
          ? state.buffer.head.data.length
          : state.length
        : (n > state.highWaterMark &&
            (state.highWaterMark = (function (n) {
              return (
                n >= 1073741824
                  ? (n = 1073741824)
                  : (n--,
                    (n |= n >>> 1),
                    (n |= n >>> 2),
                    (n |= n >>> 4),
                    (n |= n >>> 8),
                    (n |= n >>> 16),
                    n++),
                n
              );
            })(n)),
          n <= state.length
            ? n
            : state.ended
            ? state.length
            : ((state.needReadable = !0), 0));
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      debug("emitReadable", state.needReadable, state.emittedReadable),
        (state.needReadable = !1),
        state.emittedReadable ||
          (debug("emitReadable", state.flowing),
          (state.emittedReadable = !0),
          process.nextTick(emitReadable_, stream));
    }
    function emitReadable_(stream) {
      var state = stream._readableState;
      debug("emitReadable_", state.destroyed, state.length, state.ended),
        state.destroyed ||
          (!state.length && !state.ended) ||
          (stream.emit("readable"), (state.emittedReadable = !1)),
        (state.needReadable =
          !state.flowing &&
          !state.ended &&
          state.length <= state.highWaterMark),
        flow(stream);
    }
    function maybeReadMore(stream, state) {
      state.readingMore ||
        ((state.readingMore = !0),
        process.nextTick(maybeReadMore_, stream, state));
    }
    function maybeReadMore_(stream, state) {
      for (
        ;
        !state.reading &&
        !state.ended &&
        (state.length < state.highWaterMark ||
          (state.flowing && 0 === state.length));

      ) {
        var len = state.length;
        if (
          (debug("maybeReadMore read 0"), stream.read(0), len === state.length)
        )
          break;
      }
      state.readingMore = !1;
    }
    function updateReadableListening(self) {
      var state = self._readableState;
      (state.readableListening = self.listenerCount("readable") > 0),
        state.resumeScheduled && !state.paused
          ? (state.flowing = !0)
          : self.listenerCount("data") > 0 && self.resume();
    }
    function nReadingNextTick(self) {
      debug("readable nexttick read 0"), self.read(0);
    }
    function resume_(stream, state) {
      debug("resume", state.reading),
        state.reading || stream.read(0),
        (state.resumeScheduled = !1),
        stream.emit("resume"),
        flow(stream),
        state.flowing && !state.reading && stream.read(0);
    }
    function flow(stream) {
      var state = stream._readableState;
      for (
        debug("flow", state.flowing);
        state.flowing && null !== stream.read();

      );
    }
    function fromList(n, state) {
      return 0 === state.length
        ? null
        : (state.objectMode
            ? (ret = state.buffer.shift())
            : !n || n >= state.length
            ? ((ret = state.decoder
                ? state.buffer.join("")
                : 1 === state.buffer.length
                ? state.buffer.first()
                : state.buffer.concat(state.length)),
              state.buffer.clear())
            : (ret = state.buffer.consume(n, state.decoder)),
          ret);
      var ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      debug("endReadable", state.endEmitted),
        state.endEmitted ||
          ((state.ended = !0), process.nextTick(endReadableNT, state, stream));
    }
    function endReadableNT(state, stream) {
      if (
        (debug("endReadableNT", state.endEmitted, state.length),
        !state.endEmitted &&
          0 === state.length &&
          ((state.endEmitted = !0),
          (stream.readable = !1),
          stream.emit("end"),
          state.autoDestroy))
      ) {
        var wState = stream._writableState;
        (!wState || (wState.autoDestroy && wState.finished)) &&
          stream.destroy();
      }
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) if (xs[i] === x) return i;
      return -1;
    }
    (Readable.prototype.read = function (n) {
      debug("read", n), (n = parseInt(n, 10));
      var state = this._readableState,
        nOrig = n;
      if (
        (0 !== n && (state.emittedReadable = !1),
        0 === n &&
          state.needReadable &&
          ((0 !== state.highWaterMark
            ? state.length >= state.highWaterMark
            : state.length > 0) ||
            state.ended))
      )
        return (
          debug("read: emitReadable", state.length, state.ended),
          0 === state.length && state.ended
            ? endReadable(this)
            : emitReadable(this),
          null
        );
      if (0 === (n = howMuchToRead(n, state)) && state.ended)
        return 0 === state.length && endReadable(this), null;
      var ret,
        doRead = state.needReadable;
      return (
        debug("need readable", doRead),
        (0 === state.length || state.length - n < state.highWaterMark) &&
          debug("length less than watermark", (doRead = !0)),
        state.ended || state.reading
          ? debug("reading or ended", (doRead = !1))
          : doRead &&
            (debug("do read"),
            (state.reading = !0),
            (state.sync = !0),
            0 === state.length && (state.needReadable = !0),
            this._read(state.highWaterMark),
            (state.sync = !1),
            state.reading || (n = howMuchToRead(nOrig, state))),
        null === (ret = n > 0 ? fromList(n, state) : null)
          ? ((state.needReadable = state.length <= state.highWaterMark),
            (n = 0))
          : ((state.length -= n), (state.awaitDrain = 0)),
        0 === state.length &&
          (state.ended || (state.needReadable = !0),
          nOrig !== n && state.ended && endReadable(this)),
        null !== ret && this.emit("data", ret),
        ret
      );
    }),
      (Readable.prototype._read = function (n) {
        errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
      }),
      (Readable.prototype.pipe = function (dest, pipeOpts) {
        var src = this,
          state = this._readableState;
        switch (state.pipesCount) {
          case 0:
            state.pipes = dest;
            break;
          case 1:
            state.pipes = [state.pipes, dest];
            break;
          default:
            state.pipes.push(dest);
        }
        (state.pipesCount += 1),
          debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
        var endFn =
          (!pipeOpts || !1 !== pipeOpts.end) &&
          dest !== process.stdout &&
          dest !== process.stderr
            ? onend
            : unpipe;
        function onunpipe(readable, unpipeInfo) {
          debug("onunpipe"),
            readable === src &&
              unpipeInfo &&
              !1 === unpipeInfo.hasUnpiped &&
              ((unpipeInfo.hasUnpiped = !0),
              debug("cleanup"),
              dest.removeListener("close", onclose),
              dest.removeListener("finish", onfinish),
              dest.removeListener("drain", ondrain),
              dest.removeListener("error", onerror),
              dest.removeListener("unpipe", onunpipe),
              src.removeListener("end", onend),
              src.removeListener("end", unpipe),
              src.removeListener("data", ondata),
              (cleanedUp = !0),
              !state.awaitDrain ||
                (dest._writableState && !dest._writableState.needDrain) ||
                ondrain());
        }
        function onend() {
          debug("onend"), dest.end();
        }
        state.endEmitted ? process.nextTick(endFn) : src.once("end", endFn),
          dest.on("unpipe", onunpipe);
        var ondrain = (function (src) {
          return function () {
            var state = src._readableState;
            debug("pipeOnDrain", state.awaitDrain),
              state.awaitDrain && state.awaitDrain--,
              0 === state.awaitDrain &&
                EElistenerCount(src, "data") &&
                ((state.flowing = !0), flow(src));
          };
        })(src);
        dest.on("drain", ondrain);
        var cleanedUp = !1;
        function ondata(chunk) {
          debug("ondata");
          var ret = dest.write(chunk);
          debug("dest.write", ret),
            !1 === ret &&
              (((1 === state.pipesCount && state.pipes === dest) ||
                (state.pipesCount > 1 && -1 !== indexOf(state.pipes, dest))) &&
                !cleanedUp &&
                (debug("false write response, pause", state.awaitDrain),
                state.awaitDrain++),
              src.pause());
        }
        function onerror(er) {
          debug("onerror", er),
            unpipe(),
            dest.removeListener("error", onerror),
            0 === EElistenerCount(dest, "error") && errorOrDestroy(dest, er);
        }
        function onclose() {
          dest.removeListener("finish", onfinish), unpipe();
        }
        function onfinish() {
          debug("onfinish"), dest.removeListener("close", onclose), unpipe();
        }
        function unpipe() {
          debug("unpipe"), src.unpipe(dest);
        }
        return (
          src.on("data", ondata),
          (function (emitter, event, fn) {
            if ("function" == typeof emitter.prependListener)
              return emitter.prependListener(event, fn);
            emitter._events && emitter._events[event]
              ? Array.isArray(emitter._events[event])
                ? emitter._events[event].unshift(fn)
                : (emitter._events[event] = [fn, emitter._events[event]])
              : emitter.on(event, fn);
          })(dest, "error", onerror),
          dest.once("close", onclose),
          dest.once("finish", onfinish),
          dest.emit("pipe", src),
          state.flowing || (debug("pipe resume"), src.resume()),
          dest
        );
      }),
      (Readable.prototype.unpipe = function (dest) {
        var state = this._readableState,
          unpipeInfo = { hasUnpiped: !1 };
        if (0 === state.pipesCount) return this;
        if (1 === state.pipesCount)
          return (
            (dest && dest !== state.pipes) ||
              (dest || (dest = state.pipes),
              (state.pipes = null),
              (state.pipesCount = 0),
              (state.flowing = !1),
              dest && dest.emit("unpipe", this, unpipeInfo)),
            this
          );
        if (!dest) {
          var dests = state.pipes,
            len = state.pipesCount;
          (state.pipes = null), (state.pipesCount = 0), (state.flowing = !1);
          for (var i = 0; i < len; i++)
            dests[i].emit("unpipe", this, { hasUnpiped: !1 });
          return this;
        }
        var index = indexOf(state.pipes, dest);
        return (
          -1 === index ||
            (state.pipes.splice(index, 1),
            (state.pipesCount -= 1),
            1 === state.pipesCount && (state.pipes = state.pipes[0]),
            dest.emit("unpipe", this, unpipeInfo)),
          this
        );
      }),
      (Readable.prototype.on = function (ev, fn) {
        var res = Stream.prototype.on.call(this, ev, fn),
          state = this._readableState;
        return (
          "data" === ev
            ? ((state.readableListening = this.listenerCount("readable") > 0),
              !1 !== state.flowing && this.resume())
            : "readable" === ev &&
              (state.endEmitted ||
                state.readableListening ||
                ((state.readableListening = state.needReadable = !0),
                (state.flowing = !1),
                (state.emittedReadable = !1),
                debug("on readable", state.length, state.reading),
                state.length
                  ? emitReadable(this)
                  : state.reading || process.nextTick(nReadingNextTick, this))),
          res
        );
      }),
      (Readable.prototype.addListener = Readable.prototype.on),
      (Readable.prototype.removeListener = function (ev, fn) {
        var res = Stream.prototype.removeListener.call(this, ev, fn);
        return (
          "readable" === ev && process.nextTick(updateReadableListening, this),
          res
        );
      }),
      (Readable.prototype.removeAllListeners = function (ev) {
        var res = Stream.prototype.removeAllListeners.apply(this, arguments);
        return (
          ("readable" !== ev && void 0 !== ev) ||
            process.nextTick(updateReadableListening, this),
          res
        );
      }),
      (Readable.prototype.resume = function () {
        var state = this._readableState;
        return (
          state.flowing ||
            (debug("resume"),
            (state.flowing = !state.readableListening),
            (function (stream, state) {
              state.resumeScheduled ||
                ((state.resumeScheduled = !0),
                process.nextTick(resume_, stream, state));
            })(this, state)),
          (state.paused = !1),
          this
        );
      }),
      (Readable.prototype.pause = function () {
        return (
          debug("call pause flowing=%j", this._readableState.flowing),
          !1 !== this._readableState.flowing &&
            (debug("pause"),
            (this._readableState.flowing = !1),
            this.emit("pause")),
          (this._readableState.paused = !0),
          this
        );
      }),
      (Readable.prototype.wrap = function (stream) {
        var _this = this,
          state = this._readableState,
          paused = !1;
        for (var i in (stream.on("end", function () {
          if ((debug("wrapped end"), state.decoder && !state.ended)) {
            var chunk = state.decoder.end();
            chunk && chunk.length && _this.push(chunk);
          }
          _this.push(null);
        }),
        stream.on("data", function (chunk) {
          (debug("wrapped data"),
          state.decoder && (chunk = state.decoder.write(chunk)),
          state.objectMode && null == chunk) ||
            ((state.objectMode || (chunk && chunk.length)) &&
              (_this.push(chunk) || ((paused = !0), stream.pause())));
        }),
        stream))
          void 0 === this[i] &&
            "function" == typeof stream[i] &&
            (this[i] = (function (method) {
              return function () {
                return stream[method].apply(stream, arguments);
              };
            })(i));
        for (var n = 0; n < kProxyEvents.length; n++)
          stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
        return (
          (this._read = function (n) {
            debug("wrapped _read", n),
              paused && ((paused = !1), stream.resume());
          }),
          this
        );
      }),
      "function" == typeof Symbol &&
        (Readable.prototype[Symbol.asyncIterator] = function () {
          return (
            void 0 === createReadableStreamAsyncIterator &&
              (createReadableStreamAsyncIterator = __webpack_require__(214)),
            createReadableStreamAsyncIterator(this)
          );
        }),
      Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
        enumerable: !1,
        get: function () {
          return this._readableState.highWaterMark;
        },
      }),
      Object.defineProperty(Readable.prototype, "readableBuffer", {
        enumerable: !1,
        get: function () {
          return this._readableState && this._readableState.buffer;
        },
      }),
      Object.defineProperty(Readable.prototype, "readableFlowing", {
        enumerable: !1,
        get: function () {
          return this._readableState.flowing;
        },
        set: function (state) {
          this._readableState && (this._readableState.flowing = state);
        },
      }),
      (Readable._fromList = fromList),
      Object.defineProperty(Readable.prototype, "readableLength", {
        enumerable: !1,
        get: function () {
          return this._readableState.length;
        },
      }),
      "function" == typeof Symbol &&
        (Readable.from = function (iterable, opts) {
          return (
            void 0 === from && (from = __webpack_require__(215)),
            from(Readable, iterable, opts)
          );
        });
  },
  function (module, exports, __webpack_require__) {
    module.exports = __webpack_require__(6);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function emitErrorAndCloseNT(self, err) {
      emitErrorNT(self, err), emitCloseNT(self);
    }
    function emitCloseNT(self) {
      (self._writableState && !self._writableState.emitClose) ||
        (self._readableState && !self._readableState.emitClose) ||
        self.emit("close");
    }
    function emitErrorNT(self, err) {
      self.emit("error", err);
    }
    module.exports = {
      destroy: function (err, cb) {
        var _this = this,
          readableDestroyed =
            this._readableState && this._readableState.destroyed,
          writableDestroyed =
            this._writableState && this._writableState.destroyed;
        return readableDestroyed || writableDestroyed
          ? (cb
              ? cb(err)
              : err &&
                (this._writableState
                  ? this._writableState.errorEmitted ||
                    ((this._writableState.errorEmitted = !0),
                    process.nextTick(emitErrorNT, this, err))
                  : process.nextTick(emitErrorNT, this, err)),
            this)
          : (this._readableState && (this._readableState.destroyed = !0),
            this._writableState && (this._writableState.destroyed = !0),
            this._destroy(err || null, function (err) {
              !cb && err
                ? _this._writableState
                  ? _this._writableState.errorEmitted
                    ? process.nextTick(emitCloseNT, _this)
                    : ((_this._writableState.errorEmitted = !0),
                      process.nextTick(emitErrorAndCloseNT, _this, err))
                  : process.nextTick(emitErrorAndCloseNT, _this, err)
                : cb
                ? (process.nextTick(emitCloseNT, _this), cb(err))
                : process.nextTick(emitCloseNT, _this);
            }),
            this);
      },
      undestroy: function () {
        this._readableState &&
          ((this._readableState.destroyed = !1),
          (this._readableState.reading = !1),
          (this._readableState.ended = !1),
          (this._readableState.endEmitted = !1)),
          this._writableState &&
            ((this._writableState.destroyed = !1),
            (this._writableState.ended = !1),
            (this._writableState.ending = !1),
            (this._writableState.finalCalled = !1),
            (this._writableState.prefinished = !1),
            (this._writableState.finished = !1),
            (this._writableState.errorEmitted = !1));
      },
      errorOrDestroy: function (stream, err) {
        var rState = stream._readableState,
          wState = stream._writableState;
        (rState && rState.autoDestroy) || (wState && wState.autoDestroy)
          ? stream.destroy(err)
          : stream.emit("error", err);
      },
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var ERR_INVALID_OPT_VALUE =
      __webpack_require__(14).codes.ERR_INVALID_OPT_VALUE;
    module.exports = {
      getHighWaterMark: function (state, options, duplexKey, isDuplex) {
        var hwm = (function (options, isDuplex, duplexKey) {
          return null != options.highWaterMark
            ? options.highWaterMark
            : isDuplex
            ? options[duplexKey]
            : null;
        })(options, isDuplex, duplexKey);
        if (null != hwm) {
          if (!isFinite(hwm) || Math.floor(hwm) !== hwm || hwm < 0)
            throw new ERR_INVALID_OPT_VALUE(
              isDuplex ? duplexKey : "highWaterMark",
              hwm
            );
          return Math.floor(hwm);
        }
        return state.objectMode ? 16 : 16384;
      },
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function CorkedRequest(state) {
      var _this = this;
      (this.next = null),
        (this.entry = null),
        (this.finish = function () {
          !(function (corkReq, state, err) {
            var entry = corkReq.entry;
            corkReq.entry = null;
            for (; entry; ) {
              var cb = entry.callback;
              state.pendingcb--, cb(err), (entry = entry.next);
            }
            state.corkedRequestsFree.next = corkReq;
          })(_this, state);
        });
    }
    var Duplex;
    (module.exports = Writable), (Writable.WritableState = WritableState);
    var internalUtil = { deprecate: __webpack_require__(32) },
      Stream = __webpack_require__(113),
      Buffer = __webpack_require__(7).Buffer,
      OurUint8Array = global.Uint8Array || function () {};
    var realHasInstance,
      destroyImpl = __webpack_require__(114),
      getHighWaterMark = __webpack_require__(115).getHighWaterMark,
      _require$codes = __webpack_require__(14).codes,
      ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
      ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
      ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
      ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
      ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
      ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING,
      errorOrDestroy = destroyImpl.errorOrDestroy;
    function nop() {}
    function WritableState(options, stream, isDuplex) {
      (Duplex = Duplex || __webpack_require__(20)),
        (options = options || {}),
        "boolean" != typeof isDuplex && (isDuplex = stream instanceof Duplex),
        (this.objectMode = !!options.objectMode),
        isDuplex &&
          (this.objectMode = this.objectMode || !!options.writableObjectMode),
        (this.highWaterMark = getHighWaterMark(
          this,
          options,
          "writableHighWaterMark",
          isDuplex
        )),
        (this.finalCalled = !1),
        (this.needDrain = !1),
        (this.ending = !1),
        (this.ended = !1),
        (this.finished = !1),
        (this.destroyed = !1);
      var noDecode = !1 === options.decodeStrings;
      (this.decodeStrings = !noDecode),
        (this.defaultEncoding = options.defaultEncoding || "utf8"),
        (this.length = 0),
        (this.writing = !1),
        (this.corked = 0),
        (this.sync = !0),
        (this.bufferProcessing = !1),
        (this.onwrite = function (er) {
          !(function (stream, er) {
            var state = stream._writableState,
              sync = state.sync,
              cb = state.writecb;
            if ("function" != typeof cb) throw new ERR_MULTIPLE_CALLBACK();
            if (
              ((function (state) {
                (state.writing = !1),
                  (state.writecb = null),
                  (state.length -= state.writelen),
                  (state.writelen = 0);
              })(state),
              er)
            )
              !(function (stream, state, sync, er, cb) {
                --state.pendingcb,
                  sync
                    ? (process.nextTick(cb, er),
                      process.nextTick(finishMaybe, stream, state),
                      (stream._writableState.errorEmitted = !0),
                      errorOrDestroy(stream, er))
                    : (cb(er),
                      (stream._writableState.errorEmitted = !0),
                      errorOrDestroy(stream, er),
                      finishMaybe(stream, state));
              })(stream, state, sync, er, cb);
            else {
              var finished = needFinish(state) || stream.destroyed;
              finished ||
                state.corked ||
                state.bufferProcessing ||
                !state.bufferedRequest ||
                clearBuffer(stream, state),
                sync
                  ? process.nextTick(afterWrite, stream, state, finished, cb)
                  : afterWrite(stream, state, finished, cb);
            }
          })(stream, er);
        }),
        (this.writecb = null),
        (this.writelen = 0),
        (this.bufferedRequest = null),
        (this.lastBufferedRequest = null),
        (this.pendingcb = 0),
        (this.prefinished = !1),
        (this.errorEmitted = !1),
        (this.emitClose = !1 !== options.emitClose),
        (this.autoDestroy = !!options.autoDestroy),
        (this.bufferedRequestCount = 0),
        (this.corkedRequestsFree = new CorkedRequest(this));
    }
    function Writable(options) {
      var isDuplex =
        this instanceof (Duplex = Duplex || __webpack_require__(20));
      if (!isDuplex && !realHasInstance.call(Writable, this))
        return new Writable(options);
      (this._writableState = new WritableState(options, this, isDuplex)),
        (this.writable = !0),
        options &&
          ("function" == typeof options.write && (this._write = options.write),
          "function" == typeof options.writev &&
            (this._writev = options.writev),
          "function" == typeof options.destroy &&
            (this._destroy = options.destroy),
          "function" == typeof options.final && (this._final = options.final)),
        Stream.call(this);
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      (state.writelen = len),
        (state.writecb = cb),
        (state.writing = !0),
        (state.sync = !0),
        state.destroyed
          ? state.onwrite(new ERR_STREAM_DESTROYED("write"))
          : writev
          ? stream._writev(chunk, state.onwrite)
          : stream._write(chunk, encoding, state.onwrite),
        (state.sync = !1);
    }
    function afterWrite(stream, state, finished, cb) {
      finished ||
        (function (stream, state) {
          0 === state.length &&
            state.needDrain &&
            ((state.needDrain = !1), stream.emit("drain"));
        })(stream, state),
        state.pendingcb--,
        cb(),
        finishMaybe(stream, state);
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = !0;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state.bufferedRequestCount,
          buffer = new Array(l),
          holder = state.corkedRequestsFree;
        holder.entry = entry;
        for (var count = 0, allBuffers = !0; entry; )
          (buffer[count] = entry),
            entry.isBuf || (allBuffers = !1),
            (entry = entry.next),
            (count += 1);
        (buffer.allBuffers = allBuffers),
          doWrite(stream, state, !0, state.length, buffer, "", holder.finish),
          state.pendingcb++,
          (state.lastBufferedRequest = null),
          holder.next
            ? ((state.corkedRequestsFree = holder.next), (holder.next = null))
            : (state.corkedRequestsFree = new CorkedRequest(state)),
          (state.bufferedRequestCount = 0);
      } else {
        for (; entry; ) {
          var chunk = entry.chunk,
            encoding = entry.encoding,
            cb = entry.callback;
          if (
            (doWrite(
              stream,
              state,
              !1,
              state.objectMode ? 1 : chunk.length,
              chunk,
              encoding,
              cb
            ),
            (entry = entry.next),
            state.bufferedRequestCount--,
            state.writing)
          )
            break;
        }
        null === entry && (state.lastBufferedRequest = null);
      }
      (state.bufferedRequest = entry), (state.bufferProcessing = !1);
    }
    function needFinish(state) {
      return (
        state.ending &&
        0 === state.length &&
        null === state.bufferedRequest &&
        !state.finished &&
        !state.writing
      );
    }
    function callFinal(stream, state) {
      stream._final(function (err) {
        state.pendingcb--,
          err && errorOrDestroy(stream, err),
          (state.prefinished = !0),
          stream.emit("prefinish"),
          finishMaybe(stream, state);
      });
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (
        need &&
        ((function (stream, state) {
          state.prefinished ||
            state.finalCalled ||
            ("function" != typeof stream._final || state.destroyed
              ? ((state.prefinished = !0), stream.emit("prefinish"))
              : (state.pendingcb++,
                (state.finalCalled = !0),
                process.nextTick(callFinal, stream, state)));
        })(stream, state),
        0 === state.pendingcb &&
          ((state.finished = !0), stream.emit("finish"), state.autoDestroy))
      ) {
        var rState = stream._readableState;
        (!rState || (rState.autoDestroy && rState.endEmitted)) &&
          stream.destroy();
      }
      return need;
    }
    __webpack_require__(2)(Writable, Stream),
      (WritableState.prototype.getBuffer = function () {
        for (var current = this.bufferedRequest, out = []; current; )
          out.push(current), (current = current.next);
        return out;
      }),
      (function () {
        try {
          Object.defineProperty(WritableState.prototype, "buffer", {
            get: internalUtil.deprecate(
              function () {
                return this.getBuffer();
              },
              "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.",
              "DEP0003"
            ),
          });
        } catch (_) {}
      })(),
      "function" == typeof Symbol &&
      Symbol.hasInstance &&
      "function" == typeof Function.prototype[Symbol.hasInstance]
        ? ((realHasInstance = Function.prototype[Symbol.hasInstance]),
          Object.defineProperty(Writable, Symbol.hasInstance, {
            value: function (object) {
              return (
                !!realHasInstance.call(this, object) ||
                (this === Writable &&
                  object &&
                  object._writableState instanceof WritableState)
              );
            },
          }))
        : (realHasInstance = function (object) {
            return object instanceof this;
          }),
      (Writable.prototype.pipe = function () {
        errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
      }),
      (Writable.prototype.write = function (chunk, encoding, cb) {
        var obj,
          state = this._writableState,
          ret = !1,
          isBuf =
            !state.objectMode &&
            ((obj = chunk),
            Buffer.isBuffer(obj) || obj instanceof OurUint8Array);
        return (
          isBuf &&
            !Buffer.isBuffer(chunk) &&
            (chunk = (function (chunk) {
              return Buffer.from(chunk);
            })(chunk)),
          "function" == typeof encoding && ((cb = encoding), (encoding = null)),
          isBuf
            ? (encoding = "buffer")
            : encoding || (encoding = state.defaultEncoding),
          "function" != typeof cb && (cb = nop),
          state.ending
            ? (function (stream, cb) {
                var er = new ERR_STREAM_WRITE_AFTER_END();
                errorOrDestroy(stream, er), process.nextTick(cb, er);
              })(this, cb)
            : (isBuf ||
                (function (stream, state, chunk, cb) {
                  var er;
                  return (
                    null === chunk
                      ? (er = new ERR_STREAM_NULL_VALUES())
                      : "string" == typeof chunk ||
                        state.objectMode ||
                        (er = new ERR_INVALID_ARG_TYPE(
                          "chunk",
                          ["string", "Buffer"],
                          chunk
                        )),
                    !er ||
                      (errorOrDestroy(stream, er), process.nextTick(cb, er), !1)
                  );
                })(this, state, chunk, cb)) &&
              (state.pendingcb++,
              (ret = (function (stream, state, isBuf, chunk, encoding, cb) {
                if (!isBuf) {
                  var newChunk = (function (state, chunk, encoding) {
                    state.objectMode ||
                      !1 === state.decodeStrings ||
                      "string" != typeof chunk ||
                      (chunk = Buffer.from(chunk, encoding));
                    return chunk;
                  })(state, chunk, encoding);
                  chunk !== newChunk &&
                    ((isBuf = !0), (encoding = "buffer"), (chunk = newChunk));
                }
                var len = state.objectMode ? 1 : chunk.length;
                state.length += len;
                var ret = state.length < state.highWaterMark;
                ret || (state.needDrain = !0);
                if (state.writing || state.corked) {
                  var last = state.lastBufferedRequest;
                  (state.lastBufferedRequest = {
                    chunk: chunk,
                    encoding: encoding,
                    isBuf: isBuf,
                    callback: cb,
                    next: null,
                  }),
                    last
                      ? (last.next = state.lastBufferedRequest)
                      : (state.bufferedRequest = state.lastBufferedRequest),
                    (state.bufferedRequestCount += 1);
                } else doWrite(stream, state, !1, len, chunk, encoding, cb);
                return ret;
              })(this, state, isBuf, chunk, encoding, cb))),
          ret
        );
      }),
      (Writable.prototype.cork = function () {
        this._writableState.corked++;
      }),
      (Writable.prototype.uncork = function () {
        var state = this._writableState;
        state.corked &&
          (state.corked--,
          state.writing ||
            state.corked ||
            state.bufferProcessing ||
            !state.bufferedRequest ||
            clearBuffer(this, state));
      }),
      (Writable.prototype.setDefaultEncoding = function (encoding) {
        if (
          ("string" == typeof encoding && (encoding = encoding.toLowerCase()),
          !(
            [
              "hex",
              "utf8",
              "utf-8",
              "ascii",
              "binary",
              "base64",
              "ucs2",
              "ucs-2",
              "utf16le",
              "utf-16le",
              "raw",
            ].indexOf((encoding + "").toLowerCase()) > -1
          ))
        )
          throw new ERR_UNKNOWN_ENCODING(encoding);
        return (this._writableState.defaultEncoding = encoding), this;
      }),
      Object.defineProperty(Writable.prototype, "writableBuffer", {
        enumerable: !1,
        get: function () {
          return this._writableState && this._writableState.getBuffer();
        },
      }),
      Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
        enumerable: !1,
        get: function () {
          return this._writableState.highWaterMark;
        },
      }),
      (Writable.prototype._write = function (chunk, encoding, cb) {
        cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
      }),
      (Writable.prototype._writev = null),
      (Writable.prototype.end = function (chunk, encoding, cb) {
        var state = this._writableState;
        return (
          "function" == typeof chunk
            ? ((cb = chunk), (chunk = null), (encoding = null))
            : "function" == typeof encoding &&
              ((cb = encoding), (encoding = null)),
          null != chunk && this.write(chunk, encoding),
          state.corked && ((state.corked = 1), this.uncork()),
          state.ending ||
            (function (stream, state, cb) {
              (state.ending = !0),
                finishMaybe(stream, state),
                cb &&
                  (state.finished
                    ? process.nextTick(cb)
                    : stream.once("finish", cb));
              (state.ended = !0), (stream.writable = !1);
            })(this, state, cb),
          this
        );
      }),
      Object.defineProperty(Writable.prototype, "writableLength", {
        enumerable: !1,
        get: function () {
          return this._writableState.length;
        },
      }),
      Object.defineProperty(Writable.prototype, "destroyed", {
        enumerable: !1,
        get: function () {
          return (
            void 0 !== this._writableState && this._writableState.destroyed
          );
        },
        set: function (value) {
          this._writableState && (this._writableState.destroyed = value);
        },
      }),
      (Writable.prototype.destroy = destroyImpl.destroy),
      (Writable.prototype._undestroy = destroyImpl.undestroy),
      (Writable.prototype._destroy = function (err, cb) {
        cb(err);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    module.exports = Transform;
    var _require$codes = __webpack_require__(14).codes,
      ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
      ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
      ERR_TRANSFORM_ALREADY_TRANSFORMING =
        _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
      ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0,
      Duplex = __webpack_require__(20);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = !1;
      var cb = ts.writecb;
      if (null === cb) return this.emit("error", new ERR_MULTIPLE_CALLBACK());
      (ts.writechunk = null),
        (ts.writecb = null),
        null != data && this.push(data),
        cb(er);
      var rs = this._readableState;
      (rs.reading = !1),
        (rs.needReadable || rs.length < rs.highWaterMark) &&
          this._read(rs.highWaterMark);
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options),
        (this._transformState = {
          afterTransform: afterTransform.bind(this),
          needTransform: !1,
          transforming: !1,
          writecb: null,
          writechunk: null,
          writeencoding: null,
        }),
        (this._readableState.needReadable = !0),
        (this._readableState.sync = !1),
        options &&
          ("function" == typeof options.transform &&
            (this._transform = options.transform),
          "function" == typeof options.flush && (this._flush = options.flush)),
        this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      "function" != typeof this._flush || this._readableState.destroyed
        ? done(this, null, null)
        : this._flush(function (er, data) {
            done(_this, er, data);
          });
    }
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      if ((null != data && stream.push(data), stream._writableState.length))
        throw new ERR_TRANSFORM_WITH_LENGTH_0();
      if (stream._transformState.transforming)
        throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
      return stream.push(null);
    }
    __webpack_require__(2)(Transform, Duplex),
      (Transform.prototype.push = function (chunk, encoding) {
        return (
          (this._transformState.needTransform = !1),
          Duplex.prototype.push.call(this, chunk, encoding)
        );
      }),
      (Transform.prototype._transform = function (chunk, encoding, cb) {
        cb(new ERR_METHOD_NOT_IMPLEMENTED("_transform()"));
      }),
      (Transform.prototype._write = function (chunk, encoding, cb) {
        var ts = this._transformState;
        if (
          ((ts.writecb = cb),
          (ts.writechunk = chunk),
          (ts.writeencoding = encoding),
          !ts.transforming)
        ) {
          var rs = this._readableState;
          (ts.needTransform ||
            rs.needReadable ||
            rs.length < rs.highWaterMark) &&
            this._read(rs.highWaterMark);
        }
      }),
      (Transform.prototype._read = function (n) {
        var ts = this._transformState;
        null === ts.writechunk || ts.transforming
          ? (ts.needTransform = !0)
          : ((ts.transforming = !0),
            this._transform(
              ts.writechunk,
              ts.writeencoding,
              ts.afterTransform
            ));
      }),
      (Transform.prototype._destroy = function (err, cb) {
        Duplex.prototype._destroy.call(this, err, function (err2) {
          cb(err2);
        });
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.handleReconnectMessage = exports.ReconnectError = void 0);
    const errors_1 = __webpack_require__(1);
    class ReconnectError extends errors_1.ConnectionError {
      constructor(message, cause) {
        super(message, cause);
      }
    }
    (exports.ReconnectError = ReconnectError),
      (exports.handleReconnectMessage = function (conn) {
        conn.on("RECONNECT", (msg) => {
          process.nextTick(() => {
            conn.emitError(
              new ReconnectError(
                "RECONNECT command received by server: " + msg.rawSource
              )
            );
          });
        });
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.replyToServerPing = void 0),
      (exports.replyToServerPing = function (conn) {
        conn.on("PING", (msg) => {
          null == msg.argument
            ? conn.sendRaw("PONG")
            : conn.sendRaw(`PONG :${msg.argument}`);
        });
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.sendClientPings = void 0);
    const ping_1 = __webpack_require__(48),
      set_defaults_1 = __webpack_require__(26),
      configDefaults = { interval: 6e4, timeout: 2e3 };
    exports.sendClientPings = function (conn, config = {}) {
      const { interval: interval, timeout: timeout } =
        set_defaults_1.setDefaults(config, configDefaults);
      let pingIDCounter = 0;
      const registeredInterval = setInterval(async () => {
        const pingIdentifier = "dank-twitch-irc:automatic:" + pingIDCounter++;
        try {
          await ping_1.sendPing(conn, pingIdentifier, timeout);
        } catch (e) {}
      }, interval);
      conn.once("close", () => clearInterval(registeredInterval));
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseTwitchMessage = exports.commandClassMap = void 0);
    const cap_1 = __webpack_require__(54),
      clearchat_1 = __webpack_require__(122),
      clearmsg_1 = __webpack_require__(123),
      ping_1 = __webpack_require__(124),
      pong_1 = __webpack_require__(49),
      reconnect_1 = __webpack_require__(125),
      globaluserstate_1 = __webpack_require__(126),
      hosttarget_1 = __webpack_require__(127),
      join_1 = __webpack_require__(46),
      part_1 = __webpack_require__(47),
      notice_1 = __webpack_require__(10),
      privmsg_1 = __webpack_require__(128),
      roomstate_1 = __webpack_require__(44),
      usernotice_1 = __webpack_require__(129),
      userstate_1 = __webpack_require__(50),
      whisper_1 = __webpack_require__(130),
      irc_message_1 = __webpack_require__(131);
    (exports.commandClassMap = {
      CLEARCHAT: clearchat_1.ClearchatMessage,
      CLEARMSG: clearmsg_1.ClearmsgMessage,
      GLOBALUSERSTATE: globaluserstate_1.GlobaluserstateMessage,
      HOSTTARGET: hosttarget_1.HosttargetMessage,
      NOTICE: notice_1.NoticeMessage,
      PRIVMSG: privmsg_1.PrivmsgMessage,
      ROOMSTATE: roomstate_1.RoomstateMessage,
      USERNOTICE: usernotice_1.UsernoticeMessage,
      USERSTATE: userstate_1.UserstateMessage,
      WHISPER: whisper_1.WhisperMessage,
      JOIN: join_1.JoinMessage,
      PART: part_1.PartMessage,
      RECONNECT: reconnect_1.ReconnectMessage,
      PING: ping_1.PingMessage,
      PONG: pong_1.PongMessage,
      CAP: cap_1.CapMessage,
    }),
      (exports.parseTwitchMessage = function (messageSrc) {
        const ircMessage = irc_message_1.parseIRCMessage(messageSrc),
          constructor = exports.commandClassMap[ircMessage.ircCommand];
        return null == constructor ? ircMessage : new constructor(ircMessage);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ClearchatMessage = void 0);
    const channel_irc_message_1 = __webpack_require__(5),
      irc_message_1 = __webpack_require__(0),
      tag_values_1 = __webpack_require__(9);
    class ClearchatMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(message) {
        super(message);
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.targetUsername = irc_message_1.getParameter(this, 1)),
          (this.banDuration = tagParser.getInt("ban-duration"));
      }
      wasChatCleared() {
        return null == this.targetUsername && null == this.banDuration;
      }
      isTimeout() {
        return null != this.targetUsername && null != this.banDuration;
      }
      isPermaban() {
        return null != this.targetUsername && null == this.banDuration;
      }
    }
    exports.ClearchatMessage = ClearchatMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ClearmsgMessage = void 0);
    const channel_irc_message_1 = __webpack_require__(5),
      irc_message_1 = __webpack_require__(0),
      tag_values_1 = __webpack_require__(9);
    class ClearmsgMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(message) {
        super(message);
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.targetUsername = tagParser.requireString("login")),
          (this.targetMessageID = tagParser.requireString("target-msg-id")),
          (this.targetMessageContent = irc_message_1.requireParameter(this, 1));
      }
    }
    exports.ClearmsgMessage = ClearmsgMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.PingMessage = void 0);
    const irc_message_1 = __webpack_require__(0);
    class PingMessage extends irc_message_1.IRCMessage {
      constructor(message) {
        super(message), (this.argument = irc_message_1.getParameter(this, 1));
      }
    }
    exports.PingMessage = PingMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ReconnectMessage = void 0);
    const irc_message_1 = __webpack_require__(0);
    class ReconnectMessage extends irc_message_1.IRCMessage {}
    exports.ReconnectMessage = ReconnectMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.GlobaluserstateMessage = void 0);
    const irc_message_1 = __webpack_require__(0),
      tag_values_1 = __webpack_require__(9);
    class GlobaluserstateMessage extends irc_message_1.IRCMessage {
      constructor(message) {
        super(message);
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.badgeInfo = tagParser.requireBadges("badge-info")),
          (this.badgeInfoRaw = tagParser.requireString("badge-info")),
          (this.badges = tagParser.requireBadges("badges")),
          (this.badgesRaw = tagParser.requireString("badges")),
          (this.color = tagParser.getColor("color")),
          (this.colorRaw = tagParser.requireString("color")),
          (this.displayName = tagParser.requireString("display-name").trim()),
          (this.emoteSets = tagParser.requireEmoteSets("emote-sets")),
          (this.emoteSetsRaw = tagParser.requireString("emote-sets")),
          (this.userID = tagParser.requireString("user-id"));
      }
      extractGlobalUserState() {
        return {
          badgeInfo: this.badgeInfo,
          badgeInfoRaw: this.badgeInfoRaw,
          badges: this.badges,
          badgesRaw: this.badgesRaw,
          color: this.color,
          colorRaw: this.colorRaw,
          displayName: this.displayName,
          emoteSets: this.emoteSets,
          emoteSetsRaw: this.emoteSetsRaw,
          userID: this.userID,
        };
      }
    }
    exports.GlobaluserstateMessage = GlobaluserstateMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.HosttargetMessage =
        exports.parseHosttargetParameter =
        exports.parseViewerCount =
        exports.parseHostedChannelName =
          void 0);
    const reason_for_value_1 = __webpack_require__(30),
      channel_irc_message_1 = __webpack_require__(5),
      irc_message_1 = __webpack_require__(0),
      parse_error_1 = __webpack_require__(8);
    function parseHostedChannelName(rawHostedChannelName) {
      if (null == rawHostedChannelName || rawHostedChannelName.length <= 0)
        throw new parse_error_1.ParseError(
          `Malformed channel part in HOSTTARGET message: ${reason_for_value_1.reasonForValue(
            rawHostedChannelName
          )}`
        );
      return "-" === rawHostedChannelName ? void 0 : rawHostedChannelName;
    }
    function parseViewerCount(rawViewerCount) {
      if (null == rawViewerCount || rawViewerCount.length <= 0)
        throw new parse_error_1.ParseError(
          `Malformed viewer count part in HOSTTARGET message: ${reason_for_value_1.reasonForValue(
            rawViewerCount
          )}`
        );
      if ("-" === rawViewerCount) return;
      const numberValue = parseInt(rawViewerCount);
      if (isNaN(numberValue))
        throw new parse_error_1.ParseError(
          `Malformed viewer count part in HOSTTARGET message: ${reason_for_value_1.reasonForValue(
            rawViewerCount
          )}`
        );
      return numberValue;
    }
    function parseHosttargetParameter(rawParameter) {
      const split = rawParameter.split(" ");
      if (2 !== split.length)
        throw new parse_error_1.ParseError(
          `HOSTTARGET accepts exactly 2 arguments in second parameter, given: ${reason_for_value_1.reasonForValue(
            rawParameter
          )}`
        );
      const [rawHostedChannelName, rawViewerCount] = split;
      return {
        hostedChannelName: parseHostedChannelName(rawHostedChannelName),
        viewerCount: parseViewerCount(rawViewerCount),
      };
    }
    (exports.parseHostedChannelName = parseHostedChannelName),
      (exports.parseViewerCount = parseViewerCount),
      (exports.parseHosttargetParameter = parseHosttargetParameter);
    class HosttargetMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(message) {
        super(message);
        const parsedSecondParameter = parseHosttargetParameter(
          irc_message_1.requireParameter(this, 1)
        );
        (this.hostedChannelName = parsedSecondParameter.hostedChannelName),
          (this.viewerCount = parsedSecondParameter.viewerCount);
      }
      wasHostModeExited() {
        return null == this.hostedChannelName;
      }
      wasHostModeEntered() {
        return null != this.hostedChannelName;
      }
    }
    exports.HosttargetMessage = HosttargetMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.PrivmsgMessage = exports.parseActionAndMessage = void 0);
    const channel_irc_message_1 = __webpack_require__(5),
      irc_message_1 = __webpack_require__(0),
      tag_values_1 = __webpack_require__(9),
      actionRegex = /^\u0001ACTION (.*)\u0001$/;
    function parseActionAndMessage(trailingParameter) {
      const match = actionRegex.exec(trailingParameter);
      return null == match
        ? { isAction: !1, message: trailingParameter }
        : { isAction: !0, message: match[1] };
    }
    exports.parseActionAndMessage = parseActionAndMessage;
    class PrivmsgMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(ircMessage) {
        super(ircMessage);
        const { isAction: isAction, message: message } = parseActionAndMessage(
          irc_message_1.requireParameter(this, 1)
        );
        (this.messageText = message),
          (this.isAction = isAction),
          (this.senderUsername = irc_message_1.requireNickname(this));
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.channelID = tagParser.requireString("room-id")),
          (this.senderUserID = tagParser.requireString("user-id")),
          (this.badgeInfo = tagParser.requireBadges("badge-info")),
          (this.badgeInfoRaw = tagParser.requireString("badge-info")),
          (this.badges = tagParser.requireBadges("badges")),
          (this.badgesRaw = tagParser.requireString("badges")),
          (this.bits = tagParser.getInt("bits")),
          (this.bitsRaw = tagParser.getString("bits")),
          (this.color = tagParser.getColor("color")),
          (this.colorRaw = tagParser.requireString("color")),
          (this.displayName = tagParser.requireString("display-name").trim()),
          (this.emotes = tagParser.requireEmotes("emotes", this.messageText)),
          (this.emotesRaw = tagParser.requireString("emotes")),
          (this.flags = tagParser.getFlags("flags", this.messageText)),
          (this.flagsRaw = tagParser.getString("flags")),
          (this.messageID = tagParser.requireString("id")),
          (this.isMod = tagParser.requireBoolean("mod")),
          (this.isModRaw = tagParser.requireString("mod")),
          (this.serverTimestamp = tagParser.requireTimestamp("tmi-sent-ts")),
          (this.serverTimestampRaw = tagParser.requireString("tmi-sent-ts"));
      }
      extractUserState() {
        return {
          badgeInfo: this.badgeInfo,
          badgeInfoRaw: this.badgeInfoRaw,
          badges: this.badges,
          badgesRaw: this.badgesRaw,
          color: this.color,
          colorRaw: this.colorRaw,
          displayName: this.displayName,
          isMod: this.isMod,
          isModRaw: this.isModRaw,
        };
      }
      isCheer() {
        return null != this.bits;
      }
    }
    exports.PrivmsgMessage = PrivmsgMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.UsernoticeMessage =
        exports.extractEventParams =
        exports.getCamelCasedName =
          void 0);
    const camelCase = __webpack_require__(219),
      channel_irc_message_1 = __webpack_require__(5),
      irc_message_1 = __webpack_require__(0),
      tag_values_1 = __webpack_require__(9),
      convertersMap = {
        "msg-param-cumulative-months": tag_values_1.convertToInt,
        "msg-param-gift-months": tag_values_1.convertToInt,
        "msg-param-sender-count": tag_values_1.convertToInt,
        "msg-param-months": tag_values_1.convertToInt,
        "msg-param-promo-gift-total": tag_values_1.convertToInt,
        "msg-param-should-share-streak": tag_values_1.convertToBoolean,
        "msg-param-streak-months": tag_values_1.convertToInt,
        "msg-param-viewerCount": tag_values_1.convertToInt,
        "msg-param-threshold": tag_values_1.convertToInt,
      };
    function getCamelCasedName(tagKey) {
      let newKey = tagKey;
      return (
        (newKey = newKey.substring(10)),
        (newKey = camelCase(newKey)),
        (newKey = newKey.replace(/Id$/g, "ID")),
        (newKey = newKey.replace(/([uU])serName/g, "$1sername")),
        newKey
      );
    }
    function extractEventParams(tags) {
      const params = {};
      for (const tagKey of Object.keys(tags)) {
        if (!tagKey.startsWith("msg-param-")) continue;
        const newKey = getCamelCasedName(tagKey),
          converter = convertersMap[tagKey];
        null != converter
          ? ((params[newKey] = tag_values_1.requireData(
              tags,
              tagKey,
              converter
            )),
            (params[newKey + "Raw"] = tag_values_1.requireData(
              tags,
              tagKey,
              tag_values_1.convertToString
            )))
          : (params[newKey] = tag_values_1.requireData(
              tags,
              tagKey,
              tag_values_1.convertToString
            ));
      }
      return params;
    }
    (exports.getCamelCasedName = getCamelCasedName),
      (exports.extractEventParams = extractEventParams);
    class UsernoticeMessage extends channel_irc_message_1.ChannelIRCMessage {
      constructor(message) {
        super(message),
          (this.messageText = irc_message_1.getParameter(this, 1));
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.channelID = tagParser.requireString("room-id")),
          (this.systemMessage = tagParser.requireString("system-msg")),
          (this.messageTypeID = tagParser.requireString("msg-id")),
          (this.senderUsername = tagParser.requireString("login")),
          (this.senderUserID = tagParser.requireString("user-id")),
          (this.badgeInfo = tagParser.requireBadges("badge-info")),
          (this.badgeInfoRaw = tagParser.requireString("badge-info")),
          (this.badges = tagParser.requireBadges("badges")),
          (this.badgesRaw = tagParser.requireString("badges")),
          (this.bits = tagParser.getInt("bits")),
          (this.bitsRaw = tagParser.getString("bits")),
          (this.color = tagParser.getColor("color")),
          (this.colorRaw = tagParser.requireString("color")),
          (this.displayName = tagParser.requireString("display-name").trim()),
          null != this.messageText
            ? ((this.emotes = tagParser.requireEmotes(
                "emotes",
                this.messageText
              )),
              (this.flags = tagParser.getFlags("flags", this.messageText)))
            : (this.emotes = []),
          (this.emotesRaw = tagParser.requireString("emotes")),
          (this.flagsRaw = tagParser.getString("flags")),
          (this.messageID = tagParser.requireString("id")),
          (this.isMod = tagParser.requireBoolean("mod")),
          (this.isModRaw = tagParser.requireString("mod")),
          (this.serverTimestamp = tagParser.requireTimestamp("tmi-sent-ts")),
          (this.serverTimestampRaw = tagParser.requireString("tmi-sent-ts")),
          (this.eventParams = extractEventParams(this.ircTags));
      }
      isCheer() {
        return null != this.bits;
      }
      isSub() {
        return "sub" === this.messageTypeID;
      }
      isResub() {
        return "resub" === this.messageTypeID;
      }
      isRaid() {
        return "raid" === this.messageTypeID;
      }
      isSubgift() {
        return "subgift" === this.messageTypeID;
      }
      isAnonSubgift() {
        return "anonsubgift" === this.messageTypeID;
      }
      isAnonGiftPaidUpgrade() {
        return "anongiftpaidupgrade" === this.messageTypeID;
      }
      isGiftPaidUpgrade() {
        return "giftpaidupgrade" === this.messageTypeID;
      }
      isRitual() {
        return "ritual" === this.messageTypeID;
      }
      isBitsBadgeTier() {
        return "bitsbadgetier" === this.messageTypeID;
      }
    }
    exports.UsernoticeMessage = UsernoticeMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.WhisperMessage = void 0);
    const irc_message_1 = __webpack_require__(0),
      tag_values_1 = __webpack_require__(9);
    class WhisperMessage extends irc_message_1.IRCMessage {
      constructor(ircMessage) {
        super(ircMessage),
          (this.messageText = irc_message_1.requireParameter(this, 1)),
          (this.senderUsername = irc_message_1.requireNickname(this));
        const tagParser = tag_values_1.tagParserFor(this.ircTags);
        (this.senderUserID = tagParser.requireString("user-id")),
          (this.recipientUsername = this.ircParameters[0]),
          (this.badges = tagParser.requireBadges("badges")),
          (this.badgesRaw = tagParser.requireString("badges")),
          (this.color = tagParser.getColor("color")),
          (this.colorRaw = tagParser.requireString("color")),
          (this.displayName = tagParser.requireString("display-name").trim()),
          (this.emotes = tagParser.requireEmotes("emotes", this.messageText)),
          (this.emotesRaw = tagParser.requireString("emotes")),
          (this.messageID = tagParser.requireString("message-id")),
          (this.threadID = tagParser.requireString("thread-id"));
      }
    }
    exports.WhisperMessage = WhisperMessage;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseIRCMessage = void 0);
    const irc_message_1 = __webpack_require__(0),
      parse_error_1 = __webpack_require__(8),
      tags_1 = __webpack_require__(132),
      VALID_CMD_REGEX = /^(?:[a-zA-Z]+|[0-9]{3})$/;
    exports.parseIRCMessage = function (messageSrc) {
      let ircTags,
        ircPrefix,
        ircPrefixRaw,
        remainder = messageSrc;
      if (messageSrc.startsWith("@")) {
        remainder = remainder.slice(1);
        const spaceIdx = remainder.indexOf(" ");
        if (spaceIdx < 0)
          throw new parse_error_1.ParseError(
            `No space found after tags declaration (given src: "${messageSrc}")`
          );
        const tagsSrc = remainder.slice(0, spaceIdx);
        if (0 === tagsSrc.length)
          throw new parse_error_1.ParseError(
            `Empty tags declaration (nothing after @ sign) (given src: "${messageSrc}")`
          );
        (ircTags = tags_1.parseTags(tagsSrc)),
          (remainder = remainder.slice(spaceIdx + 1));
      } else ircTags = {};
      if (remainder.startsWith(":")) {
        remainder = remainder.slice(1);
        const spaceIdx = remainder.indexOf(" ");
        if (spaceIdx < 0)
          throw new parse_error_1.ParseError(
            `No space found after prefix declaration (given src: "${messageSrc}")`
          );
        if (
          ((ircPrefixRaw = remainder.slice(0, spaceIdx)),
          (remainder = remainder.slice(spaceIdx + 1)),
          0 === ircPrefixRaw.length)
        )
          throw new parse_error_1.ParseError(
            `Empty prefix declaration (nothing after : sign) (given src: "${messageSrc}")`
          );
        if (ircPrefixRaw.includes("@")) {
          const atIndex = ircPrefixRaw.indexOf("@"),
            nickAndUser = ircPrefixRaw.slice(0, atIndex),
            host = ircPrefixRaw.slice(atIndex + 1),
            exclamationIndex = nickAndUser.indexOf("!");
          let nick, user;
          if (
            (exclamationIndex < 0
              ? ((nick = nickAndUser), (user = void 0))
              : ((nick = nickAndUser.slice(0, exclamationIndex)),
                (user = nickAndUser.slice(exclamationIndex + 1))),
            0 === host.length ||
              0 === nick.length ||
              (null != user && 0 === user.length))
          )
            throw new parse_error_1.ParseError(
              `Host, nick or user is empty in prefix (given src: "${messageSrc}")`
            );
          ircPrefix = { nickname: nick, username: user, hostname: host };
        } else
          ircPrefix = {
            nickname: void 0,
            username: void 0,
            hostname: ircPrefixRaw,
          };
      } else (ircPrefix = void 0), (ircPrefixRaw = void 0);
      const spaceAfterCommandIdx = remainder.indexOf(" ");
      let ircCommand, ircParameters;
      if (spaceAfterCommandIdx < 0)
        (ircCommand = remainder), (ircParameters = []);
      else {
        (ircCommand = remainder.slice(0, spaceAfterCommandIdx)),
          (remainder = remainder.slice(spaceAfterCommandIdx + 1)),
          (ircParameters = []);
        let paramsRemainder = remainder;
        for (; null !== paramsRemainder; )
          if (paramsRemainder.startsWith(":"))
            ircParameters.push(paramsRemainder.slice(1)),
              (paramsRemainder = null);
          else {
            const spaceIdx = paramsRemainder.indexOf(" ");
            let param;
            if (
              (spaceIdx < 0
                ? ((param = paramsRemainder), (paramsRemainder = null))
                : ((param = paramsRemainder.slice(0, spaceIdx)),
                  (paramsRemainder = paramsRemainder.slice(spaceIdx + 1))),
              0 === param.length)
            )
              throw new parse_error_1.ParseError(
                `Too many spaces found while trying to parse middle parameters (given src: "${messageSrc}")`
              );
            ircParameters.push(param);
          }
      }
      if (!VALID_CMD_REGEX.test(ircCommand))
        throw new parse_error_1.ParseError(
          `Invalid format for IRC command (given src: "${messageSrc}")`
        );
      return (
        (ircCommand = ircCommand.toUpperCase()),
        new irc_message_1.IRCMessage({
          rawSource: messageSrc,
          ircPrefixRaw: ircPrefixRaw,
          ircPrefix: ircPrefix,
          ircCommand: ircCommand,
          ircParameters: ircParameters,
          ircTags: ircTags,
        })
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseTags = exports.decodeValue = void 0);
    const decodeMap = {
        "\\\\": "\\",
        "\\:": ";",
        "\\s": " ",
        "\\n": "\n",
        "\\r": "\r",
        "\\": "",
      },
      decodeLookupRegex = /\\\\|\\:|\\s|\\n|\\r|\\/g;
    function decodeValue(value) {
      return null == value
        ? null
        : value.replace(decodeLookupRegex, (m) => decodeMap[m] || "");
    }
    (exports.decodeValue = decodeValue),
      (exports.parseTags = function (tagsSrc) {
        const tags = {};
        if (null == tagsSrc) return tags;
        for (const tagSrc of tagsSrc.split(";")) {
          let key, valueSrc;
          ([key, valueSrc] = tagSrc.split("=", 2)),
            (tags[key.toLowerCase()] = decodeValue(valueSrc));
        }
        return tags;
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.sendLogin = exports.LoginError = void 0);
    const await_response_1 = __webpack_require__(3),
      errors_1 = __webpack_require__(1),
      notice_1 = __webpack_require__(10),
      is_anonymous_username_1 = __webpack_require__(134);
    class LoginError extends errors_1.ConnectionError {}
    (exports.LoginError = LoginError),
      (exports.sendLogin = async function (conn, username, password) {
        null != password &&
          (is_anonymous_username_1.isAnonymousUsername(username) ||
            password.startsWith("oauth:") ||
            (password = "oauth:" + password),
          conn.sendRaw(`PASS ${password}`)),
          conn.sendRaw(`NICK ${username}`),
          await await_response_1.awaitResponse(conn, {
            success: (msg) => "001" === msg.ircCommand,
            failure: (msg) => msg instanceof notice_1.NoticeMessage,
            errorType: (message, cause) => new LoginError(message, cause),
            errorMessage: "Failed to login",
          });
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.isAnonymousUsername = void 0);
    const anonymousUsernameRegex = /^justinfan\d+$/;
    exports.isAnonymousUsername = function (username) {
      return anonymousUsernameRegex.test(username);
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.requestCapabilities =
        exports.deniedAnyCapability =
        exports.acknowledgesCapabilities =
        exports.CapabilitiesError =
          void 0);
    const await_response_1 = __webpack_require__(3),
      errors_1 = __webpack_require__(1),
      cap_1 = __webpack_require__(54);
    class CapabilitiesError extends errors_1.ConnectionError {}
    function acknowledgesCapabilities(requestedCapabilities) {
      return (e) =>
        e instanceof cap_1.CapMessage &&
        "ACK" === e.subCommand &&
        requestedCapabilities.every((cap) => e.capabilities.includes(cap));
    }
    function deniedAnyCapability(requestedCapabilities) {
      return (e) =>
        e instanceof cap_1.CapMessage &&
        "NAK" === e.subCommand &&
        requestedCapabilities.some((cap) => e.capabilities.includes(cap));
    }
    (exports.CapabilitiesError = CapabilitiesError),
      (exports.acknowledgesCapabilities = acknowledgesCapabilities),
      (exports.deniedAnyCapability = deniedAnyCapability),
      (exports.requestCapabilities = async function (
        conn,
        requestMembershipCapability
      ) {
        const capabilities = ["twitch.tv/commands", "twitch.tv/tags"];
        requestMembershipCapability &&
          capabilities.push("twitch.tv/membership"),
          conn.sendRaw(`CAP REQ :${capabilities.join(" ")}`),
          await await_response_1.awaitResponse(conn, {
            success: acknowledgesCapabilities(capabilities),
            failure: deniedAnyCapability(capabilities),
            errorType: (message, cause) =>
              new CapabilitiesError(message, cause),
            errorMessage: `Failed to request server capabilities ${capabilities.join(
              ", "
            )}`,
          });
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.validateIRCCommand = void 0);
    const validation_error_1 = __webpack_require__(51);
    exports.validateIRCCommand = function (command) {
      if (command.includes("\n") || command.includes("\r"))
        throw new validation_error_1.ValidationError(
          "IRC command may not include \\n or \\r"
        );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.EditableTimeout = void 0);
    exports.EditableTimeout = class {
      constructor(callback, runTime) {
        (this.completed = !1),
          (this.callback = callback),
          (this.startTime = Date.now()),
          (this.runTime = runTime),
          this.updateTimer();
      }
      stop() {
        return (
          null != this.runningTimeout && (clearTimeout(this.runningTimeout), !0)
        );
      }
      update(newRunTime) {
        this.completed || ((this.runTime = newRunTime), this.updateTimer());
      }
      updateTimer() {
        let timeRemaining;
        if ((this.stop(), null == this.runningTimeout))
          timeRemaining = this.runTime;
        else {
          const alreadyPassed = Date.now() - this.startTime;
          timeRemaining = this.runTime - alreadyPassed;
        }
        this.runningTimeout = setTimeout(
          this.invokeCallback.bind(this),
          timeRemaining
        );
      }
      invokeCallback() {
        (this.completed = !0), this.callback();
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __awaiter =
      (this && this.__awaiter) ||
      function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator.throw(value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            var value;
            result.done
              ? resolve(result.value)
              : ((value = result.value),
                value instanceof P
                  ? value
                  : new P(function (resolve) {
                      resolve(value);
                    })).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
    Object.defineProperty(exports, "__esModule", { value: !0 });
    const { default: wordsCount } = __webpack_require__(139),
      filter = __webpack_require__(140),
      dank_twitch_irc_1 = __webpack_require__(148),
      script = {
        getScriptManifest: () => ({
          name: "Fun Pizza Fridays",
          description: "A Custom plug-In for e_vac",
          author: "Bacon-Fixation",
          version: "0.0.0.0.1",
          firebotVersion: "5",
        }),
        getDefaultParameters: () => ({}),
        run: (runRequest) => {
          const { logger: logger } = runRequest.modules,
            twitchClient = new dank_twitch_irc_1.ChatClient({
              username: `${runRequest.firebot.accounts.bot.username}`,
              password: `${runRequest.firebot.accounts.bot.auth.access_token}`,
              rateLimits: "default",
              ignoreUnhandledPromiseRejections: !0,
              installDefaultMixins: !0,
            });
          twitchClient.use(
            new dank_twitch_irc_1.SlowModeRateLimiter(twitchClient, 10)
          ),
            twitchClient.use(
              new dank_twitch_irc_1.UserStateTracker(twitchClient)
            ),
            twitchClient.use(
              new dank_twitch_irc_1.AlternateMessageModifier(twitchClient)
            ),
            twitchClient.on("close", (error) => {
              null != error &&
                logger.error("Client closed due to error", error);
            }),
            twitchClient.on("error", (err) => {
              logger.error(err);
            }),
            twitchClient.on("ready", () => {
              logger.debug("Successfully Connected");
            }),
            twitchClient.on("PRIVMSG", (msg) =>
              __awaiter(void 0, void 0, void 0, function* () {
                if (
                  0 ==
                  (yield runRequest.modules.twitchApi.channel.getOnlineStatus(
                    runRequest.firebot.accounts.streamer.username
                  ))
                )
                  return;
                if (
                  msg.senderUsername == runRequest.firebot.accounts.bot.username
                )
                  return;
                let hasPermission =
                  "0" == msg.isModRaw || msg.channelName == msg.senderUsername;
                if ((logger.info(`${hasPermission}`), 0 == hasPermission))
                  return logger.debug("not a mod or broadcaster");
                const messageText = msg.messageText.toLowerCase();
                if (3 != wordsCount(messageText)) return;
                if (0 == (5 == new Date().getDay())) return;
                const array = messageText.split(" ");
                let frozen = !1,
                  pizza = !1,
                  friday = !1;
                const newTitle = [];
                for (let index in array)
                  "f" == array[index].charAt(0) &&
                    0 == index &&
                    ((frozen = !0),
                    newTitle.push(
                      `${array[index].charAt(0).toUpperCase()}${array[index]
                        .slice(1)
                        .toLowerCase()}`
                    )),
                    "p" == array[index].charAt(0) &&
                      1 == index &&
                      ((pizza = !0),
                      newTitle.push(
                        `${array[index].charAt(0).toUpperCase()}${array[index]
                          .slice(1)
                          .toLowerCase()}`
                      )),
                    "f" == array[index].charAt(0) &&
                      2 == index &&
                      ((friday = !0),
                      newTitle.push(
                        `${array[index].charAt(0).toUpperCase()}${array[index]
                          .slice(1)
                          .toLowerCase()}`
                      ));
                if (
                  (logger.debug(
                    `${frozen}  ${pizza} ${friday} message: ${msg.messageText}`
                  ),
                  frozen && pizza && friday)
                ) {
                  if (
                    (logger.info(messageText, filter.check(messageText)),
                    1 == filter.check(msg.messageText))
                  )
                    return twitchClient.say(
                      msg.channelName,
                      "That is inappropriate for a title."
                    );
                  logger.info(
                    runRequest.modules.twitchApi.getClient().tokenType
                  ),
                    yield runRequest.modules.twitchApi
                      .getClient()
                      .helix.channels.getChannelInfo(
                        runRequest.firebot.accounts.streamer.userId
                      )
                      .then((channelData) =>
                        __awaiter(void 0, void 0, void 0, function* () {
                          if (!channelData)
                            return logger.error("Failed to find channel");
                          const oldTitle = channelData.title.split(" ");
                          let streak = 0,
                            one = !1,
                            two = !1,
                            three = !1,
                            tempArray = [];
                          for (let index in oldTitle)
                            if (
                              "f" != oldTitle[index].charAt(0).toLowerCase() ||
                              0 != streak
                            )
                              if (
                                "p" !=
                                  oldTitle[index].charAt(0).toLowerCase() ||
                                1 != streak
                              ) {
                                if (
                                  ("f" ==
                                    oldTitle[index].charAt(0).toLowerCase() &&
                                    2 == streak &&
                                    ((three = !0),
                                    tempArray.push(`${oldTitle[index]}`),
                                    ++streak),
                                  one && two && three)
                                )
                                  return void (yield runRequest.modules.twitchApi
                                    .getClient()
                                    .helix.channels.updateChannelInfo(
                                      runRequest.firebot.accounts.streamer
                                        .userId,
                                      {
                                        title: oldTitle
                                          .join(" ")
                                          .replace(
                                            tempArray.join(" "),
                                            newTitle.join(" ")
                                          ),
                                      }
                                    )
                                    .then(() =>
                                      __awaiter(
                                        void 0,
                                        void 0,
                                        void 0,
                                        function* () {
                                          return yield twitchClient.say(
                                            msg.channelName,
                                            `Title Changed: "${oldTitle.join(
                                              " "
                                            )}" --\x3e "${oldTitle
                                              .join(" ")
                                              .replace(
                                                tempArray.join(" "),
                                                newTitle.join(" ")
                                              )}"`
                                          );
                                        }
                                      )
                                    )
                                    .catch((error) => logger.error(error)));
                                streak = 0;
                              } else
                                (two = !0),
                                  tempArray.push(`${oldTitle[index]}`),
                                  ++streak;
                            else
                              (one = !0),
                                tempArray.push(`${oldTitle[index]}`),
                                ++streak;
                        })
                      )
                      .catch((err) => {
                        logger.error(err);
                      });
                }
              })
            ),
            twitchClient.connect(),
            twitchClient.join(runRequest.firebot.accounts.streamer.username);
        },
      };
    exports.default = script;
  },
  function (module, exports, __webpack_require__) {
    module.exports = (() => {
      "use strict";
      var e = {
          314: (e, t, r) => {
            r.r(t),
              r.d(t, {
                default: () => a,
                wordsCount: () => c,
                wordsSplit: () => i,
                wordsDetect: () => u,
              });
            var o = [
                ",",
                "，",
                ".",
                "。",
                ":",
                "：",
                ";",
                "；",
                "[",
                "]",
                "【",
                "]",
                "】",
                "{",
                "｛",
                "}",
                "｝",
                "(",
                "（",
                ")",
                "）",
                "<",
                "《",
                ">",
                "》",
                "$",
                "￥",
                "!",
                "！",
                "?",
                "？",
                "~",
                "～",
                "'",
                "’",
                '"',
                "“",
                "”",
                "*",
                "/",
                "\\",
                "&",
                "%",
                "@",
                "#",
                "^",
                "、",
                "、",
                "、",
                "、",
              ],
              n = { words: [], count: 0 },
              u = function (e) {
                var t =
                  arguments.length > 1 && void 0 !== arguments[1]
                    ? arguments[1]
                    : {};
                if (!e) return n;
                var r = String(e);
                if ("" === r.trim()) return n;
                var u = t.punctuationAsBreaker ? " " : "",
                  c = t.disableDefaultPunctuation ? [] : o,
                  i = t.punctuation || [];
                c.concat(i).forEach(function (e) {
                  var t = new RegExp("\\" + e, "g");
                  r = r.replace(t, u);
                }),
                  (r = (r = (r = (r = r.replace(
                    /[\uFF00-\uFFEF\u2000-\u206F]/g,
                    ""
                  )).replace(/\s+/, " ")).split(" ")).filter(function (e) {
                    return e.trim();
                  }));
                var l = new RegExp(
                    "(\\d+)|[a-zA-ZÀ-ÿĀ-ſƀ-ɏɐ-ʯḀ-ỿЀ-ӿԀ-ԯഀ-ൿ]+|[⺀-⻿⼀-⿟　-〿㇀-㇯㈀-㋿㌀-㏿㐀-㿿䀀-䶿一-俿倀-忿怀-濿瀀-翿耀-迿退-鿿豈-﫿぀-ゟ゠-ヿㇰ-ㇿ㆐-㆟ᄀ-ᇿ㄰-㆏ꥠ-꥿가-꿿뀀-뿿쀀-쿿퀀-힯ힰ-퟿]",
                    "g"
                  ),
                  v = [];
                return (
                  r.forEach(function (e) {
                    var t,
                      r = [];
                    do {
                      (t = l.exec(e)) && r.push(t[0]);
                    } while (t);
                    0 === r.length ? v.push(e) : (v = v.concat(r));
                  }),
                  { words: v, count: v.length }
                );
              },
              c = function (e) {
                return u(
                  e,
                  arguments.length > 1 && void 0 !== arguments[1]
                    ? arguments[1]
                    : {}
                ).count;
              },
              i = function (e) {
                return u(
                  e,
                  arguments.length > 1 && void 0 !== arguments[1]
                    ? arguments[1]
                    : {}
                ).words;
              };
            const a = c;
          },
        },
        t = {};
      function r(o) {
        if (t[o]) return t[o].exports;
        var n = (t[o] = { exports: {} });
        return e[o](n, n.exports, r), n.exports;
      }
      return (
        (r.d = (e, t) => {
          for (var o in t)
            r.o(t, o) &&
              !r.o(e, o) &&
              Object.defineProperty(e, o, { enumerable: !0, get: t[o] });
        }),
        (r.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t)),
        (r.r = (e) => {
          "undefined" != typeof Symbol &&
            Symbol.toStringTag &&
            Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
            Object.defineProperty(e, "__esModule", { value: !0 });
        }),
        r(314)
      );
    })();
  },
  function (module, exports, __webpack_require__) {
    var util = __webpack_require__(141),
      wordDictionary = [];
    wordDictionary.en = __webpack_require__(142);
    try {
      wordDictionary.fr = __webpack_require__(143).array;
    } catch (e) {}
    try {
      wordDictionary.ru = __webpack_require__(147).flatWords;
    } catch (e) {}
    var words = util.clone(wordDictionary.en),
      LeoProfanity = {
        removeWord: function (str) {
          var index = words.indexOf(str);
          return -1 !== index && words.splice(index, 1), this;
        },
        addWord: function (str) {
          return -1 === words.indexOf(str) && words.push(str), this;
        },
        getReplacementWord: function (key, n) {
          var i = 0,
            replacementWord = "";
          for (i = 0; i < n; i++) replacementWord += key;
          return replacementWord;
        },
        sanitize: function (str) {
          return (str = (str = str.toLowerCase()).replace(/\.|,/g, " "));
        },
        list: function () {
          return words;
        },
        check: function (str) {
          if (!str) return !1;
          var i = 0,
            isFound = !1;
          for (
            str = this.sanitize(str), strs = str.match(/[^ ]+/g) || [];
            !isFound && i <= words.length - 1;

          )
            strs.includes(words[i]) && (isFound = !0), i++;
          return isFound;
        },
        proceed: function (str, replaceKey, nbLetters) {
          if (!str) return "";
          void 0 === replaceKey && (replaceKey = "*"),
            void 0 === nbLetters && (nbLetters = 0);
          var self = this,
            originalString = str,
            result = str,
            sanitizedArr = this.sanitize(originalString).split(/(\s)/),
            resultArr = result.split(/(\s|,|\.)/),
            badWords = [];
          return (
            sanitizedArr.forEach(function (item, index) {
              if (words.includes(item)) {
                var replacementWord =
                  item.slice(0, nbLetters) +
                  self.getReplacementWord(replaceKey, item.length - nbLetters);
                badWords.push(resultArr[index]),
                  (resultArr[index] = replacementWord);
              }
            }),
            [(result = resultArr.join("")), badWords]
          );
        },
        clean: function (str, replaceKey, nbLetters) {
          return str
            ? (void 0 === replaceKey && (replaceKey = "*"),
              void 0 === nbLetters && (nbLetters = 0),
              this.proceed(str, replaceKey, nbLetters)[0])
            : "";
        },
        badWordsUsed: function (str) {
          return str ? this.proceed(str, "*")[1] : "";
        },
        add: function (data) {
          var self = this;
          return (
            "string" == typeof data
              ? self.addWord(data)
              : data.constructor === Array &&
                data.forEach(function (word) {
                  self.addWord(word);
                }),
            this
          );
        },
        remove: function (data) {
          var self = this;
          return (
            "string" == typeof data
              ? self.removeWord(data)
              : data.constructor === Array &&
                data.forEach(function (word) {
                  self.removeWord(word);
                }),
            this
          );
        },
        reset: function () {
          return this.loadDictionary("en"), this;
        },
        clearList: function () {
          return (words = []), this;
        },
        getDictionary: function (name = "en") {
          return wordDictionary[(name = name in wordDictionary ? name : "en")];
        },
        loadDictionary: function (name = "en") {
          words = util.clone(this.getDictionary(name));
        },
      };
    module.exports = LeoProfanity;
  },
  function (module, exports) {
    var Util = {
      clone: function (obj) {
        return JSON.parse(JSON.stringify(obj));
      },
    };
    module.exports = Util;
  },
  function (module) {
    module.exports = JSON.parse(
      '["2g1c","acrotomophilia","anal","anilingus","anus","apeshit","arsehole","ass","asshole","assmunch","autoerotic","babeland","bangbros","bareback","barenaked","bastard","bastardo","bastinado","bbw","bdsm","beaner","beaners","bestiality","bimbos","birdlock","bitch","bitches","blowjob","blumpkin","bollocks","bondage","boner","boob","boobs","bukkake","bulldyke","bullshit","bunghole","busty","butt","buttcheeks","butthole","camgirl","camslut","camwhore","carpetmuncher","circlejerk","clit","clitoris","clusterfuck","cock","cocks","coprolagnia","coprophilia","cornhole","coon","coons","creampie","cum","cumming","cunnilingus","cunt","darkie","daterape","deepthroat","dendrophilia","dick","dildo","dingleberry","dingleberries","doggiestyle","doggystyle","dolcett","domination","dominatrix","dommes","dvda","ecchi","ejaculation","erotic","erotism","escort","eunuch","faggot","fecal","felch","fellatio","feltch","femdom","figging","fingerbang","fingering","fisting","footjob","frotting","fuck","fuckin","fucking","fucktards","fudgepacker","futanari","genitals","goatcx","goatse","gokkun","goodpoop","goregasm","grope","g-spot","guro","handjob","hardcore","hentai","homoerotic","honkey","hooker","humping","incest","intercourse","jailbait","jigaboo","jiggaboo","jiggerboo","jizz","juggs","kike","kinbaku","kinkster","kinky","knobbing","lolita","lovemaking","masturbate","milf","motherfucker","muffdiving","nambla","nawashi","negro","neonazi","nigga","nigger","nimphomania","nipple","nipples","nude","nudity","nympho","nymphomania","octopussy","omorashi","orgasm","orgy","paedophile","paki","panties","panty","pedobear","pedophile","pegging","penis","pissing","pisspig","playboy","ponyplay","poof","poon","poontang","punany","poopchute","porn","porno","pornography","pthc","pubes","pussy","queaf","queef","quim","raghead","rape","raping","rapist","rectum","rimjob","rimming","sadism","santorum","scat","schlong","scissoring","semen","sex","sexo","sexy","shemale","shibari","shit","shitblimp","shitty","shota","shrimping","skeet","slanteye","slut","s&m","smut","snatch","snowballing","sodomize","sodomy","spic","splooge","spooge","spunk","strapon","strappado","suck","sucks","swastika","swinger","threesome","throating","tit","tits","titties","titty","topless","tosser","towelhead","tranny","tribadism","tubgirl","tushy","twat","twink","twinkie","undressing","upskirt","urophilia","vagina","vibrator","vorarephilia","voyeur","vulva","wank","wetback","xx","xxx","yaoi","yiffy","zoophilia"]'
    );
  },
  function (module, exports, __webpack_require__) {
    module.exports = {
      object: __webpack_require__(144),
      array: __webpack_require__(145),
      regex: __webpack_require__(146),
    };
  },
  function (module, exports) {
    module.exports = {
      "!mb3c!l3": 1,
      "!mbec!l3": 1,
      "!mbéc!l3": 1,
      "!mbec!le": 1,
      "!mbéc!le": 1,
      "@brut!": 1,
      "@brut1": 1,
      "@bruti": 1,
      "@nd0u!ll3": 1,
      "@nd0u!lle": 1,
      "@nd0u1ll3": 1,
      "@nd0u1lle": 1,
      "@nd0uill3": 1,
      "@nd0uille": 1,
      "@ndou!ll3": 1,
      "@ndou!lle": 1,
      "@ndou1ll3": 1,
      "@ndou1lle": 1,
      "@ndouill3": 1,
      "@ndouille": 1,
      "@v0rt0n": 1,
      "@vorton": 1,
      "1mb3c1l3": 1,
      "1mbec1l3": 1,
      "1mbéc1l3": 1,
      "1mbec1le": 1,
      "1mbéc1le": 1,
      "35p!ng0!n": 1,
      "35p!ngo!n": 1,
      "35p1ng01n": 1,
      "35p1ngo1n": 1,
      "35ping0in": 1,
      "35pingoin": 1,
      "3mm@nch3": 1,
      "3mm@nche": 1,
      "3mm@nché": 1,
      "3mm3rd3r": 1,
      "3mm3rd3u53": 1,
      "3mm3rd3ur": 1,
      "3mm3rd3us3": 1,
      "3mmanch3": 1,
      "3mmanche": 1,
      "3mmanché": 1,
      "3mp@f3": 1,
      "3mp@fe": 1,
      "3mp@fé": 1,
      "3mp@p@0ut3": 1,
      "3mp@p@0ute": 1,
      "3mp@p@0uté": 1,
      "3mp@p@out3": 1,
      "3mp@p@oute": 1,
      "3mp@p@outé": 1,
      "3mpaf3": 1,
      "3mpafe": 1,
      "3mpafé": 1,
      "3mpapa0ut3": 1,
      "3mpapa0ute": 1,
      "3mpapa0uté": 1,
      "3mpapaout3": 1,
      "3mpapaoute": 1,
      "3mpapaouté": 1,
      "3ncul3": 1,
      "3ncul3r": 1,
      "3ncul3ur": 1,
      "3ncule": 1,
      "3nculé": 1,
      "3nf0!r3": 1,
      "3nf0!re": 1,
      "3nf0!ré": 1,
      "3nf01r3": 1,
      "3nf01re": 1,
      "3nf01ré": 1,
      "3nf0ir3": 1,
      "3nf0ire": 1,
      "3nf0iré": 1,
      "3nflur3": 1,
      "3nfo!r3": 1,
      "3nfo!re": 1,
      "3nfo!ré": 1,
      "3nfo1r3": 1,
      "3nfo1re": 1,
      "3nfo1ré": 1,
      "3nfoir3": 1,
      "3nfoire": 1,
      "3nfoiré": 1,
      "3nv@53l!n3ur": 1,
      "3nv@53l1n3ur": 1,
      "3nv@53lin3ur": 1,
      "3nv@s3l!n3ur": 1,
      "3nv@s3l1n3ur": 1,
      "3nv@s3lin3ur": 1,
      "3nva53l!n3ur": 1,
      "3nva53l1n3ur": 1,
      "3nva53lin3ur": 1,
      "3nvas3l!n3ur": 1,
      "3nvas3l1n3ur": 1,
      "3nvas3lin3ur": 1,
      "3p@!5": 1,
      "3p@!s": 1,
      "3p@15": 1,
      "3p@1s": 1,
      "3p@i5": 1,
      "3p@is": 1,
      "3pa!5": 1,
      "3pa!s": 1,
      "3pa15": 1,
      "3pa1s": 1,
      "3pai5": 1,
      "3pais": 1,
      "3sp!ng0!n": 1,
      "3sp!ngo!n": 1,
      "3sp1ng01n": 1,
      "3sp1ngo1n": 1,
      "3sping0in": 1,
      "3spingoin": 1,
      "3tr0n": 1,
      "3tron": 1,
      "5@g0u!n": 1,
      "5@g0u1n": 1,
      "5@g0uin": 1,
      "5@gou!n": 1,
      "5@gou1n": 1,
      "5@gouin": 1,
      "5@l@ud": 1,
      "5@l0p": 1,
      "5@l0p@rd": 1,
      "5@l0p3": 1,
      "5@l0pe": 1,
      "5@l3": 1,
      "5@le": 1,
      "5@lop": 1,
      "5@lop@rd": 1,
      "5@lop3": 1,
      "5@lope": 1,
      "5@tr0u!ll3": 1,
      "5@tr0u!lle": 1,
      "5@tr0u1ll3": 1,
      "5@tr0u1lle": 1,
      "5@tr0uill3": 1,
      "5@tr0uille": 1,
      "5@trou!ll3": 1,
      "5@trou!lle": 1,
      "5@trou1ll3": 1,
      "5@trou1lle": 1,
      "5@trouill3": 1,
      "5@trouille": 1,
      "50tt!53ux": 1,
      "50tt!5eux": 1,
      "50tt153ux": 1,
      "50tt15eux": 1,
      "50tti53ux": 1,
      "50tti5eux": 1,
      "50u5-m3rd3": 1,
      "50u5-merde": 1,
      "53nt-l@-p!553": 1,
      "53nt-l@-p1553": 1,
      "53nt-l@-pi553": 1,
      "53nt-la-p!553": 1,
      "53nt-la-p1553": 1,
      "53nt-la-pi553": 1,
      "5ag0u!n": 1,
      "5ag0u1n": 1,
      "5ag0uin": 1,
      "5agou!n": 1,
      "5agou1n": 1,
      "5agouin": 1,
      "5al0p": 1,
      "5al0p3": 1,
      "5al0pard": 1,
      "5al0pe": 1,
      "5al3": 1,
      "5alaud": 1,
      "5ale": 1,
      "5alop": 1,
      "5alop3": 1,
      "5alopard": 1,
      "5alope": 1,
      "5atr0u!ll3": 1,
      "5atr0u!lle": 1,
      "5atr0u1ll3": 1,
      "5atr0u1lle": 1,
      "5atr0uill3": 1,
      "5atr0uille": 1,
      "5atrou!ll3": 1,
      "5atrou!lle": 1,
      "5atrou1ll3": 1,
      "5atrou1lle": 1,
      "5atrouill3": 1,
      "5atrouille": 1,
      "5chb3b": 1,
      "5chbeb": 1,
      "5chl3u": 1,
      "5chleu": 1,
      "5chn0c": 1,
      "5chn0ck": 1,
      "5chn0qu3": 1,
      "5chn0que": 1,
      "5chnoc": 1,
      "5chnock": 1,
      "5chnoqu3": 1,
      "5chnoque": 1,
      "5ent-l@-p!55e": 1,
      "5ent-l@-p155e": 1,
      "5ent-l@-pi55e": 1,
      "5ent-la-p!55e": 1,
      "5ent-la-p155e": 1,
      "5ent-la-pi55e": 1,
      "5ott!53ux": 1,
      "5ott!5eux": 1,
      "5ott153ux": 1,
      "5ott15eux": 1,
      "5otti53ux": 1,
      "5otti5eux": 1,
      "5ou5-m3rd3": 1,
      "5ou5-merde": 1,
      "5t3@r!qu3": 1,
      "5t3@r1qu3": 1,
      "5t3@riqu3": 1,
      "5t3ar!qu3": 1,
      "5t3ar1qu3": 1,
      "5t3ariqu3": 1,
      "5té@r!qu3": 1,
      "5te@r!que": 1,
      "5té@r!que": 1,
      "5te@r1qu3": 1,
      "5té@r1qu3": 1,
      "5te@r1que": 1,
      "5té@r1que": 1,
      "5te@riqu3": 1,
      "5té@riqu3": 1,
      "5te@rique": 1,
      "5té@rique": 1,
      "5tear!qu3": 1,
      "5téar!qu3": 1,
      "5tear!que": 1,
      "5téar!que": 1,
      "5tear1qu3": 1,
      "5téar1qu3": 1,
      "5tear1que": 1,
      "5téar1que": 1,
      "5teariqu3": 1,
      "5téariqu3": 1,
      "5tearique": 1,
      "5téarique": 1,
      "abrut!": 1,
      abrut1: 1,
      abruti: 1,
      "and0u!ll3": 1,
      "and0u!lle": 1,
      and0u1ll3: 1,
      and0u1lle: 1,
      and0uill3: 1,
      and0uille: 1,
      "andou!ll3": 1,
      "andou!lle": 1,
      andou1ll3: 1,
      andou1lle: 1,
      andouill3: 1,
      andouille: 1,
      av0rt0n: 1,
      avorton: 1,
      "b!@tch": 1,
      "b!atch": 1,
      "b!c0t": 1,
      "b!cot": 1,
      "b!t3": 1,
      "b!t3mb0!5": 1,
      "b!t3mb0!s": 1,
      "b!t3mbo!5": 1,
      "b!t3mbo!s": 1,
      "b!te": 1,
      "b!temb0!5": 1,
      "b!temb0!s": 1,
      "b!tembo!5": 1,
      "b!tembo!s": 1,
      "b@t@rd": 1,
      b0rd3l: 1,
      b0rdel: 1,
      b0uff0n: 1,
      b0ugn0ul: 1,
      "B0ugn0ul!3": 1,
      "b0ugn0ul!5@t!0n": 1,
      "b0ugn0ul!53r": 1,
      "b0ugn0ul!5at!0n": 1,
      "b0ugn0ul!5er": 1,
      "B0ugn0ul!e": 1,
      "b0ugn0ul!s@t!0n": 1,
      "b0ugn0ul!s3r": 1,
      "b0ugn0ul!sat!0n": 1,
      "b0ugn0ul!ser": 1,
      B0ugn0ul13: 1,
      "b0ugn0ul15@t10n": 1,
      b0ugn0ul153r: 1,
      b0ugn0ul15at10n: 1,
      b0ugn0ul15er: 1,
      B0ugn0ul1e: 1,
      "b0ugn0ul1s@t10n": 1,
      b0ugn0ul1s3r: 1,
      b0ugn0ul1sat10n: 1,
      b0ugn0ul1ser: 1,
      b0ugn0ul3: 1,
      b0ugn0ule: 1,
      B0ugn0uli3: 1,
      "b0ugn0uli5@ti0n": 1,
      b0ugn0uli53r: 1,
      b0ugn0uli5ati0n: 1,
      b0ugn0uli5er: 1,
      B0ugn0ulie: 1,
      "b0ugn0ulis@ti0n": 1,
      b0ugn0ulis3r: 1,
      b0ugn0ulisati0n: 1,
      b0ugn0uliser: 1,
      b0ugr3: 1,
      b0ugre: 1,
      "b0uk@k": 1,
      b0ukak: 1,
      "b0un!0ul": 1,
      b0un10ul: 1,
      b0uni0ul: 1,
      "b0urd!ll3": 1,
      "b0urd!lle": 1,
      b0urd1ll3: 1,
      b0urd1lle: 1,
      b0urdill3: 1,
      b0urdille: 1,
      b0us3ux: 1,
      b0useux: 1,
      "b1@tch": 1,
      b1atch: 1,
      b1c0t: 1,
      b1cot: 1,
      b1t3: 1,
      b1t3mb015: 1,
      b1t3mb01s: 1,
      b1t3mbo15: 1,
      b1t3mbo1s: 1,
      b1te: 1,
      b1temb015: 1,
      b1temb01s: 1,
      b1tembo15: 1,
      b1tembo1s: 1,
      "b3@uf": 1,
      b3auf: 1,
      "bât@rd": 1,
      batard: 1,
      bâtard: 1,
      "be@uf": 1,
      beauf: 1,
      "bi@tch": 1,
      biatch: 1,
      bic0t: 1,
      bicot: 1,
      bit3: 1,
      bit3mb0i5: 1,
      bit3mb0is: 1,
      bit3mboi5: 1,
      bit3mbois: 1,
      bite: 1,
      bitemb0i5: 1,
      bitemb0is: 1,
      bitemboi5: 1,
      bitembois: 1,
      bord3l: 1,
      bordel: 1,
      bouffon: 1,
      bougnoul: 1,
      "Bougnoul!3": 1,
      "bougnoul!5@t!on": 1,
      "bougnoul!53r": 1,
      "bougnoul!5at!on": 1,
      "bougnoul!5er": 1,
      "Bougnoul!e": 1,
      "bougnoul!s@t!on": 1,
      "bougnoul!s3r": 1,
      "bougnoul!sat!on": 1,
      "bougnoul!ser": 1,
      Bougnoul13: 1,
      "bougnoul15@t1on": 1,
      bougnoul153r: 1,
      bougnoul15at1on: 1,
      bougnoul15er: 1,
      Bougnoul1e: 1,
      "bougnoul1s@t1on": 1,
      bougnoul1s3r: 1,
      bougnoul1sat1on: 1,
      bougnoul1ser: 1,
      bougnoul3: 1,
      bougnoule: 1,
      Bougnouli3: 1,
      "bougnouli5@tion": 1,
      bougnouli53r: 1,
      bougnouli5ation: 1,
      bougnouli5er: 1,
      Bougnoulie: 1,
      "bougnoulis@tion": 1,
      bougnoulis3r: 1,
      bougnoulisation: 1,
      bougnouliser: 1,
      bougr3: 1,
      bougre: 1,
      "bouk@k": 1,
      boukak: 1,
      "boun!oul": 1,
      boun1oul: 1,
      bounioul: 1,
      "bourd!ll3": 1,
      "bourd!lle": 1,
      bourd1ll3: 1,
      bourd1lle: 1,
      bourdill3: 1,
      bourdille: 1,
      bous3ux: 1,
      bouseux: 1,
      "br!53-burn35": 1,
      "br!5e-burne5": 1,
      "br!s3-burn3s": 1,
      "br!se-burnes": 1,
      "br@nl3r": 1,
      "br@nl3ur": 1,
      "br@nler": 1,
      "br@nleur": 1,
      "br@nqu3": 1,
      "br@nque": 1,
      "br153-burn35": 1,
      "br15e-burne5": 1,
      "br1s3-burn3s": 1,
      "br1se-burnes": 1,
      branl3r: 1,
      branl3ur: 1,
      branler: 1,
      branleur: 1,
      branqu3: 1,
      branque: 1,
      "bri53-burn35": 1,
      "bri5e-burne5": 1,
      "bris3-burn3s": 1,
      "brise-burnes": 1,
      "c@553-b0nb0n": 1,
      "c@553-bonbon": 1,
      "c@553-c0u!ll3": 1,
      "c@553-c0u!ll35": 1,
      "c@553-c0u1ll3": 1,
      "c@553-c0u1ll35": 1,
      "c@553-c0uill3": 1,
      "c@553-c0uill35": 1,
      "c@553-cou!ll3": 1,
      "c@553-cou!ll35": 1,
      "c@553-cou1ll3": 1,
      "c@553-cou1ll35": 1,
      "c@553-couill3": 1,
      "c@553-couill35": 1,
      "c@55e-b0nb0n": 1,
      "c@55e-bonbon": 1,
      "c@55e-c0u!lle": 1,
      "c@55e-c0u!lle5": 1,
      "c@55e-c0u1lle": 1,
      "c@55e-c0u1lle5": 1,
      "c@55e-c0uille": 1,
      "c@55e-c0uille5": 1,
      "c@55e-cou!lle": 1,
      "c@55e-cou!lle5": 1,
      "c@55e-cou1lle": 1,
      "c@55e-cou1lle5": 1,
      "c@55e-couille": 1,
      "c@55e-couille5": 1,
      "c@c0u": 1,
      "c@cou": 1,
      "c@fr3": 1,
      "c@fre": 1,
      "c@ld0ch3": 1,
      "c@ld0che": 1,
      "c@ldoch3": 1,
      "c@ldoche": 1,
      "c@ss3-b0nb0n": 1,
      "c@ss3-bonbon": 1,
      "c@ss3-c0u!ll3": 1,
      "c@ss3-c0u!ll3s": 1,
      "c@ss3-c0u1ll3": 1,
      "c@ss3-c0u1ll3s": 1,
      "c@ss3-c0uill3": 1,
      "c@ss3-c0uill3s": 1,
      "c@ss3-cou!ll3": 1,
      "c@ss3-cou!ll3s": 1,
      "c@ss3-cou1ll3": 1,
      "c@ss3-cou1ll3s": 1,
      "c@ss3-couill3": 1,
      "c@ss3-couill3s": 1,
      "c@sse-b0nb0n": 1,
      "c@sse-bonbon": 1,
      "c@sse-c0u!lle": 1,
      "c@sse-c0u!lles": 1,
      "c@sse-c0u1lle": 1,
      "c@sse-c0u1lles": 1,
      "c@sse-c0uille": 1,
      "c@sse-c0uilles": 1,
      "c@sse-cou!lle": 1,
      "c@sse-cou!lles": 1,
      "c@sse-cou1lle": 1,
      "c@sse-cou1lles": 1,
      "c@sse-couille": 1,
      "c@sse-couilles": 1,
      c0ch3: 1,
      c0che: 1,
      c0n: 1,
      "c0n@553": 1,
      "c0n@55e": 1,
      "c0n@rd": 1,
      "c0n@ss3": 1,
      "c0n@sse": 1,
      c0n5: 1,
      c0na553: 1,
      c0na55e: 1,
      c0nard: 1,
      c0nass3: 1,
      c0nasse: 1,
      "c0nch!3r": 1,
      "c0nch!er": 1,
      c0nch13r: 1,
      c0nch1er: 1,
      c0nchi3r: 1,
      c0nchier: 1,
      "c0nn@553": 1,
      "c0nn@55e": 1,
      "c0nn@rd": 1,
      "c0nn@rd3": 1,
      "c0nn@rde": 1,
      "c0nn@ss3": 1,
      "c0nn@sse": 1,
      c0nn3: 1,
      c0nna553: 1,
      c0nna55e: 1,
      c0nnard: 1,
      c0nnard3: 1,
      c0nnarde: 1,
      c0nnass3: 1,
      c0nnasse: 1,
      c0nne: 1,
      c0ns: 1,
      c0u1ll0n: 1,
      c0u1ll0nn3r: 1,
      c0u1ll3: 1,
      c0u1ll3s: 1,
      c0uill0n: 1,
      c0uill0nn3r: 1,
      c0uill0nner: 1,
      c0uill3: 1,
      c0uill3s: 1,
      c0uille: 1,
      c0uilles: 1,
      "c0un!fl3": 1,
      "c0un!fle": 1,
      c0un1fl3: 1,
      c0un1fle: 1,
      c0unifl3: 1,
      c0unifle: 1,
      "c0urt@ud": 1,
      c0urtaud: 1,
      "ca553-b0nb0n": 1,
      "ca553-bonbon": 1,
      "ca553-c0u!ll3": 1,
      "ca553-c0u!ll35": 1,
      "ca553-c0u1ll3": 1,
      "ca553-c0u1ll35": 1,
      "ca553-c0uill3": 1,
      "ca553-c0uill35": 1,
      "ca553-cou!ll3": 1,
      "ca553-cou!ll35": 1,
      "ca553-cou1ll3": 1,
      "ca553-cou1ll35": 1,
      "ca553-couill3": 1,
      "ca553-couill35": 1,
      "ca55e-b0nb0n": 1,
      "ca55e-bonbon": 1,
      "ca55e-c0u!lle": 1,
      "ca55e-c0u!lle5": 1,
      "ca55e-c0u1lle": 1,
      "ca55e-c0u1lle5": 1,
      "ca55e-c0uille": 1,
      "ca55e-c0uille5": 1,
      "ca55e-cou!lle": 1,
      "ca55e-cou!lle5": 1,
      "ca55e-cou1lle": 1,
      "ca55e-cou1lle5": 1,
      "ca55e-couille": 1,
      "ca55e-couille5": 1,
      cac0u: 1,
      cacou: 1,
      cafr3: 1,
      cafre: 1,
      cald0ch3: 1,
      cald0che: 1,
      caldoch3: 1,
      caldoche: 1,
      "cass3-b0nb0n": 1,
      "cass3-bonbon": 1,
      "cass3-c0u!ll3": 1,
      "cass3-c0u!ll3s": 1,
      "cass3-c0u1ll3": 1,
      "cass3-c0u1ll3s": 1,
      "cass3-c0uill3": 1,
      "cass3-c0uill3s": 1,
      "cass3-cou!ll3": 1,
      "cass3-cou!ll3s": 1,
      "cass3-cou1ll3": 1,
      "cass3-cou1ll3s": 1,
      "cass3-couill3": 1,
      "cass3-couill3s": 1,
      "casse-b0nb0n": 1,
      "casse-bonbon": 1,
      "casse-c0u!lle": 1,
      "casse-c0u!lles": 1,
      "casse-c0u1lle": 1,
      "casse-c0u1lles": 1,
      "casse-c0uille": 1,
      "casse-c0uilles": 1,
      "casse-cou!lle": 1,
      "casse-cou!lles": 1,
      "casse-cou1lle": 1,
      "casse-cou1lles": 1,
      "casse-couille": 1,
      "casse-couilles": 1,
      "ch!3nn@553": 1,
      "ch!3nn@ss3": 1,
      "ch!3nna553": 1,
      "ch!3nnass3": 1,
      "ch!3r": 1,
      "ch!enn@55e": 1,
      "ch!enn@sse": 1,
      "ch!enna55e": 1,
      "ch!ennasse": 1,
      "ch!er": 1,
      "ch!n3t0c": 1,
      "ch!n3t0qu3": 1,
      "ch!n3toc": 1,
      "ch!n3toqu3": 1,
      "ch!net0c": 1,
      "ch!net0que": 1,
      "ch!netoc": 1,
      "ch!netoque": 1,
      "ch!nt0k": 1,
      "ch!ntok": 1,
      "ch@ch@r": 1,
      "ch@g@553": 1,
      "ch@g@55e": 1,
      "ch@g@ss3": 1,
      "ch@g@sse": 1,
      "ch@uff@rd": 1,
      "ch13nn@553": 1,
      "ch13nn@ss3": 1,
      ch13nna553: 1,
      ch13nnass3: 1,
      ch13r: 1,
      ch13ur: 1,
      ch13urs: 1,
      "ch1enn@55e": 1,
      "ch1enn@sse": 1,
      ch1enna55e: 1,
      ch1ennasse: 1,
      ch1er: 1,
      ch1eur: 1,
      ch1eurs: 1,
      ch1n3t0c: 1,
      ch1n3t0qu3: 1,
      ch1n3toc: 1,
      ch1n3toqu3: 1,
      ch1net0c: 1,
      ch1net0que: 1,
      ch1netoc: 1,
      ch1netoque: 1,
      ch1nt0k: 1,
      ch1ntok: 1,
      chachar: 1,
      chaga553: 1,
      chaga55e: 1,
      chagass3: 1,
      chagasse: 1,
      chauffard: 1,
      "chi3nn@553": 1,
      "chi3nn@ss3": 1,
      chi3nna553: 1,
      chi3nnass3: 1,
      chi3r: 1,
      chi3ur: 1,
      chi3urs: 1,
      "chienn@55e": 1,
      "chienn@sse": 1,
      chienna55e: 1,
      chiennasse: 1,
      chier: 1,
      chieur: 1,
      chieurs: 1,
      chin3t0c: 1,
      chin3t0qu3: 1,
      chin3toc: 1,
      chin3toqu3: 1,
      chinet0c: 1,
      chinet0que: 1,
      chinetoc: 1,
      chinetoque: 1,
      chint0k: 1,
      chintok: 1,
      chl3uh: 1,
      chleuh: 1,
      chn0qu3: 1,
      chn0que: 1,
      chnoqu3: 1,
      chnoque: 1,
      coch3: 1,
      coche: 1,
      con: 1,
      "con@553": 1,
      "con@55e": 1,
      "con@rd": 1,
      "con@ss3": 1,
      "con@sse": 1,
      con5: 1,
      cona553: 1,
      cona55e: 1,
      conard: 1,
      conass3: 1,
      conasse: 1,
      "conch!3r": 1,
      "conch!er": 1,
      conch13r: 1,
      conch1er: 1,
      conchi3r: 1,
      conchier: 1,
      "conn@553": 1,
      "conn@55e": 1,
      "conn@rd": 1,
      "conn@rd3": 1,
      "conn@rde": 1,
      "conn@ss3": 1,
      "conn@sse": 1,
      conn3: 1,
      conna553: 1,
      conna55e: 1,
      connard: 1,
      connard3: 1,
      connarde: 1,
      connass3: 1,
      connasse: 1,
      conne: 1,
      cons: 1,
      cou1lle: 1,
      cou1lles: 1,
      cou1llon: 1,
      cou1llonner: 1,
      couill3: 1,
      couill3s: 1,
      couille: 1,
      couilles: 1,
      couillon: 1,
      couillonn3r: 1,
      couillonner: 1,
      "coun!fl3": 1,
      "coun!fle": 1,
      coun1fl3: 1,
      coun1fle: 1,
      counifl3: 1,
      counifle: 1,
      "court@ud": 1,
      courtaud: 1,
      "cr!cr!": 1,
      cr0tt3: 1,
      cr0tte: 1,
      cr0tté: 1,
      "cr0u!ll@t": 1,
      "cr0u!ll3": 1,
      "cr0u!llat": 1,
      "cr0u!lle": 1,
      "cr0u1ll@t": 1,
      cr0u1ll3: 1,
      cr0u1llat: 1,
      cr0u1lle: 1,
      "cr0uill@t": 1,
      cr0uill3: 1,
      cr0uillat: 1,
      cr0uille: 1,
      cr0ût0n: 1,
      cr1cr1: 1,
      "cr3t!n": 1,
      cr3t1n: 1,
      cr3tin: 1,
      "cr3v@rd": 1,
      cr3vard: 1,
      cr3vur3: 1,
      "cret!n": 1,
      "crét!n": 1,
      cret1n: 1,
      crét1n: 1,
      cretin: 1,
      crétin: 1,
      "crev@rd": 1,
      crevard: 1,
      crevure: 1,
      cricri: 1,
      crott3: 1,
      crotte: 1,
      crotté: 1,
      "crou!ll@t": 1,
      "crou!ll3": 1,
      "crou!llat": 1,
      "crou!lle": 1,
      "crou1ll@t": 1,
      crou1ll3: 1,
      crou1llat: 1,
      crou1lle: 1,
      "crouill@t": 1,
      crouill3: 1,
      crouillat: 1,
      crouille: 1,
      croûton: 1,
      cul: 1,
      "d3b!l3": 1,
      d3b1l3: 1,
      d3bil3: 1,
      "d3gu3l@ss3": 1,
      d3gu3lass3: 1,
      d3m3rd3r: 1,
      "deb!l3": 1,
      "déb!l3": 1,
      "deb!le": 1,
      "déb!le": 1,
      deb1l3: 1,
      déb1l3: 1,
      deb1le: 1,
      déb1le: 1,
      debil3: 1,
      débil3: 1,
      debile: 1,
      débile: 1,
      "déguel@sse": 1,
      deguelasse: 1,
      déguelasse: 1,
      demerder: 1,
      démerder: 1,
      "dr0u!ll3": 1,
      "dr0u!lle": 1,
      dr0u1ll3: 1,
      dr0u1lle: 1,
      dr0uill3: 1,
      dr0uille: 1,
      "drou!ll3": 1,
      "drou!lle": 1,
      drou1ll3: 1,
      drou1lle: 1,
      drouill3: 1,
      drouille: 1,
      "du schn0c": 1,
      "du schnoc": 1,
      du5chn0ck: 1,
      du5chnock: 1,
      duc0n: 1,
      duc0nn0t: 1,
      ducon: 1,
      duconnot: 1,
      dug3n0ux: 1,
      dug3noux: 1,
      dugen0ux: 1,
      dugenoux: 1,
      "dugl@nd": 1,
      dugland: 1,
      duschn0ck: 1,
      duschnock: 1,
      "e5p!ng0!n": 1,
      "e5p!ngo!n": 1,
      e5p1ng01n: 1,
      e5p1ngo1n: 1,
      e5ping0in: 1,
      e5pingoin: 1,
      "emm@nche": 1,
      "emm@nché": 1,
      emmanche: 1,
      emmanché: 1,
      emmerder: 1,
      emmerdeu5e: 1,
      emmerdeur: 1,
      emmerdeuse: 1,
      "emp@fe": 1,
      "emp@fé": 1,
      "emp@p@0ute": 1,
      "emp@p@0uté": 1,
      "emp@p@oute": 1,
      "emp@p@outé": 1,
      empafe: 1,
      empafé: 1,
      empapa0ute: 1,
      empapa0uté: 1,
      empapaoute: 1,
      empapaouté: 1,
      encule: 1,
      enculé: 1,
      enculer: 1,
      enculeur: 1,
      "enf0!re": 1,
      "enf0!ré": 1,
      enf01re: 1,
      enf01ré: 1,
      enf0ire: 1,
      enf0iré: 1,
      enflure: 1,
      "enfo!re": 1,
      "enfo!ré": 1,
      enfo1re: 1,
      enfo1ré: 1,
      enfoire: 1,
      enfoiré: 1,
      "env@5el!neur": 1,
      "env@5el1neur": 1,
      "env@5elineur": 1,
      "env@sel!neur": 1,
      "env@sel1neur": 1,
      "env@selineur": 1,
      "enva5el!neur": 1,
      enva5el1neur: 1,
      enva5elineur: 1,
      "envasel!neur": 1,
      envasel1neur: 1,
      envaselineur: 1,
      "ep@!5": 1,
      "ép@!5": 1,
      "ep@!s": 1,
      "ép@!s": 1,
      "ep@15": 1,
      "ép@15": 1,
      "ep@1s": 1,
      "ép@1s": 1,
      "ep@i5": 1,
      "ép@i5": 1,
      "ep@is": 1,
      "ép@is": 1,
      "epa!5": 1,
      "épa!5": 1,
      "epa!s": 1,
      "épa!s": 1,
      epa15: 1,
      épa15: 1,
      epa1s: 1,
      épa1s: 1,
      epai5: 1,
      épai5: 1,
      epais: 1,
      épais: 1,
      "esp!ng0!n": 1,
      "esp!ngo!n": 1,
      esp1ng01n: 1,
      esp1ngo1n: 1,
      esping0in: 1,
      espingoin: 1,
      etr0n: 1,
      étr0n: 1,
      etron: 1,
      étron: 1,
      "f!0tt3": 1,
      "f!0tte": 1,
      "f!ott3": 1,
      "f!otte": 1,
      f0ut3ur: 1,
      f0uteur: 1,
      f0utr3: 1,
      f0utre: 1,
      f10tt3: 1,
      f10tte: 1,
      f1ott3: 1,
      f1otte: 1,
      "f31gn@ss3": 1,
      "f3ign@ss3": 1,
      f3ignass3: 1,
      FDP: 1,
      fe1gnasse: 1,
      "feign@sse": 1,
      feignasse: 1,
      fi0tt3: 1,
      fi0tte: 1,
      fiott3: 1,
      fiotte: 1,
      fout3ur: 1,
      fouteur: 1,
      foutr3: 1,
      foutre: 1,
      "fr!tz": 1,
      fr1tz: 1,
      fritz: 1,
      "fum!3r": 1,
      "fum!er": 1,
      fum13r: 1,
      fum1er: 1,
      fumi3r: 1,
      fumier: 1,
      "g@rc3": 1,
      "g@rce": 1,
      "g@up3": 1,
      "g@upe": 1,
      G0d0n: 1,
      g0g0l: 1,
      g0ï: 1,
      "g0u!ll@nd": 1,
      "g0u!lland": 1,
      "g0u!n3": 1,
      "g0u!ne": 1,
      "g0u1ll@nd": 1,
      g0u1lland: 1,
      g0u1n3: 1,
      g0u1ne: 1,
      "g0uill@nd": 1,
      g0uilland: 1,
      g0uin3: 1,
      g0uine: 1,
      g0urd3: 1,
      g0urde: 1,
      "g0urg@nd!n3": 1,
      "g0urg@nd!ne": 1,
      "g0urg@nd1n3": 1,
      "g0urg@nd1ne": 1,
      "g0urg@ndin3": 1,
      "g0urg@ndine": 1,
      "g0urgand!n3": 1,
      "g0urgand!ne": 1,
      g0urgand1n3: 1,
      g0urgand1ne: 1,
      g0urgandin3: 1,
      g0urgandine: 1,
      garc3: 1,
      garce: 1,
      gaup3: 1,
      gaupe: 1,
      GDM: 1,
      "gl@nd": 1,
      "gl@nd0u!ll0u": 1,
      "gl@nd0u1ll0u": 1,
      "gl@nd0uill0u": 1,
      "gl@nd3u53": 1,
      "gl@nd3ur": 1,
      "gl@nd3us3": 1,
      "gl@ndeu5e": 1,
      "gl@ndeur": 1,
      "gl@ndeuse": 1,
      "gl@ndou!llou": 1,
      "gl@ndou1llou": 1,
      "gl@ndouillou": 1,
      "gl@ndu": 1,
      gland: 1,
      "gland0u!ll0u": 1,
      gland0u1ll0u: 1,
      gland0uill0u: 1,
      gland3u53: 1,
      gland3ur: 1,
      gland3us3: 1,
      glandeu5e: 1,
      glandeur: 1,
      glandeuse: 1,
      "glandou!llou": 1,
      glandou1llou: 1,
      glandouillou: 1,
      glandu: 1,
      gn0ul: 1,
      gn0ul3: 1,
      gn0ule: 1,
      gnoul: 1,
      gnoul3: 1,
      gnoule: 1,
      Godon: 1,
      gogol: 1,
      goï: 1,
      "gou!ll@nd": 1,
      "gou!lland": 1,
      "gou!n3": 1,
      "gou!ne": 1,
      "gou1ll@nd": 1,
      gou1lland: 1,
      gou1n3: 1,
      gou1ne: 1,
      "gouill@nd": 1,
      gouilland: 1,
      gouin3: 1,
      gouine: 1,
      gourd3: 1,
      gourde: 1,
      "gourg@nd!n3": 1,
      "gourg@nd!ne": 1,
      "gourg@nd1n3": 1,
      "gourg@nd1ne": 1,
      "gourg@ndin3": 1,
      "gourg@ndine": 1,
      "gourgand!n3": 1,
      "gourgand!ne": 1,
      gourgand1n3: 1,
      gourgand1ne: 1,
      gourgandin3: 1,
      gourgandine: 1,
      "gr0gn@553": 1,
      "gr0gn@55e": 1,
      "gr0gn@ss3": 1,
      "gr0gn@sse": 1,
      gr0gna553: 1,
      gr0gna55e: 1,
      gr0gnass3: 1,
      gr0gnasse: 1,
      "grogn@553": 1,
      "grogn@55e": 1,
      "grogn@ss3": 1,
      "grogn@sse": 1,
      grogna553: 1,
      grogna55e: 1,
      grognass3: 1,
      grognasse: 1,
      "gu!nd0ul3": 1,
      "gu!nd0ule": 1,
      "gu!ndoul3": 1,
      "gu!ndoule": 1,
      gu1nd0ul3: 1,
      gu1nd0ule: 1,
      gu1ndoul3: 1,
      gu1ndoule: 1,
      "gu3n!ch3": 1,
      gu3n1ch3: 1,
      gu3nich3: 1,
      "guen!che": 1,
      guen1che: 1,
      gueniche: 1,
      guind0ul3: 1,
      guind0ule: 1,
      guindoul3: 1,
      guindoule: 1,
      imb3cil3: 1,
      imbecil3: 1,
      imbécil3: 1,
      imbecile: 1,
      imbécile: 1,
      "j3@n-f0utr3": 1,
      "j3@n-foutr3": 1,
      "j3an-f0utr3": 1,
      "j3an-foutr3": 1,
      "je@n-f0utre": 1,
      "je@n-foutre": 1,
      "jean-f0utre": 1,
      "jean-foutre": 1,
      "k!k00": 1,
      "k!k0u": 1,
      "k!koo": 1,
      "k!kou": 1,
      k1k00: 1,
      k1k0u: 1,
      k1koo: 1,
      k1kou: 1,
      kik00: 1,
      kik0u: 1,
      kikoo: 1,
      kikou: 1,
      "Kr@ut": 1,
      Kraut: 1,
      "l@ch3ux": 1,
      "l@cheux": 1,
      "l@v3tt3": 1,
      "l@vette": 1,
      l0p3tt3: 1,
      l0pette: 1,
      lach3ux: 1,
      lâch3ux: 1,
      lacheux: 1,
      lâcheux: 1,
      lav3tt3: 1,
      lavette: 1,
      lop3tt3: 1,
      lopette: 1,
      "m!53r@bl3": 1,
      "m!53rabl3": 1,
      "m!5ér@bl3": 1,
      "m!5er@ble": 1,
      "m!5ér@ble": 1,
      "m!5erabl3": 1,
      "m!5érabl3": 1,
      "m!5erable": 1,
      "m!5érable": 1,
      "m!cht0": 1,
      "m!chto": 1,
      "m!n@bl3": 1,
      "m!n@ble": 1,
      "m!nabl3": 1,
      "m!nable": 1,
      "m!nu5": 1,
      "m!nus": 1,
      "m!s3r@bl3": 1,
      "m!s3rabl3": 1,
      "m!ser@bl3": 1,
      "m!sér@bl3": 1,
      "m!ser@ble": 1,
      "m!sér@ble": 1,
      "m!serabl3": 1,
      "m!sérabl3": 1,
      "m!serable": 1,
      "m!sérable": 1,
      "m@g0t": 1,
      "m@got": 1,
      "m@k0um3": 1,
      "m@k0ume": 1,
      "m@k0umé": 1,
      "m@koum3": 1,
      "m@koume": 1,
      "m@koumé": 1,
      "m@nch3": 1,
      "m@nche": 1,
      "m@ng3-m3rd3": 1,
      "m@nge-merde": 1,
      "m@rch@nd0t": 1,
      "m@rch@ndot": 1,
      "m@rg0u!ll!5t3": 1,
      "m@rg0u!ll!5te": 1,
      "m@rg0u!ll!st3": 1,
      "m@rg0u!ll!ste": 1,
      "m@rg0u1ll15t3": 1,
      "m@rg0u1ll15te": 1,
      "m@rg0u1ll1st3": 1,
      "m@rg0u1ll1ste": 1,
      "m@rg0uilli5t3": 1,
      "m@rg0uilli5te": 1,
      "m@rg0uillist3": 1,
      "m@rg0uilliste": 1,
      "m@rgou!ll!5t3": 1,
      "m@rgou!ll!5te": 1,
      "m@rgou!ll!st3": 1,
      "m@rgou!ll!ste": 1,
      "m@rgou1ll15t3": 1,
      "m@rgou1ll15te": 1,
      "m@rgou1ll1st3": 1,
      "m@rgou1ll1ste": 1,
      "m@rgouilli5t3": 1,
      "m@rgouilli5te": 1,
      "m@rgouillist3": 1,
      "m@rgouilliste": 1,
      "m@uv!3tt3": 1,
      "m@uv!ette": 1,
      "m@uv13tt3": 1,
      "m@uv1ette": 1,
      "m@uvi3tt3": 1,
      "m@uviette": 1,
      "m0!n@!ll3": 1,
      "m0!n@!lle": 1,
      "m0!n5-qu3-r!3n": 1,
      "m0!n5-que-r!en": 1,
      "m0!na!ll3": 1,
      "m0!na!lle": 1,
      "m0!ns-qu3-r!3n": 1,
      "m0!ns-que-r!en": 1,
      "m01n@1ll3": 1,
      "m01n@1lle": 1,
      "m01n5-qu3-r13n": 1,
      "m01n5-que-r1en": 1,
      m01na1ll3: 1,
      m01na1lle: 1,
      "m01ns-qu3-r13n": 1,
      "m01ns-que-r1en": 1,
      "m0in@ill3": 1,
      "m0in@ille": 1,
      "m0in5-qu3-ri3n": 1,
      "m0in5-que-rien": 1,
      m0inaill3: 1,
      m0inaille: 1,
      "m0ins-qu3-ri3n": 1,
      "m0ins-que-rien": 1,
      "m0n@c@!ll3": 1,
      "m0n@c@!lle": 1,
      "m0n@c@1ll3": 1,
      "m0n@c@1lle": 1,
      "m0n@c@ill3": 1,
      "m0n@c@ille": 1,
      "m0naca!ll3": 1,
      "m0naca!lle": 1,
      m0naca1ll3: 1,
      m0naca1lle: 1,
      m0nacaill3: 1,
      m0nacaille: 1,
      "m0r!c@ud": 1,
      "m0r!caud": 1,
      "m0r1c@ud": 1,
      m0r1caud: 1,
      "m0ric@ud": 1,
      m0ricaud: 1,
      "m153r@bl3": 1,
      m153rabl3: 1,
      "m15er@bl3": 1,
      "m15ér@bl3": 1,
      "m15er@ble": 1,
      "m15ér@ble": 1,
      m15erabl3: 1,
      m15érabl3: 1,
      m15erable: 1,
      m15érable: 1,
      m1cht0: 1,
      m1chto: 1,
      "m1n@bl3": 1,
      "m1n@ble": 1,
      m1nabl3: 1,
      m1nable: 1,
      m1nu5: 1,
      m1nus: 1,
      "m1s3r@bl3": 1,
      m1s3rabl3: 1,
      "m1ser@bl3": 1,
      "m1sér@bl3": 1,
      "m1ser@ble": 1,
      "m1sér@ble": 1,
      m1serabl3: 1,
      m1sérabl3: 1,
      m1serable: 1,
      m1sérable: 1,
      "m3rd@!ll0n": 1,
      "m3rd@!ll3": 1,
      "m3rd@!llon": 1,
      "m3rd@1ll0n": 1,
      "m3rd@1ll3": 1,
      "m3rd@1llon": 1,
      "m3rd@ill0n": 1,
      "m3rd@ill3": 1,
      "m3rd@illon": 1,
      "m3rd0u!ll@rd": 1,
      "m3rd0u!llard": 1,
      "m3rd0u1ll@rd": 1,
      m3rd0u1llard: 1,
      "m3rd0uill@rd": 1,
      m3rd0uillard: 1,
      m3rd3: 1,
      m3rd3ux: 1,
      "m3rda!ll0n": 1,
      "m3rda!ll3": 1,
      "m3rda!llon": 1,
      m3rda1ll0n: 1,
      m3rda1ll3: 1,
      m3rda1llon: 1,
      m3rdaill0n: 1,
      m3rdaill3: 1,
      m3rdaillon: 1,
      "m3rdou!ll@rd": 1,
      "m3rdou!llard": 1,
      "m3rdou1ll@rd": 1,
      m3rdou1llard: 1,
      "m3rdouill@rd": 1,
      m3rdouillard: 1,
      mag0t: 1,
      magot: 1,
      mak0um3: 1,
      mak0ume: 1,
      mak0umé: 1,
      makoum3: 1,
      makoume: 1,
      makoumé: 1,
      manch3: 1,
      manche: 1,
      "mang3-m3rd3": 1,
      "mange-merde": 1,
      marchand0t: 1,
      marchandot: 1,
      "marg0u!ll!5t3": 1,
      "marg0u!ll!5te": 1,
      "marg0u!ll!st3": 1,
      "marg0u!ll!ste": 1,
      marg0u1ll15t3: 1,
      marg0u1ll15te: 1,
      marg0u1ll1st3: 1,
      marg0u1ll1ste: 1,
      marg0uilli5t3: 1,
      marg0uilli5te: 1,
      marg0uillist3: 1,
      marg0uilliste: 1,
      "margou!ll!5t3": 1,
      "margou!ll!5te": 1,
      "margou!ll!st3": 1,
      "margou!ll!ste": 1,
      margou1ll15t3: 1,
      margou1ll15te: 1,
      margou1ll1st3: 1,
      margou1ll1ste: 1,
      margouilli5t3: 1,
      margouilli5te: 1,
      margouillist3: 1,
      margouilliste: 1,
      "mauv!3tt3": 1,
      "mauv!ette": 1,
      mauv13tt3: 1,
      mauv1ette: 1,
      mauvi3tt3: 1,
      mauviette: 1,
      "merd@!ll0n": 1,
      "merd@!lle": 1,
      "merd@!llon": 1,
      "merd@1ll0n": 1,
      "merd@1lle": 1,
      "merd@1llon": 1,
      "merd@ill0n": 1,
      "merd@ille": 1,
      "merd@illon": 1,
      "merd0u!ll@rd": 1,
      "merd0u!llard": 1,
      "merd0u1ll@rd": 1,
      merd0u1llard: 1,
      "merd0uill@rd": 1,
      merd0uillard: 1,
      "merda!ll0n": 1,
      "merda!lle": 1,
      "merda!llon": 1,
      merda1ll0n: 1,
      merda1lle: 1,
      merda1llon: 1,
      merdaill0n: 1,
      merdaille: 1,
      merdaillon: 1,
      merde: 1,
      merdeux: 1,
      "merdou!ll@rd": 1,
      "merdou!llard": 1,
      "merdou1ll@rd": 1,
      merdou1llard: 1,
      "merdouill@rd": 1,
      merdouillard: 1,
      "mi53r@bl3": 1,
      mi53rabl3: 1,
      "mi5er@bl3": 1,
      "mi5ér@bl3": 1,
      "mi5er@ble": 1,
      "mi5ér@ble": 1,
      mi5erabl3: 1,
      mi5érabl3: 1,
      mi5erable: 1,
      mi5érable: 1,
      micht0: 1,
      michto: 1,
      "min@bl3": 1,
      "min@ble": 1,
      minabl3: 1,
      minable: 1,
      minu5: 1,
      minus: 1,
      "mis3r@bl3": 1,
      mis3rabl3: 1,
      "miser@bl3": 1,
      "misér@bl3": 1,
      "miser@ble": 1,
      "misér@ble": 1,
      miserabl3: 1,
      misérabl3: 1,
      miserable: 1,
      misérable: 1,
      "mo!n@!ll3": 1,
      "mo!n@!lle": 1,
      "mo!n5-qu3-r!3n": 1,
      "mo!n5-que-r!en": 1,
      "mo!na!ll3": 1,
      "mo!na!lle": 1,
      "mo!ns-qu3-r!3n": 1,
      "mo!ns-que-r!en": 1,
      "mo1n@1ll3": 1,
      "mo1n@1lle": 1,
      "mo1n5-qu3-r13n": 1,
      "mo1n5-que-r1en": 1,
      mo1na1ll3: 1,
      mo1na1lle: 1,
      "mo1ns-qu3-r13n": 1,
      "mo1ns-que-r1en": 1,
      "moin@ill3": 1,
      "moin@ille": 1,
      "moin5-qu3-ri3n": 1,
      "moin5-que-rien": 1,
      moinaill3: 1,
      moinaille: 1,
      "moins-qu3-ri3n": 1,
      "moins-que-rien": 1,
      "mon@c@!ll3": 1,
      "mon@c@!lle": 1,
      "mon@c@1ll3": 1,
      "mon@c@1lle": 1,
      "mon@c@ill3": 1,
      "mon@c@ille": 1,
      "monaca!ll3": 1,
      "monaca!lle": 1,
      monaca1ll3: 1,
      monaca1lle: 1,
      monacaill3: 1,
      monacaille: 1,
      "mor!c@ud": 1,
      "mor!caud": 1,
      "mor1c@ud": 1,
      mor1caud: 1,
      "moric@ud": 1,
      moricaud: 1,
      "n!@!53ux": 1,
      "n!@!5eux": 1,
      "n!@!s3ux": 1,
      "n!@!seux": 1,
      "n!@c": 1,
      "n!@k0u3": 1,
      "n!@k0ue": 1,
      "n!@k0ué": 1,
      "n!@kou3": 1,
      "n!@koue": 1,
      "n!@koué": 1,
      "n!a!53ux": 1,
      "n!a!5eux": 1,
      "n!a!s3ux": 1,
      "n!a!seux": 1,
      "n!ac": 1,
      "n!ak0u3": 1,
      "n!ak0ue": 1,
      "n!ak0ué": 1,
      "n!akou3": 1,
      "n!akoue": 1,
      "n!akoué": 1,
      "n!qu3": 1,
      "n!qu3r": 1,
      "n!que": 1,
      "n!quer": 1,
      "n@s3": 1,
      "n@se": 1,
      "n@z3": 1,
      "n@ze": 1,
      "n1@153ux": 1,
      "n1@15eux": 1,
      "n1@1s3ux": 1,
      "n1@1seux": 1,
      "n1@c": 1,
      "n1@k0u3": 1,
      "n1@k0ue": 1,
      "n1@k0ué": 1,
      "n1@kou3": 1,
      "n1@koue": 1,
      "n1@koué": 1,
      n1a153ux: 1,
      n1a15eux: 1,
      n1a1s3ux: 1,
      n1a1seux: 1,
      n1ac: 1,
      n1ak0u3: 1,
      n1ak0ue: 1,
      n1ak0ué: 1,
      n1akou3: 1,
      n1akoue: 1,
      n1akoué: 1,
      n1qu3: 1,
      n1qu3r: 1,
      n1que: 1,
      n1quer: 1,
      n3gr0: 1,
      n3gro: 1,
      nas3: 1,
      nase: 1,
      naz3: 1,
      naze: 1,
      negr0: 1,
      négr0: 1,
      negro: 1,
      négro: 1,
      "ni@c": 1,
      "ni@i53ux": 1,
      "ni@i5eux": 1,
      "ni@is3ux": 1,
      "ni@iseux": 1,
      "ni@k0u3": 1,
      "ni@k0ue": 1,
      "ni@k0ué": 1,
      "ni@kou3": 1,
      "ni@koue": 1,
      "ni@koué": 1,
      niac: 1,
      niai53ux: 1,
      niai5eux: 1,
      niais3ux: 1,
      niaiseux: 1,
      niak0u3: 1,
      niak0ue: 1,
      niak0ué: 1,
      niakou3: 1,
      niakoue: 1,
      niakoué: 1,
      niqu3: 1,
      niqu3r: 1,
      nique: 1,
      niquer: 1,
      NTM: 1,
      "p!550u": 1,
      "p!55ou": 1,
      "p!gn0uf": 1,
      "p!gnouf": 1,
      "p!ss0u": 1,
      "p!ssou": 1,
      "p@k05": 1,
      "p@k0s": 1,
      "p@ko5": 1,
      "p@kos": 1,
      "p@n0ufl3": 1,
      "p@n0ufle": 1,
      "p@noufl3": 1,
      "p@noufle": 1,
      "p@t@r!n": 1,
      "p@t@r1n": 1,
      "p@t@rin": 1,
      "p0rc@5": 1,
      "p0rc@553": 1,
      "p0rc@55e": 1,
      "p0rc@s": 1,
      "p0rc@ss3": 1,
      "p0rc@sse": 1,
      p0rca5: 1,
      p0rca553: 1,
      p0rca55e: 1,
      p0rcas: 1,
      p0rcass3: 1,
      p0rcasse: 1,
      "p0uc@v": 1,
      p0ucav: 1,
      p0uf: 1,
      "p0uf!@553": 1,
      "p0uf!@55e": 1,
      "p0uf!@ss3": 1,
      "p0uf!@sse": 1,
      "p0uf!a553": 1,
      "p0uf!a55e": 1,
      "p0uf!ass3": 1,
      "p0uf!asse": 1,
      "p0uf1@553": 1,
      "p0uf1@55e": 1,
      "p0uf1@ss3": 1,
      "p0uf1@sse": 1,
      p0uf1a553: 1,
      p0uf1a55e: 1,
      p0uf1ass3: 1,
      p0uf1asse: 1,
      "p0uff!@553": 1,
      "p0uff!@55e": 1,
      "p0uff!@ss3": 1,
      "p0uff!@sse": 1,
      "p0uff!a553": 1,
      "p0uff!a55e": 1,
      "p0uff!ass3": 1,
      "p0uff!asse": 1,
      "p0uff1@553": 1,
      "p0uff1@55e": 1,
      "p0uff1@ss3": 1,
      "p0uff1@sse": 1,
      p0uff1a553: 1,
      p0uff1a55e: 1,
      p0uff1ass3: 1,
      p0uff1asse: 1,
      "p0uffi@553": 1,
      "p0uffi@55e": 1,
      "p0uffi@ss3": 1,
      "p0uffi@sse": 1,
      p0uffia553: 1,
      p0uffia55e: 1,
      p0uffiass3: 1,
      p0uffiasse: 1,
      "p0ufi@553": 1,
      "p0ufi@55e": 1,
      "p0ufi@ss3": 1,
      "p0ufi@sse": 1,
      p0ufia553: 1,
      p0ufia55e: 1,
      p0ufiass3: 1,
      p0ufiasse: 1,
      p0und3: 1,
      p0unde: 1,
      p0undé: 1,
      "p0urr!tur3": 1,
      "p0urr!ture": 1,
      p0urr1tur3: 1,
      p0urr1ture: 1,
      p0urritur3: 1,
      p0urriture: 1,
      p1550u: 1,
      p155ou: 1,
      p1gn0uf: 1,
      p1gnouf: 1,
      p1mbêch3: 1,
      p1mbêche: 1,
      p1ss0u: 1,
      p1ss3ux: 1,
      p1sseux: 1,
      p1ssou: 1,
      p3cqu3: 1,
      "p3d@l3": 1,
      p3d0qu3: 1,
      p3d3: 1,
      p3dal3: 1,
      p3doqu3: 1,
      "p3qu3n@ud": 1,
      p3qu3naud: 1,
      p3t: 1,
      "p3t@553": 1,
      "p3t@ss3": 1,
      p3t3ux: 1,
      p3ta553: 1,
      p3tass3: 1,
      pak05: 1,
      pak0s: 1,
      pako5: 1,
      pakos: 1,
      pan0ufl3: 1,
      pan0ufle: 1,
      panoufl3: 1,
      panoufle: 1,
      "patar!n": 1,
      patar1n: 1,
      patarin: 1,
      PD: 1,
      pecque: 1,
      "ped@l3": 1,
      "péd@l3": 1,
      "ped@le": 1,
      "péd@le": 1,
      ped0qu3: 1,
      péd0qu3: 1,
      ped0que: 1,
      péd0que: 1,
      pedal3: 1,
      pédal3: 1,
      pedale: 1,
      pédale: 1,
      pede: 1,
      pédé: 1,
      pedoqu3: 1,
      pédoqu3: 1,
      pedoque: 1,
      pédoque: 1,
      "pequ3n@ud": 1,
      "péqu3n@ud": 1,
      pequ3naud: 1,
      péqu3naud: 1,
      "pequen@ud": 1,
      "péquen@ud": 1,
      pequenaud: 1,
      péquenaud: 1,
      pet: 1,
      "pét@553": 1,
      "pet@55e": 1,
      "pét@55e": 1,
      "pet@ss3": 1,
      "pét@ss3": 1,
      "pet@sse": 1,
      "pét@sse": 1,
      peta553: 1,
      péta553: 1,
      peta55e: 1,
      péta55e: 1,
      petass3: 1,
      pétass3: 1,
      petasse: 1,
      pétasse: 1,
      peteux: 1,
      péteux: 1,
      pi550u: 1,
      pi55ou: 1,
      pign0uf: 1,
      pignouf: 1,
      pimbêch3: 1,
      pimbêche: 1,
      piss0u: 1,
      piss3ux: 1,
      pisseux: 1,
      pissou: 1,
      pl0uc: 1,
      pl3utr3: 1,
      pleutre: 1,
      plouc: 1,
      "porc@5": 1,
      "porc@553": 1,
      "porc@55e": 1,
      "porc@s": 1,
      "porc@ss3": 1,
      "porc@sse": 1,
      porca5: 1,
      porca553: 1,
      porca55e: 1,
      porcas: 1,
      porcass3: 1,
      porcasse: 1,
      "pouc@v": 1,
      poucav: 1,
      pouf: 1,
      "pouf!@553": 1,
      "pouf!@55e": 1,
      "pouf!@ss3": 1,
      "pouf!@sse": 1,
      "pouf!a553": 1,
      "pouf!a55e": 1,
      "pouf!ass3": 1,
      "pouf!asse": 1,
      "pouf1@553": 1,
      "pouf1@55e": 1,
      "pouf1@ss3": 1,
      "pouf1@sse": 1,
      pouf1a553: 1,
      pouf1a55e: 1,
      pouf1ass3: 1,
      pouf1asse: 1,
      "pouff!@553": 1,
      "pouff!@55e": 1,
      "pouff!@ss3": 1,
      "pouff!@sse": 1,
      "pouff!a553": 1,
      "pouff!a55e": 1,
      "pouff!ass3": 1,
      "pouff!asse": 1,
      "pouff1@553": 1,
      "pouff1@55e": 1,
      "pouff1@ss3": 1,
      "pouff1@sse": 1,
      pouff1a553: 1,
      pouff1a55e: 1,
      pouff1ass3: 1,
      pouff1asse: 1,
      "pouffi@553": 1,
      "pouffi@55e": 1,
      "pouffi@ss3": 1,
      "pouffi@sse": 1,
      pouffia553: 1,
      pouffia55e: 1,
      pouffiass3: 1,
      pouffiasse: 1,
      "poufi@553": 1,
      "poufi@55e": 1,
      "poufi@ss3": 1,
      "poufi@sse": 1,
      poufia553: 1,
      poufia55e: 1,
      poufiass3: 1,
      poufiasse: 1,
      pound3: 1,
      pounde: 1,
      poundé: 1,
      "pourr!tur3": 1,
      "pourr!ture": 1,
      pourr1tur3: 1,
      pourr1ture: 1,
      pourritur3: 1,
      pourriture: 1,
      "pun@!53": 1,
      "pun@!5e": 1,
      "pun@!s3": 1,
      "pun@!se": 1,
      "pun@153": 1,
      "pun@15e": 1,
      "pun@1s3": 1,
      "pun@1se": 1,
      "pun@i53": 1,
      "pun@i5e": 1,
      "pun@is3": 1,
      "pun@ise": 1,
      "puna!53": 1,
      "puna!5e": 1,
      "puna!s3": 1,
      "puna!se": 1,
      puna153: 1,
      puna15e: 1,
      puna1s3: 1,
      puna1se: 1,
      punai53: 1,
      punai5e: 1,
      punais3: 1,
      punaise: 1,
      "put!n": 1,
      "put@!n": 1,
      "put@1n": 1,
      "put@in": 1,
      put1n: 1,
      put3: 1,
      "puta!n": 1,
      puta1n: 1,
      putain: 1,
      pute: 1,
      putin: 1,
      "qu3ut@rd": 1,
      qu3utard: 1,
      "queut@rd": 1,
      queutard: 1,
      "r!p0p33": 1,
      "r!p0pe3": 1,
      "r!p0pé3": 1,
      "r!p0pee": 1,
      "r!p0pée": 1,
      "r!pop33": 1,
      "r!pope3": 1,
      "r!popé3": 1,
      "r!popee": 1,
      "r!popée": 1,
      "r@clur3": 1,
      "r@clure": 1,
      "r@t0n": 1,
      "r@ton": 1,
      "r05b!f": 1,
      r05b1f: 1,
      r05bif: 1,
      "r0b35p!3rr0t": 1,
      r0b35p13rr0t: 1,
      r0b35pi3rr0t: 1,
      "r0b3sp!3rr0t": 1,
      r0b3sp13rr0t: 1,
      r0b3spi3rr0t: 1,
      "r0be5p!err0t": 1,
      r0be5p1err0t: 1,
      r0be5pierr0t: 1,
      "r0besp!err0t": 1,
      r0besp1err0t: 1,
      r0bespierr0t: 1,
      "r0sb!f": 1,
      r0sb1f: 1,
      r0sbif: 1,
      r0ulur3: 1,
      r0ulure: 1,
      r1p0p33: 1,
      r1p0pe3: 1,
      r1p0pé3: 1,
      r1p0pee: 1,
      r1p0pée: 1,
      r1pop33: 1,
      r1pope3: 1,
      r1popé3: 1,
      r1popee: 1,
      r1popée: 1,
      raclur3: 1,
      raclure: 1,
      rat0n: 1,
      raton: 1,
      rip0p33: 1,
      rip0pe3: 1,
      rip0pé3: 1,
      rip0pee: 1,
      rip0pée: 1,
      ripop33: 1,
      ripope3: 1,
      ripopé3: 1,
      ripopee: 1,
      ripopée: 1,
      "ro5b!f": 1,
      ro5b1f: 1,
      ro5bif: 1,
      "rob35p!3rrot": 1,
      rob35p13rrot: 1,
      rob35pi3rrot: 1,
      "rob3sp!3rrot": 1,
      rob3sp13rrot: 1,
      rob3spi3rrot: 1,
      "robe5p!errot": 1,
      robe5p1errot: 1,
      robe5pierrot: 1,
      "robesp!errot": 1,
      robesp1errot: 1,
      robespierrot: 1,
      "rosb!f": 1,
      rosb1f: 1,
      rosbif: 1,
      roulur3: 1,
      roulure: 1,
      "s@g0u!n": 1,
      "s@g0u1n": 1,
      "s@g0uin": 1,
      "s@gou!n": 1,
      "s@gou1n": 1,
      "s@gouin": 1,
      "s@l@ud": 1,
      "s@l0p": 1,
      "s@l0p@rd": 1,
      "s@l0p3": 1,
      "s@l0p3r13": 1,
      "s@l0p3ri3": 1,
      "s@l0pe": 1,
      "s@l3": 1,
      "s@le": 1,
      "s@lop": 1,
      "s@lop@rd": 1,
      "s@lop3": 1,
      "s@lop3ri3": 1,
      "s@lope": 1,
      "s@loperie": 1,
      "s@tr0u!ll3": 1,
      "s@tr0u!lle": 1,
      "s@tr0u1ll3": 1,
      "s@tr0u1lle": 1,
      "s@tr0uill3": 1,
      "s@tr0uille": 1,
      "s@trou!ll3": 1,
      "s@trou!lle": 1,
      "s@trou1ll3": 1,
      "s@trou1lle": 1,
      "s@trouill3": 1,
      "s@trouille": 1,
      "s0tt!s3ux": 1,
      "s0tt!seux": 1,
      s0tt1s3ux: 1,
      s0tt1seux: 1,
      s0ttis3ux: 1,
      s0ttiseux: 1,
      "s0us-m3rd3": 1,
      "s0us-merde": 1,
      "s3nt-l@-p!ss3": 1,
      "s3nt-l@-p1ss3": 1,
      "s3nt-l@-piss3": 1,
      "s3nt-la-p!ss3": 1,
      "s3nt-la-p1ss3": 1,
      "s3nt-la-piss3": 1,
      "sag0u!n": 1,
      sag0u1n: 1,
      sag0uin: 1,
      "sagou!n": 1,
      sagou1n: 1,
      sagouin: 1,
      sal0p: 1,
      sal0p3: 1,
      sal0pard: 1,
      sal0pe: 1,
      sal0perie: 1,
      sal3: 1,
      salaud: 1,
      sale: 1,
      salop: 1,
      salop3: 1,
      salop3ri3: 1,
      salopard: 1,
      salope: 1,
      saloper1e: 1,
      saloperie: 1,
      "satr0u!ll3": 1,
      "satr0u!lle": 1,
      satr0u1ll3: 1,
      satr0u1lle: 1,
      satr0uill3: 1,
      satr0uille: 1,
      "satrou!ll3": 1,
      "satrou!lle": 1,
      satrou1ll3: 1,
      satrou1lle: 1,
      satrouill3: 1,
      satrouille: 1,
      schb3b: 1,
      schbeb: 1,
      schl3u: 1,
      schleu: 1,
      schn0c: 1,
      schn0ck: 1,
      schn0qu3: 1,
      schn0que: 1,
      schnoc: 1,
      schnock: 1,
      schnoqu3: 1,
      schnoque: 1,
      "sent-l@-p!sse": 1,
      "sent-l@-p1sse": 1,
      "sent-l@-pisse": 1,
      "sent-la-p!sse": 1,
      "sent-la-p1sse": 1,
      "sent-la-pisse": 1,
      "sott!s3ux": 1,
      "sott!seux": 1,
      sott1s3ux: 1,
      sott1seux: 1,
      sottis3ux: 1,
      sottiseux: 1,
      "sous-m3rd3": 1,
      "sous-merde": 1,
      "st3@r!qu3": 1,
      "st3@r1qu3": 1,
      "st3@riqu3": 1,
      "st3ar!qu3": 1,
      st3ar1qu3: 1,
      st3ariqu3: 1,
      "ste@r!qu3": 1,
      "sté@r!qu3": 1,
      "ste@r!que": 1,
      "sté@r!que": 1,
      "ste@r1qu3": 1,
      "sté@r1qu3": 1,
      "ste@r1que": 1,
      "sté@r1que": 1,
      "ste@riqu3": 1,
      "sté@riqu3": 1,
      "ste@rique": 1,
      "sté@rique": 1,
      "stear!qu3": 1,
      "stéar!qu3": 1,
      "stear!que": 1,
      "stéar!que": 1,
      stear1qu3: 1,
      stéar1qu3: 1,
      stear1que: 1,
      stéar1que: 1,
      steariqu3: 1,
      stéariqu3: 1,
      stearique: 1,
      stéarique: 1,
      "t@f!0l3": 1,
      "t@f!0le": 1,
      "t@f!ol3": 1,
      "t@f!ole": 1,
      "t@f10l3": 1,
      "t@f10le": 1,
      "t@f1ol3": 1,
      "t@f1ole": 1,
      "t@fi0l3": 1,
      "t@fi0le": 1,
      "t@fiol3": 1,
      "t@fiole": 1,
      "t@nt0u53r!3": 1,
      "t@nt0u53r13": 1,
      "t@nt0u53ri3": 1,
      "t@nt0u5er!e": 1,
      "t@nt0u5er1e": 1,
      "t@nt0u5erie": 1,
      "t@nt0us3r!3": 1,
      "t@nt0us3r13": 1,
      "t@nt0us3ri3": 1,
      "t@nt0user!e": 1,
      "t@nt0user1e": 1,
      "t@nt0userie": 1,
      "t@nt0uz3": 1,
      "t@nt0uze": 1,
      "t@ntou53r!3": 1,
      "t@ntou53r13": 1,
      "t@ntou53ri3": 1,
      "t@ntou5er!e": 1,
      "t@ntou5er1e": 1,
      "t@ntou5erie": 1,
      "t@ntous3r!3": 1,
      "t@ntous3r13": 1,
      "t@ntous3ri3": 1,
      "t@ntouser!e": 1,
      "t@ntouser1e": 1,
      "t@ntouserie": 1,
      "t@ntouz3": 1,
      "t@ntouze": 1,
      "t@p3tt3": 1,
      "t@pette": 1,
      "t@rl0uz3": 1,
      "t@rl0uze": 1,
      "t@rlouz3": 1,
      "t@rlouze": 1,
      "t0c@rd": 1,
      t0card: 1,
      t3b3: 1,
      t3be: 1,
      t3bé: 1,
      t3t3ux: 1,
      t3ub3: 1,
      t3ube: 1,
      t3ubé: 1,
      "taf!0l3": 1,
      "taf!0le": 1,
      "taf!ol3": 1,
      "taf!ole": 1,
      taf10l3: 1,
      taf10le: 1,
      taf1ol3: 1,
      taf1ole: 1,
      tafi0l3: 1,
      tafi0le: 1,
      tafiol3: 1,
      tafiole: 1,
      "tant0u53r!3": 1,
      tant0u53r13: 1,
      tant0u53ri3: 1,
      "tant0u5er!e": 1,
      tant0u5er1e: 1,
      tant0u5erie: 1,
      "tant0us3r!3": 1,
      tant0us3r13: 1,
      tant0us3ri3: 1,
      "tant0user!e": 1,
      tant0user1e: 1,
      tant0userie: 1,
      tant0uz3: 1,
      tant0uze: 1,
      "tantou53r!3": 1,
      tantou53r13: 1,
      tantou53ri3: 1,
      "tantou5er!e": 1,
      tantou5er1e: 1,
      tantou5erie: 1,
      "tantous3r!3": 1,
      tantous3r13: 1,
      tantous3ri3: 1,
      "tantouser!e": 1,
      tantouser1e: 1,
      tantouserie: 1,
      tantouz3: 1,
      tantouze: 1,
      tap3tt3: 1,
      tapette: 1,
      tarl0uz3: 1,
      tarl0uze: 1,
      tarlouz3: 1,
      tarlouze: 1,
      tebe: 1,
      tebé: 1,
      tet3ux: 1,
      tét3ux: 1,
      teteux: 1,
      téteux: 1,
      teube: 1,
      teubé: 1,
      "toc@rd": 1,
      tocard: 1,
      "tr@!n33": 1,
      "tr@!nee": 1,
      "tr@1n33": 1,
      "tr@1nee": 1,
      "tr@in33": 1,
      "tr@în33": 1,
      "tr@îne3": 1,
      "tr@îné3": 1,
      "tr@inee": 1,
      "tr@înee": 1,
      "tr@înée": 1,
      tr0uduc: 1,
      "tra!n33": 1,
      "tra!nee": 1,
      tra1n33: 1,
      tra1nee: 1,
      train33: 1,
      traîn33: 1,
      traîne3: 1,
      traîné3: 1,
      trainee: 1,
      traînee: 1,
      traînée: 1,
      trouduc: 1,
      "tru!@553": 1,
      "tru!@55e": 1,
      "tru!@ss3": 1,
      "tru!@sse": 1,
      "tru!a553": 1,
      "tru!a55e": 1,
      "tru!ass3": 1,
      "tru!asse": 1,
      "tru1@553": 1,
      "tru1@55e": 1,
      "tru1@ss3": 1,
      "tru1@sse": 1,
      tru1a553: 1,
      tru1a55e: 1,
      tru1ass3: 1,
      tru1asse: 1,
      "trui@553": 1,
      "trui@55e": 1,
      "trui@ss3": 1,
      "trui@sse": 1,
      truia553: 1,
      truia55e: 1,
      truiass3: 1,
      truiasse: 1,
      "v!3d@53": 1,
      "v!3d@s3": 1,
      "v!3da53": 1,
      "v!3das3": 1,
      "v!3r": 1,
      "v!d3-c0u!ll35": 1,
      "v!d3-c0u!ll3s": 1,
      "v!d3-cou!ll35": 1,
      "v!d3-cou!ll3s": 1,
      "v!de-c0u!lle5": 1,
      "v!de-c0u!lles": 1,
      "v!de-cou!lle5": 1,
      "v!de-cou!lles": 1,
      "v!éd@53": 1,
      "v!ed@5e": 1,
      "v!éd@5e": 1,
      "v!ed@s3": 1,
      "v!éd@s3": 1,
      "v!ed@se": 1,
      "v!éd@se": 1,
      "v!eda53": 1,
      "v!éda53": 1,
      "v!eda5e": 1,
      "v!éda5e": 1,
      "v!edas3": 1,
      "v!édas3": 1,
      "v!edase": 1,
      "v!édase": 1,
      "v!er": 1,
      "v@ur!3n": 1,
      "v@ur!en": 1,
      "v@ur13n": 1,
      "v@ur1en": 1,
      "v@uri3n": 1,
      "v@urien": 1,
      "v13d@53": 1,
      "v13d@s3": 1,
      v13da53: 1,
      v13das3: 1,
      v13r: 1,
      "v1d3-c0u1ll35": 1,
      "v1d3-c0u1ll3s": 1,
      "v1d3-cou1ll35": 1,
      "v1d3-cou1ll3s": 1,
      "v1de-c0u1lle5": 1,
      "v1de-c0u1lles": 1,
      "v1de-cou1lle5": 1,
      "v1de-cou1lles": 1,
      "v1ed@53": 1,
      "v1éd@53": 1,
      "v1ed@5e": 1,
      "v1éd@5e": 1,
      "v1ed@s3": 1,
      "v1éd@s3": 1,
      "v1ed@se": 1,
      "v1éd@se": 1,
      v1eda53: 1,
      v1éda53: 1,
      v1eda5e: 1,
      v1éda5e: 1,
      v1edas3: 1,
      v1édas3: 1,
      v1edase: 1,
      v1édase: 1,
      v1er: 1,
      "vaur!3n": 1,
      "vaur!en": 1,
      vaur13n: 1,
      vaur1en: 1,
      vauri3n: 1,
      vaurien: 1,
      "vi3d@53": 1,
      "vi3d@s3": 1,
      vi3da53: 1,
      vi3das3: 1,
      vi3r: 1,
      "vid3-c0uill35": 1,
      "vid3-c0uill3s": 1,
      "vid3-couill35": 1,
      "vid3-couill3s": 1,
      "vide-c0uille5": 1,
      "vide-c0uilles": 1,
      "vide-couille5": 1,
      "vide-couilles": 1,
      "vied@53": 1,
      "viéd@53": 1,
      "vied@5e": 1,
      "viéd@5e": 1,
      "vied@s3": 1,
      "viéd@s3": 1,
      "vied@se": 1,
      "viéd@se": 1,
      vieda53: 1,
      viéda53: 1,
      vieda5e: 1,
      viéda5e: 1,
      viedas3: 1,
      viédas3: 1,
      viedase: 1,
      viédase: 1,
      vier: 1,
      "x3r0p!n3ur": 1,
      x3r0p1n3ur: 1,
      x3r0pin3ur: 1,
      "x3rop!n3ur": 1,
      x3rop1n3ur: 1,
      x3ropin3ur: 1,
      "xer0p!n3ur": 1,
      "xér0p!n3ur": 1,
      "xer0p!neur": 1,
      "xér0p!neur": 1,
      xer0p1n3ur: 1,
      xér0p1n3ur: 1,
      xer0p1neur: 1,
      xér0p1neur: 1,
      xer0pin3ur: 1,
      xér0pin3ur: 1,
      xer0pineur: 1,
      xér0pineur: 1,
      "xerop!n3ur": 1,
      "xérop!n3ur": 1,
      "xerop!neur": 1,
      "xérop!neur": 1,
      xerop1n3ur: 1,
      xérop1n3ur: 1,
      xerop1neur: 1,
      xérop1neur: 1,
      xeropin3ur: 1,
      xéropin3ur: 1,
      xeropineur: 1,
      xéropineur: 1,
      y0ud: 1,
      "y0up!n": 1,
      "y0up!n!5@t!0n": 1,
      "y0up!n!5at!0n": 1,
      "y0up!n!s@t!0n": 1,
      "y0up!n!sat!0n": 1,
      "y0up!n3": 1,
      "y0up!ne": 1,
      y0up1n: 1,
      "y0up1n15@t10n": 1,
      y0up1n15at10n: 1,
      "y0up1n1s@t10n": 1,
      y0up1n1sat10n: 1,
      y0up1n3: 1,
      y0up1ne: 1,
      y0upin: 1,
      y0upin3: 1,
      y0upine: 1,
      "y0upini5@ti0n": 1,
      y0upini5ati0n: 1,
      "y0upinis@ti0n": 1,
      y0upinisati0n: 1,
      y0utr3: 1,
      y0utre: 1,
      y3ul3: 1,
      yeule: 1,
      youd: 1,
      "youp!n": 1,
      "youp!n!5@t!on": 1,
      "youp!n!5at!on": 1,
      "youp!n!s@t!on": 1,
      "youp!n!sat!on": 1,
      "youp!n3": 1,
      "youp!ne": 1,
      youp1n: 1,
      "youp1n15@t1on": 1,
      youp1n15at1on: 1,
      "youp1n1s@t1on": 1,
      youp1n1sat1on: 1,
      youp1n3: 1,
      youp1ne: 1,
      youpin: 1,
      youpin3: 1,
      youpine: 1,
      "youpini5@tion": 1,
      youpini5ation: 1,
      "youpinis@tion": 1,
      youpinisation: 1,
      youtr3: 1,
      youtre: 1,
      zgu3gu3: 1,
      zguegu3: 1,
      zguègu3: 1,
      zguegue: 1,
      zguègue: 1,
    };
  },
  function (module, exports) {
    module.exports = [
      "!mb3c!l3",
      "!mbec!l3",
      "!mbéc!l3",
      "!mbec!le",
      "!mbéc!le",
      "@brut!",
      "@brut1",
      "@bruti",
      "@nd0u!ll3",
      "@nd0u!lle",
      "@nd0u1ll3",
      "@nd0u1lle",
      "@nd0uill3",
      "@nd0uille",
      "@ndou!ll3",
      "@ndou!lle",
      "@ndou1ll3",
      "@ndou1lle",
      "@ndouill3",
      "@ndouille",
      "@v0rt0n",
      "@vorton",
      "1mb3c1l3",
      "1mbec1l3",
      "1mbéc1l3",
      "1mbec1le",
      "1mbéc1le",
      "35p!ng0!n",
      "35p!ngo!n",
      "35p1ng01n",
      "35p1ngo1n",
      "35ping0in",
      "35pingoin",
      "3mm@nch3",
      "3mm@nche",
      "3mm@nché",
      "3mm3rd3r",
      "3mm3rd3u53",
      "3mm3rd3ur",
      "3mm3rd3us3",
      "3mmanch3",
      "3mmanche",
      "3mmanché",
      "3mp@f3",
      "3mp@fe",
      "3mp@fé",
      "3mp@p@0ut3",
      "3mp@p@0ute",
      "3mp@p@0uté",
      "3mp@p@out3",
      "3mp@p@oute",
      "3mp@p@outé",
      "3mpaf3",
      "3mpafe",
      "3mpafé",
      "3mpapa0ut3",
      "3mpapa0ute",
      "3mpapa0uté",
      "3mpapaout3",
      "3mpapaoute",
      "3mpapaouté",
      "3ncul3",
      "3ncul3r",
      "3ncul3ur",
      "3ncule",
      "3nculé",
      "3nf0!r3",
      "3nf0!re",
      "3nf0!ré",
      "3nf01r3",
      "3nf01re",
      "3nf01ré",
      "3nf0ir3",
      "3nf0ire",
      "3nf0iré",
      "3nflur3",
      "3nfo!r3",
      "3nfo!re",
      "3nfo!ré",
      "3nfo1r3",
      "3nfo1re",
      "3nfo1ré",
      "3nfoir3",
      "3nfoire",
      "3nfoiré",
      "3nv@53l!n3ur",
      "3nv@53l1n3ur",
      "3nv@53lin3ur",
      "3nv@s3l!n3ur",
      "3nv@s3l1n3ur",
      "3nv@s3lin3ur",
      "3nva53l!n3ur",
      "3nva53l1n3ur",
      "3nva53lin3ur",
      "3nvas3l!n3ur",
      "3nvas3l1n3ur",
      "3nvas3lin3ur",
      "3p@!5",
      "3p@!s",
      "3p@15",
      "3p@1s",
      "3p@i5",
      "3p@is",
      "3pa!5",
      "3pa!s",
      "3pa15",
      "3pa1s",
      "3pai5",
      "3pais",
      "3sp!ng0!n",
      "3sp!ngo!n",
      "3sp1ng01n",
      "3sp1ngo1n",
      "3sping0in",
      "3spingoin",
      "3tr0n",
      "3tron",
      "5@g0u!n",
      "5@g0u1n",
      "5@g0uin",
      "5@gou!n",
      "5@gou1n",
      "5@gouin",
      "5@l@ud",
      "5@l0p",
      "5@l0p@rd",
      "5@l0p3",
      "5@l0pe",
      "5@l3",
      "5@le",
      "5@lop",
      "5@lop@rd",
      "5@lop3",
      "5@lope",
      "5@tr0u!ll3",
      "5@tr0u!lle",
      "5@tr0u1ll3",
      "5@tr0u1lle",
      "5@tr0uill3",
      "5@tr0uille",
      "5@trou!ll3",
      "5@trou!lle",
      "5@trou1ll3",
      "5@trou1lle",
      "5@trouill3",
      "5@trouille",
      "50tt!53ux",
      "50tt!5eux",
      "50tt153ux",
      "50tt15eux",
      "50tti53ux",
      "50tti5eux",
      "50u5-m3rd3",
      "50u5-merde",
      "53nt-l@-p!553",
      "53nt-l@-p1553",
      "53nt-l@-pi553",
      "53nt-la-p!553",
      "53nt-la-p1553",
      "53nt-la-pi553",
      "5ag0u!n",
      "5ag0u1n",
      "5ag0uin",
      "5agou!n",
      "5agou1n",
      "5agouin",
      "5al0p",
      "5al0p3",
      "5al0pard",
      "5al0pe",
      "5al3",
      "5alaud",
      "5ale",
      "5alop",
      "5alop3",
      "5alopard",
      "5alope",
      "5atr0u!ll3",
      "5atr0u!lle",
      "5atr0u1ll3",
      "5atr0u1lle",
      "5atr0uill3",
      "5atr0uille",
      "5atrou!ll3",
      "5atrou!lle",
      "5atrou1ll3",
      "5atrou1lle",
      "5atrouill3",
      "5atrouille",
      "5chb3b",
      "5chbeb",
      "5chl3u",
      "5chleu",
      "5chn0c",
      "5chn0ck",
      "5chn0qu3",
      "5chn0que",
      "5chnoc",
      "5chnock",
      "5chnoqu3",
      "5chnoque",
      "5ent-l@-p!55e",
      "5ent-l@-p155e",
      "5ent-l@-pi55e",
      "5ent-la-p!55e",
      "5ent-la-p155e",
      "5ent-la-pi55e",
      "5ott!53ux",
      "5ott!5eux",
      "5ott153ux",
      "5ott15eux",
      "5otti53ux",
      "5otti5eux",
      "5ou5-m3rd3",
      "5ou5-merde",
      "5t3@r!qu3",
      "5t3@r1qu3",
      "5t3@riqu3",
      "5t3ar!qu3",
      "5t3ar1qu3",
      "5t3ariqu3",
      "5té@r!qu3",
      "5te@r!que",
      "5té@r!que",
      "5te@r1qu3",
      "5té@r1qu3",
      "5te@r1que",
      "5té@r1que",
      "5te@riqu3",
      "5té@riqu3",
      "5te@rique",
      "5té@rique",
      "5tear!qu3",
      "5téar!qu3",
      "5tear!que",
      "5téar!que",
      "5tear1qu3",
      "5téar1qu3",
      "5tear1que",
      "5téar1que",
      "5teariqu3",
      "5téariqu3",
      "5tearique",
      "5téarique",
      "abrut!",
      "abrut1",
      "abruti",
      "and0u!ll3",
      "and0u!lle",
      "and0u1ll3",
      "and0u1lle",
      "and0uill3",
      "and0uille",
      "andou!ll3",
      "andou!lle",
      "andou1ll3",
      "andou1lle",
      "andouill3",
      "andouille",
      "av0rt0n",
      "avorton",
      "b!@tch",
      "b!atch",
      "b!c0t",
      "b!cot",
      "b!t3",
      "b!t3mb0!5",
      "b!t3mb0!s",
      "b!t3mbo!5",
      "b!t3mbo!s",
      "b!te",
      "b!temb0!5",
      "b!temb0!s",
      "b!tembo!5",
      "b!tembo!s",
      "b@t@rd",
      "b0rd3l",
      "b0rdel",
      "b0uff0n",
      "b0ugn0ul",
      "B0ugn0ul!3",
      "b0ugn0ul!5@t!0n",
      "b0ugn0ul!53r",
      "b0ugn0ul!5at!0n",
      "b0ugn0ul!5er",
      "B0ugn0ul!e",
      "b0ugn0ul!s@t!0n",
      "b0ugn0ul!s3r",
      "b0ugn0ul!sat!0n",
      "b0ugn0ul!ser",
      "B0ugn0ul13",
      "b0ugn0ul15@t10n",
      "b0ugn0ul153r",
      "b0ugn0ul15at10n",
      "b0ugn0ul15er",
      "B0ugn0ul1e",
      "b0ugn0ul1s@t10n",
      "b0ugn0ul1s3r",
      "b0ugn0ul1sat10n",
      "b0ugn0ul1ser",
      "b0ugn0ul3",
      "b0ugn0ule",
      "B0ugn0uli3",
      "b0ugn0uli5@ti0n",
      "b0ugn0uli53r",
      "b0ugn0uli5ati0n",
      "b0ugn0uli5er",
      "B0ugn0ulie",
      "b0ugn0ulis@ti0n",
      "b0ugn0ulis3r",
      "b0ugn0ulisati0n",
      "b0ugn0uliser",
      "b0ugr3",
      "b0ugre",
      "b0uk@k",
      "b0ukak",
      "b0un!0ul",
      "b0un10ul",
      "b0uni0ul",
      "b0urd!ll3",
      "b0urd!lle",
      "b0urd1ll3",
      "b0urd1lle",
      "b0urdill3",
      "b0urdille",
      "b0us3ux",
      "b0useux",
      "b1@tch",
      "b1atch",
      "b1c0t",
      "b1cot",
      "b1t3",
      "b1t3mb015",
      "b1t3mb01s",
      "b1t3mbo15",
      "b1t3mbo1s",
      "b1te",
      "b1temb015",
      "b1temb01s",
      "b1tembo15",
      "b1tembo1s",
      "b3@uf",
      "b3auf",
      "bât@rd",
      "batard",
      "bâtard",
      "be@uf",
      "beauf",
      "bi@tch",
      "biatch",
      "bic0t",
      "bicot",
      "bit3",
      "bit3mb0i5",
      "bit3mb0is",
      "bit3mboi5",
      "bit3mbois",
      "bite",
      "bitemb0i5",
      "bitemb0is",
      "bitemboi5",
      "bitembois",
      "bord3l",
      "bordel",
      "bouffon",
      "bougnoul",
      "Bougnoul!3",
      "bougnoul!5@t!on",
      "bougnoul!53r",
      "bougnoul!5at!on",
      "bougnoul!5er",
      "Bougnoul!e",
      "bougnoul!s@t!on",
      "bougnoul!s3r",
      "bougnoul!sat!on",
      "bougnoul!ser",
      "Bougnoul13",
      "bougnoul15@t1on",
      "bougnoul153r",
      "bougnoul15at1on",
      "bougnoul15er",
      "Bougnoul1e",
      "bougnoul1s@t1on",
      "bougnoul1s3r",
      "bougnoul1sat1on",
      "bougnoul1ser",
      "bougnoul3",
      "bougnoule",
      "Bougnouli3",
      "bougnouli5@tion",
      "bougnouli53r",
      "bougnouli5ation",
      "bougnouli5er",
      "Bougnoulie",
      "bougnoulis@tion",
      "bougnoulis3r",
      "bougnoulisation",
      "bougnouliser",
      "bougr3",
      "bougre",
      "bouk@k",
      "boukak",
      "boun!oul",
      "boun1oul",
      "bounioul",
      "bourd!ll3",
      "bourd!lle",
      "bourd1ll3",
      "bourd1lle",
      "bourdill3",
      "bourdille",
      "bous3ux",
      "bouseux",
      "br!53-burn35",
      "br!5e-burne5",
      "br!s3-burn3s",
      "br!se-burnes",
      "br@nl3r",
      "br@nl3ur",
      "br@nler",
      "br@nleur",
      "br@nqu3",
      "br@nque",
      "br153-burn35",
      "br15e-burne5",
      "br1s3-burn3s",
      "br1se-burnes",
      "branl3r",
      "branl3ur",
      "branler",
      "branleur",
      "branqu3",
      "branque",
      "bri53-burn35",
      "bri5e-burne5",
      "bris3-burn3s",
      "brise-burnes",
      "c@553-b0nb0n",
      "c@553-bonbon",
      "c@553-c0u!ll3",
      "c@553-c0u!ll35",
      "c@553-c0u1ll3",
      "c@553-c0u1ll35",
      "c@553-c0uill3",
      "c@553-c0uill35",
      "c@553-cou!ll3",
      "c@553-cou!ll35",
      "c@553-cou1ll3",
      "c@553-cou1ll35",
      "c@553-couill3",
      "c@553-couill35",
      "c@55e-b0nb0n",
      "c@55e-bonbon",
      "c@55e-c0u!lle",
      "c@55e-c0u!lle5",
      "c@55e-c0u1lle",
      "c@55e-c0u1lle5",
      "c@55e-c0uille",
      "c@55e-c0uille5",
      "c@55e-cou!lle",
      "c@55e-cou!lle5",
      "c@55e-cou1lle",
      "c@55e-cou1lle5",
      "c@55e-couille",
      "c@55e-couille5",
      "c@c0u",
      "c@cou",
      "c@fr3",
      "c@fre",
      "c@ld0ch3",
      "c@ld0che",
      "c@ldoch3",
      "c@ldoche",
      "c@ss3-b0nb0n",
      "c@ss3-bonbon",
      "c@ss3-c0u!ll3",
      "c@ss3-c0u!ll3s",
      "c@ss3-c0u1ll3",
      "c@ss3-c0u1ll3s",
      "c@ss3-c0uill3",
      "c@ss3-c0uill3s",
      "c@ss3-cou!ll3",
      "c@ss3-cou!ll3s",
      "c@ss3-cou1ll3",
      "c@ss3-cou1ll3s",
      "c@ss3-couill3",
      "c@ss3-couill3s",
      "c@sse-b0nb0n",
      "c@sse-bonbon",
      "c@sse-c0u!lle",
      "c@sse-c0u!lles",
      "c@sse-c0u1lle",
      "c@sse-c0u1lles",
      "c@sse-c0uille",
      "c@sse-c0uilles",
      "c@sse-cou!lle",
      "c@sse-cou!lles",
      "c@sse-cou1lle",
      "c@sse-cou1lles",
      "c@sse-couille",
      "c@sse-couilles",
      "c0ch3",
      "c0che",
      "c0n",
      "c0n@553",
      "c0n@55e",
      "c0n@rd",
      "c0n@ss3",
      "c0n@sse",
      "c0n5",
      "c0na553",
      "c0na55e",
      "c0nard",
      "c0nass3",
      "c0nasse",
      "c0nch!3r",
      "c0nch!er",
      "c0nch13r",
      "c0nch1er",
      "c0nchi3r",
      "c0nchier",
      "c0nn@553",
      "c0nn@55e",
      "c0nn@rd",
      "c0nn@rd3",
      "c0nn@rde",
      "c0nn@ss3",
      "c0nn@sse",
      "c0nn3",
      "c0nna553",
      "c0nna55e",
      "c0nnard",
      "c0nnard3",
      "c0nnarde",
      "c0nnass3",
      "c0nnasse",
      "c0nne",
      "c0ns",
      "c0u1ll0n",
      "c0u1ll0nn3r",
      "c0u1ll3",
      "c0u1ll3s",
      "c0uill0n",
      "c0uill0nn3r",
      "c0uill0nner",
      "c0uill3",
      "c0uill3s",
      "c0uille",
      "c0uilles",
      "c0un!fl3",
      "c0un!fle",
      "c0un1fl3",
      "c0un1fle",
      "c0unifl3",
      "c0unifle",
      "c0urt@ud",
      "c0urtaud",
      "ca553-b0nb0n",
      "ca553-bonbon",
      "ca553-c0u!ll3",
      "ca553-c0u!ll35",
      "ca553-c0u1ll3",
      "ca553-c0u1ll35",
      "ca553-c0uill3",
      "ca553-c0uill35",
      "ca553-cou!ll3",
      "ca553-cou!ll35",
      "ca553-cou1ll3",
      "ca553-cou1ll35",
      "ca553-couill3",
      "ca553-couill35",
      "ca55e-b0nb0n",
      "ca55e-bonbon",
      "ca55e-c0u!lle",
      "ca55e-c0u!lle5",
      "ca55e-c0u1lle",
      "ca55e-c0u1lle5",
      "ca55e-c0uille",
      "ca55e-c0uille5",
      "ca55e-cou!lle",
      "ca55e-cou!lle5",
      "ca55e-cou1lle",
      "ca55e-cou1lle5",
      "ca55e-couille",
      "ca55e-couille5",
      "cac0u",
      "cacou",
      "cafr3",
      "cafre",
      "cald0ch3",
      "cald0che",
      "caldoch3",
      "caldoche",
      "cass3-b0nb0n",
      "cass3-bonbon",
      "cass3-c0u!ll3",
      "cass3-c0u!ll3s",
      "cass3-c0u1ll3",
      "cass3-c0u1ll3s",
      "cass3-c0uill3",
      "cass3-c0uill3s",
      "cass3-cou!ll3",
      "cass3-cou!ll3s",
      "cass3-cou1ll3",
      "cass3-cou1ll3s",
      "cass3-couill3",
      "cass3-couill3s",
      "casse-b0nb0n",
      "casse-bonbon",
      "casse-c0u!lle",
      "casse-c0u!lles",
      "casse-c0u1lle",
      "casse-c0u1lles",
      "casse-c0uille",
      "casse-c0uilles",
      "casse-cou!lle",
      "casse-cou!lles",
      "casse-cou1lle",
      "casse-cou1lles",
      "casse-couille",
      "casse-couilles",
      "ch!3nn@553",
      "ch!3nn@ss3",
      "ch!3nna553",
      "ch!3nnass3",
      "ch!3r",
      "ch!enn@55e",
      "ch!enn@sse",
      "ch!enna55e",
      "ch!ennasse",
      "ch!er",
      "ch!n3t0c",
      "ch!n3t0qu3",
      "ch!n3toc",
      "ch!n3toqu3",
      "ch!net0c",
      "ch!net0que",
      "ch!netoc",
      "ch!netoque",
      "ch!nt0k",
      "ch!ntok",
      "ch@ch@r",
      "ch@g@553",
      "ch@g@55e",
      "ch@g@ss3",
      "ch@g@sse",
      "ch@uff@rd",
      "ch13nn@553",
      "ch13nn@ss3",
      "ch13nna553",
      "ch13nnass3",
      "ch13r",
      "ch13ur",
      "ch13urs",
      "ch1enn@55e",
      "ch1enn@sse",
      "ch1enna55e",
      "ch1ennasse",
      "ch1er",
      "ch1eur",
      "ch1eurs",
      "ch1n3t0c",
      "ch1n3t0qu3",
      "ch1n3toc",
      "ch1n3toqu3",
      "ch1net0c",
      "ch1net0que",
      "ch1netoc",
      "ch1netoque",
      "ch1nt0k",
      "ch1ntok",
      "chachar",
      "chaga553",
      "chaga55e",
      "chagass3",
      "chagasse",
      "chauffard",
      "chi3nn@553",
      "chi3nn@ss3",
      "chi3nna553",
      "chi3nnass3",
      "chi3r",
      "chi3ur",
      "chi3urs",
      "chienn@55e",
      "chienn@sse",
      "chienna55e",
      "chiennasse",
      "chier",
      "chieur",
      "chieurs",
      "chin3t0c",
      "chin3t0qu3",
      "chin3toc",
      "chin3toqu3",
      "chinet0c",
      "chinet0que",
      "chinetoc",
      "chinetoque",
      "chint0k",
      "chintok",
      "chl3uh",
      "chleuh",
      "chn0qu3",
      "chn0que",
      "chnoqu3",
      "chnoque",
      "coch3",
      "coche",
      "con",
      "con@553",
      "con@55e",
      "con@rd",
      "con@ss3",
      "con@sse",
      "con5",
      "cona553",
      "cona55e",
      "conard",
      "conass3",
      "conasse",
      "conch!3r",
      "conch!er",
      "conch13r",
      "conch1er",
      "conchi3r",
      "conchier",
      "conn@553",
      "conn@55e",
      "conn@rd",
      "conn@rd3",
      "conn@rde",
      "conn@ss3",
      "conn@sse",
      "conn3",
      "conna553",
      "conna55e",
      "connard",
      "connard3",
      "connarde",
      "connass3",
      "connasse",
      "conne",
      "cons",
      "cou1lle",
      "cou1lles",
      "cou1llon",
      "cou1llonner",
      "couill3",
      "couill3s",
      "couille",
      "couilles",
      "couillon",
      "couillonn3r",
      "couillonner",
      "coun!fl3",
      "coun!fle",
      "coun1fl3",
      "coun1fle",
      "counifl3",
      "counifle",
      "court@ud",
      "courtaud",
      "cr!cr!",
      "cr0tt3",
      "cr0tte",
      "cr0tté",
      "cr0u!ll@t",
      "cr0u!ll3",
      "cr0u!llat",
      "cr0u!lle",
      "cr0u1ll@t",
      "cr0u1ll3",
      "cr0u1llat",
      "cr0u1lle",
      "cr0uill@t",
      "cr0uill3",
      "cr0uillat",
      "cr0uille",
      "cr0ût0n",
      "cr1cr1",
      "cr3t!n",
      "cr3t1n",
      "cr3tin",
      "cr3v@rd",
      "cr3vard",
      "cr3vur3",
      "cret!n",
      "crét!n",
      "cret1n",
      "crét1n",
      "cretin",
      "crétin",
      "crev@rd",
      "crevard",
      "crevure",
      "cricri",
      "crott3",
      "crotte",
      "crotté",
      "crou!ll@t",
      "crou!ll3",
      "crou!llat",
      "crou!lle",
      "crou1ll@t",
      "crou1ll3",
      "crou1llat",
      "crou1lle",
      "crouill@t",
      "crouill3",
      "crouillat",
      "crouille",
      "croûton",
      "cul",
      "d3b!l3",
      "d3b1l3",
      "d3bil3",
      "d3gu3l@ss3",
      "d3gu3lass3",
      "d3m3rd3r",
      "deb!l3",
      "déb!l3",
      "deb!le",
      "déb!le",
      "deb1l3",
      "déb1l3",
      "deb1le",
      "déb1le",
      "debil3",
      "débil3",
      "debile",
      "débile",
      "déguel@sse",
      "deguelasse",
      "déguelasse",
      "demerder",
      "démerder",
      "dr0u!ll3",
      "dr0u!lle",
      "dr0u1ll3",
      "dr0u1lle",
      "dr0uill3",
      "dr0uille",
      "drou!ll3",
      "drou!lle",
      "drou1ll3",
      "drou1lle",
      "drouill3",
      "drouille",
      "du schn0c",
      "du schnoc",
      "du5chn0ck",
      "du5chnock",
      "duc0n",
      "duc0nn0t",
      "ducon",
      "duconnot",
      "dug3n0ux",
      "dug3noux",
      "dugen0ux",
      "dugenoux",
      "dugl@nd",
      "dugland",
      "duschn0ck",
      "duschnock",
      "e5p!ng0!n",
      "e5p!ngo!n",
      "e5p1ng01n",
      "e5p1ngo1n",
      "e5ping0in",
      "e5pingoin",
      "emm@nche",
      "emm@nché",
      "emmanche",
      "emmanché",
      "emmerder",
      "emmerdeu5e",
      "emmerdeur",
      "emmerdeuse",
      "emp@fe",
      "emp@fé",
      "emp@p@0ute",
      "emp@p@0uté",
      "emp@p@oute",
      "emp@p@outé",
      "empafe",
      "empafé",
      "empapa0ute",
      "empapa0uté",
      "empapaoute",
      "empapaouté",
      "encule",
      "enculé",
      "enculer",
      "enculeur",
      "enf0!re",
      "enf0!ré",
      "enf01re",
      "enf01ré",
      "enf0ire",
      "enf0iré",
      "enflure",
      "enfo!re",
      "enfo!ré",
      "enfo1re",
      "enfo1ré",
      "enfoire",
      "enfoiré",
      "env@5el!neur",
      "env@5el1neur",
      "env@5elineur",
      "env@sel!neur",
      "env@sel1neur",
      "env@selineur",
      "enva5el!neur",
      "enva5el1neur",
      "enva5elineur",
      "envasel!neur",
      "envasel1neur",
      "envaselineur",
      "ep@!5",
      "ép@!5",
      "ep@!s",
      "ép@!s",
      "ep@15",
      "ép@15",
      "ep@1s",
      "ép@1s",
      "ep@i5",
      "ép@i5",
      "ep@is",
      "ép@is",
      "epa!5",
      "épa!5",
      "epa!s",
      "épa!s",
      "epa15",
      "épa15",
      "epa1s",
      "épa1s",
      "epai5",
      "épai5",
      "epais",
      "épais",
      "esp!ng0!n",
      "esp!ngo!n",
      "esp1ng01n",
      "esp1ngo1n",
      "esping0in",
      "espingoin",
      "etr0n",
      "étr0n",
      "etron",
      "étron",
      "f!0tt3",
      "f!0tte",
      "f!ott3",
      "f!otte",
      "f0ut3ur",
      "f0uteur",
      "f0utr3",
      "f0utre",
      "f10tt3",
      "f10tte",
      "f1ott3",
      "f1otte",
      "f31gn@ss3",
      "f3ign@ss3",
      "f3ignass3",
      "FDP",
      "fe1gnasse",
      "feign@sse",
      "feignasse",
      "fi0tt3",
      "fi0tte",
      "fiott3",
      "fiotte",
      "fout3ur",
      "fouteur",
      "foutr3",
      "foutre",
      "fr!tz",
      "fr1tz",
      "fritz",
      "fum!3r",
      "fum!er",
      "fum13r",
      "fum1er",
      "fumi3r",
      "fumier",
      "g@rc3",
      "g@rce",
      "g@up3",
      "g@upe",
      "G0d0n",
      "g0g0l",
      "g0ï",
      "g0u!ll@nd",
      "g0u!lland",
      "g0u!n3",
      "g0u!ne",
      "g0u1ll@nd",
      "g0u1lland",
      "g0u1n3",
      "g0u1ne",
      "g0uill@nd",
      "g0uilland",
      "g0uin3",
      "g0uine",
      "g0urd3",
      "g0urde",
      "g0urg@nd!n3",
      "g0urg@nd!ne",
      "g0urg@nd1n3",
      "g0urg@nd1ne",
      "g0urg@ndin3",
      "g0urg@ndine",
      "g0urgand!n3",
      "g0urgand!ne",
      "g0urgand1n3",
      "g0urgand1ne",
      "g0urgandin3",
      "g0urgandine",
      "garc3",
      "garce",
      "gaup3",
      "gaupe",
      "GDM",
      "gl@nd",
      "gl@nd0u!ll0u",
      "gl@nd0u1ll0u",
      "gl@nd0uill0u",
      "gl@nd3u53",
      "gl@nd3ur",
      "gl@nd3us3",
      "gl@ndeu5e",
      "gl@ndeur",
      "gl@ndeuse",
      "gl@ndou!llou",
      "gl@ndou1llou",
      "gl@ndouillou",
      "gl@ndu",
      "gland",
      "gland0u!ll0u",
      "gland0u1ll0u",
      "gland0uill0u",
      "gland3u53",
      "gland3ur",
      "gland3us3",
      "glandeu5e",
      "glandeur",
      "glandeuse",
      "glandou!llou",
      "glandou1llou",
      "glandouillou",
      "glandu",
      "gn0ul",
      "gn0ul3",
      "gn0ule",
      "gnoul",
      "gnoul3",
      "gnoule",
      "Godon",
      "gogol",
      "goï",
      "gou!ll@nd",
      "gou!lland",
      "gou!n3",
      "gou!ne",
      "gou1ll@nd",
      "gou1lland",
      "gou1n3",
      "gou1ne",
      "gouill@nd",
      "gouilland",
      "gouin3",
      "gouine",
      "gourd3",
      "gourde",
      "gourg@nd!n3",
      "gourg@nd!ne",
      "gourg@nd1n3",
      "gourg@nd1ne",
      "gourg@ndin3",
      "gourg@ndine",
      "gourgand!n3",
      "gourgand!ne",
      "gourgand1n3",
      "gourgand1ne",
      "gourgandin3",
      "gourgandine",
      "gr0gn@553",
      "gr0gn@55e",
      "gr0gn@ss3",
      "gr0gn@sse",
      "gr0gna553",
      "gr0gna55e",
      "gr0gnass3",
      "gr0gnasse",
      "grogn@553",
      "grogn@55e",
      "grogn@ss3",
      "grogn@sse",
      "grogna553",
      "grogna55e",
      "grognass3",
      "grognasse",
      "gu!nd0ul3",
      "gu!nd0ule",
      "gu!ndoul3",
      "gu!ndoule",
      "gu1nd0ul3",
      "gu1nd0ule",
      "gu1ndoul3",
      "gu1ndoule",
      "gu3n!ch3",
      "gu3n1ch3",
      "gu3nich3",
      "guen!che",
      "guen1che",
      "gueniche",
      "guind0ul3",
      "guind0ule",
      "guindoul3",
      "guindoule",
      "imb3cil3",
      "imbecil3",
      "imbécil3",
      "imbecile",
      "imbécile",
      "j3@n-f0utr3",
      "j3@n-foutr3",
      "j3an-f0utr3",
      "j3an-foutr3",
      "je@n-f0utre",
      "je@n-foutre",
      "jean-f0utre",
      "jean-foutre",
      "k!k00",
      "k!k0u",
      "k!koo",
      "k!kou",
      "k1k00",
      "k1k0u",
      "k1koo",
      "k1kou",
      "kik00",
      "kik0u",
      "kikoo",
      "kikou",
      "Kr@ut",
      "Kraut",
      "l@ch3ux",
      "l@cheux",
      "l@v3tt3",
      "l@vette",
      "l0p3tt3",
      "l0pette",
      "lach3ux",
      "lâch3ux",
      "lacheux",
      "lâcheux",
      "lav3tt3",
      "lavette",
      "lop3tt3",
      "lopette",
      "m!53r@bl3",
      "m!53rabl3",
      "m!5ér@bl3",
      "m!5er@ble",
      "m!5ér@ble",
      "m!5erabl3",
      "m!5érabl3",
      "m!5erable",
      "m!5érable",
      "m!cht0",
      "m!chto",
      "m!n@bl3",
      "m!n@ble",
      "m!nabl3",
      "m!nable",
      "m!nu5",
      "m!nus",
      "m!s3r@bl3",
      "m!s3rabl3",
      "m!ser@bl3",
      "m!sér@bl3",
      "m!ser@ble",
      "m!sér@ble",
      "m!serabl3",
      "m!sérabl3",
      "m!serable",
      "m!sérable",
      "m@g0t",
      "m@got",
      "m@k0um3",
      "m@k0ume",
      "m@k0umé",
      "m@koum3",
      "m@koume",
      "m@koumé",
      "m@nch3",
      "m@nche",
      "m@ng3-m3rd3",
      "m@nge-merde",
      "m@rch@nd0t",
      "m@rch@ndot",
      "m@rg0u!ll!5t3",
      "m@rg0u!ll!5te",
      "m@rg0u!ll!st3",
      "m@rg0u!ll!ste",
      "m@rg0u1ll15t3",
      "m@rg0u1ll15te",
      "m@rg0u1ll1st3",
      "m@rg0u1ll1ste",
      "m@rg0uilli5t3",
      "m@rg0uilli5te",
      "m@rg0uillist3",
      "m@rg0uilliste",
      "m@rgou!ll!5t3",
      "m@rgou!ll!5te",
      "m@rgou!ll!st3",
      "m@rgou!ll!ste",
      "m@rgou1ll15t3",
      "m@rgou1ll15te",
      "m@rgou1ll1st3",
      "m@rgou1ll1ste",
      "m@rgouilli5t3",
      "m@rgouilli5te",
      "m@rgouillist3",
      "m@rgouilliste",
      "m@uv!3tt3",
      "m@uv!ette",
      "m@uv13tt3",
      "m@uv1ette",
      "m@uvi3tt3",
      "m@uviette",
      "m0!n@!ll3",
      "m0!n@!lle",
      "m0!n5-qu3-r!3n",
      "m0!n5-que-r!en",
      "m0!na!ll3",
      "m0!na!lle",
      "m0!ns-qu3-r!3n",
      "m0!ns-que-r!en",
      "m01n@1ll3",
      "m01n@1lle",
      "m01n5-qu3-r13n",
      "m01n5-que-r1en",
      "m01na1ll3",
      "m01na1lle",
      "m01ns-qu3-r13n",
      "m01ns-que-r1en",
      "m0in@ill3",
      "m0in@ille",
      "m0in5-qu3-ri3n",
      "m0in5-que-rien",
      "m0inaill3",
      "m0inaille",
      "m0ins-qu3-ri3n",
      "m0ins-que-rien",
      "m0n@c@!ll3",
      "m0n@c@!lle",
      "m0n@c@1ll3",
      "m0n@c@1lle",
      "m0n@c@ill3",
      "m0n@c@ille",
      "m0naca!ll3",
      "m0naca!lle",
      "m0naca1ll3",
      "m0naca1lle",
      "m0nacaill3",
      "m0nacaille",
      "m0r!c@ud",
      "m0r!caud",
      "m0r1c@ud",
      "m0r1caud",
      "m0ric@ud",
      "m0ricaud",
      "m153r@bl3",
      "m153rabl3",
      "m15er@bl3",
      "m15ér@bl3",
      "m15er@ble",
      "m15ér@ble",
      "m15erabl3",
      "m15érabl3",
      "m15erable",
      "m15érable",
      "m1cht0",
      "m1chto",
      "m1n@bl3",
      "m1n@ble",
      "m1nabl3",
      "m1nable",
      "m1nu5",
      "m1nus",
      "m1s3r@bl3",
      "m1s3rabl3",
      "m1ser@bl3",
      "m1sér@bl3",
      "m1ser@ble",
      "m1sér@ble",
      "m1serabl3",
      "m1sérabl3",
      "m1serable",
      "m1sérable",
      "m3rd@!ll0n",
      "m3rd@!ll3",
      "m3rd@!llon",
      "m3rd@1ll0n",
      "m3rd@1ll3",
      "m3rd@1llon",
      "m3rd@ill0n",
      "m3rd@ill3",
      "m3rd@illon",
      "m3rd0u!ll@rd",
      "m3rd0u!llard",
      "m3rd0u1ll@rd",
      "m3rd0u1llard",
      "m3rd0uill@rd",
      "m3rd0uillard",
      "m3rd3",
      "m3rd3ux",
      "m3rda!ll0n",
      "m3rda!ll3",
      "m3rda!llon",
      "m3rda1ll0n",
      "m3rda1ll3",
      "m3rda1llon",
      "m3rdaill0n",
      "m3rdaill3",
      "m3rdaillon",
      "m3rdou!ll@rd",
      "m3rdou!llard",
      "m3rdou1ll@rd",
      "m3rdou1llard",
      "m3rdouill@rd",
      "m3rdouillard",
      "mag0t",
      "magot",
      "mak0um3",
      "mak0ume",
      "mak0umé",
      "makoum3",
      "makoume",
      "makoumé",
      "manch3",
      "manche",
      "mang3-m3rd3",
      "mange-merde",
      "marchand0t",
      "marchandot",
      "marg0u!ll!5t3",
      "marg0u!ll!5te",
      "marg0u!ll!st3",
      "marg0u!ll!ste",
      "marg0u1ll15t3",
      "marg0u1ll15te",
      "marg0u1ll1st3",
      "marg0u1ll1ste",
      "marg0uilli5t3",
      "marg0uilli5te",
      "marg0uillist3",
      "marg0uilliste",
      "margou!ll!5t3",
      "margou!ll!5te",
      "margou!ll!st3",
      "margou!ll!ste",
      "margou1ll15t3",
      "margou1ll15te",
      "margou1ll1st3",
      "margou1ll1ste",
      "margouilli5t3",
      "margouilli5te",
      "margouillist3",
      "margouilliste",
      "mauv!3tt3",
      "mauv!ette",
      "mauv13tt3",
      "mauv1ette",
      "mauvi3tt3",
      "mauviette",
      "merd@!ll0n",
      "merd@!lle",
      "merd@!llon",
      "merd@1ll0n",
      "merd@1lle",
      "merd@1llon",
      "merd@ill0n",
      "merd@ille",
      "merd@illon",
      "merd0u!ll@rd",
      "merd0u!llard",
      "merd0u1ll@rd",
      "merd0u1llard",
      "merd0uill@rd",
      "merd0uillard",
      "merda!ll0n",
      "merda!lle",
      "merda!llon",
      "merda1ll0n",
      "merda1lle",
      "merda1llon",
      "merdaill0n",
      "merdaille",
      "merdaillon",
      "merde",
      "merdeux",
      "merdou!ll@rd",
      "merdou!llard",
      "merdou1ll@rd",
      "merdou1llard",
      "merdouill@rd",
      "merdouillard",
      "mi53r@bl3",
      "mi53rabl3",
      "mi5er@bl3",
      "mi5ér@bl3",
      "mi5er@ble",
      "mi5ér@ble",
      "mi5erabl3",
      "mi5érabl3",
      "mi5erable",
      "mi5érable",
      "micht0",
      "michto",
      "min@bl3",
      "min@ble",
      "minabl3",
      "minable",
      "minu5",
      "minus",
      "mis3r@bl3",
      "mis3rabl3",
      "miser@bl3",
      "misér@bl3",
      "miser@ble",
      "misér@ble",
      "miserabl3",
      "misérabl3",
      "miserable",
      "misérable",
      "mo!n@!ll3",
      "mo!n@!lle",
      "mo!n5-qu3-r!3n",
      "mo!n5-que-r!en",
      "mo!na!ll3",
      "mo!na!lle",
      "mo!ns-qu3-r!3n",
      "mo!ns-que-r!en",
      "mo1n@1ll3",
      "mo1n@1lle",
      "mo1n5-qu3-r13n",
      "mo1n5-que-r1en",
      "mo1na1ll3",
      "mo1na1lle",
      "mo1ns-qu3-r13n",
      "mo1ns-que-r1en",
      "moin@ill3",
      "moin@ille",
      "moin5-qu3-ri3n",
      "moin5-que-rien",
      "moinaill3",
      "moinaille",
      "moins-qu3-ri3n",
      "moins-que-rien",
      "mon@c@!ll3",
      "mon@c@!lle",
      "mon@c@1ll3",
      "mon@c@1lle",
      "mon@c@ill3",
      "mon@c@ille",
      "monaca!ll3",
      "monaca!lle",
      "monaca1ll3",
      "monaca1lle",
      "monacaill3",
      "monacaille",
      "mor!c@ud",
      "mor!caud",
      "mor1c@ud",
      "mor1caud",
      "moric@ud",
      "moricaud",
      "n!@!53ux",
      "n!@!5eux",
      "n!@!s3ux",
      "n!@!seux",
      "n!@c",
      "n!@k0u3",
      "n!@k0ue",
      "n!@k0ué",
      "n!@kou3",
      "n!@koue",
      "n!@koué",
      "n!a!53ux",
      "n!a!5eux",
      "n!a!s3ux",
      "n!a!seux",
      "n!ac",
      "n!ak0u3",
      "n!ak0ue",
      "n!ak0ué",
      "n!akou3",
      "n!akoue",
      "n!akoué",
      "n!qu3",
      "n!qu3r",
      "n!que",
      "n!quer",
      "n@s3",
      "n@se",
      "n@z3",
      "n@ze",
      "n1@153ux",
      "n1@15eux",
      "n1@1s3ux",
      "n1@1seux",
      "n1@c",
      "n1@k0u3",
      "n1@k0ue",
      "n1@k0ué",
      "n1@kou3",
      "n1@koue",
      "n1@koué",
      "n1a153ux",
      "n1a15eux",
      "n1a1s3ux",
      "n1a1seux",
      "n1ac",
      "n1ak0u3",
      "n1ak0ue",
      "n1ak0ué",
      "n1akou3",
      "n1akoue",
      "n1akoué",
      "n1qu3",
      "n1qu3r",
      "n1que",
      "n1quer",
      "n3gr0",
      "n3gro",
      "nas3",
      "nase",
      "naz3",
      "naze",
      "negr0",
      "négr0",
      "negro",
      "négro",
      "ni@c",
      "ni@i53ux",
      "ni@i5eux",
      "ni@is3ux",
      "ni@iseux",
      "ni@k0u3",
      "ni@k0ue",
      "ni@k0ué",
      "ni@kou3",
      "ni@koue",
      "ni@koué",
      "niac",
      "niai53ux",
      "niai5eux",
      "niais3ux",
      "niaiseux",
      "niak0u3",
      "niak0ue",
      "niak0ué",
      "niakou3",
      "niakoue",
      "niakoué",
      "niqu3",
      "niqu3r",
      "nique",
      "niquer",
      "NTM",
      "p!550u",
      "p!55ou",
      "p!gn0uf",
      "p!gnouf",
      "p!ss0u",
      "p!ssou",
      "p@k05",
      "p@k0s",
      "p@ko5",
      "p@kos",
      "p@n0ufl3",
      "p@n0ufle",
      "p@noufl3",
      "p@noufle",
      "p@t@r!n",
      "p@t@r1n",
      "p@t@rin",
      "p0rc@5",
      "p0rc@553",
      "p0rc@55e",
      "p0rc@s",
      "p0rc@ss3",
      "p0rc@sse",
      "p0rca5",
      "p0rca553",
      "p0rca55e",
      "p0rcas",
      "p0rcass3",
      "p0rcasse",
      "p0uc@v",
      "p0ucav",
      "p0uf",
      "p0uf!@553",
      "p0uf!@55e",
      "p0uf!@ss3",
      "p0uf!@sse",
      "p0uf!a553",
      "p0uf!a55e",
      "p0uf!ass3",
      "p0uf!asse",
      "p0uf1@553",
      "p0uf1@55e",
      "p0uf1@ss3",
      "p0uf1@sse",
      "p0uf1a553",
      "p0uf1a55e",
      "p0uf1ass3",
      "p0uf1asse",
      "p0uff!@553",
      "p0uff!@55e",
      "p0uff!@ss3",
      "p0uff!@sse",
      "p0uff!a553",
      "p0uff!a55e",
      "p0uff!ass3",
      "p0uff!asse",
      "p0uff1@553",
      "p0uff1@55e",
      "p0uff1@ss3",
      "p0uff1@sse",
      "p0uff1a553",
      "p0uff1a55e",
      "p0uff1ass3",
      "p0uff1asse",
      "p0uffi@553",
      "p0uffi@55e",
      "p0uffi@ss3",
      "p0uffi@sse",
      "p0uffia553",
      "p0uffia55e",
      "p0uffiass3",
      "p0uffiasse",
      "p0ufi@553",
      "p0ufi@55e",
      "p0ufi@ss3",
      "p0ufi@sse",
      "p0ufia553",
      "p0ufia55e",
      "p0ufiass3",
      "p0ufiasse",
      "p0und3",
      "p0unde",
      "p0undé",
      "p0urr!tur3",
      "p0urr!ture",
      "p0urr1tur3",
      "p0urr1ture",
      "p0urritur3",
      "p0urriture",
      "p1550u",
      "p155ou",
      "p1gn0uf",
      "p1gnouf",
      "p1mbêch3",
      "p1mbêche",
      "p1ss0u",
      "p1ss3ux",
      "p1sseux",
      "p1ssou",
      "p3cqu3",
      "p3d@l3",
      "p3d0qu3",
      "p3d3",
      "p3dal3",
      "p3doqu3",
      "p3qu3n@ud",
      "p3qu3naud",
      "p3t",
      "p3t@553",
      "p3t@ss3",
      "p3t3ux",
      "p3ta553",
      "p3tass3",
      "pak05",
      "pak0s",
      "pako5",
      "pakos",
      "pan0ufl3",
      "pan0ufle",
      "panoufl3",
      "panoufle",
      "patar!n",
      "patar1n",
      "patarin",
      "PD",
      "pecque",
      "ped@l3",
      "péd@l3",
      "ped@le",
      "péd@le",
      "ped0qu3",
      "péd0qu3",
      "ped0que",
      "péd0que",
      "pedal3",
      "pédal3",
      "pedale",
      "pédale",
      "pede",
      "pédé",
      "pedoqu3",
      "pédoqu3",
      "pedoque",
      "pédoque",
      "pequ3n@ud",
      "péqu3n@ud",
      "pequ3naud",
      "péqu3naud",
      "pequen@ud",
      "péquen@ud",
      "pequenaud",
      "péquenaud",
      "pet",
      "pét@553",
      "pet@55e",
      "pét@55e",
      "pet@ss3",
      "pét@ss3",
      "pet@sse",
      "pét@sse",
      "peta553",
      "péta553",
      "peta55e",
      "péta55e",
      "petass3",
      "pétass3",
      "petasse",
      "pétasse",
      "peteux",
      "péteux",
      "pi550u",
      "pi55ou",
      "pign0uf",
      "pignouf",
      "pimbêch3",
      "pimbêche",
      "piss0u",
      "piss3ux",
      "pisseux",
      "pissou",
      "pl0uc",
      "pl3utr3",
      "pleutre",
      "plouc",
      "porc@5",
      "porc@553",
      "porc@55e",
      "porc@s",
      "porc@ss3",
      "porc@sse",
      "porca5",
      "porca553",
      "porca55e",
      "porcas",
      "porcass3",
      "porcasse",
      "pouc@v",
      "poucav",
      "pouf",
      "pouf!@553",
      "pouf!@55e",
      "pouf!@ss3",
      "pouf!@sse",
      "pouf!a553",
      "pouf!a55e",
      "pouf!ass3",
      "pouf!asse",
      "pouf1@553",
      "pouf1@55e",
      "pouf1@ss3",
      "pouf1@sse",
      "pouf1a553",
      "pouf1a55e",
      "pouf1ass3",
      "pouf1asse",
      "pouff!@553",
      "pouff!@55e",
      "pouff!@ss3",
      "pouff!@sse",
      "pouff!a553",
      "pouff!a55e",
      "pouff!ass3",
      "pouff!asse",
      "pouff1@553",
      "pouff1@55e",
      "pouff1@ss3",
      "pouff1@sse",
      "pouff1a553",
      "pouff1a55e",
      "pouff1ass3",
      "pouff1asse",
      "pouffi@553",
      "pouffi@55e",
      "pouffi@ss3",
      "pouffi@sse",
      "pouffia553",
      "pouffia55e",
      "pouffiass3",
      "pouffiasse",
      "poufi@553",
      "poufi@55e",
      "poufi@ss3",
      "poufi@sse",
      "poufia553",
      "poufia55e",
      "poufiass3",
      "poufiasse",
      "pound3",
      "pounde",
      "poundé",
      "pourr!tur3",
      "pourr!ture",
      "pourr1tur3",
      "pourr1ture",
      "pourritur3",
      "pourriture",
      "pun@!53",
      "pun@!5e",
      "pun@!s3",
      "pun@!se",
      "pun@153",
      "pun@15e",
      "pun@1s3",
      "pun@1se",
      "pun@i53",
      "pun@i5e",
      "pun@is3",
      "pun@ise",
      "puna!53",
      "puna!5e",
      "puna!s3",
      "puna!se",
      "puna153",
      "puna15e",
      "puna1s3",
      "puna1se",
      "punai53",
      "punai5e",
      "punais3",
      "punaise",
      "put!n",
      "put@!n",
      "put@1n",
      "put@in",
      "put1n",
      "put3",
      "puta!n",
      "puta1n",
      "putain",
      "pute",
      "putin",
      "qu3ut@rd",
      "qu3utard",
      "queut@rd",
      "queutard",
      "r!p0p33",
      "r!p0pe3",
      "r!p0pé3",
      "r!p0pee",
      "r!p0pée",
      "r!pop33",
      "r!pope3",
      "r!popé3",
      "r!popee",
      "r!popée",
      "r@clur3",
      "r@clure",
      "r@t0n",
      "r@ton",
      "r05b!f",
      "r05b1f",
      "r05bif",
      "r0b35p!3rr0t",
      "r0b35p13rr0t",
      "r0b35pi3rr0t",
      "r0b3sp!3rr0t",
      "r0b3sp13rr0t",
      "r0b3spi3rr0t",
      "r0be5p!err0t",
      "r0be5p1err0t",
      "r0be5pierr0t",
      "r0besp!err0t",
      "r0besp1err0t",
      "r0bespierr0t",
      "r0sb!f",
      "r0sb1f",
      "r0sbif",
      "r0ulur3",
      "r0ulure",
      "r1p0p33",
      "r1p0pe3",
      "r1p0pé3",
      "r1p0pee",
      "r1p0pée",
      "r1pop33",
      "r1pope3",
      "r1popé3",
      "r1popee",
      "r1popée",
      "raclur3",
      "raclure",
      "rat0n",
      "raton",
      "rip0p33",
      "rip0pe3",
      "rip0pé3",
      "rip0pee",
      "rip0pée",
      "ripop33",
      "ripope3",
      "ripopé3",
      "ripopee",
      "ripopée",
      "ro5b!f",
      "ro5b1f",
      "ro5bif",
      "rob35p!3rrot",
      "rob35p13rrot",
      "rob35pi3rrot",
      "rob3sp!3rrot",
      "rob3sp13rrot",
      "rob3spi3rrot",
      "robe5p!errot",
      "robe5p1errot",
      "robe5pierrot",
      "robesp!errot",
      "robesp1errot",
      "robespierrot",
      "rosb!f",
      "rosb1f",
      "rosbif",
      "roulur3",
      "roulure",
      "s@g0u!n",
      "s@g0u1n",
      "s@g0uin",
      "s@gou!n",
      "s@gou1n",
      "s@gouin",
      "s@l@ud",
      "s@l0p",
      "s@l0p@rd",
      "s@l0p3",
      "s@l0p3r13",
      "s@l0p3ri3",
      "s@l0pe",
      "s@l3",
      "s@le",
      "s@lop",
      "s@lop@rd",
      "s@lop3",
      "s@lop3ri3",
      "s@lope",
      "s@loperie",
      "s@tr0u!ll3",
      "s@tr0u!lle",
      "s@tr0u1ll3",
      "s@tr0u1lle",
      "s@tr0uill3",
      "s@tr0uille",
      "s@trou!ll3",
      "s@trou!lle",
      "s@trou1ll3",
      "s@trou1lle",
      "s@trouill3",
      "s@trouille",
      "s0tt!s3ux",
      "s0tt!seux",
      "s0tt1s3ux",
      "s0tt1seux",
      "s0ttis3ux",
      "s0ttiseux",
      "s0us-m3rd3",
      "s0us-merde",
      "s3nt-l@-p!ss3",
      "s3nt-l@-p1ss3",
      "s3nt-l@-piss3",
      "s3nt-la-p!ss3",
      "s3nt-la-p1ss3",
      "s3nt-la-piss3",
      "sag0u!n",
      "sag0u1n",
      "sag0uin",
      "sagou!n",
      "sagou1n",
      "sagouin",
      "sal0p",
      "sal0p3",
      "sal0pard",
      "sal0pe",
      "sal0perie",
      "sal3",
      "salaud",
      "sale",
      "salop",
      "salop3",
      "salop3ri3",
      "salopard",
      "salope",
      "saloper1e",
      "saloperie",
      "satr0u!ll3",
      "satr0u!lle",
      "satr0u1ll3",
      "satr0u1lle",
      "satr0uill3",
      "satr0uille",
      "satrou!ll3",
      "satrou!lle",
      "satrou1ll3",
      "satrou1lle",
      "satrouill3",
      "satrouille",
      "schb3b",
      "schbeb",
      "schl3u",
      "schleu",
      "schn0c",
      "schn0ck",
      "schn0qu3",
      "schn0que",
      "schnoc",
      "schnock",
      "schnoqu3",
      "schnoque",
      "sent-l@-p!sse",
      "sent-l@-p1sse",
      "sent-l@-pisse",
      "sent-la-p!sse",
      "sent-la-p1sse",
      "sent-la-pisse",
      "sott!s3ux",
      "sott!seux",
      "sott1s3ux",
      "sott1seux",
      "sottis3ux",
      "sottiseux",
      "sous-m3rd3",
      "sous-merde",
      "st3@r!qu3",
      "st3@r1qu3",
      "st3@riqu3",
      "st3ar!qu3",
      "st3ar1qu3",
      "st3ariqu3",
      "ste@r!qu3",
      "sté@r!qu3",
      "ste@r!que",
      "sté@r!que",
      "ste@r1qu3",
      "sté@r1qu3",
      "ste@r1que",
      "sté@r1que",
      "ste@riqu3",
      "sté@riqu3",
      "ste@rique",
      "sté@rique",
      "stear!qu3",
      "stéar!qu3",
      "stear!que",
      "stéar!que",
      "stear1qu3",
      "stéar1qu3",
      "stear1que",
      "stéar1que",
      "steariqu3",
      "stéariqu3",
      "stearique",
      "stéarique",
      "t@f!0l3",
      "t@f!0le",
      "t@f!ol3",
      "t@f!ole",
      "t@f10l3",
      "t@f10le",
      "t@f1ol3",
      "t@f1ole",
      "t@fi0l3",
      "t@fi0le",
      "t@fiol3",
      "t@fiole",
      "t@nt0u53r!3",
      "t@nt0u53r13",
      "t@nt0u53ri3",
      "t@nt0u5er!e",
      "t@nt0u5er1e",
      "t@nt0u5erie",
      "t@nt0us3r!3",
      "t@nt0us3r13",
      "t@nt0us3ri3",
      "t@nt0user!e",
      "t@nt0user1e",
      "t@nt0userie",
      "t@nt0uz3",
      "t@nt0uze",
      "t@ntou53r!3",
      "t@ntou53r13",
      "t@ntou53ri3",
      "t@ntou5er!e",
      "t@ntou5er1e",
      "t@ntou5erie",
      "t@ntous3r!3",
      "t@ntous3r13",
      "t@ntous3ri3",
      "t@ntouser!e",
      "t@ntouser1e",
      "t@ntouserie",
      "t@ntouz3",
      "t@ntouze",
      "t@p3tt3",
      "t@pette",
      "t@rl0uz3",
      "t@rl0uze",
      "t@rlouz3",
      "t@rlouze",
      "t0c@rd",
      "t0card",
      "t3b3",
      "t3be",
      "t3bé",
      "t3t3ux",
      "t3ub3",
      "t3ube",
      "t3ubé",
      "taf!0l3",
      "taf!0le",
      "taf!ol3",
      "taf!ole",
      "taf10l3",
      "taf10le",
      "taf1ol3",
      "taf1ole",
      "tafi0l3",
      "tafi0le",
      "tafiol3",
      "tafiole",
      "tant0u53r!3",
      "tant0u53r13",
      "tant0u53ri3",
      "tant0u5er!e",
      "tant0u5er1e",
      "tant0u5erie",
      "tant0us3r!3",
      "tant0us3r13",
      "tant0us3ri3",
      "tant0user!e",
      "tant0user1e",
      "tant0userie",
      "tant0uz3",
      "tant0uze",
      "tantou53r!3",
      "tantou53r13",
      "tantou53ri3",
      "tantou5er!e",
      "tantou5er1e",
      "tantou5erie",
      "tantous3r!3",
      "tantous3r13",
      "tantous3ri3",
      "tantouser!e",
      "tantouser1e",
      "tantouserie",
      "tantouz3",
      "tantouze",
      "tap3tt3",
      "tapette",
      "tarl0uz3",
      "tarl0uze",
      "tarlouz3",
      "tarlouze",
      "tebe",
      "tebé",
      "tet3ux",
      "tét3ux",
      "teteux",
      "téteux",
      "teube",
      "teubé",
      "toc@rd",
      "tocard",
      "tr@!n33",
      "tr@!nee",
      "tr@1n33",
      "tr@1nee",
      "tr@in33",
      "tr@în33",
      "tr@îne3",
      "tr@îné3",
      "tr@inee",
      "tr@înee",
      "tr@înée",
      "tr0uduc",
      "tra!n33",
      "tra!nee",
      "tra1n33",
      "tra1nee",
      "train33",
      "traîn33",
      "traîne3",
      "traîné3",
      "trainee",
      "traînee",
      "traînée",
      "trouduc",
      "tru!@553",
      "tru!@55e",
      "tru!@ss3",
      "tru!@sse",
      "tru!a553",
      "tru!a55e",
      "tru!ass3",
      "tru!asse",
      "tru1@553",
      "tru1@55e",
      "tru1@ss3",
      "tru1@sse",
      "tru1a553",
      "tru1a55e",
      "tru1ass3",
      "tru1asse",
      "trui@553",
      "trui@55e",
      "trui@ss3",
      "trui@sse",
      "truia553",
      "truia55e",
      "truiass3",
      "truiasse",
      "v!3d@53",
      "v!3d@s3",
      "v!3da53",
      "v!3das3",
      "v!3r",
      "v!d3-c0u!ll35",
      "v!d3-c0u!ll3s",
      "v!d3-cou!ll35",
      "v!d3-cou!ll3s",
      "v!de-c0u!lle5",
      "v!de-c0u!lles",
      "v!de-cou!lle5",
      "v!de-cou!lles",
      "v!éd@53",
      "v!ed@5e",
      "v!éd@5e",
      "v!ed@s3",
      "v!éd@s3",
      "v!ed@se",
      "v!éd@se",
      "v!eda53",
      "v!éda53",
      "v!eda5e",
      "v!éda5e",
      "v!edas3",
      "v!édas3",
      "v!edase",
      "v!édase",
      "v!er",
      "v@ur!3n",
      "v@ur!en",
      "v@ur13n",
      "v@ur1en",
      "v@uri3n",
      "v@urien",
      "v13d@53",
      "v13d@s3",
      "v13da53",
      "v13das3",
      "v13r",
      "v1d3-c0u1ll35",
      "v1d3-c0u1ll3s",
      "v1d3-cou1ll35",
      "v1d3-cou1ll3s",
      "v1de-c0u1lle5",
      "v1de-c0u1lles",
      "v1de-cou1lle5",
      "v1de-cou1lles",
      "v1ed@53",
      "v1éd@53",
      "v1ed@5e",
      "v1éd@5e",
      "v1ed@s3",
      "v1éd@s3",
      "v1ed@se",
      "v1éd@se",
      "v1eda53",
      "v1éda53",
      "v1eda5e",
      "v1éda5e",
      "v1edas3",
      "v1édas3",
      "v1edase",
      "v1édase",
      "v1er",
      "vaur!3n",
      "vaur!en",
      "vaur13n",
      "vaur1en",
      "vauri3n",
      "vaurien",
      "vi3d@53",
      "vi3d@s3",
      "vi3da53",
      "vi3das3",
      "vi3r",
      "vid3-c0uill35",
      "vid3-c0uill3s",
      "vid3-couill35",
      "vid3-couill3s",
      "vide-c0uille5",
      "vide-c0uilles",
      "vide-couille5",
      "vide-couilles",
      "vied@53",
      "viéd@53",
      "vied@5e",
      "viéd@5e",
      "vied@s3",
      "viéd@s3",
      "vied@se",
      "viéd@se",
      "vieda53",
      "viéda53",
      "vieda5e",
      "viéda5e",
      "viedas3",
      "viédas3",
      "viedase",
      "viédase",
      "vier",
      "x3r0p!n3ur",
      "x3r0p1n3ur",
      "x3r0pin3ur",
      "x3rop!n3ur",
      "x3rop1n3ur",
      "x3ropin3ur",
      "xer0p!n3ur",
      "xér0p!n3ur",
      "xer0p!neur",
      "xér0p!neur",
      "xer0p1n3ur",
      "xér0p1n3ur",
      "xer0p1neur",
      "xér0p1neur",
      "xer0pin3ur",
      "xér0pin3ur",
      "xer0pineur",
      "xér0pineur",
      "xerop!n3ur",
      "xérop!n3ur",
      "xerop!neur",
      "xérop!neur",
      "xerop1n3ur",
      "xérop1n3ur",
      "xerop1neur",
      "xérop1neur",
      "xeropin3ur",
      "xéropin3ur",
      "xeropineur",
      "xéropineur",
      "y0ud",
      "y0up!n",
      "y0up!n!5@t!0n",
      "y0up!n!5at!0n",
      "y0up!n!s@t!0n",
      "y0up!n!sat!0n",
      "y0up!n3",
      "y0up!ne",
      "y0up1n",
      "y0up1n15@t10n",
      "y0up1n15at10n",
      "y0up1n1s@t10n",
      "y0up1n1sat10n",
      "y0up1n3",
      "y0up1ne",
      "y0upin",
      "y0upin3",
      "y0upine",
      "y0upini5@ti0n",
      "y0upini5ati0n",
      "y0upinis@ti0n",
      "y0upinisati0n",
      "y0utr3",
      "y0utre",
      "y3ul3",
      "yeule",
      "youd",
      "youp!n",
      "youp!n!5@t!on",
      "youp!n!5at!on",
      "youp!n!s@t!on",
      "youp!n!sat!on",
      "youp!n3",
      "youp!ne",
      "youp1n",
      "youp1n15@t1on",
      "youp1n15at1on",
      "youp1n1s@t1on",
      "youp1n1sat1on",
      "youp1n3",
      "youp1ne",
      "youpin",
      "youpin3",
      "youpine",
      "youpini5@tion",
      "youpini5ation",
      "youpinis@tion",
      "youpinisation",
      "youtr3",
      "youtre",
      "zgu3gu3",
      "zguegu3",
      "zguègu3",
      "zguegue",
      "zguègue",
    ];
  },
  function (module, exports) {
    module.exports =
      /\b(!mb3c!l3|!mbec!l3|!mbéc!l3|!mbec!le|!mbéc!le|@brut!|@brut1|@bruti|@nd0u!ll3|@nd0u!lle|@nd0u1ll3|@nd0u1lle|@nd0uill3|@nd0uille|@ndou!ll3|@ndou!lle|@ndou1ll3|@ndou1lle|@ndouill3|@ndouille|@v0rt0n|@vorton|1mb3c1l3|1mbec1l3|1mbéc1l3|1mbec1le|1mbéc1le|35p!ng0!n|35p!ngo!n|35p1ng01n|35p1ngo1n|35ping0in|35pingoin|3mm@nch3|3mm@nche|3mm@nché|3mm3rd3r|3mm3rd3u53|3mm3rd3ur|3mm3rd3us3|3mmanch3|3mmanche|3mmanché|3mp@f3|3mp@fe|3mp@fé|3mp@p@0ut3|3mp@p@0ute|3mp@p@0uté|3mp@p@out3|3mp@p@oute|3mp@p@outé|3mpaf3|3mpafe|3mpafé|3mpapa0ut3|3mpapa0ute|3mpapa0uté|3mpapaout3|3mpapaoute|3mpapaouté|3ncul3|3ncul3r|3ncul3ur|3ncule|3nculé|3nf0!r3|3nf0!re|3nf0!ré|3nf01r3|3nf01re|3nf01ré|3nf0ir3|3nf0ire|3nf0iré|3nflur3|3nfo!r3|3nfo!re|3nfo!ré|3nfo1r3|3nfo1re|3nfo1ré|3nfoir3|3nfoire|3nfoiré|3nv@53l!n3ur|3nv@53l1n3ur|3nv@53lin3ur|3nv@s3l!n3ur|3nv@s3l1n3ur|3nv@s3lin3ur|3nva53l!n3ur|3nva53l1n3ur|3nva53lin3ur|3nvas3l!n3ur|3nvas3l1n3ur|3nvas3lin3ur|3p@!5|3p@!s|3p@15|3p@1s|3p@i5|3p@is|3pa!5|3pa!s|3pa15|3pa1s|3pai5|3pais|3sp!ng0!n|3sp!ngo!n|3sp1ng01n|3sp1ngo1n|3sping0in|3spingoin|3tr0n|3tron|5@g0u!n|5@g0u1n|5@g0uin|5@gou!n|5@gou1n|5@gouin|5@l@ud|5@l0p|5@l0p@rd|5@l0p3|5@l0pe|5@l3|5@le|5@lop|5@lop@rd|5@lop3|5@lope|5@tr0u!ll3|5@tr0u!lle|5@tr0u1ll3|5@tr0u1lle|5@tr0uill3|5@tr0uille|5@trou!ll3|5@trou!lle|5@trou1ll3|5@trou1lle|5@trouill3|5@trouille|50tt!53ux|50tt!5eux|50tt153ux|50tt15eux|50tti53ux|50tti5eux|50u5-m3rd3|50u5-merde|53nt-l@-p!553|53nt-l@-p1553|53nt-l@-pi553|53nt-la-p!553|53nt-la-p1553|53nt-la-pi553|5ag0u!n|5ag0u1n|5ag0uin|5agou!n|5agou1n|5agouin|5al0p|5al0p3|5al0pard|5al0pe|5al3|5alaud|5ale|5alop|5alop3|5alopard|5alope|5atr0u!ll3|5atr0u!lle|5atr0u1ll3|5atr0u1lle|5atr0uill3|5atr0uille|5atrou!ll3|5atrou!lle|5atrou1ll3|5atrou1lle|5atrouill3|5atrouille|5chb3b|5chbeb|5chl3u|5chleu|5chn0c|5chn0ck|5chn0qu3|5chn0que|5chnoc|5chnock|5chnoqu3|5chnoque|5ent-l@-p!55e|5ent-l@-p155e|5ent-l@-pi55e|5ent-la-p!55e|5ent-la-p155e|5ent-la-pi55e|5ott!53ux|5ott!5eux|5ott153ux|5ott15eux|5otti53ux|5otti5eux|5ou5-m3rd3|5ou5-merde|5t3@r!qu3|5t3@r1qu3|5t3@riqu3|5t3ar!qu3|5t3ar1qu3|5t3ariqu3|5té@r!qu3|5te@r!que|5té@r!que|5te@r1qu3|5té@r1qu3|5te@r1que|5té@r1que|5te@riqu3|5té@riqu3|5te@rique|5té@rique|5tear!qu3|5téar!qu3|5tear!que|5téar!que|5tear1qu3|5téar1qu3|5tear1que|5téar1que|5teariqu3|5téariqu3|5tearique|5téarique|abrut!|abrut1|abruti|and0u!ll3|and0u!lle|and0u1ll3|and0u1lle|and0uill3|and0uille|andou!ll3|andou!lle|andou1ll3|andou1lle|andouill3|andouille|av0rt0n|avorton|b!@tch|b!atch|b!c0t|b!cot|b!t3|b!t3mb0!5|b!t3mb0!s|b!t3mbo!5|b!t3mbo!s|b!te|b!temb0!5|b!temb0!s|b!tembo!5|b!tembo!s|b@t@rd|b0rd3l|b0rdel|b0uff0n|b0ugn0ul|B0ugn0ul!3|b0ugn0ul!5@t!0n|b0ugn0ul!53r|b0ugn0ul!5at!0n|b0ugn0ul!5er|B0ugn0ul!e|b0ugn0ul!s@t!0n|b0ugn0ul!s3r|b0ugn0ul!sat!0n|b0ugn0ul!ser|B0ugn0ul13|b0ugn0ul15@t10n|b0ugn0ul153r|b0ugn0ul15at10n|b0ugn0ul15er|B0ugn0ul1e|b0ugn0ul1s@t10n|b0ugn0ul1s3r|b0ugn0ul1sat10n|b0ugn0ul1ser|b0ugn0ul3|b0ugn0ule|B0ugn0uli3|b0ugn0uli5@ti0n|b0ugn0uli53r|b0ugn0uli5ati0n|b0ugn0uli5er|B0ugn0ulie|b0ugn0ulis@ti0n|b0ugn0ulis3r|b0ugn0ulisati0n|b0ugn0uliser|b0ugr3|b0ugre|b0uk@k|b0ukak|b0un!0ul|b0un10ul|b0uni0ul|b0urd!ll3|b0urd!lle|b0urd1ll3|b0urd1lle|b0urdill3|b0urdille|b0us3ux|b0useux|b1@tch|b1atch|b1c0t|b1cot|b1t3|b1t3mb015|b1t3mb01s|b1t3mbo15|b1t3mbo1s|b1te|b1temb015|b1temb01s|b1tembo15|b1tembo1s|b3@uf|b3auf|bât@rd|batard|bâtard|be@uf|beauf|bi@tch|biatch|bic0t|bicot|bit3|bit3mb0i5|bit3mb0is|bit3mboi5|bit3mbois|bite|bitemb0i5|bitemb0is|bitemboi5|bitembois|bord3l|bordel|bouffon|bougnoul|Bougnoul!3|bougnoul!5@t!on|bougnoul!53r|bougnoul!5at!on|bougnoul!5er|Bougnoul!e|bougnoul!s@t!on|bougnoul!s3r|bougnoul!sat!on|bougnoul!ser|Bougnoul13|bougnoul15@t1on|bougnoul153r|bougnoul15at1on|bougnoul15er|Bougnoul1e|bougnoul1s@t1on|bougnoul1s3r|bougnoul1sat1on|bougnoul1ser|bougnoul3|bougnoule|Bougnouli3|bougnouli5@tion|bougnouli53r|bougnouli5ation|bougnouli5er|Bougnoulie|bougnoulis@tion|bougnoulis3r|bougnoulisation|bougnouliser|bougr3|bougre|bouk@k|boukak|boun!oul|boun1oul|bounioul|bourd!ll3|bourd!lle|bourd1ll3|bourd1lle|bourdill3|bourdille|bous3ux|bouseux|br!53-burn35|br!5e-burne5|br!s3-burn3s|br!se-burnes|br@nl3r|br@nl3ur|br@nler|br@nleur|br@nqu3|br@nque|br153-burn35|br15e-burne5|br1s3-burn3s|br1se-burnes|branl3r|branl3ur|branler|branleur|branqu3|branque|bri53-burn35|bri5e-burne5|bris3-burn3s|brise-burnes|c@553-b0nb0n|c@553-bonbon|c@553-c0u!ll3|c@553-c0u!ll35|c@553-c0u1ll3|c@553-c0u1ll35|c@553-c0uill3|c@553-c0uill35|c@553-cou!ll3|c@553-cou!ll35|c@553-cou1ll3|c@553-cou1ll35|c@553-couill3|c@553-couill35|c@55e-b0nb0n|c@55e-bonbon|c@55e-c0u!lle|c@55e-c0u!lle5|c@55e-c0u1lle|c@55e-c0u1lle5|c@55e-c0uille|c@55e-c0uille5|c@55e-cou!lle|c@55e-cou!lle5|c@55e-cou1lle|c@55e-cou1lle5|c@55e-couille|c@55e-couille5|c@c0u|c@cou|c@fr3|c@fre|c@ld0ch3|c@ld0che|c@ldoch3|c@ldoche|c@ss3-b0nb0n|c@ss3-bonbon|c@ss3-c0u!ll3|c@ss3-c0u!ll3s|c@ss3-c0u1ll3|c@ss3-c0u1ll3s|c@ss3-c0uill3|c@ss3-c0uill3s|c@ss3-cou!ll3|c@ss3-cou!ll3s|c@ss3-cou1ll3|c@ss3-cou1ll3s|c@ss3-couill3|c@ss3-couill3s|c@sse-b0nb0n|c@sse-bonbon|c@sse-c0u!lle|c@sse-c0u!lles|c@sse-c0u1lle|c@sse-c0u1lles|c@sse-c0uille|c@sse-c0uilles|c@sse-cou!lle|c@sse-cou!lles|c@sse-cou1lle|c@sse-cou1lles|c@sse-couille|c@sse-couilles|c0ch3|c0che|c0n|c0n@553|c0n@55e|c0n@rd|c0n@ss3|c0n@sse|c0n5|c0na553|c0na55e|c0nard|c0nass3|c0nasse|c0nch!3r|c0nch!er|c0nch13r|c0nch1er|c0nchi3r|c0nchier|c0nn@553|c0nn@55e|c0nn@rd|c0nn@rd3|c0nn@rde|c0nn@ss3|c0nn@sse|c0nn3|c0nna553|c0nna55e|c0nnard|c0nnard3|c0nnarde|c0nnass3|c0nnasse|c0nne|c0ns|c0u1ll0n|c0u1ll0nn3r|c0u1ll3|c0u1ll3s|c0uill0n|c0uill0nn3r|c0uill0nner|c0uill3|c0uill3s|c0uille|c0uilles|c0un!fl3|c0un!fle|c0un1fl3|c0un1fle|c0unifl3|c0unifle|c0urt@ud|c0urtaud|ca553-b0nb0n|ca553-bonbon|ca553-c0u!ll3|ca553-c0u!ll35|ca553-c0u1ll3|ca553-c0u1ll35|ca553-c0uill3|ca553-c0uill35|ca553-cou!ll3|ca553-cou!ll35|ca553-cou1ll3|ca553-cou1ll35|ca553-couill3|ca553-couill35|ca55e-b0nb0n|ca55e-bonbon|ca55e-c0u!lle|ca55e-c0u!lle5|ca55e-c0u1lle|ca55e-c0u1lle5|ca55e-c0uille|ca55e-c0uille5|ca55e-cou!lle|ca55e-cou!lle5|ca55e-cou1lle|ca55e-cou1lle5|ca55e-couille|ca55e-couille5|cac0u|cacou|cafr3|cafre|cald0ch3|cald0che|caldoch3|caldoche|cass3-b0nb0n|cass3-bonbon|cass3-c0u!ll3|cass3-c0u!ll3s|cass3-c0u1ll3|cass3-c0u1ll3s|cass3-c0uill3|cass3-c0uill3s|cass3-cou!ll3|cass3-cou!ll3s|cass3-cou1ll3|cass3-cou1ll3s|cass3-couill3|cass3-couill3s|casse-b0nb0n|casse-bonbon|casse-c0u!lle|casse-c0u!lles|casse-c0u1lle|casse-c0u1lles|casse-c0uille|casse-c0uilles|casse-cou!lle|casse-cou!lles|casse-cou1lle|casse-cou1lles|casse-couille|casse-couilles|ch!3nn@553|ch!3nn@ss3|ch!3nna553|ch!3nnass3|ch!3r|ch!enn@55e|ch!enn@sse|ch!enna55e|ch!ennasse|ch!er|ch!n3t0c|ch!n3t0qu3|ch!n3toc|ch!n3toqu3|ch!net0c|ch!net0que|ch!netoc|ch!netoque|ch!nt0k|ch!ntok|ch@ch@r|ch@g@553|ch@g@55e|ch@g@ss3|ch@g@sse|ch@uff@rd|ch13nn@553|ch13nn@ss3|ch13nna553|ch13nnass3|ch13r|ch13ur|ch13urs|ch1enn@55e|ch1enn@sse|ch1enna55e|ch1ennasse|ch1er|ch1eur|ch1eurs|ch1n3t0c|ch1n3t0qu3|ch1n3toc|ch1n3toqu3|ch1net0c|ch1net0que|ch1netoc|ch1netoque|ch1nt0k|ch1ntok|chachar|chaga553|chaga55e|chagass3|chagasse|chauffard|chi3nn@553|chi3nn@ss3|chi3nna553|chi3nnass3|chi3r|chi3ur|chi3urs|chienn@55e|chienn@sse|chienna55e|chiennasse|chier|chieur|chieurs|chin3t0c|chin3t0qu3|chin3toc|chin3toqu3|chinet0c|chinet0que|chinetoc|chinetoque|chint0k|chintok|chl3uh|chleuh|chn0qu3|chn0que|chnoqu3|chnoque|coch3|coche|con|con@553|con@55e|con@rd|con@ss3|con@sse|con5|cona553|cona55e|conard|conass3|conasse|conch!3r|conch!er|conch13r|conch1er|conchi3r|conchier|conn@553|conn@55e|conn@rd|conn@rd3|conn@rde|conn@ss3|conn@sse|conn3|conna553|conna55e|connard|connard3|connarde|connass3|connasse|conne|cons|cou1lle|cou1lles|cou1llon|cou1llonner|couill3|couill3s|couille|couilles|couillon|couillonn3r|couillonner|coun!fl3|coun!fle|coun1fl3|coun1fle|counifl3|counifle|court@ud|courtaud|cr!cr!|cr0tt3|cr0tte|cr0tté|cr0u!ll@t|cr0u!ll3|cr0u!llat|cr0u!lle|cr0u1ll@t|cr0u1ll3|cr0u1llat|cr0u1lle|cr0uill@t|cr0uill3|cr0uillat|cr0uille|cr0ût0n|cr1cr1|cr3t!n|cr3t1n|cr3tin|cr3v@rd|cr3vard|cr3vur3|cret!n|crét!n|cret1n|crét1n|cretin|crétin|crev@rd|crevard|crevure|cricri|crott3|crotte|crotté|crou!ll@t|crou!ll3|crou!llat|crou!lle|crou1ll@t|crou1ll3|crou1llat|crou1lle|crouill@t|crouill3|crouillat|crouille|croûton|cul|d3b!l3|d3b1l3|d3bil3|d3gu3l@ss3|d3gu3lass3|d3m3rd3r|deb!l3|déb!l3|deb!le|déb!le|deb1l3|déb1l3|deb1le|déb1le|debil3|débil3|debile|débile|déguel@sse|deguelasse|déguelasse|demerder|démerder|dr0u!ll3|dr0u!lle|dr0u1ll3|dr0u1lle|dr0uill3|dr0uille|drou!ll3|drou!lle|drou1ll3|drou1lle|drouill3|drouille|du schn0c|du schnoc|du5chn0ck|du5chnock|duc0n|duc0nn0t|ducon|duconnot|dug3n0ux|dug3noux|dugen0ux|dugenoux|dugl@nd|dugland|duschn0ck|duschnock|e5p!ng0!n|e5p!ngo!n|e5p1ng01n|e5p1ngo1n|e5ping0in|e5pingoin|emm@nche|emm@nché|emmanche|emmanché|emmerder|emmerdeu5e|emmerdeur|emmerdeuse|emp@fe|emp@fé|emp@p@0ute|emp@p@0uté|emp@p@oute|emp@p@outé|empafe|empafé|empapa0ute|empapa0uté|empapaoute|empapaouté|encule|enculé|enculer|enculeur|enf0!re|enf0!ré|enf01re|enf01ré|enf0ire|enf0iré|enflure|enfo!re|enfo!ré|enfo1re|enfo1ré|enfoire|enfoiré|env@5el!neur|env@5el1neur|env@5elineur|env@sel!neur|env@sel1neur|env@selineur|enva5el!neur|enva5el1neur|enva5elineur|envasel!neur|envasel1neur|envaselineur|ep@!5|ép@!5|ep@!s|ép@!s|ep@15|ép@15|ep@1s|ép@1s|ep@i5|ép@i5|ep@is|ép@is|epa!5|épa!5|epa!s|épa!s|epa15|épa15|epa1s|épa1s|epai5|épai5|epais|épais|esp!ng0!n|esp!ngo!n|esp1ng01n|esp1ngo1n|esping0in|espingoin|etr0n|étr0n|etron|étron|f!0tt3|f!0tte|f!ott3|f!otte|f0ut3ur|f0uteur|f0utr3|f0utre|f10tt3|f10tte|f1ott3|f1otte|f31gn@ss3|f3ign@ss3|f3ignass3|FDP|fe1gnasse|feign@sse|feignasse|fi0tt3|fi0tte|fiott3|fiotte|fout3ur|fouteur|foutr3|foutre|fr!tz|fr1tz|fritz|fum!3r|fum!er|fum13r|fum1er|fumi3r|fumier|g@rc3|g@rce|g@up3|g@upe|G0d0n|g0g0l|g0ï|g0u!ll@nd|g0u!lland|g0u!n3|g0u!ne|g0u1ll@nd|g0u1lland|g0u1n3|g0u1ne|g0uill@nd|g0uilland|g0uin3|g0uine|g0urd3|g0urde|g0urg@nd!n3|g0urg@nd!ne|g0urg@nd1n3|g0urg@nd1ne|g0urg@ndin3|g0urg@ndine|g0urgand!n3|g0urgand!ne|g0urgand1n3|g0urgand1ne|g0urgandin3|g0urgandine|garc3|garce|gaup3|gaupe|GDM|gl@nd|gl@nd0u!ll0u|gl@nd0u1ll0u|gl@nd0uill0u|gl@nd3u53|gl@nd3ur|gl@nd3us3|gl@ndeu5e|gl@ndeur|gl@ndeuse|gl@ndou!llou|gl@ndou1llou|gl@ndouillou|gl@ndu|gland|gland0u!ll0u|gland0u1ll0u|gland0uill0u|gland3u53|gland3ur|gland3us3|glandeu5e|glandeur|glandeuse|glandou!llou|glandou1llou|glandouillou|glandu|gn0ul|gn0ul3|gn0ule|gnoul|gnoul3|gnoule|Godon|gogol|goï|gou!ll@nd|gou!lland|gou!n3|gou!ne|gou1ll@nd|gou1lland|gou1n3|gou1ne|gouill@nd|gouilland|gouin3|gouine|gourd3|gourde|gourg@nd!n3|gourg@nd!ne|gourg@nd1n3|gourg@nd1ne|gourg@ndin3|gourg@ndine|gourgand!n3|gourgand!ne|gourgand1n3|gourgand1ne|gourgandin3|gourgandine|gr0gn@553|gr0gn@55e|gr0gn@ss3|gr0gn@sse|gr0gna553|gr0gna55e|gr0gnass3|gr0gnasse|grogn@553|grogn@55e|grogn@ss3|grogn@sse|grogna553|grogna55e|grognass3|grognasse|gu!nd0ul3|gu!nd0ule|gu!ndoul3|gu!ndoule|gu1nd0ul3|gu1nd0ule|gu1ndoul3|gu1ndoule|gu3n!ch3|gu3n1ch3|gu3nich3|guen!che|guen1che|gueniche|guind0ul3|guind0ule|guindoul3|guindoule|imb3cil3|imbecil3|imbécil3|imbecile|imbécile|j3@n-f0utr3|j3@n-foutr3|j3an-f0utr3|j3an-foutr3|je@n-f0utre|je@n-foutre|jean-f0utre|jean-foutre|k!k00|k!k0u|k!koo|k!kou|k1k00|k1k0u|k1koo|k1kou|kik00|kik0u|kikoo|kikou|Kr@ut|Kraut|l@ch3ux|l@cheux|l@v3tt3|l@vette|l0p3tt3|l0pette|lach3ux|lâch3ux|lacheux|lâcheux|lav3tt3|lavette|lop3tt3|lopette|m!53r@bl3|m!53rabl3|m!5ér@bl3|m!5er@ble|m!5ér@ble|m!5erabl3|m!5érabl3|m!5erable|m!5érable|m!cht0|m!chto|m!n@bl3|m!n@ble|m!nabl3|m!nable|m!nu5|m!nus|m!s3r@bl3|m!s3rabl3|m!ser@bl3|m!sér@bl3|m!ser@ble|m!sér@ble|m!serabl3|m!sérabl3|m!serable|m!sérable|m@g0t|m@got|m@k0um3|m@k0ume|m@k0umé|m@koum3|m@koume|m@koumé|m@nch3|m@nche|m@ng3-m3rd3|m@nge-merde|m@rch@nd0t|m@rch@ndot|m@rg0u!ll!5t3|m@rg0u!ll!5te|m@rg0u!ll!st3|m@rg0u!ll!ste|m@rg0u1ll15t3|m@rg0u1ll15te|m@rg0u1ll1st3|m@rg0u1ll1ste|m@rg0uilli5t3|m@rg0uilli5te|m@rg0uillist3|m@rg0uilliste|m@rgou!ll!5t3|m@rgou!ll!5te|m@rgou!ll!st3|m@rgou!ll!ste|m@rgou1ll15t3|m@rgou1ll15te|m@rgou1ll1st3|m@rgou1ll1ste|m@rgouilli5t3|m@rgouilli5te|m@rgouillist3|m@rgouilliste|m@uv!3tt3|m@uv!ette|m@uv13tt3|m@uv1ette|m@uvi3tt3|m@uviette|m0!n@!ll3|m0!n@!lle|m0!n5-qu3-r!3n|m0!n5-que-r!en|m0!na!ll3|m0!na!lle|m0!ns-qu3-r!3n|m0!ns-que-r!en|m01n@1ll3|m01n@1lle|m01n5-qu3-r13n|m01n5-que-r1en|m01na1ll3|m01na1lle|m01ns-qu3-r13n|m01ns-que-r1en|m0in@ill3|m0in@ille|m0in5-qu3-ri3n|m0in5-que-rien|m0inaill3|m0inaille|m0ins-qu3-ri3n|m0ins-que-rien|m0n@c@!ll3|m0n@c@!lle|m0n@c@1ll3|m0n@c@1lle|m0n@c@ill3|m0n@c@ille|m0naca!ll3|m0naca!lle|m0naca1ll3|m0naca1lle|m0nacaill3|m0nacaille|m0r!c@ud|m0r!caud|m0r1c@ud|m0r1caud|m0ric@ud|m0ricaud|m153r@bl3|m153rabl3|m15er@bl3|m15ér@bl3|m15er@ble|m15ér@ble|m15erabl3|m15érabl3|m15erable|m15érable|m1cht0|m1chto|m1n@bl3|m1n@ble|m1nabl3|m1nable|m1nu5|m1nus|m1s3r@bl3|m1s3rabl3|m1ser@bl3|m1sér@bl3|m1ser@ble|m1sér@ble|m1serabl3|m1sérabl3|m1serable|m1sérable|m3rd@!ll0n|m3rd@!ll3|m3rd@!llon|m3rd@1ll0n|m3rd@1ll3|m3rd@1llon|m3rd@ill0n|m3rd@ill3|m3rd@illon|m3rd0u!ll@rd|m3rd0u!llard|m3rd0u1ll@rd|m3rd0u1llard|m3rd0uill@rd|m3rd0uillard|m3rd3|m3rd3ux|m3rda!ll0n|m3rda!ll3|m3rda!llon|m3rda1ll0n|m3rda1ll3|m3rda1llon|m3rdaill0n|m3rdaill3|m3rdaillon|m3rdou!ll@rd|m3rdou!llard|m3rdou1ll@rd|m3rdou1llard|m3rdouill@rd|m3rdouillard|mag0t|magot|mak0um3|mak0ume|mak0umé|makoum3|makoume|makoumé|manch3|manche|mang3-m3rd3|mange-merde|marchand0t|marchandot|marg0u!ll!5t3|marg0u!ll!5te|marg0u!ll!st3|marg0u!ll!ste|marg0u1ll15t3|marg0u1ll15te|marg0u1ll1st3|marg0u1ll1ste|marg0uilli5t3|marg0uilli5te|marg0uillist3|marg0uilliste|margou!ll!5t3|margou!ll!5te|margou!ll!st3|margou!ll!ste|margou1ll15t3|margou1ll15te|margou1ll1st3|margou1ll1ste|margouilli5t3|margouilli5te|margouillist3|margouilliste|mauv!3tt3|mauv!ette|mauv13tt3|mauv1ette|mauvi3tt3|mauviette|merd@!ll0n|merd@!lle|merd@!llon|merd@1ll0n|merd@1lle|merd@1llon|merd@ill0n|merd@ille|merd@illon|merd0u!ll@rd|merd0u!llard|merd0u1ll@rd|merd0u1llard|merd0uill@rd|merd0uillard|merda!ll0n|merda!lle|merda!llon|merda1ll0n|merda1lle|merda1llon|merdaill0n|merdaille|merdaillon|merde|merdeux|merdou!ll@rd|merdou!llard|merdou1ll@rd|merdou1llard|merdouill@rd|merdouillard|mi53r@bl3|mi53rabl3|mi5er@bl3|mi5ér@bl3|mi5er@ble|mi5ér@ble|mi5erabl3|mi5érabl3|mi5erable|mi5érable|micht0|michto|min@bl3|min@ble|minabl3|minable|minu5|minus|mis3r@bl3|mis3rabl3|miser@bl3|misér@bl3|miser@ble|misér@ble|miserabl3|misérabl3|miserable|misérable|mo!n@!ll3|mo!n@!lle|mo!n5-qu3-r!3n|mo!n5-que-r!en|mo!na!ll3|mo!na!lle|mo!ns-qu3-r!3n|mo!ns-que-r!en|mo1n@1ll3|mo1n@1lle|mo1n5-qu3-r13n|mo1n5-que-r1en|mo1na1ll3|mo1na1lle|mo1ns-qu3-r13n|mo1ns-que-r1en|moin@ill3|moin@ille|moin5-qu3-ri3n|moin5-que-rien|moinaill3|moinaille|moins-qu3-ri3n|moins-que-rien|mon@c@!ll3|mon@c@!lle|mon@c@1ll3|mon@c@1lle|mon@c@ill3|mon@c@ille|monaca!ll3|monaca!lle|monaca1ll3|monaca1lle|monacaill3|monacaille|mor!c@ud|mor!caud|mor1c@ud|mor1caud|moric@ud|moricaud|n!@!53ux|n!@!5eux|n!@!s3ux|n!@!seux|n!@c|n!@k0u3|n!@k0ue|n!@k0ué|n!@kou3|n!@koue|n!@koué|n!a!53ux|n!a!5eux|n!a!s3ux|n!a!seux|n!ac|n!ak0u3|n!ak0ue|n!ak0ué|n!akou3|n!akoue|n!akoué|n!qu3|n!qu3r|n!que|n!quer|n@s3|n@se|n@z3|n@ze|n1@153ux|n1@15eux|n1@1s3ux|n1@1seux|n1@c|n1@k0u3|n1@k0ue|n1@k0ué|n1@kou3|n1@koue|n1@koué|n1a153ux|n1a15eux|n1a1s3ux|n1a1seux|n1ac|n1ak0u3|n1ak0ue|n1ak0ué|n1akou3|n1akoue|n1akoué|n1qu3|n1qu3r|n1que|n1quer|n3gr0|n3gro|nas3|nase|naz3|naze|negr0|négr0|negro|négro|ni@c|ni@i53ux|ni@i5eux|ni@is3ux|ni@iseux|ni@k0u3|ni@k0ue|ni@k0ué|ni@kou3|ni@koue|ni@koué|niac|niai53ux|niai5eux|niais3ux|niaiseux|niak0u3|niak0ue|niak0ué|niakou3|niakoue|niakoué|niqu3|niqu3r|nique|niquer|NTM|p!550u|p!55ou|p!gn0uf|p!gnouf|p!ss0u|p!ssou|p@k05|p@k0s|p@ko5|p@kos|p@n0ufl3|p@n0ufle|p@noufl3|p@noufle|p@t@r!n|p@t@r1n|p@t@rin|p0rc@5|p0rc@553|p0rc@55e|p0rc@s|p0rc@ss3|p0rc@sse|p0rca5|p0rca553|p0rca55e|p0rcas|p0rcass3|p0rcasse|p0uc@v|p0ucav|p0uf|p0uf!@553|p0uf!@55e|p0uf!@ss3|p0uf!@sse|p0uf!a553|p0uf!a55e|p0uf!ass3|p0uf!asse|p0uf1@553|p0uf1@55e|p0uf1@ss3|p0uf1@sse|p0uf1a553|p0uf1a55e|p0uf1ass3|p0uf1asse|p0uff!@553|p0uff!@55e|p0uff!@ss3|p0uff!@sse|p0uff!a553|p0uff!a55e|p0uff!ass3|p0uff!asse|p0uff1@553|p0uff1@55e|p0uff1@ss3|p0uff1@sse|p0uff1a553|p0uff1a55e|p0uff1ass3|p0uff1asse|p0uffi@553|p0uffi@55e|p0uffi@ss3|p0uffi@sse|p0uffia553|p0uffia55e|p0uffiass3|p0uffiasse|p0ufi@553|p0ufi@55e|p0ufi@ss3|p0ufi@sse|p0ufia553|p0ufia55e|p0ufiass3|p0ufiasse|p0und3|p0unde|p0undé|p0urr!tur3|p0urr!ture|p0urr1tur3|p0urr1ture|p0urritur3|p0urriture|p1550u|p155ou|p1gn0uf|p1gnouf|p1mbêch3|p1mbêche|p1ss0u|p1ss3ux|p1sseux|p1ssou|p3cqu3|p3d@l3|p3d0qu3|p3d3|p3dal3|p3doqu3|p3qu3n@ud|p3qu3naud|p3t|p3t@553|p3t@ss3|p3t3ux|p3ta553|p3tass3|pak05|pak0s|pako5|pakos|pan0ufl3|pan0ufle|panoufl3|panoufle|patar!n|patar1n|patarin|PD|pecque|ped@l3|péd@l3|ped@le|péd@le|ped0qu3|péd0qu3|ped0que|péd0que|pedal3|pédal3|pedale|pédale|pede|pédé|pedoqu3|pédoqu3|pedoque|pédoque|pequ3n@ud|péqu3n@ud|pequ3naud|péqu3naud|pequen@ud|péquen@ud|pequenaud|péquenaud|pet|pét@553|pet@55e|pét@55e|pet@ss3|pét@ss3|pet@sse|pét@sse|peta553|péta553|peta55e|péta55e|petass3|pétass3|petasse|pétasse|peteux|péteux|pi550u|pi55ou|pign0uf|pignouf|pimbêch3|pimbêche|piss0u|piss3ux|pisseux|pissou|pl0uc|pl3utr3|pleutre|plouc|porc@5|porc@553|porc@55e|porc@s|porc@ss3|porc@sse|porca5|porca553|porca55e|porcas|porcass3|porcasse|pouc@v|poucav|pouf|pouf!@553|pouf!@55e|pouf!@ss3|pouf!@sse|pouf!a553|pouf!a55e|pouf!ass3|pouf!asse|pouf1@553|pouf1@55e|pouf1@ss3|pouf1@sse|pouf1a553|pouf1a55e|pouf1ass3|pouf1asse|pouff!@553|pouff!@55e|pouff!@ss3|pouff!@sse|pouff!a553|pouff!a55e|pouff!ass3|pouff!asse|pouff1@553|pouff1@55e|pouff1@ss3|pouff1@sse|pouff1a553|pouff1a55e|pouff1ass3|pouff1asse|pouffi@553|pouffi@55e|pouffi@ss3|pouffi@sse|pouffia553|pouffia55e|pouffiass3|pouffiasse|poufi@553|poufi@55e|poufi@ss3|poufi@sse|poufia553|poufia55e|poufiass3|poufiasse|pound3|pounde|poundé|pourr!tur3|pourr!ture|pourr1tur3|pourr1ture|pourritur3|pourriture|pun@!53|pun@!5e|pun@!s3|pun@!se|pun@153|pun@15e|pun@1s3|pun@1se|pun@i53|pun@i5e|pun@is3|pun@ise|puna!53|puna!5e|puna!s3|puna!se|puna153|puna15e|puna1s3|puna1se|punai53|punai5e|punais3|punaise|put!n|put@!n|put@1n|put@in|put1n|put3|puta!n|puta1n|putain|pute|putin|qu3ut@rd|qu3utard|queut@rd|queutard|r!p0p33|r!p0pe3|r!p0pé3|r!p0pee|r!p0pée|r!pop33|r!pope3|r!popé3|r!popee|r!popée|r@clur3|r@clure|r@t0n|r@ton|r05b!f|r05b1f|r05bif|r0b35p!3rr0t|r0b35p13rr0t|r0b35pi3rr0t|r0b3sp!3rr0t|r0b3sp13rr0t|r0b3spi3rr0t|r0be5p!err0t|r0be5p1err0t|r0be5pierr0t|r0besp!err0t|r0besp1err0t|r0bespierr0t|r0sb!f|r0sb1f|r0sbif|r0ulur3|r0ulure|r1p0p33|r1p0pe3|r1p0pé3|r1p0pee|r1p0pée|r1pop33|r1pope3|r1popé3|r1popee|r1popée|raclur3|raclure|rat0n|raton|rip0p33|rip0pe3|rip0pé3|rip0pee|rip0pée|ripop33|ripope3|ripopé3|ripopee|ripopée|ro5b!f|ro5b1f|ro5bif|rob35p!3rrot|rob35p13rrot|rob35pi3rrot|rob3sp!3rrot|rob3sp13rrot|rob3spi3rrot|robe5p!errot|robe5p1errot|robe5pierrot|robesp!errot|robesp1errot|robespierrot|rosb!f|rosb1f|rosbif|roulur3|roulure|s@g0u!n|s@g0u1n|s@g0uin|s@gou!n|s@gou1n|s@gouin|s@l@ud|s@l0p|s@l0p@rd|s@l0p3|s@l0p3r13|s@l0p3ri3|s@l0pe|s@l3|s@le|s@lop|s@lop@rd|s@lop3|s@lop3ri3|s@lope|s@loperie|s@tr0u!ll3|s@tr0u!lle|s@tr0u1ll3|s@tr0u1lle|s@tr0uill3|s@tr0uille|s@trou!ll3|s@trou!lle|s@trou1ll3|s@trou1lle|s@trouill3|s@trouille|s0tt!s3ux|s0tt!seux|s0tt1s3ux|s0tt1seux|s0ttis3ux|s0ttiseux|s0us-m3rd3|s0us-merde|s3nt-l@-p!ss3|s3nt-l@-p1ss3|s3nt-l@-piss3|s3nt-la-p!ss3|s3nt-la-p1ss3|s3nt-la-piss3|sag0u!n|sag0u1n|sag0uin|sagou!n|sagou1n|sagouin|sal0p|sal0p3|sal0pard|sal0pe|sal0perie|sal3|salaud|sale|salop|salop3|salop3ri3|salopard|salope|saloper1e|saloperie|satr0u!ll3|satr0u!lle|satr0u1ll3|satr0u1lle|satr0uill3|satr0uille|satrou!ll3|satrou!lle|satrou1ll3|satrou1lle|satrouill3|satrouille|schb3b|schbeb|schl3u|schleu|schn0c|schn0ck|schn0qu3|schn0que|schnoc|schnock|schnoqu3|schnoque|sent-l@-p!sse|sent-l@-p1sse|sent-l@-pisse|sent-la-p!sse|sent-la-p1sse|sent-la-pisse|sott!s3ux|sott!seux|sott1s3ux|sott1seux|sottis3ux|sottiseux|sous-m3rd3|sous-merde|st3@r!qu3|st3@r1qu3|st3@riqu3|st3ar!qu3|st3ar1qu3|st3ariqu3|ste@r!qu3|sté@r!qu3|ste@r!que|sté@r!que|ste@r1qu3|sté@r1qu3|ste@r1que|sté@r1que|ste@riqu3|sté@riqu3|ste@rique|sté@rique|stear!qu3|stéar!qu3|stear!que|stéar!que|stear1qu3|stéar1qu3|stear1que|stéar1que|steariqu3|stéariqu3|stearique|stéarique|t@f!0l3|t@f!0le|t@f!ol3|t@f!ole|t@f10l3|t@f10le|t@f1ol3|t@f1ole|t@fi0l3|t@fi0le|t@fiol3|t@fiole|t@nt0u53r!3|t@nt0u53r13|t@nt0u53ri3|t@nt0u5er!e|t@nt0u5er1e|t@nt0u5erie|t@nt0us3r!3|t@nt0us3r13|t@nt0us3ri3|t@nt0user!e|t@nt0user1e|t@nt0userie|t@nt0uz3|t@nt0uze|t@ntou53r!3|t@ntou53r13|t@ntou53ri3|t@ntou5er!e|t@ntou5er1e|t@ntou5erie|t@ntous3r!3|t@ntous3r13|t@ntous3ri3|t@ntouser!e|t@ntouser1e|t@ntouserie|t@ntouz3|t@ntouze|t@p3tt3|t@pette|t@rl0uz3|t@rl0uze|t@rlouz3|t@rlouze|t0c@rd|t0card|t3b3|t3be|t3bé|t3t3ux|t3ub3|t3ube|t3ubé|taf!0l3|taf!0le|taf!ol3|taf!ole|taf10l3|taf10le|taf1ol3|taf1ole|tafi0l3|tafi0le|tafiol3|tafiole|tant0u53r!3|tant0u53r13|tant0u53ri3|tant0u5er!e|tant0u5er1e|tant0u5erie|tant0us3r!3|tant0us3r13|tant0us3ri3|tant0user!e|tant0user1e|tant0userie|tant0uz3|tant0uze|tantou53r!3|tantou53r13|tantou53ri3|tantou5er!e|tantou5er1e|tantou5erie|tantous3r!3|tantous3r13|tantous3ri3|tantouser!e|tantouser1e|tantouserie|tantouz3|tantouze|tap3tt3|tapette|tarl0uz3|tarl0uze|tarlouz3|tarlouze|tebe|tebé|tet3ux|tét3ux|teteux|téteux|teube|teubé|toc@rd|tocard|tr@!n33|tr@!nee|tr@1n33|tr@1nee|tr@in33|tr@în33|tr@îne3|tr@îné3|tr@inee|tr@înee|tr@înée|tr0uduc|tra!n33|tra!nee|tra1n33|tra1nee|train33|traîn33|traîne3|traîné3|trainee|traînee|traînée|trouduc|tru!@553|tru!@55e|tru!@ss3|tru!@sse|tru!a553|tru!a55e|tru!ass3|tru!asse|tru1@553|tru1@55e|tru1@ss3|tru1@sse|tru1a553|tru1a55e|tru1ass3|tru1asse|trui@553|trui@55e|trui@ss3|trui@sse|truia553|truia55e|truiass3|truiasse|v!3d@53|v!3d@s3|v!3da53|v!3das3|v!3r|v!d3-c0u!ll35|v!d3-c0u!ll3s|v!d3-cou!ll35|v!d3-cou!ll3s|v!de-c0u!lle5|v!de-c0u!lles|v!de-cou!lle5|v!de-cou!lles|v!éd@53|v!ed@5e|v!éd@5e|v!ed@s3|v!éd@s3|v!ed@se|v!éd@se|v!eda53|v!éda53|v!eda5e|v!éda5e|v!edas3|v!édas3|v!edase|v!édase|v!er|v@ur!3n|v@ur!en|v@ur13n|v@ur1en|v@uri3n|v@urien|v13d@53|v13d@s3|v13da53|v13das3|v13r|v1d3-c0u1ll35|v1d3-c0u1ll3s|v1d3-cou1ll35|v1d3-cou1ll3s|v1de-c0u1lle5|v1de-c0u1lles|v1de-cou1lle5|v1de-cou1lles|v1ed@53|v1éd@53|v1ed@5e|v1éd@5e|v1ed@s3|v1éd@s3|v1ed@se|v1éd@se|v1eda53|v1éda53|v1eda5e|v1éda5e|v1edas3|v1édas3|v1edase|v1édase|v1er|vaur!3n|vaur!en|vaur13n|vaur1en|vauri3n|vaurien|vi3d@53|vi3d@s3|vi3da53|vi3das3|vi3r|vid3-c0uill35|vid3-c0uill3s|vid3-couill35|vid3-couill3s|vide-c0uille5|vide-c0uilles|vide-couille5|vide-couilles|vied@53|viéd@53|vied@5e|viéd@5e|vied@s3|viéd@s3|vied@se|viéd@se|vieda53|viéda53|vieda5e|viéda5e|viedas3|viédas3|viedase|viédase|vier|x3r0p!n3ur|x3r0p1n3ur|x3r0pin3ur|x3rop!n3ur|x3rop1n3ur|x3ropin3ur|xer0p!n3ur|xér0p!n3ur|xer0p!neur|xér0p!neur|xer0p1n3ur|xér0p1n3ur|xer0p1neur|xér0p1neur|xer0pin3ur|xér0pin3ur|xer0pineur|xér0pineur|xerop!n3ur|xérop!n3ur|xerop!neur|xérop!neur|xerop1n3ur|xérop1n3ur|xerop1neur|xérop1neur|xeropin3ur|xéropin3ur|xeropineur|xéropineur|y0ud|y0up!n|y0up!n!5@t!0n|y0up!n!5at!0n|y0up!n!s@t!0n|y0up!n!sat!0n|y0up!n3|y0up!ne|y0up1n|y0up1n15@t10n|y0up1n15at10n|y0up1n1s@t10n|y0up1n1sat10n|y0up1n3|y0up1ne|y0upin|y0upin3|y0upine|y0upini5@ti0n|y0upini5ati0n|y0upinis@ti0n|y0upinisati0n|y0utr3|y0utre|y3ul3|yeule|youd|youp!n|youp!n!5@t!on|youp!n!5at!on|youp!n!s@t!on|youp!n!sat!on|youp!n3|youp!ne|youp1n|youp1n15@t1on|youp1n15at1on|youp1n1s@t1on|youp1n1sat1on|youp1n3|youp1ne|youpin|youpin3|youpine|youpini5@tion|youpini5ation|youpinis@tion|youpinisation|youtr3|youtre|zgu3gu3|zguegu3|zguègu3|zguegue|zguègue)\b/gi;
  },
  function (module, __webpack_exports__, __webpack_require__) {
    "use strict";
    __webpack_require__.r(__webpack_exports__),
      __webpack_require__.d(__webpack_exports__, "flatWords", function () {
        return flatWords;
      }),
      __webpack_require__.d(__webpack_exports__, "words", function () {
        return words;
      });
    var words = [].concat(
        [
          { type: "non qualifying adverb", adverb: "заебись" },
          { type: "non qualifying adverb", adverb: "нах" },
          { type: "non qualifying adverb", adverb: "нахуй" },
          {
            type: "qualifying adverb",
            adverb: "охуенно",
            comparative: "охуеннее",
            superlative: "охуенней",
          },
          {
            type: "qualifying adverb",
            adverb: "хуёво",
            comparative: "хуёвее",
            superlative: "хуёвейше",
          },
        ],
        [
          { type: "interjection", interjection: "бля" },
          { type: "interjection", interjection: "блять" },
          { type: "interjection", interjection: "ёба" },
          { type: "interjection", interjection: "ёпт" },
        ],
        [
          {
            type: "noun",
            nominativeSingular: "блядь",
            genitiveSingular: "бляди",
            dativeSingular: "бляди",
            accusativeSingular: "блядь",
            instrumentalSingular: "блядью",
            prepositionalSingular: "бляди",
            nominativePlural: "бляди",
            genitivePlural: "блядей",
            dativePlural: "блядям",
            accusativePlural: "блядей",
            instrumentalPlural: "блядями",
            prepositionalPlural: "блядях",
          },
          {
            type: "noun",
            nominativeSingular: "долбоёб",
            genitiveSingular: "долбоёба",
            dativeSingular: "долбоёбу",
            accusativeSingular: "долбоёба",
            instrumentalSingular: "долбоёбом",
            prepositionalSingular: "долбоёбе",
            nominativePlural: "долбоёбы",
            genitivePlural: "долбоёбов",
            dativePlural: "долбоёбам",
            accusativePlural: "долбоёбов",
            instrumentalPlural: "долбоёбами",
            prepositionalPlural: "долбоёбах",
          },
          {
            type: "singular noun",
            nominativeSingular: "заебумба",
            genitiveSingular: "заебумбы",
            dativeSingular: "заебумбе",
            accusativeSingular: "заебумбу",
            instrumentalSingular: "заебумбой",
            prepositionalSingular: "заебумбе",
          },
          {
            type: "singular noun",
            nominativeSingular: "наебалово",
            genitiveSingular: "наебалова",
            dativeSingular: "наебалову",
            accusativeSingular: "наебалово",
            instrumentalSingular: "наебаловом",
            prepositionalSingular: "наебалове",
          },
          {
            type: "noun",
            nominativeSingular: "пизда",
            genitiveSingular: "пизды",
            dativeSingular: "пизде",
            accusativeSingular: "пизду",
            instrumentalSingular: "пиздой",
            prepositionalSingular: "пизде",
            nominativePlural: "пизды",
            genitivePlural: "пизд",
            dativePlural: "пиздам",
            accusativePlural: "пизды",
            instrumentalPlural: "пиздами",
            prepositionalPlural: "пиздах",
          },
          {
            type: "noun",
            nominativeSingular: "пиздец",
            genitiveSingular: "пиздеца",
            dativeSingular: "пиздецу",
            accusativeSingular: "пиздец",
            instrumentalSingular: "пиздецом",
            prepositionalSingular: "пиздеце",
            nominativePlural: "пиздецы",
            genitivePlural: "пиздецов",
            dativePlural: "пиздецам",
            accusativePlural: "пиздецы",
            instrumentalPlural: "пиздецами",
            prepositionalPlural: "пиздецах",
          },
          {
            type: "noun",
            nominativeSingular: "сука",
            genitiveSingular: "суки",
            dativeSingular: "суке",
            accusativeSingular: "суку",
            instrumentalSingular: "сукой",
            prepositionalSingular: "суке",
            nominativePlural: "суки",
            genitivePlural: "сук",
            dativePlural: "сукам",
            accusativePlural: "сук",
            instrumentalPlural: "суками",
            prepositionalPlural: "суках",
          },
          {
            type: "noun",
            nominativeSingular: "хуета",
            genitiveSingular: "хуеты",
            dativeSingular: "хуете",
            accusativeSingular: "хуету",
            instrumentalSingular: "хуетой",
            prepositionalSingular: "хуете",
            nominativePlural: "хуеты",
            genitivePlural: "хует",
            dativePlural: "хуетам",
            accusativePlural: "хуеты",
            instrumentalPlural: "хуетами",
            prepositionalPlural: "хуетах",
          },
          {
            type: "noun",
            nominativeSingular: "хуй",
            genitiveSingular: "хуя",
            dativeSingular: "хую",
            accusativeSingular: "хуй",
            instrumentalSingular: "хуём",
            prepositionalSingular: "хуе",
            nominativePlural: "хуи",
            genitivePlural: "хуёв",
            dativePlural: "хуям",
            accusativePlural: "хуи",
            instrumentalPlural: "хуями",
            prepositionalPlural: "хуях",
          },
          {
            type: "singular noun",
            nominativeSingular: "хуйня",
            genitiveSingular: "хуйни",
            dativeSingular: "хуйне",
            accusativeSingular: "хуйню",
            instrumentalSingular: "хуйнёй",
            prepositionalSingular: "хуйне",
          },
        ],
        [
          {
            type: "imperfective verb",
            infinitive: "ебать",
            indicativePastSingularMasculine: "ебал",
            indicativePastSingularFeminine: "ебала",
            indicativePastSingularNeuter: "ебало",
            indicativePastPlural: "ебали",
            indicativePresentSingularFirstPerson: "ебу",
            indicativePresentSingularSecondPerson: "ебёшь",
            indicativePresentSingularThirdPerson: "ебёт",
            indicativePresentPluralFirstPerson: "ебём",
            indicativePresentPluralSecondPerson: "ебёте",
            indicativePresentPluralThirdPerson: "ебут",
            imperativeSingularSecondPerson: "еби",
            imperativePluralSecondPerson: "ебите",
          },
          {
            type: "imperfective verb",
            infinitive: "ебаться",
            indicativePastSingularMasculine: "ебался",
            indicativePastSingularFeminine: "ебалась",
            indicativePastSingularNeuter: "ебалось",
            indicativePastPlural: "ебались",
            indicativePresentSingularFirstPerson: "ебусь",
            indicativePresentSingularSecondPerson: "ебёшься",
            indicativePresentSingularThirdPerson: "ебётся",
            indicativePresentPluralFirstPerson: "ебёмся",
            indicativePresentPluralSecondPerson: "ебётесь",
            indicativePresentPluralThirdPerson: "ебутся",
            imperativeSingularSecondPerson: "ебись",
            imperativePluralSecondPerson: "ебитесь",
          },
          {
            type: "imperfective verb",
            infinitive: "ебашить",
            imperativePluralSecondPerson: "ебашьте",
            imperativeSingularSecondPerson: "ебашь",
            indicativePastPlural: "ебашили",
            indicativePastSingularFeminine: "ебашила",
            indicativePastSingularMasculine: "ебашил",
            indicativePastSingularNeuter: "ебашило",
            indicativePresentPluralFirstPerson: "ебашим",
            indicativePresentPluralSecondPerson: "ебашите",
            indicativePresentPluralThirdPerson: "ебашат",
            indicativePresentSingularFirstPerson: "ебашу",
            indicativePresentSingularSecondPerson: "ебашишь",
            indicativePresentSingularThirdPerson: "ебашит",
          },
          {
            type: "perfective verb",
            infinitive: "ёбнуть",
            imperativePluralSecondPerson: "ёбните",
            imperativeSingularSecondPerson: "ёбни",
            indicativeFuturePluralFirstPerson: "ёбнем",
            indicativeFuturePluralSecondPerson: "ёбнете",
            indicativeFuturePluralThirdPerson: "ёбнут",
            indicativeFutureSingularFirstPerson: "ёбну",
            indicativeFutureSingularSecondPerson: "ёбнешь",
            indicativeFutureSingularThirdPerson: "ёбнет",
            indicativePastPlural: "ёбнули",
            indicativePastSingularFeminine: "ёбнула",
            indicativePastSingularMasculine: "ёбнул",
            indicativePastSingularNeuter: "ёбнуло",
          },
          {
            type: "perfective verb",
            infinitive: "заебать",
            imperativePluralSecondPerson: "заебите",
            imperativeSingularSecondPerson: "заеби",
            indicativeFuturePluralFirstPerson: "заебём",
            indicativeFuturePluralSecondPerson: "заебёте",
            indicativeFuturePluralThirdPerson: "заебут",
            indicativeFutureSingularFirstPerson: "заебу",
            indicativeFutureSingularSecondPerson: "заебёшь",
            indicativeFutureSingularThirdPerson: "заебёт",
            indicativePastPlural: "заебали",
            indicativePastSingularFeminine: "заебала",
            indicativePastSingularMasculine: "заебал",
            indicativePastSingularNeuter: "заебало",
          },
          {
            type: "imperfective verb",
            infinitive: "пиздеть",
            imperativePluralSecondPerson: "пиздите",
            imperativeSingularSecondPerson: "пизди",
            indicativePastPlural: "пиздели",
            indicativePastSingularFeminine: "пиздела",
            indicativePastSingularMasculine: "пиздел",
            indicativePastSingularNeuter: "пиздело",
            indicativePresentPluralFirstPerson: "пиздим",
            indicativePresentPluralSecondPerson: "пиздите",
            indicativePresentPluralThirdPerson: "пиздят",
            indicativePresentSingularFirstPerson: "пизжу",
            indicativePresentSingularSecondPerson: "пиздишь",
            indicativePresentSingularThirdPerson: "пиздит",
          },
          {
            type: "perfective verb",
            infinitive: "проебать",
            imperativePluralSecondPerson: "проебите",
            imperativeSingularSecondPerson: "проеби",
            indicativeFuturePluralFirstPerson: "проебём",
            indicativeFuturePluralSecondPerson: "проебёте",
            indicativeFuturePluralThirdPerson: "проебут",
            indicativeFutureSingularFirstPerson: "проебу",
            indicativeFutureSingularSecondPerson: "проебёшь",
            indicativeFutureSingularThirdPerson: "проебёт",
            indicativePastPlural: "проебали",
            indicativePastSingularFeminine: "проебала",
            indicativePastSingularMasculine: "проебал",
            indicativePastSingularNeuter: "проебало",
          },
          {
            type: "perfective verb",
            infinitive: "спиздить",
            imperativePluralSecondPerson: "спиздите",
            imperativeSingularSecondPerson: "спизди",
            indicativeFuturePluralFirstPerson: "спиздим",
            indicativeFuturePluralSecondPerson: "спиздите",
            indicativeFuturePluralThirdPerson: "спиздят",
            indicativeFutureSingularFirstPerson: "спизжу",
            indicativeFutureSingularSecondPerson: "спиздишь",
            indicativeFutureSingularThirdPerson: "спиздит",
            indicativePastPlural: "спиздили",
            indicativePastSingularFeminine: "спиздила",
            indicativePastSingularMasculine: "спиздил",
            indicativePastSingularNeuter: "спиздило",
          },
        ],
        [{ type: "predicative", predicative: "похуй" }]
      ),
      flatWords = (function (words) {
        return words.reduce(function (result, word) {
          return (
            Object.values(word).forEach(function (wordForm) {
              return result.push(wordForm);
            }),
            result
          );
        }, []);
      })(words);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(149), exports),
      __exportStar(__webpack_require__(151), exports),
      __exportStar(__webpack_require__(220), exports),
      __exportStar(__webpack_require__(222), exports),
      __exportStar(__webpack_require__(223), exports),
      __exportStar(__webpack_require__(232), exports),
      __exportStar(__webpack_require__(237), exports),
      __exportStar(__webpack_require__(238), exports),
      __exportStar(__webpack_require__(239), exports),
      __exportStar(__webpack_require__(100), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(3), exports),
      __exportStar(__webpack_require__(56), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var construct = "undefined" != typeof Reflect ? Reflect.construct : void 0,
      defineProperty = Object.defineProperty,
      captureStackTrace = Error.captureStackTrace;
    function BaseError(message) {
      void 0 !== message &&
        defineProperty(this, "message", {
          configurable: !0,
          value: message,
          writable: !0,
        });
      var cname = this.constructor.name;
      void 0 !== cname &&
        cname !== this.name &&
        defineProperty(this, "name", {
          configurable: !0,
          value: cname,
          writable: !0,
        }),
        captureStackTrace(this, this.constructor);
    }
    void 0 === captureStackTrace &&
      (captureStackTrace = function (error) {
        var container = new Error();
        defineProperty(error, "stack", {
          configurable: !0,
          get: function () {
            var stack = container.stack;
            return (
              defineProperty(this, "stack", {
                configurable: !0,
                value: stack,
                writable: !0,
              }),
              stack
            );
          },
          set: function (stack) {
            defineProperty(error, "stack", {
              configurable: !0,
              value: stack,
              writable: !0,
            });
          },
        });
      }),
      (BaseError.prototype = Object.create(Error.prototype, {
        constructor: { configurable: !0, value: BaseError, writable: !0 },
      }));
    var setFunctionName = (function () {
      function setFunctionName(fn, name) {
        return defineProperty(fn, "name", { configurable: !0, value: name });
      }
      try {
        var f = function () {};
        if ((setFunctionName(f, "foo"), "foo" === f.name))
          return setFunctionName;
      } catch (_) {}
    })();
    (module.exports = function (constructor, super_) {
      if (null == super_ || super_ === Error) super_ = BaseError;
      else if ("function" != typeof super_)
        throw new TypeError("super_ should be a function");
      var name;
      if ("string" == typeof constructor)
        (name = constructor),
          (constructor =
            void 0 !== construct
              ? function () {
                  return construct(super_, arguments, this.constructor);
                }
              : function () {
                  super_.apply(this, arguments);
                }),
          void 0 !== setFunctionName &&
            (setFunctionName(constructor, name), (name = void 0));
      else if ("function" != typeof constructor)
        throw new TypeError(
          "constructor should be either a string or a function"
        );
      constructor.super_ = constructor.super = super_;
      var properties = {
        constructor: { configurable: !0, value: constructor, writable: !0 },
      };
      return (
        void 0 !== name &&
          (properties.name = { configurable: !0, value: name, writable: !0 }),
        (constructor.prototype = Object.create(super_.prototype, properties)),
        constructor
      );
    }).BaseError = BaseError;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(152), exports),
      __exportStar(__webpack_require__(36), exports),
      __exportStar(__webpack_require__(190), exports),
      __exportStar(__webpack_require__(111), exports),
      __exportStar(__webpack_require__(1), exports),
      __exportStar(__webpack_require__(83), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(57), exports),
      __exportStar(__webpack_require__(58), exports),
      __exportStar(__webpack_require__(59), exports),
      __exportStar(__webpack_require__(189), exports),
      __exportStar(__webpack_require__(60), exports);
  },
  function (module, exports, __webpack_require__) {
    var stream = __webpack_require__(154),
      eos = __webpack_require__(162),
      inherits = __webpack_require__(2),
      shift = __webpack_require__(165),
      SIGNAL_FLUSH =
        Buffer.from && Buffer.from !== Uint8Array.from
          ? Buffer.from([0])
          : new Buffer([0]),
      onuncork = function (self, fn) {
        self._corked ? self.once("uncork", fn) : fn();
      },
      destroyer = function (self, end) {
        return function (err) {
          err
            ? (function (self, err) {
                self._autoDestroy && self.destroy(err);
              })(self, "premature close" === err.message ? null : err)
            : end && !self._ended && self.end();
        };
      },
      noop = function () {},
      Duplexify = function (writable, readable, opts) {
        if (!(this instanceof Duplexify))
          return new Duplexify(writable, readable, opts);
        stream.Duplex.call(this, opts),
          (this._writable = null),
          (this._readable = null),
          (this._readable2 = null),
          (this._autoDestroy = !opts || !1 !== opts.autoDestroy),
          (this._forwardDestroy = !opts || !1 !== opts.destroy),
          (this._forwardEnd = !opts || !1 !== opts.end),
          (this._corked = 1),
          (this._ondrain = null),
          (this._drained = !1),
          (this._forwarding = !1),
          (this._unwrite = null),
          (this._unread = null),
          (this._ended = !1),
          (this.destroyed = !1),
          writable && this.setWritable(writable),
          readable && this.setReadable(readable);
      };
    inherits(Duplexify, stream.Duplex),
      (Duplexify.obj = function (writable, readable, opts) {
        return (
          opts || (opts = {}),
          (opts.objectMode = !0),
          (opts.highWaterMark = 16),
          new Duplexify(writable, readable, opts)
        );
      }),
      (Duplexify.prototype.cork = function () {
        1 == ++this._corked && this.emit("cork");
      }),
      (Duplexify.prototype.uncork = function () {
        this._corked && 0 == --this._corked && this.emit("uncork");
      }),
      (Duplexify.prototype.setWritable = function (writable) {
        if ((this._unwrite && this._unwrite(), this.destroyed))
          writable && writable.destroy && writable.destroy();
        else if (null !== writable && !1 !== writable) {
          var self = this,
            unend = eos(
              writable,
              { writable: !0, readable: !1 },
              destroyer(this, this._forwardEnd)
            ),
            ondrain = function () {
              var ondrain = self._ondrain;
              (self._ondrain = null), ondrain && ondrain();
            };
          this._unwrite && process.nextTick(ondrain),
            (this._writable = writable),
            this._writable.on("drain", ondrain),
            (this._unwrite = function () {
              self._writable.removeListener("drain", ondrain), unend();
            }),
            this.uncork();
        } else this.end();
      }),
      (Duplexify.prototype.setReadable = function (readable) {
        if ((this._unread && this._unread(), this.destroyed))
          readable && readable.destroy && readable.destroy();
        else {
          if (null === readable || !1 === readable)
            return this.push(null), void this.resume();
          var rs,
            self = this,
            unend = eos(
              readable,
              { writable: !1, readable: !0 },
              destroyer(this)
            ),
            onreadable = function () {
              self._forward();
            },
            onend = function () {
              self.push(null);
            };
          (this._drained = !0),
            (this._readable = readable),
            (this._readable2 = readable._readableState
              ? readable
              : ((rs = readable),
                new stream.Readable({ objectMode: !0, highWaterMark: 16 }).wrap(
                  rs
                ))),
            this._readable2.on("readable", onreadable),
            this._readable2.on("end", onend),
            (this._unread = function () {
              self._readable2.removeListener("readable", onreadable),
                self._readable2.removeListener("end", onend),
                unend();
            }),
            this._forward();
        }
      }),
      (Duplexify.prototype._read = function () {
        (this._drained = !0), this._forward();
      }),
      (Duplexify.prototype._forward = function () {
        if (!this._forwarding && this._readable2 && this._drained) {
          var data;
          for (
            this._forwarding = !0;
            this._drained && null !== (data = shift(this._readable2));

          )
            this.destroyed || (this._drained = this.push(data));
          this._forwarding = !1;
        }
      }),
      (Duplexify.prototype.destroy = function (err, cb) {
        if ((cb || (cb = noop), this.destroyed)) return cb(null);
        this.destroyed = !0;
        var self = this;
        process.nextTick(function () {
          self._destroy(err), cb(null);
        });
      }),
      (Duplexify.prototype._destroy = function (err) {
        if (err) {
          var ondrain = this._ondrain;
          (this._ondrain = null),
            ondrain ? ondrain(err) : this.emit("error", err);
        }
        this._forwardDestroy &&
          (this._readable && this._readable.destroy && this._readable.destroy(),
          this._writable && this._writable.destroy && this._writable.destroy()),
          this.emit("close");
      }),
      (Duplexify.prototype._write = function (data, enc, cb) {
        if (!this.destroyed)
          return this._corked
            ? onuncork(this, this._write.bind(this, data, enc, cb))
            : data === SIGNAL_FLUSH
            ? this._finish(cb)
            : this._writable
            ? void (!1 === this._writable.write(data)
                ? (this._ondrain = cb)
                : this.destroyed || cb())
            : cb();
      }),
      (Duplexify.prototype._finish = function (cb) {
        var self = this;
        this.emit("preend"),
          onuncork(this, function () {
            var ws, fn;
            (ws = self._forwardEnd && self._writable),
              (fn = function () {
                !1 === self._writableState.prefinished &&
                  (self._writableState.prefinished = !0),
                  self.emit("prefinish"),
                  onuncork(self, cb);
              }),
              ws
                ? ws._writableState && ws._writableState.finished
                  ? fn()
                  : ws._writableState
                  ? ws.end(fn)
                  : (ws.end(), fn())
                : fn();
          });
      }),
      (Duplexify.prototype.end = function (data, enc, cb) {
        return "function" == typeof data
          ? this.end(null, null, data)
          : "function" == typeof enc
          ? this.end(data, null, enc)
          : ((this._ended = !0),
            data && this.write(data),
            this._writableState.ending ||
              this._writableState.destroyed ||
              this.write(SIGNAL_FLUSH),
            stream.Writable.prototype.end.call(this, cb));
      }),
      (module.exports = Duplexify);
  },
  function (module, exports, __webpack_require__) {
    var Stream = __webpack_require__(6);
    "disable" === process.env.READABLE_STREAM && Stream
      ? ((module.exports = Stream.Readable),
        Object.assign(module.exports, Stream),
        (module.exports.Stream = Stream))
      : (((exports = module.exports = __webpack_require__(61)).Stream =
          Stream || exports),
        (exports.Readable = exports),
        (exports.Writable = __webpack_require__(65)),
        (exports.Duplex = __webpack_require__(15)),
        (exports.Transform = __webpack_require__(66)),
        (exports.PassThrough = __webpack_require__(160)),
        (exports.finished = __webpack_require__(33)),
        (exports.pipeline = __webpack_require__(161)));
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly &&
          (symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          })),
          keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        (descriptor.enumerable = descriptor.enumerable || !1),
          (descriptor.configurable = !0),
          "value" in descriptor && (descriptor.writable = !0),
          Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    var Buffer = __webpack_require__(7).Buffer,
      inspect = __webpack_require__(4).inspect,
      custom = (inspect && inspect.custom) || "inspect";
    module.exports = (function () {
      function BufferList() {
        !(function (instance, Constructor) {
          if (!(instance instanceof Constructor))
            throw new TypeError("Cannot call a class as a function");
        })(this, BufferList),
          (this.head = null),
          (this.tail = null),
          (this.length = 0);
      }
      var Constructor, protoProps, staticProps;
      return (
        (Constructor = BufferList),
        (protoProps = [
          {
            key: "push",
            value: function (v) {
              var entry = { data: v, next: null };
              this.length > 0 ? (this.tail.next = entry) : (this.head = entry),
                (this.tail = entry),
                ++this.length;
            },
          },
          {
            key: "unshift",
            value: function (v) {
              var entry = { data: v, next: this.head };
              0 === this.length && (this.tail = entry),
                (this.head = entry),
                ++this.length;
            },
          },
          {
            key: "shift",
            value: function () {
              if (0 !== this.length) {
                var ret = this.head.data;
                return (
                  1 === this.length
                    ? (this.head = this.tail = null)
                    : (this.head = this.head.next),
                  --this.length,
                  ret
                );
              }
            },
          },
          {
            key: "clear",
            value: function () {
              (this.head = this.tail = null), (this.length = 0);
            },
          },
          {
            key: "join",
            value: function (s) {
              if (0 === this.length) return "";
              for (var p = this.head, ret = "" + p.data; (p = p.next); )
                ret += s + p.data;
              return ret;
            },
          },
          {
            key: "concat",
            value: function (n) {
              if (0 === this.length) return Buffer.alloc(0);
              for (
                var src,
                  target,
                  offset,
                  ret = Buffer.allocUnsafe(n >>> 0),
                  p = this.head,
                  i = 0;
                p;

              )
                (src = p.data),
                  (target = ret),
                  (offset = i),
                  Buffer.prototype.copy.call(src, target, offset),
                  (i += p.data.length),
                  (p = p.next);
              return ret;
            },
          },
          {
            key: "consume",
            value: function (n, hasStrings) {
              var ret;
              return (
                n < this.head.data.length
                  ? ((ret = this.head.data.slice(0, n)),
                    (this.head.data = this.head.data.slice(n)))
                  : (ret =
                      n === this.head.data.length
                        ? this.shift()
                        : hasStrings
                        ? this._getString(n)
                        : this._getBuffer(n)),
                ret
              );
            },
          },
          {
            key: "first",
            value: function () {
              return this.head.data;
            },
          },
          {
            key: "_getString",
            value: function (n) {
              var p = this.head,
                c = 1,
                ret = p.data;
              for (n -= ret.length; (p = p.next); ) {
                var str = p.data,
                  nb = n > str.length ? str.length : n;
                if (
                  (nb === str.length ? (ret += str) : (ret += str.slice(0, n)),
                  0 == (n -= nb))
                ) {
                  nb === str.length
                    ? (++c,
                      p.next
                        ? (this.head = p.next)
                        : (this.head = this.tail = null))
                    : ((this.head = p), (p.data = str.slice(nb)));
                  break;
                }
                ++c;
              }
              return (this.length -= c), ret;
            },
          },
          {
            key: "_getBuffer",
            value: function (n) {
              var ret = Buffer.allocUnsafe(n),
                p = this.head,
                c = 1;
              for (p.data.copy(ret), n -= p.data.length; (p = p.next); ) {
                var buf = p.data,
                  nb = n > buf.length ? buf.length : n;
                if ((buf.copy(ret, ret.length - n, 0, nb), 0 == (n -= nb))) {
                  nb === buf.length
                    ? (++c,
                      p.next
                        ? (this.head = p.next)
                        : (this.head = this.tail = null))
                    : ((this.head = p), (p.data = buf.slice(nb)));
                  break;
                }
                ++c;
              }
              return (this.length -= c), ret;
            },
          },
          {
            key: custom,
            value: function (_, options) {
              return inspect(
                this,
                (function (target) {
                  for (var i = 1; i < arguments.length; i++) {
                    var source = null != arguments[i] ? arguments[i] : {};
                    i % 2
                      ? ownKeys(Object(source), !0).forEach(function (key) {
                          _defineProperty(target, key, source[key]);
                        })
                      : Object.getOwnPropertyDescriptors
                      ? Object.defineProperties(
                          target,
                          Object.getOwnPropertyDescriptors(source)
                        )
                      : ownKeys(Object(source)).forEach(function (key) {
                          Object.defineProperty(
                            target,
                            key,
                            Object.getOwnPropertyDescriptor(source, key)
                          );
                        });
                  }
                  return target;
                })({}, options, { depth: 0, customInspect: !1 })
              );
            },
          },
        ]) && _defineProperties(Constructor.prototype, protoProps),
        staticProps && _defineProperties(Constructor, staticProps),
        BufferList
      );
    })();
  },
  function (module, exports) {
    "function" == typeof Object.create
      ? (module.exports = function (ctor, superCtor) {
          superCtor &&
            ((ctor.super_ = superCtor),
            (ctor.prototype = Object.create(superCtor.prototype, {
              constructor: {
                value: ctor,
                enumerable: !1,
                writable: !0,
                configurable: !0,
              },
            })));
        })
      : (module.exports = function (ctor, superCtor) {
          if (superCtor) {
            ctor.super_ = superCtor;
            var TempCtor = function () {};
            (TempCtor.prototype = superCtor.prototype),
              (ctor.prototype = new TempCtor()),
              (ctor.prototype.constructor = ctor);
          }
        });
  },
  function (module, exports, __webpack_require__) {
    var buffer = __webpack_require__(7),
      Buffer = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) dst[key] = src[key];
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length);
    }
    Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow
      ? (module.exports = buffer)
      : (copyProps(buffer, exports), (exports.Buffer = SafeBuffer)),
      copyProps(Buffer, SafeBuffer),
      (SafeBuffer.from = function (arg, encodingOrOffset, length) {
        if ("number" == typeof arg)
          throw new TypeError("Argument must not be a number");
        return Buffer(arg, encodingOrOffset, length);
      }),
      (SafeBuffer.alloc = function (size, fill, encoding) {
        if ("number" != typeof size)
          throw new TypeError("Argument must be a number");
        var buf = Buffer(size);
        return (
          void 0 !== fill
            ? "string" == typeof encoding
              ? buf.fill(fill, encoding)
              : buf.fill(fill)
            : buf.fill(0),
          buf
        );
      }),
      (SafeBuffer.allocUnsafe = function (size) {
        if ("number" != typeof size)
          throw new TypeError("Argument must be a number");
        return Buffer(size);
      }),
      (SafeBuffer.allocUnsafeSlow = function (size) {
        if ("number" != typeof size)
          throw new TypeError("Argument must be a number");
        return buffer.SlowBuffer(size);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var _Object$setPrototypeO;
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    var finished = __webpack_require__(33),
      kLastResolve = Symbol("lastResolve"),
      kLastReject = Symbol("lastReject"),
      kError = Symbol("error"),
      kEnded = Symbol("ended"),
      kLastPromise = Symbol("lastPromise"),
      kHandlePromise = Symbol("handlePromise"),
      kStream = Symbol("stream");
    function createIterResult(value, done) {
      return { value: value, done: done };
    }
    function readAndResolve(iter) {
      var resolve = iter[kLastResolve];
      if (null !== resolve) {
        var data = iter[kStream].read();
        null !== data &&
          ((iter[kLastPromise] = null),
          (iter[kLastResolve] = null),
          (iter[kLastReject] = null),
          resolve(createIterResult(data, !1)));
      }
    }
    function onReadable(iter) {
      process.nextTick(readAndResolve, iter);
    }
    var AsyncIteratorPrototype = Object.getPrototypeOf(function () {}),
      ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf(
        (_defineProperty(
          (_Object$setPrototypeO = {
            get stream() {
              return this[kStream];
            },
            next: function () {
              var _this = this,
                error = this[kError];
              if (null !== error) return Promise.reject(error);
              if (this[kEnded])
                return Promise.resolve(createIterResult(void 0, !0));
              if (this[kStream].destroyed)
                return new Promise(function (resolve, reject) {
                  process.nextTick(function () {
                    _this[kError]
                      ? reject(_this[kError])
                      : resolve(createIterResult(void 0, !0));
                  });
                });
              var promise,
                lastPromise = this[kLastPromise];
              if (lastPromise)
                promise = new Promise(
                  (function (lastPromise, iter) {
                    return function (resolve, reject) {
                      lastPromise.then(function () {
                        iter[kEnded]
                          ? resolve(createIterResult(void 0, !0))
                          : iter[kHandlePromise](resolve, reject);
                      }, reject);
                    };
                  })(lastPromise, this)
                );
              else {
                var data = this[kStream].read();
                if (null !== data)
                  return Promise.resolve(createIterResult(data, !1));
                promise = new Promise(this[kHandlePromise]);
              }
              return (this[kLastPromise] = promise), promise;
            },
          }),
          Symbol.asyncIterator,
          function () {
            return this;
          }
        ),
        _defineProperty(_Object$setPrototypeO, "return", function () {
          var _this2 = this;
          return new Promise(function (resolve, reject) {
            _this2[kStream].destroy(null, function (err) {
              err ? reject(err) : resolve(createIterResult(void 0, !0));
            });
          });
        }),
        _Object$setPrototypeO),
        AsyncIteratorPrototype
      );
    module.exports = function (stream) {
      var _Object$create,
        iterator = Object.create(
          ReadableStreamAsyncIteratorPrototype,
          (_defineProperty((_Object$create = {}), kStream, {
            value: stream,
            writable: !0,
          }),
          _defineProperty(_Object$create, kLastResolve, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kLastReject, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kError, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kEnded, {
            value: stream._readableState.endEmitted,
            writable: !0,
          }),
          _defineProperty(_Object$create, kHandlePromise, {
            value: function (resolve, reject) {
              var data = iterator[kStream].read();
              data
                ? ((iterator[kLastPromise] = null),
                  (iterator[kLastResolve] = null),
                  (iterator[kLastReject] = null),
                  resolve(createIterResult(data, !1)))
                : ((iterator[kLastResolve] = resolve),
                  (iterator[kLastReject] = reject));
            },
            writable: !0,
          }),
          _Object$create)
        );
      return (
        (iterator[kLastPromise] = null),
        finished(stream, function (err) {
          if (err && "ERR_STREAM_PREMATURE_CLOSE" !== err.code) {
            var reject = iterator[kLastReject];
            return (
              null !== reject &&
                ((iterator[kLastPromise] = null),
                (iterator[kLastResolve] = null),
                (iterator[kLastReject] = null),
                reject(err)),
              void (iterator[kError] = err)
            );
          }
          var resolve = iterator[kLastResolve];
          null !== resolve &&
            ((iterator[kLastPromise] = null),
            (iterator[kLastResolve] = null),
            (iterator[kLastReject] = null),
            resolve(createIterResult(void 0, !0))),
            (iterator[kEnded] = !0);
        }),
        stream.on("readable", onReadable.bind(null, iterator)),
        iterator
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg),
          value = info.value;
      } catch (error) {
        return void reject(error);
      }
      info.done ? resolve(value) : Promise.resolve(value).then(_next, _throw);
    }
    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
          args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);
          function _next(value) {
            asyncGeneratorStep(
              gen,
              resolve,
              reject,
              _next,
              _throw,
              "next",
              value
            );
          }
          function _throw(err) {
            asyncGeneratorStep(
              gen,
              resolve,
              reject,
              _next,
              _throw,
              "throw",
              err
            );
          }
          _next(void 0);
        });
      };
    }
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly &&
          (symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          })),
          keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    var ERR_INVALID_ARG_TYPE =
      __webpack_require__(11).codes.ERR_INVALID_ARG_TYPE;
    module.exports = function (Readable, iterable, opts) {
      var iterator;
      if (iterable && "function" == typeof iterable.next) iterator = iterable;
      else if (iterable && iterable[Symbol.asyncIterator])
        iterator = iterable[Symbol.asyncIterator]();
      else {
        if (!iterable || !iterable[Symbol.iterator])
          throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
        iterator = iterable[Symbol.iterator]();
      }
      var readable = new Readable(
          (function (target) {
            for (var i = 1; i < arguments.length; i++) {
              var source = null != arguments[i] ? arguments[i] : {};
              i % 2
                ? ownKeys(Object(source), !0).forEach(function (key) {
                    _defineProperty(target, key, source[key]);
                  })
                : Object.getOwnPropertyDescriptors
                ? Object.defineProperties(
                    target,
                    Object.getOwnPropertyDescriptors(source)
                  )
                : ownKeys(Object(source)).forEach(function (key) {
                    Object.defineProperty(
                      target,
                      key,
                      Object.getOwnPropertyDescriptor(source, key)
                    );
                  });
            }
            return target;
          })({ objectMode: !0 }, opts)
        ),
        reading = !1;
      function next() {
        return _next2.apply(this, arguments);
      }
      function _next2() {
        return (_next2 = _asyncToGenerator(function* () {
          try {
            var _ref = yield iterator.next(),
              value = _ref.value;
            _ref.done
              ? readable.push(null)
              : readable.push(yield value)
              ? next()
              : (reading = !1);
          } catch (err) {
            readable.destroy(err);
          }
        })).apply(this, arguments);
      }
      return (
        (readable._read = function () {
          reading || ((reading = !0), next());
        }),
        readable
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    module.exports = PassThrough;
    var Transform = __webpack_require__(66);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    __webpack_require__(2)(PassThrough, Transform),
      (PassThrough.prototype._transform = function (chunk, encoding, cb) {
        cb(null, chunk);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var eos;
    var _require$codes = __webpack_require__(11).codes,
      ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
      ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    function noop(err) {
      if (err) throw err;
    }
    function destroyer(stream, reading, writing, callback) {
      callback = (function (callback) {
        var called = !1;
        return function () {
          called || ((called = !0), callback.apply(void 0, arguments));
        };
      })(callback);
      var closed = !1;
      stream.on("close", function () {
        closed = !0;
      }),
        void 0 === eos && (eos = __webpack_require__(33)),
        eos(stream, { readable: reading, writable: writing }, function (err) {
          if (err) return callback(err);
          (closed = !0), callback();
        });
      var destroyed = !1;
      return function (err) {
        if (!closed && !destroyed)
          return (
            (destroyed = !0),
            (function (stream) {
              return stream.setHeader && "function" == typeof stream.abort;
            })(stream)
              ? stream.abort()
              : "function" == typeof stream.destroy
              ? stream.destroy()
              : void callback(err || new ERR_STREAM_DESTROYED("pipe"))
          );
      };
    }
    function call(fn) {
      fn();
    }
    function pipe(from, to) {
      return from.pipe(to);
    }
    function popCallback(streams) {
      return streams.length
        ? "function" != typeof streams[streams.length - 1]
          ? noop
          : streams.pop()
        : noop;
    }
    module.exports = function () {
      for (
        var _len = arguments.length, streams = new Array(_len), _key = 0;
        _key < _len;
        _key++
      )
        streams[_key] = arguments[_key];
      var error,
        callback = popCallback(streams);
      if (
        (Array.isArray(streams[0]) && (streams = streams[0]),
        streams.length < 2)
      )
        throw new ERR_MISSING_ARGS("streams");
      var destroys = streams.map(function (stream, i) {
        var reading = i < streams.length - 1;
        return destroyer(stream, reading, i > 0, function (err) {
          error || (error = err),
            err && destroys.forEach(call),
            reading || (destroys.forEach(call), callback(error));
        });
      });
      return streams.reduce(pipe);
    };
  },
  function (module, exports, __webpack_require__) {
    var once = __webpack_require__(163),
      noop = function () {},
      eos = function (stream, opts, callback) {
        if ("function" == typeof opts) return eos(stream, null, opts);
        opts || (opts = {}), (callback = once(callback || noop));
        var ws = stream._writableState,
          rs = stream._readableState,
          readable = opts.readable || (!1 !== opts.readable && stream.readable),
          writable = opts.writable || (!1 !== opts.writable && stream.writable),
          cancelled = !1,
          onlegacyfinish = function () {
            stream.writable || onfinish();
          },
          onfinish = function () {
            (writable = !1), readable || callback.call(stream);
          },
          onend = function () {
            (readable = !1), writable || callback.call(stream);
          },
          onexit = function (exitCode) {
            callback.call(
              stream,
              exitCode ? new Error("exited with error code: " + exitCode) : null
            );
          },
          onerror = function (err) {
            callback.call(stream, err);
          },
          onclose = function () {
            process.nextTick(onclosenexttick);
          },
          onclosenexttick = function () {
            if (!cancelled)
              return (!readable || (rs && rs.ended && !rs.destroyed)) &&
                (!writable || (ws && ws.ended && !ws.destroyed))
                ? void 0
                : callback.call(stream, new Error("premature close"));
          },
          onrequest = function () {
            stream.req.on("finish", onfinish);
          };
        return (
          !(function (stream) {
            return stream.setHeader && "function" == typeof stream.abort;
          })(stream)
            ? writable &&
              !ws &&
              (stream.on("end", onlegacyfinish),
              stream.on("close", onlegacyfinish))
            : (stream.on("complete", onfinish),
              stream.on("abort", onclose),
              stream.req ? onrequest() : stream.on("request", onrequest)),
          (function (stream) {
            return (
              stream.stdio &&
              Array.isArray(stream.stdio) &&
              3 === stream.stdio.length
            );
          })(stream) && stream.on("exit", onexit),
          stream.on("end", onend),
          stream.on("finish", onfinish),
          !1 !== opts.error && stream.on("error", onerror),
          stream.on("close", onclose),
          function () {
            (cancelled = !0),
              stream.removeListener("complete", onfinish),
              stream.removeListener("abort", onclose),
              stream.removeListener("request", onrequest),
              stream.req && stream.req.removeListener("finish", onfinish),
              stream.removeListener("end", onlegacyfinish),
              stream.removeListener("close", onlegacyfinish),
              stream.removeListener("finish", onfinish),
              stream.removeListener("exit", onexit),
              stream.removeListener("end", onend),
              stream.removeListener("error", onerror),
              stream.removeListener("close", onclose);
          }
        );
      };
    module.exports = eos;
  },
  function (module, exports, __webpack_require__) {
    var wrappy = __webpack_require__(164);
    function once(fn) {
      var f = function () {
        return f.called
          ? f.value
          : ((f.called = !0), (f.value = fn.apply(this, arguments)));
      };
      return (f.called = !1), f;
    }
    function onceStrict(fn) {
      var f = function () {
          if (f.called) throw new Error(f.onceError);
          return (f.called = !0), (f.value = fn.apply(this, arguments));
        },
        name = fn.name || "Function wrapped with `once`";
      return (
        (f.onceError = name + " shouldn't be called more than once"),
        (f.called = !1),
        f
      );
    }
    (module.exports = wrappy(once)),
      (module.exports.strict = wrappy(onceStrict)),
      (once.proto = once(function () {
        Object.defineProperty(Function.prototype, "once", {
          value: function () {
            return once(this);
          },
          configurable: !0,
        }),
          Object.defineProperty(Function.prototype, "onceStrict", {
            value: function () {
              return onceStrict(this);
            },
            configurable: !0,
          });
      }));
  },
  function (module, exports) {
    module.exports = function wrappy(fn, cb) {
      if (fn && cb) return wrappy(fn)(cb);
      if ("function" != typeof fn) throw new TypeError("need wrapper function");
      return (
        Object.keys(fn).forEach(function (k) {
          wrapper[k] = fn[k];
        }),
        wrapper
      );
      function wrapper() {
        for (
          var args = new Array(arguments.length), i = 0;
          i < args.length;
          i++
        )
          args[i] = arguments[i];
        var ret = fn.apply(this, args),
          cb = args[args.length - 1];
        return (
          "function" == typeof ret &&
            ret !== cb &&
            Object.keys(cb).forEach(function (k) {
              ret[k] = cb[k];
            }),
          ret
        );
      }
    };
  },
  function (module, exports) {
    module.exports = function (stream) {
      var rs = stream._readableState;
      return rs
        ? rs.objectMode || "number" == typeof stream._duplexState
          ? stream.read()
          : stream.read(
              (function (state) {
                if (state.buffer.length)
                  return state.buffer.head
                    ? state.buffer.head.data.length
                    : state.buffer[0].length;
                return state.length;
              })(rs)
            )
        : null;
    };
  },
  function (module, exports, __webpack_require__) {
    /*! simple-websocket. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
    const debug = __webpack_require__(167)("simple-websocket"),
      randombytes = __webpack_require__(174),
      stream = __webpack_require__(175),
      queueMicrotask = __webpack_require__(181),
      ws = __webpack_require__(182),
      _WebSocket = "function" != typeof ws ? WebSocket : ws;
    class Socket extends stream.Duplex {
      constructor(opts = {}) {
        if (
          ("string" == typeof opts && (opts = { url: opts }),
          super((opts = Object.assign({ allowHalfOpen: !1 }, opts))),
          null == opts.url && null == opts.socket)
        )
          throw new Error("Missing required `url` or `socket` option");
        if (null != opts.url && null != opts.socket)
          throw new Error(
            "Must specify either `url` or `socket` option, not both"
          );
        if (
          ((this._id = randombytes(4).toString("hex").slice(0, 7)),
          this._debug("new websocket: %o", opts),
          (this.connected = !1),
          (this.destroyed = !1),
          (this._chunk = null),
          (this._cb = null),
          (this._interval = null),
          opts.socket)
        )
          (this.url = opts.socket.url),
            (this._ws = opts.socket),
            (this.connected = opts.socket.readyState === _WebSocket.OPEN);
        else {
          this.url = opts.url;
          try {
            this._ws =
              "function" == typeof ws
                ? new _WebSocket(opts.url, null, { ...opts, encoding: void 0 })
                : new _WebSocket(opts.url);
          } catch (err) {
            return void queueMicrotask(() => this.destroy(err));
          }
        }
        (this._ws.binaryType = "arraybuffer"),
          opts.socket && this.connected
            ? queueMicrotask(() => this._handleOpen())
            : (this._ws.onopen = () => this._handleOpen()),
          (this._ws.onmessage = (event) => this._handleMessage(event)),
          (this._ws.onclose = () => this._handleClose()),
          (this._ws.onerror = (err) => this._handleError(err)),
          (this._handleFinishBound = () => this._handleFinish()),
          this.once("finish", this._handleFinishBound);
      }
      send(chunk) {
        this._ws.send(chunk);
      }
      destroy(err) {
        this._destroy(err, () => {});
      }
      _destroy(err, cb) {
        if (!this.destroyed) {
          if (
            (this._debug("destroy (error: %s)", err && (err.message || err)),
            (this.readable = this.writable = !1),
            this._readableState.ended || this.push(null),
            this._writableState.finished || this.end(),
            (this.connected = !1),
            (this.destroyed = !0),
            clearInterval(this._interval),
            (this._interval = null),
            (this._chunk = null),
            (this._cb = null),
            this._handleFinishBound &&
              this.removeListener("finish", this._handleFinishBound),
            (this._handleFinishBound = null),
            this._ws)
          ) {
            const ws = this._ws,
              onClose = () => {
                ws.onclose = null;
              };
            if (ws.readyState === _WebSocket.CLOSED) onClose();
            else
              try {
                (ws.onclose = onClose), ws.close();
              } catch (err) {
                onClose();
              }
            (ws.onopen = null), (ws.onmessage = null), (ws.onerror = () => {});
          }
          (this._ws = null),
            err && this.emit("error", err),
            this.emit("close"),
            cb();
        }
      }
      _read() {}
      _write(chunk, encoding, cb) {
        if (this.destroyed)
          return cb(new Error("cannot write after socket is destroyed"));
        if (this.connected) {
          try {
            this.send(chunk);
          } catch (err) {
            return this.destroy(err);
          }
          "function" != typeof ws && this._ws.bufferedAmount > 65536
            ? (this._debug(
                "start backpressure: bufferedAmount %d",
                this._ws.bufferedAmount
              ),
              (this._cb = cb))
            : cb(null);
        } else
          this._debug("write before connect"),
            (this._chunk = chunk),
            (this._cb = cb);
      }
      _handleOpen() {
        if (!this.connected && !this.destroyed) {
          if (((this.connected = !0), this._chunk)) {
            try {
              this.send(this._chunk);
            } catch (err) {
              return this.destroy(err);
            }
            (this._chunk = null),
              this._debug('sent chunk from "write before connect"');
            const cb = this._cb;
            (this._cb = null), cb(null);
          }
          "function" != typeof ws &&
            ((this._interval = setInterval(() => this._onInterval(), 150)),
            this._interval.unref && this._interval.unref()),
            this._debug("connect"),
            this.emit("connect");
        }
      }
      _handleMessage(event) {
        if (this.destroyed) return;
        let data = event.data;
        data instanceof ArrayBuffer && (data = Buffer.from(data)),
          this.push(data);
      }
      _handleClose() {
        this.destroyed || (this._debug("on close"), this.destroy());
      }
      _handleError(_) {
        this.destroy(new Error(`Error connecting to ${this.url}`));
      }
      _handleFinish() {
        if (this.destroyed) return;
        const destroySoon = () => {
          setTimeout(() => this.destroy(), 1e3);
        };
        this.connected ? destroySoon() : this.once("connect", destroySoon);
      }
      _onInterval() {
        if (!this._cb || !this._ws || this._ws.bufferedAmount > 65536) return;
        this._debug(
          "ending backpressure: bufferedAmount %d",
          this._ws.bufferedAmount
        );
        const cb = this._cb;
        (this._cb = null), cb(null);
      }
      _debug() {
        const args = [].slice.call(arguments);
        (args[0] = "[" + this._id + "] " + args[0]), debug.apply(null, args);
      }
    }
    (Socket.WEBSOCKET_SUPPORT = !!_WebSocket), (module.exports = Socket);
  },
  function (module, exports, __webpack_require__) {
    "undefined" == typeof process ||
    "renderer" === process.type ||
    !0 === process.browser ||
    process.__nwjs
      ? (module.exports = __webpack_require__(168))
      : (module.exports = __webpack_require__(170));
  },
  function (module, exports, __webpack_require__) {
    (exports.formatArgs = function (args) {
      if (
        ((args[0] =
          (this.useColors ? "%c" : "") +
          this.namespace +
          (this.useColors ? " %c" : " ") +
          args[0] +
          (this.useColors ? "%c " : " ") +
          "+" +
          module.exports.humanize(this.diff)),
        !this.useColors)
      )
        return;
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0,
        lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        "%%" !== match && (index++, "%c" === match && (lastC = index));
      }),
        args.splice(lastC, 0, c);
    }),
      (exports.save = function (namespaces) {
        try {
          namespaces
            ? exports.storage.setItem("debug", namespaces)
            : exports.storage.removeItem("debug");
        } catch (error) {}
      }),
      (exports.load = function () {
        let r;
        try {
          r = exports.storage.getItem("debug");
        } catch (error) {}
        !r &&
          "undefined" != typeof process &&
          "env" in process &&
          (r = process.env.DEBUG);
        return r;
      }),
      (exports.useColors = function () {
        if (
          "undefined" != typeof window &&
          window.process &&
          ("renderer" === window.process.type || window.process.__nwjs)
        )
          return !0;
        if (
          "undefined" != typeof navigator &&
          navigator.userAgent &&
          navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
        )
          return !1;
        return (
          ("undefined" != typeof document &&
            document.documentElement &&
            document.documentElement.style &&
            document.documentElement.style.WebkitAppearance) ||
          ("undefined" != typeof window &&
            window.console &&
            (window.console.firebug ||
              (window.console.exception && window.console.table))) ||
          ("undefined" != typeof navigator &&
            navigator.userAgent &&
            navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) &&
            parseInt(RegExp.$1, 10) >= 31) ||
          ("undefined" != typeof navigator &&
            navigator.userAgent &&
            navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
        );
      }),
      (exports.storage = (function () {
        try {
          return localStorage;
        } catch (error) {}
      })()),
      (exports.destroy = (() => {
        let warned = !1;
        return () => {
          warned ||
            ((warned = !0),
            console.warn(
              "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
            ));
        };
      })()),
      (exports.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33",
      ]),
      (exports.log = console.debug || console.log || (() => {})),
      (module.exports = __webpack_require__(67)(exports));
    const { formatters: formatters } = module.exports;
    formatters.j = function (v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  },
  function (module, exports) {
    var s = 1e3,
      m = 60 * s,
      h = 60 * m,
      d = 24 * h,
      w = 7 * d,
      y = 365.25 * d;
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= 1.5 * n;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
    module.exports = function (val, options) {
      options = options || {};
      var type = typeof val;
      if ("string" === type && val.length > 0)
        return (function (str) {
          if ((str = String(str)).length > 100) return;
          var match =
            /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
              str
            );
          if (!match) return;
          var n = parseFloat(match[1]);
          switch ((match[2] || "ms").toLowerCase()) {
            case "years":
            case "year":
            case "yrs":
            case "yr":
            case "y":
              return n * y;
            case "weeks":
            case "week":
            case "w":
              return n * w;
            case "days":
            case "day":
            case "d":
              return n * d;
            case "hours":
            case "hour":
            case "hrs":
            case "hr":
            case "h":
              return n * h;
            case "minutes":
            case "minute":
            case "mins":
            case "min":
            case "m":
              return n * m;
            case "seconds":
            case "second":
            case "secs":
            case "sec":
            case "s":
              return n * s;
            case "milliseconds":
            case "millisecond":
            case "msecs":
            case "msec":
            case "ms":
              return n;
            default:
              return;
          }
        })(val);
      if ("number" === type && isFinite(val))
        return options.long
          ? (function (ms) {
              var msAbs = Math.abs(ms);
              if (msAbs >= d) return plural(ms, msAbs, d, "day");
              if (msAbs >= h) return plural(ms, msAbs, h, "hour");
              if (msAbs >= m) return plural(ms, msAbs, m, "minute");
              if (msAbs >= s) return plural(ms, msAbs, s, "second");
              return ms + " ms";
            })(val)
          : (function (ms) {
              var msAbs = Math.abs(ms);
              if (msAbs >= d) return Math.round(ms / d) + "d";
              if (msAbs >= h) return Math.round(ms / h) + "h";
              if (msAbs >= m) return Math.round(ms / m) + "m";
              if (msAbs >= s) return Math.round(ms / s) + "s";
              return ms + "ms";
            })(val);
      throw new Error(
        "val is not a non-empty string or a valid number. val=" +
          JSON.stringify(val)
      );
    };
  },
  function (module, exports, __webpack_require__) {
    const tty = __webpack_require__(34),
      util = __webpack_require__(4);
    (exports.init = function (debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++)
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
    }),
      (exports.log = function (...args) {
        return process.stderr.write(util.format(...args) + "\n");
      }),
      (exports.formatArgs = function (args) {
        const { namespace: name, useColors: useColors } = this;
        if (useColors) {
          const c = this.color,
            colorCode = "[3" + (c < 8 ? c : "8;5;" + c),
            prefix = `  ${colorCode};1m${name} [0m`;
          (args[0] = prefix + args[0].split("\n").join("\n" + prefix)),
            args.push(
              colorCode + "m+" + module.exports.humanize(this.diff) + "[0m"
            );
        } else
          args[0] =
            (function () {
              if (exports.inspectOpts.hideDate) return "";
              return new Date().toISOString() + " ";
            })() +
            name +
            " " +
            args[0];
      }),
      (exports.save = function (namespaces) {
        namespaces
          ? (process.env.DEBUG = namespaces)
          : delete process.env.DEBUG;
      }),
      (exports.load = function () {
        return process.env.DEBUG;
      }),
      (exports.useColors = function () {
        return "colors" in exports.inspectOpts
          ? Boolean(exports.inspectOpts.colors)
          : tty.isatty(process.stderr.fd);
      }),
      (exports.destroy = util.deprecate(() => {},
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")),
      (exports.colors = [6, 2, 3, 4, 5, 1]);
    try {
      const supportsColor = __webpack_require__(171);
      supportsColor &&
        (supportsColor.stderr || supportsColor).level >= 2 &&
        (exports.colors = [
          20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62,
          63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113,
          128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167,
          168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199,
          200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221,
        ]);
    } catch (error) {}
    (exports.inspectOpts = Object.keys(process.env)
      .filter((key) => /^debug_/i.test(key))
      .reduce((obj, key) => {
        const prop = key
          .substring(6)
          .toLowerCase()
          .replace(/_([a-z])/g, (_, k) => k.toUpperCase());
        let val = process.env[key];
        return (
          (val =
            !!/^(yes|on|true|enabled)$/i.test(val) ||
            (!/^(no|off|false|disabled)$/i.test(val) &&
              ("null" === val ? null : Number(val)))),
          (obj[prop] = val),
          obj
        );
      }, {})),
      (module.exports = __webpack_require__(67)(exports));
    const { formatters: formatters } = module.exports;
    (formatters.o = function (v) {
      return (
        (this.inspectOpts.colors = this.useColors),
        util
          .inspect(v, this.inspectOpts)
          .split("\n")
          .map((str) => str.trim())
          .join(" ")
      );
    }),
      (formatters.O = function (v) {
        return (
          (this.inspectOpts.colors = this.useColors),
          util.inspect(v, this.inspectOpts)
        );
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const os = __webpack_require__(172),
      tty = __webpack_require__(34),
      hasFlag = __webpack_require__(173),
      { env: env } = process;
    let forceColor;
    function translateLevel(level) {
      return (
        0 !== level && {
          level: level,
          hasBasic: !0,
          has256: level >= 2,
          has16m: level >= 3,
        }
      );
    }
    function supportsColor(haveStream, streamIsTTY) {
      if (0 === forceColor) return 0;
      if (
        hasFlag("color=16m") ||
        hasFlag("color=full") ||
        hasFlag("color=truecolor")
      )
        return 3;
      if (hasFlag("color=256")) return 2;
      if (haveStream && !streamIsTTY && void 0 === forceColor) return 0;
      const min = forceColor || 0;
      if ("dumb" === env.TERM) return min;
      if ("win32" === process.platform) {
        const osRelease = os.release().split(".");
        return Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586
          ? Number(osRelease[2]) >= 14931
            ? 3
            : 2
          : 1;
      }
      if ("CI" in env)
        return [
          "TRAVIS",
          "CIRCLECI",
          "APPVEYOR",
          "GITLAB_CI",
          "GITHUB_ACTIONS",
          "BUILDKITE",
        ].some((sign) => sign in env) || "codeship" === env.CI_NAME
          ? 1
          : min;
      if ("TEAMCITY_VERSION" in env)
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION)
          ? 1
          : 0;
      if ("truecolor" === env.COLORTERM) return 3;
      if ("TERM_PROGRAM" in env) {
        const version = parseInt(
          (env.TERM_PROGRAM_VERSION || "").split(".")[0],
          10
        );
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      return /-256(color)?$/i.test(env.TERM)
        ? 2
        : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
            env.TERM
          ) || "COLORTERM" in env
        ? 1
        : min;
    }
    hasFlag("no-color") ||
    hasFlag("no-colors") ||
    hasFlag("color=false") ||
    hasFlag("color=never")
      ? (forceColor = 0)
      : (hasFlag("color") ||
          hasFlag("colors") ||
          hasFlag("color=true") ||
          hasFlag("color=always")) &&
        (forceColor = 1),
      "FORCE_COLOR" in env &&
        (forceColor =
          "true" === env.FORCE_COLOR
            ? 1
            : "false" === env.FORCE_COLOR
            ? 0
            : 0 === env.FORCE_COLOR.length
            ? 1
            : Math.min(parseInt(env.FORCE_COLOR, 10), 3)),
      (module.exports = {
        supportsColor: function (stream) {
          return translateLevel(supportsColor(stream, stream && stream.isTTY));
        },
        stdout: translateLevel(supportsColor(!0, tty.isatty(1))),
        stderr: translateLevel(supportsColor(!0, tty.isatty(2))),
      });
  },
  function (module, exports) {
    module.exports = require("os");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    module.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : 1 === flag.length ? "-" : "--",
        position = argv.indexOf(prefix + flag),
        terminatorPosition = argv.indexOf("--");
      return (
        -1 !== position &&
        (-1 === terminatorPosition || position < terminatorPosition)
      );
    };
  },
  function (module, exports, __webpack_require__) {
    module.exports = __webpack_require__(23).randomBytes;
  },
  function (module, exports, __webpack_require__) {
    var Stream = __webpack_require__(6);
    "disable" === process.env.READABLE_STREAM && Stream
      ? ((module.exports = Stream.Readable),
        Object.assign(module.exports, Stream),
        (module.exports.Stream = Stream))
      : (((exports = module.exports = __webpack_require__(68)).Stream =
          Stream || exports),
        (exports.Readable = exports),
        (exports.Writable = __webpack_require__(72)),
        (exports.Duplex = __webpack_require__(17)),
        (exports.Transform = __webpack_require__(73)),
        (exports.PassThrough = __webpack_require__(179)),
        (exports.finished = __webpack_require__(35)),
        (exports.pipeline = __webpack_require__(180)));
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly &&
          (symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          })),
          keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        (descriptor.enumerable = descriptor.enumerable || !1),
          (descriptor.configurable = !0),
          "value" in descriptor && (descriptor.writable = !0),
          Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    var Buffer = __webpack_require__(7).Buffer,
      inspect = __webpack_require__(4).inspect,
      custom = (inspect && inspect.custom) || "inspect";
    module.exports = (function () {
      function BufferList() {
        !(function (instance, Constructor) {
          if (!(instance instanceof Constructor))
            throw new TypeError("Cannot call a class as a function");
        })(this, BufferList),
          (this.head = null),
          (this.tail = null),
          (this.length = 0);
      }
      var Constructor, protoProps, staticProps;
      return (
        (Constructor = BufferList),
        (protoProps = [
          {
            key: "push",
            value: function (v) {
              var entry = { data: v, next: null };
              this.length > 0 ? (this.tail.next = entry) : (this.head = entry),
                (this.tail = entry),
                ++this.length;
            },
          },
          {
            key: "unshift",
            value: function (v) {
              var entry = { data: v, next: this.head };
              0 === this.length && (this.tail = entry),
                (this.head = entry),
                ++this.length;
            },
          },
          {
            key: "shift",
            value: function () {
              if (0 !== this.length) {
                var ret = this.head.data;
                return (
                  1 === this.length
                    ? (this.head = this.tail = null)
                    : (this.head = this.head.next),
                  --this.length,
                  ret
                );
              }
            },
          },
          {
            key: "clear",
            value: function () {
              (this.head = this.tail = null), (this.length = 0);
            },
          },
          {
            key: "join",
            value: function (s) {
              if (0 === this.length) return "";
              for (var p = this.head, ret = "" + p.data; (p = p.next); )
                ret += s + p.data;
              return ret;
            },
          },
          {
            key: "concat",
            value: function (n) {
              if (0 === this.length) return Buffer.alloc(0);
              for (
                var src,
                  target,
                  offset,
                  ret = Buffer.allocUnsafe(n >>> 0),
                  p = this.head,
                  i = 0;
                p;

              )
                (src = p.data),
                  (target = ret),
                  (offset = i),
                  Buffer.prototype.copy.call(src, target, offset),
                  (i += p.data.length),
                  (p = p.next);
              return ret;
            },
          },
          {
            key: "consume",
            value: function (n, hasStrings) {
              var ret;
              return (
                n < this.head.data.length
                  ? ((ret = this.head.data.slice(0, n)),
                    (this.head.data = this.head.data.slice(n)))
                  : (ret =
                      n === this.head.data.length
                        ? this.shift()
                        : hasStrings
                        ? this._getString(n)
                        : this._getBuffer(n)),
                ret
              );
            },
          },
          {
            key: "first",
            value: function () {
              return this.head.data;
            },
          },
          {
            key: "_getString",
            value: function (n) {
              var p = this.head,
                c = 1,
                ret = p.data;
              for (n -= ret.length; (p = p.next); ) {
                var str = p.data,
                  nb = n > str.length ? str.length : n;
                if (
                  (nb === str.length ? (ret += str) : (ret += str.slice(0, n)),
                  0 == (n -= nb))
                ) {
                  nb === str.length
                    ? (++c,
                      p.next
                        ? (this.head = p.next)
                        : (this.head = this.tail = null))
                    : ((this.head = p), (p.data = str.slice(nb)));
                  break;
                }
                ++c;
              }
              return (this.length -= c), ret;
            },
          },
          {
            key: "_getBuffer",
            value: function (n) {
              var ret = Buffer.allocUnsafe(n),
                p = this.head,
                c = 1;
              for (p.data.copy(ret), n -= p.data.length; (p = p.next); ) {
                var buf = p.data,
                  nb = n > buf.length ? buf.length : n;
                if ((buf.copy(ret, ret.length - n, 0, nb), 0 == (n -= nb))) {
                  nb === buf.length
                    ? (++c,
                      p.next
                        ? (this.head = p.next)
                        : (this.head = this.tail = null))
                    : ((this.head = p), (p.data = buf.slice(nb)));
                  break;
                }
                ++c;
              }
              return (this.length -= c), ret;
            },
          },
          {
            key: custom,
            value: function (_, options) {
              return inspect(
                this,
                (function (target) {
                  for (var i = 1; i < arguments.length; i++) {
                    var source = null != arguments[i] ? arguments[i] : {};
                    i % 2
                      ? ownKeys(Object(source), !0).forEach(function (key) {
                          _defineProperty(target, key, source[key]);
                        })
                      : Object.getOwnPropertyDescriptors
                      ? Object.defineProperties(
                          target,
                          Object.getOwnPropertyDescriptors(source)
                        )
                      : ownKeys(Object(source)).forEach(function (key) {
                          Object.defineProperty(
                            target,
                            key,
                            Object.getOwnPropertyDescriptor(source, key)
                          );
                        });
                  }
                  return target;
                })({}, options, { depth: 0, customInspect: !1 })
              );
            },
          },
        ]) && _defineProperties(Constructor.prototype, protoProps),
        staticProps && _defineProperties(Constructor, staticProps),
        BufferList
      );
    })();
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var _Object$setPrototypeO;
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    var finished = __webpack_require__(35),
      kLastResolve = Symbol("lastResolve"),
      kLastReject = Symbol("lastReject"),
      kError = Symbol("error"),
      kEnded = Symbol("ended"),
      kLastPromise = Symbol("lastPromise"),
      kHandlePromise = Symbol("handlePromise"),
      kStream = Symbol("stream");
    function createIterResult(value, done) {
      return { value: value, done: done };
    }
    function readAndResolve(iter) {
      var resolve = iter[kLastResolve];
      if (null !== resolve) {
        var data = iter[kStream].read();
        null !== data &&
          ((iter[kLastPromise] = null),
          (iter[kLastResolve] = null),
          (iter[kLastReject] = null),
          resolve(createIterResult(data, !1)));
      }
    }
    function onReadable(iter) {
      process.nextTick(readAndResolve, iter);
    }
    var AsyncIteratorPrototype = Object.getPrototypeOf(function () {}),
      ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf(
        (_defineProperty(
          (_Object$setPrototypeO = {
            get stream() {
              return this[kStream];
            },
            next: function () {
              var _this = this,
                error = this[kError];
              if (null !== error) return Promise.reject(error);
              if (this[kEnded])
                return Promise.resolve(createIterResult(void 0, !0));
              if (this[kStream].destroyed)
                return new Promise(function (resolve, reject) {
                  process.nextTick(function () {
                    _this[kError]
                      ? reject(_this[kError])
                      : resolve(createIterResult(void 0, !0));
                  });
                });
              var promise,
                lastPromise = this[kLastPromise];
              if (lastPromise)
                promise = new Promise(
                  (function (lastPromise, iter) {
                    return function (resolve, reject) {
                      lastPromise.then(function () {
                        iter[kEnded]
                          ? resolve(createIterResult(void 0, !0))
                          : iter[kHandlePromise](resolve, reject);
                      }, reject);
                    };
                  })(lastPromise, this)
                );
              else {
                var data = this[kStream].read();
                if (null !== data)
                  return Promise.resolve(createIterResult(data, !1));
                promise = new Promise(this[kHandlePromise]);
              }
              return (this[kLastPromise] = promise), promise;
            },
          }),
          Symbol.asyncIterator,
          function () {
            return this;
          }
        ),
        _defineProperty(_Object$setPrototypeO, "return", function () {
          var _this2 = this;
          return new Promise(function (resolve, reject) {
            _this2[kStream].destroy(null, function (err) {
              err ? reject(err) : resolve(createIterResult(void 0, !0));
            });
          });
        }),
        _Object$setPrototypeO),
        AsyncIteratorPrototype
      );
    module.exports = function (stream) {
      var _Object$create,
        iterator = Object.create(
          ReadableStreamAsyncIteratorPrototype,
          (_defineProperty((_Object$create = {}), kStream, {
            value: stream,
            writable: !0,
          }),
          _defineProperty(_Object$create, kLastResolve, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kLastReject, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kError, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kEnded, {
            value: stream._readableState.endEmitted,
            writable: !0,
          }),
          _defineProperty(_Object$create, kHandlePromise, {
            value: function (resolve, reject) {
              var data = iterator[kStream].read();
              data
                ? ((iterator[kLastPromise] = null),
                  (iterator[kLastResolve] = null),
                  (iterator[kLastReject] = null),
                  resolve(createIterResult(data, !1)))
                : ((iterator[kLastResolve] = resolve),
                  (iterator[kLastReject] = reject));
            },
            writable: !0,
          }),
          _Object$create)
        );
      return (
        (iterator[kLastPromise] = null),
        finished(stream, function (err) {
          if (err && "ERR_STREAM_PREMATURE_CLOSE" !== err.code) {
            var reject = iterator[kLastReject];
            return (
              null !== reject &&
                ((iterator[kLastPromise] = null),
                (iterator[kLastResolve] = null),
                (iterator[kLastReject] = null),
                reject(err)),
              void (iterator[kError] = err)
            );
          }
          var resolve = iterator[kLastResolve];
          null !== resolve &&
            ((iterator[kLastPromise] = null),
            (iterator[kLastResolve] = null),
            (iterator[kLastReject] = null),
            resolve(createIterResult(void 0, !0))),
            (iterator[kEnded] = !0);
        }),
        stream.on("readable", onReadable.bind(null, iterator)),
        iterator
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg),
          value = info.value;
      } catch (error) {
        return void reject(error);
      }
      info.done ? resolve(value) : Promise.resolve(value).then(_next, _throw);
    }
    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
          args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);
          function _next(value) {
            asyncGeneratorStep(
              gen,
              resolve,
              reject,
              _next,
              _throw,
              "next",
              value
            );
          }
          function _throw(err) {
            asyncGeneratorStep(
              gen,
              resolve,
              reject,
              _next,
              _throw,
              "throw",
              err
            );
          }
          _next(void 0);
        });
      };
    }
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly &&
          (symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          })),
          keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    var ERR_INVALID_ARG_TYPE =
      __webpack_require__(12).codes.ERR_INVALID_ARG_TYPE;
    module.exports = function (Readable, iterable, opts) {
      var iterator;
      if (iterable && "function" == typeof iterable.next) iterator = iterable;
      else if (iterable && iterable[Symbol.asyncIterator])
        iterator = iterable[Symbol.asyncIterator]();
      else {
        if (!iterable || !iterable[Symbol.iterator])
          throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
        iterator = iterable[Symbol.iterator]();
      }
      var readable = new Readable(
          (function (target) {
            for (var i = 1; i < arguments.length; i++) {
              var source = null != arguments[i] ? arguments[i] : {};
              i % 2
                ? ownKeys(Object(source), !0).forEach(function (key) {
                    _defineProperty(target, key, source[key]);
                  })
                : Object.getOwnPropertyDescriptors
                ? Object.defineProperties(
                    target,
                    Object.getOwnPropertyDescriptors(source)
                  )
                : ownKeys(Object(source)).forEach(function (key) {
                    Object.defineProperty(
                      target,
                      key,
                      Object.getOwnPropertyDescriptor(source, key)
                    );
                  });
            }
            return target;
          })({ objectMode: !0 }, opts)
        ),
        reading = !1;
      function next() {
        return _next2.apply(this, arguments);
      }
      function _next2() {
        return (_next2 = _asyncToGenerator(function* () {
          try {
            var _ref = yield iterator.next(),
              value = _ref.value;
            _ref.done
              ? readable.push(null)
              : readable.push(yield value)
              ? next()
              : (reading = !1);
          } catch (err) {
            readable.destroy(err);
          }
        })).apply(this, arguments);
      }
      return (
        (readable._read = function () {
          reading || ((reading = !0), next());
        }),
        readable
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    module.exports = PassThrough;
    var Transform = __webpack_require__(73);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    __webpack_require__(2)(PassThrough, Transform),
      (PassThrough.prototype._transform = function (chunk, encoding, cb) {
        cb(null, chunk);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var eos;
    var _require$codes = __webpack_require__(12).codes,
      ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
      ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    function noop(err) {
      if (err) throw err;
    }
    function destroyer(stream, reading, writing, callback) {
      callback = (function (callback) {
        var called = !1;
        return function () {
          called || ((called = !0), callback.apply(void 0, arguments));
        };
      })(callback);
      var closed = !1;
      stream.on("close", function () {
        closed = !0;
      }),
        void 0 === eos && (eos = __webpack_require__(35)),
        eos(stream, { readable: reading, writable: writing }, function (err) {
          if (err) return callback(err);
          (closed = !0), callback();
        });
      var destroyed = !1;
      return function (err) {
        if (!closed && !destroyed)
          return (
            (destroyed = !0),
            (function (stream) {
              return stream.setHeader && "function" == typeof stream.abort;
            })(stream)
              ? stream.abort()
              : "function" == typeof stream.destroy
              ? stream.destroy()
              : void callback(err || new ERR_STREAM_DESTROYED("pipe"))
          );
      };
    }
    function call(fn) {
      fn();
    }
    function pipe(from, to) {
      return from.pipe(to);
    }
    function popCallback(streams) {
      return streams.length
        ? "function" != typeof streams[streams.length - 1]
          ? noop
          : streams.pop()
        : noop;
    }
    module.exports = function () {
      for (
        var _len = arguments.length, streams = new Array(_len), _key = 0;
        _key < _len;
        _key++
      )
        streams[_key] = arguments[_key];
      var error,
        callback = popCallback(streams);
      if (
        (Array.isArray(streams[0]) && (streams = streams[0]),
        streams.length < 2)
      )
        throw new ERR_MISSING_ARGS("streams");
      var destroys = streams.map(function (stream, i) {
        var reading = i < streams.length - 1;
        return destroyer(stream, reading, i > 0, function (err) {
          error || (error = err),
            err && destroys.forEach(call),
            reading || (destroys.forEach(call), callback(error));
        });
      });
      return streams.reduce(pipe);
    };
  },
  function (module, exports) {
    /*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
    let promise;
    module.exports =
      "function" == typeof queueMicrotask
        ? queueMicrotask.bind("undefined" != typeof window ? window : global)
        : (cb) =>
            (promise || (promise = Promise.resolve())).then(cb).catch((err) =>
              setTimeout(() => {
                throw err;
              }, 0)
            );
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const WebSocket = __webpack_require__(74);
    (WebSocket.createWebSocketStream = __webpack_require__(187)),
      (WebSocket.Server = __webpack_require__(188)),
      (WebSocket.Receiver = __webpack_require__(77)),
      (WebSocket.Sender = __webpack_require__(79)),
      (module.exports = WebSocket);
  },
  function (module, exports) {
    module.exports = require("url");
  },
  function (module, exports) {
    module.exports = require("zlib");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const kDone = Symbol("kDone"),
      kRun = Symbol("kRun");
    module.exports = class {
      constructor(concurrency) {
        (this[kDone] = () => {
          this.pending--, this[kRun]();
        }),
          (this.concurrency = concurrency || 1 / 0),
          (this.jobs = []),
          (this.pending = 0);
      }
      add(job) {
        this.jobs.push(job), this[kRun]();
      }
      [kRun]() {
        if (this.pending !== this.concurrency && this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++, job(this[kDone]);
        }
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    class Event {
      constructor(type, target) {
        (this.target = target), (this.type = type);
      }
    }
    class MessageEvent extends Event {
      constructor(data, target) {
        super("message", target), (this.data = data);
      }
    }
    class CloseEvent extends Event {
      constructor(code, reason, target) {
        super("close", target),
          (this.wasClean =
            target._closeFrameReceived && target._closeFrameSent),
          (this.reason = reason),
          (this.code = code);
      }
    }
    class OpenEvent extends Event {
      constructor(target) {
        super("open", target);
      }
    }
    class ErrorEvent extends Event {
      constructor(error, target) {
        super("error", target),
          (this.message = error.message),
          (this.error = error);
      }
    }
    const EventTarget = {
      addEventListener(type, listener, options) {
        if ("function" != typeof listener) return;
        function onMessage(data) {
          listener.call(this, new MessageEvent(data, this));
        }
        function onClose(code, message) {
          listener.call(this, new CloseEvent(code, message, this));
        }
        function onError(error) {
          listener.call(this, new ErrorEvent(error, this));
        }
        function onOpen() {
          listener.call(this, new OpenEvent(this));
        }
        const method = options && options.once ? "once" : "on";
        "message" === type
          ? ((onMessage._listener = listener), this[method](type, onMessage))
          : "close" === type
          ? ((onClose._listener = listener), this[method](type, onClose))
          : "error" === type
          ? ((onError._listener = listener), this[method](type, onError))
          : "open" === type
          ? ((onOpen._listener = listener), this[method](type, onOpen))
          : this[method](type, listener);
      },
      removeEventListener(type, listener) {
        const listeners = this.listeners(type);
        for (let i = 0; i < listeners.length; i++)
          (listeners[i] !== listener && listeners[i]._listener !== listener) ||
            this.removeListener(type, listeners[i]);
      },
    };
    module.exports = EventTarget;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const { Duplex: Duplex } = __webpack_require__(6);
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      !this.destroyed && this._writableState.finished && this.destroy();
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError),
        this.destroy(),
        0 === this.listenerCount("error") && this.emit("error", err);
    }
    module.exports = function (ws, options) {
      let resumeOnReceiverDrain = !0,
        terminateOnDestroy = !0;
      function receiverOnDrain() {
        resumeOnReceiverDrain && ws._socket.resume();
      }
      ws.readyState === ws.CONNECTING
        ? ws.once("open", function () {
            ws._receiver.removeAllListeners("drain"),
              ws._receiver.on("drain", receiverOnDrain);
          })
        : (ws._receiver.removeAllListeners("drain"),
          ws._receiver.on("drain", receiverOnDrain));
      const duplex = new Duplex({
        ...options,
        autoDestroy: !1,
        emitClose: !1,
        objectMode: !1,
        writableObjectMode: !1,
      });
      return (
        ws.on("message", function (msg) {
          duplex.push(msg) ||
            ((resumeOnReceiverDrain = !1), ws._socket.pause());
        }),
        ws.once("error", function (err) {
          duplex.destroyed || ((terminateOnDestroy = !1), duplex.destroy(err));
        }),
        ws.once("close", function () {
          duplex.destroyed || duplex.push(null);
        }),
        (duplex._destroy = function (err, callback) {
          if (ws.readyState === ws.CLOSED)
            return callback(err), void process.nextTick(emitClose, duplex);
          let called = !1;
          ws.once("error", function (err) {
            (called = !0), callback(err);
          }),
            ws.once("close", function () {
              called || callback(err), process.nextTick(emitClose, duplex);
            }),
            terminateOnDestroy && ws.terminate();
        }),
        (duplex._final = function (callback) {
          ws.readyState !== ws.CONNECTING
            ? null !== ws._socket &&
              (ws._socket._writableState.finished
                ? (callback(),
                  duplex._readableState.endEmitted && duplex.destroy())
                : (ws._socket.once("finish", function () {
                    callback();
                  }),
                  ws.close()))
            : ws.once("open", function () {
                duplex._final(callback);
              });
        }),
        (duplex._read = function () {
          (ws.readyState !== ws.OPEN && ws.readyState !== ws.CLOSING) ||
            resumeOnReceiverDrain ||
            ((resumeOnReceiverDrain = !0),
            ws._receiver._writableState.needDrain || ws._socket.resume());
        }),
        (duplex._write = function (chunk, encoding, callback) {
          ws.readyState !== ws.CONNECTING
            ? ws.send(chunk, callback)
            : ws.once("open", function () {
                duplex._write(chunk, encoding, callback);
              });
        }),
        duplex.on("end", duplexOnEnd),
        duplex.on("error", duplexOnError),
        duplex
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const EventEmitter = __webpack_require__(22),
      http = __webpack_require__(76),
      { createHash: createHash } =
        (__webpack_require__(75),
        __webpack_require__(21),
        __webpack_require__(27),
        __webpack_require__(23)),
      PerMessageDeflate = __webpack_require__(28),
      WebSocket = __webpack_require__(74),
      { format: format, parse: parse } = __webpack_require__(80),
      { GUID: GUID, kWebSocket: kWebSocket } = __webpack_require__(18),
      keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    function emitClose(server) {
      (server._state = 2), server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      socket.writable &&
        ((message = message || http.STATUS_CODES[code]),
        (headers = {
          Connection: "close",
          "Content-Type": "text/html",
          "Content-Length": Buffer.byteLength(message),
          ...headers,
        }),
        socket.write(
          `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
            Object.keys(headers)
              .map((h) => `${h}: ${headers[h]}`)
              .join("\r\n") +
            "\r\n\r\n" +
            message
        )),
        socket.removeListener("error", socketOnError),
        socket.destroy();
    }
    function trim(str) {
      return str.trim();
    }
    module.exports = class extends EventEmitter {
      constructor(options, callback) {
        if (
          (super(),
          (null ==
            (options = {
              maxPayload: 104857600,
              perMessageDeflate: !1,
              handleProtocols: null,
              clientTracking: !0,
              verifyClient: null,
              noServer: !1,
              backlog: null,
              server: null,
              host: null,
              path: null,
              port: null,
              ...options,
            }).port &&
            !options.server &&
            !options.noServer) ||
            (null != options.port && (options.server || options.noServer)) ||
            (options.server && options.noServer))
        )
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        if (
          (null != options.port
            ? ((this._server = http.createServer((req, res) => {
                const body = http.STATUS_CODES[426];
                res.writeHead(426, {
                  "Content-Length": body.length,
                  "Content-Type": "text/plain",
                }),
                  res.end(body);
              })),
              this._server.listen(
                options.port,
                options.host,
                options.backlog,
                callback
              ))
            : options.server && (this._server = options.server),
          this._server)
        ) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = (function (server, map) {
            for (const event of Object.keys(map)) server.on(event, map[event]);
            return function () {
              for (const event of Object.keys(map))
                server.removeListener(event, map[event]);
            };
          })(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            },
          });
        }
        !0 === options.perMessageDeflate && (options.perMessageDeflate = {}),
          options.clientTracking && (this.clients = new Set()),
          (this.options = options),
          (this._state = 0);
      }
      address() {
        if (this.options.noServer)
          throw new Error('The server is operating in "noServer" mode');
        return this._server ? this._server.address() : null;
      }
      close(cb) {
        if ((cb && this.once("close", cb), 2 === this._state))
          return void process.nextTick(emitClose, this);
        if (1 === this._state) return;
        if (((this._state = 1), this.clients))
          for (const client of this.clients) client.terminate();
        const server = this._server;
        server &&
        (this._removeListeners(),
        (this._removeListeners = this._server = null),
        null != this.options.port)
          ? server.close(emitClose.bind(void 0, this))
          : process.nextTick(emitClose, this);
      }
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          if (
            (-1 !== index ? req.url.slice(0, index) : req.url) !==
            this.options.path
          )
            return !1;
        }
        return !0;
      }
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key =
            void 0 !== req.headers["sec-websocket-key"] &&
            req.headers["sec-websocket-key"].trim(),
          version = +req.headers["sec-websocket-version"],
          extensions = {};
        if (
          "GET" !== req.method ||
          "websocket" !== req.headers.upgrade.toLowerCase() ||
          !key ||
          !keyRegex.test(key) ||
          (8 !== version && 13 !== version) ||
          !this.shouldHandle(req)
        )
          return abortHandshake(socket, 400);
        if (this.options.perMessageDeflate) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            !0,
            this.options.maxPayload
          );
          try {
            const offers = parse(req.headers["sec-websocket-extensions"]);
            offers[PerMessageDeflate.extensionName] &&
              (perMessageDeflate.accept(
                offers[PerMessageDeflate.extensionName]
              ),
              (extensions[PerMessageDeflate.extensionName] =
                perMessageDeflate));
          } catch (err) {
            return abortHandshake(socket, 400);
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin:
              req.headers[
                "" + (8 === version ? "sec-websocket-origin" : "origin")
              ],
            secure: !(!req.socket.authorized && !req.socket.encrypted),
            req: req,
          };
          if (2 === this.options.verifyClient.length)
            return void this.options.verifyClient(
              info,
              (verified, code, message, headers) => {
                if (!verified)
                  return abortHandshake(socket, code || 401, message, headers);
                this.completeUpgrade(key, extensions, req, socket, head, cb);
              }
            );
          if (!this.options.verifyClient(info))
            return abortHandshake(socket, 401);
        }
        this.completeUpgrade(key, extensions, req, socket, head, cb);
      }
      completeUpgrade(key, extensions, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket])
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        if (this._state > 0) return abortHandshake(socket, 503);
        const headers = [
            "HTTP/1.1 101 Switching Protocols",
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Accept: ${createHash("sha1")
              .update(key + GUID)
              .digest("base64")}`,
          ],
          ws = new WebSocket(null);
        let protocol = req.headers["sec-websocket-protocol"];
        if (
          (protocol &&
            ((protocol = protocol.split(",").map(trim)),
            (protocol = this.options.handleProtocols
              ? this.options.handleProtocols(protocol, req)
              : protocol[0]),
            protocol &&
              (headers.push(`Sec-WebSocket-Protocol: ${protocol}`),
              (ws._protocol = protocol))),
          extensions[PerMessageDeflate.extensionName])
        ) {
          const params = extensions[PerMessageDeflate.extensionName].params,
            value = format({ [PerMessageDeflate.extensionName]: [params] });
          headers.push(`Sec-WebSocket-Extensions: ${value}`),
            (ws._extensions = extensions);
        }
        this.emit("headers", headers, req),
          socket.write(headers.concat("\r\n").join("\r\n")),
          socket.removeListener("error", socketOnError),
          ws.setSocket(socket, head, this.options.maxPayload),
          this.clients &&
            (this.clients.add(ws),
            ws.on("close", () => this.clients.delete(ws))),
          cb(ws, req);
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.ChatClient = void 0);
    const debugLogger = __webpack_require__(38),
      get_mods_vips_1 = __webpack_require__(198),
      ignore_promise_rejections_1 = __webpack_require__(94),
      connection_1 = __webpack_require__(95),
      privmsg_1 = __webpack_require__(97),
      roomstate_tracker_1 = __webpack_require__(98),
      userstate_tracker_1 = __webpack_require__(43),
      join_1 = __webpack_require__(45),
      join_all_1 = __webpack_require__(99),
      part_1 = __webpack_require__(102),
      ping_1 = __webpack_require__(48),
      privmsg_2 = __webpack_require__(13),
      say_1 = __webpack_require__(103),
      set_color_1 = __webpack_require__(209),
      timeout_1 = __webpack_require__(105),
      ban_1 = __webpack_require__(106),
      whisper_1 = __webpack_require__(107),
      any_cause_instanceof_1 = __webpack_require__(52),
      find_and_push_to_end_1 = __webpack_require__(108),
      remove_in_place_1 = __webpack_require__(109),
      union_sets_1 = __webpack_require__(110),
      channel_1 = __webpack_require__(24),
      base_client_1 = __webpack_require__(36),
      connection_2 = __webpack_require__(111),
      errors_1 = __webpack_require__(1),
      log = debugLogger("dank-twitch-irc:client"),
      alwaysTrue = () => !0;
    class ChatClient extends base_client_1.BaseClient {
      constructor(configuration) {
        super(configuration),
          (this.connectionMixins = []),
          (this.connections = []),
          this.configuration.installDefaultMixins &&
            (this.use(new userstate_tracker_1.UserStateTracker(this)),
            this.use(new roomstate_tracker_1.RoomStateTracker()),
            this.use(new connection_1.ConnectionRateLimiter(this)),
            this.use(new privmsg_1.PrivmsgMessageRateLimiter(this))),
          this.configuration.ignoreUnhandledPromiseRejections &&
            this.use(
              new ignore_promise_rejections_1.IgnoreUnhandledPromiseRejectionsMixin()
            ),
          this.on("error", (error) => {
            any_cause_instanceof_1.anyCauseInstanceof(
              error,
              errors_1.ClientError
            ) &&
              process.nextTick(() => {
                this.emitClosed(error),
                  this.connections.forEach((conn) => conn.destroy(error));
              });
          }),
          this.on("close", () => {
            this.connections.forEach((conn) => conn.close());
          });
      }
      get wantedChannels() {
        return union_sets_1.unionSets(
          this.connections.map((c) => c.wantedChannels)
        );
      }
      get joinedChannels() {
        return union_sets_1.unionSets(
          this.connections.map((c) => c.joinedChannels)
        );
      }
      async connect() {
        return (
          this.requireConnection(),
          await new Promise((resolve) => this.on("ready", () => resolve()))
        );
      }
      close() {
        this.emitClosed();
      }
      destroy(error) {
        null != error
          ? (this.emitError(error), this.emitClosed(error))
          : this.emitClosed();
      }
      sendRaw(command) {
        this.requireConnection().sendRaw(command);
      }
      async join(channelName) {
        if (
          ((channelName = channel_1.correctChannelName(channelName)),
          channel_1.validateChannelName(channelName),
          this.connections.some((c) => join_1.joinNothingToDo(c, channelName)))
        )
          return;
        const conn = this.requireConnection(
          maxJoinedChannels(this.configuration.maxChannelCountPerConnection)
        );
        await join_1.joinChannel(conn, channelName);
      }
      async part(channelName) {
        if (
          ((channelName = channel_1.correctChannelName(channelName)),
          channel_1.validateChannelName(channelName),
          this.connections.every((c) => part_1.partNothingToDo(c, channelName)))
        )
          return;
        const conn = this.requireConnection(
          (c) => !part_1.partNothingToDo(c, channelName)
        );
        await part_1.partChannel(conn, channelName);
      }
      async joinAll(channelNames) {
        const needToJoin = (channelNames = channelNames.map(
            (v) => (
              (v = channel_1.correctChannelName(v)),
              channel_1.validateChannelName(v),
              v
            )
          )).filter(
            (channelName) =>
              !this.connections.some((c) =>
                join_1.joinNothingToDo(c, channelName)
              )
          ),
          promises = [];
        let idx = 0;
        for (; idx < needToJoin.length; ) {
          const conn = this.requireConnection(
              maxJoinedChannels(this.configuration.maxChannelCountPerConnection)
            ),
            canJoin =
              this.configuration.maxChannelCountPerConnection -
              conn.wantedChannels.size,
            channelsSlice = needToJoin.slice(idx, (idx += canJoin));
          promises.push(join_all_1.joinAll(conn, channelsSlice));
        }
        const errorChunks = await Promise.all(promises);
        return Object.assign({}, ...errorChunks);
      }
      async privmsg(channelName, message) {
        return (
          (channelName = channel_1.correctChannelName(channelName)),
          channel_1.validateChannelName(channelName),
          privmsg_2.sendPrivmsg(this.requireConnection(), channelName, message)
        );
      }
      async say(channelName, message) {
        (channelName = channel_1.correctChannelName(channelName)),
          channel_1.validateChannelName(channelName),
          await say_1.say(
            this.requireConnection(mustNotBeJoined(channelName)),
            channelName,
            message
          );
      }
      async me(channelName, message) {
        (channelName = channel_1.correctChannelName(channelName)),
          channel_1.validateChannelName(channelName),
          await say_1.me(
            this.requireConnection(mustNotBeJoined(channelName)),
            channelName,
            message
          );
      }
      async timeout(channelName, username, length, reason) {
        await timeout_1.timeout(
          this.requireConnection(),
          channelName,
          username,
          length,
          reason
        );
      }
      async ban(channelName, username, reason) {
        await ban_1.ban(
          this.requireConnection(),
          channelName,
          username,
          reason
        );
      }
      async whisper(username, message) {
        channel_1.validateChannelName(username),
          await whisper_1.whisper(this.requireConnection(), username, message);
      }
      async setColor(color) {
        await set_color_1.setColor(this.requireConnection(), color);
      }
      async getMods(channelName) {
        return (
          (channelName = channel_1.correctChannelName(channelName)),
          channel_1.validateChannelName(channelName),
          await get_mods_vips_1.getMods(this.requireConnection(), channelName)
        );
      }
      async getVips(channelName) {
        return (
          (channelName = channel_1.correctChannelName(channelName)),
          channel_1.validateChannelName(channelName),
          await get_mods_vips_1.getVips(this.requireConnection(), channelName)
        );
      }
      async ping() {
        await ping_1.sendPing(this.requireConnection());
      }
      newConnection() {
        const conn = new connection_2.SingleConnection(this.configuration);
        log.debug(`Creating new connection (ID ${conn.connectionID})`);
        for (const mixin of this.connectionMixins) conn.use(mixin);
        return (
          conn.on("connecting", () => this.emitConnecting()),
          conn.on("connect", () => this.emitConnected()),
          conn.on("ready", () => this.emitReady()),
          conn.on("error", (error) => this.emitError(error)),
          conn.on("close", (hadError) => {
            hadError
              ? log.warn(
                  `Connection ${conn.connectionID} was closed due to error`
                )
              : log.debug(`Connection ${conn.connectionID} closed normally`),
              remove_in_place_1.removeInPlace(this.connections, conn),
              this.activeWhisperConn === conn &&
                (this.activeWhisperConn = void 0),
              this.closed || this.reconnectFailedConnection(conn);
          }),
          conn.on("rawCommmand", (cmd) => this.emit("rawCommmand", cmd)),
          conn.on("message", (message) => {
            ("WHISPER" === message.ircCommand &&
              (null == this.activeWhisperConn &&
                (this.activeWhisperConn = conn),
              this.activeWhisperConn !== conn)) ||
              this.emitMessage(message);
          }),
          conn.connect(),
          this.connections.push(conn),
          conn
        );
      }
      use(mixin) {
        mixin.applyToClient(this);
      }
      reconnectFailedConnection(conn) {
        const channels = Array.from(conn.wantedChannels);
        channels.length > 0
          ? this.joinAll(channels)
          : this.connections.length <= 0 && this.requireConnection(),
          this.emit("reconnect", conn);
      }
      requireConnection(predicate = alwaysTrue) {
        return (
          find_and_push_to_end_1.findAndPushToEnd(
            this.connections,
            predicate
          ) || this.newConnection()
        );
      }
    }
    function maxJoinedChannels(maxChannelCount) {
      return (conn) => conn.wantedChannels.size < maxChannelCount;
    }
    function mustNotBeJoined(channelName) {
      return (conn) =>
        !conn.wantedChannels.has(channelName) &&
        !conn.joinedChannels.has(channelName);
    }
    exports.ChatClient = ChatClient;
  },
  function (module, exports, __webpack_require__) {
    "undefined" != typeof process && "renderer" === process.type
      ? (module.exports = __webpack_require__(192))
      : (module.exports = __webpack_require__(194));
  },
  function (module, exports, __webpack_require__) {
    function load() {
      var r;
      try {
        r = exports.storage.debug;
      } catch (e) {}
      return (
        !r &&
          "undefined" != typeof process &&
          "env" in process &&
          (r = process.env.DEBUG),
        r
      );
    }
    ((exports = module.exports = __webpack_require__(84)).log = function () {
      return (
        "object" == typeof console &&
        console.log &&
        Function.prototype.apply.call(console.log, console, arguments)
      );
    }),
      (exports.formatArgs = function (args) {
        var useColors = this.useColors;
        if (
          ((args[0] =
            (useColors ? "%c" : "") +
            this.namespace +
            (useColors ? " %c" : " ") +
            args[0] +
            (useColors ? "%c " : " ") +
            "+" +
            exports.humanize(this.diff)),
          !useColors)
        )
          return;
        var c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        var index = 0,
          lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, function (match) {
          "%%" !== match && (index++, "%c" === match && (lastC = index));
        }),
          args.splice(lastC, 0, c);
      }),
      (exports.save = function (namespaces) {
        try {
          null == namespaces
            ? exports.storage.removeItem("debug")
            : (exports.storage.debug = namespaces);
        } catch (e) {}
      }),
      (exports.load = load),
      (exports.useColors = function () {
        if (
          "undefined" != typeof window &&
          window.process &&
          "renderer" === window.process.type
        )
          return !0;
        return (
          ("undefined" != typeof document &&
            document.documentElement &&
            document.documentElement.style &&
            document.documentElement.style.WebkitAppearance) ||
          ("undefined" != typeof window &&
            window.console &&
            (window.console.firebug ||
              (window.console.exception && window.console.table))) ||
          ("undefined" != typeof navigator &&
            navigator.userAgent &&
            navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) &&
            parseInt(RegExp.$1, 10) >= 31) ||
          ("undefined" != typeof navigator &&
            navigator.userAgent &&
            navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
        );
      }),
      (exports.storage =
        "undefined" != typeof chrome && void 0 !== chrome.storage
          ? chrome.storage.local
          : (function () {
              try {
                return window.localStorage;
              } catch (e) {}
            })()),
      (exports.colors = [
        "lightseagreen",
        "forestgreen",
        "goldenrod",
        "dodgerblue",
        "darkorchid",
        "crimson",
      ]),
      (exports.formatters.j = function (v) {
        try {
          return JSON.stringify(v);
        } catch (err) {
          return "[UnexpectedJSONParseError]: " + err.message;
        }
      }),
      exports.enable(load());
  },
  function (module, exports) {
    var s = 1e3,
      m = 60 * s,
      h = 60 * m,
      d = 24 * h,
      y = 365.25 * d;
    function plural(ms, n, name) {
      if (!(ms < n))
        return ms < 1.5 * n
          ? Math.floor(ms / n) + " " + name
          : Math.ceil(ms / n) + " " + name + "s";
    }
    module.exports = function (val, options) {
      options = options || {};
      var ms,
        type = typeof val;
      if ("string" === type && val.length > 0)
        return (function (str) {
          if ((str = String(str)).length > 100) return;
          var match =
            /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
              str
            );
          if (!match) return;
          var n = parseFloat(match[1]);
          switch ((match[2] || "ms").toLowerCase()) {
            case "years":
            case "year":
            case "yrs":
            case "yr":
            case "y":
              return n * y;
            case "days":
            case "day":
            case "d":
              return n * d;
            case "hours":
            case "hour":
            case "hrs":
            case "hr":
            case "h":
              return n * h;
            case "minutes":
            case "minute":
            case "mins":
            case "min":
            case "m":
              return n * m;
            case "seconds":
            case "second":
            case "secs":
            case "sec":
            case "s":
              return n * s;
            case "milliseconds":
            case "millisecond":
            case "msecs":
            case "msec":
            case "ms":
              return n;
            default:
              return;
          }
        })(val);
      if ("number" === type && !1 === isNaN(val))
        return options.long
          ? plural((ms = val), d, "day") ||
              plural(ms, h, "hour") ||
              plural(ms, m, "minute") ||
              plural(ms, s, "second") ||
              ms + " ms"
          : (function (ms) {
              if (ms >= d) return Math.round(ms / d) + "d";
              if (ms >= h) return Math.round(ms / h) + "h";
              if (ms >= m) return Math.round(ms / m) + "m";
              if (ms >= s) return Math.round(ms / s) + "s";
              return ms + "ms";
            })(val);
      throw new Error(
        "val is not a non-empty string or a valid number. val=" +
          JSON.stringify(val)
      );
    };
  },
  function (module, exports, __webpack_require__) {
    var tty = __webpack_require__(34),
      util = __webpack_require__(4);
    ((exports = module.exports = __webpack_require__(84)).init = function (
      debug
    ) {
      debug.inspectOpts = {};
      for (
        var keys = Object.keys(exports.inspectOpts), i = 0;
        i < keys.length;
        i++
      )
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
    }),
      (exports.log = function () {
        return stream.write(util.format.apply(util, arguments) + "\n");
      }),
      (exports.formatArgs = function (args) {
        var name = this.namespace;
        if (this.useColors) {
          var c = this.color,
            prefix = "  [3" + c + ";1m" + name + " [0m";
          (args[0] = prefix + args[0].split("\n").join("\n" + prefix)),
            args.push("[3" + c + "m+" + exports.humanize(this.diff) + "[0m");
        } else args[0] = new Date().toUTCString() + " " + name + " " + args[0];
      }),
      (exports.save = function (namespaces) {
        null == namespaces
          ? delete process.env.DEBUG
          : (process.env.DEBUG = namespaces);
      }),
      (exports.load = load),
      (exports.useColors = function () {
        return "colors" in exports.inspectOpts
          ? Boolean(exports.inspectOpts.colors)
          : tty.isatty(fd);
      }),
      (exports.colors = [6, 2, 3, 4, 5, 1]),
      (exports.inspectOpts = Object.keys(process.env)
        .filter(function (key) {
          return /^debug_/i.test(key);
        })
        .reduce(function (obj, key) {
          var prop = key
              .substring(6)
              .toLowerCase()
              .replace(/_([a-z])/g, function (_, k) {
                return k.toUpperCase();
              }),
            val = process.env[key];
          return (
            (val =
              !!/^(yes|on|true|enabled)$/i.test(val) ||
              (!/^(no|off|false|disabled)$/i.test(val) &&
                ("null" === val ? null : Number(val)))),
            (obj[prop] = val),
            obj
          );
        }, {}));
    var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    1 !== fd &&
      2 !== fd &&
      util.deprecate(function () {},
      "except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)")();
    var stream =
      1 === fd
        ? process.stdout
        : 2 === fd
        ? process.stderr
        : (function (fd) {
            var stream;
            switch (process.binding("tty_wrap").guessHandleType(fd)) {
              case "TTY":
                ((stream = new tty.WriteStream(fd))._type = "tty"),
                  stream._handle &&
                    stream._handle.unref &&
                    stream._handle.unref();
                break;
              case "FILE":
                var fs = __webpack_require__(195);
                (stream = new fs.SyncWriteStream(fd, { autoClose: !1 }))._type =
                  "fs";
                break;
              case "PIPE":
              case "TCP":
                var net = __webpack_require__(21);
                ((stream = new net.Socket({
                  fd: fd,
                  readable: !1,
                  writable: !0,
                })).readable = !1),
                  (stream.read = null),
                  (stream._type = "pipe"),
                  stream._handle &&
                    stream._handle.unref &&
                    stream._handle.unref();
                break;
              default:
                throw new Error("Implement me. Unknown stream file type!");
            }
            return (stream.fd = fd), (stream._isStdio = !0), stream;
          })(fd);
    function load() {
      return process.env.DEBUG;
    }
    (exports.formatters.o = function (v) {
      return (
        (this.inspectOpts.colors = this.useColors),
        util
          .inspect(v, this.inspectOpts)
          .split("\n")
          .map(function (str) {
            return str.trim();
          })
          .join(" ")
      );
    }),
      (exports.formatters.O = function (v) {
        return (
          (this.inspectOpts.colors = this.useColors),
          util.inspect(v, this.inspectOpts)
        );
      }),
      exports.enable(load());
  },
  function (module, exports) {
    module.exports = require("fs");
  },
  function (module, exports) {
    function hook_stream(stream, callback) {
      var write,
        old_write = stream.write;
      return (
        (stream.write =
          ((write = stream.write),
          function (string, encoding, fd) {
            write.apply(stream, arguments), callback(string, encoding, fd);
          })),
        function () {
          stream.write = old_write;
        }
      );
    }
    function getLastCharacter(string, encoding, fd) {
      module.exports.lastCharacter = string.slice(-1);
    }
    var unhook, unhookStderr;
    (module.exports.lastCharacter = "\n"),
      (module.exports.enable = function () {
        unhook || (unhook = hook_stream(process.stdout, getLastCharacter)),
          unhookStderr ||
            (unhookStderr = hook_stream(process.stderr, getLastCharacter));
      }),
      (module.exports.disable = function () {
        unhook && (unhook(), (unhook = void 0)),
          unhookStderr && (unhookStderr(), (unhookStderr = void 0));
      });
  },
  function (module, exports) {
    module.exports = require("assert");
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.getVips = exports.getMods = exports.GetUsersError = void 0);
    const await_response_1 = __webpack_require__(3),
      conditions_1 = __webpack_require__(39),
      errors_1 = __webpack_require__(1),
      getModsInfo = {
        command: "mods",
        msgIdError: "usage_mods",
        msgIdNone: "no_mods",
        msgIdSome: "room_mods",
        someMessagePrefix: "The moderators of this channel are: ",
        someMessageSuffix: "",
      },
      getVipsInfo = {
        command: "vips",
        msgIdError: "usage_vips",
        msgIdNone: "no_vips",
        msgIdSome: "vips_success",
        someMessagePrefix: "The VIPs of this channel are: ",
        someMessageSuffix: ".",
      };
    class GetUsersError extends errors_1.MessageError {
      constructor(channelName, type, message, cause) {
        super(message, cause),
          (this.channelName = channelName),
          (this.type = type);
      }
    }
    async function getModsOrVips(conn, channelName, config) {
      conn.sendRaw(`PRIVMSG #${channelName} :/${config.command}`);
      const responseMsg = await await_response_1.awaitResponse(conn, {
        success: conditions_1.matchingNotice(channelName, [
          config.msgIdNone,
          config.msgIdSome,
        ]),
        failure: conditions_1.matchingNotice(channelName, [config.msgIdError]),
        errorType: (msg, cause) =>
          new GetUsersError(channelName, config.command, msg, cause),
        errorMessage: `Failed to get ${config.command} of channel ${channelName}`,
      });
      if (responseMsg.messageID === config.msgIdNone) return [];
      if (responseMsg.messageID === config.msgIdSome) {
        let text = responseMsg.messageText;
        if (
          !text.startsWith(config.someMessagePrefix) ||
          !text.endsWith(config.someMessageSuffix)
        )
          throw new GetUsersError(
            channelName,
            config.command,
            `Failed to get ${config.command} of channel ${channelName}: Response message had unexpected format: ${responseMsg.rawSource}`
          );
        return (
          (text = text.slice(
            config.someMessagePrefix.length,
            text.length - config.someMessageSuffix.length
          )),
          text.split(", ")
        );
      }
      throw new Error("unreachable");
    }
    (exports.GetUsersError = GetUsersError),
      (exports.getMods = async function (conn, channelName) {
        return await getModsOrVips(conn, channelName, getModsInfo);
      }),
      (exports.getVips = async function (conn, channelName) {
        return await getModsOrVips(conn, channelName, getVipsInfo);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.parseFlags = void 0);
    const flag_1 = __webpack_require__(200);
    exports.parseFlags = function (messageText, flagsSrc) {
      const flags = [],
        matchFlagsSrc = flagsSrc.match(
          /^(,?(?:[0-9]+-[0-9]+:)(?:(?:[ISAP]\.[0-9]+\/?)+)?)+$/g
        );
      if (flagsSrc.length <= 0 || null === matchFlagsSrc) return flags;
      const messageCharacters = [...messageText];
      for (const flagInstancesSrc of flagsSrc.split(",")) {
        const [indexes, instancesSrc] = flagInstancesSrc.split(":", 2);
        let [startIndex, endIndex] = indexes.split("-").map((s) => Number(s));
        (endIndex += 1),
          startIndex < 0 && (startIndex = 0),
          endIndex > messageCharacters.length &&
            (endIndex = messageCharacters.length);
        const flagText = messageCharacters.slice(startIndex, endIndex).join(""),
          categories = [];
        for (const instanceSrc of instancesSrc.split("/"))
          if (instanceSrc.length > 0) {
            const [category, score] = instanceSrc.split(".");
            categories.push({ category: category, score: Number(score) });
          }
        flags.push(
          new flag_1.TwitchFlag(startIndex, endIndex, flagText, categories)
        );
      }
      return flags.sort((a, b) => a.startIndex - b.startIndex), flags;
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.TwitchFlag = void 0);
    exports.TwitchFlag = class {
      constructor(startIndex, endIndex, text, category) {
        (this.startIndex = startIndex),
          (this.endIndex = endIndex),
          (this.word = text),
          (this.categories = category);
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var extendStatics,
      __extends =
        (this && this.__extends) ||
        ((extendStatics =
          Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array &&
            function (d, b) {
              d.__proto__ = b;
            }) ||
          function (d, b) {
            for (var p in b) b.hasOwnProperty(p) && (d[p] = b[p]);
          }),
        function (d, b) {
          function __() {
            this.constructor = d;
          }
          extendStatics(d, b),
            (d.prototype =
              null === b
                ? Object.create(b)
                : ((__.prototype = b.prototype), new __()));
        });
    exports.__esModule = !0;
    var Lock = (function (_super) {
      function Lock() {
        return _super.call(this, 1) || this;
      }
      return __extends(Lock, _super), Lock;
    })(__webpack_require__(96).default);
    exports.Lock = Lock;
  },
  function (module, exports, __webpack_require__) {
    (function (module) {
      var argsTag = "[object Arguments]",
        arrayTag = "[object Array]",
        boolTag = "[object Boolean]",
        mapTag = "[object Map]",
        objectTag = "[object Object]",
        setTag = "[object Set]",
        dataViewTag = "[object DataView]",
        reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
        reIsPlainProp = /^\w*$/,
        reLeadingDot = /^\./,
        rePropName =
          /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
        reEscapeChar = /\\(\\)?/g,
        reIsHostCtor = /^\[object .+?Constructor\]$/,
        reIsUint = /^(?:0|[1-9]\d*)$/,
        typedArrayTags = {};
      (typedArrayTags["[object Float32Array]"] =
        typedArrayTags["[object Float64Array]"] =
        typedArrayTags["[object Int8Array]"] =
        typedArrayTags["[object Int16Array]"] =
        typedArrayTags["[object Int32Array]"] =
        typedArrayTags["[object Uint8Array]"] =
        typedArrayTags["[object Uint8ClampedArray]"] =
        typedArrayTags["[object Uint16Array]"] =
        typedArrayTags["[object Uint32Array]"] =
          !0),
        (typedArrayTags[argsTag] =
          typedArrayTags["[object Array]"] =
          typedArrayTags["[object ArrayBuffer]"] =
          typedArrayTags["[object Boolean]"] =
          typedArrayTags["[object DataView]"] =
          typedArrayTags["[object Date]"] =
          typedArrayTags["[object Error]"] =
          typedArrayTags["[object Function]"] =
          typedArrayTags[mapTag] =
          typedArrayTags["[object Number]"] =
          typedArrayTags[objectTag] =
          typedArrayTags["[object RegExp]"] =
          typedArrayTags[setTag] =
          typedArrayTags["[object String]"] =
          typedArrayTags["[object WeakMap]"] =
            !1);
      var freeGlobal =
          "object" == typeof global &&
          global &&
          global.Object === Object &&
          global,
        freeSelf =
          "object" == typeof self && self && self.Object === Object && self,
        root = freeGlobal || freeSelf || Function("return this")(),
        freeExports = exports && !exports.nodeType && exports,
        freeModule =
          freeExports &&
          "object" == typeof module &&
          module &&
          !module.nodeType &&
          module,
        freeProcess =
          freeModule &&
          freeModule.exports === freeExports &&
          freeGlobal.process,
        nodeUtil = (function () {
          try {
            return freeProcess && freeProcess.binding("util");
          } catch (e) {}
        })(),
        nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
      function arrayPush(array, values) {
        for (
          var index = -1, length = values.length, offset = array.length;
          ++index < length;

        )
          array[offset + index] = values[index];
        return array;
      }
      function arraySome(array, predicate) {
        for (
          var index = -1, length = array ? array.length : 0;
          ++index < length;

        )
          if (predicate(array[index], index, array)) return !0;
        return !1;
      }
      function isHostObject(value) {
        var result = !1;
        if (null != value && "function" != typeof value.toString)
          try {
            result = !!(value + "");
          } catch (e) {}
        return result;
      }
      function mapToArray(map) {
        var index = -1,
          result = Array(map.size);
        return (
          map.forEach(function (value, key) {
            result[++index] = [key, value];
          }),
          result
        );
      }
      function overArg(func, transform) {
        return function (arg) {
          return func(transform(arg));
        };
      }
      function setToArray(set) {
        var index = -1,
          result = Array(set.size);
        return (
          set.forEach(function (value) {
            result[++index] = value;
          }),
          result
        );
      }
      var uid,
        arrayProto = Array.prototype,
        funcProto = Function.prototype,
        objectProto = Object.prototype,
        coreJsData = root["__core-js_shared__"],
        maskSrcKey = (uid = /[^.]+$/.exec(
          (coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO) || ""
        ))
          ? "Symbol(src)_1." + uid
          : "",
        funcToString = funcProto.toString,
        hasOwnProperty = objectProto.hasOwnProperty,
        objectToString = objectProto.toString,
        reIsNative = RegExp(
          "^" +
            funcToString
              .call(hasOwnProperty)
              .replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
              .replace(
                /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
                "$1.*?"
              ) +
            "$"
        ),
        Symbol = root.Symbol,
        Uint8Array = root.Uint8Array,
        getPrototype = overArg(Object.getPrototypeOf, Object),
        propertyIsEnumerable = objectProto.propertyIsEnumerable,
        splice = arrayProto.splice,
        nativeGetSymbols = Object.getOwnPropertySymbols,
        nativeKeys = overArg(Object.keys, Object),
        DataView = getNative(root, "DataView"),
        Map = getNative(root, "Map"),
        Promise = getNative(root, "Promise"),
        Set = getNative(root, "Set"),
        WeakMap = getNative(root, "WeakMap"),
        nativeCreate = getNative(Object, "create"),
        dataViewCtorString = toSource(DataView),
        mapCtorString = toSource(Map),
        promiseCtorString = toSource(Promise),
        setCtorString = toSource(Set),
        weakMapCtorString = toSource(WeakMap),
        symbolProto = Symbol ? Symbol.prototype : void 0,
        symbolValueOf = symbolProto ? symbolProto.valueOf : void 0,
        symbolToString = symbolProto ? symbolProto.toString : void 0;
      function Hash(entries) {
        var index = -1,
          length = entries ? entries.length : 0;
        for (this.clear(); ++index < length; ) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function ListCache(entries) {
        var index = -1,
          length = entries ? entries.length : 0;
        for (this.clear(); ++index < length; ) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function MapCache(entries) {
        var index = -1,
          length = entries ? entries.length : 0;
        for (this.clear(); ++index < length; ) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function SetCache(values) {
        var index = -1,
          length = values ? values.length : 0;
        for (this.__data__ = new MapCache(); ++index < length; )
          this.add(values[index]);
      }
      function Stack(entries) {
        this.__data__ = new ListCache(entries);
      }
      function arrayLikeKeys(value, inherited) {
        var result =
            isArray(value) || isArguments(value)
              ? (function (n, iteratee) {
                  for (var index = -1, result = Array(n); ++index < n; )
                    result[index] = iteratee(index);
                  return result;
                })(value.length, String)
              : [],
          length = result.length,
          skipIndexes = !!length;
        for (var key in value)
          (!inherited && !hasOwnProperty.call(value, key)) ||
            (skipIndexes && ("length" == key || isIndex(key, length))) ||
            result.push(key);
        return result;
      }
      function assocIndexOf(array, key) {
        for (var length = array.length; length--; )
          if (eq(array[length][0], key)) return length;
        return -1;
      }
      function baseGet(object, path) {
        for (
          var index = 0,
            length = (path = isKey(path, object) ? [path] : castPath(path))
              .length;
          null != object && index < length;

        )
          object = object[toKey(path[index++])];
        return index && index == length ? object : void 0;
      }
      function baseHasIn(object, key) {
        return null != object && key in Object(object);
      }
      function baseIsEqual(value, other, customizer, bitmask, stack) {
        return (
          value === other ||
          (null == value ||
          null == other ||
          (!isObject(value) && !isObjectLike(other))
            ? value != value && other != other
            : (function (object, other, equalFunc, customizer, bitmask, stack) {
                var objIsArr = isArray(object),
                  othIsArr = isArray(other),
                  objTag = arrayTag,
                  othTag = arrayTag;
                objIsArr ||
                  (objTag =
                    (objTag = getTag(object)) == argsTag ? objectTag : objTag);
                othIsArr ||
                  (othTag =
                    (othTag = getTag(other)) == argsTag ? objectTag : othTag);
                var objIsObj = objTag == objectTag && !isHostObject(object),
                  othIsObj = othTag == objectTag && !isHostObject(other),
                  isSameTag = objTag == othTag;
                if (isSameTag && !objIsObj)
                  return (
                    stack || (stack = new Stack()),
                    objIsArr || isTypedArray(object)
                      ? equalArrays(
                          object,
                          other,
                          equalFunc,
                          customizer,
                          bitmask,
                          stack
                        )
                      : (function (
                          object,
                          other,
                          tag,
                          equalFunc,
                          customizer,
                          bitmask,
                          stack
                        ) {
                          switch (tag) {
                            case dataViewTag:
                              if (
                                object.byteLength != other.byteLength ||
                                object.byteOffset != other.byteOffset
                              )
                                return !1;
                              (object = object.buffer), (other = other.buffer);
                            case "[object ArrayBuffer]":
                              return !(
                                object.byteLength != other.byteLength ||
                                !equalFunc(
                                  new Uint8Array(object),
                                  new Uint8Array(other)
                                )
                              );
                            case boolTag:
                            case "[object Date]":
                            case "[object Number]":
                              return eq(+object, +other);
                            case "[object Error]":
                              return (
                                object.name == other.name &&
                                object.message == other.message
                              );
                            case "[object RegExp]":
                            case "[object String]":
                              return object == other + "";
                            case mapTag:
                              var convert = mapToArray;
                            case setTag:
                              var isPartial = 2 & bitmask;
                              if (
                                (convert || (convert = setToArray),
                                object.size != other.size && !isPartial)
                              )
                                return !1;
                              var stacked = stack.get(object);
                              if (stacked) return stacked == other;
                              (bitmask |= 1), stack.set(object, other);
                              var result = equalArrays(
                                convert(object),
                                convert(other),
                                equalFunc,
                                customizer,
                                bitmask,
                                stack
                              );
                              return stack.delete(object), result;
                            case "[object Symbol]":
                              if (symbolValueOf)
                                return (
                                  symbolValueOf.call(object) ==
                                  symbolValueOf.call(other)
                                );
                          }
                          return !1;
                        })(
                          object,
                          other,
                          objTag,
                          equalFunc,
                          customizer,
                          bitmask,
                          stack
                        )
                  );
                if (!(2 & bitmask)) {
                  var objIsWrapped =
                      objIsObj && hasOwnProperty.call(object, "__wrapped__"),
                    othIsWrapped =
                      othIsObj && hasOwnProperty.call(other, "__wrapped__");
                  if (objIsWrapped || othIsWrapped) {
                    var objUnwrapped = objIsWrapped ? object.value() : object,
                      othUnwrapped = othIsWrapped ? other.value() : other;
                    return (
                      stack || (stack = new Stack()),
                      equalFunc(
                        objUnwrapped,
                        othUnwrapped,
                        customizer,
                        bitmask,
                        stack
                      )
                    );
                  }
                }
                if (!isSameTag) return !1;
                return (
                  stack || (stack = new Stack()),
                  (function (
                    object,
                    other,
                    equalFunc,
                    customizer,
                    bitmask,
                    stack
                  ) {
                    var isPartial = 2 & bitmask,
                      objProps = keys(object),
                      objLength = objProps.length,
                      othLength = keys(other).length;
                    if (objLength != othLength && !isPartial) return !1;
                    var index = objLength;
                    for (; index--; ) {
                      var key = objProps[index];
                      if (
                        !(isPartial
                          ? key in other
                          : hasOwnProperty.call(other, key))
                      )
                        return !1;
                    }
                    var stacked = stack.get(object);
                    if (stacked && stack.get(other)) return stacked == other;
                    var result = !0;
                    stack.set(object, other), stack.set(other, object);
                    var skipCtor = isPartial;
                    for (; ++index < objLength; ) {
                      var objValue = object[(key = objProps[index])],
                        othValue = other[key];
                      if (customizer)
                        var compared = isPartial
                          ? customizer(
                              othValue,
                              objValue,
                              key,
                              other,
                              object,
                              stack
                            )
                          : customizer(
                              objValue,
                              othValue,
                              key,
                              object,
                              other,
                              stack
                            );
                      if (
                        !(void 0 === compared
                          ? objValue === othValue ||
                            equalFunc(
                              objValue,
                              othValue,
                              customizer,
                              bitmask,
                              stack
                            )
                          : compared)
                      ) {
                        result = !1;
                        break;
                      }
                      skipCtor || (skipCtor = "constructor" == key);
                    }
                    if (result && !skipCtor) {
                      var objCtor = object.constructor,
                        othCtor = other.constructor;
                      objCtor == othCtor ||
                        !("constructor" in object) ||
                        !("constructor" in other) ||
                        ("function" == typeof objCtor &&
                          objCtor instanceof objCtor &&
                          "function" == typeof othCtor &&
                          othCtor instanceof othCtor) ||
                        (result = !1);
                    }
                    return stack.delete(object), stack.delete(other), result;
                  })(object, other, equalFunc, customizer, bitmask, stack)
                );
              })(value, other, baseIsEqual, customizer, bitmask, stack))
        );
      }
      function baseIsNative(value) {
        return (
          !(
            !isObject(value) ||
            ((func = value), maskSrcKey && maskSrcKey in func)
          ) &&
          (isFunction(value) || isHostObject(value)
            ? reIsNative
            : reIsHostCtor
          ).test(toSource(value))
        );
        var func;
      }
      function baseIteratee(value) {
        return "function" == typeof value
          ? value
          : null == value
          ? identity
          : "object" == typeof value
          ? isArray(value)
            ? (function (path, srcValue) {
                if (isKey(path) && isStrictComparable(srcValue))
                  return matchesStrictComparable(toKey(path), srcValue);
                return function (object) {
                  var objValue = (function (object, path, defaultValue) {
                    var result =
                      null == object ? void 0 : baseGet(object, path);
                    return void 0 === result ? defaultValue : result;
                  })(object, path);
                  return void 0 === objValue && objValue === srcValue
                    ? (function (object, path) {
                        return (
                          null != object &&
                          (function (object, path, hasFunc) {
                            path = isKey(path, object)
                              ? [path]
                              : castPath(path);
                            var result,
                              index = -1,
                              length = path.length;
                            for (; ++index < length; ) {
                              var key = toKey(path[index]);
                              if (
                                !(result =
                                  null != object && hasFunc(object, key))
                              )
                                break;
                              object = object[key];
                            }
                            if (result) return result;
                            return (
                              !!(length = object ? object.length : 0) &&
                              isLength(length) &&
                              isIndex(key, length) &&
                              (isArray(object) || isArguments(object))
                            );
                          })(object, path, baseHasIn)
                        );
                      })(object, path)
                    : baseIsEqual(srcValue, objValue, void 0, 3);
                };
              })(value[0], value[1])
            : (function (source) {
                var matchData = (function (object) {
                  var result = keys(object),
                    length = result.length;
                  for (; length--; ) {
                    var key = result[length],
                      value = object[key];
                    result[length] = [key, value, isStrictComparable(value)];
                  }
                  return result;
                })(source);
                if (1 == matchData.length && matchData[0][2])
                  return matchesStrictComparable(
                    matchData[0][0],
                    matchData[0][1]
                  );
                return function (object) {
                  return (
                    object === source ||
                    (function (object, source, matchData, customizer) {
                      var index = matchData.length,
                        length = index,
                        noCustomizer = !customizer;
                      if (null == object) return !length;
                      for (object = Object(object); index--; ) {
                        var data = matchData[index];
                        if (
                          noCustomizer && data[2]
                            ? data[1] !== object[data[0]]
                            : !(data[0] in object)
                        )
                          return !1;
                      }
                      for (; ++index < length; ) {
                        var key = (data = matchData[index])[0],
                          objValue = object[key],
                          srcValue = data[1];
                        if (noCustomizer && data[2]) {
                          if (void 0 === objValue && !(key in object))
                            return !1;
                        } else {
                          var stack = new Stack();
                          if (customizer)
                            var result = customizer(
                              objValue,
                              srcValue,
                              key,
                              object,
                              source,
                              stack
                            );
                          if (
                            !(void 0 === result
                              ? baseIsEqual(
                                  srcValue,
                                  objValue,
                                  customizer,
                                  3,
                                  stack
                                )
                              : result)
                          )
                            return !1;
                        }
                      }
                      return !0;
                    })(object, source, matchData)
                  );
                };
              })(value)
          : isKey((path = value))
          ? ((key = toKey(path)),
            function (object) {
              return null == object ? void 0 : object[key];
            })
          : (function (path) {
              return function (object) {
                return baseGet(object, path);
              };
            })(path);
        var path, key;
      }
      function baseKeysIn(object) {
        if (!isObject(object))
          return (function (object) {
            var result = [];
            if (null != object)
              for (var key in Object(object)) result.push(key);
            return result;
          })(object);
        var isProto = isPrototype(object),
          result = [];
        for (var key in object)
          ("constructor" != key ||
            (!isProto && hasOwnProperty.call(object, key))) &&
            result.push(key);
        return result;
      }
      function castPath(value) {
        return isArray(value) ? value : stringToPath(value);
      }
      function equalArrays(
        array,
        other,
        equalFunc,
        customizer,
        bitmask,
        stack
      ) {
        var isPartial = 2 & bitmask,
          arrLength = array.length,
          othLength = other.length;
        if (arrLength != othLength && !(isPartial && othLength > arrLength))
          return !1;
        var stacked = stack.get(array);
        if (stacked && stack.get(other)) return stacked == other;
        var index = -1,
          result = !0,
          seen = 1 & bitmask ? new SetCache() : void 0;
        for (
          stack.set(array, other), stack.set(other, array);
          ++index < arrLength;

        ) {
          var arrValue = array[index],
            othValue = other[index];
          if (customizer)
            var compared = isPartial
              ? customizer(othValue, arrValue, index, other, array, stack)
              : customizer(arrValue, othValue, index, array, other, stack);
          if (void 0 !== compared) {
            if (compared) continue;
            result = !1;
            break;
          }
          if (seen) {
            if (
              !arraySome(other, function (othValue, othIndex) {
                if (
                  !seen.has(othIndex) &&
                  (arrValue === othValue ||
                    equalFunc(arrValue, othValue, customizer, bitmask, stack))
                )
                  return seen.add(othIndex);
              })
            ) {
              result = !1;
              break;
            }
          } else if (
            arrValue !== othValue &&
            !equalFunc(arrValue, othValue, customizer, bitmask, stack)
          ) {
            result = !1;
            break;
          }
        }
        return stack.delete(array), stack.delete(other), result;
      }
      function getAllKeysIn(object) {
        return (function (object, keysFunc, symbolsFunc) {
          var result = keysFunc(object);
          return isArray(object)
            ? result
            : arrayPush(result, symbolsFunc(object));
        })(object, keysIn, getSymbolsIn);
      }
      function getMapData(map, key) {
        var value,
          type,
          data = map.__data__;
        return (
          "string" == (type = typeof (value = key)) ||
          "number" == type ||
          "symbol" == type ||
          "boolean" == type
            ? "__proto__" !== value
            : null === value
        )
          ? data["string" == typeof key ? "string" : "hash"]
          : data.map;
      }
      function getNative(object, key) {
        var value = (function (object, key) {
          return null == object ? void 0 : object[key];
        })(object, key);
        return baseIsNative(value) ? value : void 0;
      }
      (Hash.prototype.clear = function () {
        this.__data__ = nativeCreate ? nativeCreate(null) : {};
      }),
        (Hash.prototype.delete = function (key) {
          return this.has(key) && delete this.__data__[key];
        }),
        (Hash.prototype.get = function (key) {
          var data = this.__data__;
          if (nativeCreate) {
            var result = data[key];
            return "__lodash_hash_undefined__" === result ? void 0 : result;
          }
          return hasOwnProperty.call(data, key) ? data[key] : void 0;
        }),
        (Hash.prototype.has = function (key) {
          var data = this.__data__;
          return nativeCreate
            ? void 0 !== data[key]
            : hasOwnProperty.call(data, key);
        }),
        (Hash.prototype.set = function (key, value) {
          return (
            (this.__data__[key] =
              nativeCreate && void 0 === value
                ? "__lodash_hash_undefined__"
                : value),
            this
          );
        }),
        (ListCache.prototype.clear = function () {
          this.__data__ = [];
        }),
        (ListCache.prototype.delete = function (key) {
          var data = this.__data__,
            index = assocIndexOf(data, key);
          return (
            !(index < 0) &&
            (index == data.length - 1
              ? data.pop()
              : splice.call(data, index, 1),
            !0)
          );
        }),
        (ListCache.prototype.get = function (key) {
          var data = this.__data__,
            index = assocIndexOf(data, key);
          return index < 0 ? void 0 : data[index][1];
        }),
        (ListCache.prototype.has = function (key) {
          return assocIndexOf(this.__data__, key) > -1;
        }),
        (ListCache.prototype.set = function (key, value) {
          var data = this.__data__,
            index = assocIndexOf(data, key);
          return (
            index < 0 ? data.push([key, value]) : (data[index][1] = value), this
          );
        }),
        (MapCache.prototype.clear = function () {
          this.__data__ = {
            hash: new Hash(),
            map: new (Map || ListCache)(),
            string: new Hash(),
          };
        }),
        (MapCache.prototype.delete = function (key) {
          return getMapData(this, key).delete(key);
        }),
        (MapCache.prototype.get = function (key) {
          return getMapData(this, key).get(key);
        }),
        (MapCache.prototype.has = function (key) {
          return getMapData(this, key).has(key);
        }),
        (MapCache.prototype.set = function (key, value) {
          return getMapData(this, key).set(key, value), this;
        }),
        (SetCache.prototype.add = SetCache.prototype.push =
          function (value) {
            return this.__data__.set(value, "__lodash_hash_undefined__"), this;
          }),
        (SetCache.prototype.has = function (value) {
          return this.__data__.has(value);
        }),
        (Stack.prototype.clear = function () {
          this.__data__ = new ListCache();
        }),
        (Stack.prototype.delete = function (key) {
          return this.__data__.delete(key);
        }),
        (Stack.prototype.get = function (key) {
          return this.__data__.get(key);
        }),
        (Stack.prototype.has = function (key) {
          return this.__data__.has(key);
        }),
        (Stack.prototype.set = function (key, value) {
          var cache = this.__data__;
          if (cache instanceof ListCache) {
            var pairs = cache.__data__;
            if (!Map || pairs.length < 199)
              return pairs.push([key, value]), this;
            cache = this.__data__ = new MapCache(pairs);
          }
          return cache.set(key, value), this;
        });
      var getSymbols = nativeGetSymbols
          ? overArg(nativeGetSymbols, Object)
          : stubArray,
        getSymbolsIn = nativeGetSymbols
          ? function (object) {
              for (var result = []; object; )
                arrayPush(result, getSymbols(object)),
                  (object = getPrototype(object));
              return result;
            }
          : stubArray,
        getTag = function (value) {
          return objectToString.call(value);
        };
      function isIndex(value, length) {
        return (
          !!(length = null == length ? 9007199254740991 : length) &&
          ("number" == typeof value || reIsUint.test(value)) &&
          value > -1 &&
          value % 1 == 0 &&
          value < length
        );
      }
      function isKey(value, object) {
        if (isArray(value)) return !1;
        var type = typeof value;
        return (
          !(
            "number" != type &&
            "symbol" != type &&
            "boolean" != type &&
            null != value &&
            !isSymbol(value)
          ) ||
          reIsPlainProp.test(value) ||
          !reIsDeepProp.test(value) ||
          (null != object && value in Object(object))
        );
      }
      function isPrototype(value) {
        var Ctor = value && value.constructor;
        return (
          value ===
          (("function" == typeof Ctor && Ctor.prototype) || objectProto)
        );
      }
      function isStrictComparable(value) {
        return value == value && !isObject(value);
      }
      function matchesStrictComparable(key, srcValue) {
        return function (object) {
          return (
            null != object &&
            object[key] === srcValue &&
            (void 0 !== srcValue || key in Object(object))
          );
        };
      }
      ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
        (Map && getTag(new Map()) != mapTag) ||
        (Promise && "[object Promise]" != getTag(Promise.resolve())) ||
        (Set && getTag(new Set()) != setTag) ||
        (WeakMap && "[object WeakMap]" != getTag(new WeakMap()))) &&
        (getTag = function (value) {
          var result = objectToString.call(value),
            Ctor = result == objectTag ? value.constructor : void 0,
            ctorString = Ctor ? toSource(Ctor) : void 0;
          if (ctorString)
            switch (ctorString) {
              case dataViewCtorString:
                return dataViewTag;
              case mapCtorString:
                return mapTag;
              case promiseCtorString:
                return "[object Promise]";
              case setCtorString:
                return setTag;
              case weakMapCtorString:
                return "[object WeakMap]";
            }
          return result;
        });
      var stringToPath = memoize(function (string) {
        var value;
        string =
          null == (value = string)
            ? ""
            : (function (value) {
                if ("string" == typeof value) return value;
                if (isSymbol(value))
                  return symbolToString ? symbolToString.call(value) : "";
                var result = value + "";
                return "0" == result && 1 / value == -1 / 0 ? "-0" : result;
              })(value);
        var result = [];
        return (
          reLeadingDot.test(string) && result.push(""),
          string.replace(rePropName, function (match, number, quote, string) {
            result.push(
              quote ? string.replace(reEscapeChar, "$1") : number || match
            );
          }),
          result
        );
      });
      function toKey(value) {
        if ("string" == typeof value || isSymbol(value)) return value;
        var result = value + "";
        return "0" == result && 1 / value == -Infinity ? "-0" : result;
      }
      function toSource(func) {
        if (null != func) {
          try {
            return funcToString.call(func);
          } catch (e) {}
          try {
            return func + "";
          } catch (e) {}
        }
        return "";
      }
      function memoize(func, resolver) {
        if (
          "function" != typeof func ||
          (resolver && "function" != typeof resolver)
        )
          throw new TypeError("Expected a function");
        var memoized = function () {
          var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;
          if (cache.has(key)) return cache.get(key);
          var result = func.apply(this, args);
          return (memoized.cache = cache.set(key, result)), result;
        };
        return (memoized.cache = new (memoize.Cache || MapCache)()), memoized;
      }
      function eq(value, other) {
        return value === other || (value != value && other != other);
      }
      function isArguments(value) {
        return (
          (function (value) {
            return isObjectLike(value) && isArrayLike(value);
          })(value) &&
          hasOwnProperty.call(value, "callee") &&
          (!propertyIsEnumerable.call(value, "callee") ||
            objectToString.call(value) == argsTag)
        );
      }
      memoize.Cache = MapCache;
      var isArray = Array.isArray;
      function isArrayLike(value) {
        return null != value && isLength(value.length) && !isFunction(value);
      }
      function isFunction(value) {
        var tag = isObject(value) ? objectToString.call(value) : "";
        return (
          "[object Function]" == tag || "[object GeneratorFunction]" == tag
        );
      }
      function isLength(value) {
        return (
          "number" == typeof value &&
          value > -1 &&
          value % 1 == 0 &&
          value <= 9007199254740991
        );
      }
      function isObject(value) {
        var type = typeof value;
        return !!value && ("object" == type || "function" == type);
      }
      function isObjectLike(value) {
        return !!value && "object" == typeof value;
      }
      function isSymbol(value) {
        return (
          "symbol" == typeof value ||
          (isObjectLike(value) &&
            "[object Symbol]" == objectToString.call(value))
        );
      }
      var func,
        isTypedArray = nodeIsTypedArray
          ? ((func = nodeIsTypedArray),
            function (value) {
              return func(value);
            })
          : function (value) {
              return (
                isObjectLike(value) &&
                isLength(value.length) &&
                !!typedArrayTags[objectToString.call(value)]
              );
            };
      function keys(object) {
        return isArrayLike(object)
          ? arrayLikeKeys(object)
          : (function (object) {
              if (!isPrototype(object)) return nativeKeys(object);
              var result = [];
              for (var key in Object(object))
                hasOwnProperty.call(object, key) &&
                  "constructor" != key &&
                  result.push(key);
              return result;
            })(object);
      }
      function keysIn(object) {
        return isArrayLike(object)
          ? arrayLikeKeys(object, !0)
          : baseKeysIn(object);
      }
      function identity(value) {
        return value;
      }
      function stubArray() {
        return [];
      }
      module.exports = function (object, predicate) {
        return null == object
          ? {}
          : (function (object, props, predicate) {
              for (
                var index = -1, length = props.length, result = {};
                ++index < length;

              ) {
                var key = props[index],
                  value = object[key];
                predicate(value, key) && (result[key] = value);
              }
              return result;
            })(object, getAllKeysIn(object), baseIteratee(predicate));
      };
    }.call(this, __webpack_require__(203)(module)));
  },
  function (module, exports) {
    module.exports = function (module) {
      return (
        module.webpackPolyfill ||
          ((module.deprecate = function () {}),
          (module.paths = []),
          module.children || (module.children = []),
          Object.defineProperty(module, "loaded", {
            enumerable: !0,
            get: function () {
              return module.l;
            },
          }),
          Object.defineProperty(module, "id", {
            enumerable: !0,
            get: function () {
              return module.i;
            },
          }),
          (module.webpackPolyfill = 1)),
        module
      );
    };
  },
  function (module, exports, __webpack_require__) {
    module.exports = __webpack_require__(205);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var randomBytes = __webpack_require__(206),
      Charset = __webpack_require__(207);
    function safeRandomBytes(length) {
      for (;;)
        try {
          return randomBytes(length);
        } catch (e) {
          continue;
        }
    }
    function processString(buf, initialString, chars, reqLen, maxByte) {
      for (
        var string = initialString, i = 0;
        i < buf.length && string.length < reqLen;
        i++
      ) {
        var randomByte = buf.readUInt8(i);
        randomByte < maxByte &&
          (string += chars.charAt(randomByte % chars.length));
      }
      return string;
    }
    function getAsyncString(string, chars, length, maxByte, cb) {
      randomBytes(length, function (err, buf) {
        err && cb(err);
        var generatedString = processString(
          buf,
          string,
          chars,
          length,
          maxByte
        );
        generatedString.length < length
          ? getAsyncString(generatedString, chars, length, maxByte, cb)
          : cb(null, generatedString);
      });
    }
    exports.generate = function (options, cb) {
      var length,
        charset = new Charset(),
        string = "";
      "object" == typeof options
        ? ((length = options.length || 32),
          options.charset
            ? charset.setType(options.charset)
            : charset.setType("alphanumeric"),
          options.capitalization &&
            charset.setcapitalization(options.capitalization),
          options.readable && charset.removeUnreadable(),
          charset.removeDuplicates())
        : "number" == typeof options
        ? ((length = options), charset.setType("alphanumeric"))
        : ((length = 32), charset.setType("alphanumeric"));
      var maxByte = 256 - (256 % charset.chars.length);
      if (!cb) {
        for (; string.length < length; ) {
          string = processString(
            safeRandomBytes(Math.ceil((256 * length) / maxByte)),
            string,
            charset.chars,
            length,
            maxByte
          );
        }
        return string;
      }
      getAsyncString(string, charset.chars, length, maxByte, cb);
    };
  },
  function (module, exports, __webpack_require__) {
    module.exports = __webpack_require__(23).randomBytes;
  },
  function (module, exports, __webpack_require__) {
    var arrayUniq = __webpack_require__(208);
    function Charset() {
      this.chars = "";
    }
    (Charset.prototype.setType = function (type) {
      var chars,
        charsLower = "abcdefghijklmnopqrstuvwxyz",
        charsUpper = charsLower.toUpperCase();
      (chars =
        "alphanumeric" === type
          ? "0123456789" + charsLower + charsUpper
          : "numeric" === type
          ? "0123456789"
          : "alphabetic" === type
          ? charsLower + charsUpper
          : "hex" === type
          ? "0123456789abcdef"
          : "binary" === type
          ? "01"
          : "octal" === type
          ? "01234567"
          : type),
        (this.chars = chars);
    }),
      (Charset.prototype.removeUnreadable = function () {
        this.chars = this.chars.replace(/[0OIl]/g, "");
      }),
      (Charset.prototype.setcapitalization = function (capitalization) {
        "uppercase" === capitalization
          ? (this.chars = this.chars.toUpperCase())
          : "lowercase" === capitalization &&
            (this.chars = this.chars.toLowerCase());
      }),
      (Charset.prototype.removeDuplicates = function () {
        var charMap = this.chars.split("");
        (charMap = arrayUniq(charMap)), (this.chars = charMap.join(""));
      }),
      (module.exports = Charset);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var ret;
    "Set" in global
      ? "function" == typeof Set.prototype.forEach &&
        ((ret = !1),
        new Set([!0]).forEach(function (el) {
          ret = el;
        }),
        !0 === ret)
        ? (module.exports = function (arr) {
            var ret = [];
            return (
              new Set(arr).forEach(function (el) {
                ret.push(el);
              }),
              ret
            );
          })
        : (module.exports = function (arr) {
            var seen = new Set();
            return arr.filter(function (el) {
              if (!seen.has(el)) return seen.add(el), !0;
            });
          })
      : (module.exports = function (arr) {
          for (var ret = [], i = 0; i < arr.length; i++)
            -1 === ret.indexOf(arr[i]) && ret.push(arr[i]);
          return ret;
        });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.setColor = exports.SetColorError = void 0);
    const await_response_1 = __webpack_require__(3),
      errors_1 = __webpack_require__(1),
      color_1 = __webpack_require__(104),
      notice_1 = __webpack_require__(10),
      privmsg_1 = __webpack_require__(13);
    class SetColorError extends errors_1.MessageError {
      constructor(wantedColor, message, cause) {
        super(message, cause), (this.wantedColor = wantedColor);
      }
    }
    exports.SetColorError = SetColorError;
    const badNoticeIDs = ["turbo_only_color", "usage_color"];
    exports.setColor = async function (conn, color) {
      const colorAsHex = color_1.colorToHexString(color);
      privmsg_1.sendPrivmsg(
        conn,
        conn.configuration.username,
        `/color ${colorAsHex}`
      ),
        await await_response_1.awaitResponse(conn, {
          failure: (msg) =>
            msg instanceof notice_1.NoticeMessage &&
            msg.channelName === conn.configuration.username &&
            badNoticeIDs.includes(msg.messageID),
          success: (msg) =>
            msg instanceof notice_1.NoticeMessage &&
            msg.channelName === conn.configuration.username &&
            "color_changed" === msg.messageID,
          errorType: (msg, cause) => new SetColorError(color, msg, cause),
          errorMessage: `Failed to set color to ${colorAsHex}`,
        });
    };
  },
  function (module, exports) {
    var s = 1e3,
      m = 60 * s,
      h = 60 * m,
      d = 24 * h,
      w = 7 * d,
      y = 365.25 * d;
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= 1.5 * n;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
    module.exports = function (val, options) {
      options = options || {};
      var type = typeof val;
      if ("string" === type && val.length > 0)
        return (function (str) {
          if ((str = String(str)).length > 100) return;
          var match =
            /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
              str
            );
          if (!match) return;
          var n = parseFloat(match[1]);
          switch ((match[2] || "ms").toLowerCase()) {
            case "years":
            case "year":
            case "yrs":
            case "yr":
            case "y":
              return n * y;
            case "weeks":
            case "week":
            case "w":
              return n * w;
            case "days":
            case "day":
            case "d":
              return n * d;
            case "hours":
            case "hour":
            case "hrs":
            case "hr":
            case "h":
              return n * h;
            case "minutes":
            case "minute":
            case "mins":
            case "min":
            case "m":
              return n * m;
            case "seconds":
            case "second":
            case "secs":
            case "sec":
            case "s":
              return n * s;
            case "milliseconds":
            case "millisecond":
            case "msecs":
            case "msec":
            case "ms":
              return n;
            default:
              return;
          }
        })(val);
      if ("number" === type && isFinite(val))
        return options.long
          ? (function (ms) {
              var msAbs = Math.abs(ms);
              if (msAbs >= d) return plural(ms, msAbs, d, "day");
              if (msAbs >= h) return plural(ms, msAbs, h, "hour");
              if (msAbs >= m) return plural(ms, msAbs, m, "minute");
              if (msAbs >= s) return plural(ms, msAbs, s, "second");
              return ms + " ms";
            })(val)
          : (function (ms) {
              var msAbs = Math.abs(ms);
              if (msAbs >= d) return Math.round(ms / d) + "d";
              if (msAbs >= h) return Math.round(ms / h) + "h";
              if (msAbs >= m) return Math.round(ms / m) + "m";
              if (msAbs >= s) return Math.round(ms / s) + "s";
              return ms + "ms";
            })(val);
      throw new Error(
        "val is not a non-empty string or a valid number. val=" +
          JSON.stringify(val)
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    const { Transform: Transform } = __webpack_require__(212),
      { StringDecoder: StringDecoder } = __webpack_require__(218),
      kLast = Symbol("last"),
      kDecoder = Symbol("decoder");
    function transform(chunk, enc, cb) {
      var list;
      if (this.overflow) {
        if (
          1 === (list = this[kDecoder].write(chunk).split(this.matcher)).length
        )
          return cb();
        list.shift(), (this.overflow = !1);
      } else
        (this[kLast] += this[kDecoder].write(chunk)),
          (list = this[kLast].split(this.matcher));
      this[kLast] = list.pop();
      for (var i = 0; i < list.length; i++)
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      if (
        ((this.overflow = this[kLast].length > this.maxLength),
        this.overflow && !this.skipOverflow)
      )
        return cb(new Error("maximum buffer reached"));
      cb();
    }
    function flush(cb) {
      if (((this[kLast] += this[kDecoder].end()), this[kLast]))
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      cb();
    }
    function push(self, val) {
      void 0 !== val && self.push(val);
    }
    function noop(incoming) {
      return incoming;
    }
    module.exports = function (matcher, mapper, options) {
      switch (
        ((matcher = matcher || /\r?\n/),
        (mapper = mapper || noop),
        (options = options || {}),
        arguments.length)
      ) {
        case 1:
          "function" == typeof matcher
            ? ((mapper = matcher), (matcher = /\r?\n/))
            : "object" != typeof matcher ||
              matcher instanceof RegExp ||
              ((options = matcher), (matcher = /\r?\n/));
          break;
        case 2:
          "function" == typeof matcher
            ? ((options = mapper), (mapper = matcher), (matcher = /\r?\n/))
            : "object" == typeof mapper &&
              ((options = mapper), (mapper = noop));
      }
      ((options = Object.assign({}, options)).transform = transform),
        (options.flush = flush),
        (options.readableObjectMode = !0);
      const stream = new Transform(options);
      return (
        (stream[kLast] = ""),
        (stream[kDecoder] = new StringDecoder("utf8")),
        (stream.matcher = matcher),
        (stream.mapper = mapper),
        (stream.maxLength = options.maxLength),
        (stream.skipOverflow = options.skipOverflow),
        (stream.overflow = !1),
        stream
      );
    };
  },
  function (module, exports, __webpack_require__) {
    var Stream = __webpack_require__(6);
    "disable" === process.env.READABLE_STREAM && Stream
      ? ((module.exports = Stream.Readable),
        Object.assign(module.exports, Stream),
        (module.exports.Stream = Stream))
      : (((exports = module.exports = __webpack_require__(112)).Stream =
          Stream || exports),
        (exports.Readable = exports),
        (exports.Writable = __webpack_require__(116)),
        (exports.Duplex = __webpack_require__(20)),
        (exports.Transform = __webpack_require__(117)),
        (exports.PassThrough = __webpack_require__(216)),
        (exports.finished = __webpack_require__(53)),
        (exports.pipeline = __webpack_require__(217)));
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly &&
          (symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          })),
          keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        (descriptor.enumerable = descriptor.enumerable || !1),
          (descriptor.configurable = !0),
          "value" in descriptor && (descriptor.writable = !0),
          Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    var Buffer = __webpack_require__(7).Buffer,
      inspect = __webpack_require__(4).inspect,
      custom = (inspect && inspect.custom) || "inspect";
    module.exports = (function () {
      function BufferList() {
        !(function (instance, Constructor) {
          if (!(instance instanceof Constructor))
            throw new TypeError("Cannot call a class as a function");
        })(this, BufferList),
          (this.head = null),
          (this.tail = null),
          (this.length = 0);
      }
      var Constructor, protoProps, staticProps;
      return (
        (Constructor = BufferList),
        (protoProps = [
          {
            key: "push",
            value: function (v) {
              var entry = { data: v, next: null };
              this.length > 0 ? (this.tail.next = entry) : (this.head = entry),
                (this.tail = entry),
                ++this.length;
            },
          },
          {
            key: "unshift",
            value: function (v) {
              var entry = { data: v, next: this.head };
              0 === this.length && (this.tail = entry),
                (this.head = entry),
                ++this.length;
            },
          },
          {
            key: "shift",
            value: function () {
              if (0 !== this.length) {
                var ret = this.head.data;
                return (
                  1 === this.length
                    ? (this.head = this.tail = null)
                    : (this.head = this.head.next),
                  --this.length,
                  ret
                );
              }
            },
          },
          {
            key: "clear",
            value: function () {
              (this.head = this.tail = null), (this.length = 0);
            },
          },
          {
            key: "join",
            value: function (s) {
              if (0 === this.length) return "";
              for (var p = this.head, ret = "" + p.data; (p = p.next); )
                ret += s + p.data;
              return ret;
            },
          },
          {
            key: "concat",
            value: function (n) {
              if (0 === this.length) return Buffer.alloc(0);
              for (
                var src,
                  target,
                  offset,
                  ret = Buffer.allocUnsafe(n >>> 0),
                  p = this.head,
                  i = 0;
                p;

              )
                (src = p.data),
                  (target = ret),
                  (offset = i),
                  Buffer.prototype.copy.call(src, target, offset),
                  (i += p.data.length),
                  (p = p.next);
              return ret;
            },
          },
          {
            key: "consume",
            value: function (n, hasStrings) {
              var ret;
              return (
                n < this.head.data.length
                  ? ((ret = this.head.data.slice(0, n)),
                    (this.head.data = this.head.data.slice(n)))
                  : (ret =
                      n === this.head.data.length
                        ? this.shift()
                        : hasStrings
                        ? this._getString(n)
                        : this._getBuffer(n)),
                ret
              );
            },
          },
          {
            key: "first",
            value: function () {
              return this.head.data;
            },
          },
          {
            key: "_getString",
            value: function (n) {
              var p = this.head,
                c = 1,
                ret = p.data;
              for (n -= ret.length; (p = p.next); ) {
                var str = p.data,
                  nb = n > str.length ? str.length : n;
                if (
                  (nb === str.length ? (ret += str) : (ret += str.slice(0, n)),
                  0 == (n -= nb))
                ) {
                  nb === str.length
                    ? (++c,
                      p.next
                        ? (this.head = p.next)
                        : (this.head = this.tail = null))
                    : ((this.head = p), (p.data = str.slice(nb)));
                  break;
                }
                ++c;
              }
              return (this.length -= c), ret;
            },
          },
          {
            key: "_getBuffer",
            value: function (n) {
              var ret = Buffer.allocUnsafe(n),
                p = this.head,
                c = 1;
              for (p.data.copy(ret), n -= p.data.length; (p = p.next); ) {
                var buf = p.data,
                  nb = n > buf.length ? buf.length : n;
                if ((buf.copy(ret, ret.length - n, 0, nb), 0 == (n -= nb))) {
                  nb === buf.length
                    ? (++c,
                      p.next
                        ? (this.head = p.next)
                        : (this.head = this.tail = null))
                    : ((this.head = p), (p.data = buf.slice(nb)));
                  break;
                }
                ++c;
              }
              return (this.length -= c), ret;
            },
          },
          {
            key: custom,
            value: function (_, options) {
              return inspect(
                this,
                (function (target) {
                  for (var i = 1; i < arguments.length; i++) {
                    var source = null != arguments[i] ? arguments[i] : {};
                    i % 2
                      ? ownKeys(Object(source), !0).forEach(function (key) {
                          _defineProperty(target, key, source[key]);
                        })
                      : Object.getOwnPropertyDescriptors
                      ? Object.defineProperties(
                          target,
                          Object.getOwnPropertyDescriptors(source)
                        )
                      : ownKeys(Object(source)).forEach(function (key) {
                          Object.defineProperty(
                            target,
                            key,
                            Object.getOwnPropertyDescriptor(source, key)
                          );
                        });
                  }
                  return target;
                })({}, options, { depth: 0, customInspect: !1 })
              );
            },
          },
        ]) && _defineProperties(Constructor.prototype, protoProps),
        staticProps && _defineProperties(Constructor, staticProps),
        BufferList
      );
    })();
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var _Object$setPrototypeO;
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    var finished = __webpack_require__(53),
      kLastResolve = Symbol("lastResolve"),
      kLastReject = Symbol("lastReject"),
      kError = Symbol("error"),
      kEnded = Symbol("ended"),
      kLastPromise = Symbol("lastPromise"),
      kHandlePromise = Symbol("handlePromise"),
      kStream = Symbol("stream");
    function createIterResult(value, done) {
      return { value: value, done: done };
    }
    function readAndResolve(iter) {
      var resolve = iter[kLastResolve];
      if (null !== resolve) {
        var data = iter[kStream].read();
        null !== data &&
          ((iter[kLastPromise] = null),
          (iter[kLastResolve] = null),
          (iter[kLastReject] = null),
          resolve(createIterResult(data, !1)));
      }
    }
    function onReadable(iter) {
      process.nextTick(readAndResolve, iter);
    }
    var AsyncIteratorPrototype = Object.getPrototypeOf(function () {}),
      ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf(
        (_defineProperty(
          (_Object$setPrototypeO = {
            get stream() {
              return this[kStream];
            },
            next: function () {
              var _this = this,
                error = this[kError];
              if (null !== error) return Promise.reject(error);
              if (this[kEnded])
                return Promise.resolve(createIterResult(void 0, !0));
              if (this[kStream].destroyed)
                return new Promise(function (resolve, reject) {
                  process.nextTick(function () {
                    _this[kError]
                      ? reject(_this[kError])
                      : resolve(createIterResult(void 0, !0));
                  });
                });
              var promise,
                lastPromise = this[kLastPromise];
              if (lastPromise)
                promise = new Promise(
                  (function (lastPromise, iter) {
                    return function (resolve, reject) {
                      lastPromise.then(function () {
                        iter[kEnded]
                          ? resolve(createIterResult(void 0, !0))
                          : iter[kHandlePromise](resolve, reject);
                      }, reject);
                    };
                  })(lastPromise, this)
                );
              else {
                var data = this[kStream].read();
                if (null !== data)
                  return Promise.resolve(createIterResult(data, !1));
                promise = new Promise(this[kHandlePromise]);
              }
              return (this[kLastPromise] = promise), promise;
            },
          }),
          Symbol.asyncIterator,
          function () {
            return this;
          }
        ),
        _defineProperty(_Object$setPrototypeO, "return", function () {
          var _this2 = this;
          return new Promise(function (resolve, reject) {
            _this2[kStream].destroy(null, function (err) {
              err ? reject(err) : resolve(createIterResult(void 0, !0));
            });
          });
        }),
        _Object$setPrototypeO),
        AsyncIteratorPrototype
      );
    module.exports = function (stream) {
      var _Object$create,
        iterator = Object.create(
          ReadableStreamAsyncIteratorPrototype,
          (_defineProperty((_Object$create = {}), kStream, {
            value: stream,
            writable: !0,
          }),
          _defineProperty(_Object$create, kLastResolve, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kLastReject, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kError, {
            value: null,
            writable: !0,
          }),
          _defineProperty(_Object$create, kEnded, {
            value: stream._readableState.endEmitted,
            writable: !0,
          }),
          _defineProperty(_Object$create, kHandlePromise, {
            value: function (resolve, reject) {
              var data = iterator[kStream].read();
              data
                ? ((iterator[kLastPromise] = null),
                  (iterator[kLastResolve] = null),
                  (iterator[kLastReject] = null),
                  resolve(createIterResult(data, !1)))
                : ((iterator[kLastResolve] = resolve),
                  (iterator[kLastReject] = reject));
            },
            writable: !0,
          }),
          _Object$create)
        );
      return (
        (iterator[kLastPromise] = null),
        finished(stream, function (err) {
          if (err && "ERR_STREAM_PREMATURE_CLOSE" !== err.code) {
            var reject = iterator[kLastReject];
            return (
              null !== reject &&
                ((iterator[kLastPromise] = null),
                (iterator[kLastResolve] = null),
                (iterator[kLastReject] = null),
                reject(err)),
              void (iterator[kError] = err)
            );
          }
          var resolve = iterator[kLastResolve];
          null !== resolve &&
            ((iterator[kLastPromise] = null),
            (iterator[kLastResolve] = null),
            (iterator[kLastReject] = null),
            resolve(createIterResult(void 0, !0))),
            (iterator[kEnded] = !0);
        }),
        stream.on("readable", onReadable.bind(null, iterator)),
        iterator
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg),
          value = info.value;
      } catch (error) {
        return void reject(error);
      }
      info.done ? resolve(value) : Promise.resolve(value).then(_next, _throw);
    }
    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
          args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);
          function _next(value) {
            asyncGeneratorStep(
              gen,
              resolve,
              reject,
              _next,
              _throw,
              "next",
              value
            );
          }
          function _throw(err) {
            asyncGeneratorStep(
              gen,
              resolve,
              reject,
              _next,
              _throw,
              "throw",
              err
            );
          }
          _next(void 0);
        });
      };
    }
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly &&
          (symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          })),
          keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _defineProperty(obj, key, value) {
      return (
        key in obj
          ? Object.defineProperty(obj, key, {
              value: value,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (obj[key] = value),
        obj
      );
    }
    var ERR_INVALID_ARG_TYPE =
      __webpack_require__(14).codes.ERR_INVALID_ARG_TYPE;
    module.exports = function (Readable, iterable, opts) {
      var iterator;
      if (iterable && "function" == typeof iterable.next) iterator = iterable;
      else if (iterable && iterable[Symbol.asyncIterator])
        iterator = iterable[Symbol.asyncIterator]();
      else {
        if (!iterable || !iterable[Symbol.iterator])
          throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
        iterator = iterable[Symbol.iterator]();
      }
      var readable = new Readable(
          (function (target) {
            for (var i = 1; i < arguments.length; i++) {
              var source = null != arguments[i] ? arguments[i] : {};
              i % 2
                ? ownKeys(Object(source), !0).forEach(function (key) {
                    _defineProperty(target, key, source[key]);
                  })
                : Object.getOwnPropertyDescriptors
                ? Object.defineProperties(
                    target,
                    Object.getOwnPropertyDescriptors(source)
                  )
                : ownKeys(Object(source)).forEach(function (key) {
                    Object.defineProperty(
                      target,
                      key,
                      Object.getOwnPropertyDescriptor(source, key)
                    );
                  });
            }
            return target;
          })({ objectMode: !0 }, opts)
        ),
        reading = !1;
      function next() {
        return _next2.apply(this, arguments);
      }
      function _next2() {
        return (_next2 = _asyncToGenerator(function* () {
          try {
            var _ref = yield iterator.next(),
              value = _ref.value;
            _ref.done
              ? readable.push(null)
              : readable.push(yield value)
              ? next()
              : (reading = !1);
          } catch (err) {
            readable.destroy(err);
          }
        })).apply(this, arguments);
      }
      return (
        (readable._read = function () {
          reading || ((reading = !0), next());
        }),
        readable
      );
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    module.exports = PassThrough;
    var Transform = __webpack_require__(117);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    __webpack_require__(2)(PassThrough, Transform),
      (PassThrough.prototype._transform = function (chunk, encoding, cb) {
        cb(null, chunk);
      });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var eos;
    var _require$codes = __webpack_require__(14).codes,
      ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
      ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    function noop(err) {
      if (err) throw err;
    }
    function destroyer(stream, reading, writing, callback) {
      callback = (function (callback) {
        var called = !1;
        return function () {
          called || ((called = !0), callback.apply(void 0, arguments));
        };
      })(callback);
      var closed = !1;
      stream.on("close", function () {
        closed = !0;
      }),
        void 0 === eos && (eos = __webpack_require__(53)),
        eos(stream, { readable: reading, writable: writing }, function (err) {
          if (err) return callback(err);
          (closed = !0), callback();
        });
      var destroyed = !1;
      return function (err) {
        if (!closed && !destroyed)
          return (
            (destroyed = !0),
            (function (stream) {
              return stream.setHeader && "function" == typeof stream.abort;
            })(stream)
              ? stream.abort()
              : "function" == typeof stream.destroy
              ? stream.destroy()
              : void callback(err || new ERR_STREAM_DESTROYED("pipe"))
          );
      };
    }
    function call(fn) {
      fn();
    }
    function pipe(from, to) {
      return from.pipe(to);
    }
    function popCallback(streams) {
      return streams.length
        ? "function" != typeof streams[streams.length - 1]
          ? noop
          : streams.pop()
        : noop;
    }
    module.exports = function () {
      for (
        var _len = arguments.length, streams = new Array(_len), _key = 0;
        _key < _len;
        _key++
      )
        streams[_key] = arguments[_key];
      var error,
        callback = popCallback(streams);
      if (
        (Array.isArray(streams[0]) && (streams = streams[0]),
        streams.length < 2)
      )
        throw new ERR_MISSING_ARGS("streams");
      var destroys = streams.map(function (stream, i) {
        var reading = i < streams.length - 1;
        return destroyer(stream, reading, i > 0, function (err) {
          error || (error = err),
            err && destroys.forEach(call),
            reading || (destroys.forEach(call), callback(error));
        });
      });
      return streams.reduce(pipe);
    };
  },
  function (module, exports) {
    module.exports = require("string_decoder");
  },
  function (module, exports) {
    var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g,
      reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,
      rsBreakRange =
        "\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000",
      rsAstral = "[\\ud800-\\udfff]",
      rsBreak = "[" + rsBreakRange + "]",
      rsCombo = "[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]",
      rsDigits = "\\d+",
      rsDingbat = "[\\u2700-\\u27bf]",
      rsLower = "[a-z\\xdf-\\xf6\\xf8-\\xff]",
      rsMisc =
        "[^\\ud800-\\udfff" +
        rsBreakRange +
        rsDigits +
        "\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde]",
      rsFitz = "\\ud83c[\\udffb-\\udfff]",
      rsNonAstral = "[^\\ud800-\\udfff]",
      rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}",
      rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]",
      rsUpper = "[A-Z\\xc0-\\xd6\\xd8-\\xde]",
      rsLowerMisc = "(?:" + rsLower + "|" + rsMisc + ")",
      rsUpperMisc = "(?:" + rsUpper + "|" + rsMisc + ")",
      reOptMod = "(?:" + rsCombo + "|" + rsFitz + ")" + "?",
      rsSeq =
        "[\\ufe0e\\ufe0f]?" +
        reOptMod +
        ("(?:\\u200d(?:" +
          [rsNonAstral, rsRegional, rsSurrPair].join("|") +
          ")[\\ufe0e\\ufe0f]?" +
          reOptMod +
          ")*"),
      rsEmoji =
        "(?:" + [rsDingbat, rsRegional, rsSurrPair].join("|") + ")" + rsSeq,
      rsSymbol =
        "(?:" +
        [
          rsNonAstral + rsCombo + "?",
          rsCombo,
          rsRegional,
          rsSurrPair,
          rsAstral,
        ].join("|") +
        ")",
      reApos = RegExp("['’]", "g"),
      reComboMark = RegExp(rsCombo, "g"),
      reUnicode = RegExp(
        rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq,
        "g"
      ),
      reUnicodeWord = RegExp(
        [
          rsUpper +
            "?" +
            rsLower +
            "+(?:['’](?:d|ll|m|re|s|t|ve))?(?=" +
            [rsBreak, rsUpper, "$"].join("|") +
            ")",
          rsUpperMisc +
            "+(?:['’](?:D|LL|M|RE|S|T|VE))?(?=" +
            [rsBreak, rsUpper + rsLowerMisc, "$"].join("|") +
            ")",
          rsUpper + "?" + rsLowerMisc + "+(?:['’](?:d|ll|m|re|s|t|ve))?",
          rsUpper + "+(?:['’](?:D|LL|M|RE|S|T|VE))?",
          rsDigits,
          rsEmoji,
        ].join("|"),
        "g"
      ),
      reHasUnicode = RegExp(
        "[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0\\ufe0e\\ufe0f]"
      ),
      reHasUnicodeWord =
        /[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,
      freeGlobal =
        "object" == typeof global &&
        global &&
        global.Object === Object &&
        global,
      freeSelf =
        "object" == typeof self && self && self.Object === Object && self,
      root = freeGlobal || freeSelf || Function("return this")();
    var object,
      deburrLetter =
        ((object = {
          À: "A",
          Á: "A",
          Â: "A",
          Ã: "A",
          Ä: "A",
          Å: "A",
          à: "a",
          á: "a",
          â: "a",
          ã: "a",
          ä: "a",
          å: "a",
          Ç: "C",
          ç: "c",
          Ð: "D",
          ð: "d",
          È: "E",
          É: "E",
          Ê: "E",
          Ë: "E",
          è: "e",
          é: "e",
          ê: "e",
          ë: "e",
          Ì: "I",
          Í: "I",
          Î: "I",
          Ï: "I",
          ì: "i",
          í: "i",
          î: "i",
          ï: "i",
          Ñ: "N",
          ñ: "n",
          Ò: "O",
          Ó: "O",
          Ô: "O",
          Õ: "O",
          Ö: "O",
          Ø: "O",
          ò: "o",
          ó: "o",
          ô: "o",
          õ: "o",
          ö: "o",
          ø: "o",
          Ù: "U",
          Ú: "U",
          Û: "U",
          Ü: "U",
          ù: "u",
          ú: "u",
          û: "u",
          ü: "u",
          Ý: "Y",
          ý: "y",
          ÿ: "y",
          Æ: "Ae",
          æ: "ae",
          Þ: "Th",
          þ: "th",
          ß: "ss",
          Ā: "A",
          Ă: "A",
          Ą: "A",
          ā: "a",
          ă: "a",
          ą: "a",
          Ć: "C",
          Ĉ: "C",
          Ċ: "C",
          Č: "C",
          ć: "c",
          ĉ: "c",
          ċ: "c",
          č: "c",
          Ď: "D",
          Đ: "D",
          ď: "d",
          đ: "d",
          Ē: "E",
          Ĕ: "E",
          Ė: "E",
          Ę: "E",
          Ě: "E",
          ē: "e",
          ĕ: "e",
          ė: "e",
          ę: "e",
          ě: "e",
          Ĝ: "G",
          Ğ: "G",
          Ġ: "G",
          Ģ: "G",
          ĝ: "g",
          ğ: "g",
          ġ: "g",
          ģ: "g",
          Ĥ: "H",
          Ħ: "H",
          ĥ: "h",
          ħ: "h",
          Ĩ: "I",
          Ī: "I",
          Ĭ: "I",
          Į: "I",
          İ: "I",
          ĩ: "i",
          ī: "i",
          ĭ: "i",
          į: "i",
          ı: "i",
          Ĵ: "J",
          ĵ: "j",
          Ķ: "K",
          ķ: "k",
          ĸ: "k",
          Ĺ: "L",
          Ļ: "L",
          Ľ: "L",
          Ŀ: "L",
          Ł: "L",
          ĺ: "l",
          ļ: "l",
          ľ: "l",
          ŀ: "l",
          ł: "l",
          Ń: "N",
          Ņ: "N",
          Ň: "N",
          Ŋ: "N",
          ń: "n",
          ņ: "n",
          ň: "n",
          ŋ: "n",
          Ō: "O",
          Ŏ: "O",
          Ő: "O",
          ō: "o",
          ŏ: "o",
          ő: "o",
          Ŕ: "R",
          Ŗ: "R",
          Ř: "R",
          ŕ: "r",
          ŗ: "r",
          ř: "r",
          Ś: "S",
          Ŝ: "S",
          Ş: "S",
          Š: "S",
          ś: "s",
          ŝ: "s",
          ş: "s",
          š: "s",
          Ţ: "T",
          Ť: "T",
          Ŧ: "T",
          ţ: "t",
          ť: "t",
          ŧ: "t",
          Ũ: "U",
          Ū: "U",
          Ŭ: "U",
          Ů: "U",
          Ű: "U",
          Ų: "U",
          ũ: "u",
          ū: "u",
          ŭ: "u",
          ů: "u",
          ű: "u",
          ų: "u",
          Ŵ: "W",
          ŵ: "w",
          Ŷ: "Y",
          ŷ: "y",
          Ÿ: "Y",
          Ź: "Z",
          Ż: "Z",
          Ž: "Z",
          ź: "z",
          ż: "z",
          ž: "z",
          Ĳ: "IJ",
          ĳ: "ij",
          Œ: "Oe",
          œ: "oe",
          ŉ: "'n",
          ſ: "ss",
        }),
        function (key) {
          return null == object ? void 0 : object[key];
        });
    function hasUnicode(string) {
      return reHasUnicode.test(string);
    }
    function stringToArray(string) {
      return hasUnicode(string)
        ? (function (string) {
            return string.match(reUnicode) || [];
          })(string)
        : (function (string) {
            return string.split("");
          })(string);
    }
    var objectToString = Object.prototype.toString,
      Symbol = root.Symbol,
      symbolProto = Symbol ? Symbol.prototype : void 0,
      symbolToString = symbolProto ? symbolProto.toString : void 0;
    function baseToString(value) {
      if ("string" == typeof value) return value;
      if (
        (function (value) {
          return (
            "symbol" == typeof value ||
            ((function (value) {
              return !!value && "object" == typeof value;
            })(value) &&
              "[object Symbol]" == objectToString.call(value))
          );
        })(value)
      )
        return symbolToString ? symbolToString.call(value) : "";
      var result = value + "";
      return "0" == result && 1 / value == -Infinity ? "-0" : result;
    }
    function castSlice(array, start, end) {
      var length = array.length;
      return (
        (end = void 0 === end ? length : end),
        !start && end >= length
          ? array
          : (function (array, start, end) {
              var index = -1,
                length = array.length;
              start < 0 && (start = -start > length ? 0 : length + start),
                (end = end > length ? length : end) < 0 && (end += length),
                (length = start > end ? 0 : (end - start) >>> 0),
                (start >>>= 0);
              for (var result = Array(length); ++index < length; )
                result[index] = array[index + start];
              return result;
            })(array, start, end)
      );
    }
    function toString(value) {
      return null == value ? "" : baseToString(value);
    }
    var callback,
      camelCase =
        ((callback = function (result, word, index) {
          return (
            (word = word.toLowerCase()),
            result + (index ? upperFirst(toString(word).toLowerCase()) : word)
          );
        }),
        function (string) {
          return (function (array, iteratee, accumulator, initAccum) {
            var index = -1,
              length = array ? array.length : 0;
            for (
              initAccum && length && (accumulator = array[++index]);
              ++index < length;

            )
              accumulator = iteratee(accumulator, array[index], index, array);
            return accumulator;
          })(
            (function (string, pattern, guard) {
              return (
                (string = toString(string)),
                void 0 === (pattern = guard ? void 0 : pattern)
                  ? (function (string) {
                      return reHasUnicodeWord.test(string);
                    })(string)
                    ? (function (string) {
                        return string.match(reUnicodeWord) || [];
                      })(string)
                    : (function (string) {
                        return string.match(reAsciiWord) || [];
                      })(string)
                  : string.match(pattern) || []
              );
            })(
              (function (string) {
                return (
                  (string = toString(string)) &&
                  string.replace(reLatin, deburrLetter).replace(reComboMark, "")
                );
              })(string).replace(reApos, "")
            ),
            callback,
            ""
          );
        });
    var methodName,
      upperFirst =
        ((methodName = "toUpperCase"),
        function (string) {
          var strSymbols = hasUnicode((string = toString(string)))
              ? stringToArray(string)
              : void 0,
            chr = strSymbols ? strSymbols[0] : string.charAt(0),
            trailing = strSymbols
              ? castSlice(strSymbols, 1).join("")
              : string.slice(1);
          return chr[methodName]() + trailing;
        });
    module.exports = camelCase;
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(221), exports),
      __exportStar(__webpack_require__(81), exports),
      __exportStar(__webpack_require__(82), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(118), exports),
      __exportStar(__webpack_require__(119), exports),
      __exportStar(__webpack_require__(120), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(224), exports),
      __exportStar(__webpack_require__(227), exports),
      __exportStar(__webpack_require__(228), exports),
      __exportStar(__webpack_require__(86), exports),
      __exportStar(__webpack_require__(87), exports),
      __exportStar(__webpack_require__(104), exports),
      __exportStar(__webpack_require__(91), exports),
      __exportStar(__webpack_require__(231), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(5), exports),
      __exportStar(__webpack_require__(0), exports),
      __exportStar(__webpack_require__(225), exports),
      __exportStar(__webpack_require__(226), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(85), exports),
      __exportStar(__webpack_require__(88), exports),
      __exportStar(__webpack_require__(92), exports),
      __exportStar(__webpack_require__(89), exports),
      __exportStar(__webpack_require__(90), exports),
      __exportStar(__webpack_require__(131), exports),
      __exportStar(__webpack_require__(40), exports),
      __exportStar(__webpack_require__(93), exports),
      __exportStar(__webpack_require__(8), exports),
      __exportStar(__webpack_require__(9), exports),
      __exportStar(__webpack_require__(132), exports),
      __exportStar(__webpack_require__(121), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(229), exports),
      __exportStar(__webpack_require__(230), exports),
      __exportStar(__webpack_require__(54), exports),
      __exportStar(__webpack_require__(122), exports),
      __exportStar(__webpack_require__(123), exports),
      __exportStar(__webpack_require__(126), exports),
      __exportStar(__webpack_require__(127), exports),
      __exportStar(__webpack_require__(10), exports),
      __exportStar(__webpack_require__(128), exports),
      __exportStar(__webpack_require__(44), exports),
      __exportStar(__webpack_require__(129), exports),
      __exportStar(__webpack_require__(50), exports),
      __exportStar(__webpack_require__(130), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(124), exports),
      __exportStar(__webpack_require__(49), exports),
      __exportStar(__webpack_require__(125), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(46), exports),
      __exportStar(__webpack_require__(47), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(233), exports),
      __exportStar(__webpack_require__(235), exports),
      __exportStar(__webpack_require__(236), exports),
      __exportStar(__webpack_require__(94), exports),
      __exportStar(__webpack_require__(98), exports),
      __exportStar(__webpack_require__(43), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(95), exports),
      __exportStar(__webpack_require__(97), exports),
      __exportStar(__webpack_require__(234), exports),
      __exportStar(__webpack_require__(31), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.SlowModeRateLimiter = void 0);
    const semaphore_async_await_1 = __webpack_require__(42),
      apply_function_replacements_1 = __webpack_require__(19),
      editable_timeout_1 = __webpack_require__(137),
      utils_1 = __webpack_require__(31);
    class SlowModeRateLimiter {
      constructor(client, maxQueueLength = 10) {
        (this.semaphores = {}),
          (this.runningTimers = {}),
          (this.client = client),
          (this.maxQueueLength = maxQueueLength);
      }
      applyToClient(client) {
        const genericReplament = async (oldFn, channelName, message) => {
          const releaseFn = await this.acquire(channelName);
          if (null != releaseFn)
            try {
              return await oldFn(channelName, message);
            } finally {
              releaseFn();
            }
        };
        apply_function_replacements_1.applyReplacements(this, client, {
          say: genericReplament,
          me: genericReplament,
          privmsg: genericReplament,
        }),
          null != client.roomStateTracker &&
            client.roomStateTracker.on(
              "newChannelState",
              this.onRoomStateChange.bind(this)
            ),
          null != client.userStateTracker &&
            client.userStateTracker.on(
              "newChannelState",
              this.onUserStateChange.bind(this)
            );
      }
      getSemaphore(channelName) {
        let semaphore = this.semaphores[channelName];
        return (
          null == semaphore &&
            ((semaphore = new semaphore_async_await_1.default(1)),
            (this.semaphores[channelName] = semaphore)),
          semaphore
        );
      }
      onUserStateChange(channelName, newState) {
        const { fastSpam: fastSpam, certain: certain } = utils_1.canSpamFast(
            channelName,
            this.client.configuration.username,
            newState
          ),
          runningTimer = this.runningTimers[channelName];
        if (
          (fastSpam && null != runningTimer && runningTimer.update(0),
          certain && channelName in this.semaphores)
        ) {
          const removedWaiters =
            this.getSemaphore(channelName).promiseResolverQueue.splice(10);
          for (const removedWaiter of removedWaiters) removedWaiter(!1);
        }
      }
      onRoomStateChange(channelName, newState) {
        const newSlowModeDuration = Math.max(
            newState.slowModeDuration,
            SlowModeRateLimiter.GLOBAL_SLOW_MODE_COOLDOWN
          ),
          runningTimer = this.runningTimers[channelName];
        null != runningTimer && runningTimer.update(newSlowModeDuration);
      }
      async acquire(channelName) {
        const { fastSpam: fastSpam, certain: certain } = utils_1.canSpamFast(
          channelName,
          this.client.configuration.username,
          this.client.userStateTracker
        );
        if (fastSpam) return () => {};
        const semaphore = this.getSemaphore(channelName),
          waiterQueue = semaphore.promiseResolverQueue;
        if (certain && waiterQueue.length >= this.maxQueueLength) return;
        if (!(await semaphore.acquire())) return;
        const { fastSpam: fastSpamAfterAwait } = utils_1.canSpamFast(
          channelName,
          this.client.configuration.username,
          this.client.userStateTracker
        );
        return fastSpamAfterAwait
          ? (semaphore.release(), () => {})
          : () => {
              const { fastSpam: fastSpamAfterRelease } = utils_1.canSpamFast(
                channelName,
                this.client.configuration.username,
                this.client.userStateTracker
              );
              if (fastSpamAfterRelease) return void semaphore.release();
              const slowModeDuration = this.getSlowModeDuration(channelName);
              this.runningTimers[channelName] =
                new editable_timeout_1.EditableTimeout(() => {
                  delete this.runningTimers[channelName], semaphore.release();
                }, 1e3 * slowModeDuration);
            };
      }
      getSlowModeDuration(channelName) {
        if (null != this.client.roomStateTracker) {
          const roomState =
            this.client.roomStateTracker.getChannelState(channelName);
          if (null != roomState)
            return Math.max(
              roomState.slowModeDuration,
              SlowModeRateLimiter.GLOBAL_SLOW_MODE_COOLDOWN
            );
        }
        return SlowModeRateLimiter.GLOBAL_SLOW_MODE_COOLDOWN;
      }
    }
    (exports.SlowModeRateLimiter = SlowModeRateLimiter),
      (SlowModeRateLimiter.GLOBAL_SLOW_MODE_COOLDOWN = 1.5);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      (exports.AlternateMessageModifier = exports.invisibleSuffix = void 0);
    const apply_function_replacements_1 = __webpack_require__(19),
      utils_1 = __webpack_require__(31);
    exports.invisibleSuffix = " 󠀀";
    exports.AlternateMessageModifier = class {
      constructor(client) {
        (this.lastMessages = {}), (this.client = client);
      }
      appendInvisibleCharacter(channelName, messageText, action) {
        const lastMessage = this.lastMessages[channelName];
        return null != lastMessage &&
          lastMessage.messageText === messageText &&
          lastMessage.action === action
          ? messageText + exports.invisibleSuffix
          : messageText;
      }
      applyToClient(client) {
        const genericReplament =
          (action) => async (oldFn, channelName, message) => {
            const { fastSpam: fastSpam } = utils_1.canSpamFast(
              channelName,
              client.configuration.username,
              client.userStateTracker
            );
            if (fastSpam) return void (await oldFn(channelName, message));
            const newMsg = this.appendInvisibleCharacter(
              channelName,
              message,
              action
            );
            await oldFn(channelName, newMsg),
              this.client.joinedChannels.has(channelName) ||
                (this.lastMessages[channelName] = {
                  messageText: newMsg,
                  action: action,
                });
          };
        apply_function_replacements_1.applyReplacements(this, client, {
          say: genericReplament(!1),
          me: genericReplament(!0),
        }),
          client.on("PRIVMSG", this.onPrivmsgMessage.bind(this));
      }
      onPrivmsgMessage(message) {
        message.senderUsername === this.client.configuration.username &&
          (this.lastMessages[message.channelName] = {
            messageText: message.messageText,
            action: message.isAction,
          });
      }
    };
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: !0 });
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(106), exports),
      __exportStar(__webpack_require__(99), exports),
      __exportStar(__webpack_require__(45), exports),
      __exportStar(__webpack_require__(133), exports),
      __exportStar(__webpack_require__(102), exports),
      __exportStar(__webpack_require__(48), exports),
      __exportStar(__webpack_require__(13), exports),
      __exportStar(__webpack_require__(135), exports),
      __exportStar(__webpack_require__(103), exports),
      __exportStar(__webpack_require__(105), exports),
      __exportStar(__webpack_require__(107), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(52), exports),
      __exportStar(__webpack_require__(19), exports),
      __exportStar(__webpack_require__(137), exports),
      __exportStar(__webpack_require__(108), exports),
      __exportStar(__webpack_require__(41), exports),
      __exportStar(__webpack_require__(134), exports),
      __exportStar(__webpack_require__(30), exports),
      __exportStar(__webpack_require__(109), exports),
      __exportStar(__webpack_require__(26), exports),
      __exportStar(__webpack_require__(101), exports),
      __exportStar(__webpack_require__(110), exports);
  },
  function (module, exports, __webpack_require__) {
    "use strict";
    var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              void 0 === k2 && (k2 = k),
                Object.defineProperty(o, k2, {
                  enumerable: !0,
                  get: function () {
                    return m[k];
                  },
                });
            }
          : function (o, m, k, k2) {
              void 0 === k2 && (k2 = k), (o[k2] = m[k]);
            }),
      __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            "default" === p ||
              Object.prototype.hasOwnProperty.call(exports, p) ||
              __createBinding(exports, m, p);
        };
    Object.defineProperty(exports, "__esModule", { value: !0 }),
      __exportStar(__webpack_require__(24), exports),
      __exportStar(__webpack_require__(136), exports),
      __exportStar(__webpack_require__(51), exports);
  },
]).default;
