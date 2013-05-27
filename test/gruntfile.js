/*jshint smarttabs:true */
module.exports = function( grunt ){
	"use strict";
	// Project configuration.
	grunt.initConfig( {

		'alter-dom': {
			'change-scripts': {
				options: {
					actions: [
						{ action: 'remove', selector: 'head script' },
						{ action: 'append', selector: 'head', html: '<script data-controller="main"></script>'}
					]
				},
				src: ['src.html'],
				dest: 'change-scripts.html'
			},

			'replace': {
				options: {
					actions: [
						{ action: 'replace', selector: '#div-to-replace', html: '<div id="replaced-div"></div>' }
					]

				},
				src: ['src.html'],
				dest: 'replaced-element.html'
			},

			'callback': {
				options: {
					actions: [
						{ action: 'callback',
							fn: function( $, file ){ $( 'body' ).append( '<p>Callback function!!!</p>' ) }
						}
					]
				},
				src: ['src.html'],
				dest: 'callback-fn.html'
			}
		}
	} );

	grunt.loadTasks( '../tasks/' );

	grunt.registerTask( 'default', ['alter-dom'] )

};