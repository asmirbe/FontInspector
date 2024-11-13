import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import cleanup from 'rollup-plugin-cleanup';

const isProduction = process.env.NODE_ENV === 'production';

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'iife',
        name: 'EnhancedFontAnalyzer',
        extend: true,
        globals: {
            window: 'window'
        },
        sourcemap: !isProduction
    },
    plugins: [
        typescript({
            tsconfig: './tsconfig.json'
        }),
        // Supprime les commentaires et nettoie le code
        cleanup({
            comments: 'none',
            extensions: ['js', 'ts'],
            sourcemap: !isProduction
        }),
        // Minifie le code en production
        isProduction && terser({
            format: {
                comments: false
            },
            compress: {
                drop_console: true,  // Supprime les console.log en production
                drop_debugger: true  // Supprime les debugger statements
            }
        })
    ].filter(Boolean)
};