/*jshint node:true, laxcomma: true, smarttabs: true, mocha: true*/
'use strict';
var assert      = require('assert')
  , kindOf      = require('mout/lang/kindOf')
  , Memory = require('alice-cache/lib/backends/memory');


describe('cache', function(){

	var memory = new Memory();
	describe( 'Memory Backend', function(){
		beforeEach(function( done ){
			memory.flush();
			done();
		});

		afterEach(function( done ){

			done();
		});

		describe('#add', function(){
			it('should only set values if one does not exist',function(){
				memory.add('fake', 1 );
				memory.add('fake', 2 );
				memory.add('fake', 3,null, function( err, value ){
					assert.strictEqual( value, 1 );
				});

				memory.add('foo', 2 );
				memory.get('foo', function(err, value ){
					assert.strictEqual(value, 2);
				});
				memory.add('foo', 3 );
				memory.get('foo', function(err, value ){
					assert.strictEqual(value, 2);
				});

			});
		});

		describe('#set', function(){
			it('should pass',function(){
				memory.set('fake', 1 );
				memory.set('fake', 2 );
				memory.set('fake', 3, null, function( err, value ){
					assert.strictEqual( value, 3 );
				});

				memory.set('foo', 2 );
				memory.get('foo', function(err, value ){
					assert.strictEqual(value, 2);
				});
				memory.set('foo', 3 );
				memory.get('foo', function(err, value ){
					assert.strictEqual(value, 3);
				});

			});
		});

		describe('#get', function(){
			it('should retrieve a single value',function(){
				memory.set('foo', 2 );
				memory.get('foo', function( err, value ){
					assert.strictEqual(value, 2);
				});
			});

			it('should retrieve multiple values an object', function(){
				memory.set('foo', 2 );
				memory.set('baz', 1 );
				memory.set('cake', 'frosting' );

				memory.get('foo', 'baz', 'cake', function( err, value ){
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
				});	
			});
		});
		
		describe('#incr', function(){
			it('should set a value if it does not exist',function(){
				memory.incr('increment', function( err, v ){
					assert.equal( v, 1);
				});

			});

			it('should increment a value by 1', function(){
				memory.incr('increment');
				memory.incr('increment');
				memory.incr('increment');
				memory.incr('increment');
				memory.incr('increment');
				memory.incr('increment', function(e, v){
					assert.equal( v, 6 );
				});
			});
		});
		describe('#decr', function(){

			it('should decrement a value by 1', function(){
				memory.set('decrement', 5);
				memory.decr('decrement');
				memory.decr('decrement');
				memory.decr('decrement');
				memory.decr('decrement');
				memory.decr('decrement', function(e, v){
					assert.strictEqual( v, 0 );
				});
			});
		});

		describe('#push', function(){
			it('should create an array if the value is not an array',function(){
				memory.set('push', 5);
				memory.push('push', 1, null, function(e, v){
					assert.ok( kindOf( v ) , 'Array');
					assert.strictEqual( v[0], 5);
					assert.strictEqual( v[1], 1);
				});
			});
		});
		
		describe('#pop', function(){
			it('should pop a specific value if provided',function(){
				
				memory.push('pop', 1 );
				memory.push('pop', 2 );
				memory.push('pop', 3 );
				memory.push('pop', 4 );
				memory.pop('pop', 3, null, function(e, v){
					assert.strictEqual( v, 3);
				});
				memory.get('pop', function( e, v){
					assert.equal( v.indexOf(3), -1 );
					assert.notEqual( v.indexOf(1), -1 );
					assert.notEqual( v.indexOf(2), -1 );
					assert.notEqual( v.indexOf(4), -1 );
				});


			});
		});
	});

});
