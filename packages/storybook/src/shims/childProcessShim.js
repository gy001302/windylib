function unsupported() {
  throw new Error('child_process is not available in browser builds.')
}

const shim = {
  spawn: unsupported,
  exec: unsupported,
}

export const spawn = unsupported
export const exec = unsupported
export default shim
