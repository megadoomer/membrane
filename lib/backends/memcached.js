/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Provides the memcached implementation of the cache interface
 * ### Configuration
 * Configuring a memcache connection is done through the {@link module:alice-cache|Cache} module.
 * To use memcache as the default cache, you must configure `memcached` as the default backend.
 * ##### config file
 * ```
 * {
 *	"caches":{
		"default":{
			"backend":"memcached"
		}
	}
 * }
 * ```
 * ##### environment variable
 * ```
 * caches__default__backend=memcached
 * ```
 * This will set up a memcache connection using the defaults settings running on `localhost` on port `11211`
 * #### Connecting to multiple servers
 * A memcache connection can communcation with multiple server instances. This can be done be setting the location option to a partial url `"[user:pass@]server1[:11211],[user:pass@]server2[:11211],..."`
 * Alternatively, an array of locations can be specified. The array can be partial URI string, or Objects to be passed to the constructor
 * If the `MEMCACHIER_SERVERS` environemnt variable is set, this information will also be included in the set of server locations.
 * If the `MEMCACHIER_USERNAME` and `MEMCACHIER_PASSWORD` environment variables are found, they will be used to authenticate against each location, unless specified otherwise.
 * ##### Configution file
 * ```
 * {
 *		"MEMCACHIER_USERNAME":"user",
 *		"MEMCACHIER_PASSWORD":"abc123",
 *		"MEMCACHIER_SERVERS":"dev.memcachier.com:11211",
 *		"caches":{
 *			"default":{
 *				"backend":"memcached"
 *				,"location":[{
 *					"host":"localhost:11211"
 *					,"options":{
 *							"username":null,"password":null
 *					}
 *				}
 *				,"localhost:11212,localhost:11213"
 *			]
 *		}
 * }
 * ```
 * ##### Environment Variables
 * ```
 * MEMCACHIER_USERNAME=user
 * MEMCACHIER_PASSWORD=abc123
 * MEMCACHIER_SERVERS=dev.memcachier.com:11211
 * caches__default__backend=memcached
 * caches__default__location=localhost:11212,localhost:11213
 * caches__default__location__host=localhost:11211
 * caches__default__location__host__options__auth=null
 * caches__default__location__host__options__password=null
 * ```
 * ##### Commandline Flags
 * ```
 * --MEMCACHIER_USERNAME=user
 * --MEMCACHIER_PASSWORD=abc123
 * --MEMCACHIER_SERVERS=dev.memcachier.com:11211
 * --caches:default:backend=memcached
 * --caches:default:location=localhost:11212,localhost:11213
 * --caches:default:location:host=localhost:11211
 * --caches:default:location:host:options:auth=null
 * --caches:default:location:host:options:password=null
 * ```
 * All of these set ups would define 4 server locations `user:abc123@localhost:11212`, `user:abc123@localhost:11213`, `user:abc123@dev.memcachier.com:11211` and `localhost:11211`
 * @module alice-cache/lib/backends/memcached
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires events
 * @requires util
 * @requires alice-conf
 * @requires alice-log
 * @requires alice-stdlib/class
 * @requires alice-stdlib/class/options
 * @requires alice-core/exceptions
 */
var events    = require( 'events' )                       // node events module
  , util      = require( 'util' )                         // node util module
  , conf      = require( 'alice-conf' )                   // alice config loader
  , logger    = require( 'alice-log' )                    // alice logger
  , async     = require( 'async' )                        // async npm module
  , memjs     = require( 'memjs' )
  , noop      = require( 'alice-stdlib/function' ).noop   // default empty function
  , Exception = require( 'alice-stdlib/exception' )       // base Exception
  , Class     = require( 'alice-stdlib/class' )           // Class lib from alice-stdlib
  , remove    = require( 'alice-stdlib/array' ).remove    // remove standard remove function
  , compact   = require( 'alice-stdlib/array' ).compact   // compact standard compact function
  , flatten   = require( 'alice-stdlib/array' ).flatten   // flatten standard flatten function
  , toArray   = require( 'alice-stdlib/lang' ).toArray    // toArray standard toArray function
  , isString  = require( 'alice-stdlib/lang' ).isString   // isStringstandard isStringfunction
  , isNull    = require( 'alice-stdlib/lang' ).isNull     // isNull standard isNull function
  , clone     = require( 'alice-stdlib/lang' ).clone      // clone standard clone function
  , merge     = require( 'alice-stdlib/object' ).merge    // merge standard merge function
  , typecast  = require( 'alice-stdlib/string' ).typecast // typecast standard typecast function
  , typeOf    = require( 'alice-stdlib/typeOf' )          // typeOf method from mout
  , url       = require( 'alice-stdlib/url' )
  , Cache     = require( './base' )                       // Base Cache class for extending
  , anonHost
  , authHost
  , asciiWrap
  , servers
  , username
  , password
  ;

