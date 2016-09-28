/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Institute of Information Systems, Hof, Germany.
 *
 * @author Christian Ochsenkühn <christian.ochsenkuehn@iisys.de>
 */
 
define('de.iisys.ox.camunda-email-workflows/config', [

], function () {

	var config = {
//	    'CAMUNDA_URL': 'https://10.90.43.52:8448/engine-rest',
		'CAMUNDA_URL': 'https://broton.sc-hub.de/engine-rest',
		'CAMUNDA_KEY_STARTING_WITH': 'ox-',
		'PROCESS_VAR_MAIL_CID_NAME': 'mailCid',
		'PROCESS_VAR_MAIL_CONTENT_NAME': 'mailContent'
	};

	return config;
});