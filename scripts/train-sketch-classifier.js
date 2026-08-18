import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { embedImage, getClipPredictor, SPECIES } from '../server/clipPredictor.js'

// Put labeled child drawings in training/sketches/{insect_id}/ before running:
// npm run train:sketches
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataRoot = path.join(root, 'training', 'sketches')
const outputPath = path.join(root, 'training', 'sketch-model.json')

function average(vectors, width) {
  const centroid = new Float32Array(width)
  for (const vector of vectors) for (let i = 0; i < width; i += 1) centroid[i] += vector[i] / vectors.length
  let norm = 0
  for (const value of centroid) norm += value ** 2
  norm = Math.sqrt(norm) || 1
  return Array.from(centroid, (value) => value / norm)
}

const predictor = await getClipPredictor()
const classes = []
for (const species of SPECIES) {
  const directory = path.join(dataRoot, String(species.id))
  let names = []
  try { names = (await fs.readdir(directory)).filter((name) => /\.(png|jpe?g|webp)$/i.test(name)) } catch { /* no samples yet */ }
  const vectors = []
  for (const name of names) {
    const feature = await embedImage(await fs.readFile(path.join(directory, name)), predictor)
    vectors.push(Array.from(feature.data.slice(0, feature.width)))
  }
  classes.push({ insect_id: species.id, centroid: vectors.length ? average(vectors, predictor.candidateFeatures.width) : Array(predictor.candidateFeatures.width).fill(0), samples: vectors.length })
  console.log(`${species.id}: ${vectors.length} sample(s)`)
}
await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, JSON.stringify({ version: 1, feature_size: predictor.candidateFeatures.width, total_samples: classes.reduce((sum, item) => sum + item.samples, 0), classes }, null, 2))
console.log(`saved ${outputPath}`)
