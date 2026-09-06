import type { QuartzComponent, QuartzComponentConstructor } from "@quartz-community/types"
// @ts-expect-error handled by the plugin build
import browserScript from "./algorithm-demo.inline.ts"
import styles from "./styles"

const AlgorithmDemoAssets: QuartzComponent = () => null
AlgorithmDemoAssets.afterDOMLoaded = browserScript
AlgorithmDemoAssets.css = styles

export default (() => AlgorithmDemoAssets) satisfies QuartzComponentConstructor
