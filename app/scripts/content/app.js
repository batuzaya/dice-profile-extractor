/*
 * Author:    Edward
 * Created:   Dec 07, 2016
 *
 * Component: Content Scripts
 *
 * (c) Copyright by Pomato
 **/

var ContentScript = function() {};

// Determine the Site
ContentScript.prototype.run = function() {
  var url = window.location.href;

  console.log('[Pomato Plugin Content Script] is looking at ', url);

  this.page = this.getPageInstance(this.getSite(url));

  $(document).ready(function() {
    console.log('[Pomato Plugin Content Script] is listening for the message.');
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
}

ContentScript.prototype.getPageInstance = function(site) {
  try {
    switch (site) {
      case 'dice':
        return new DicePage();
        break;
      case 'monster':
        return new MonsterPage();
        break;
      case 'indeed':
        return new IndeedPage();
        break;
    }
  } catch (e) {
    return null;
  }
}

ContentScript.prototype.listenMessage = function(message, sender, sendResponse) {
  console.log('[Pomato Plugin Content Script] received a message.', message);

  if (this.page && this.page.isValidPage()) {
    //Page is valid. Now listens for the message from the Popup.

    switch (message.action) {
      case App.message_actions.EXTRACT_RESUME_REMOTEFILE:
        console.log('[Pomato Plugin Content Script] is extracting the Resume URL.');

        var strResumeURL = this.page.extractResumeFile();

        console.log('[Pomato Plugin Content Script] is sending back the Resume URL.', strResumeURL);
        chrome.runtime.sendMessage({ action: App.message_actions.RESUME_REMOTEFILE, data: strResumeURL });
        break;
    }
  } else {
    //Page is not valid.
    console.log('[Pomato Plugin Content Script] could not find the valid page.');
    chrome.runtime.sendMessage({ action: App.message_actions.RESUME_REMOTEFILE, data: null });
  }
};

var app = new ContentScript();
app.run();
