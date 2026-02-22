import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import json from '@rollup/plugin-json';

const dev = process.env.ROLLUP_WATCH;

const serveopts = {
  contentBase: ['./dist'],
  host: '0.0.0.0',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

const plugins = [
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
  }),
  json(),
  babel({
    babelHelpers: 'bundled',
    extensions: ['.js', '.ts'],
    exclude: 'node_modules/**',
  }),
  dev && serve(serveopts),
  !dev && terser(),
];

export default [
  {
    input: 'src/iparcelbox-card.ts',
    output: {
      dir: 'dist',
      format: 'es',
    },
    plugins: [...plugins],
  },
];
