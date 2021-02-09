import {series, task, dest, watch} from 'gulp';
import {createProject} from 'gulp-typescript';

const tsProject = createProject('tsconfig.json');

function scripts () {
    const tsResult = tsProject.src().pipe(tsProject());
    return tsResult.js.pipe(dest('dist'));
}
const compileScripts = () => series(scripts);

task('compile:script', compileScripts());
task('watch:script', () => watch('src/**/*.ts', compileScripts()));

task('default', series('watch:script'));