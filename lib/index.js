/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * exposes the low level caching interface for the alice platform
 * @module hive-cache/lib
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires hive-conf
 * @requires events
 * @requires util
 * @requires path
 * @requires hive-stdlib/lang
 * @requires hive-core/exceptions
 * @requires hive-stdlib/function
 */

var conf       = require('hive-conf')
  , logger     = require('hive-log')
  , events     = require('events')
  , util       = require('util')
  , path       = require('path')
  , clone      = require("hive-stdlib/lang").clone
  , exceptions = require('hive-queen/exceptions')
  , attempt    = require('hive-stdlib/function').attempt
  , hasDefault = false
  , Cache
  ;


var caches = clone( conf.get('caches') || {} );
var emitter = new events.EventEmitter();

function getBackend( name ){
	if( caches.hasOwnProperty( name ) ){
		return caches[name]
	}
	throw new exceptions.ImproperlyConfigured({message:"No cache named " + name + ' found'});
	// emit ImproperlyConfigured Error
}


/**
 * #### Cache module interface
 * The cache module exposes all of the cache methods which are alias methods to methods of the same name on the `default` cache
 * The cache module is also a function, that accepts the `name` of a specific cache to interact with if the default one is not optimal.
 * @alias module:hive-cache
 * @param {String} name The name of the cache to return as defined in the `caches` configuration
 * @throws {ImporoperlyConfigured} error
 * @example {@lang javascript}var cache = require("hive-cache")
 * cache.get('foo', console.log)
 * // same as
 * cache('default').get('foo', console.log)
 */
Cache = function Cache( cache ){
	return getBackend( cache );
};

Object
	.keys(caches)
	.forEach(function(key){

		if( key == 'default' || !!caches[key].default ){
			hasDefault = true;
			logger.info("setting %s cache backend as default", caches[key].backend );
		}
        var bkend = attempt(
			function(){
				return require( path.join( __dirname, 'backends', caches[ key ].backend ) );
			}

			,function(){
				return require( caches[ key ].backend );
			}
		)
		if( !bkend ){
			logger.error('unable to locate cache backend %s', caches[ key ].backend );
		} else {
			logger.info('loading %s cache backend', caches[ key ].backend, caches[key] );
			caches[ key ] = new bkend( caches[ key ] );
			Object.defineProperty(Cache, key, {
				get: function get( ){
					return getBackend( key );
				}
			});
		}
	}
)

if( !hasDefault ){
	emitter.emit('error', new exceptions.ImproperlyConfigured({message:"No default cache defined"}))
	module.exports = {};
}


