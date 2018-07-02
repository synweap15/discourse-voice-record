import ModalFunctionality from 'discourse/mixins/modal-functionality';
import {
  default as computed,
  observes
} from "ember-addons/ember-computed-decorators";

import {
  uploadIcon
} from 'discourse/lib/utilities';


function padStart(s, l, char) {
  let n = l - String(s).length;
  for (let i = 0; i < n; ++i) s = char + s;
  return s;
}


export default Ember.Controller.extend(ModalFunctionality, {
  state: 'idle', // 'idle', 'recording', 'playing', 'processing'
  isRecording: Ember.computed.equal('state', 'recording'),
  isPlaying: Ember.computed.equal('state', 'playing'),
  isProcessing: Ember.computed.equal('state', 'processing'),
  isIdle: Ember.computed.equal('state', 'idle'),
  hasRecording: Ember.computed.notEmpty('_audioEl'),

  @computed('state', 'hasRecording')
  disallowPlayback(state, hasRecording) {
    return state != 'idle' && state != 'playing' || !hasRecording;
  },

  @computed('state')
  disallowRecord(state) {
    return state != 'idle' && state != 'recording';
  },

  @computed('_audioEl')
  recordingDuration(audio) {
    if (audio) {
      let d = moment.duration(audio.duration * 1000);
      return Math.floor(d.asMinutes()) + ':' + padStart(d.seconds(), 2, '0');
    }
    return '-';
  },

  @computed('_audioData')
  recordingSize(data) {
    if (data) {
      let bytes = data.size;
      return (bytes < 1024)
        ? bytes + ' B'
        : (Math.round(bytes * 10 / 1024) / 10) + ' kB';
    }
    return '-';
  },

  _recorder: null,
  _audioData: null,
  _audioEl: null,

  @computed() uploadIcon: () => uploadIcon(),

  _clearRecording: function () {
    this._recorder = null;
    this.set('_audioData', null);
    if (this._audioEl) {
      this._audioEl.remove();
      this.set('_audioEl', null);
    }
  },

  init: function () {
    this._super();
  },

  onShow: function () {
    this._clearRecording();
  },

  actions: {
    uploadFile: function () {
      if (!this._audioData) {
        this.flash('You have to record something!', 'error');
        return;
      }

      let $dialog = $('.composer-audio-upload-modal');

      $('.wmd-controls').fileupload('add', {files: [this._audioData]});
      this.send('closeModal');
    },

    startStopRecording: function () {
      if (this.state == 'idle') {
        this._clearRecording();

        this._recorder = new Microm();
        this._recorder.record()
        .then(() => {
          this.set('state', 'recording');
        }).catch((err) => {
          this.flash('An error occured. Did you enable voice recording in your browser?');
          console.error(err);
        });


      } else if (this.state == 'recording') {

        this.set('state', 'processing');

        this._recorder.stop()
        .then((result) => {
          let blob = result.blob;
          blob.name = 'recording.mp3';
          blob.lastModifiedDate = new Date();

          let audio = document.createElement('audio');
          audio.style.display = 'none';

          $(audio).on('ended', () => {
            this.set('state', 'idle');
          })
          .one('timeupdate', () => {
            audio.currentTime = 0;
            this.set('_audioEl', audio);
            this.set('_audioData', blob);
            this.set('state', 'idle');
          })
          .on('loadedmetadata', () => {
            audio.currentTime = 48 * 3600;
          });

          audio.src = result.url;
        });
      }
    },

    startStopPlayback: function () {
      if (this.state == 'idle') {

        let audio = this._audioEl;

        audio.currentTime = 0;

        let promise = audio.play();
        if (promise && promise.then) {
          promise.then(() => {
            this.set('state', 'playing');
          })
          .catch((err) => { console.error(err); });

        } else {
          this.set('state', 'playing');
        }

      } else if (this.state == 'playing') {

        this._audioEl.pause();
        this.set('state', 'idle');

      }
    },


  }
});
