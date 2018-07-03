import { withPluginApi } from 'discourse/lib/plugin-api';
import { onToolbarCreate } from 'discourse/components/d-editor';
import Composer from 'discourse/components/d-editor';
import showModal from 'discourse/lib/show-modal';

function initializePlugin(api)
{
  const siteSettings = api.container.lookup('site-settings:main');

  if (siteSettings.composer_audio_upload_enabled) {
    Composer.reopen({
      actions: {
        showAudioUploadModal: function () {
          showModal('audio_upload', { title: 'composer_audio_upload.title' });
        }
      }
    });

    api.onToolbarCreate(toolbar => {
      toolbar.addButton({
        id: 'composer_audio_upload',
        group: 'extras',
        icon: 'microphone',
        action: 'showAudioUploadModal',
        title: 'composer.composer_audio_upload_button_title'
      });
    });
  }
}

export default
{
  name: 'composer-audio-upload',

  initialize(container)
  {
    withPluginApi('0.1', initializePlugin);
  }
};
