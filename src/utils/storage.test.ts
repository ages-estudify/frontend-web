import { beforeEach, describe, expect, it } from 'vitest'
import { storage } from '@/utils/storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve salvar e recuperar o token', () => {
    storage.setToken('meu-token')
    expect(storage.getToken()).toBe('meu-token')
  })

  it('deve salvar e recuperar a role', () => {
    storage.setRole('ADMIN')
    expect(storage.getRole()).toBe('ADMIN')
  })

  it('deve salvar e recuperar o planActive', () => {
    storage.setPlanActive(true)
    expect(storage.getPlanActive()).toBe(true)
  })

  it('deve retornar null quando token não existe', () => {
    expect(storage.getToken()).toBeNull()
  })

  it('deve limpar todos os dados', () => {
    storage.setToken('token')
    storage.setRole('ADMIN')
    storage.setPlanActive(true)
    storage.clear()
    expect(storage.getToken()).toBeNull()
    expect(storage.getRole()).toBeNull()
    expect(storage.getPlanActive()).toBe(false)
  })
})