/* eslint-disable no-console */
/**
 * 程序化生成小程序内置音频，不使用任何第三方录音素材。
 * 输出单声道 PCM WAV 源文件到项目外的备份目录，避免被误打进小程序包。
 * 发布时需将源文件压缩为 MP3 后再放入 assets/audio。
 */
const fs = require('fs')
const path = require('path')

const outputDir = path.join(__dirname, '..', '..', '音频源文件备份')

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (1664525 * value + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function clamp(value) {
  return Math.max(-1, Math.min(1, value))
}

function writeWav(name, samples, sampleRate) {
  const dataSize = samples.length * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2)
  }
  fs.writeFileSync(path.join(outputDir, name), buffer)
  console.log(`generated ${name} (${Math.round(buffer.length / 1024)} KB)`)
}

function softenLoop(samples, sampleRate) {
  const edge = Math.min(Math.floor(sampleRate * 0.08), Math.floor(samples.length / 4))
  for (let i = 0; i < edge; i++) {
    const gain = Math.sin((i / edge) * Math.PI / 2)
    samples[i] *= gain
    samples[samples.length - 1 - i] *= gain
  }
  return samples
}

function makeBell(sampleRate = 22050, seconds = 3) {
  const out = new Float32Array(sampleRate * seconds)
  const partials = [[523.25, 1], [1046.5, 0.46], [1569.8, 0.24], [2150, 0.13]]
  for (let i = 0; i < out.length; i++) {
    const t = i / sampleRate
    let value = 0
    partials.forEach(([frequency, level], index) => {
      value += Math.sin(2 * Math.PI * frequency * t + index * 0.25) * level * Math.exp(-t * (2.2 + index * 0.65))
    })
    out[i] = value * 0.5
  }
  return out
}

function makePageFlip(sampleRate = 22050, seconds = 0.9) {
  const random = seededRandom(20260801)
  const out = new Float32Array(Math.floor(sampleRate * seconds))
  let smooth = 0
  for (let i = 0; i < out.length; i++) {
    const t = i / sampleRate
    const white = random() * 2 - 1
    smooth += 0.18 * (white - smooth)
    const envelope = Math.pow(Math.sin(Math.PI * Math.min(1, t / seconds)), 1.6)
    const swish = 0.55 + 0.45 * Math.sin(2 * Math.PI * (3 + t * 8) * t)
    out[i] = (white - smooth * 0.55) * envelope * swish * 0.3
  }
  return out
}

function pluckInto(out, sampleRate, startSec, frequency, volume, decay = 2.2) {
  const start = Math.floor(startSec * sampleRate)
  for (let i = start; i < out.length; i++) {
    const t = (i - start) / sampleRate
    if (t > 4) break
    const attack = Math.min(1, t * 80)
    const body = Math.sin(2 * Math.PI * frequency * t)
      + 0.38 * Math.sin(2 * Math.PI * frequency * 2.01 * t + 0.4)
      + 0.18 * Math.sin(2 * Math.PI * frequency * 3.98 * t + 0.7)
    out[i] += body * attack * Math.exp(-t * decay) * volume
  }
}

function makeGuqinEffect(sampleRate = 22050) {
  const out = new Float32Array(sampleRate * 3)
  pluckInto(out, sampleRate, 0, 392, 0.38, 2)
  pluckInto(out, sampleRate, 0.14, 523.25, 0.25, 2.4)
  return out
}

function makeAmbient(kind, sampleRate = 11025, seconds = 10) {
  const seeds = { rain: 20260802, breeze: 20260803, room: 20260804, guqin: 20260805 }
  const random = seededRandom(seeds[kind])
  const out = new Float32Array(sampleRate * seconds)
  let slow = 0
  let slower = 0

  for (let i = 0; i < out.length; i++) {
    const t = i / sampleRate
    const white = random() * 2 - 1
    slow += 0.035 * (white - slow)
    slower += 0.003 * (white - slower)
    if (kind === 'rain') {
      const hiss = white * 0.11 + slow * 0.2
      const texture = 0.82 + 0.18 * Math.sin(2 * Math.PI * 0.13 * t)
      out[i] = hiss * texture
    } else if (kind === 'breeze') {
      const gust = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.075 * t + Math.sin(t * 0.31))
      out[i] = (slow * 0.34 + slower * 0.9) * (0.35 + gust * 0.65)
    } else if (kind === 'room') {
      out[i] = slower * 0.42 + slow * 0.035
    } else {
      out[i] = slower * 0.05
    }
  }

  if (kind === 'rain') {
    for (let drop = 0; drop < 24; drop++) {
      const start = Math.floor(random() * (out.length - sampleRate * 0.25))
      const frequency = 900 + random() * 1700
      const length = Math.floor(sampleRate * (0.03 + random() * 0.08))
      for (let j = 0; j < length; j++) {
        out[start + j] += Math.sin(2 * Math.PI * frequency * j / sampleRate)
          * Math.exp(-j / (length * 0.25)) * 0.07
      }
    }
  }

  if (kind === 'guqin') {
    const notes = [261.63, 329.63, 392, 523.25, 392]
    notes.forEach((frequency, index) => pluckInto(out, sampleRate, 0.45 + index * 1.85, frequency, 0.19, 1.65))
  }
  return softenLoop(out, sampleRate)
}

fs.mkdirSync(outputDir, { recursive: true })
writeWav('bell-copper.wav', makeBell(), 22050)
writeWav('page-flip.wav', makePageFlip(), 22050)
writeWav('guqin-soft.wav', makeGuqinEffect(), 22050)
// rain-window.wav 使用 scripts/import-rain-source.py 处理的 CC0 实录素材，此处不覆盖。
writeWav('mountain-breeze.wav', makeAmbient('breeze'), 11025)
writeWav('guqin-loop.wav', makeAmbient('guqin'), 11025)
writeWav('empty-room.wav', makeAmbient('room'), 11025)
