import ModalFunctionality from 'discourse/mixins/modal-functionality';
import {
  default as computed,
  observes
} from "ember-addons/ember-computed-decorators";


function padStart(s, l, char) {
  let n = l - String(s).length;
  for(let i = 0; i < n; ++i) s = char + s;
  return s;
}


export default Ember.Controller.extend(ModalFunctionality, {
  state: 'idle', // 'idle', 'recording', 'playing'
  isRecording: Ember.computed.equal('state', 'recording'),
  isPlaying: Ember.computed.equal('state', 'playing'),
  isIdle: Ember.computed.equal('state', 'idle'),
  hasRecording: Ember.computed.notEmpty('_audioEl'),

  @computed('state', 'hasRecording')
  disallowPlayback(state, hasRecording) {
    return state == 'recording' || !hasRecording;
  },

  @computed('_audioEl')
  recordingDuration(audio) {
    if(audio) {
      let d = moment.duration(audio.duration * 1000);
      return Math.floor(d.asMinutes()) + ':' + padStart(d.seconds(), 2, '0');
    }
    return '-';
  },

  @computed('_audioData')
  recordingSize(data) {
    if(data) {
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


  _clearRecording: function() {
    this._recorder = null;
    this.set('_audioData', null);
    if(this._audioEl) {
      this._audioEl.remove();
      this.set('_audioEl', null);
    }
  },

  init: function() {
    this._super();
  },

  onShow: function() {
    this._clearRecording();
  },

  actions: {
    uploadFile: function() {
      if(!this._audioData) {
        this.flash('You have to record something!', 'error');
        return;
      }

      let $dialog = $('.composer-audio-upload-modal');

      $('.wmd-controls').fileupload('add', { files: [this._audioData] });
      //$('.wmd-controls').fileupload('add', { fileInput: $dialog.find('.files-input') });
      this.send('closeModal');
    },

    startStopRecording: function() {
      if(this.state == 'idle') {
        this._clearRecording();

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
          this._recorder = RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/webm',
            audioBitsPerSecond: 44100,
          });

          this._recorder.startRecording();
          this.set('state', 'recording');
        })
        .catch((err) => {
          console.error(err);
        });

      } else if(this.state == 'recording') {

        this._recorder.stopRecording((url) => {
          let blob = this._recorder.getBlob();
          blob.name = 'recording.wav';
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

          audio.src = url;

        });

      }
    },

    startStopPlayback: function() {
      if(this.state == 'idle') {

        let audio = this._audioEl;

        audio.currentTime = 0;

        let promise = audio.play();
        if(promise && promise.then) {
          promise.then(() => { this.set('state', 'playing'); });
        } else {
          this.set('state', 'playing');
        }

      } else if(this.state == 'playing') {

        this._audioEl.pause();
        this.set('state', 'idle');

      }
    },


  }
});
