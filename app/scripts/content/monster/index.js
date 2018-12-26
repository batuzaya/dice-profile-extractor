/*
 * Author:    Edward
 * Created:   Dec 10, 2016
 *
 * Component: Content Scripts
 *
 * (c) Copyright by Alltech
 **/

var MonsterPage = function() {

}

MonsterPage.prototype.isValidPage = function() {
  return true;
}

MonsterPage.prototype.extractResumeFile = function() {
	var element =  $('a.at-actionDownloadPdfLink');

	if (!element || !element.length) {
		element = $('a.at-actionDownloadWordLink');
	}

	if (!element || !element.length) {
		return '';
	}

	console.log('[Alltech Plugin Content Script] Resume Link:', element.attr('href'));

	return 'http://hiring.monster.com' + element.attr('href');
}