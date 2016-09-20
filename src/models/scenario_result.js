import _ from 'lodash'
import Status, {addStatusPredicates, getStatusMapping} from '../status'

export default class ScenarioResult {
  constructor(scenario) {
    this.duration = 0
    this.failureException = null
    this.scenario = scenario
    this.status = Status.PASSED
    this.stepCounts = getStatusMapping(0)
  }

  shouldUpdateStatus(stepStatus) {
    switch (stepStatus) {
      case Status.FAILED:
        return true
      case Status.AMBIGUOUS:
      case Status.PENDING:
      case Status.SKIPPED:
      case Status.UNDEFINED:
        return this.status === Status.PASSED
      default:
        return false
    }
  }

  witnessStepResult(stepResult) {
    const stepDuration = stepResult.getDuration()
    if (stepDuration) {
      this.duration += stepDuration
    }
    const stepStatus = stepResult.getStatus()
    if (this.shouldUpdateStatus(stepStatus)) {
      this.status = stepStatus
    }
    if (stepStatus === Status.FAILED) {
      this.failureException = stepResult.getFailureException()
    }
    if (stepResult.getStep().constructor.name !== 'Hook') {
      this.stepCounts[stepStatus] += 1
    }
  }
}

addStatusPredicates(ScenarioResult.prototype)
