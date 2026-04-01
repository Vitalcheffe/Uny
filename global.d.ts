declare global {
  namespace JSX {
    interface IntrinsicElements extends import('@react-three/fiber').ThreeElements {}
  }
}
