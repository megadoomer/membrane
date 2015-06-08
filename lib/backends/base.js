/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Provides the base implementation of the cache interface
 * @module hive-cache/lib/backends/base
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires events
 * @requires util
 * @requires hive-conf
 * @requires hive-log
 * @requires hive-stdlib/class
 * @requires hive-stdlib/class/options
 * @requires hive-queen/exceptions
 */
var events     = require( 'events' )                     // node events module
  , util       = require( 'util' )                       // node util for formatting
  , conf       = require( 'hive-conf' )                 // alice conf package for loading settings
  , logger     = require( 'hive-log' )                  // alice logger package
  , Class      = require( 'hive-stdlib/class' )         // alice standard Class
  , Options    = require( 'hive-stdlib/class/options' ) // alice class Options mixin
  , Parent     = require( 'hive-stdlib/class/parent' ) // Parent mixin for Class
  , exceptions = require( 'hive-stdlib/exception' )      // core exception classes
  ;

/**
 * Base Level Cache interface
 * @alias module:hive-cache/lib/backends/base
 * @constructor
 * @mixes module:hive-stdlib/class/options
 * @mixes module:hive-stdlib/class/parent
 * @param {Object} options
 * @param {Number} [options.timeout=30000] timeout in ms that a key should persist
 * @param {String} [options.prefix='alice'] a key prefix to help avoid key collisions
 * @param {String|Object} [options.location=''] The location of the cache server to connection, if their is one. if an object is provided it will be used to generate a connection string
 * @param {Function} [options.keyfn] a function used to generate namepased keys. defaults to prefix +'_'+ key
 */
module.exports = new Class(/* @lends module:hive-cache/lib/backends/base.prototype */{
	inherits: events.EventEmitter
	, mixin:[ Options, Parent]
  
	, options:{
		  timeout:( 1000 * 60 * 5 )
		, prefix:'alice'
		, location: null
		, keyfn: function( key ){
			return util.format( '%s_%s', this.options.prefix, key );
		}
	}

	, constructor: function( options ){
	
		this.setOptions( options )
	}


	/**
	 * Adds a value to the cache backend if it doesn't already exist
	 * @method module:hive-cache/lib/backends/base#add
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, add: function add( key, value, timeout, cb ){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement add() method"
		});
		logger.error('cache error: %s: %s', e.name, e.message );
		this.emit( 'error', e);
		return cb && cb( e, null );
	}

	/**
	 * retrieve on or more value from the cache backend
	 * @method module:hive-cache/lib/backends/base#get
	 * @param {...String} key The key(s) to fetch from the  
	 * @param {Function} callback callback function to be executed when the operation is copmlete
	 **/
	, get: function get(){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement get() method"

		});

		logger.error('cache error: %s: %s', e.name, e.message );
		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/	
		this.emit( 'error', e);
		return cb && cb( e, null );
	}

	/**
	 * Sets a value a specific key
	 * @method module:hive-cache/lib/backends/base#set
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, set: function set( key, value, timeout, callbcak ){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement set() method"
		});

		logger.error('cache error: %s: %s', e.name, e.message );

		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/	
		this.emit( 'error', e);

		return cb && cb( e, null );
  }

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method module:hive-cache/lib/backends/base#incr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, incr: function incr( ){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement incr() method"

		});
		logger.error('cache error: %s: %s', e.name, e.message );

		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/	
		this.emit( 'error', e);
		return cb && cb( e, null );
	}

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method module:hive-cache/lib/backends/base#decr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, decr: function decr( ){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement decr() method"

		});
		logger.error('cache error: %s: %s', e.name, e.message );

		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/
		this.emit( 'error', e);
		return cb && cb( e, null );  	
	}

	/**
	 * Appends a value to an array
	 * @method module:hive-cache/lib/backends/base#push
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, push: function push(key, value, timeout, callback ){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement push() method"

		});
		logger.error('cache error: %s: %s', e.name, e.message );
		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/	
		this.emit( 'error', e);
		return cb && cb( e, null );  	
	}

	/**
	 * Removes a specific key from an array. If no key is specified, the last value is removed
	 * @method module:hive-cache/lib/backends/base#pop
	 * @param {String} key Key to identify a value
	 * @param {Function} [callback] A callback function to be executed when the operation is finished
	 **/
	, pop: function pop(key, callback ){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement pop() method"

		});
		logger.error('cache error: %s: %s', e.name, e.message );
		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/
		this.emit( 'error', e);
		return cb && cb( e, null );  	
	}

	/**
	 * Checks to verify if a key still holds a value
	 * @method module:hive-cache/lib/backends/base#has
	 * @param {String} key the name of he key to look up
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, has: function has(){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement has() method"

		});	
		logger.error('cache error: %s: %s', e.name, e.message );
		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/
		this.emit( 'error', e);
		return cb && cb( e, null );  	
	}

	, flush: function flush(callback){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement has() method"

		});	
		logger.error('cache error: %s: %s', e.name, e.message );
		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/
		this.emit( 'error', e);
		return cb && cb( e, null );  
	}

	,close: function close( callback ){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement has() method"

		});	
		logger.error('cache error: %s: %s', e.name, e.message );
		/**
		 * @name module:hive-cache/lib/backends/base#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/
		this.emit( 'error', e);
		return cb && cb( e, null );  
	}
});
