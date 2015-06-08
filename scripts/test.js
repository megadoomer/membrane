var child_process = require('child_process')
  , clone = require('hive-stdlib/lang').clone
  , path = require('path')
  , fs = require('fs')
  , util = require('util') 
  , testing = ( process.env.NODE_ENV === 'test' )
  , reporter

if( testing ){
	reporter = fs.createWriteStream('tap.xml', {
		flags: 'w',
		encoding: 'utf8'
	});
} else {
	reporter = process.stdout;
}


mocha = child_process.spawn( 'mocha', [
	"--recursive",
	"--timeout=4000",
    util.format("--reporter=%s", testing ? 'xunit' :'spec' ),
	"test"
],{})

mocha.on('exit', function(code ,sig ){
	process.exit( code );
})

mocha.stdout.pipe( reporter );
mocha.stderr.pipe( reporter );
