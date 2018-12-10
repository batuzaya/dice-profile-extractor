/*
 * Author:    Edward
 * Created:   Dec 08, 2016
 *
 * Component: Content Scripts
 *
 * (c) Copyright by Pomato
 **/

if (console.log) console.log('[Pomato Chrome Plugin] is installed..');

var manifest = chrome.runtime.getManifest();

if (document.getElementById('extension_installed')) {
	if (console.log) console.log('[Pomato Chrome Plugin] found an install link and writing the current installed version.', manifest.version);
  document.getElementById('extension_installed').setAttribute('installed-version', manifest.version);

  if (console.log) console.log('[Pomato Chrome Plugin] is reading the latest version');
  var latestVersion = document.getElementById('extension_installed').getAttribute('latest-version');

  if (!latestVersion || latestVersion === manifest.version) {
  	if (console.log) console.log('[Pomato Chrome Plugin] is removing the install link');
  	document.getElementById('extension_installed').style.display = 'none';
  } else {
  	if (console.log) console.log('[Pomato Chrome Plugin] does not match the latest version.');
  	document.getElementById('extension_installed').innerHTML = document.getElementById('extension_installed').innerHTML.replace(/install/i, 'Update');
  }
}