Object.defineProperties(Cache,{
	/**
	 * Short cut to the get method of the default cache backend
	 * @static
	 * @function get
	 * @memberof module:hive-cache
	 * @param {...String} key The key(s) to fetch from the
	 * @param {Function} callback callback function to be executed when the operation is copmlete
	 */
	get:{
		writeable: false
		,value:function get(){
			var bkend = getBackend('default');
			return bkend.get.apply( bkend, arguments );
		}
	}
	/**
	 * Short cut to the set method of the default cache backend
	 * @static
	 * @function set
	 * @memberof module:hive-cache
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 */
	, set:{
		writeable: false
		,value:function set(){
			var bkend = getBackend('default');
			return bkend.set.apply( bkend, arguments );
		}
	}
	/**
	 * Short cut to the add method of the default cache backend
	 * @static
	 * @function add
	 * @memberof module:hive-cache
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 */
	, add:{
		writeable: false
		,value:function add(){
			var bkend = getBackend('default');
			return bkend.add.apply( bkend, arguments );
		}
	}

	/**
	 * Short cut to the incr method of the default cache backend
	 * @static
	 * @function incr
	 * @memberof module:hive-cache
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, incr:{
		writeable: false
		,value:function incr(){
			var bkend = getBackend('default');
			return bkend.incr.apply( bkend, arguments );
		}
	}

	/**
	 * Short cut to the decr method of the default cache backend
	 * @static
	 * @function decr
	 * @memberof module:hive-cache
	 * @param {String} key The key to decrement if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, decr:{
		writeable: false
		,value:function decr(){
			var bkend = getBackend('default');
			return bkend.decr.apply( bkend, arguments );
		}
	}
	/**
	 * Short cut to the push method of the default cache backend
	 * @static
	 * @function push
	 * @memberof module:hive-cache
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	,push:{
		writeable: false
		,value:function push(){
			var bkend = getBackend('default');
			return bkend.push.apply( bkend, arguments );
		}
	}
	/**
	 * Short cut to the pop method of the default cache backend
	 * @static
	 * @function pop
	 * @memberof module:hive-cache
	 * @param {String} key Key to identify a value
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, pop:{
		writeable: false
		,value:function pop(){
			var bkend = getBackend('default');
			return bkend.pop.apply( bkend, arguments );
		}
	}

	, flush:{
		writeable: false
		,value:function flush(){
			var bkend = getBackend('default');
			return bkend.flush.apply( bkend, arguments );
		}
	}
	/**
	 * Short cut to the close method of the default cache backend
	 * @static
	 * @function close
	 * @memberof module:hive-cache
	 * @param {String} key the name of he key to look up
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, close:{
		writeable: false
		,value:function close(){
			var bkend = getBackend('default');
			return bkend.close.apply( bkend, arguments );
		}
	}

	/**
	 * Adds an event handler to the cache object
	 * @static
	 * @function addListener
	 * @memberof module:hive-cache
	 * @param {String} event Name of the event to add a listener to
	 * @param {Function} handler A handlerto be executed when the even fires
	 **/
	,addListener:{
		writeable:false
		,value:function addListener (){
			return emitter.addListener.apply( emitter, arguments );
		}
	}

	/**
	 * Removes an event handler to the cache object
	 * @static
	 * @function removeListener
	 * @memberof module:hive-cache
	 * @param {String} event Name of the event to remove the handler from
	 * @param {Function} handler The handler to remove. Must be a reference to the original function passed to {@link module:hive-cache.addListener|addListener}
	 **/
	,removeListener:{
		writeable:false
		,value:function removeListener (){
			return emitter.removeListener.apply( emitter, arguments );
		}
	}

	/**
	 * Emits an event triggering all associated handlers to be executed
	 * @static
	 * @function emit
	 * @memberof module:hive-cache
	 * @param {String} event Name of the event to fire
	 * @param {...Object} arguments any number of items to supply as arguments to the event handlers
	 **/
	,emit:{
		writeable:false
		,value:function emit (){
			return emitter.emit.apply( emitter, arguments );
		}
	}

	/**
	 * shortcut to {@link module:hive-cache.addListener|addListener}
	 * @static
	 * @see {@link module:hive-cache.addListener|addListener}
	 * @function on
	 * @memberof module:hive-cache
	 * @param {String} event Name of the event to add a listener to
	 * @param {Function} handler A handlerto be executed when the even fires
	 **/
	,on:{
		writeable:false
		,value:function on (){
			return emitter.on.apply( emitter, arguments );
		}
	}

	/**
	 * Similar to to {@link module:hive-cache.addListener|addListener},
	 * with the exception that the handlers will be executed once and immdiately removed
	 * @static
	 * @see {@link module:hive-cache.addListener|addListener}
	 * @function once
	 * @memberof module:hive-cache
	 * @param {String} event Name of the event to add a listener to
	 * @param {Function} handler A handlerto be executed when the even fires
	 **/
	,once:{
		writeable:false
		,value:function once (){
			return emitter.once.apply( emitter, arguments );
		}
	}
	/**
	 * Removes all handlers for all events, effectively resetting the emitter instance
	 * @static
	 * @function removeAllListener
	 * @memberof module:hive-cache
	 **/
	,removeAllListeners:{
		writeable:false
		,value:function removeAllListeners (){
			return emitter.removeAllListeners.apply( emitter, arguments );
		}
	}

	/**
	 * Sets a limit to the number of handlers an instance can have before throwing warning errors. `0` is unlimited
	 * @static
	 * @function setMaxListeners
	 * @memberof module:hive-cache
	 **/
	,setMaxListeners:{
		writeable:false
		,value:function setMaxListeners (){
			return emitter.setMaxListeners.apply( emitter, arguments );
		}
	}
});

module.exports = Cache
