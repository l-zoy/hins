module.exports = function babelRegister(path) {
  const only = Array.isArray(path) ? path : [path]

  require('@babel/register')({
    presets: [
      require.resolve('@babel/preset-typescript'),
      [
        require.resolve('@babel/preset-env'),
        {
          targets: { node: 10 },
          modules: 'auto',
          exclude: [
            'transform-member-expression-literals',
            'transform-reserved-words',
            'transform-template-literals',
            'transform-typeof-symbol',
            'transform-unicode-regex',
            'transform-sticky-regex',
            'transform-new-target',
            'transform-modules-umd',
            'transform-modules-systemjs',
            'transform-modules-amd',
            'transform-literals',
            'transform-regenerator'
          ]
        }
      ]
    ],
    /*
    @babel/preset-env cover:
     · @babel/plugin-transform-modules-commonjs
     · @babel/plugin-proposal-export-namespace-from
     · @babel/plugin-proposal-nullish-coalescing-operator
     · @babel/plugin-proposal-optional-chaining
     · @babel/plugin-syntax-dynamic-import
     · @babel/plugin-proposal-class-properties
    */
    plugins: [
      [require.resolve('@babel/plugin-transform-modules-commonjs'), { lazy: true }],
      require.resolve('@babel/plugin-proposal-export-default-from'),
      [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }]
    ],
    only,
    extensions: ['.js', '.ts'],
    babelrc: false,
    cache: false,
    sourceMaps: 'inline'
  })
}
