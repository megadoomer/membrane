/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Exposes caching backends as a single module
 * @module alice-cache/lib/backends
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires alice-cache/lib/backends/redis
 * @requires alice-cache/lib/backends/memory
 * @requires alice-cache/lib/backends/memcached
 * @requires alice-cache/lib/backends/base
 */
/**
 * @property {Object} redis short cut to the {@link module:alice-cache/lib/backends/redis|Redis} cache backend module
 */
 exports.redis     = require( './redis' )
 /**
 * @property {Object} memcached short cut to the {@link module:alice-cache/lib/backends/memcached|Memcached} cache backend module
 */
 exports.memcached = require( './memcached' )
 /**
 * @property {Object} memory short cut to the {@link module:alice-cache/lib/backends/memory|Memory} cache backend module
 */
 exports.memory    = require( './memory' )
 /**
 * @property {Object} base short cut to the {@link module:alice-cache/lib/backends/base|Default} cache interface module
 */
 exports.base      = require( './base' )
