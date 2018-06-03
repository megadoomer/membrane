/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/

'use strict'
/**
 * Provides the memory implementation of the cache interface
 * @module membrane/lib/backends/memory
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires events
 * @requires debug
 * @requires keef
 * @requires bitters
 * @requires gaz/class
 * @requires gaz/array
 * @requires gaz/function
 * @requires gaz/lang
 */
const events    = require( 'events' )
const conf      = require( 'keef' )
const logger    = require( 'bitters' )
const {noop}    = require( 'gaz/function' )
const {toArray} = require( 'gaz/lang' )
const {remove}  = require( 'gaz/array' )
const typeOf    = require( 'gaz/typeOf' )
const debug     = require( 'debug' )( 'membrane:cache:memory' )
const Cache     = require( './base' )
const kMem      = Symbol('memstore')

/**
 * Base Level Cache interface
 * @constructor
 * @alias module:hive-cache/lib/backends/memory
 * @param {Object} options
 * @param {Number} [options.timeout=30000] timeout in ms that a key should persist
 * @param {String} [options.prefix='']
 */
module.exports = class MemoryCache extends Cache {
  constructor(opts) {
    super(opts)
    this[kMem] = {}
  }

  /**
   * Adds a value to the cache backend if it doesn't already exist
   * @method module:hive-cache/lib/backends/memory#add
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   **/
  async add( key, value, timeout) {
    const _key = this.options.keyfn.call( this , key )
    const memory = this[kMem]
    const slot = memory[_key]
    if( !slot || slot.value == null ){
      return await this.set( key, value, timeout)
    }

    return slot.value
  }

  /**
   * retrieve on or more value from the cache backend
   * @method module:hive-cache/lib/backends/memory#get
   * @param {...String} key The key(s) to fetch from the
   **/
  async get(...args){
    const memory = this[kMem]
    var result = {}

    for(var x = 0, len=args.length; x <len; x++ ){
      const slot = memory[ this.options.keyfn.call(this, args[x] ) ];
      result[ args[x] ] = slot && slot.value
    }

    return args.length === 1 ? result[args[0]] : result
  }

  /**
   * Sets a value a specific key
   * @method module:hive-cache/lib/backends/memory#set
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   **/
  async set(key, value, timeout) {
    const _key = this.options.keyfn.call(this, key);
    const memory = this[kMem]
    const previous = memory[_key]
    previous && clearTimeout(previous.ttl)
    memory[_key] = {
      value: value
    , ttl: setTimeout(() => {
        this[kMem][this.options.keyfn.call(this, key)] = undefined
      }, timeout || this.options.timeout ).unref()
    }
    return value
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method module:hive-cache/lib/backends/memory#incr
   * @param {String} key The key to increment if it exists
   **/
  async incr(key) {
    const _key = this.options.keyfn.call( this, key );
    const memory = this[kMem]
    const slot = memory[ _key ]
    const value = ( ( typeof (slot && slot.value) == "number" ? slot.value : 0  ) + 1 )
    return await this.set(key, value)
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method module:hive-cache/lib/backends/memory#decr
   * @param {String} key The key to increment if it exists
   **/
  async decr(key) {
    const _key = this.options.keyfn.call( this, key )
    const memory = this[kMem]
    const slot = memory[_key]
    const value = ( ( typeof (slot && slot.value) == "number" ? slot.value : 0  ) - 1 )
    return await this.set(key, value)
  }

  /**
   * Appends a value to an array
   * @method module:hive-cache/lib/backends/memory#push
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   **/
  async push(key, value, timeout) {
    const _key = this.options.keyfn.call( this, key );
    const memory = this[kMem]
    const slot = memory[_key]
    let _value = slot && slot.value

    if( !Array.isArray(_value)){
      _value = toArray(_value)
    }
    _value.push( value )
    return await this.set(key, _value, timeout)
  }

  /**
   * Removes a specific key from an array. If no key is specified, the last value is removed
   * @method module:hive-cache/lib/backends/memory#pop
   * @param {String} key Key to identify a value
   **/
  async pop(key, value) {
    const _key = this.options.keyfn.call(this, key)
    const memory = this[kMem]
    const slot = memory[_key]
    const _value = slot && slot.value
    if( !Array.isArray( _value ) ) {
      const e = new Error(`cannot call pop on ${typeof _value}`)
      e.code = 6001
      e.type = 'ECACHEVAL'
      throw e
    }
    value ? !remove( _value, value ) : _value.pop()
    await this.set(key, _value)
    return _value
  }

  /**
   * Checks to verify if a key still holds a value
   * @method module:hive-cache/lib/backends/memory#has
   * @param {String} key the name of he key to look up
   **/
  async has(key) {
    const _key = this.options.keyFn.call(this, key)
    const memory = this[kMem]
    return !!memory[_key]
  }

  /**
   * Clears the internal internal memory
   * @method  module:hive-cache/lib/backends/memory#flush
   **/
  async flush() {
    for (const slot of Object.entries(this[kMem])) {
      clearTimeout(slot.ttl)
    }
    this[kMem] = {}
  }
  /**
   * marks the instanceas closed
   * @method module:hive-cache/lib/backends/memory#close
   **/
  async close() {
    return null
  }
}
