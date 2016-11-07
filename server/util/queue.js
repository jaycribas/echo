import url from 'url'
import getBullQueue from 'bull'
import raven from 'raven'

import {parseQueryError} from 'src/server/db/errors'
import config from 'src/config'

const sentry = new raven.Client(config.server.sentryDSN)

export function getQueue(queueName) {
  const redisConfig = url.parse(config.server.redis.url)
  /* eslint-disable camelcase */
  const redisOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : undefined
  return getBullQueue(queueName, redisConfig.port, redisConfig.hostname, redisOpts)
}

export function emptyQueue(queueName) {
  return getQueue(queueName).empty()
}

const _defaultErrorHandler = () => null
export function processJobs(queueName, processor, onFailed = _defaultErrorHandler) {
  _assertIsFunction(processor, 'processor (2nd argument)')
  _assertIsFunction(onFailed, 'onFailed (3rd argument)')

  const queue = getQueue(queueName)

  queue.process(async function (job) {
    const {data, queue: {name: queueName}, jobId, attemptsMade} = job
    const currentAttemptNumber = attemptsMade + 1

    await processor(data)

    console.log(`${queueName} job ${jobId} (attempt=${currentAttemptNumber}) succeeded.`)
  })

  queue.on('failed', async (job, failure) => {
    const {data, queue: {name: queueName}, jobId, attemptsMade, attempts} = job

    console.error(`${queueName} job ${jobId} (attempt=${attemptsMade}) failed:`, failure.stack)
    failure = parseQueryError(failure)
    sentry.captureException(failure)

    if (attemptsMade >= attempts) {
      try {
        await onFailed(data, failure)
      } catch (err) {
        console.error('Job recovery unsuccessful:', err.stack)
        sentry.captureException(err)
      }
    }
  })

  queue.on('error', err => {
    console.error(`Error with job queue ${queue.name}:`, err.stack)
    sentry.captureException(err)
  })
}

function _assertIsFunction(func, name) {
  if (typeof func !== 'function') {
    throw new Error(`${name} must be a function`)
  }
}