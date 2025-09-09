import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/authHandlers'

// Setup requests interception using the given handlers
export const server = setupServer(...authHandlers)