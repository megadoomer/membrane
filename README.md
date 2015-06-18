## Membrane
The multi caching package for the megadoomer application platform

## Configuration

Configuration consists of an object found at the `caches` key. Each key in the object will be considered a unique cache. Each Cache will be available as a property on the `hive-cache` module or as a callable from the package itself. Their *must* be one and only one cache named `default` which will be the primary cache when no cache is specified.

the following configuration would set up two caches, the default, a redis cache, and a testing cache, an in memory cache

###### config 
```js
{
	"caches":{
		"default":{
			"backend":"redis"
		}
		,"testing":{
			"backend":"memory",
		}
	}
}
```

###### usage
```js
var cache = require( 'hive-cache' );

// using the redis cache
cache.set('foo', 'bar')

// using the dummy cache explicitly
cache.dummy.set('foo', 'bar')

// using the dumy cache though the cache callable
cache( 'dummy' )
	.set('foo','bar' )
```

### Caches



options | default | type | description
--------|---------|------|------------
backend | `dummy` | `string` | one of the predefined backends, `redis`, `memcached`, `memory`, `dummy`, or a fully qualified path to a module which exports a class which implements the cache interface
location | "" | `string` / `object` | a connection string or object containing `host`, `port`, and `auth` creds if required
timeout | 30000 | `number` | the time to live in `ms`.
prefix  | "hive" | `string` | a keyspace name-space to separate specific sets of keys
options | null | `object` | driver specific options to be passed to the connection

```js
{
	"caches":{
		"default":{
			"backend":"memcache",
			"location":{
				"host":"0.0.0.0",
				"port":11211
			}
		}
		,"counters":{
			"backend":"redis"
			,"location":"unix://user:abc123@localhost:6379"
			,options:{
				"return_buffers":false,
				"no_ready_check":true
			}
		}
	}
}
```

## Backends

##### Dummy
A noop backend to use for testing when a server is not available

##### Memory
A backend which stores data in local memory. Does not work in multi process or clustered environments. All data is lost when the process exits

##### Redis
Backend using the redis database driver. Reids support atomic operations for lists, hashes, sets, counters, and transactions

##### Memcached
Backend using memcached, the low volatile key/value in memory hash table.
