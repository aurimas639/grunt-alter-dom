/*
 * Grunt task that allows altering html code in files using cheerio package
 */
/*jshint smarttabs:true */

module.exports = function( grunt ){
	"use strict";
	//core modules
	var fs = require( 'fs' );
	//Modules
	var cheerio = require( 'cheerio' );

	//shortcuts
	var log = grunt.log,
		file = grunt.file;

//============================================================================================================
//  Grunt Task Error Class
//============================================================================================================

	function GruntTaskError( message ){
		this.message = message || 'Grunt Task Error';
	}

	GruntTaskError.prototype = new Error();
	GruntTaskError.prototype.name = 'GruntTaskError';

//============================================================================================================
//  Helper functions
//============================================================================================================

	var ACTIONS = {
		/**
		 * Appends content to elements specified by selector
		 * @param $ {Cheerio} loaded html
		 * @param file {object} file src and dest paths
		 * @param options {Object} task options.
		 */

		append: function( $, options, file ){
			var html = processHtmlOption( options.html ),
				elem;

			testSelectorOption( options.selector );
			elem = $( options.selector );
			if( elem.length ){
				elem.append( html );
			}
		},


		/**
		 * Executes callback on each file. Callback function receives 2 parameters:
		 *  cheerio object that has entire file loaded
		 *  file object that has 2 properties: src and dest.
		 *
		 * @param $ {Cheerio} loaded html
		 * @param file {object} file src and dest paths
		 * @param options {Object} task options.
		 */
		callback: function( $, options, file ){
			var cb = options.fn;

			if( grunt.util.kindOf( cb ) !== 'function' ){
				throw new GruntTaskError( 'fn option is not function' );
			}
			cb( $, file );

		},


		/**
		 * Removes selected elements from files
		 * @param $ {Cheerio} loaded html
		 * @param file {object} file src and dest paths
		 * @param options {Object} task options.
		 */
		remove: function( $, options, file ){
			options.html = '';
			ACTIONS.replace( $, options, file );
		},


		/**
		 * Replaces elements specified by selector from files.
		 * @param $ {Cheerio} loaded html
		 * @param file {object} file src and dest paths
		 * @param options {Object} task options.
		 */
		replace: function( $, options, file ){
			var html = processHtmlOption( options.html ),
				elem;

			testSelectorOption( options.selector );
			elem = $( options.selector );
			if( elem.length > 0 ){
				elem.replaceWith( html );
			}
		}

	};


	/**
	 * Constructs new file array from 'grunt file array'. Filters any source paths that do not exists and are
	 * not files. Objects in constructed array have 2 properties:
	 *  'src' - path to source file
	 *  'dest' - path to destination file.
	 * Those properties may have the same value if destination path was not specified originally.
	 * More: http://gruntjs.com/configuring-tasks#files
	 *
	 * @param files {Array} files in grunt File Array format
	 * @returns {Array} that contains filtered file paths
	 */
	function filterFiles( files ){
		var filtered = [],
			dest;
		files.forEach( function( fp ){
			dest = fp.dest;
			fp.src.forEach( function( f ){
				if( file.exists( f ) && fs.statSync( f ).isFile() ){
					filtered.push( { src: f, dest: dest ? dest : f } );
				}
				else{
					log.warn( 'Source file "' + f + '" not found or is not a file' );
				}
			} );
		} );
		return filtered;
	}


	/**
	 * Tests html param to see if its correct type. If type is not 'string' or 'function' throws error.
	 * @param html {*}
	 * @returns {String}
	 */
	function processHtmlOption( html ){
		var kindOf = grunt.util.kindOf( html );
		if( kindOf == 'string' ){
			return html;
		}
		else if( kindOf == 'function' ){
			return html();
		}

		throw new GruntTaskError( '"html" option can only be string or function'.yellow );
	}


	/**
	 * Tests if selector is specified. If its not string or empty string throws GruntTaskError
	 * @param selector {String} selector to test
	 */
	function testSelectorOption( selector ){
		if( grunt.util.kindOf( selector ) !== 'string' || selector.length < 1 ){
			throw new GruntTaskError( 'Selector is not string or is empty'.yellow );
		}
	}

//============================================================================================================
// Tasks
//============================================================================================================
	grunt.registerMultiTask( 'alter-dom', 'Changes dom in files', function(){

		var actions = this.options( {} ).actions,
			files,
			$;

		if( this.filesSrc.length > 1 && this.data.dest ){
			log.error( 'Dest cannot be specified with multiple src files.' );
			return true;
		}

		if( !actions || grunt.util.kindOf( actions ) !== 'array' ){
			log.error( 'Actions not specified properly. Must be array' );
			return true;
		}

		//filters files to suitable format
		files = filterFiles( this.files );

		files.forEach( function( filePair ){
			log.verbose.subhead( 'Processing file: ' + filePair.src );
			$ = cheerio.load( file.read( filePair.src ) );
			actions.forEach( function( opts ){
				//if action does not exits
				if( !opts.action || !ACTIONS[opts.action] ){
					log.error( 'Not valid action specified: '.yellow + opts.action );
				}
				//all good
				else{
					try{
						ACTIONS[opts.action]( $, opts, file );
					}
					catch( e ){
						if( e instanceof GruntTaskError ){
							log.warn( e.message.yellow );
						}
						else{
							throw e;
						}
					}
				}

			}.bind( this ) );

			file.write( filePair.dest, $.html() );

		}.bind( this ) );


		return true;
	} );

};