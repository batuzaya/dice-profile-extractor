var App = App || {};

// App.domain = 'http://localhost:8080/';
App.domain = 'https://dev-sourcing.alltechconsultinginc.com';
// App.domain = 'https://sourcing.alltechconsultinginc.com';
App.serviceURL = '/es-indexer/chromeext';
// App.credentials = 'raceuser:Fw#e1r2tdgYD$vd!w';

//Actions for Runtime Messages
App.message_actions = {
  //Popup -> Background
  'GET_USER_DATA': 'GET_USER_DATA',
  'CLEAN_HISTORY': 'CLEAN_HISTORY',
  // 'FORCE_READ_RESUME': 'FORCE_READ_RESUME',
  'UPLOAD_RESUME': 'UPLOAD_RESUME',

  //Background -> Popup
  'USER_DATA': 'USER_DATA',
  'RESUME_FILEPATH': 'RESUME_FILEPATH',
  'UPLOAD_RESULT': 'UPLOAD_RESULT',
  'RESUME_ALREADY_DOWNLOADED': 'RESUME_ALREADY_DOWNLOADED',

  //Popup -> ContentScript
  'EXTRACT_PROFILE_INFO': 'EXTRACT_PROFILE_INFO',

  //ContentScript -> Popup, Background
  'PROFILE_INFO': 'PROFILE_INFO',

  //Background -> ContentScript
  'DOWNLOAD_RESUME': 'DOWNLOAD_RESUME',

  'TEST': 'TEST'
};
