import _ from 'lodash'
import fs from 'mz/fs'
import path from 'path'
import stringArgv from 'string-argv'

export default class ProfileLoader {
  constructor(directory) {
    this.directory = directory
  }

  async getDefinitions() {
    const definitionsFilePath = path.join(this.directory, 'cucumber.js')
    try {
      await fs.access(definitionsFilePath)
    } catch (error) {
      return {}
    }
    const definitions = require(definitionsFilePath)
    if (typeof definitions !== 'object') {
      throw new Error(definitionsFilePath + ' does not export an object')
    }
    return definitions
  }

  async getArgv(profiles) {
    const definitions = await this.getDefinitions()
    if (profiles.length === 0 && definitions['default']) {
      profiles = ['default']
    }
    var argvs = profiles.map(function (profile){
      if (!definitions[profile]) {
        throw new Error('Undefined profile: ' + profile)
      }
      return stringArgv(definitions[profile])
    })
    return _.flatten(argvs)
  }
}