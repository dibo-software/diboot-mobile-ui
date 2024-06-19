import _ from 'lodash'

const INIT_CACHE = {
  optionsMap: {}
}
export interface FormDesignerStore {
  cache: Record<string, any>
}

export default defineStore('formRuntime', {
  state: () => {
    return <FormDesignerStore>{
      cache: _.cloneDeep(INIT_CACHE)
    }
  },
  actions: {
    reset() {
      this.cache = _.cloneDeep(INIT_CACHE)
    }
  }
})
