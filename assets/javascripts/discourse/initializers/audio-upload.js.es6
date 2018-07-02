import { withPluginApi } from 'discourse/lib/plugin-api';
import { onToolbarCreate } from 'discourse/components/d-editor';
import Composer from 'discourse/components/d-editor';
import showModal from 'discourse/lib/show-modal';

function initializePlugin(api)
{
  const siteSettings = api.container.lookup('site-settings:main');

  if (siteSettings.composer_voice_record_enabled) {
    Composer.reopen({
      actions: {
        showVoiceRecordModal: function () {
          showModal('voice_record', { title: 'composer_voice_record.title' });
        }
      }
    });

    api.onToolbarCreate(toolbar => {
      toolbar.addButton({
        id: 'composer_voice_record',
        group: 'extras',
        icon: 'microphone',
        action: 'showVoiceRecordModal'
      });
    });
  }
}

export default
{
  name: 'composer-voice-record',

  initialize(container)
  {
    withPluginApi('0.1', initializePlugin);
  }
};
