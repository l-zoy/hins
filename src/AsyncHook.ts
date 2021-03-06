import { IAsyncHook } from './types'

export default class AsyncHook {
  /**
   * @desc subscribed hook object
   */
  taps: IAsyncHook[] = []

  /**
   * @desc hook execution function after serialization
   */
  funcs: IAsyncHook['fn'][] = []

  tap(options: IAsyncHook[]) {
    options.forEach((item) => {
      this.insert(item)
    })

    this.taps.forEach(({ fn }) => {
      this.funcs.push(fn)
    })
  }

  tapCall(value: any) {
    return this.create()(value)
  }

  insert(options: IAsyncHook) {
    // serialized taps
    // sort according to before or stage
    // return new taps
    let before
    if (typeof options.before === 'string') {
      before = new Set([options.before])
    } else if (Array.isArray(options.before)) {
      before = new Set(options.before)
    }
    let currentStage = 0
    if (typeof options.stage === 'number') {
      currentStage = options.stage
    }

    let index = this.taps.length

    while (index > 0) {
      index--
      const tapFunc = this.taps[index]
      this.taps[index + 1] = tapFunc
      const tapStage = tapFunc.stage ?? 0

      if (before) {
        if (before.has(tapFunc.name)) {
          before.delete(tapFunc.name)
          continue
        }
        // Invalid key
        if (before.size > 0) {
          throw new Error(`key name not found: ${[...before].join(', ')}`)
        }
      }

      if (tapStage > currentStage) {
        continue
      }

      index++
      break
    }

    this.taps[index] = options
  }

  create() {
    // create chain calls
    const content = this.callTapsSeries()

    const code = `const fn = this.funcs;
    return new Promise( (resolve, reject) => {
      let sync = true;
      function error(err){
        if (sync){
          resolve(Promise.resolve().then((function() { throw err; })))
        } else {
          reject(err)
        }
      }
      ${content}
      sync = false;
    })`

    return new Function('memo', code).bind(this)
  }

  callTapsSeries() {
    let code = ''
    const onDone = 'resolve(memo);'
    let current = onDone

    for (let index = this.taps.length - 1; index >= 0; index--) {
      const unroll = current !== onDone
      if (unroll) {
        code += `function next${index}(){ ${current} } \n`
        current = `next${index}();\n`
      }

      const content = `let hasResult${index} = false;
      const promise${index} = fn[${index}](memo)
      if (!promise${index}.then) {
        throw new Error("Not return promise (returned promise0)");
      }
      promise${index}.then((rest${index})=>{
        hasResult${index} = true;
        if(rest${index} !== undefined){
          memo = rest${index}
        }
        ${unroll ? `next${index}()` : onDone};
      },(err)=>{
        if (hasResult${index}){
          throw err
        }
        error(err)
      })`
      current = content
    }

    return code + current
  }
}
