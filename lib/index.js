/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict'
/**
 * exposes the low level caching interface for the alice platform
 * @module membrane/lib
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires keef
 * @requires events
 * @requires util
 * @requires path
 * @requires gaz/lang
 * @requires gaz/function
 */

var conf       = require('keef')
  , logger     = require('bitters')
  , events     = require('events')
  , util       = require('util')
  , debug      = require('debug')('membrane')
  , path       = require('path')
  , {clone}    = require("gaz/lang")
  , {attempt}  = require('gaz/function')
  , Cache
  ;

var caches = clone( conf.get('caches') || {} )
var emitter = new events.EventEmitter()

function getBackend( name ){
  if( caches.hasOwnProperty( name ) ){
    return caches[name]
  }
  const error = new Error(`No cached ${name} found`)
  error.name  = 'ImproperlyConfigured'
  error.code = 'ECACHE'
  error.type = 'improper_configuration'
  throw error
}

/**
 * #### Cache module interface
 * The cache module exposes all of the cache methods which are alias methods to methods of the same name on the `default` cache
 * The cache module is also a function, that accepts the `name` of a specific cache to interact with if the default one is not optimal.
 * @alias module:membrane
 * @param {String} name The name of the cache to return as defined in the `caches` configuration
 * @throws {ImporoperlyConfigured} error
 * @example {@lang javascript}var cache = require("membrane")
 * cache.get('foo', console.log)
 * // same as
 * cache('default').get('foo', console.log)
 */
Cache = function Cache( cache ){
  return getBackend( cache );
};

for (const [name, cache] of Object.entries(caches)) {
  if( name == 'default' || !!cache.default ){
    debug("setting %s cache backend as default", cache.backend );
  }
  const bkend = attempt(
    () => {
      const backend_path = path.join(__dirname, 'backends', cache.backend)
      return require(backend_path)
    }
  , () => {
      return require(cache.backend)
    }
  )
  if( !bkend ){
    logger.error('unable to locate cache backend %s', cache.backend );
    caches[name] = null
  } else {
    debug('loading %s cache backend', cache.backend, cache );
    caches[name] = new bkend( cache );
    Object.defineProperty(Cache, name, {
      get: function get( ){
        return getBackend( name );
      }
    });
  }
}

if( Cache.default ){
  const error = Error('No default cache defined')
  error.name = 'ImproperlyConfigured'
  error.code = 'ECACHEDEFAULT'
  error.type = 'improperly_configured'

  throw error
}

