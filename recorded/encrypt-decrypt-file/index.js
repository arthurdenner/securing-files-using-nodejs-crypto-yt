const CryptoHelper = require('./src/cryptoHelper')
const app = require('./src/app')

;(async () => {
  const config = {
    // aes-192
    // 24 caracteres * 8 = 192 bits
    cryptoKey: 'minha-senha-super-segura',
  }
  const cryptoHelper = await CryptoHelper.setup(config)

  const writeFileHandler = {
    apply: async function (target, that, args) {
      const [filename, data, encoding = ''] = args
      const encryptedText = await cryptoHelper.encrypt(data)

      return target(filename, encryptedText, encoding)
    },
  }

  const readFileHandler = {
    apply: async function (target, that, args) {
      const data = await target(...args)
      const decrypted = await cryptoHelper.decrypt(data)

      return decrypted
    },
  }

  const promisesHandler = {
    get: function (target, prop, receiver) {
      switch (prop) {
        case 'writeFile':
          return new Proxy(target[prop], writeFileHandler)
        case 'readFile':
          return new Proxy(target[prop], readFileHandler)
        default:
          return Reflect.get(...arguments)
      }
    },
  }

  const customFsPromises = new Proxy(require('fs').promises, promisesHandler)

  await app.run(customFsPromises)
})()
