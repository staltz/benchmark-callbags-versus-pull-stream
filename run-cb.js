const bench = require('fastbench')
const {fromIter, pipe} = require('callbag-basics')

const asyncMap = f => source => (start, sink) => {
  if (start !== 0) return;
  source(0, (t, x) => {
    if (t === 1) f(x, y => sink(1, y));
    else sink(t, x);
  });
};

const collect = operation => source => {
  let talkback;
  let arr = [];
  source(0, (t, d) => {
    if (t === 0) talkback = d;
    if (t === 1) arr.push(d);
    if (t === 1 || t === 0) talkback(1);
    if (t === 2) operation(arr);
  });
};

const values = [
  JSON.stringify({ hello: 'world' }),
  JSON.stringify({ foo: 'bar' }),
  JSON.stringify({ bin: 'baz' })
]

const run = bench([
  function callbag3 (done) {
    const source = fromIter(values)
    const operator = asyncMap(function (val, cb) {
      const json = JSON.parse(val)
      cb(json)
    })
    const sink = collect(function (array) {
      setImmediate(done)
    })
    pipe(source, operator, sink)
  },
  function callbag_compose (done) {
    const source = fromIter(values)
    const operator = asyncMap(function (val, cb) {
      const json = JSON.parse(val)
      cb(json)
    })
    const sink = collect(function (array) {
      setImmediate(done)
    })
    pipe(source, s => pipe(s, operator, sink))
  },
  function callbag_chain (done) {
    const source = fromIter(values)
    const operator = asyncMap(function (val, cb) {
      const json = JSON.parse(val)
      cb(null, json)
    })
    const sink = collect(function (array) {
      setImmediate(done)
    })
    pipe(pipe(source, operator), sink)
  }
], 100000)

run()
