import _ from 'lodash'
import KeywordType from '../keyword_type'

const NUMBER_MATCHING_GROUP = '(\\d+)'
const NUMBER_PATTERN = /\d+/g
const QUOTED_STRING_MATCHING_GROUP = '"([^"]*)"'
const QUOTED_STRING_PATTERN = /"[^"]*"/g

export default class StepDefinitionSnippetBuilder {
  constructor(snippetSyntax) {
    this.snippetSyntax = snippetSyntax
  }

  build(step) {
    const functionName = this.getFunctionName(step)
    const pattern = this.getPattern(step)
    const parameters = this.getParameters(step, pattern)
    const comment = 'Write code here that turns the phrase above into concrete actions'
    return this.snippetSyntax.build(functionName, pattern, parameters, comment)
  }

  countPatternMatchingGroups(pattern) {
    const numberMatchingGroupCount = pattern.split(NUMBER_MATCHING_GROUP).length - 1
    const quotedStringMatchingGroupCount = pattern.split(QUOTED_STRING_MATCHING_GROUP).length - 1
    return numberMatchingGroupCount + quotedStringMatchingGroupCount
  }

  getFunctionName(step) {
    switch(step.getKeywordType()) {
      case KeywordType.EVENT: return 'When'
      case KeywordType.OUTCOME: return 'Then'
      case KeywordType.PRECONDITION: return 'Given'
    }
  }

  getParameters(step) {
    return _.concat(
      this.getPatternMatchingGroupParameters(step),
      this.getStepArgumentParameters(step),
      'callback'
    )
  }

  getPattern(step) {
    const stepName = step.getName()
    const escapedStepName = stepName.replace(/[-[\]{}()*+?.\\^$|#\n\/]/g, '\\$&')
    const parameterizedStepName = escapedStepName
      .replace(NUMBER_PATTERN, NUMBER_MATCHING_GROUP)
      .replace(QUOTED_STRING_PATTERN, QUOTED_STRING_MATCHING_GROUP)
    return `/^${parameterizedStepName}$/`
  }

  getPatternMatchingGroupParameters(step) {
    const pattern = this.getPattern(step)
    return _.times(this.countPatternMatchingGroups(pattern), function (n) {
      return `arg${n + 1}`
    })
  }

  getStepArgumentParameters(step) {
    return step.getArguments().map(function (arg) {
      const type = arg.constructor.name
      switch (type) {
        case 'DataTable':
          return 'table'
        case 'DocString':
          return 'string'
        default:
          throw new Error(`Unknown argument type: ${type}`)
      }
    })
  }
}
