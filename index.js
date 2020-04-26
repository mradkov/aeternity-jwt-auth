const { Universal: Ae, MemoryAccount, Node, Crypto } = require('@aeternity/aepp-sdk')
const { verifyPersonalMessage, decodeBase58Check, hash } = require('@aeternity/aepp-sdk').Crypto
const config = require('./config')
const jwt = require('jsonwebtoken')
const { Entropy } = require('entropy-string')

// Initialize aeternity SDK client
let sdk
const initSDK = async (keypair = config.keypair) => {
  sdk = await Ae({
    nodes: [
      {
        name: 'someNode',
        instance: await Node({
          url: config.network.nodeUrl,
          internalUrl: config.network.nodeUrl,
        }),
      },
    ],
    compilerUrl: config.network.compilerUrl,
    accounts: [
      MemoryAccount({ keypair: keypair }),
    ],
    address: keypair.publicKey,
  })

  const height = await sdk.height()
  console.log(
    `SDK initialized by ${keypair.publicKey} ! Current network height: ${height}`,
  )

  // [app] generate login request token
  const loginRequestToken = generateLoginRequest(
    // requester public address
    config.keypair.publicKey,
  )

  console.log('JWT Auth challenge:')
  console.log(loginRequestToken)

  // [wallet] gets and decodes the token
  const { header, payload } = jwt.decode(
    loginRequestToken,
    {
      complete: true,
    },
  )

  // [wallet] sign the challenge jwt token
  // wallet.signMessage(data)
  const signedChallenge = await sdk.signMessage(
    payload.challenge,
  )
  console.log('Signed challenge:')
  console.log(signedChallenge)

  // [app] verify token and signed challenge
  const verify = verifyToken(
    loginRequestToken,
    signedChallenge,
  )
  console.log('Auth:')
  console.log(verify)

  console.log('\n\n========= TEST:')
  console.log('Different token and signed challenge:')

  // [app] verify token and signed challenge
  const verifyWrong = verifyToken(
    // Test with different login request token
    generateLoginRequest(config.keypair.publicKey),
    signedChallenge,
  )
  console.log('Auth:')
  console.log(verifyWrong)
}

initSDK()

const generateLoginRequest = (address) => {
  return jwt.sign(
    {
      publicKey: address,
      challenge: hash(new Entropy().string())
    },
    config.jwtOptions.secretOrKey,
    { expiresIn: '1h' },
  )
}

const verifyToken = (token, signature) => {
  // verify a token symmetric
  return jwt.verify(token, config.jwtOptions.secretOrKey, (err, decoded) => {
    if (err) return false;
    const { publicKey, challenge } = decoded;
    const author = decodeBase58Check(publicKey.substring(3))
    const authString = Buffer.from(challenge);
    const signatureArray = Uint8Array.from(Buffer.from(signature, 'hex'));
    return verifyPersonalMessage(authString, signatureArray, author);
  })
}
