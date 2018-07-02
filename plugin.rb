# name: discourse-voice-record
# about: Makes it possible to record & upload audio recordings from Composer
# version: 0.0.1
# authors: devsti.me for english.best

enabled_site_setting :composer_voice_record_enabled

# register_asset 'javascripts/vendor/RecordRTC.js'

register_html_builder('server:before-head-close') do
  '<script src="/plugins/discourse-voice-record/javascripts/vendor/RecordRTC.min.js"></script>'
end
