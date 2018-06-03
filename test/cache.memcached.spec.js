/*jshint node:true, laxcomma: true, smarttabs: true, node, esnext*/
'use strict'

const {test, threw} = require('tap')
const Memcached = require('../lib/backends/memcached')

test('memcached Backend', async (t) => {
  var cache = new Memcached()
  await cache.flush()

  await t.test('#add', async (tt) => {
    {
      await cache.add('fake', 1)
      await cache.add('fake', 2)
      await cache.add('fake', 3)
      const value = await cache.get('fake')
      tt.strictEqual( value, 1 )
    }

    {
      await cache.add('foo', 2)
      const value = await cache.get('foo')
      tt.strictEqual( value, 2 )
    }

    {
      await cache.add('foo', 3)
      const value = await cache.get('foo')
      tt.strictEqual(value, 2)
    }
    await cache.flush()
  })

  await t.test('#set', async (tt) => {
    {
        await cache.set('fake', 1)
        await cache.set('fake', 2)
        await cache.set('fake', 3)
        const value = await cache.get('fake')
        tt.strictEqual( value, 3 )
    }
    {
        const value = await cache.set('foo', 2)
        tt.strictEqual(value, 2)
    }
    {
        await cache.set('foo', 3)
        const value = await cache.get('foo')
        tt.strictEqual(value, 3)
    }
  })

  await t.test('#get', async (tt) => {
    {
      await cache.set('foo', 2)
      const value = await cache.get('foo')
      tt.strictEqual(value, 2, 'retrieves a singular value')
    }

    {
      await cache.set('foo', 2)
      await cache.set('baz', 1)
      await cache.set('cake', 'frosting')

      const value = await cache.get('foo', 'baz', 'cake')
      tt.match(value, {
        foo: 2
      , baz: 1
      , cake: 'frosting'
      }, 'retreive multipl keys')
    }
  })

  await t.test('#incr', async (tt) => {
    {
      const v = await cache.incr('increment')
      tt.equal( v, 1, 'set a value if it does not exist')
    }
    {
      await Promise.all([
        cache.incr('increment')
      , cache.incr('increment')
      , cache.incr('increment')
      , cache.incr('increment')
      , cache.incr('increment')
      ])
      const v = await cache.get('increment')
      tt.equal( v, 6, 'increments a value by 1' )
    }
  })

  await t.test('#decr', async (tt) => {
    await cache.set('decrement', 5)
    await Promise.all([
      cache.decr('decrement')
    , cache.decr('decrement')
    , cache.decr('decrement')
    , cache.decr('decrement')
    , cache.decr('decrement')
    ])
    const v = await cache.get('decrement')
    tt.strictEqual( v, 0, 'should decrement a value by 1' )
  })
  await t.test('#push', async (tt) => {
    await cache.set('push', 5)
    await cache.push('push', 1)
    let v = await cache.get('push')
    v = v.split(',').map( function( i ){
      return i >>> 0
    })
    tt.type(v , Array)
    tt.deepEqual(v, [5, 1], 'should create an array if not set')
  })

  await t.test('#pop', async (tt) => {
    await cache.push('pop', 1)
    await cache.push('pop', 2)
    await cache.push('pop', 3)
    await cache.push('pop', 4)
    await cache.pop('pop', 3)
    let v = await cache.get('pop')
    v = v.split(',').map( function( i ){
      return i >>> 0
    })
    tt.deepEqual(v, [1,2,4], 'should pop a specific value')
  })

  await cache.close()
}).catch(threw)

