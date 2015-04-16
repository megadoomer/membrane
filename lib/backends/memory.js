/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Provides the base implementation of the cache interface
 * @module hive-cache/lib/backends/memory
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires events
 * @requires util
 * @requires debug
 * @requires hive-conf
 * @requires hive-log
 * @requires hive-stdlib/class
 * @requires hive-stdlib/array
 * @requires hive-stdlib/function
 * @requires hive-stdlib/lang
 * @requires hive-stdlib/class/options
 * @requires hive-core/exceptions
 */
var events     = require( 'events' )
  , util       = require( 'util' )
  , conf       = require( 'hive-conf' )
  , logger     = require( 'hive-log' )
  , Class      = require( 'hive-stdlib/class' )
  , noop       = require( 'hive-stdlib/function' ).noop
  , toArray    = require( 'hive-stdlib/lang' ).toArray
  , remove     = require( 'hive-stdlib/array' ).remove
  , Exception  = require( 'hive-stdlib/exception' )
  , typeOf     = require( 'hive-stdlib/typeOf' )
  , debug      = require( 'debug' )( 'alice:cache:memory' )
  , Cache      = require( './base' )
  , memory     = {};
  ;


function removeKey( key ){
	memory[key] = undefined;
};


/**
 * Base Level Cache interface
 * @constructor
 * @alias module:hive-cache/lib/backends/memory
 * @param {Object} options
 * @param {Number} [options.timeout=30000] timeout in ms that a key should persist
 * @param {String} [options.prefix='']
 */
module.exports = new Class(/* @lends module:hive-cache/lib/backends/memory.prototype */{
	inherits: Cache  

	/**
	 * Adds a value to the cache backend if it doesn't already exist
	 * @method module:hive-cache/lib/backends/memory#add
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, add: function add( key, value, timeout, cb ){
		var _key = this.options.keyfn.call( this , key )
		if( !memory.hasOwnProperty( _key ) || memory[_key] == undefined ){
			return this.set( key, value, timeout, cb )
		}

		cb && cb(null, memory[_key] )
	}

	/**
	 * retrieve on or more value from the cache backend
	 * @method module:hive-cache/lib/backends/memory#get
	 * @param {...String} key The key(s) to fetch from the  
	 * @param {Function} callback callback function to be executed when the operation is copmlete
	 **/
	, get: function get( key /* [, key, key, ...]*/){
		var callback =  typeof arguments[ arguments.length - 1] == 'function' ? Array.prototype.pop.apply( arguments ) : noop;
		var multiget = arguments.length > 1;
		var result;

		if( multiget ){
			result = {};
			for(var x = 0, len=arguments.length; x <len; x++ ){
				result[ arguments[x] ] = memory[ this.options.keyfn.call(this, arguments[x] ) ];
			}
		} else{
			result = memory[ this.options.keyfn.call(this, key ) ] 
		}
		return callback( null, result );
	}

	/**
	 * Sets a value a specific key
	 * @method module:hive-cache/lib/backends/memory#set
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, set: function set( key, value, timeout, callback ){
		memory[this.options.keyfn.call(this, key) ] = value
		setTimeout(removeKey.bind(null, this.options.keyfn.call(this, key)), timeout || this.options.timeout );
		return callback && callback( null, value );
  }

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method module:hive-cache/lib/backends/memory#incr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, incr: function incr( key, callback ){
		var _key = this.options.keyfn.call( this, key );
		var value = memory[ _key ];
		memory[ _key ] = ( ( typeof value == "number" ? value : 0  ) + 1 ); 
		return callback && callback( null, memory[ _key ]);
	}

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method module:hive-cache/lib/backends/memory#decr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, decr: function decr( key, callback ){
		var _key = this.options.keyfn.call( this, key );
		var value = memory[ _key ];
		memory[ _key ] = ( ( typeof value == "number" ? value : 0  ) - 1 ); 
		return callback && callback( null, memory[ _key ]);
	}

	/**
	 * Appends a value to an array
	 * @method module:hive-cache/lib/backends/memory#push
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, push: function push( key, value, timeout, callback ){
		var _key = this.options.keyfn.call( this, key );
		var _value = memory[ _key ]
		
		if( !Array.isArray( _value ) ){
			_value = toArray( _value )
		}
		
		_value.push( value );
		memory[_key] = _value;
		return callback && callback( null, _value );  	
	}

	/**
	 * Removes a specific key from an array. If no key is specified, the last value is removed
	 * @method module:hive-cache/lib/backends/memory#pop
	 * @param {String} key Key to identify a value
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, pop: function pop( key /*, value, callback */ ){
		var callback =  typeof arguments[ arguments.length - 1] == 'function' ? Array.prototype.pop.apply( arguments ) : noop;
		var _key = this.options.keyfn.call( this, key );
		var _value = memory[ _key ]
		var find = arguments[1];
		var ret = null;
		var e = null;
		
		if( !Array.isArray( _value ) ){
			e = new Exception({
				name: "CacheException"
				,code: 6000
				,type:'invalid_operation'
				,message:util.format( "Can not call pop on %s values", typeOf( _value ) )
			})
			this.emit('error', e )
		}
		
		ret = find ? !remove( _value, find ) && find  : _value.pop()
		return callback && callback( e, ret );  	
	}

	/**
	 * Checks to verify if a key still holds a value
	 * @method module:hive-cache/lib/backends/memory#has
	 * @param {String} key the name of he key to look up
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, has: function has( key, callback ){
		var e = new exceptions.NotImplemented({
			message:"Subclass of base cache must implement has() method"

		});	
		logger.error('cache error: %s: %s', e.name, e.message );
		/**
		 * @name module:hive-cache/lib/backends/memory#error
		 * @event
		 * @param {NotImplmented} exception not not implemented excpetion
		 **/
		this.emit( 'error', e );
		return callback && callback( e, null );  	
	}

	/**
	 * Clears the internal internal memory 
	 * @method  module:hive-cache/lib/backends/memory#flush
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, flush: function flush( cb ){
		memory = {};
		return cb && cb( null );
	}
	/**
	 * marks the instanceas closed
	 * @method module:hive-cache/lib/backends/memory#close
	 * @param {closeCallback} callback A callback function to be executed when the operation is finished
	 **/
	, close: function close( cb ){
		return cb && cb( null );
	}
});

/**
 * Callback called when the close function is executed.
 * @callback module:hive-cache/lib/backends/memory~closeCallback
 * @param {Error} err an error if their was one
 */
