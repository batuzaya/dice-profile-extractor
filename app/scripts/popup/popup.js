/*
 * Author:    Edward
 * Created:   Dec 06, 2016
 *
 * Component: Popup
 *
 * (c) Copyright by Alltech
 **/

'use strict';

var Popup = function() {
  this.isUserLoggedIn = false;

  this.userData = null;
  this.localFilename = '';
  // this.remoteFilename = '';
  this.objProfileInfo = null;
  this.resumeFilepath = null;
  this.resumeFilename = '';

  this.status = {
    NONE: 0,
    EXTRACTING: 10,
    DOWNLOADING: 20,
    READY: 30,
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
    console.log('[Alltech Plugin Popup] is requesting for the User Data.');

    chrome.runtime.sendMessage({ action: App.message_actions.GET_USER_DATA });

    chrome.runtime.onMessage.addListener(this.listenMessage.bind(this));

    $('a.uploadhistory_toggle span').click(function() {
      this.updateUploadHistory(null);

      chrome.runtime.sendMessage({ action: App.message_actions.CLEAN_HISTORY });
    }.bind(this));

    typeof $.typeahead === 'function' && $.typeahead({
      input: '.js-typeahead-jobs',
      minLength: 1,
      maxItem: 8,
      maxItemPerGroup: 6,
      order: 'asc',
      hint: true,
      searchOnFocus: true,
      blurOnTab: false,
      matcher: function(item, displayKey) {
        if (item.id === 'BOS') {
          // Disable Boston for X reason
          item.disabled = true;
        }
        // Add all items matched items
        return true;
      },
      multiselect: {
        limit: 10,
        limitTemplate: 'You can\'t select more than 10 jobs',
        matchOn: ['id'],
        cancelOnBackspace: true,
        data: function() {

          var deferred = $.Deferred();

          // setTimeout(function() {
          //   deferred.resolve([{
          //     "matchedKey": "title",
          //     "title": "Javascript"
          //     "group": "jobs"
          //   }]);
          // }, 2000);

          deferred.always(function() {
            console.log('data loaded from promise');
          });

          return deferred;
        },
        callback: {
          onClick: function(node, item, event) {
            console.log(item);
          },
          onCancel: function(node, item, event) {
            console.log(item);
          }
        }
      },
      templateValue: '{{id}} - {{title}}',
      display: ['id', 'title'],
      emptyTemplate: 'no result for {{query}}',
      source: {
        jobs: {
          url: App.domain + App.serviceURL
        }
      },
      callback: {
        // onClick: function(node, a, item, event) {
        //   console.log(item.title + ' Added!')
        // },
        onSubmit: function(node, form, items, event) {
          event.preventDefault();

          this.objProfileInfo.jobIds = items.map(function(item) {
            return item.id
          }).join(',');

          chrome.runtime.sendMessage({
            action: App.message_actions.UPLOAD_RESUME,
            data: this.objProfileInfo,
            filepath: this.resumeFilepath,
            filename: this.resumeFilename
          });

          this.setProgress(this.status.UPLOADING);
        }.bind(this)
      },
      debug: false
    });
  }.bind(this));
};

//show/hide the login form based on the user data from the background.js
Popup.prototype.setUserLogin = function(bLoggedIn) {
  if (bLoggedIn) {
    this.isUserLoggedIn = true;
    $('#login_container').toggleClass('hidden', true);
    $('#message_container').toggleClass('hidden', false);
    $('#searchbox_container').toggleClass('hidden', false);
    $('#jobs_container').toggleClass('hidden', false);

    console.log('[Alltech Plugin Popup] current Progress:', this.progress);

    if (this.progress === this.status.NONE) {
      console.log('[Alltech Plugin Popup] is trying to extract the Profile Info')
      this.setProgress(this.status.EXTRACTING);

      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: App.message_actions.EXTRACT_PROFILE_INFO });
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

  if (!$('.typeahead__button button').prop('disabled')) {
    $('.typeahead__button button').prop('disabled', true);
  }

  if (value == this.status.WAITING_USER_CONFIRMATION) {
    $('#message_container p').toggleClass('error', false);

    $('#message_container p').html('You have already uploaded the current resume. <a id="upload_again" href="#">Upload again.</a>');

    $('#upload_again').click(function() {
      // chrome.runtime.sendMessage({ action: App.message_actions.FORCE_READ_RESUME, data: this.objProfileInfo });
    }.bind(this));
  } else if (value != this.status.FAILED) {
    $('#message_container p').toggleClass('error', false);

    switch (value) {
      case this.status.NONE:
        message = 'Checking the validity of the current page...';
        break;
      case this.status.EXTRACTING:
        message = 'Extracting the profile info...';
        break;
      case this.status.DOWNLOADING:
        message = 'Reading the resume...';
        break;
      case this.status.UPLOADING:
        message = 'Uploading resume (' + this.resumeFilename + ')';
        $('#searchbox_container').toggleClass('hidden', true);
        break;
      case this.status.COMPLETE:
        message = 'Successfully uploaded the resume.';
        setTimeout(function() {
          window.close();
        }, 1000);
        break;
      case this.status.READY:
        $('.typeahead__button button').prop('disabled', false);
      default:
        message = '';
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

  console.log('[Alltech Plugin Popup] has received a upload history', uploadHistory);

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
  console.log('[Alltech Plugin Popup] received a message.', message);

  switch (message.action) {
    case App.message_actions.USER_DATA: //This is fired by Backend process.
      this.showLoadingSpinner(false);

      this.userData = message.data;
      this.updateUploadHistory(message.uploadHistory);
      this.setUserLogin(!!this.userData);
      break;

    case App.message_actions.PROFILE_INFO: //This is fired by Content Script after extracting the profile info
      if (message.data) {
        this.objProfileInfo = message.data;
        this.setProgress(this.status.DOWNLOADING);
      } else {
        this.setProgress(this.status.FAILED, 'Failed to extract the profile in the current page.');
      }
      break;

    case App.message_actions.RESUME_FILEPATH: //This is fired by Backend process with the blob data of the resume
      if (message.data) {
        this.resumeFilepath = message.data.filepath;
        this.resumeFilename = message.data.filename;
        this.setProgress(this.status.READY);
      } else {
        this.setProgress(this.status.FAILED, 'Couldn\'t find the resume in the current page.');
      }
      break;

    case App.message_actions.UPLOAD_RESULT: //This is fired by Backend process with the upload result
      if (message.success) {
        this.updateUploadHistory(message.uploadHistory);
        this.setProgress(this.status.COMPLETE);
      } else {
        this.setProgress(this.status.FAILED, 'Failed to upload the resume.');
      }
      break;

    case App.message_actions.RESUME_ALREADY_DOWNLOADED: //This is fired by Backend process when the resume has already been downloaded before.
      this.setProgress(this.status.WAITING_USER_CONFIRMATION);
      break;

    case App.message_actions.TEST:
      console.log('test message', message.data);
      break;
  }
};

var app = new Popup();
app.run();