servers = conf.get("MEMCACHIER_SERVERS") || 'localhost'
password = conf.get( "MEMCACHIER_PASSWORD" )
username = conf.get('MEMCACHIER_USERNAME')


anonHost = "%s:%s";
authHost = "%s@%s:%s";

asciiWrap = function asciiWrap( cb ){
	return function( err, val ){
		cb && cb( err, val ? typecast( val.toString('ascii') ) : val )
	}
};

/**
 * @extends module:alice-cache/lib/backends/base
 * @constructor
 * @alias module:alice-cache/lib/backends/memcached
 * @param {Object} options
 * @param {Number} [options.timeout=30000] timeout in ms that a key should persist
 * @param {String} [options.prefix='alice']
 * @param {Number} [options.port=11211]
 * @param {Number} [options.retries=2] the number of times to retry an operation in lieu of failures (default 2)
 * @param {Number} [options.expires=0] the default expiration in seconds to use (default 0 - never expire). If expires is greater than 30 days (60 x 60 x 24 x 30), it is treated as a UNIX time (number of seconds since January 1, 1970).
 * @param {String} [options.failover=false] whether to failover to next server. Defaults to false.
 * @param {String} [options.failoverTime=60] length of time ( in seconds ) wait until retring a failed server.
 * @param {Object|String|String[]|Object[]} [options.location] memcached server connection information
 * @param {Object} [options.location.options] if location is an object, additional options may be specified for the specific
 * @param {Object} [options.location.options.username] the username to use for authentication on the location. If not specified, The MEMCACHIER_USERNAME environment variable will be used in its place
 * If set to `null` no authentication will be used 
 * @param {Object} [options.location.options.password] the password to use for authentication on the location. If not specified, The MEMCACHIER_PASSWORD environment variable will be used in its place 
 * If set to `null` no authentication will be used 
 */
