/* File: gulpfile.js */

// grab our gulp packages
var gulp = require('gulp'), // Default task runner
    plumber = require('gulp-plumber'), // To replace pipe method and remove standard onerror handler on error event, which unpipes streams on error by default.
    sass = require('gulp-sass'), // Sass compiler
    csscomb = require('gulp-csscomb'), // Format CSS coding style - Reorder css properties, curly braces positions, spaces etc
    sourcemaps = require('gulp-sourcemaps'), //Generate Sass Sourcemaps
    autoprefixer = require('gulp-autoprefixer'), // Auto complete vendor prefix based on caniuse.com
    size = require('gulp-size'), // Display output css file size after sass task completion
    notify = require('gulp-notify'), // Plugin to alert sass task result in window
    browserSync = require("browser-sync").create(), // Plugin to create static server and auto reload browser on html/scss file change
    gutil = require('gulp-util'), // Plugin to hightlight error line
    nunjucksRender = require('gulp-nunjucks-render'),
    zip = require('gulp-zip'),
    usemin = require('gulp-usemin'),
    htmlmin = require('gulp-htmlmin'),
    htmlbeautify = require('gulp-html-beautify'),
    uglify = require('gulp-uglify'),
    rev = require('gulp-rev'),
    del = require('del');


var project_path = './app/';
var rel_project_path = 'app/';
var template_path = './tpl/';
var build_path = './build/';
var dist_path = './dist/';

var fullPath = __dirname;
var path = fullPath.split('/');
var cwd = path[path.length - 1];

var paths = {
    server: project_path,
    html: project_path + '**/*.html',
    images: project_path + 'images/**/*.+(jpeg|jpg|png|gif|svg)',
    images_path: project_path + 'images',
    sass: project_path + 'scss/**/*.scss',
    css: project_path + 'css/'
    // compass_scss_dest: project_path + 'scss/settings'
};

gulp.task('nunjucks', function () {
    // Gets .html and .nunjucks files in pages
    return gulp.src('tpl/pages/**/*.+(html|nunjucks|njk)')
        // Renders template with nunjucks
        .pipe(nunjucksRender({
            path: ['./tpl/templates']
        }))
        // output files in app folder
        .pipe(gulp.dest(project_path))
});

gulp.task('build-html', ['build-clean'], function() {
    
  return gulp.src(project_path+'/**/*.html')
    .pipe(usemin({
      css: [ rev() ],
      html: [ htmlbeautify() ],
      js: [ uglify(), rev() ]   
    }))
    .pipe(gulp.dest(build_path));
});

gulp.task('build', ['build-html'], function() {
  return gulp.src([
      project_path+'/**/*',
      '!app/**/*.html', 
      '!app/*.html', 
      '!app/**/*.css', 
      '!app/*.css', 
      '!app/**/*.js', 
      '!app/*.js',
      '!app/css',
      '!app/js'
      ])
    .pipe(gulp.dest(build_path));
});

var reportSuccess = function (success) {
    notify({
        title: 'Task Completed [' + success.plugin + ']',
        message: 'Sass file successfully compiled',
        sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    });

    gutil.beep();
}
var reportError = function (error) {
    var lineNumber = (error.lineNumber) ? 'LINE ' + error.lineNumber + ' -- ' : '';

    notify({
        title: 'Task Failed [' + error.plugin + ']',
        message: lineNumber + 'See console for error details.',
        sound: 'Sosumi'
    }).write(error);

    gutil.beep(); // Beep 'sosumi' to alrert that the gulp-sass task failed

    var report = '';
    var chalk = gutil.colors.white.bgRed;

    report += chalk('TASK:') + ' [' + error.plugin + ']\n';
    report += chalk('PROB:') + ' ' + error.message + '\n';
    if (error.lineNumber) { report += chalk('LINE:') + ' ' + error.lineNumber + '\n'; }
    if (error.fileName) { report += chalk('FILE:') + ' ' + error.fileName + '\n'; }
    console.error(report);

    // Prevent the 'watch' task from stopping
    this.emit('end');
}


gulp.task('sass', function () {
    return gulp.src(paths.sass)
        .pipe(plumber({
            errorHandler: reportError
        }))
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', reportError))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer('last 2 versions', '> 5%'))
        .pipe(csscomb())
        .pipe(size())
        .pipe(notify({
            title: 'Task Completed',
            message: 'Sass file successfully compiled',
            sound: 'Ping' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
        }))
        .pipe(gulp.dest(paths.css))
        .pipe(browserSync.stream());
});
gulp.task('prod-clean', function () {
    //console.log(cwd);
    return del([dist_path], { force: true });
});
gulp.task('build-clean', function () {
    //console.log(cwd);
    return del([build_path], { force: true });
});
gulp.task('prod', ['prod-clean', 'sass', 'nunjucks', 'build'], function () {
    return gulp.src(['build/**/*'])
        .pipe(zip('dist.zip'))
        .pipe(gulp.dest(dist_path));
});

// Static Server + watching scss/html files
gulp.task('serve', ['sass', 'nunjucks'], function () {

    browserSync.init({
        startPath: project_path,
        server: {
            baseDir: './'
        }
    });
    gulp.watch(paths.sass, ['sass']);
    gulp.watch('tpl/**/*.+(html|nunjucks|njk)', ['nunjucks']);
    gulp.watch("app/*.html").on('change', browserSync.reload);
    
});

gulp.task('default', ['serve']);
