const app = Vue.createApp({
    data() {
        return {
            basePath: '',
            visible: false,
            formInline: {
                url: '',
                module: '',
                oldHost: 'api'
            },
            module: [],
            apiData: {},
            apiGenerate: '',
            loading: false,
            activeNames: '1',
            tableDataRow: [],
            definitions: {},
            platform: 'Apifox',
        }
    },
    mounted() {
        var clipboard = new ClipboardJS('.copyBtn')
        console.log(clipboard);
        clipboard.on('success', (e) => {
            this.$message({
                message: '复制成功',
                type: 'success'
            })
            e.clearSelection()
        })
        clipboard.on('error', (e) => {
            console.error('Action:', e.action)
            console.error('Trigger:', e.trigger)
            this.$message({
                type: "error",
                message: '复制失败'
            })
        })

        const form = JSON.parse(localStorage.getItem('form'))
        if (form) {
            this.formInline = form
            this.urlInput(this.formInline.url)
        }
    },
    beforeMount() {
        console.log(23424);
    },
    methods: {
        /**
         * @description: 用户输入的url
         * @param {*} value
         * @return {*}
         */
        urlInput(value) {
            if (/http/.test(value)) {
                if (!/openapi/.test(value)) {
                    // value = value + '/v2/api-docs'
                    this.platform = 'swagger'
                }

                this.$notify({
                    type: "success",
                    title: '提示',
                    position: "bottom-right",
                    message: `当前api文档平台为 (${this.platform}) `
                })

                this.loading = true


                axios
                    .get(value)
                    .then(({data}) => {
                        this.loading = false
                        const {tags, basePath, definitions} = data
                        this.basePath = basePath || ''
                        this.apiData = data.paths

                        // 收集生成表格的原生数据
                        var reg = /^[\u4e00-\u9fa5]\S*[\u4e00-\u9fa5]$/
                        for (const key in definitions) {
                            if (reg.test(key)) {
                                this.tableDataRow.push(definitions[key])
                            }
                        }

                        this.definitions = definitions
                    })
                    .then(() => {
                        localStorage.setItem('form', JSON.stringify(this.formInline))

                        this.apiGenerate = ''
                        for (const key in this.apiData) {
                            const target = this.apiData[key]
                            let method = 'get'
                            let tag  // 接口模块名字
                            if (target['get']) {
                                tag = target['get'].tags
                                method = 'get'
                            } else {
                                tag = target['post'].tags
                                method = 'post'
                            }
                            let parameters
                            parameters = target[method].parameters


                            summary = target[method].summary

                            const annotation = this.generateAnnotation(parameters, summary)
                            this.apiGenerate += this.generateFuction(
                                target,
                                key,
                                method,
                                annotation
                            )
                        }
                    })
                    .catch(() => {
                        this.loading = false
                        this.$notify({
                            type: "error",
                            title: '提示',
                            position: "bottom-right",
                            message: `文档数据加载失败了!!! `
                        })

                    })
            }
        },

        /**
         * @description: 选择需要生成代码的模块
         * @param {*}
         * @return {*}
         */
        selectModule() {
            localStorage.setItem('form', JSON.stringify(this.formInline))

            this.apiGenerate = ''
            for (const key in this.apiData) {
                const target = this.apiData[key]
                let method = 'get'
                let tag  // 接口模块名字，如: /web/账号
                if (target['get']) {
                    tag = target['get'].tags
                    method = 'get'
                } else {
                    tag = target['post'].tags
                    method = 'post'
                }
                let parameters
                parameters = target[method].parameters


                summary = target[method].summary


                const annotation = this.generateAnnotation(parameters, summary)
                this.apiGenerate += this.generateFuction(
                    target,
                    key,
                    method,
                    annotation
                )
            }
        },
        /**
         * @description: 生成函数注释
         * @param {*} parameters
         * @return {*}
         */
        generateAnnotation(parameters = [], summary) {
            let paramStr = ``
            //     if (this.platform !== 'Apifox') {
            //       const schema = parameters[0]
            //       if (parameters.length === 1 && schema) {
            //         const key = schema.schema.$ref.split('/').at(-1)
            //         parameters = this.definitions[key].properties
            //         for (const [key, value] of Object.entries(parameters)) {
            //           if (!/key/g.test(paramStr)) {
            //             paramStr +=
            //               `
            // * @param {${value.type}} ${key} ${value.description}`
            //           }
            //         }
            //       } else {
            //         parameters.forEach(item => {
            //           if (!/item.name/g.test(paramStr)) {
            //             paramStr += `
            // * @param {*} ${item.name}
            //             `
            //           }
            //         })
            //       }
            //     }


            //  判断是否生成了参数
            if (paramStr) {
                return `
/**
  * @description: ${summary}
  ${paramStr}
  * @return {*}
  */ `
            } else {
                return `
/**
  * @description: ${summary}
  * @return {*}
  */ `
            }

        },

        /**
         * @description: 生成函数
         * @param {*} target
         * @param {*} key
         * @param {*} method
         * @param {*} annotation
         * @return {*}
         */
        generateFuction(target, key, method, annotation) {
            let paramsType = 'data'

            if (method === 'get') {
                paramsType = 'params'
            }
            const paths = key.split('/')
            const isUrlParams = /{\S+}/.test(paths)
            let url = `${this.basePath}${key}`
            let methodPart = paths.at(-1)
            const urlParams = paths.at(-1).replace(/\{|\}/g, '')
            if (isUrlParams) {
                methodPart = paths.at(-2)
                key = key.replace(/\{\S+\}/g, '')
                url = `"${this.basePath}${key}"` + '+' + urlParams
            }
            console.log(" -- ", paths.map(word => word.replace(/^\S/, s => s.toUpperCase())).join())
            const funcStr = `
            ${annotation}
            export const ${method}${paths.map(word => word.replace(/^\S/, s => s.toUpperCase())).join('')} = (${isUrlParams ? urlParams + ',' : ''} ${paramsType}, other = {}) => request({
                url:'${url}',
                method: '${method}',
                ${paramsType},
                ...other
              })`
            return funcStr
        },

        /**
         * @description: 生成旧版 api
         * @param {*}
         * @return {*}
         */
        generateOldFunction(key, method, summary, interface, interfaceName) {
            const interfaceNameRes = interface ? ':' + interfaceName : ''
            const paths = key.split('/')
            const methodPart = paths.at(-1)
            const url = `${this.formInline.oldHost}|${this.basePath}${key}|${method.toUpperCase()}`
            return `
          ${interface}
          ${summary}
          export const ${method}${methodPart.replace(/^\S/, s =>
                s.toUpperCase()
            )} = (data${interfaceNameRes} ) =>  request('${url}',data)`
        },

        async getAppReservationPage() {
            try {
                this.tableLoading = true
                const {code, data} = await getAppReservationPage(this.listQuery)
                if (code === 0) {
                    this.total = data.total
                    this.tabelData = data.records
                }
            } catch (error) {
                console.log(error)
            } finally {
                this.tableLoading = false
            }
        },

        /**
         * @description: 生成 vue 内部调用函数
         * @param {*} key
         * @param {*} method
         * @param {*} annotation
         * @return {*}
         */
        generateVueFunc(key, method, annotation) {
            const paths = key.split('/')
            const methodPart = paths.at(-1)
            const funcName = ` ${method}${methodPart.replace(/^\S/, s =>
                s.toUpperCase()
            )}`
            const funcStr = `
        ${annotation}
        async ${funcName}() {
            try {
                const { code, result } = await ${funcName}()
                if (code === 200 && result) {

                }else{
                    this.tableData = []
                }
            } catch (error) {
                console.log(error)
            }
        },`
            return funcStr
        },

        generateTable(row) {
            const properties = row.properties
            let keyArr = `
                [`
            let titleArr = `
                [`
            // const propertiesLength = Object.keys(row.properties).length-1
            // let index = 0
            function generateAccuracyStr(key, title) {
                if (/[准确率|正确率]/g.test(title)) {
                    return `
            <template slot-scope="{row}">
              <div>
                {{((row['${key}']||0)*100).toFixed(2)}}%
              </div>
            </template>
            `
                }
                return ``
            }

            let str = `
            // ${row.title}
            <el-table :data="tableData"
            style="width: 100%"
            height="100%"
            v-loading="tableLoading"
            :header-row-style="aheaderRowStyle"
            :row-class-name="tableRowClassName">`
            for (const [key, value] of Object.entries(properties)) {
                keyArr += `"${key}",
                `
                titleArr += `"${value.description}",
                `
                str += `
                <el-table-column prop="${key}"
                     label="${value.description}"
                     sortable=''
                     min-width='160px'
                     align='center'>
                ${generateAccuracyStr(key, value.description)}
                </el-table-column> `
            }
            str += `
            </el-table>
            ${keyArr}]
            ${titleArr}]
            `
            return str
        },

        getInterfaceName(key, method) {
            const paths = key.split('/')
            const methodPart = paths.at(-1)
            return `${method.replace(/^\S/, s => s.toUpperCase())}${methodPart.replace(/^\S/, s => s.toUpperCase())}`
        }
    }
})
app.use(ElementPlus)
app.mount('#app')
