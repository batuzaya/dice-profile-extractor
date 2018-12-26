/*
 * Author:    Edward
 * Created:   Dec 07, 2016
 *
 * Component: Content Scripts
 *
 * (c) Copyright by Alltech
 **/

var ContentScript = function() {};

// Determine the Site
ContentScript.prototype.run = function() {
  var url = window.location.href;

  console.log('[Alltech Plugin Content Script] is looking at ', url);

  this.page = this.getPageInstance(this.getSite(url));

  $(document).ready(function() {
    console.log('[Alltech Plugin Content Script] is listening for the message.');
    chrome.runtime.onMessage.addListener(this.listenMessage.bind(this));
  }.bind(this));
}

ContentScript.prototype.getSite = function(url) {
  if (url.indexOf('dice.com') !== -1) {
    return 'dice';
  } else if (url.indexOf('monster.com') !== -1) {
    return 'monster';
  } else if (url.indexOf('indeed.com') !== -1) {
    return 'indeed';
  }

  return '';
}

ContentScript.prototype.getPageInstance = function(site) {
  try {
    switch (site) {
      case 'monster':
        return new MonsterPage();
        break;
      case 'indeed':
        return new IndeedPage();
        break;
      case 'dice':
      default:
        return new DicePage();
        break;
    }
  } catch (e) {
    return null;
  }
}

ContentScript.prototype.listenMessage = function(message, sender, sendResponse) {
  console.log('[Alltech Plugin Content Script] received a message.', message);

  if (this.page && this.page.isValidPage()) {
    //Page is valid. Now listens for the message from the Popup.

    switch (message.action) {
      case App.message_actions.EXTRACT_PROFILE_INFO:
        console.log('[Alltech Plugin Content Script] is extracting the Profile Info.');

        this.page.extractResumeInfo().then(function(objResumeInfo) {
          console.log('[Alltech Plugin Content Script] is broadcasting Profile Info.', objResumeInfo);
          chrome.runtime.sendMessage({ action: App.message_actions.PROFILE_INFO, data: objResumeInfo });
        });

        break;

      case App.message_actions.DOWNLOAD_RESUME:
        console.log('[Alltech Plugin Content Script] is downloading the resume.');

        this.page.downloadResume().then(function(bDownloaded) {
          if (bDownloaded) {
            console.log('[Alltech Plugin Content Script] is requesting to read downloaded resume.', message.data);
            chrome.runtime.sendMessage({ action: App.message_actions.FORCE_UPLOAD_RESUME, data: message.data });
          } else {
            console.error('[Alltech Plugin Content Script] failed to read downloaded resume.');
            chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: null });
          }
        });

        break;
    }
  } else {
    //Page is not valid.
    console.log('[Alltech Plugin Content Script] could not find the valid page.', this.page);
    chrome.runtime.sendMessage({ action: App.message_actions.PROFILE_INFO, data: null });
  }
};

var app = new ContentScript();
app.run();