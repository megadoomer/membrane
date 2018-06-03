# Configuration options for the membrane cache package

Caches are defined by an object whos keys define a cache by name, and whose values comprise connection and driver options. The cache must have one and only one `default` cache. By default, the `default` cache is a dummy cache which implements required functions as noop methods to avoid errors.

Each cache must define a `backend` property, which is a string to a valid cache backend Class which either fully implements the cache interface, or inherits from the base cache interface and implements its methods. Eache cache must also define a `location` properto which is the location of cache serve is their is one. The `location` propery can be a string or an object. If it is a string, it must be a fully qualified uri or backend specific connection string, which will be passed untouched to the driver. if it is an `object`, it must define the parameters to generate a connection string - `protocol`, `host`, `port`, and `auth` if it is required

A cache may also define an `options` object that defines dirver specific options. These will be passed to the driver during connection, untouched.

Alternatively, the `backend` property can be the name of one of the default cache backends supplied with the package ( `dummy`, `redis`, `memcached`, or `memory` )


###### Connection with a location string
```js
"caches":{
  "default":{
    "backend":"/path/to/module"
    ,"location":'unix://path/to/connection.sock'
  }
}
```

###### connecting with a named cache backend and location object
```js
"caches":{
  "default":{
    "backend":"redis"
  , "location":{
      "host":"localhost"
    , "port":6370
    }
  }
}
```

### multiple caches

Multiple caches with any number of backends can be configured. Their will be one and only one default which will be exported as the default module. It is up to the application logic to know the names and use cases of each configured cache

### Custom backends

You may also create and register custom backends with the caching package. A full path to any Node.js module that exports a single Class that implements the cache interface is allowed

The constructor function of your custom Cache class is responsible for parsing the `caches` object and connecting to it's specific caching server 
