/*
 * Author:    Edward
 * Created:   Dec 06, 2016
 *
 * Component: Popup
 *
 * (c) Copyright by Pomato
 **/

'use strict';

var Popup = function() {
  this.isUserLoggedIn = false;

  this.userData = null;
  this.localFilename = '';
  this.remoteFilename = '';

  this.status = {
    NONE: 0,
    EXTRACTING: 10,
    DOWNLOADING: 20,
    UPLOADING: 50,
    COMPLETE: 100,
    FAILED: -1,
    WAITING_USER_CONFIRMATION: -99
  };

  this.setProgress(this.status.NONE);

  this.uploadHistory = {};
};

Popup.prototype.run = function() {
  $(document).ready(function() {
    console.log('[Pomato Plugin Background] is requesting for the User Data.');

    chrome.runtime.sendMessage({ action: App.message_actions.GET_USER_DATA });

    chrome.runtime.onMessage.addListener(this.listenMessage.bind(this));

    $('a.uploadhistory_toggle span').click(function() {
      this.updateUploadHistory(null);
      
      chrome.runtime.sendMessage({ action: App.message_actions.CLEAN_HISTORY });
    }.bind(this));
  }.bind(this));
};

//show/hide the login form based on the user data from the background.js
Popup.prototype.setUserLogin = function(bLoggedIn) {
  if (bLoggedIn) {
    this.isUserLoggedIn = true;
    $('#login_container').toggleClass('hidden', true);
    $('#message_container').toggleClass('hidden', false);

    console.log('[Pomato Plugin Popup] current Progress:', this.progress);

    if (this.progress === this.status.NONE) {
      console.log('[Pomato Plugin Popup] is trying to extract the Resume File')
      this.setProgress(this.status.EXTRACTING);

      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: App.message_actions.EXTRACT_RESUME_REMOTEFILE });
      }.bind(this));
    }
  } else {
    this.isUserLoggedIn = false;
    $('#login_container a').attr('href', App.domain + 'race-ui/index.html');
    $('#login_container').toggleClass('hidden', false);
    $('#message_container').toggleClass('hidden', true);
  }
};

//show/hide the loading spinner based on the flag
Popup.prototype.showLoadingSpinner = function(bShow) {
  if (bShow)
    $('#spinner_container').show();
  else
    $('#spinner_container').hide();
};

// Popup.prototype.downloadResume = function(strResumeURL) {
//   if (strResumeURL) {
//     this.setProgress(this.status.DOWNLOADING);

//     this.remoteFilename = strResumeURL;

//     chrome.downloads.download({ url: strResumeURL }, function(id) {
//       this.downloadId = id;
//     }.bind(this));

//     chrome.downloads.onChanged.addListener(function(data) {
//       if (data.hasOwnProperty('filename'))
//         this.localFilename = data.filename.current;
//       if (data.hasOwnProperty('state') && data.state.current === 'complete')
//         this.uploadResume();
//     }.bind(this));
//   } else {
//     this.setProgress(this.status.FAILED, 'Failed to get the Resume Link.');
//   }
// };

// Popup.prototype.uploadResume = function() {

//   if (this.localFilename) {
//     this.setProgress(this.status.UPLOADING);

//     var nPos = this.localFilename.lastIndexOf('/');
//     if (nPos == -1)
//       nPos = this.localFilename.lastIndexOf('\\');
//     var strFilename = this.localFilename.substring(nPos + 1);

//     chrome.runtime.sendMessage({
//       action: App.message_actions.UPLOAD_RESUME,
//       data: {
//         remoteUrl: this.remoteFilename,
//         filename: strFilename
//       }
//     });
//   } else {
//     this.setProgress(this.status.FAILED, 'Failed to download the Resume.');
//   }
// }

