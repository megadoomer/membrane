/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict'
/**
 * Provides the redis implementation of the cache interface
 * @module membrane/lib/backends/redis
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires events
 * @requires util
 * @requires keef
 * @requires bitters
 * @requires gaz/class
 * @requires gaz/class/options
 * @requires hive-core/exceptions
 */
const events    = require( 'events' )
const util      = require( 'util' )
const conf      = require( 'keef' )
const redis     = require( 'redis' )
const url       = require( 'url' )
const {promisify} = require('util')
const {toArray} = require( 'gaz/lang')
const {noop}    = require( 'gaz/function' )
const {isNumber}= require( 'gaz/lang')
const {typecast}= require( 'gaz/string' )
const {merge}   = require( 'gaz/object' )
const debug     = require( 'debug' )( 'membrane:cache:redis' )
const Cache     = require( './base' )

function createClient(port, host, opts, db, auth) {
  const client = redis.createClient(port, host, opts)
  if (!isNaN(db)) client.select(db)
  if (auth) client.auth(auth.split(':')[1], noop)
  return {
    del: promisify(client.del.bind(client))
  , decr: promisify(client.decr.bind(client))
  , exists: promisify(client.exists.bind(client))
  , flushdb: promisify(client.flushdb.bind(client))
  , get: promisify(client.get.bind(client))
  , incr: promisify(client.incr.bind(client))
  , lpop: promisify(client.lpop.bind(client))
  , lrem: promisify(client.lrem.bind(client))
  , multi: client.multi.bind(client)
  , pexpire: promisify(client.pexpire.bind(client))
  , psetex: promisify(client.psetex.bind(client))
  , quit: promisify(client.quit.bind(client))
  , rpush: promisify(client.rpush.bind(client))
  , type: promisify(client.type.bind(client))
  }
}

/**
 * Redis redis backend for the Cache interface
 * @alias module:membrane/lib/backends/redis
 * @constructor
 * @param {Object} options Configuration option overrides
 * @param {Object|String} options.location connection information for redis. If using a string, it must be a fully qualified URI. ( redis://user:pass@localhost:6379 )
 * @param {String} [options.host=localhost] host name or ip where redis server lives
 * @param {Number} [options.port=6379] Port number redis server is running on
 * @param {Object} [options.options] Additional connection options to send to redis
 * @param {Object} [options.options.db=0] The default database to select upon start up
 * @extends module:membrane/lib/backends/base
 */
