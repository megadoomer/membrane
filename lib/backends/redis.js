/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Provides the redis implementation of the cache interface
 * @module alice-cache/lib/backends/redis
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires events
 * @requires util
 * @requires alice-conf
 * @requires alice-log
 * @requires alice-stdlib/class
 * @requires alice-stdlib/class/options
 * @requires alice-core/exceptions
 */
var events        = require( 'events' )
  , util          = require( 'util' )
  , conf          = require( 'alice-conf' )
  , logger        = require( 'alice-log' )
  , redis         = require( 'redis' )
  , url           = require( 'url' )
  , async         = require( 'async' )
  , toArray       = require( 'mout/lang/toArray')
  , Class         = require( 'alice-stdlib/class' )
  , exceptions    = require( 'alice-core/exceptions' )
  , noop          = require( 'alice-stdlib/function' ).noop
  , isNumber      = require( 'alice-stdlib/lang').isNumber
  , typecast      = require( 'alice-stdlib/string' ).typecast
  , Cache         = require( './base' )
  ;

/**
 * Redis redis backend for the Cache interface
 * @alias module:alice-cache/lib/backends/redis
 * @constructor
 * @param {Object} options Configuration option overrides
 * @param {Object|String} options.location connection information for redis. If using a string, it must be a fully qualified URI. ( redis://user:pass@localhost:6379 ) 
 * @param {String} [options.host=localhost] host name or ip where redis server lives
 * @param {Number} [options.port=6379] Port number redis server is running on
 * @param {Object} [options.options] Additional connection options to send to redis
 * @param {Object} [options.options.db=0] The default database to select upon start up
 * @extends module:alice-cache/lib/backends/base
 */
