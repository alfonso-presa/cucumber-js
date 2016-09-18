import Event from './event'
import FeaturesResult from '../models/features_result'
import Promise from 'bluebird'
import ScenarioRunner from './scenario_runner'

export default class FeaturesRunner {
  constructor({eventBroadcaster, features, options, supportCodeLibrary}) {
    this.eventBroadcaster = eventBroadcaster
    this.features = features
    this.options = options
    this.supportCodeLibrary = supportCodeLibrary
    this.featuresResult = new FeaturesResult(options.strict)
  }

  async run() {
    const event = new Event(Event.FEATURES_EVENT_NAME, this.features)
    await this.eventBroadcaster.broadcastAroundEvent(event, async() => {
      await Promise.each(this.features, ::this.runFeature)
      await this.broadcastFeaturesResult()
    })
    return this.featuresResult.isSuccessful()
  }

  async broadcastFeaturesResult() {
    const event = new Event(Event.FEATURES_RESULT_EVENT_NAME, this.featuresResult)
    await this.eventBroadcaster.broadcastEvent(event)
  }

  async runFeature(feature) {
    if (!this.featuresResult.isSuccessful() && this.options.failFast) {
      return
    }
    const event = new Event(Event.FEATURE_EVENT_NAME, feature)
    await this.eventBroadcaster.broadcastAroundEvent(event, async() => {
      await Promise.each(feature.getScenarios(), ::this.runScenario)
    })
  }

  async runScenario(scenario) {
    if (!this.featuresResult.isSuccessful() && this.options.failFast) {
      return
    }
    const scenarioRunner = new ScenarioRunner({
      eventBroadcaster: this.eventBroadcaster,
      options: this.options,
      scenario,
      supportCodeLibrary: this.supportCodeLibrary
    })
    const scenarioResult = await scenarioRunner.run()
    this.featuresResult.witnessScenarioResult(scenarioResult)
  }
}