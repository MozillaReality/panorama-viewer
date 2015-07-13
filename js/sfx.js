;(function (exports) {

var utils = {
  unique: function (list) {
    // Removes duplicates from an array.

    if (!Array.isArray(list)) {
      return list;
    }

    var ret = [];

    list.forEach(function (item) {
      if (ret.indexOf(item) === -1) {
        ret.push(item);
      }
    });

    return ret;
  },
  without: function (obj, blacklist) {
    var ret = Object.create(obj);
    (blacklist || []).forEach(function (key) {
      delete ret[key];
    })
  }
}

// Monkey-patch `NeatAudio.playSound` to return the `source`.
NeatAudio.playSound = function (buffer, opts) {
  if (!this.audioContext) {
    throw 'No audioContext found, has neatAudio.init(environment) been called?';
  }

  var source = this.audioContext.createBufferSource();
  source.buffer = buffer;
  Object.keys(opts || {}).forEach(function (opt) {
    source[opt] = opts[opt];
  });

  source.connect(this.audioContext.destination);
  source.start(0);

  this.source = source;

  return Promise.resolve(this.source);
};

var sfx = {
  init: function (win) {
    NeatAudio.init(win || window);
  },
  _play: function (fn, opts) {
    opts = opts || {};
    if (typeof opts.force === 'undefined') {
      opts.force = false;
    }
    fn = fn || opts.src || opts.fn;

    if (!fn) {
      throw 'Filename required for `sfx.play`.';
    }

    return new Promise(function (resolve, reject) {
      if (!opts.force && sfx.current && fn === sfx.current.fn) {
        // This sound is already playing.
        return Promise.resolve(sfx.source);
      }

      if (sfx.current) {
        sfx.pauseCurrent();
      }

      var setCurrent = function (source) {
        return sfx.setCurrent(fn, source);
      };

      // Send only the properties we care about.
      var props = utils.without(opts, ['fn', 'force', 'src']);

      if (fn in sfx.sounds) {
        return NeatAudio.playSound(sfx.sounds[fn], props).then(resolve, reject);
      } else {
        return sfx.fetch(fn).then(function (sound) {
          return NeatAudio.playSound(sound, props).then(resolve, reject);
        });
      }
    });
  },
  play: function (fn, opts) {
    return this._play(fn, opts).then(function (sound) {
      sfx.setCurrent(fn, sound);
      return sound;
    });
  },
  setCurrent: function (fn, source) {
    sfx.current = {fn: fn, source: source};
    // console.log('Set current audio source: %s', sfx.current);
  },
  pauseCurrent: function () {
    sfx.current.source.stop(0);
    // console.log('Paused current audio source: %s', sfx.current.fn);
    return Promise.resolve(sfx.current.fn);
  },
  fetch: function (fn) {
    if (fn in sfx.sounds) {
      return Promise.resolve(sfx.sounds[fn]);
    }

    return NeatAudio.fetchSound(fn).then(function (sound) {
      sfx.sounds[fn] = sound;
      // console.log('Fetched audio: %s', fn);
      return sound;
    });
  },
  preload: function (fns) {
    return Promise.all(utils.unique(fns).map(sfx.fetch));
  },
  sounds: {}
};

exports.sfx = sfx;

})(window);
