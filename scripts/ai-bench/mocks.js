// Universal stub for native-only packages so lib/ai.ts can be imported in Node
// for prompt benchmarking. Never shipped — scripts/ only.
const proxy = new Proxy(function () {}, {
  get: () => proxy,
  apply: () => proxy,
  construct: () => proxy,
});
module.exports = proxy;
module.exports.default = proxy;
