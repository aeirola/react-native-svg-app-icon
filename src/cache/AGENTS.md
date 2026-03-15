# Cache

The cache enables incremental builds by tracking hashes of input and output files across runs. `CacheSession` is created per generation run with the input file buffers and a `force` flag.

For each output file, `isUpToDate()` checks whether the package version, input hashes, and output hash all match the stored cache. If so, the file is skipped. After writing a file, `recordBuffer()` records its hash in memory. At the end of the run, `flush()` persists the updated cache.

Cache data is stored as JSON in a temp directory (`os.tmpdir()/react-native-svg-app-icon/<project-hash>/cache.json`), keyed by an hash of `process.cwd()`. The schema is validated with arktype on read.
