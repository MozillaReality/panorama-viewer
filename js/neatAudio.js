;(function (exports) {

function requestSound(url) {
  return new Promise(
    function(resolve, reject) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      request.onload = function() {
        // It could be a successful response but not an OK one (e.g., 3xx, 4xx).
        if (request.status === 200) {
          resolve(request.response);
        } else {
          reject(new Error(request.statusText));
        }
      };
      request.onerror = function() {
        reject(new Error('Network Error'));
      };
      request.send();
    }
  );
}

/**
 * A simple Audio API for interacting with the young web audioContext
 * @type {{}}
 */
var NeatAudio = {

  audioContext: null,

  /**
   * Initialises neatAudio, paying special attention to the environment and if
   * it supports the AudioContext or not.
   * @param {{}} environment
   */
  init: function(environment) {
    var AudioContext = environment && environment.AudioContext ||
      environment && environment.webkitAudioContext ||
      null;

    if (!AudioContext) {
      throw 'AudioContext is not supported in this environment.';
    }

    this.audioContext = new AudioContext();
  },

  _decodeAudio: function(arrayBuffer) {
    var self = this;

    return new Promise(
      function(resolve) {
        self.audioContext.decodeAudioData(arrayBuffer, function(buffer) {
          resolve(buffer);
        }, function(err) {
          resolve(err);
        });
      }
    );
  },

  /**
   * Fetches a sound through XMLHttpRequest and then decodes it.
   * Returns a promise that resolves after decoding has completed.
   * @param url  the url of the audio clip you wish to fetch
   * @returns {Promise}
   */
  fetchSound: function(url) {
    var self = this;

    if (!self.audioContext) {
      throw 'No audioContext found, has neatAudio.init(environment) been called?';
    }

    return new Promise(
      function(resolve) {
        resolve(requestSound(url)
          .then(function(arrayBuffer) {
            return self._decodeAudio(arrayBuffer);
          })
        );
      }
    );
  },

  /**
   * Plays a decoded audio buffer
   * @param buffer  the buffer you wish to play
   */
  playSound: function(buffer) {

    if (!this.audioContext) {
      throw 'No audioContext found, has neatAudio.init(environment) been called?';
    }

    var source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

};

exports.NeatAudio = NeatAudio;

})(window);
