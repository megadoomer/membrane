/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Exposes caching backends as a single module
 * @module membrane/lib/backends
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires membrane/lib/backends/redis
 * @requires membrane/lib/backends/memory
 * @requires membrane/lib/backends/memcached
 * @requires membrane/lib/backends/base
 */

/**
 * @property {Object} redis short cut to the {@link module:membrane/lib/backends/redis|Redis} cache backend module
 * @property {Object} memcached short cut to the {@link module:membrane/lib/backends/memcached|Memcached} cache backend module
 * @property {Object} memory short cut to the {@link module:membrane/lib/backends/memory|Memory} cache backend module
 * @property {Object} base short cut to the {@link module:membrane/lib/backends/base|Default} cache interface module
 **/
module.exports = {
  redis: require( './redis' )
, memcached: require( './memcached' )
, memory: require( './memory' )
, base:  require( './base' )
}
