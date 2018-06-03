/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/
'use strict'
/**
 * Provides the memcached implementation of the cache interface
 * ### Configuration
 * Configuring a memcache connection is done through the {@link module:membrane|Cache} module.
 * To use memcache as the default cache, you must configure `memcached` as the default backend.
 *
 * ##### config file
 * ```
 * {
 *  "caches":{
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
 *    "MEMCACHIER_USERNAME":"user",
 *    "MEMCACHIER_PASSWORD":"abc123",
 *    "MEMCACHIER_SERVERS":"dev.memcachier.com:11211",
 *    "caches":{
 *      "default":{
 *        "backend":"memcached"
 *        ,"location":[{
 *          "host":"localhost:11211"
 *          ,"options":{
 *              "username":null,"password":null
 *          }
 *        }
 *        ,"localhost:11212,localhost:11213"
 *      ]
 *    }
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
 * @module membrane/lib/backends/memcached
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires events
 * @requires util
 * @requires keef
 * @requires bitters
 */
var events                             = require( 'events' )
  , util                               = require( 'util' )
  , conf                               = require( 'keef' )
  , logger                             = require( 'bitters' )
  , async                              = require( 'async' )
  , memjs                              = require( 'memjs' )
  , {noop}                             = require( 'gaz/function' )
  , Exception                          = require( 'gaz/exception' )
  , Class                              = require( 'gaz/class' )
  , {remove, compoact, flatten}        = require( 'gaz/array' )
  , {toArray, isString, isNull, clone} = require( 'gaz/lang' )
  , {merge}                            = require( 'gaz/object' )
  , {typecast}                         = require( 'gaz/string' )
  , typeOf                             = require( 'gaz/typeOf' )
  , url                                = require( 'gaz/url' )
  , Cache                              = require( './base' )
  , anonHost = '%s:%s'
  , authHost = '%s@%s:%s'

const servers = conf.get('memcachier_servers') || 'localhost'
const password = conf.get('memcachier_password')
const username = conf.get('memcachier_username')

function asciiwrap(val) {
  if (!val) return null
  return (val.value ? typecast( val.value.toString('ascii') ) : val.value)
}

