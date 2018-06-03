/*jshint node:true, laxcomma: true, node: true, esnext: true*/

'use strict'
const {test, threw} = require('tap')
const kindOf = require('gaz/lang').kindOf
const Redis = require('../lib/backends/redis')


test( 'Redis Backend', async (t) => {
  var redis = new Redis()

  t.on('end', () => {
    redis.close()
  })

  await t.test('#add', async (tt) => {
    await tt.test('set values if one does not exist', async (ttt) => {
      {
        await redis.add('fake', 1)
        await redis.add('fake', 2)
        const value = await redis.add('fake', 3)
        ttt.strictEqual(value, 1)
      }

      {
        await redis.add('foo', 2)
        const value = await redis.get('foo')
        ttt.strictEqual(value, 2)
      }

      {
        await redis.add('foo', 3)
        const value = await redis.get('foo')
        ttt.strictEqual(value, 2)
      }

      await redis.flush()
    })
  })

  await t.test('#set', async (tt) => {
    await tt.test('should pass', async (ttt) => {
      {
        await redis.set('fake', 1 )
        await redis.set('fake', 2 )
        const value = await redis.set('fake', 3)
        ttt.strictEqual(value, 3)
      }

      {
        await redis.set('foo', 2)
        const value = await redis.get('foo')
        ttt.strictEqual(value, 2)
      }

      {
        await redis.set('foo', 3)
        const value = await redis.get('foo')
        ttt.strictEqual(value, 3)
      }
      {
        await redis.set('foo', 4, 300)
        await new Promise((resolve) => {
          setTimeout(resolve, 450)
        })
        const value = await redis.get('foo')
        ttt.strictEqual(value, null, 'ttl expires value')
      }
    })
    await redis.flush()
  })

  await t.test('#get', async (tt) => {
    await tt.test('retrieve a single value', async (ttt) => {
      await redis.set('foo', 2)
      const value = await redis.get('foo')
      ttt.strictEqual(value, 2)
    })

    await tt.test('retrieve multiple values', async (ttt) => {
      await Promise.all([
        redis.set('foo', 2)
      , redis.set('baz', 1)
      , redis.set('cake', 'frosting')
      ])

      const value = await redis.get('foo', 'baz', 'cake')

      ttt.match(value, {
        foo: 2
      , baz: 1
      , cake: 'frosting'
      })
    })
    await redis.flush()
  })

  await t.test('#incr', async (tt) => {
    await tt.test('set a value if it does not exist', async (ttt) => {
      const v = await redis.incr('increment')
      ttt.equal( v, 1)
    })

    await tt.test('should increment a value by 1', async (ttt) => {
      await Promise.all([
        redis.incr('increment')
      , redis.incr('increment')
      , redis.incr('increment')
      , redis.incr('increment')
      , redis.incr('increment')
      ])
      const v = await redis.get('increment')
      ttt.equal( v, 6 )
    })
  })

  await t.test('#decr', async (tt) => {
    await tt.test('decrement a value by 1', async (ttt) => {
      await redis.set('decrement', 5)
      await Promise.all([
        redis.decr('decrement')
      , redis.decr('decrement')
      , redis.decr('decrement')
      , redis.decr('decrement')
      ])
      const v = await redis.get('decrement')
      ttt.strictEqual( v, 1 )
    })
    await redis.flush()
  })

  await t.test('#push', async (tt) => {
    await tt.test('create an array if the value is not an array', async (ttt) => {
      await redis.set('push', 5)
      await redis.push('push', 1)
      const v = await redis.get('push')
      ttt.type(v, Array)
      ttt.deepEqual(v, [5, 1])
    })
    await redis.flush()
  })

  await t.test('#pop', async (tt) => {
    await tt.test('should pop a specific value if provided', async (ttt) => {
      await Promise.all([
        redis.push('pop', 1)
      , redis.push('pop', 2)
      , redis.push('pop', 3)
      , redis.push('pop', 4)
      ])
      await redis.pop('pop', 3)

      let v = await redis.get('pop')
      v = v.map((value) => {
        return ~~value
      })
      ttt.deepEqual(v, [1,2,4])
    })
    await redis.flush()
  })
})
