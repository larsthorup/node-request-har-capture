const request = require('request-promise');
const fs = require('fs');
const pkg = require('./package.json');

let harEntries = [];

function buildHarHeaders (headers) {
  return headers
    ? Object.keys(headers).map(function (key) {
      return {
        name: key,
        value: headers[key]
      };
    })
    : [];
}

function buildPostData (body) {
  return body
    ? {
        mimeType: 'application/json',
        text: body
      }
    : null;
}

function buildHarEntry (response) {
  const startTime = response.request.startTime;
  const endTime = Date.now();
  const entry = {
    startedDateTime: new Date(startTime).toISOString(),
    time: endTime - startTime,
    request: {
      method: response.request.method,
      url: response.request.uri,
      httpVersion: 'HTTP/' + response.httpVersion,
      cookies: [],
      headers: buildHarHeaders(response.request.headers),
      queryString: [],
      postData: buildPostData(response.request.body),
      headersSize: -1,
      bodySize: -1
    },
    response: {
      status: response.statusCode,
      statusText: response.statusMessage,
      httpVersion: 'HTTP/' + response.httpVersion,
      cookies: [],
      headers: buildHarHeaders(response.headers),
      content: {
        size: response.body.length,
        mimeType: response.headers['content-type'],
        text: response.body
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1
    },
    cache: {},
    timings: {
      send: -1,
      receive: -1,
      wait: endTime - startTime
    }
  };
  return entry;
}

function requestHarCapture (options) {
  Object.assign(options, {
    resolveWithFullResponse: true,
    simple: false,
    startTime: Date.now()
  });
  return requestHarCapture.request(options).then(function (response) {
    harEntries.push(buildHarEntry(response));
    return response;
  });
}

requestHarCapture.request = request;

requestHarCapture.saveHar = function (fileName) {
  const httpArchive = {
    log: {
      version: '1.2',
      creator: { name: 'request-har-capture', version: pkg.version },
      entries: harEntries
    }
  };
  fs.writeFileSync(fileName, JSON.stringify(httpArchive, null, 2));
};

requestHarCapture.clear = function () {
  harEntries = [];
};

module.exports = requestHarCapture;
