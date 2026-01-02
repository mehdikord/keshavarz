import api from '../src/utils/api'

/**
 * Composable for accessing the API instance
 * 
 * @example
 * const { api } = useApi()
 * api.post('/auth/send-otp', { phone })
 */
export const useApi = () => {
  return {
    api
  }
}

