/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Configuration options for alice-cache
 * @module alice-cache/conf
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires path
 */

var path = require('path');


/**
 * @property {Object} [caches] Defines cache types available to the application
 * @property {Object} caches.default defines the primary cache for the caching package
 * @property {Object} [caches.default.backend=dummy] Defines the default backend type for the primary cache
 * @property {Object|String} [caches.default.location] Defines the configuration settings used to generate a connection for the deafult cache
 **/
exports.hive = {
	caches:{
		default:{
			backend:path.resolve(__dirname, '..', 'lib','backends','dummy' )
		}
		,memory:{
			backend:"memory"
		}
		
	}
}
