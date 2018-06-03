/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Provides the base implementation of the cache interface
 * @module membrane/lib/backends/base
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires events
 * @requires keef
 * @requires bitters
 * @requires gaz/object
 */
var EE      = require( 'events' )                     // node events module
  , conf    = require( 'keef' )                 // alice conf package for loading settings
  , logger  = require( 'bitters' )                  // alice logger package
  , {merge} = require( 'gaz/object' )      // core exception classes
  ;

/**
 * Base Level Cache interface
 * @alias module:membrane/lib/backends/base
 * @constructor
 * @extends EventEmitter
 * @param {Object} options
 * @param {Number} [options.timeout=30000] timeout in ms that a key should persist
 * @param {String} [options.prefix='alice'] a key prefix to help avoid key collisions
 * @param {String|Object} [options.location=''] The location of the cache server to connection, if their is one. if an object is provided it will be used to generate a connection string
 * @param {Function} [options.keyfn] a function used to generate namepased keys. defaults to prefix +'_'+ key
 */
module.exports = class Cache extends EE {
  constructor (opts) {
    super()
    this.options = merge({}, {
      timeout: ( 1000 * 60 * 5 )
    , prefix: 'membrane'
    , location: null
    , keyfn: ( key ) => {
        return `${this.options.prefix}:${key}`
      }
    }, opts)
  }


  /**
   * Adds a value to the cache backend if it doesn't already exist
   * @method module:membrane/lib/backends/base#add
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  add(key, value, timeout) {
    const error = new Error(
      'Subclass of base cache must implement add() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  /**
   * retrieve on or more value from the cache backend
   * @method module:membrane/lib/backends/base#get
   * @param {...string} key the key(s) to fetch from the
   * @param {Function} callback callback function to be executed when the operation is copmlete
   **/
  get() {
    const error = new Error(
      'Subclass of base cache must implement get() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  /**
   * Sets a value a specific key
   * @method module:membrane/lib/backends/base#set
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  set( key, value, timeout) {
    const error = new Error(
      'Subclass of base cache must implement set() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method module:membrane/lib/backends/base#incr
   * @param {String} key The key to increment if it exists
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  incr( ){
    const error = new Error(
      'Subclass of base cache must implement incr() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method module:membrane/lib/backends/base#decr
   * @param {String} key The key to increment if it exists
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  decr( ) {
    const error = new Error(
      'Subclass of base cache must implement decr() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  /**
   * Appends a value to an array
   * @method module:membrane/lib/backends/base#push
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  push(key, value, timeout, callback ) {
    const error = new Error(
      'Subclass of base cache must implement push() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  touch(key) {
    const error = new Error(
      'Subclass of base cache must implement touch() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  /**
   * Removes a specific key from an array. If no key is specified, the last value is removed
   * @method module:membrane/lib/backends/base#pop
   * @param {String} key Key to identify a value
   * @param {Function} [callback] A callback function to be executed when the operation is finished
   **/
  pop(key, callback ) {
    const error = new Error(
      'Subclass of base cache must implement pop() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  /**
   * Checks to verify if a key still holds a value
   * @method module:membrane/lib/backends/base#has
   * @param {String} key the name of he key to look up
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  has(){
    const error = new Error(
      'Subclass of base cache must implement has() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  flush(callback) {
    const error = new Error(
      'Subclass of base cache must implement flush() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }

  close( callback ) {
    const error = new Error(
      'Subclass of base cache must implement close() method'
    )
    error.code = 'ESUBCLASS'
    error.name = 'NotImplementedError'
    logger.error('cache error: %s: %s', error.name, error.message )
    return Promise.reject(error)
  }
};
