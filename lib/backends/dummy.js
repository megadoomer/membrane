/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Provides the base implementation of the cache interface
 * @module alice-cache/lib/backends/dummy
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires alice-stdlib/class
 * @requires alice-core/exceptions
 * @requires alice-stdlib/function
 * @requires alice-cache/backends/base
 */
var logger = require('alice-log')                    // alice-log package
  , Class  = require( 'alice-stdlib/class' )         // standard class implementation
  , noop   = require( 'alice-stdlib/function' ).noop // empty function
  , Cache  = require( './base' )                     // Base Cache interface to implmement
  ;

/**
 * Dummy Cache backend for testing
 * @alias module:alice-cache/lib/backends/dummy
 * @constructor 
 * @extends module:alice-cache/lib/backends/base
 * @param {Object} options
 * @param {Number} [options.timeout=30000] timeout in ms that a key should persist
 * @param {String} [options.prefix='alice']
 */
module.exports = new Class(/* @lends module:alice-cache/lib/backends/dummy.prototype */{
	inherits: Cache

	, constructor: function( options ){
	
		this.parent( 'constructor', options )
		logger.notice("Dummy cache backend configured");
		logger.warning('The dummy backend is for testing purposes only')
	}


	/**
	 * Adds a value to the cache backend if it doesn't already exist
	 * @method module:alice-cache/lib/backends/dummy#add
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, add: function add( key, value, timeout, callback ){
		return callback && callback( null, null );
	}

	/**
	 * retrieve on or more value from the cache backend
	 * @method module:alice-cache/lib/backends/dummy#get
	 * @param {...String} key The key(s) to fetch from the  
	 * @param {Function} callback callback function to be executed when the operation is copmlete
	 **/
	, get: function get(){
		var callback = typeof arguments[arguments.length -1 ] == 'function' ? arguments[arguments.length -1 ] : noop
		return callback && callback( null, null );
	}

	/**
	 * Sets a value a specific key
	 * @method module:alice-cache/lib/backends/dummy#set
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, set: function set( key, value, timeout, callback ){
		return callback && callback( null, value );
  }

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method module:alice-cache/lib/backends/dummy#incr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, incr: function incr( key, callback ){

		return callback && callback( null, 1 );
	}

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method module:alice-cache/lib/backends/dummy#decr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, decr: function decr( key, callback  ){
		return callback && callback( null, 0 );  	
	}

	/**
	 * Appends a value to an array
	 * @method module:alice-cache/lib/backends/dummy#push
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, push: function push(key, value, timeout, callback ){
		return callback && callback( null, [ value ] )
	}

	/**
	 * Removes a specific key from an array. If no key is specified, the last value is removed
	 * @method module:alice-cache/lib/backends/dummy#pop
	 * @param {String} key Key to identify a value
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, pop: function pop(key, callback ){
		return callback && callback( null, null );  	
	}

	/**
	 * Checks to verify if a key still holds a value
	 * @method module:alice-cache/lib/backends/dummy#has
	 * @param {String} key the name of he key to look up
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, has: function has(key, callback ){
		return callback && callback( null, false );  	
	}

	/**
	 * Clears the internal redis database
	 * @method module:alice-cache/lib/backends/dummy#flush
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, flush: function flush(callback){
		return callback && callback( null, null );  
	}

	/**
	 * Closes the connection to the redis database
	 * @method module:alice-cache/lib/backends/dummy#close
	 * @param {closeCallback} callback A callback function to be executed when the operation is finished
	 **/
	,close: function close( callback ){
		return callback && callback( null, true );  
	}
});

/**
 * Callback called when the close function is executed
 * @callback module:alice-cache/lib/backends/dummy~closeCallback
 * @param {Error} err an error if their was one
 */