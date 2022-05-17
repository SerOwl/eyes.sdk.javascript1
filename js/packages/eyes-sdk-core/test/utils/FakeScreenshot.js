const png = require('png-async')

function generateScreenshot() {
  const image = new png.Image({
    width: this._window.rect.width,
    height: this._window.rect.height,
  })
  const stream = image.pack()
  return new Promise((resolve, reject) => {
    let buffer = Buffer.from([])
    stream.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk])
    })
    stream.on('end', () => resolve(buffer))
    stream.on('error', reject)
  })
}

exports.generateScreenshot = generateScreenshot
