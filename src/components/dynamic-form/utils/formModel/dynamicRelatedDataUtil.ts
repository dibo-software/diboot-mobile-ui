const buildRelatedLoader = (config: any) => {
  const { extension, fieldType } = config

  if (!extension) {
    return null
  }

  const { appModule, modelKey, fieldKey, lazyChild, treeModel, treeModelInfo } = extension
  const loader: Record<string, any> = {
    appModule,
    type: modelKey,
    label: fieldKey,
    lazyChild
  }
  if (treeModel) {
    _.assign(loader, {
      parentPath: 'parentIdsPath',
      parent: treeModelInfo.parentField,
      label: treeModelInfo.labelField
    })
  }
  if (fieldType === 'dept-selector') {
    Object.assign(loader, {
      appModule: 'model-center',
      type: 'Organization',
      label: 'name',
      parent: 'parentId',
      orderBy: 'sortId',
      lazyChild: false
    })
  } else if (fieldType === 'user-selector') {
    Object.assign(loader, {
      appModule: 'model-center',
      type: 'User',
      label: 'realname',
      prefix: 'User:'
    })
  }
  const relatedLoader: Record<string, any> = {
    prop: config.id,
    loader
  }
  return relatedLoader
}

export { buildRelatedLoader }