module.exports = new Class({
	inherits: Cache

	,options:{
		location:{
			host:servers 
			,port:11211
			,options:{
				// username
				// password
			}
		}
	}
	, constructor: function( options ){
		var locations
		  , config
		  , auth_user
		  , auth_pass
		  , uri_port
		  ;


		this.parent('constructor', options );

		config = clone( this.options );
		auth_user = config.username || username;
		auth_pass = config.password || password;
		locations = flatten(toArray( this.options.location ).map( function( loc ){
			var bits
			  , auth
			  , host
			  , port
			  , auth
			  , args
			  , loc_pass
			  , loc_user
			  ;

			if( typeof loc == 'string' ){
				loc = loc.split(',')
						.map(function( l ){

							bits = l.split('@')
							auth = bits.length === 1 ? null : bits.shift()

							l = bits.shift()
							l = l ? l.split(':') : l;

							host = l[0]
							port = l[1] || this.options.port || 11211

							// if the string contains credentials, use those
							if( auth ){
								return util.format(authHost, auth, host, port )
							}
							
							// if we found credienials in config, use those
							// or assume none are required

							auth = auth_user && auth_pass ? [auth_user,auth_pass].join(':') : auth
							args = compact( [auth ? authHost:anonHost, auth, host, port] )
							return util.format.apply(util, args )

						});

				return loc

			}

			// locations may have a port, but no auth
			// need to find it.
			config = merge({}, config, loc.options || {} );
			bits   = (loc.host || loc.hostname || this.options.host).split(':');
			host   = bits[0]
			port   = bits[1] || loc.port || config.port
			var loc_user = isNull( typecast(loc.options.username) ) ? null : auth_user
			var loc_pass = isNull( typecast(loc.options.password) ) ? null : auth_pass
			auth   = loc_user && loc_pass ? [loc_user,loc_pass].join(':') : auth
			args   = compact( [auth ? authHost:anonHost, auth, host, port] )
			return util.format.apply(util, args );
		}.bind(this) ));

		logger.notice("connecting memcahed cache backend", locations );
		this.cli = memjs.Client.create(locations.join(","), config);
	}


	/**
	 * Adds a value to the cache backend if it doesn't already exist
	 * @method module:alice-cache/lib/backends/memcached#add
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, add: function add( key, value, timeout, cb ){
		var key = this.options.keyfn.call( this, key )
		var that = this;

		this.cli.add(
			key
			,String(value)
			,function( err, set ){
				if(!set){
					return that.cli.get( key, asciiWrap( cb ) );
				}
				return cb && cb( null, value );
			}
			, ( ( timeout || this.options.timeout ) / 1000  ) >>> 0
		)
	}

	/**
	 * retrieve one value from the cache backend
	 * @method module:alice-cache/lib/backends/memcached#get
	 * @param {...String} key The key(s) to fetch from the
	 * @param {Function} callback callback function to be executed when the operation is copmlete
	 **/
	, get: function get(){
		var args = toArray( arguments )
		  , callback     =  typeof args[ args.length - 1] == 'function' ? args.pop() : noop
		  , keys         = args.map( this.options.keyfn.bind( this ) )

		  ,get = this.cli.get.bind( this.cli )

		async.map( keys , get, function( err, data ) {
			var ret = {}, x=0, len=args.length;

			if( len === 1 ){
				return asciiWrap(callback)( err, data )
			}

			for( var idx = 0,len=data.length; idx < len; idx++ ){
				ret[ args.shift() ] = typecast(data[ idx ].toString('ascii'))
			}
			
			callback( err, ret );
		})
		
	}

	/**
	 * Sets a value a specific key
	 * @method module:alice-cache/lib/backends/memcached#set
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, set: function set( key, value, timeout, callback ){

		callback = callback || noop;
		this.cli.set(
		  this.options.keyfn.call( this, key )
		  , String(value)
		  , function( e ){ callback( e, value ) }
		)
	}

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method module:alice-cache/lib/backends/memcached#incr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, incr: function incr(key, timeout, callback ){
		var key = this.options.keyfn.call( this, key )
		  , callback = asciiWrap( callback || noop )
		  , that = this
		  , timeout = ( (timeout || this.options.timeout ) / 1000 ) >>> 0
		  ;


		  that.cli.increment( key, 1, function( err, set ){
			if( !set ){
				that.cli.set(key, 1, timeout, function(err ){
					callback( null, 1)
				})
			}
			callback( err, set )
		  },timeout )
	}

	/**
	 * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
	 * @method module:alice-cache/lib/backends/memcached#decr
	 * @param {String} key The key to increment if it exists
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, decr: function decr(key, timeout, callback ){
		var key = this.options.keyfn.call( this, key )
		  , callback = callback || noop
		  , that = this
		  , timeout = ( (timeout || this.options.timeout ) / 1000 ) >>> 0
		  ;


		  that.cli.decrement( key, 1, function( err, set ){
			if( !set ){
				return that.cli.set(key, 0, timeout, function(err ){
					callback( null, 0);
				});
			}
			callback( err, set )
		  })
	}

	/**
	 * Appends a value to an array
	 * @method module:alice-cache/lib/backends/memcached#push
	 * @param {String} key Key to identify a value
	 * @param {String|Number} value The value to set at the key
	 * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, push: function push(key, value, timeout, callback ){
		key = this.options.keyfn.call( this, key )
		timeout = (( timeout || this.options.timeout )/1000) >>> 0;
		callback = callback || noop;

		var that = this;

		this.cli.get( key, asciiWrap(function(e, x ){
			x = isString( x ) ? x.split(',') : toArray( x )
			x.push( value );
			that.cli.set(key, x.join(), function( e ){
				callback( e, x );
			},timeout);
		}));

	}

	/**
	 * Removes a specific key from an array. If no key is specified, the last value is removed
	 * @method module:alice-cache/lib/backends/memcached#pop
	 * @param {String} key Key to identify a value
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, pop: function pop(key, callback ){
		var callback =  typeof arguments[ arguments.length - 1] == 'function' ? Array.prototype.pop.apply( arguments ) : noop;
		var _key = this.options.keyfn.call( this, key );
		var find = arguments[1];
		var that = this;
		var ret = null;
		var e = null;

		this.cli.get(_key, asciiWrap(function( e, _value ){
			_value = _value.split(',').map( typecast )
			if( !Array.isArray( _value ) ){
				e = new Exception({
					name: "CacheException"
					,code: 6000
					,type:'invalid_operation'
					,message:util.format( "Can not call pop on %s values", typeOf( _value ) )
				});
				that.emit('error', e );
			}

			ret = find ? !remove( _value, find ) && find  : _value.pop();
			that.cli.set(_key, _value.join(),  function( e ){
				return callback( e, ret );
			},(that.options.timeout/1000 >>> 0));
		}));
	}

	/**
	 * Checks to verify if a key still holds a value
	 * @method module:alice-cache/lib/backends/memcached#has
	 * @param {String} key the name of he key to look up
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, has: function has( key, callback ){
		this.cli.get(
			this.options.keyfn.call( this, key )
			, function( e, v ){
				return callback && callback( e, v != null )
			}
		)
	}

	/**
	 * Clears the internal redis database
	 * @method module:alice-cache/lib/backends/memcached#flush
	 * @param {Function} callback A callback function to be executed when the operation is finished
	 **/
	, flush: function flush( cb ){
		this.cli.flush( cb || noop );
	}

	/**
	 * Closes the connection to the redis database
	 * @method module:alice-cache/lib/backends/memcached#close
	 * @param {closeCallback} callback A callback function to be executed when the operation is finished
	 **/
	, close: function close( cb ){
		this.cli.end( cb || noop );
	}
});
/**
 * Callback called when the close function is executed.
 * @callback module:alice-cache/lib/backends/memcached~closeCallback
 * @param {Error} err an error if their was one
 */
