---
'@codama/renderers-demo': patch
---

Support `@codama/nodes@1.10`, whose node array attributes are now optional (`Array<T> | undefined`). Array reads and helper call sites are guarded with `?? []` throughout the renderer.
