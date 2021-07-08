import {series, task, dest, watch} from 'gulp';
import {createProject} from 'gulp-typescript';
import * as sourcemaps from 'gulp-sourcemaps';

const tsProject = createProject('tsconfig.json');

function scripts () {
    const tsResult = tsProject
                        .src()
                        .pipe(sourcemaps.init())
                        .pipe(tsProject());
    return tsResult.js.pipe(sourcemaps.write('sourcemaps', {})).pipe(dest('dist'));
}
const compileScripts = () => series(scripts);

task('compile:script', compileScripts());
task('watch:script', () => watch('src/**/*.ts', compileScripts()));

task('default', series('watch:script'));