module.exports = class RedisCache extends Cache {

  constructor( options ) {
    super(merge({}, {
      location:{
        host: 'localhost'
      , port: 6379
      }
    , options: {
        db: 0
      }
    }, options))

    const db = this.options.options && parseInt( this.options.options.db )
    const location = this.options.location
    const connect = typeof location == 'string' ? url.parse( location ) : location
    debug("connecting redis cache backend", connect )
    this.cli = createClient(
      connect.port
    , ( connect.hostname || connect.host )
    , this.options.options
    , db
    , connect.auth
    )
  }


  /**
   * Adds a value to the cache backend if it doesn't already exist
   * @method module:membrane/lib/backends/redis#add
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  async add( key, value, timeout) {
    const _key = this.options.keyfn.call(this, key )
    const ttl = timeout || this.options.timeout
    const trans = this.cli.multi()
    const exec = promisify(trans.exec.bind(trans))

    trans.get(_key).setnx(_key, value)
    const replies = await exec()

    await this.cli.pexpire(_key, ttl)
    // [original, set]
    return typecast( !!replies[1] ?  value  : replies[0] )
  }

  /**
   * retrieve on or more value from the cache backend
   * @method  module:membrane/lib/backends/redis#get
   * @param {...String} key The key(s) to fetch from the
   **/
  async get(...args) {
    const type_trans   = this.cli.multi()
    const values_trans = this.cli.multi()

    const texec = promisify(type_trans.exec.bind(type_trans))
    const vexec = promisify(type_trans.exec.bind(values_trans))

    const keys = new Array(args.length)
    for(var x=0, len=args.length; x<len; x++) {
      keys[x] = this.options.keyfn.call( this, args[x] )
      type_trans.type( keys[x] )
    }

    const types = await texec()

    for(var x=0, len=keys.length; x<len; x++){
      if(types[x] == 'list') {
        values_trans.lrange(keys[x], 0, -1)
      } else {
        values_trans.get(keys[x])
      }
    }

    const results = await vexec()
    if(args.length === 1) {
      return typeof results[0] == 'string' ? typecast(results[0]) : results[0]
    }

    const ret = Object.create(null)
    for(var x=0,len=args.length; x < len; x++) {
      const key = args[x]
      ret[key] = typeof results[x] == 'string' ? typecast(results[x]) : results[x]
    }
    return ret
  }

  /**
   * Sets a value a specific key
   * @method module:membrane/lib/backends/redis#set
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   **/
  async set(key, value, timeout) {
    const ttl = timeout || this.options.timeout
    const _key = this.options.keyfn.call(this, key)
    debug('set', _key, ttl)
    await this.cli.psetex(_key, ttl, value)
    return value
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method  module:membrane/lib/backends/redis#incr
   * @param {String} key The key to increment if it exists
   **/
  async incr(key) {
    const _key = this.options.keyfn.call(this, key)
    debug('incr', _key)
    return await this.cli.incr(_key)
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method  module:membrane/lib/backends/redis#decr
   * @param {String} key The key to increment if it exists
   **/
  async decr(key) {
    const _key = this.options.keyfn.call(this, key)
    debug('decr', _key)
    this.cli.decr(_key)
  }

  /**
   * Appends a value to an array
   * @method  module:membrane/lib/backends/redis#push
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   **/
  async push(key, value, timeout) {
    const _key = this.options.keyfn.call( this, key )
    const ttl = timeout || this.options.timeout

    const type = await this.cli.type(_key)
    const txn = this.cli.multi()
    const exec = promisify(txn.exec.bind(txn))

    debug('push', _key, ttl)
    switch(type) {
      // if the key is a list, or doesn't exists, just push the value
      case 'list':
      case 'none':
        txn.rpush(_key, value)
        txn.pexpire(_key, ttl)
        await exec()
        return value

      // if the key is a string value.
      // 1. get the value
      // 2. delete the key
      // 3. push the value to a list
      // 4. set expiration time
      case 'string':
        const previous =  await this.cli.get(_key)
        txn.del(_key)
        txn.rpush(_key, previous)
        txn.rpush(_key, value)
        txn.pexpire(_key, ttl)
        await exec()
        return value
    }

    return null
  }

  /**
   * Removes a specific key from an array. If no key is specified, the last value is removed
   * @method  module:membrane/lib/backends/redis#pop
   * @param {String} key Key to identify a value
   **/
  async pop(key, value, timeout) {
    const _key = this.options.keyfn.call(this, key)
    const ttl = timeout || this.options.timeout
    const type = await this.cli.type(_key)
    const txn = this.cli.multi()
    const exec = promisify(txn.exec.bind(txn))

    debug('pop', _key, value, ttl)
    switch( type ){
      case 'list':
        if(value) {
          txn.lrem(_key, 1, value)
          txn.pexpire(_key, ttl)
        } else {
          txn.lpop(_key)
          txn.pexpire(_key, ttl)
        }
        await exec()
        return value

      case 'none':
      case 'string':
      case 'set':
      case 'zset':
      case 'hash':
        return null

      default:
        const e = new Error(`cannot call pop on ${type} type`)
        e.code = 6001
        e.type = 'ECACHEVAL'
        throw e
    }
  }

  touch(key) {
    const _key = this.options.keyfn.call(this, key)
    const ttl = timeout || this.options.timeout
    return this.cli.pexpire(_key, ttl)
  }

  /**
   * Checks to verify if a key still holds a value
   * @method module:membrane/lib/backends/redis#has
   * @param {String} key the name of he key to look up
   **/
  async has(key) {
    return !!(await this.cli.exists(this.options.keyfn.call(this, key)))
  }

  /**
   * Clears the internal redis database
   * @method  module:membrane/lib/backends/redis#flush
   **/
  flush() {
    return this.cli.flushdb()
  }

  /**
   * Closes the connection to the redis database
   * @method module:membrane/lib/backends/redis#close
   **/
  close() {
    return this.cli.quit()
  }
}
