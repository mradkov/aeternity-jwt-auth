module.exports = {
  network: {
    nodeUrl: 'https://mainnet.aeternity.io',
    networkId: 'ae_mainnet',
    compilerUrl: 'https://latest.compiler.aepps.com'
  },
  jwtOptions: {
    secretOrKey: 'test',
    ignoreExpiration: false,
    jsonWebTokenOptions: {
      expiresIn: '2000s'
    }
  }
}