Popup.prototype.setProgress = function(value, message) {
  this.progress = value;

  if (value == this.status.WAITING_USER_CONFIRMATION) {
    $('#message_container p').toggleClass('error', false);

    $('#message_container p').html('You have already uploaded the current resume. <a id="upload_again" href="#">Upload again.</a>');

    $('#upload_again').click(function() {
      chrome.runtime.sendMessage({ action: App.message_actions.FORCE_UPLOAD_RESUME, data: this.remoteFilename });
    }.bind(this));
  } else if (value != this.status.FAILED) {
    $('#message_container p').toggleClass('error', false);

    switch (value) {
      case this.status.NONE:
        message = 'Checking the validity of the current page...';
        break;
      case this.status.EXTRACTING:
        message = 'Extracting the resume URL...';
        break;
      case this.status.DOWNLOADING:
        message = 'Downloading the resume...';
        break;
      case this.status.UPLOADING:
        message = 'Uploading the resume (' + this.localFilename + ')';
        break;
      case this.status.COMPLETE:
        message = 'Successfully uploaded the resume.';
        break;
    }

    $('#message_container p').html(message);
  } else {
    $('#message_container p').toggleClass('error', true);
    $('#message_container p').html(message || 'Unknown Error!');

    // setTimeout(function() {
    //  window.close();
    // }, 3000);
  }
};

Popup.prototype.updateUploadHistory = function(uploadHistory) {
  /**
    DATA SCHEMA OF uploadHistory
    {
      *RESUME_ID*: {
        filename: *FILENAME*,
        remoteUrl: *REMOTE_URL*,
        uploadedAt: *UPLOADED_AT*
      },
      *RESUME_ID*: {
        filename: *FILENAME*,
        remoteUrl: *REMOTE_URL*,
        uploadedAt: *UPLOADED_AT*
      }
      ...
    }
  **/

  console.log('[Pomato Plugin Popup] has received a upload history', uploadHistory);

  var bHasAnyUploadHistory = false;
  if (uploadHistory) {
    var html = '';
    for (var resumeId in uploadHistory) {
      bHasAnyUploadHistory = true;

      html += '<p><a target="_blank" href="' + App.domain + 'race-ui/choose-skills/' + resumeId + '">' + uploadHistory[resumeId].filename + '</a></p>';
    }

    $('#uploadhistory_content').html(html);
  } else {
    $('#uploadhistory_content').html('');
  }

  $('#uploadhistory_container').toggleClass('hidden', !bHasAnyUploadHistory)
}

//listen for the message from the background.js
Popup.prototype.listenMessage = function(message, sender, sendResponse) {
  console.log('[Pomato Plugin Popup] received a message.', message);

  switch (message.action) {
    //This is fired by Backend process.
    case App.message_actions.USER_DATA:
      this.showLoadingSpinner(false);

      this.userData = message.data;
      this.updateUploadHistory(message.uploadHistory);
      if (!this.userData)
        this.setUserLogin(false);
      else
        this.setUserLogin(true);
      break;

      //This is fired by Content Script with the remote URL of the resume
    case App.message_actions.RESUME_REMOTEFILE:
      if (message.data) {
        this.remoteFilename = message.data;
        this.setProgress(this.status.DOWNLOADING);
      } else {
        this.setProgress(this.status.FAILED, 'Failed to extract the resume link in the current page.');
      }
      break;

      //This is fired by Backend process with the filename of the resume
    case App.message_actions.RESUME_FILENAME:
      if (message.filename) {
        this.localFilename = message.filename;
        this.setProgress(this.status.UPLOADING);
      } else {
        this.setProgress(this.status.FAILED, 'Couldn\'t find the resume in the current page.');
      }
      break;

      //This is fired by Backend process with the upload result
    case App.message_actions.UPLOAD_RESULT:
      if (message.success && message.resumeId) {
        this.updateUploadHistory(message.uploadHistory);
        this.setProgress(this.status.COMPLETE);
      } else {
        this.setProgress(this.status.FAILED, 'Failed to upload the resume.');
      }
      break;

      //This is fired by Backend process when the resume has already been uploaded before.
    case App.message_actions.RESUME_ALREADY_UPLOADED:
      this.setProgress(this.status.WAITING_USER_CONFIRMATION);
      break;

    case App.message_actions.TEST:
      console.log('test message', message.data);
      break;
  }
};

var app = new Popup();
app.run();
