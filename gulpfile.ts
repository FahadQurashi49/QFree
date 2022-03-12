import {series, task, src, dest, watch} from 'gulp';
import {createProject} from 'gulp-typescript';
import * as sourcemaps from 'gulp-sourcemaps';

const tsProject = createProject('tsconfig.json');

function scripts () {
    const tsResult = tsProject
                        .src()
                        .pipe(sourcemaps.init())
                        .pipe(tsProject());
    return tsResult.js
    .pipe(sourcemaps.write('sourcemaps', {includeContent: false, sourceRoot: __dirname + '/src'}))
    .pipe(dest('dist'));
}
function copyHtml() {
    return src('src/**.html')
    .pipe(dest('dist'));
}
function copySocketClient() {
    return src('node_modules/socket.io/client-dist/socket.io.js')
    .pipe(dest('dist/socket.io'));
}
const compileScripts = () => series(copyHtml, scripts, copySocketClient);

task('compile:script', compileScripts());
task('watch:script', () => watch(['src/**/*.ts', 'src/**/*.html'], compileScripts()));
task('watch:html', () => watch('src/**/*.html', copyHtml()));

task('default', series('watch:script'));