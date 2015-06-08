/*jshint node:true, laxcomma: true, smarttabs: true, mocha: true*/
'use strict';
var assert      = require('assert')
  , kindOf      = require('hive-stdlib/lang').kindOf
  , async       = require('async')
  , Memcached = require('../lib/backends/memcached');


describe('cache', function(){
	var cache = new Memcached();
	before(function( done ){
		cache.flush(done);
	});
	after(function( done ){
		cache.flush( done )
	})
	describe( 'memcached Backend', function(){
		before(function( done ){
			cache.flush(done);
		});
		after(function( done ){
			cache.flush( done )
		})
		describe('#add', function(){
			it('should only set values if one does not exist',function( done ){
				async.series([
					function( cb ){
						cache.add('fake', 1, null, cb );
					}
					,function( cb ){
						cache.add('fake', 2, null, cb );
						
					}
					,function( cb ){
						cache.add('fake', 3, null, function( err, value ){
							assert.strictEqual( value, 1 );
							cb( err )
						});
					}
					,function( cb ){
						cache.add('foo', 2,null, cb );
					}
					,function( cb ){
						cache.get('foo', function(err, value ){
							assert.strictEqual( value, 2 );
							cb(err)
						});
					}
					,function( cb ){
						cache.add('foo', 3, null, cb );
					}
				],function( er ){
					cache.get('foo', function(err, value ){
						assert.strictEqual(value, 2);
						done()
					});
				})


			});
		});

		describe('#set', function(){
			it('should pass',function( done ){
				async.series([
					function( callback ){

						cache.set('fake', 1,null, callback )
					}
					,function( callback ){

						cache.set('fake', 2, null, callback )
					}
					,function( callback ){
						cache.set('fake', 3, null, function( err, value ){
							assert.strictEqual( value, 3 );
							callback( err )
						});

					}
					,function( callback ){

						cache.set('foo', 2, null, callback )
					}
					,function( callback ){
						cache.get('foo', function( err, value, key ){
							assert.strictEqual(value, 2);
							callback( err )
						});
						
					}
				], function( err ){
					cache.set('foo', 3, null, function(){
						cache.get('foo', function(err, value ){
							assert.strictEqual(value, 3);

							done()
						});
					});

				})


			});
		});

		describe('#get', function(){
			it('should retrieve a single value',function( done ){
				async.series([
					function( callback ){
						cache.set('foo', 2, null, callback );
					},
					function( callback ){
						cache.get('foo', function( err, value ){
							assert.strictEqual(value, 2);
							callback(null)
						});
					}
				], done )
			});

			it('should retrieve multiple values an object', function( done ){
				async.series([
					function( callback ){
						cache.set('foo', 2, null, callback );
					},
					function( callback ){
						cache.set('baz', 1, null, callback );
					},
					function( callback ){
						cache.set('cake', 'frosting', null, callback );
					}

				], function(){

					cache.get('foo', 'baz', 'cake', function( err, value ){
						assert.strictEqual(value.foo, 2);
						assert.strictEqual(value.baz, 1);
						var keys = ['foo','baz', 'cake'];
						Object
							.keys( value )
							.forEach( function( key ){
								var idx = keys.indexOf( key );
								assert.notEqual(  idx, -1 );
								keys.splice(idx,1);
							});

							assert.equal( keys.length, 0);
							done();
					});	
				})

			});
		});

		describe('#incr', function(){
			it('should set a value if it does not exist',function(){
				cache.incr('increment', function( err, v ){
					assert.equal( v, 1);
				});

			});

			it('should increment a value by 1', function( done ){
				async.series([
					function( callback ){
						cache.incr('increment', null, callback );
					},
					function( callback ){
						cache.incr('increment', null, callback );
					},
					function( callback ){
						cache.incr('increment', null, callback );
					},
					function( callback ){
						cache.incr('increment', null, callback );
					},
					function( callback ){
						cache.incr('increment', null, callback );
					},
				], function( e, results ){
					cache.get('increment', function(e, v){
						assert.equal( v, 5 );
						done()
					});
				})
			});
		});

		describe('#decr', function(){

			it('should decrement a value by 1', function( done ){
				async.series([
					function( callback ){
						cache.set('decrement', 5, null, callback )
					}
					,function( callback ){
						cache.decr('decrement', null, callback )
					}
					,function( callback ){
						cache.decr('decrement', null, callback )
					}
					,function( callback ){
						cache.decr('decrement', null, callback )
					}
					,function( callback ){
						cache.decr('decrement', null, callback )
					}
					,function( callback ){
						cache.decr('decrement', null, callback )
					}
				], function( err, replies ){
					cache.get('decrement',function(e, v){
						assert.strictEqual( v, 0 );
						done();
					})
				});

			});
		});
		describe('#push', function(){
			it('should create an array if the value is not an array',function( done ){
				cache.set('push', 5,null, function(){
					cache.push('push', 1, null, function(e, v){
						cache.get('push', function(err, result ){
							assert.ok( kindOf( v ) , 'Array');
							assert.strictEqual( v[0], 5);
							assert.strictEqual( v[1], 1);
							done()
						})
					});
				});
			});
		});

		describe('#pop', function(){
			it('should pop a specific value if provided',function(done){
				async.series([
					function( callback ){
						cache.push('pop', 1, null, callback );
					},
					function( callback ){
						cache.push('pop', 2, null, callback );
					},
					function( callback ){
						cache.push('pop', 3, null, callback );
					},
					function( callback ){
						cache.push('pop', 4, null, callback );
					},
					function( callback ){
						cache.pop('pop', 3, callback );
					},

				], function( err, result ){
					
					cache.get('pop', function( e, v){
						v = v.split(',').map( function( i ){
							return i >>> 0
						})
						assert.equal( v.indexOf(3), -1 );
						assert.notEqual( v.indexOf(1), -1 );
						assert.notEqual( v.indexOf(2), -1 );
						assert.notEqual( v.indexOf(4), -1 );
						done()
					});
				})
			});
		});
	});

});
