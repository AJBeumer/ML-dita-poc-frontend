'use strict'

const router = require('express').Router()
const http = require('http')
// const https = require('https')
const options = require('../utils/options')()
const queryBuilder = require('marklogic').queryBuilder

// TODO: DRY up into authHelper
var authHelper = require('../utils/auth-helper')
function getAuth(req) {
  var user =
    req.session.passport &&
    req.session.passport.user &&
    req.session.passport.user.username
  return authHelper.getAuthorization(req.session, req.method, '/v1/search', {
    authUser: user
  })
}

// TODO: extract out to separate module that could alternatively
// be run inside MarkLogic itself
const processSearchResponse = function(searchResponse) {
  const executionTime = parseFloat(
    searchResponse.metrics['total-time'].replace(/^PT/, '')
  )
  const pageLength = searchResponse['page-length']
  const page = Math.ceil(searchResponse.start / pageLength)
  return {
    query: {
      queryText: searchResponse.qtext,
      pageLength: pageLength,
      page: page
    },
    response: {
      metadata: {
        executionTime: executionTime,
        total: searchResponse.total
      },
      results: searchResponse.results,
      facets: searchResponse.facets
    }
  }
}

// TODO: extract out to separate module that could alternatively
// be run inside MarkLogic itself
const buildMarklogicQuery = function(query) {
  let structuredQuery
  if (query.constraints) {
    const constraintQueries = Object.keys(query.constraints).map(
      constraintName => {
        const andValues = query.constraints[constraintName].and || []
        return queryBuilder.range(constraintName, andValues.map(c => c.name))
      }
    )
    structuredQuery = {
      queries: [
        {
          'and-query': {
            queries: constraintQueries
          }
        }
      ]
    }
  }
  return JSON.stringify({
    search: {
      qtext: query.queryText,
      query: structuredQuery
    }
  })
}

const processSearchError = error => error.errorResponse

router.post('/', (req, res) => {
  const query = req.body
  const start = query.pageLength * (query.page - 1) + 1
  getAuth(req).then(
    auth => {
      const httpOptions = {
        // TODO: hanging with SSL at the moment
        // protocol: options.httpsStrict ? 'https' : 'http',
        hostname: options.mlHost,
        port: options.mlHttpPort,
        path:
          '/v1/search?format=json&pageLength=' +
          query.pageLength +
          '&start=' +
          start +
          '&options=all', // TODO: make configurable and get from client
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          authorization: auth
        }
      }
      const mlRequest = http.request(httpOptions, mlResponse => {
        var mlSearchBody = ''
        mlResponse.on('data', chunk => {
          mlSearchBody += chunk
        })
        mlResponse.on('end', () => {
          mlSearchBody = JSON.parse(mlSearchBody)
          if (mlResponse.statusCode === 200) {
            res.json(processSearchResponse(mlSearchBody))
          } else {
            res
              .status(mlResponse.statusCode)
              .json(processSearchError(mlSearchBody))
          }
        })
      })

      mlRequest.on('error', e => {
        console.error(`problem with request: ${e.message}`)
        res.status(500).json({ errorResponse: e })
      })
      const builtQuery = buildMarklogicQuery(query)
      mlRequest.write(builtQuery)
      mlRequest.end()
    },
    error => {
      console.error('error authenticating search:', error);
      res.status(401).json({
        message: error
      })
    }
  )
})

module.exports = router
