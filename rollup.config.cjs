const typescript = require('rollup-plugin-typescript2');

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/liquidbrain.umd.js',
      format: 'umd',
      name: 'LiquidBrain',
      sourcemap: true,
      globals: {
        // Map external dependencies if any
      },
    },
    {
      file: 'dist/liquidbrain.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true,
    }),
  ],
};
