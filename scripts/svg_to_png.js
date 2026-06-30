const sharp = require("sharp")
const path  = require("path")

const src  = path.join(__dirname, "../public/selected-logo.svg")
const dest = path.join(__dirname, "logo.png")

sharp(src)
  .resize(400, 400, { fit: "inside", background: { r: 0, g: 9, b: 54, alpha: 1 } })
  .png()
  .toFile(dest)
  .then(() => { console.log("logo.png written"); process.exit(0) })
  .catch(e  => { console.error(e.message);        process.exit(1) })