/**
 * @extends module:membrane/lib/backends/base
 * @constructor
 * @alias module:membrane/lib/backends/memcached
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
module.exports = class MemcachedCache extends Cache {

  constructor( options ) {
    super(merge({}, {
      location: {
        host: servers
        ,port: 11211
        ,options: {
          // username
          // password
        }
      }
    }, options))

    const config = clone( this.options )
    const auth_user = config.username || username
    const auth_pass = config.password || password
    const locations = flatten(toArray( this.options.location ).map((loc) => {
      if( typeof loc !== 'string' ) {
        const username = loc.options && loc.options.username || auth_user
        const password = loc.options && loc.options.password || auth_pass
        const auth = []

        if(auth_user) auth.push(auth_user)
        if(auth_pass) auth.push(auth_pass)

        return url.format({
          hostname: loc.host
        , port: loc.port
        , auth: auth.length && auth.join(':')
        })
      }
      loc
        .split(/(?:\s+)?,(?:\s+)?/)
        .map(function( l ){
          const bits = l.split('@')
          const auth = bits.length === 1 ? null : bits.shift()

          l = bits.shift()
          l = l ? l.split(':') : l

          const host = l[0]
          const port = l[1] || this.options.port || 11211

          // if the string contains credentials, use those
          if( auth ) return util.format(authHost, auth, host, port )

          // or assume none are required
          const authd = auth_user && auth_pass ? [auth_user,auth_pass].join(':') : auth
          const args = compact( [authd ? authHost : anonHost, authd, host, port] )
          return util.format.apply(util, args )
      })

      // locations may have a port, but no auth
      // need to find it.
      const config = merge({}, config, loc.options || {} )
      const bits   = (loc.host || loc.hostname || this.options.host).split(':')
      const host   = bits[0]
      const port   = bits[1] || loc.port || config.port
      const loc_user = isNull( typecast(loc.options.username) ) ? null : auth_user
      const loc_pass = isNull( typecast(loc.options.password) ) ? null : auth_pass
      const auth   = loc_user && loc_pass ? [loc_user,loc_pass].join(':') : auth
      const args   = compact( [auth ? authHost:anonHost, auth, host, port] )
      return util.format.apply(util, args)
    }))

    logger.notice('connecting memcahed cache backend', locations )
    this.cli = memjs.Client.create(locations.join(','), config)
  }

  /**
   * Adds a value to the cache backend if it doesn't already exist
   * @method module:membrane/lib/backends/memcached#add
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   **/
  async add(key, value, timeout){
    const _key = this.options.keyfn.call( this, key )
    const expires = ( ( timeout || this.options.timeout ) / 1000  ) >>> 0
    const set = await this.cli.add(_key, String(value), { expires })

    if (!set) {
      return asciiwrap(await this.cli.get(_key))
    }

    return value
  }

  /**
   * retrieve one value from the cache backend
   * @method module:membrane/lib/backends/memcached#get
   * @param {...String} key The key(s) to fetch from the
   **/
  async get(...args) {
    const tasks = []
    for (const key of args) {
      tasks.push(
        this.cli.get(this.options.keyfn.call(this, key))
      )
    }

    const values = await Promise.all(tasks)
    if (args.length === 1) return asciiwrap(values[0])

    const out = Object.create(null)
    for (let idx = 0, len = args.length; idx < len; idx++) {
      const key = args[idx]
      const value = values[idx]
      out[key] = asciiwrap(value)
    }

    return out
  }

  /**
   * Sets a value a specific key
   * @method module:membrane/lib/backends/memcached#set
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   **/
  async set(key, value, timeout) {
    const _key = this.options.keyfn.call( this, key )
    const expires =  ( (timeout || this.options.timeout ) / 1000 ) >>> 0
    await this.cli.set(_key, String(value), { expires })
    return value
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method module:membrane/lib/backends/memcached#incr
   * @param {String} key The key to increment if it exists
   * @param {Number} timeout
   **/
  async incr(key, timeout) {
    const _key = this.options.keyfn.call( this, key )
    const expires = ( (timeout || this.options.timeout ) / 1000 ) >>> 0
    const {value} = await this.cli.increment(_key, 1, {expires: expires, initial: 1})
    return value
  }

  /**
   * Increments the value at a key if it exists. if it does not exits, the value will be set to 1
   * @method module:membrane/lib/backends/memcached#decr
   * @param {String} key The key to increment if it exists
   **/
  async decr(key, timeout) {
    const _key = this.options.keyfn.call( this, key )
    const expires = ( (timeout || this.options.timeout ) / 1000 ) >>> 0
    const {value} = await this.cli.decrement(_key, 1, {expires: expires, initial: 0})
    return value
  }

  /**
   * Appends a value to an array
   * @method module:membrane/lib/backends/memcached#push
   * @param {String} key Key to identify a value
   * @param {String|Number} value The value to set at the key
   * @param {Number} [timeout=Cache.timeout] a timeout override for a specific operation
   **/
  async push(key, value, timeout){
    const _key = this.options.keyfn.call(this, key)
    const expires  = (( timeout || this.options.timeout )/1000) >>> 0
    let x = asciiwrap(await this.cli.get(_key))
    x = isString( x ) ? x.split(',') : toArray( x )
    x.push( value )
    await this.set(key, x.join(), timeout)
    return x
  }

  /**
   * Removes a specific key from an array. If no key is specified, the last value is removed
   * @method module:membrane/lib/backends/memcached#pop
   * @param {String} key Key to identify a value
   * @param {Function} callback A callback function to be executed when the operation is finished
   **/
  async pop(key, value, timeout) {
    const _key = this.options.keyfn.call( this, key )
    const expires  = (( timeout || this.options.timeout )/1000) >>> 0
    const str = await this.cli.get(_key)
    const val = asciiwrap(str || '').split(',').map(typecast)
    const ret = value ? !remove(val, value) && value : val.pop()
    await this.cli.set(_key, toArray(val).join(), {expires})
    return ret
  }

  /**
   * Checks to verify if a key still holds a value
   * @method module:membrane/lib/backends/memcached#has
   * @param {String} key the name of he key to look up
   **/
  async has(key) {
    const _key = this.options.keyfn.call(this, key)
    const val = asciiwarp(await this.cli.get(_key) || null)
    return value != null
  }

  touch(key) {
    const _key = this.options.keyfn.call(this, key)
    const expires  = (( timeout || this.options.timeout )/1000) >>> 0
    return this.cli.touch(_key, expires)
  }

  /**
   * Clears the internal redis database
   * @method module:membrane/lib/backends/memcached#flush
   **/
  flush() {
    return this.cli.flush()
  }

  /**
   * Closes the connection to the redis database
   * @method module:membrane/lib/backends/memcached#close
   **/
  close() {
    return this.cli.quit()
  }
}
