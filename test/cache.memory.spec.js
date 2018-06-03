/*jshint node:true, laxcomma: true, smarttabs: true, mocha: true*/
'use strict'

const {test, threw} = require('tap')
const Memory = require('../lib/backends/memory');

function sleep(duration = 500) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

test( 'Memory Backend', async (t) => {
  await t.test('#add', async (tt) => {
    const memory = new Memory({timeout: 300})
    {
      await memory.add('fake', 1)
      await memory.add('fake', 2)
      const value = await memory.add('fake', 3)
      tt.strictEqual(value, 1)
    }

    await sleep()

    {
      await memory.add('foo', 2 )
      const value = await memory.get('foo')
      tt.strictEqual(value, 2)
    }

    {
      await memory.add('foo', 3 )
      const value = await memory.get('foo')
      tt.strictEqual(value, 2)
    }
  })


  await t.test('#set', async (tt) => {
    const memory = new Memory()

    {
      await memory.set('fake', 1 )
      await memory.set('fake', 2 )
      const value = await memory.set('fake', 3)
      tt.strictEqual( value, 3 )
    }

    {
      await memory.set('foo', 2 )
      const value = await memory.get('foo')
      tt.strictEqual(value, 2)
    }

    {
      await memory.set('foo', 3 )
      const value = await memory.get('foo')
      tt.strictEqual(value, 3)
    }
  })

  await t.test('#get', async (tt) => {
    const memory = new Memory()
    await tt.test('should retrieve a single value', async (ttt) => {
      await memory.set('foo', 2 )
      const value = await memory.get('foo')
      ttt.strictEqual(value, 2)
    })

    await tt.test('should retrieve multiple values an object', async (ttt) => {
      await memory.set('foo', 2 )
      await memory.set('baz', 1 )
      await memory.set('cake', 'frosting' )

      const value = await memory.get('foo', 'baz', 'cake')
      ttt.match(value, {
        foo: 2
      , baz: 1
      , cake: 'frosting'
      })
    })
  })

  await t.test('#incr', async (tt) => {
    const memory = new Memory()
    await tt.test('should set a value if it does not exist', async (ttt) => {
      const v = await memory.incr('increment')
      ttt.equal( v, 1)
    })

    await tt.test('should increment a value by 1', async (ttt) => {
      await memory.incr('increment')
      await memory.incr('increment')
      await memory.incr('increment')
      await memory.incr('increment')
      await memory.incr('increment')
      const v = await memory.incr('increment')
      ttt.equal( v, 7 )
    })
  })

  await t.test('#decr', async (tt) => {
    const memory = new Memory()
    await tt.test('should decrement a value by 1', async (ttt) => {
      await memory.set('decrement', 5)
      await memory.decr('decrement')
      await memory.decr('decrement')
      await memory.decr('decrement')
      await memory.decr('decrement')
      await memory.decr('decrement')
      const v = await memory.get('decrement')
      ttt.strictEqual( v, 0 )
    })
  })

  await t.test('#push', async (tt) => {
    const memory = new Memory()
    await tt.test('should create an array if the value is not an array', async (ttt) => {
      await memory.set('push', 5)
      const v = await memory.push('push', 1)
      ttt.type(v, Array)
      ttt.strictEqual( v[0], 5)
      ttt.strictEqual( v[1], 1)
    })
  })

  await t.test('#pop', async (tt) => {
    const memory = new Memory({timeout: 300})
    await tt.test('specific value if provided', async (ttt) => {
      await Promise.all([
        memory.push('pop', 1 )
      , memory.push('pop', 2 )
      , memory.push('pop', 3 )
      , memory.push('pop', 4 )
      , memory.pop('pop', 3)
      ])
      const v = await memory.get('pop')
      ttt.equal( v.indexOf(3), -1 )
      ttt.notEqual( v.indexOf(1), -1 )
      ttt.notEqual( v.indexOf(2), -1 )
      ttt.notEqual( v.indexOf(4), -1 )

      await sleep()
      const found = await memory.get('pop')
      tt.notOk(found, 'value expires')
    })
  })
})
