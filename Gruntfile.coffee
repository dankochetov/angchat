module.exports = (grunt) ->
	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'

		cssmin:
			css:
				options:
					shorthandCompacting: false
					roundingPrecision: -1
				src: ['public/stylesheets/*.css', '!public/stylesheets/all.css']
				dest: 'public/stylesheets/all.css'
		coffee:
			compile:
				expand: true
				cwd: 'public/coffee'
				src: '**/*.coffee'
				dest: 'public/javascripts/compiled'
				ext: '.js'
				flatten: true
				options:
					bare: true
		
		uglify:
			minify:
				src: 'public/javascripts/compiled/all.js'
				dest: 'public/javascripts/all.js'
				options:
					bare: true
		
		concat:
			addSource:
				src: ['public/javascripts/source/*.js', 'public/javascripts/all.js']
				dest: 'public/javascripts/all.js'
				options:
					bare: true
			full:
				src: ['public/javascripts/source/*.js', 'public/javascripts/compiled/*.js']
				dest: 'public/javascripts/all.js'
				options:
					bare: true

		clean: ['public/javascripts/compiled']

		watch:
			self:
				files: ['Gruntfile.coffee']
			coffee:
				files: ['public/**/*.coffee']
				tasks: ['js']
			js:
				files: ['public/**/*.js', '!public/javascripts/compiled/*.js', '!public/javascripts/all.js']
				tasks: ['js']
			css:
				files: ['public/stylesheets/**/*.css', '!public/stylesheets/all.css']
				tasks: ['css']

	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-contrib-uglify'
	grunt.loadNpmTasks 'grunt-contrib-clean'
	grunt.loadNpmTasks 'grunt-contrib-concat'
	grunt.loadNpmTasks 'grunt-contrib-cssmin'
	grunt.loadNpmTasks 'grunt-contrib-watch'
	grunt.registerTask 'default', ['cssmin', 'coffee', 'uglify', 'concat:addSource', 'clean']
	grunt.registerTask 'js', ['coffee', 'concat:full', 'clean']
	grunt.registerTask 'css', 'cssmin'