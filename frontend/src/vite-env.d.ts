/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_REGISTER_ADDRESS: string
  readonly VITE_EOCHO_TOKEN_ADDRESS: string
  readonly VITE_TASK_ESCROW_ADDRESS: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_NETWORK_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
