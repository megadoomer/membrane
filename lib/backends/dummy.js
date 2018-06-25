/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/
'use strict'

/**
 * Provides the base implementation of the cache interface
 * @module membrane/lib/backends/dummy
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires gaz/function
 * @requires membrane/backends/base
 */
const logger  = require('bitters')
const {noop}  = require( 'gaz/function' )
const Cache   = require( './base' )

/**
 * Dummy Cache backend for testing
 * @alias module:membrane/lib/backends/dummy
 * @constructor
 * @extends module:membrane/lib/backends/base
 * @param {Object} options
 * @param {Number} [options.timeout=30000] timeout in ms that a key should persist
 * @param {String} [options.prefix='cache']
 */
module.exports = class DummyCache extends Cache {
  constructor(options) {
    super(options)
    logger.notice("Dummy cache backend configured");
    logger.warning('The dummy backend is for testing purposes only')
  }


  /**
   * Adds a value to the cache backend if it doesn't already exist
   * @method module:membrane/lib/backends/dummy#add
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=cache.timeout] a timeout override for a specific operation
   **/
  add(key, value, timeout) {
    return Promise.resolve(null)
  }

  /**
   * retrieve on or more value from the cache backend
   * @method module:membrane/lib/backends/dummy#get
   * @param {...String} key The key(s) to fetch from the  
   **/
  get(key, ...args) {
    return Promise.resolve(null)
  }

  /**
   * Sets a value a specific key
   * @method module:membrane/lib/backends/dummy#set
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=cache.timeout] a timeout override for a specific operation
   **/
  set(key, value, timeout) {
    return Promise.resolve(null)
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method module:membrane/lib/backends/dummy#incr
   * @param {String} key The key to increment if it exists
   **/
  incr(key) {
    return Promise.resolve(1)
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method module:membrane/lib/backends/dummy#decr
   * @param {String} key The key to increment if it exists
   **/
  decr(key) {
    return Promise.resolve(0)
  }

  /**
   * Appends a value to an array
   * @method module:membrane/lib/backends/dummy#push
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=cache.timeout] a timeout override for a specific operation
   **/
  push(key, value, timeout) {
    return Promise.resolve([value])
  }

  /**
   * Removes a specific key from an array. If no key is specified, the last value is removed
   * @method module:membrane/lib/backends/dummy#pop
   * @param {String} key Key to identify a value
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  pop(key) {
    return Promise.resolve(null)
  }

  /**
   * Checks to verify if a key still holds a value
   * @method module:membrane/lib/backends/dummy#has
   * @param {String} key the name of he key to look up
   **/
  has(key) {
    return Promise.resolve(false)
  }

  /**
   * Clears the internal redis database
   * @method module:membrane/lib/backends/dummy#flush
   **/
  flush(callback) {
    return Promise.resolve(null)
  }

  /**
   * Closes the connection to the redis database
   * @method module:membrane/lib/backends/dummy#close
   **/
  close(callback) {
    return Promise.resolve(true)
  }
}
