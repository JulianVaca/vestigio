import test from 'node:test'
import assert from 'node:assert/strict'
import { getLookDelta } from '../src/museum/lookControls.js'

const k = 0.0042

test('normal por defecto: arrastrar a la derecha mira a la derecha', () => {
  const { yaw, pitch } = getLookDelta(100, 0, k)
  assert.ok(yaw < 0, 'rotación Y negativa en Three.js mira hacia la derecha')
  assert.equal(Math.abs(pitch), 0)
})

test('normal: arrastrar abajo mira hacia abajo', () => {
  const { yaw, pitch } = getLookDelta(0, 100, k)
  assert.equal(Math.abs(yaw), 0)
  assert.ok(pitch < 0, 'rotación X negativa en Three.js mira hacia abajo')
})

test('invertido: recupera los controles originales en ambos ejes', () => {
  const { yaw, pitch } = getLookDelta(100, 100, k, true)
  assert.equal(yaw, 100 * k)
  assert.equal(pitch, 100 * k * 0.8)
})

test('alternar modo invierte ambos ejes sin modificar la sensibilidad', () => {
  const normal = getLookDelta(-29, 17, 0.006)
  const inverted = getLookDelta(-29, 17, 0.006, true)
  assert.equal(normal.yaw, -inverted.yaw)
  assert.equal(normal.pitch, -inverted.pitch)
})
