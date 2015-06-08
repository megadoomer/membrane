/*jshint node:true, laxcomma: true, smarttabs: true, mocha: true*/
'use strict';
var assert      = require('assert')
  , kindOf      = require('hive-stdlib/lang').kindOf
  , async       = require('async')
  , Redis = require('../lib/backends/redis');


describe('cache', function(){
	var redis = new Redis();

	describe( 'Redis Backend', function(){
		before(function( done ){
			redis.flush(done);
		});
		after(function( done ){
			redis.flush( done )
		})
		describe('#add', function(){
			it('should only set values if one does not exist',function(){
				redis.add('fake', 1 );
				redis.add('fake', 2 );
				redis.add('fake', 3, null, function( err, value ){
					assert.strictEqual( value, 1 );
				});

				redis.add('foo', 2 );
				redis.get('foo', function(err, value ){
					assert.strictEqual(value, 2);
				});
				redis.add('foo', 3 );
				redis.get('foo', function(err, value ){
					assert.strictEqual(value, 2);
				});

			});
		});

		describe('#set', function(){
			it('should pass',function(){
				redis.set('fake', 1 );
				redis.set('fake', 2 );
				redis.set('fake', 3, null, function( err, value ){
					assert.strictEqual( value, 3 );
				});

				redis.set('foo', 2 );
				redis.get('foo', function(err, value ){
					assert.strictEqual(value, 2);
				});
				redis.set('foo', 3, function(){
					redis.get('foo', function(err, value ){
						assert.strictEqual(value, 3);
					});
				});

			});
		});

		describe('#get', function(){
			it('should retrieve a single value',function(){
				redis.set('foo', 2 );
				redis.get('foo', function( err, value ){
					assert.strictEqual(value, 2);
				});
			});

			it('should retrieve multiple values an object', function( done ){
				async.series([
					function( callback ){
						redis.set('foo', 2, null, callback );
					},
					function( callback ){
						redis.set('baz', 1, null, callback );
					},
					function( callback ){
						redis.set('cake', 'frosting', null, callback );
					}

				], function(){

					redis.get('foo', 'baz', 'cake', function( err, value ){
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
				redis.incr('increment', function( err, v ){
					assert.equal( v, 1);
				});

			});

			it('should increment a value by 1', function( done ){
				async.series([
					function( callback ){
						redis.incr('increment', callback );
					},
					function( callback ){
						redis.incr('increment', callback );
					},
					function( callback ){
						redis.incr('increment', callback );
					},
					function( callback ){
						redis.incr('increment', callback );
					},
					function( callback ){
						redis.incr('increment', callback );
					},
				], function( e, results ){
					redis.get('increment', function(e, v){
						assert.equal( v, 6 );
						done()
					});
				})
			});
		});
		describe('#decr', function(){

			it('should decrement a value by 1', function( done ){
				async.series([
					function( callback ){
						redis.set('decrement', 5, null, callback )
					}
					,function( callback ){
						redis.decr('decrement', callback )
					}
					,function( callback ){
						redis.decr('decrement', callback )
					}
					,function( callback ){
						redis.decr('decrement', callback )
					}
					,function( callback ){
						redis.decr('decrement', callback )
					}
					,function( callback ){
						redis.decr('decrement', callback )
					}
				], function( err, replies ){
					redis.get('decrement',function(e, v){
						assert.strictEqual( v, 0 );
						done();
					})
				});

			});
		});

		describe('#push', function(){
			it('should create an array if the value is not an array',function(){
				redis.set('push', 5, function(){
					redis.push('push', 1, null, function(e, v){
						redis.get('push', function(){
							assert.ok( kindOf( v ) , 'Array');
							assert.strictEqual( v[0], 5);
							assert.strictEqual( v[1], 1);
						})
					});
				});
			});
		});
		
		describe('#pop', function(){
			it('should pop a specific value if provided',function(done){
				async.series([
					function( callback ){
						redis.push('pop', 1, null, callback );
					},
					function( callback ){
						redis.push('pop', 2, null, callback );
					},
					function( callback ){
						redis.push('pop', 3, null, callback );
					},
					function( callback ){
						redis.push('pop', 4, null, callback );
					},
					function( callback ){
						redis.pop('pop', 3, callback );
					},

				], function( err, result ){
					
					redis.get('pop', function( e, v){
						v = v.map( function( i ){
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