module.exports = new Class({
	inherits: Cache
	,options:{
		location:{
			host:'localhost'
			,port:6379
		}
		,options:{
			db:0
		}
	}
	, constructor: function( options ){
		var connect  // redis connection options
		  , location // server location
		  , db
		  ;

		db = this.options.options && parseInt( this.options.options.db ); 
		this.parent('constructor', options );
		location = this.options.location;
		connect = typeof location == 'string' ? url.parse( location ) : location;
		logger.debug("connecting redis cache backend", connect );
		this.cli = redis.createClient( connect.port, ( connect.hostname || connect.host ), this.options.options );
		isNumber(db) && this.cli.select( db );
		this.cli.auth( connect.auth && connect.auth.split(":")[1], noop );
	}


	/**
	 * Adds a value to the cache backend if it doesn't already exist
	 * @method module:alice-cache/lib/backends/redis#add
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, add: function add( key, value, timeout, callback ){
		callback = callback || noop
		var that = this;
		var _key = this.options.keyfn.call(this, key )
		var trans = this.cli.multi();
		trans
			.get(_key)
			.setnx(_key, value )
			.exec(function(err, replies ){
				// original 1
				// set 2
				that.cli.pexpire(
					key
					, ( timeout || that.options.timeout )
					, function(exerr, exreply){
						// if the value was set return the value
						// else return the value at the key
						callback( exerr, typecast( !!replies[1] ?  value  : replies[0] ) )
					}
				)
			})
	}

	/**
	 * retrieve on or more value from the cache backend
	 * @method  module:alice-cache/lib/backends/redis#get
	 * @param {...String} key The key(s) to fetch from the  
	 * @param {Function} callback callback function to be executed when the operation is copmlete
	 **/
	, get: function get(){
		var args         = toArray( arguments )
		  , callback     =  typeof args[ args.length - 1] == 'function' ? args.pop() : noop
		  , keys         = args.map( this.options.keyfn.bind( this ) )
		  , type_trans   = this.cli.multi()
		  , values_trans = this.cli.multi()
		  ;

		async.waterfall([
			function( cb ){
				for(var x=0, len=keys.length; x<len; x++){
					type_trans.type( keys[x] )
				}

				type_trans.exec( cb )
			}

			,function( types, cb ){
				for(var x=0, len=keys.length; x<len; x++){
					if( types[x] == 'list' ){
						values_trans.lrange( keys[x],0, -1 )
					}
					values_trans.get( keys[x] )
				}

				values_trans.exec( cb )

			}

		], function( err, results ){
			var ret = {}, x=0, len=args.length;

			if( len === 1 ){
				return callback( err, typeof results[ 0 ] == 'string' ? typecast( results[0] ) : results[0] );
			}

			for( var x=0,len=args.length; x < len; x++ ){
				ret[ args[x] ] = typeof results[ x ] == 'string' ? typecast( results[x] ) : results[x]
			}
			
			callback( err, ret );
		});
	}

	/**
	 * Sets a value a specific key
	 * @method  module:alice-cache/lib/backends/redis#set
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, set: function set( key, value, timeout, callback ){
		callback = callback || noop
		this.cli.psetex(
			this.options.keyfn.call(this, key) 
			,timeout || this.options.timeout
			,value
			,function(e,v){ callback( e, value, v) }	
		);
  }

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method  module:alice-cache/lib/backends/redis#incr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, incr: function incr( key, callback ){
		this.cli.incr( this.options.keyfn.call( this, key ), callback )
	}

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method  module:alice-cache/lib/backends/redis#decr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, decr: function decr(key, callback ){
		this.cli.decr( this.options.keyfn.call( this, key ), callback )
	}

	/**
	 * Appends a value to an array
	 * @method  module:alice-cache/lib/backends/redis#push
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, push: function push(key, value, timeout, callback ){
		var _key = this.options.keyfn.call( this, key )
		  , that = this
		  ;
		  
		callback = callback || noop;
		this.cli.type( _key, function( err, type ){
			switch( type ){
				// if the key is a list, or doesn't exists, just push the value
				case 'list':
				case 'none':				
					that.cli.rpush( _key, value, function(perr){
						that.cli.pexpire( 
							key
							, timeout || that.options.timeout
							, callback 
						)
					});
					break;

				// if the key is a string value.
				// 1. get the value
				// 2. delete the key
				// 3. push the value to a list
				// 4. set expiration time
				case 'string':
					that.cli.get(_key, function(err, result ){
						that.cli.del(_key, function( derr ){
							that.cli.rpush( _key, value, function(){
								that.cli.pexpire(
									_key
									, timeout||that.options.timeout
									, callback 
								 );
							});
						});
					});
					break

				default:
					callback(new Error(), null)
			}
		})
	}

	/**
	 * Removes a specific key from an array. If no key is specified, the last value is removed
	 * @method  module:alice-cache/lib/backends/redis#pop
	 * @param {String} key Key to identify a value
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, pop: function pop(key/*, value, callback */ ){
		
		var _key = this.options.keyfn.call( this, key )
		  , args = toArray( arguments )
		  , callback =  typeof args[ args.length - 1] == 'function' ? args.pop() : noop
		  , find = args[1]
		  , that = this
		  ;
		  
		this.cli.type( _key, function( err, type ){
			switch( type ){
				case 'list':
					if( find ){
						that.cli.lrem(_key, 1, find, function(){
							that.cli.pexpire( 
								key
								,  that.options.timeout
								, callback 
							)							
						})
					} else {
						that.cli.lpop( _key, function(perr){
							that.cli.pexpire( 
								key
								, that.options.timeout
								, callback 
							)
						});
					}
					break;

				case 'none':				
				case 'string':				
				case 'set':				
				case 'zset':				
				case 'hash':				
					callback(null, null);

				default:
					callback(new Error(), null)
			}
		})
	}

	/**
	 * Checks to verify if a key still holds a value
	 * @method  module:alice-cache/lib/backends/redis#has
	 * @param {String} key the name of he key to look up
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, has: function has(key, callback ){
		this.cli.exists( this.options.keyfn.call( this, key), function(e,v){callback(e, !!v)})
	}

	/**
	 * Clears the internal redis database
	 * @method  module:alice-cache/lib/backends/redis#flush
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, flush: function flush(callback){
		this.cli.flushdb(callback||noop)
	}

	/**
	 * Closes the connection to the redis database
	 * @method module:alice-cache/lib/backends/redis#close
	 * @param {closeCallback} callback A callback function to be executed when the operation is finished
	 **/
	,close: function close( callback ){
		this.cli.quit( callback || noop )
	}
});

/**
 * Callback called when the close function is executed.
 * @callback module:alice-cache/lib/backends/redis~closeCallback
 * @param {Error} err an error if their was one
 */