Object.defineProperties(Cache, {
  /**
   * Short cut to the get method of the default cache backend
   * @static
   * @function get
   * @memberof module:membrane
   * @param {...String} key The key(s) to fetch from the
   * @param {Function} callback callback function to be executed when the operation is copmlete
   */
  get: {
    writeable: false
  , value: function get(...args) {
      const bkend = getBackend('default')
      return bkend.get(...args)
    }
  }
  /**
   * Short cut to the set method of the default cache backend
   * @static
   * @function set
   * @memberof module:membrane
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   * @param {Function} callback A callback function to be executed when the operation is finished
   */
, set: {
    writeable: false
  , value: function set(...args) {
      const bkend = getBackend('default')
      return bkend.set(...args)
    }
  }
  /**
   * Short cut to the has method of the default cache backend
   * @static
   * @function has
   * @memberof module:membrane
   * @param {String} key Key to check
   */
, has: {
    writeable: false
  , value: function has(...args) {
      const bkend = getBackend('default')
      return bkend.has(...args)
    }
  }
, touch: {
    writeable: false
  , value: function touch(...args) {
      const bkend = getBackend('default')
      return bkend.touch(...args)
    }
  }
  /**
   * Short cut to the add method of the default cache backend
   * @static
   * @function add
   * @memberof module:membrane
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   * @param {Function} callback A callback function to be executed when the operation is finished
   */
, add: {
    writeable: false
  , value: function add(...args) {
      const bkend = getBackend('default')
      return bkend.add(...args)
    }
  }

  /**
   * Short cut to the incr method of the default cache backend
   * @static
   * @function incr
   * @memberof module:membrane
   * @param {String} key The key to increment if it exists
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
, incr: {
    writeable: false
  , value: function incr() {
      const bkend = getBackend('default')
      return bkend.incr(...args)
    }
  }

  /**
   * Short cut to the decr method of the default cache backend
   * @static
   * @function decr
   * @memberof module:membrane
   * @param {String} key The key to decrement if it exists
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
, decr: {
    writeable: false
  , value: function decr(...args){
      const bkend = getBackend('default')
      return bkend.decr(...args)
    }
  }
  /**
   * Short cut to the push method of the default cache backend
   * @static
   * @function push
   * @memberof module:membrane
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
, push: {
    writeable: false
  , value: function push(...args) {
      const bkend = getBackend('default')
      return bkend.push(...args)
    }
  }
  /**
   * Short cut to the pop method of the default cache backend
   * @static
   * @function pop
   * @memberof module:membrane
   * @param {String} key Key to identify a value
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
, pop: {
    writeable: false
  , value: function pop(...args) {
      const bkend = getBackend('default')
      return bkend.pop(...args)
    }
  }

, flush: {
    writeable: false
  , value: function flush(...args) {
      const bkend = getBackend('default')
      return bkend.flush(...args)
    }
  }
  /**
   * Short cut to the close method of the default cache backend
   * @static
   * @function close
   * @memberof module:membrane
   * @param {String} key the name of he key to look up
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
, close: {
    writeable: false
  , value: function close(...args) {
      const bkend = getBackend('default')
      return bkend.close(...args)
    }
  }

  /**
   * Adds an event handler to the cache object
   * @static
   * @function addListener
   * @memberof module:membrane
   * @param {String} event Name of the event to add a listener to
   * @param {Function} handler A handlerto be executed when the even fires
   **/
, addListener: {
    writeable: false
  , value: function addListener (name, fn) {
      return emitter.addListener(name, fn)
    }
  }

  /**
   * Removes an event handler to the cache object
   * @static
   * @function removeListener
   * @memberof module:membrane
   * @param {String} event Name of the event to remove the handler from
   * @param {Function} handler The handler to remove. Must be a reference to the original function passed to {@link module:membrane.addListener|addListener}
   **/
, removeListener: {
    writeable: false
  , value: function removeListener (name, fn) {
      return emitter.removeListener(name, fn)
    }
  }

  /**
   * Emits an event triggering all associated handlers to be executed
   * @static
   * @function emit
   * @memberof module:membrane
   * @param {String} event Name of the event to fire
   * @param {...Object} arguments any number of items to supply as arguments to the event handlers
   **/
, emit: {
    writeable: false
  , value: function emit (name, ...args) {
      return emitter.emit(name, ...args)
    }
  }

  /**
   * shortcut to {@link module:membrane.addListener|addListener}
   * @static
   * @see {@link module:membrane.addListener|addListener}
   * @function on
   * @memberof module:membrane
   * @param {String} event Name of the event to add a listener to
   * @param {Function} handler A handlerto be executed when the even fires
   **/
, on: {
    writeable:false
  , value: function on (name, fn) {
      return emitter.on(name, fn)
    }
  }

  /**
   * Similar to to {@link module:membrane.addListener|addListener},
   * with the exception that the handlers will be executed once and immdiately removed
   * @static
   * @see {@link module:membrane.addListener|addListener}
   * @function once
   * @memberof module:membrane
   * @param {String} event Name of the event to add a listener to
   * @param {Function} handler A handlerto be executed when the even fires
   **/
  ,once:{
    writeable: false
  , value: function once (name, fn) {
      return emitter.once(name, fn)
    }
  }
  /**
   * Removes all handlers for all events, effectively resetting the emitter instance
   * @static
   * @function removeAllListener
   * @memberof module:membrane
   **/
, removeAllListeners: {
    writeable: false
  , value: function removeAllListeners (...args){
      return emitter.removeAllListeners(...args)
    }
  }

  /**
   * Sets a limit to the number of handlers an instance can have before throwing warning errors. `0` is unlimited
   * @static
   * @function setMaxListeners
   * @memberof module:membrane
   **/
, setMaxListeners: {
    writeable: false
  , value: function setMaxListeners (...args) {
      return emitter.setMaxListeners(...args)
    }
  }
})

module.exports = Cache
