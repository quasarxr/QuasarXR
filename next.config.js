const webpack = require('webpack');

module.exports = {
  async redirects() {
    return [
      // Basic redirect
      // {
      //   source: '/SubApp',
      //   destination: '/SubApp/SubLeafApp/',
      //   permanent: true,
      // },
      // Wildcard path matching
      // {
      //   source: '/blog/:slug',
      //   destination: '/news/:slug',
      //   permanent: true,
      // },
    ]
  },
}